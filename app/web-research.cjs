// Public, read-only research fallback; no account, cookies, keys or executable downloads.
const dns=require('node:dns/promises'),net=require('node:net');
const SEARCH_LIMITS=Object.freeze({totalMs:19000,attemptMs:8500,results:6,candidates:30});
const READ_LIMITS=Object.freeze({timeoutMs:8000,bytes:1500000,textCharacters:24000});
const sourceError=(code,message,details={})=>Object.assign(Error(message),{code:'research_source_'+code,...details});
function abortable(promise,signal){
 if(!signal)return promise;if(signal.aborted){void Promise.resolve(promise).catch(()=>{});return Promise.reject(signal.reason||Object.assign(Error('Поиск отменён'),{name:'AbortError'}));}
 return new Promise((resolve,reject)=>{const abort=()=>{signal.removeEventListener('abort',abort);reject(signal.reason||Object.assign(Error('Поиск отменён'),{name:'AbortError'}));};signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});
}
function publicAddress(ip){
 if(net.isIP(ip)===4){const p=ip.split('.').map(Number);return ![0,10,127].includes(p[0])&&!(p[0]===169&&p[1]===254)&&!(p[0]===172&&p[1]>=16&&p[1]<=31)&&!(p[0]===192&&p[1]===168)&&!(p[0]===100&&p[1]>=64&&p[1]<=127)&&p[0]<224;}
 return net.isIP(ip)===6&&!/^(?:0*:){2,}|^::|^f[cd]|^fe[89ab]/i.test(ip)&&!ip.toLowerCase().includes('ffff:');
}
async function checkedUrl(raw,lookup=dns.lookup){
 const url=new URL(raw);
 if(url.protocol!=='https:'||url.username||url.password||url.port&&!['443'].includes(url.port)||url.href.length>3000)throw Error('Источник должен быть общедоступной ссылкой HTTPS');
 const host=url.hostname.replace(/^\[|\]$/g,'');
 if(/(?:^|\.)(?:localhost|local|internal|test)$/.test(host))throw Error('Локальные адреса не являются источниками исследования');
 const addresses=net.isIP(host)?[{address:host}]:await lookup(host,{all:true});
 if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw Error('Доступ к локальным и служебным адресам запрещён');
 return url;
}
async function download(raw,{fetch:request=globalThis.fetch,lookup=dns.lookup,signal,timeoutMs=READ_LIMITS.timeoutMs}={}){
 // One deadline includes DNS, redirects and the streamed response, rather than
 // granting every redirect another complete timeout.
 const deadline=AbortSignal.timeout(timeoutMs),bounded=signal?AbortSignal.any([signal,deadline]):deadline;
 let url=await abortable(checkedUrl(raw,lookup),bounded);
 for(let n=0;n<4;n++){
  let response;try{response=await abortable(request(url.href,{redirect:'manual',credentials:'omit',headers:{accept:'text/html, application/xhtml+xml, text/plain, application/rss+xml, application/xml'},signal:bounded}),bounded);}catch(error){if(signal?.aborted)throw signal.reason||error;throw sourceError(bounded.aborted?'timeout':'unavailable',bounded.aborted?'Источник не ответил за отведённое время.':'Не удалось получить открытый источник.');}
  if([301,302,303,307,308].includes(response.status)){await abortable(response.body?.cancel(),bounded);url=await abortable(checkedUrl(new URL(response.headers.get('location'),url).href,lookup),bounded);continue;}
  if(!response.ok){void response.body?.cancel().catch(()=>{});throw sourceError('http','Источник ответил кодом '+response.status,{http_status:response.status});}
  const mime=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase(),textMime=/^(?:text\/(?:html|plain)|application\/(?:xhtml\+xml|rss\+xml|atom\+xml|xml)|text\/xml)$/.test(mime),ambiguous=!mime||/^(?:application|binary)\/(?:octet-stream|binary)$/.test(mime),pdfMime=/^application\/(?:x-)?pdf$/.test(mime);
  if(!textMime&&!ambiguous&&!pdfMime){await abortable(response.body?.cancel(),bounded);throw sourceError('unsupported','Источник имеет нетекстовый формат. Выберите HTML-страницу с той же методикой или другой первичный источник.',{format:mime||'unknown'});}
  if(!response.body?.getReader)throw sourceError('empty','Источник не вернул читаемый текст.');
  const charset=(response.headers.get('content-type')||'').match(/charset\s*=\s*["']?([a-z0-9_-]+)/i)?.[1]||'utf-8';let decoder;try{decoder=new TextDecoder(charset,{fatal:true});}catch{void response.body?.cancel().catch(()=>{});throw sourceError('unsupported','Кодировка источника не поддерживается. Выберите другой текстовый источник.',{format:'encoding'});}
  const reader=response.body.getReader();let total=0,html='',sniffed=textMime,pdf=pdfMime,magic=Buffer.alloc(0),chunks=[];
  try{for(;;){const {done,value}=await abortable(reader.read(),bounded);if(done)break;total+=value.length;
    magic=Buffer.concat([magic,Buffer.from(value).subarray(0,16-magic.length)]).subarray(0,16);const signature=magic.toString('hex');if(signature.startsWith('255044462d'))pdf=true;
    if(total>(pdf?2*1024*1024:READ_LIMITS.bytes))throw sourceError('too_large','Страница слишком велика для исследования. Найдите конкретный раздел или другой текстовый источник.');chunks.push(Buffer.from(value));if(pdf)continue;if(/^(?:4d5a|7f454c46|504b0304|89504e470d0a1a0a|ffd8ff|474946383[79]61|52494646)/.test(signature))throw sourceError('unsupported','Получен бинарный ресурс; он не интерпретируется как текст. Найдите HTML-страницу или другой первичный источник.',{format:'binary'});
    html+=decoder.decode(value,{stream:true});const prefix=html.slice(0,4096).replace(/^\uFEFF/,'').trimStart();
    if(prefix.startsWith('%PDF-')){pdf=true;continue;}if(/^(?:MZ|\x7fELF|PK\x03\x04|\x89PNG|GIF8[79]a|\xff\xd8\xff)|\x00/.test(prefix))throw sourceError('unsupported','Получен бинарный ресурс; он не интерпретируется как текст. Найдите HTML-страницу или другой первичный источник.',{format:'binary'});
    if(ambiguous&&!sniffed){sniffed=/^(?:(?:<!doctype\s+html\b|<!--|<\?xml\b)[\s\S]{0,4000})?<(?:html|head|body|title|main|article|p|h[1-6]|table|meta|rss|feed|channel)\b/i.test(prefix)||/^<!doctype\s+html\b/i.test(prefix);if(!sniffed&&prefix.length>=256)throw sourceError('unsupported','Нетекстовый формат не содержит распознаваемой HTML-страницы. Выберите другой открытый источник.',{format:'unknown'});}
   }if(!pdf){html+=decoder.decode();if(!sniffed)throw sourceError('unsupported','Нетекстовый формат не содержит распознаваемой HTML-страницы. Выберите другой открытый источник.',{format:'unknown'});}
  }catch(error){if(signal?.aborted)throw signal.reason||error;if(bounded.aborted)throw sourceError('timeout','Чтение страницы превысило ограничение времени. Попробуйте другой текстовый источник.');if(error.code==='ERR_ENCODING_INVALID_ENCODED_DATA')throw sourceError('unsupported','Ресурс не удалось прочитать как текст в указанной кодировке. Выберите другой источник.',{format:'encoding'});if(!/^research_source_/.test(error.code||''))throw sourceError('unavailable','Передача страницы прервалась. Выберите другой открытый источник.');throw error;}finally{void reader.cancel().catch(()=>{});}
  return {url:url.href,html,...(pdf?{format:'pdf',bytes:Buffer.concat(chunks)}:{}),content_type:mime||'unknown',content_type_sniffed:ambiguous};
 }
 throw sourceError('redirect_limit','Источник перенаправляет слишком много раз. Выберите другую ссылку.');
}
const entities=s=>s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d{1,7}|#x[a-f\d]{1,6});/gi,m=>{const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '},key=m.toLowerCase();if(named[key]!==undefined)return named[key];const number=parseInt(key.slice(key[2]==='x'?3:2,-1),key[2]==='x'?16:10);return number>0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)?String.fromCodePoint(number):' ';});
const plain=s=>entities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').replace(/\s+([,.;:!?])/g,'$1').trim();
async function read(url,options={}){
 const started=performance.now(),elapsed=()=>Math.round(performance.now()-started);
 try{const r=await download(url,options);if(r.format==='pdf'){const document=await require('./public-pdf-reader.cjs').readPdf(r.bytes,{signal:options.signal,timeoutMs:Math.max(1,(options.timeoutMs||READ_LIMITS.timeoutMs)-elapsed())});return {url:r.url,...document,elapsed_ms:elapsed(),content_type:r.content_type,content_type_sniffed:r.content_type_sniffed,accessed_at:new Date().toISOString(),untrusted_source:true};}
  const markup=/<(?:!doctype\s+html|html|head|body|title|p|h[1-6]|article|table)\b/i.test(r.html.slice(0,4096)),format=r.content_type==='text/plain'&&!markup?'text':'html',title=plain(r.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||r.url).slice(0,200),text=format==='text'?r.html.replace(/\s+/g,' ').trim():plain(r.html),bodyText=format==='text'?text:plain(r.html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,''));
  if(/^(?:just a moment|attention required|access denied|verify (?:you are|that you are) human|captcha|checking your browser)/i.test(title)||text.length<2000&&/(?:verify (?:you are|that you are) human|enable javascript and cookies|checking your browser|подтвердите,? что вы человек)/i.test(text))throw sourceError('challenge','Источник показал проверку доступа вместо статьи. Выберите другой общедоступный первичный источник; обход проверки не выполняется.');
  if(bodyText.length<8||/^(?:loading[.\s…]*|please wait[.\s…]*|загрузка[.\s…]*)$/iu.test(bodyText))throw sourceError('empty','На странице не найден содержательный текст статьи. Используйте другой текстовый источник.');
  if(bodyText.length<2000&&/(?:you need to enable javascript to run this app|javascript (?:is )?required)/i.test(bodyText))throw sourceError('render_required','Страница требует выполнения JavaScript и не вернула текст статьи. Найдите статичную документацию или другой открытый источник.');
  return {url:r.url,title,format,text:text.slice(0,READ_LIMITS.textCharacters),elapsed_ms:elapsed(),content_type:r.content_type,content_type_sniffed:r.content_type_sniffed,coverage:{complete:text.length<=READ_LIMITS.textCharacters,total_characters:text.length},accessed_at:new Date().toISOString(),untrusted_source:true};
 }catch(error){if(options.signal?.aborted)throw options.signal.reason||error;if(error.name==='TimeoutError')error=sourceError('timeout','Источник не ответил за отведённое время. Выберите другую ссылку.');if(['ENOTFOUND','EAI_AGAIN','ETIMEDOUT'].includes(error.code))error=sourceError('unavailable','Не удалось определить общедоступный адрес источника. Выберите другую ссылку.');if(!/^research_source_/.test(error.code||'')&&error.code!=='research_pdf')throw error;const kind=error.code==='research_pdf'?'pdf_'+error.reason:error.code.slice(16);return {url:new URL(url).href,valid:false,recoverable:true,kind,code:'source_'+kind,message:error.message,elapsed_ms:elapsed(),...(error.format?{format:error.format}:{}),...(error.http_status?{http_status:error.http_status}:{}),next_action:'Прочитайте другую ссылку из поиска или уточните запрос о методике.',next_actions:['Выберите другую ссылку из результатов поиска.','Уточните запрос о методике; таблица размеров не заменяет способ построения.'],clo_changed:false,untrusted_source:true};}
}
function attribute(html,name){return entities(html.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^\"]*)"|\'([^\']*)\')','i'))?.slice(1).find(v=>v!==undefined)||'');}
function outbound(value,base){
 try{let url=new URL(value,base);if(/^(?:www\.|html\.|lite\.)?duckduckgo\.com$/i.test(url.hostname)&&url.pathname==='/l/'){const target=url.searchParams.get('uddg');if(!target)return null;url=new URL(target);}if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||url.href.length>3000||/(?:^|\.)(?:duckduckgo\.com|bing\.com)$/i.test(url.hostname))return null;url.hash='';return url.href;}catch{return null;}
}
function rss(html){const rows=[];for(const m of html.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){const field=n=>plain(m[1].match(new RegExp('<'+n+'[^>]*>([\\s\\S]*?)<\\/'+n+'>','i'))?.[1]||'');rows.push({title:field('title'),url:field('link'),excerpt:field('description')});if(rows.length>=SEARCH_LIMITS.candidates)break;}return rows;}
function duckduckgo(html,base){
 const anchors=[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)],rows=[];
 for(let i=0;i<anchors.length;i++){const a=anchors[i];if(!/(?:^|\s)(?:result__a|result-link)(?:\s|$)/.test(attribute(a[1],'class')))continue;
  const start=a.index+a[0].length,next=anchors.slice(i+1).find(b=>/(?:^|\s)(?:result__a|result-link)(?:\s|$)/.test(attribute(b[1],'class'))),tail=html.slice(start,Math.min(next?.index??html.length,start+7000));
  const snippet=tail.match(/<(?:a|td|div|span)\b[^>]*class\s*=\s*["'][^"']*(?:result__snippet|result-snippet)[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|td|div|span)>/i)?.[1]||'';
  rows.push({title:plain(a[2]),url:outbound(attribute(a[1],'href'),base),excerpt:plain(snippet)});if(rows.length>=SEARCH_LIMITS.candidates)break;
 }return rows;
}
async function accepted(rows,query,lookup,signal){
 const words=terms(query),essential=words.filter(w=>!BROAD.has(w)),dedup=new Set(),candidates=[];
 for(const row of rows){const url=outbound(row.url,'https://duckduckgo.com'),title=row.title.slice(0,200),excerpt=row.excerpt.slice(0,600);if(!url||dedup.has(url)||!title)continue;
  let displayUrl=url;try{displayUrl=decodeURI(url);}catch{}const titles=new Set(terms(title,false)),snippets=new Set(terms(excerpt,false)),urls=new Set(terms(displayUrl,false)),matched=words.filter(w=>titles.has(w)||snippets.has(w)||urls.has(w));
  // A common verb such as "sew" is not evidence that an industrial/company
  // result is relevant to the object named by the rest of the query.
  if(!matched.length||essential.length&&!essential.some(w=>matched.includes(w))||!essential.length&&words.length>1&&matched.length<2)continue;
  dedup.add(url);const score=matched.reduce((n,w)=>n+(BROAD.has(w)?.5:2)*(titles.has(w)?3:snippets.has(w)?2:1),0),source_role=/(?:size\s+(?:chart|guide|table)|размерн\S*\s+сетк|таблиц\S*\s+размер)/iu.test(title+' '+excerpt)?'size_reference':'unclassified';candidates.push({url,title,excerpt,relevance:{matched_terms:matched,score,source_role,verified_method:false}});
 }
 candidates.sort((a,b)=>b.relevance.score-a.relevance.score);
 const checked=await Promise.all(candidates.map(async row=>{try{await abortable(checkedUrl(row.url,lookup),signal);return row;}catch(error){if(signal.aborted)throw error;return null;}}));return checked.filter(Boolean).slice(0,SEARCH_LIMITS.results);
}
function stem(word){word=word.toLocaleLowerCase().normalize('NFKC');if(/^[a-z]{5,}$/.test(word)&&/(?:sses|xes|ches|shes|zes)$/.test(word))return word.slice(0,-2);if(/^[a-z]{4,}$/.test(word)&&word.endsWith('s')&&!/(?:ss|us|is)$/.test(word))return word.slice(0,-1);if(/^[а-яё]{4,}$/u.test(word))return word.replace(/(?:иями|ями|ами|ого|ему|ыми|ими|ах|ях|ов|ев|ом|ем|ой|ий|ая|яя|ое|ые|ую|юю|ия|ие|а|я|ы|и|у|ю|е|о|ь)$/u,'');return word;}
const STOP=new Set(('a an the how to of for from and or with without what is are in on by at this that these those can could should please make making create build high standard basic free size sizes sizing chart charts table tables eu uk us european europe pdf html download downloads printable print online website tutorial tutorials english russian french german spanish public published open как что это для без или при по из от на до чтобы нужно нужны надо сделай создай сделаю хочу обычный обычные стандартный стандартные высокий высокие бесплатный размер размерный размерная размерные европейский европейская европейские базовый базовая базовые скачать скачивание пдф инструкция английский английская русский русская').split(' ').map(stem));
const BROAD=new Set(('sew sewing pattern patterns drafting draft construction guide tutorial method principles выкройка выкройки построение конструкция конструирование шить шитье пошив инструкция методика').split(' ').map(stem));
function terms(value,filter=true){return [...new Set((value.toLocaleLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{3,}/gu)||[]).map(stem).filter(w=>!filter||!STOP.has(w)&&!/^\d|^(?:eu|uk|us)\d/i.test(w)))];}
async function search(query,options={}){
 if(typeof query!=='string'||!query.trim()||query.length>200||/@|\{/.test(query))throw Error('Нужен краткий поисковый запрос о конструкции без личных данных');
 const deadline=AbortSignal.timeout(SEARCH_LIMITS.totalMs),signal=options.signal?AbortSignal.any([options.signal,deadline]):deadline,attempts=[];options.signal?.throwIfAborted();
 for(const provider of [{name:'Bing RSS',url:'https://www.bing.com/search?format=rss&q='+encodeURIComponent(query),parse:r=>rss(r.html)},{name:'DuckDuckGo HTML',url:'https://html.duckduckgo.com/html/?q='+encodeURIComponent(query),parse:r=>duckduckgo(r.html,r.url)}]){
  try{const response=await download(provider.url,{...options,signal,timeoutMs:SEARCH_LIMITS.attemptMs}),results=await accepted(provider.parse(response),query,options.lookup||dns.lookup,signal);attempts.push({provider:provider.name,status:results.length?'results':'empty',result_count:results.length});if(results.length)return {query,provider:provider.name,results,attempts,message:'Открой подходящие первичные источники перед выводами. Поисковая выдержка не является проверенной методикой.',untrusted_source:true};}
  catch(error){if(options.signal?.aborted)throw options.signal.reason||error;attempts.push({provider:provider.name,status:signal.aborted?'budget_exhausted':'unavailable',reason:signal.aborted||error?.name==='TimeoutError'?'timeout':'provider_unavailable',result_count:0});if(signal.aborted)break;}
 }
 return {query,provider:'Public search fallback',results:[],attempts,message:'Открытые поисковые источники не дали читаемых результатов. Попробуй более короткий или переведённый запрос, другой термин конструкции либо прямую ссылку на первичный источник; это не доказывает отсутствие способа построения.',untrusted_source:true};
}
module.exports={read,search,checkedUrl,publicAddress,SEARCH_LIMITS,READ_LIMITS};
