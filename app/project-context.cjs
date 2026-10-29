const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {ConversationStore}=require('./conversation-store.cjs'),{GarmentStore}=require('./garment-store.cjs'),{SemanticStore}=require('./semantic-store.cjs');
const normalized=p=>typeof p==='string'?p.replaceAll('\\','/').toLocaleLowerCase('en-US'):null;
const stale=message=>Object.assign(Error(message||'Проект сменился. Предыдущая операция отменена.'),{code:'project_changed'});
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const managedBackup=value=>/\/clo_ai_backups\/[^/]+\.zprj$/i.test(normalized(value)||'');
function projectPath(value){
 const alias=normalized(value);
 // CLO reports its installed startup template as a file even for a new,
 // unsaved document. Backups are also not independently opened user projects.
 return alias&&(path.win32.isAbsolute(alias)||path.posix.isAbsolute(alias))&&!/\/presets?\/projects?\//i.test(alias)&&!managedBackup(alias)?alias:null;
}

class ProjectContexts{
 constructor({directory,profiles,onChange=()=>{},onInvalidate=()=>{}}){
  this.directory=directory;this.profiles=profiles;this.onChange=onChange;this.onInvalidate=onInvalidate;this.file=path.join(directory,'project-contexts','index.json');
  this.data=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{version:1,projects:[],generation:0};
  if(this.data.version!==1)throw Error('Неизвестная версия проектного контекста');
  this.state={available:false,name:'Проект не подключён',session_id:randomUUID(),generation:++this.data.generation,parts:[],context_version:0};
  this.activateStores(path.join(directory,'project-contexts','unavailable',this.state.session_id));
 }
 save(){require('./atomic-json.cjs').writeJSON(this.file,this.data,{backup:true});}
 activateStores(folder,sessionID=this.state.session_id){
  this.stores={profiles:this.profiles,garments:new GarmentStore(path.join(folder,'garments.json'),{libraryFile:path.join(this.directory,'construction-library.json')}),semantics:new SemanticStore(path.join(folder,'semantic-patterns.json')),
   conversation:new ConversationStore(path.join(folder,'sessions',sessionID+'.json'))};
  this.onChange(this.stores);
 }
 folder(record){return path.join(this.directory,'project-contexts',record.id);}
 legacySession(record){
  const folder=path.join(this.folder(record),'sessions');if(!fs.existsSync(folder))return null;
  const sessions=fs.readdirSync(folder).filter(name=>name.endsWith('.json')&&uuid(name.slice(0,-5))).map(name=>{
   const file=path.join(folder,name);try{const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.version!==1||!Array.isArray(data.messages))return null;
    return {id:name.slice(0,-5),messages:data.messages.length,time:Date.parse(data.messages.at(-1)?.at)||fs.statSync(file).mtimeMs};}catch{return null;}
  }).filter(Boolean).sort((a,b)=>Number(b.messages>0)-Number(a.messages>0)||b.time-a.time);
  return sessions[0]||null;
 }
 resolveRecord(snapshot,bridgeSession){
  const current=this.data.projects.find(p=>p.id===this.state.project_id);
  if(current&&this.state.document_id===snapshot.document_id)return {record:current};
  const native=this.data.projects.filter(p=>p.last_document?.document_id===snapshot.document_id);
  if(native.length===1)return {record:native[0]};
  const alias=projectPath(snapshot.path),candidates=alias?this.data.projects.filter(p=>p.paths?.includes(alias)):[];
  if(candidates.length===1)return {record:candidates[0]};
  if(candidates.length>1){
   // Migrate older versions which accidentally archived a new empty context on
   // every reconnect. Only an actual user file can join these records.
   const ranked=candidates.map(record=>({record,session:this.legacySession(record)})).sort((a,b)=>Number(!!b.session?.messages)-Number(!!a.session?.messages)||(b.session?.time||Date.parse(b.record.updated_at)||0)-(a.session?.time||Date.parse(a.record.updated_at)||0));
   return {record:ranked[0].record};
  }
  const record={id:randomUUID(),paths:alias?[alias]:[],parts:[],name:snapshot.name};this.data.projects.push(record);return {record};
 }
 update(snapshot,bridgeSession){
  if(!snapshot?.available){
   if(this.state.available){this.onInvalidate();this.state={...this.state,available:false,generation:++this.data.generation,context_version:this.state.context_version+1};this.save();}
   return this.publicState();
  }
  snapshot={...snapshot,native_generation:snapshot.native_generation??snapshot.generation};delete snapshot.generation;
  const previous=this.state,boundary=!previous.available||previous.document_id!==snapshot.document_id||previous.bridge_session!==bridgeSession;
  const {record,session_id:restoredSession}=this.resolveRecord(snapshot,bridgeSession);
  const backupSource=record.backup_aliases?.find(alias=>managedBackup(snapshot.path)&&alias.backup_path===normalized(snapshot.path));
  if(backupSource)snapshot={...snapshot,native_path:snapshot.native_path||snapshot.path,managed_backup_path:snapshot.managed_backup_path||snapshot.path,path:backupSource.logical_path,name:backupSource.logical_name};
  const sessionID=restoredSession||(uuid(record.active_session_id)?record.active_session_id:this.legacySession(record)?.id)||randomUUID();
  const changed=previous.project_id!==record.id||previous.session_id!==sessionID;
  if(previous.available&&(boundary||changed))this.onInvalidate();
  const version=changed?1:previous.context_version+(boundary||previous.content_digest!==snapshot.content_digest||previous.path!==snapshot.path?1:0);
  this.state={...snapshot,project_id:record.id,session_id:sessionID,generation:boundary||changed?++this.data.generation:previous.generation,bridge_session:bridgeSession,context_version:version};
  if(changed)this.activateStores(this.folder(record),sessionID);
  let persist=boundary||changed||record.active_session_id!==sessionID||record.name!==snapshot.name||JSON.stringify(record.parts)!==JSON.stringify(snapshot.parts);
  record.active_session_id=sessionID;record.last_document={document_id:snapshot.document_id,bridge_session:bridgeSession};record.content_digest=snapshot.content_digest;record.name=snapshot.name;record.parts=snapshot.parts||[];
  if(!managedBackup(snapshot.path)){record.logical_path=snapshot.path??null;record.logical_name=snapshot.name;}
  const alias=projectPath(snapshot.path);record.paths||=[];if(alias&&!record.paths.includes(alias)){record.paths.push(alias);persist=true;}
  if(persist){record.updated_at=new Date().toISOString();this.save();}return this.publicState();
 }
 resetDialogue(){
  if(!this.state.available)throw Error('Подключите проект CLO');
  this.state={...this.state,session_id:randomUUID(),generation:++this.data.generation,context_version:this.state.context_version+1};
  this.data.projects.find(p=>p.id===this.state.project_id).active_session_id=this.state.session_id;
  this.stores.conversation=new ConversationStore(path.join(this.directory,'project-contexts',this.state.project_id,'sessions',this.state.session_id+'.json'));
  this.stores.garments.data.draft=null;this.stores.garments.save();this.onChange(this.stores);this.save();return this.publicState();
 }
 ticket(){if(!this.state.available)throw Error('Откройте проект CLO и дождитесь чтения его состояния');return Object.freeze({project_id:this.state.project_id,session_id:this.state.session_id,generation:this.state.generation,document_id:this.state.document_id,bridge_session:this.state.bridge_session,content_digest:this.state.content_digest,native_generation:this.state.native_generation});}
 isCurrent(t){return !!t&&this.state.available&&['project_id','session_id','generation','document_id','bridge_session'].every(k=>this.state[k]===t[k]);}
 assert(t,content=false){if(!this.isCurrent(t))throw stale();if(content&&this.state.content_digest!==t.content_digest)throw Object.assign(Error('Содержимое проекта изменилось. Повторите запрос с актуальными данными.'),{code:'project_content_changed'});}
 publicState(){const {parts,...s}=this.state;return {...s,part_count:parts.length,live_garment_count:this.currentGarments().length};}
 matches(binding){return !!binding&&this.state.parts.some(p=>String(p.pattern_id)===String(binding.pattern_id)&&p.fingerprint===binding.fingerprint);}
 currentGarments(){return this.state.available?this.stores.garments.data.garments.filter(g=>g.bindings?.length&&g.bindings.every(b=>this.matches(b))):[];}
 currentPieces(){return this.state.available?this.stores.semantics.list().filter(p=>this.matches(p.clo)):[];}
 assertGarment(query){const g=this.stores.garments.find(query);if(!g.bindings?.length||!g.bindings.every(b=>this.matches(b)))throw Error('Детали этой конструкции отсутствуют или изменены в текущем проекте CLO');return g;}
 assertPiece(query){const p=this.stores.semantics.find(query);if(!this.matches(p.clo))throw Error('Деталь отсутствует или изменена в текущем проекте CLO');return p;}
 aiContext(){let body=null;try{body=this.profiles.tool('get_body_profile');}catch{}
  const active=this.currentGarments().find(g=>g.id===this.stores.garments.data.active);
  return {project:{id:this.state.project_id,name:this.state.name,path:this.state.path,context_version:this.state.context_version,parts:this.state.parts,limitations:this.state.limitations},
   garments:this.currentGarments().map(g=>({id:g.id,name:g.name,version:g.version,parameters:g.parameters,quality:g.quality_status,approximate:g.approximate})),
   active_construction:active?.id||null,body_profile:body,session_id:this.state.session_id};
 }
 nativeGuard(t){this.assert(t);return {document_id:t.document_id,generation:this.state.native_generation,content_digest:t.content_digest,context_session_id:t.session_id};}
}

