// Project-scoped evidence, never executable code or permission to modify CLO.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const clone=value=>JSON.parse(JSON.stringify(value));
const text=(value,max=3000)=>typeof value==='string'?value.slice(0,max):'';
function scopeKey(scope){
 if(!scope||typeof scope.project_id!=='string'||!scope.project_id||scope.project_id.length>300)throw Error('Не указан проект исследования');
 const normalized={project_id:scope.project_id};
 for(const key of ['profile_id','profile_hash'])if(scope[key]!=null){if(typeof scope[key]!=='string'||scope[key].length>300)throw Error('Некорректный контекст профиля');normalized[key]=scope[key];}
 return {scope:normalized,key:createHash('sha256').update(JSON.stringify(normalized)).digest('hex')};
}
function source(value){
 if(!value||typeof value.url!=='string')return null;
 try{const url=new URL(value.url);if(url.protocol!=='https:'||url.username||url.password||url.href.length>2500)return null;
  return {url:url.href,title:text(value.title,250),read:value.read===true,...(value.accessed_at?{accessed_at:text(value.accessed_at,50)}:{})};
 }catch{return null;}
}
function document(value){
 const base=source(value);if(!base||typeof value.text!=='string'||!value.text.trim()||value.valid===false)return null;
 return {...base,read:true,format:['html','text','pdf'].includes(value.format)?value.format:'text',text:value.text.slice(0,8000),...(Number.isSafeInteger(value.page_count)?{page_count:value.page_count}:{}),...(Number.isSafeInteger(value.pages_read)?{pages_read:value.pages_read}:{}),coverage:{complete:value.coverage?.complete===true&&value.text.length<=8000,truncated:value.text.length>8000||value.coverage?.truncated===true,images_analyzed:false,ocr_performed:false},untrusted_source:true};
}
function search(value){if(!value||typeof value.query!=='string')return null;return {query:text(value.query,200),results:(value.results||[]).slice(0,6).map(source).filter(Boolean)};}
function failedSource(value){const base=source(value);return base?{...base,accessed_at:base.accessed_at||new Date().toISOString(),code:text(value.code,100),message:text(value.message,1000),next_action:text(value.next_action,500)}:null;}
function command(value){
 if(!value||typeof value.action!=='string'||!['create_garment','develop_garment','update_garment','revise_development','create_pattern_design','revise_pattern_design','trial_garment','trial_pattern_design'].includes(value.action))return null;
 try{const encoded=JSON.stringify({action:value.action,args:value.args||{}});return encoded.length<=64000?JSON.parse(encoded):{action:value.action,command_omitted:true};}catch{return null;}
}
function summary(value={}){
 const out={valid:value.valid===true,needs_input:!!value.needs_input,message:text(value.message,3500),fit_verified:false,clo_changed:false};
 if(typeof value.method==='string')out.method=text(value.method,150);
 if(Array.isArray(value.issues))out.issues=clone(value.issues.slice(0,12)).map(issue=>typeof issue==='string'?issue.slice(0,1000):{code:text(issue?.code,100),piece:text(issue?.piece,300),section:text(issue?.section,300),message:text(issue?.message,1000)});
 return out;
}
function trial(value){const c=command(value?.command);return c?{command:c,result:summary(value.result),checked_at:text(value.checked_at,50)}:null;}
function clean(value={}){
 return {brief:text(value.brief,5000),follow_up:text(value.follow_up,2000),status:['researching','validated','needs_input','paused','failed'].includes(value.status)?value.status:'researching',
  sources:(value.sources||[]).slice(-16).map(source).filter(Boolean),trials:(value.trials||[]).slice(-8).map(trial).filter(Boolean),
  source_evidence:(value.source_evidence||[]).slice(-6).map(document).filter(Boolean),failed_sources:(value.failed_sources||[]).slice(-8).map(failedSource).filter(Boolean),searches:(value.searches||[]).slice(-4).map(search).filter(Boolean),
  validated_designs:(value.validated_designs||[]).slice(-8).map(trial).filter(row=>row?.result.valid),
  last_failed:value.last_failed?trial(value.last_failed):null,last_validated:value.last_validated?trial(value.last_validated):null,
  recovery_failures:(Array.isArray(value.recovery_failures)?value.recovery_failures:[]).slice(-6).filter(row=>row&&typeof row==='object').map(row=>({kind:text(row.kind,80),stage:text(row.stage,80),action:text(row.action,120),message:text(row.message,1400),field:text(row.field,200)})),
  last_reply:text(value.last_reply,5000),updated_at:text(value.updated_at,50)};
}
class ConstructionMemory{
 constructor(file,scope){if(!path.isAbsolute(file))throw Error('Для истории исследования нужен абсолютный путь');this.file=file;Object.assign(this,scopeKey(scope));}
 read(){
  if(!fs.existsSync(this.file))return {version:1,records:[]};
  const bytes=fs.readFileSync(this.file,'utf8');if(bytes.length>2500000)throw Error('История исследования слишком велика; исходный файл сохранён');
  let data;try{data=JSON.parse(bytes);}catch{throw Error('Не удалось прочитать историю исследования; исходный файл сохранён');}
  if(data.version!==1||!Array.isArray(data.records))throw Error('Неизвестная версия истории исследования; исходный файл сохранён');return data;
 }
 load(){const record=this.read().records.find(row=>row.key===this.key);return record?clean(record.state):null;}
 save(state){const data=this.read(),next={key:this.key,scope:this.scope,state:clean(state)};data.records=[...data.records.filter(row=>row.key!==this.key),next].slice(-12);while(data.records.length>1&&JSON.stringify(data).length>2400000)data.records.shift();require('./atomic-json.cjs').writeJSON(this.file,data,{backup:true});return clone(next.state);}
}
module.exports={ConstructionMemory,clean,source,summary,command,document,search,failedSource};
