// A bounded cache for the fixed bridge file set: filtered watches invalidate
// it, and periodic byte verification also catches preserved timestamps.
const fs=require('node:fs'),path=require('node:path'),{createHash,randomUUID}=require('node:crypto');
const {writeJSON}=require('./atomic-json.cjs');
const signature=stat=>[stat.size,stat.mtimeMs,stat.ctimeMs,stat.ino].join(':');
function inside(root,name){
 if(typeof name!=='string'||!name||name.includes('\0')||name.includes('\\')||path.isAbsolute(name)||name.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Некорректный путь файла моста');
 const file=path.resolve(root,name),relative=path.relative(root,file);if(relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative))throw Error('Файл моста находится вне рабочей папки');return file;
}
function create({root,temp,files,io=fs,now=()=>Date.now(),verifyInterval=30000,watch=true}){
 root=path.resolve(root);temp=path.resolve(temp);
 if(!Array.isArray(files)||!files.length||new Set(files).size!==files.length||files.length>128)throw Error('Некорректный список файлов моста');
 if(!Number.isFinite(verifyInterval)||verifyInterval<1000||verifyInterval>300000)throw Error('Некорректный интервал проверки моста');
 const inventory=files.map(name=>({name,source:inside(root,name),target:inside(temp,name)})),manifest=path.join(temp,'clo_ai_bridge_update.json');
 let sources=new Map(),targets=new Map(),lastVerified=-Infinity,revision=null,manifestStamp=null,manifestRevision=null,dirty=true,watchHealthy=false,rearm=false;
 const watchers=[];
 function closeWatchers(){while(watchers.length){try{watchers.pop().close();}catch{}}watchHealthy=false;}
 function watchFiles(){
  if(!watch||typeof io.watch!=='function')return;
  closeWatchers();const directories=new Map();
  function entry(file){const directory=path.dirname(file);if(!directories.has(directory))directories.set(directory,new Set());directories.get(directory).add(path.basename(file).toLowerCase());}
  for(const row of inventory){entry(row.source);entry(row.target);}entry(manifest);
  // A parent directory rename invalidates the watch on its former child.
  for(const directory of [...directories.keys()])if(directories.has(path.dirname(directory)))entry(directory);
  try{
   for(const [directory,names]of directories){const watcher=io.watch(directory,{persistent:false},(event,file)=>{
    const name=file==null?null:String(file).toLowerCase();if(name===null||names.has(name)){dirty=true;if(event==='rename')rearm=true;}
   });watcher.on('error',()=>{dirty=true;watchHealthy=false;rearm=true;});watchers.push(watcher);}
   watchHealthy=true;rearm=false;
  }catch{closeWatchers();dirty=true;}
 }
 function stamp(file){try{const stat=io.statSync(file);if(!stat.isFile())throw Error('Путь моста не является файлом');return signature(stat);}catch(error){if(error.code==='ENOENT')return null;throw error;}}
 function source(row,force,stats){
  const before=stamp(row.source),cached=sources.get(row.name);if(!before)throw Error('Не найден файл моста: '+row.name);
  if(!force&&cached?.stamp===before)return cached;
  for(let attempt=0;attempt<2;attempt++){
   const first=stamp(row.source),data=io.readFileSync(row.source);stats.sourceReads++;
   const after=stamp(row.source);if(first===after)return {stamp:after,data};
  }
  throw Error('Файл моста изменился во время чтения: '+row.name);
 }
 function replace(file,data){
  io.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.clo-ai-'+process.pid+'-'+randomUUID()+'.tmp';
  try{io.writeFileSync(temporary,data,{flag:'wx'});io.renameSync(temporary,file);}finally{try{io.unlinkSync(temporary);}catch{}}
 }
 function sync(){
  const time=now(),force=!revision||time<lastVerified||time-lastVerified>=verifyInterval,stats={sourceReads:0,verifiedTargets:0,updatedFiles:[],manifestWritten:false};
  if(!force&&watchHealthy&&!dirty)return {revision,...stats,cacheHit:true};
  dirty=false;
  try{
  const nextSources=new Map();let sourceChanged=!revision;
  for(const row of inventory){const next=source(row,force,stats);nextSources.set(row.name,next);if(next!==sources.get(row.name))sourceChanged=true;}
  let nextRevision=revision;
  if(sourceChanged){const hash=createHash('sha256');for(const row of inventory)hash.update(nextSources.get(row.name).data);nextRevision=hash.digest('hex');}
  const currentManifestStamp=stamp(manifest);
  if(force||currentManifestStamp!==manifestStamp||!currentManifestStamp){
   try{manifestRevision=JSON.parse(io.readFileSync(manifest,'utf8')).revision;}catch(error){if(error.code&&error.code!=='ENOENT')throw error;manifestRevision=null;}
   manifestStamp=currentManifestStamp;
  }
  const nextTargets=new Map();
  for(const row of inventory){
   const current=stamp(row.target),previous=targets.get(row.name),expected=nextSources.get(row.name);
   let valid=!force&&!sourceChanged&&current!==null&&current===previous;
   if(!valid&&current!==null){stats.verifiedTargets++;valid=io.readFileSync(row.target).equals(expected.data);}
   if(!valid){replace(row.target,expected.data);stats.updatedFiles.push(row.name);}
   nextTargets.set(row.name,stamp(row.target));
  }
  // Publish only after every source has been staged and every target verified.
  // A failed copy leaves the old manifest and cache available for the next poll.
  if(manifestRevision!==nextRevision){writeJSON(manifest,{revision:nextRevision},{io});stats.manifestWritten=true;manifestRevision=nextRevision;manifestStamp=stamp(manifest);}
  sources=nextSources;targets=nextTargets;revision=nextRevision;if(force)lastVerified=time;
  if(force||rearm||!watchHealthy)watchFiles();
  return {revision,...stats};
  }catch(error){dirty=true;throw error;}
 }
 return {sync,dispose:closeWatchers};
}
module.exports={create};
