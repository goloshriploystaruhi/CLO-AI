'use strict';

// Methodological reference data, not a role/persona or a system prompt.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const REPOSITORY='https://github.com/wonsukchoi/domain-experts';
const COMMIT='9554f15f4c20bfa121d1dc85db24cf4389c5b737';
const PREFIX='roles/tailor-dressmaker/';
const FILES=['SKILL.md','references/playbook.md','references/red-flags.md','references/vocabulary.md'];
const ALLOWED=new Set([...FILES,'LICENSE','SOURCE.json']);
const LIMITS=Object.freeze({fileBytes:65536,totalBytes:262144,body:8000,query:500,hits:12,records:100});
const normalize=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('ru-RU');
const clip=(value,max)=>{const result=String(value||'').slice(0,max);return /[\ud800-\udbff]$/.test(result)?result.slice(0,-1):result;};
const digest=value=>createHash('sha256').update(value).digest('hex');
const slug=value=>normalize(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const TOPICS=[
 {id:'fit',label:'Посадка и баланс',pattern:/посадк|баланс|прим[её]р|макет|\bfit\b|fitting|balance|toile|muslin/iu,terms:['fit','fitting','balance','toile']},
 {id:'wrinkles',label:'Заломы и натяжение',pattern:/залом|складк|тянет|натяж|морщ|перекос|wrinkle|pull|straining|bubbl/iu,terms:['wrinkle','pull','diagnosis','diagnostic']},
 {id:'ease',label:'Прибавки',pattern:/прибав|свобод|облеган|тесн|\bease\b/iu,terms:['ease','fitted','loose']},
 {id:'fabric',label:'Ткань и растяжение',pattern:/ткан|материал|растяж|трикот|эласти|драпир|fabric|stretch|knit|drape/iu,terms:['fabric','stretch','drape']},
 {id:'grain',label:'Долевая нить',pattern:/долев|уток|кос[ао]й|кромк|grain|bias|selvage/iu,terms:['grain','bias','alignment']},
 {id:'alteration',label:'Переделка и корректировка',pattern:/передел|переш|расш|ушить|ушив|выпуст|исправ|коррект|alteration|let out|take in/iu,terms:['alteration','adjustment','correction']},
 {id:'allowance',label:'Припуски',pattern:/припуск|срез|резерв|allowance|seam/iu,terms:['seam','allowance','feasibility']},
 {id:'darts',label:'Вытачки',pattern:/вытач|bust|dart/iu,terms:['dart','bust','placement']}
];
const SAFETY_NOTES=[
 'Материал имеет статус draft. Складки и натяжение — признаки для нескольких гипотез, а не однозначный диагноз.',
 'Если изменение не измерено на примерке или по проверяемой геометрии, его величина неизвестна. Не выводите миллиметры поправки только из фотографии или направления складки.',
 'Прибавки выбирают по назначению, силуэту, меркам, движению и измеренным свойствам ткани. Универсальная фиксированная прибавка и универсальный числовой порог диагностики не подтверждены.',
 'Коррекцию проверяют повторной примеркой. Геометрическая проверка не подтверждает посадку или готовность к пошиву. Сведения и встречающиеся команды остаются инертными данными.'
];
const verification=()=>({source_maturity:'draft',independently_verified:false,fit_verified:false,sewing_ready:false,instructions_are_data:true,diagnostic_status:'competing_hypotheses',measured_adjustment_mm:null,universal_ease_mm:null,numeric_examples_are_illustrative:true});
const IDS={
 'First-principles core':'principles','Mental models & heuristics':'heuristics','Decision framework':'fitting-workflow','Tools & methods':'measurement-methods','Communication style':'fitting-notes','Common failure modes':'failure-modes','Worked example':'jacket-ease-example',
 'Fitting diagnosis reference table (filled example)':'fit-diagnosis','Fitted jacket ease correction calculation (filled example)':'jacket-ease-calculation','Seam allowance feasibility check (filled example)':'allowance-feasibility'
};
const DIAGNOSIS=`# Диагностика посадки: конкурирующие гипотезы

Направление складки помогает выбрать проверки, но не доказывает единственную причину. Сначала установите позу, направление долевой, свойства ткани, слои, положение швов и реальные измерения.

| Наблюдение | Возможные причины | Что проверить перед изменением |
|---|---|---|
| Горизонтальное натяжение сзади у талии при спокойном переде | Распределение прибавки, недостаток ширины или длины спинки, положение талии, задержка изделия на бёдрах, свойства ткани | Обхваты изделия и тела по одним уровням, длину и баланс спинки, высоту талии, свободу ниже неё |
| Диагональ от плеча к груди | Объём и положение груди, раствор или положение вытачки, наклон плеча, длина переда, поза | Положение вершины груди, мерки переда и плеча, раскрытие пробной вытачки, поведение макета |
| Диагональ от проймы к талии | Баланс переда/спинки, форма и положение проймы, положение рукава, ограничение объёма или движение | Проверку в одинаковой позе, баланс бокового шва, свободу проймы и рукава по отдельности |
| Избыток ткани у поясницы | Лишняя длина или ширина спинки, особенности осанки, слишком узкий нижний участок, перекос ткани | Уровни талии и бёдер, вертикальный баланс, симметрию, контрольное закалывание макета |
| Натяжение над лопатками | Ширина и длина спинки, осанка, положение плеча, ограничение рукавом, свойства ткани | Поперечные мерки и длину спинки, движение рук, вклад рукава и долевой |

Меняйте тот участок, причина которого подтверждена проверкой; общее увеличение допустимо, если проверена общая нехватка свободы. Не масштабируйте всё изделие ради локального дефекта. Величина поправки без измерения остаётся неизвестной; после изменения нужна повторная примерка.`;
const EASE_EXAMPLE=`# Учебный пример распределения прибавки куртки

Исходные числа upstream иллюстративны: талия 30 дюймов = 762 мм; выбранная в примере прибавка 2 дюйма = 50,8 мм; соответствующий обхват изделия 32 дюйма = 812,8 мм. Прибавка 50,8 мм не является стандартом для любой приталенной куртки.

Горизонтальное натяжение сзади само по себе не определяет требуемую поправку. Рассмотрите распределение ширины, длину/баланс спинки, положение талии, нижние участки, осанку, рукав и поведение ткани. Проверьте конкурирующие причины на примерке.

Только если на примерке действительно измерена дополнительная суммарная величина 3/4 дюйма = 19,05 мм, её можно распределять по подтверждённым участкам. Для ровно двух изменяемых срезов спинки вклад каждого будет 19,05 / 2 = 9,525 мм. Это расчёт для условного учебного примера, а не величина, которую можно назначить пользователю по виду складки. Учитывайте реальные количества деталей/срезов, сопряжение швов и запас припусков. Если величина не измерена, она неизвестна. Если исходный обхват 32 дюйма (812,8 мм), а перед и остальные участки не меняются, добавление спинке 19,05 мм увеличит общий обхват до 831,85 мм. Сохранить одновременно исходный общий обхват и неизменность всех остальных участков при таком увеличении нельзя. Проверьте коррекцию на следующей примерке.`;
const ALLOWANCE=`# Проверка возможности выпустить швы

Не используйте исходное правило «весь припуск × число швов». Оно не сохраняет рабочий припуск и не различает два среза каждого соединения. Запись «припуск 5/8 дюйма» сама по себе не определяет допустимое увеличение обхвата.

1. Определите изменяемые швы, число сшитых слоёв/срезов и вклад каждого среза в нужный обхват.
2. Измерьте фактическую ширину каждого припуска до среза на нужных уровнях. Проверьте износ, проколы, осыпание, отделку, подкладку, проклейку и форму линии шва.
3. Установите необходимый остаточный рабочий припуск для конкретной ткани, шва и обработки; универсального остатка здесь не задано.
4. Для каждого используемого среза возможный вклад равен max(0, измеренный припуск − необходимый остаточный припуск − непригодная часть). Суммируйте только фактически изменяемые срезы с учётом их вклада в обхват. Для обычного соединения двух деталей учитывайте оба среза шва.
5. Сравните сумму с запрошенным изменением, затем проверьте ограничения остальных швов, подкладки, карманов и отделки. Выпустите пробный участок и повторите примерку.

Если любой нужный припуск, остаточный запас или количество изменяемых срезов не измерены, максимальное увеличение неизвестно. Не обещайте числовой предел переделки. Учебный запрос 1,5 дюйма = 38,1 мм и запись 5/8 дюйма = 15,875 мм не доказывают ни возможность, ни невозможность такой переделки без остальных данных.`;
const NOTES=`# Как записывать результат примерки

Отдельно фиксируйте наблюдение (участок, направление натяжения, поза и ткань), несколько возможных причин, проверки каждой причины и подтверждённые измерения. Затем укажите проверяемое изменение, затронутые детали/швы и результат повторной примерки. Не записывайте предположение как установленный диагноз. Если величина коррекции не измерена, обозначьте её неизвестной.`;

function adaptGrain(text){
 const corrections=[];let body=text;
 const replacements=[
  [/against the body's structural axis/gi,'against the specified fabric warp/selvage or knit wale direction and the intended lengthwise, crosswise or bias cut','TD07-grain-direction-is-fabric-and-design-relative'],
  [/Grain line accuracy determines drape and long-term shape retention, and an error here is invisible until the garment is actually worn\./g,'Grain direction affects drape and shape retention. Check the specified warp/selvage or knit wale direction and the intended lengthwise, crosswise or bias cut; grain errors can be detected before wear by checking grain marks, selvage/wales and seam alignment.','TD07-grain-errors-can-be-detected-before-wear'],
  [/A piece cut off-grain can look fine freshly pressed but will twist or hang incorrectly after the first wear or wash\./g,'An unintentionally off-grain piece can twist or hang differently; inspect the marks, selvage/wales and seam balance before sewing, then verify fitting and behavior after care. A deliberately crosswise or bias-cut piece is not itself an error.','TD07-grain-errors-can-be-detected-before-wear'],
  [/Cut pattern pieces with verified grain line alignment\./g,'Cut pattern pieces after verifying their marks against fabric warp/selvage or knit wales and the intended lengthwise, crosswise or bias direction; inspect alignment before sewing and fitting.','TD07-grain-direction-is-fabric-and-design-relative']
 ];
 for(const [pattern,replacement,id]of replacements){const next=body.replace(pattern,replacement);if(next!==body)corrections.push(id);body=next;}
 return {body,corrections};
}

function adapt(id,body){
 const corrections=[];let result=body;
 if(id==='tailor:fit-diagnosis'){result=DIAGNOSIS;corrections.push('wrinkle-signatures-are-not-unique-diagnoses','unmeasured-adjustment-is-unknown');}
 else if(['tailor:jacket-ease-example','tailor:jacket-ease-calculation'].includes(id)){result=EASE_EXAMPLE;corrections.push('ease-is-not-a-universal-constant','numeric-correction-requires-measurement');}
 else if(id==='tailor:allowance-feasibility'){result=ALLOWANCE;corrections.push('retain-working-seam-allowance','count-both-cut-edges-per-seam','unknown-capacity-until-measured');}
 else if(id==='tailor:fitting-notes'){result=NOTES;corrections.push('record-hypotheses-separately-from-measurements');}
 else{
  const changes=[
   [/A horizontal pull line, a diagonal wrinkle, and excess fabric each point to a different, specific pattern adjustment[^.]*\./g,'Different wrinkles may have several competing causes; compare body and garment measurements, posture, grain and fabric behavior before choosing and testing a correction.'],
   [/default to diagnosing it as a localized pattern-balance issue at that point, adjusting there rather than uniformly resizing the whole garment\./g,'consider localized balance, width/length distribution, posture and fabric behavior as competing hypotheses; verify them before choosing a local or overall adjustment.'],
   [/- \*\*Usually means:\*\*/g,'- **Possible explanation (unverified, consider competing causes):**'],
   [/"That pull is a dart placement issue, not a size issue — move the bust dart up half an inch\."/g,'"Dart placement is one hypothesis; test it against bust position, shoulder slope, balance and volume. The adjustment amount is unknown until measured."']
  ];for(const [pattern,replacement]of changes){const next=result.replace(pattern,replacement);if(next!==result)corrections.push('deterministic-inference-replaced-with-testable-hypotheses');result=next;}
 }
 const grain=adaptGrain(result);return {body:grain.body,corrections:[...new Set([...corrections,...grain.corrections])]};
}
class TailorKnowledge{
 constructor(root=path.join(__dirname,'..','third_party','tailor-dressmaker')){this.root=path.resolve(root);this.documents=new Map();this.records=new Map();this.manifest=this._manifest();this._load();}
 _safe(relative){
  if(!ALLOWED.has(relative))throw Error('Материал недоступен для чтения');
  try{if(fs.lstatSync(this.root).isSymbolicLink())throw Error('link');let file=this.root;for(const part of relative.split('/')){file=path.join(file,part);if(fs.lstatSync(file).isSymbolicLink())throw Error('link');}const real=fs.realpathSync(file),rel=path.relative(fs.realpathSync(this.root),real);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('link');return real;}
  catch(error){if(error.message==='link')throw Error('Ссылки и выход за разрешённый каталог материалов запрещены');throw Error('Не удалось прочитать локальный методический материал');}
 }
 _read(relative){const file=this._safe(relative),stat=fs.statSync(file);if(!stat.isFile()||stat.size>LIMITS.fileBytes)throw Error('Методический материал имеет недопустимый размер');const bytes=fs.readFileSync(file);if(bytes.length>LIMITS.fileBytes)throw Error('Методический материал имеет недопустимый размер');return {file:relative,body:bytes.toString('utf8').replace(/\r\n?/g,'\n'),sha256:digest(bytes),size:stat.size,mtime:stat.mtimeMs};}
 _manifest(){try{const doc=this._read('SOURCE.json'),data=JSON.parse(doc.body);return data.repository===REPOSITORY&&data.revision===COMMIT&&typeof data.sha256==='object'?data.sha256:null;}catch{return null;}}
 _load(){
  const documents=new Map(),records=new Map();let bytes=0;for(const file of FILES){const doc=this._read(file);bytes+=doc.size;if(bytes>LIMITS.totalBytes)throw Error('Слишком большой каталог методических материалов');documents.set(file,doc);
   const headings=[...doc.body.matchAll(file==='SKILL.md'?/^##\s+(.+)$/gm:/^#{2,3}\s+(.+)$/gm)];
   for(let i=0;i<headings.length;i++){
    const heading=headings[i][1].trim();if(file==='SKILL.md'&&!Object.hasOwn(IDS,heading))continue;if(/identity|career|persona|professional experience|^sources$/i.test(heading))continue;
    const titleSlug=slug(heading),prefix=file.endsWith('vocabulary.md')?'term-':file.endsWith('red-flags.md')?'warning-':'',fallback=prefix+titleSlug.slice(0,72)+(titleSlug.length>72?'-'+digest(heading).slice(0,8):''),id='tailor:'+(IDS[heading]||fallback),raw=doc.body.slice(headings[i].index,headings[i+1]?.index??doc.body.length).trim();
    if(records.has(id))throw Error('Повторяется идентификатор методического материала');const adapted=adapt(id,raw),adaptedHeading=adaptGrain(heading);records.set(id,{id,title:adaptedHeading.body,file,anchor:titleSlug,body:adapted.body,corrections:[...new Set([...adapted.corrections,...adaptedHeading.corrections])],searchText:normalize(adaptedHeading.body+' '+adapted.body)});if(records.size>LIMITS.records)throw Error('Слишком много методических разделов');
   }
  }this.documents=documents;this.records=records;
 }
 _fresh(){for(const doc of this.documents.values()){const stat=fs.statSync(this._safe(doc.file));if(stat.size!==doc.size||stat.mtimeMs!==doc.mtime){this._load();return;}}}
 _source(record){const actual=record&&this.documents.get(record.file).sha256,expected=record&&this.manifest?.[record.file];return {repository_url:REPOSITORY,commit:COMMIT,upstream_path:PREFIX,material_type:'inert_reference_data',maturity:'draft',...(record?{file:record.file,url:REPOSITORY+'/blob/'+COMMIT+'/'+PREFIX+record.file+'#'+record.anchor,sha256:actual,matches_vendored_manifest:typeof expected==='string'?expected===actual:null}:{})};}
 _license(){try{const doc=this._read('LICENSE');if(!/Permission is hereby granted, free of charge/i.test(doc.body))throw Error();return {spdx:'MIT',status:'bundled_notice',file:'LICENSE',copyright:clip(doc.body.match(/^Copyright[^\n]*/mi)?.[0],250),url:REPOSITORY+'/blob/'+COMMIT+'/LICENSE'};}catch{return {spdx:null,status:'not_verified'};}}
 _metadata(record){return {source:this._source(record),license:this._license(),confidence:{level:'unverified_reference',basis:'Общие практические сведения, заявленные самим источником; независимая проверка посадки не проводилась.'},verification:verification()};}
 catalog(){this._fresh();return {version:1,counts:{documents:this.documents.size,cards:this.records.size},topics:TOPICS.map(({id,label})=>({id,label})),cards:[...this.records.values()].map(({id,title})=>({id,title})),safety_notes:[...SAFETY_NOTES],...this._metadata()};}
 search(query,{limit=6}={}){
  if(typeof query!=='string'||!query.trim()||query.length>LIMITS.query)throw Error('Введите поисковый запрос до 500 символов');if(!Number.isInteger(limit)||limit<1||limit>LIMITS.hits)throw Error('Можно запросить от 1 до 12 материалов');this._fresh();
  const topics=TOPICS.filter(t=>t.pattern.test(query)),terms=new Map((normalize(query).match(/[\p{L}\p{N}][\p{L}\p{N}-]{1,}/gu)||[]).map(v=>[v,3]));for(const topic of topics)for(const term of topic.terms)if(!terms.has(term))terms.set(term,1.5);
  const ranked=[];for(const record of this.records.values()){const title=normalize(record.title+' '+record.id);let score=0;for(const [term,weight]of terms){if(title.includes(term))score+=weight*7;if(record.searchText.includes(term))score+=weight;}if(topics.some(t=>t.id==='wrinkles')&&record.id==='tailor:fit-diagnosis')score+=25;if(topics.some(t=>t.id==='allowance'||t.id==='alteration')&&record.id==='tailor:allowance-feasibility')score+=15;if(score>0)ranked.push({record,score});}
  ranked.sort((a,b)=>b.score-a.score||a.record.id.localeCompare(b.record.id));const total=ranked.length;if(!total)for(const id of ['tailor:fitting-workflow','tailor:principles']){const record=this.records.get(id);if(record)ranked.push({record,score:0});}
  return {query,expanded_terms:[...terms.keys()].slice(0,48),matched_topics:topics.map(t=>t.id),total_matches:total,results:ranked.slice(0,limit).map(({record,score})=>({id:record.id,title:record.title,excerpt:clip(record.body,650),match:score?'reference':'method_fallback',corrections:[...record.corrections],source:this._source(record),verification:verification()})),...this._metadata()};
 }
 read(id){
  if(typeof id!=='string'||id.length>120||!/^tailor:[a-z0-9-]+$/.test(id))throw Error('Недопустимый идентификатор методического материала');this._fresh();let record=this.records.get(id);if(!record)throw Error('Методический материал не найден. Повторите поиск.');
  const current=this._read(record.file);if(current.sha256!==this.documents.get(record.file).sha256){this._load();record=this.records.get(id);if(!record)throw Error('Материал изменился. Повторите поиск.');}
  return {id:record.id,title:record.title,body:clip(record.body,LIMITS.body),truncated:record.body.length>LIMITS.body,total_characters:record.body.length,corrections:[...record.corrections],safety_notes:[...SAFETY_NOTES],...this._metadata(record)};
 }
}
let index;const current=()=>index||(index=new TailorKnowledge());
module.exports={TailorKnowledge,catalog:()=>current().catalog(),search:(query,options)=>current().search(query,options),read:id=>current().read(id),LIMITS};
