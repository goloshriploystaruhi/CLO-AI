// Public source PDFs are parsed as data in an isolated, bounded Python process.
const path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
const PDF_LIMITS=Object.freeze({bytes:2*1024*1024,pages:12,textCharacters:24000,timeoutMs:6000,stdoutBytes:180000});
const failure=(reason,message)=>Object.assign(Error(message),{code:'research_pdf',reason,recoverable:true,format:'pdf'});
async function readPdf(bytes,{signal,timeoutMs=PDF_LIMITS.timeoutMs}={}){
 if(signal?.aborted)throw signal.reason||Object.assign(Error('Чтение PDF отменено'),{name:'AbortError'});
 if(!(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array))throw failure('invalid_pdf','Для чтения PDF нужны полученные байты документа');
 if(bytes.byteLength>PDF_LIMITS.bytes)throw failure('too_large','PDF слишком велик для исследования. Выберите более короткий документ или текстовую страницу.');
 if(!Buffer.from(bytes.subarray(0,1024)).includes(Buffer.from('%PDF-')))throw failure('invalid_pdf','Полученный ресурс не содержит заголовка PDF');
 const boundedMs=Number.isFinite(timeoutMs)?Math.max(1,Math.min(PDF_LIMITS.timeoutMs,timeoutMs)):PDF_LIMITS.timeoutMs;
 return new Promise((resolve,reject)=>{
  const executable=require('./python-runtime.cjs').executable();
  const child=spawn(executable,['-I','-B',path.join(__dirname,'../tools/public_pdf_text.py')],{windowsHide:true,stdio:['pipe','pipe','pipe']});let settled=false,out='',size=0;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);if(error){child.kill();reject(error);}else resolve(value);};
  const abort=()=>finish(signal.reason||Object.assign(Error('Чтение PDF отменено'),{name:'AbortError'}));
  const timer=setTimeout(()=>finish(failure('timeout','Не удалось прочитать PDF за отведённое время. Продолжите с другим источником.')),boundedMs);
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  child.on('error',()=>finish(failure('unavailable','Средство чтения PDF недоступно. Продолжите с текстовым источником.')));
  child.stdout.on('data',chunk=>{size+=chunk.length;if(size>PDF_LIMITS.stdoutBytes)return finish(failure('resource_limit','Извлечённый PDF слишком велик для исследования.'));out+=chunk.toString('utf8');});
  child.stderr.on('data',()=>{}); // Library diagnostics can contain document data.
  child.stdin.on('error',()=>{});
  child.on('close',code=>{if(settled)return;try{const value=JSON.parse(out);if(value.error)return finish(failure(value.reason||'invalid_pdf',value.error));if(code!==0||value.format!=='pdf'||typeof value.text!=='string'||value.text.length>PDF_LIMITS.textCharacters||!Number.isSafeInteger(value.pages_read)||value.pages_read<1||value.pages_read>PDF_LIMITS.pages)return finish(failure('invalid_pdf','Не удалось получить проверяемый текст PDF.'));finish(null,value);}catch{finish(failure('invalid_pdf','Не удалось безопасно прочитать PDF. Выберите другой источник.'));}});
  if(!settled)child.stdin.end(bytes);
 });
}
module.exports={readPdf,PDF_LIMITS};