class ProjectRuntime extends ProjectContexts{
 constructor(options){super(options);this.readBridge=options.readBridge;this.temp=options.temp;this.refreshTask=null;}
 resolveRecord(snapshot,bridgeSession){
  // Ordinary inventory polling must not repeatedly parse a potentially large
  // transaction receipt or scan all archived sessions.
  const proof=!this.state.available||this.state.document_id!==snapshot.document_id?this.receiptRecovery(snapshot):null;
  if(proof){
   const {record,receipt}=proof;record.recovered_receipts=[...(record.recovered_receipts||[]),receipt.id].slice(-10);
   if(managedBackup(snapshot.path)&&normalized(snapshot.path)===normalized(receipt.backup)){
    const source={backup_path:normalized(receipt.backup),logical_path:record.logical_path??record.paths?.at(-1)??null,logical_name:record.logical_name||record.name};
    record.backup_aliases=[...(record.backup_aliases||[]).filter(alias=>alias.backup_path!==source.backup_path),source].slice(-10);
   }
   this.recoveryReceipt=receipt;
   return {record,session_id:receipt.project_guard.context_session_id};
  }
  return super.resolveRecord(snapshot,bridgeSession);
 }
 receiptRecovery(snapshot){
  if(!this.temp)return null;
  try{
   const file=path.join(this.temp,'clo_ai_job_result.json'),stat=fs.statSync(file),stamp=stat.mtimeMs+':'+stat.size+':'+stat.ino;
   if(this.receiptCache?.stamp!==stamp)this.receiptCache={stamp,receipt:JSON.parse(fs.readFileSync(file,'utf8'))};
   const receipt=this.receiptCache.receipt,native=receipt.project_snapshot,guard=receipt.project_guard;
   if(receipt.error||receipt.transaction?.stage!=='committed'||!uuid(receipt.id)||!uuid(guard?.context_session_id)||!native?.available||!managedBackup(receipt.backup)||
    native.document_id!==snapshot.document_id||guard.document_id!==snapshot.document_id||!native.content_digest||native.content_digest!==snapshot.content_digest)return null;
   const owners=this.data.projects.filter(record=>uuid(record.id)&&fs.existsSync(path.join(this.folder(record),'sessions',guard.context_session_id+'.json')));
   if(owners.length!==1||owners[0].recovered_receipts?.includes(receipt.id)||owners[0].active_session_id&&owners[0].active_session_id!==guard.context_session_id)return null;
   return {record:owners[0],receipt};
  }catch{return null;}
 }
 publishSession(){if(!this.temp||!this.state.available)return;const key=this.state.document_id+':'+this.state.session_id;if(key===this.publishedSession)return;
  const f=path.join(this.temp,'clo_ai_context_session.json');fs.writeFileSync(f+'.tmp',JSON.stringify({document_id:this.state.document_id,context_session_id:this.state.session_id}));fs.renameSync(f+'.tmp',f);this.publishedSession=key;
 }
 update(snapshot,session){const r=super.update(snapshot,session);this.publishSession();return r;}
 resetDialogue(){const r=super.resetDialogue();this.publishSession();return r;}
 async refresh(fresh=false){
  if(this.refreshTask){if(fresh&&!this.refreshIsFresh){await this.refreshTask;return this.refresh(true);}return this.refreshTask;}
  this.refreshIsFresh=fresh;
  this.refreshTask=(async()=>{
   let b=this.readBridge();
   if(!b.connected){this.update(null,null);return this.publicState();}
   if(fresh){
    const nonce=randomUUID(),f=path.join(this.temp,'clo_ai_context_refresh.json');fs.writeFileSync(f+'.tmp',JSON.stringify({nonce}));fs.renameSync(f+'.tmp',f);
    const end=Date.now()+6000;
    do{await new Promise(r=>setTimeout(r,80));b=this.readBridge();if(!b.connected)break;if(b.project_refresh_nonce===nonce)break;}while(Date.now()<end);
    // A bridge lost while waiting must invalidate the old context now, rather
    // than leaving it usable until the next background refresh.
    if(!b.connected){this.update(null,null);throw Object.assign(Error('Соединение с CLO потеряно. Подключите мост и повторите запрос.'),{code:'project_unavailable'});}
    if(b.project_refresh_nonce!==nonce)throw Object.assign(Error('CLO не подтвердил актуальное состояние проекта. Обновите мост и повторите запрос.'),{code:'project_unavailable'});
   }
   if(!b.project?.available){this.update(null,null);return this.publicState();}
   this.update({...b.project,native_generation:b.project.generation},b.session);return this.publicState();
  })();
  try{return await this.refreshTask;}finally{this.refreshTask=null;}
 }
}
module.exports={ProjectContexts,ProjectRuntime,stale};
