const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const testWorkspace=require('./test-workspace.cjs');
const {create}=require('./bridge-sync.cjs');
const revision=values=>{const h=createHash('sha256');for(const value of values)h.update(value);return h.digest('hex');};
function setup(t,{watch=false,watcherFactory}={}){
 const folder=testWorkspace.create('bridge-sync-'),root=path.join(folder,'source'),temp=path.join(folder,'native');
 fs.mkdirSync(path.join(root,'engineering'),{recursive:true});fs.mkdirSync(temp);
 let updater;t.after(()=>updater?.dispose());
 const files=['clo_bridge.py','engineering/core.py'];for(const [index,name]of files.entries())fs.writeFileSync(path.join(root,name),['bridge-v1','engine-v1'][index]);
 const reads=[],writes=[],renames=[];let time=0,failRename=null,maskStats=null,afterRead=null;
 const io=new Proxy(fs,{get(target,key){
  if(key==='readFileSync')return (file,...args)=>{reads.push(file);const data=fs.readFileSync(file,...args);afterRead?.(file);return data;};
  if(key==='statSync')return file=>maskStats?.get(file)||fs.statSync(file);
  if(key==='writeFileSync')return (file,...args)=>{writes.push(file);return fs.writeFileSync(file,...args);};
  if(key==='renameSync')return (from,to)=>{if(to===failRename)throw Object.assign(Error('Тест: файл занят'),{code:'EACCES'});renames.push([from,to]);return fs.renameSync(from,to);};
  if(key==='watch'&&watcherFactory)return watcherFactory;
  return typeof target[key]==='function'?target[key].bind(target):target[key];
 }});
 updater=create({root,temp,files,io,now:()=>time,verifyInterval:30000,watch});const manifest=path.join(temp,'clo_ai_bridge_update.json');
 return {folder,root,temp,files,reads,writes,renames,updater,manifest,source:name=>path.join(root,name),target:name=>path.join(temp,name),time:value=>time=value,fail:value=>failRename=value,mask:value=>maskStats=value,afterRead:fn=>afterRead=fn};
}
test('initial synchronization preserves the existing SHA256 revision and publishes all files before the manifest',t=>{
 const h=setup(t),result=h.updater.sync();assert.equal(result.revision,revision(['bridge-v1','engine-v1']));assert.equal(result.sourceReads,2);assert.deepEqual(result.updatedFiles,h.files);
 assert.equal(JSON.parse(fs.readFileSync(h.manifest)).revision,result.revision);
 for(const file of h.files)assert(fs.readFileSync(h.source(file)).equals(fs.readFileSync(h.target(file))));
 assert.equal(h.renames.at(-1)[1],h.manifest);assert.equal(fs.readdirSync(h.temp).filter(name=>name.includes('.tmp')).length,0);
});
test('ordinary unchanged polling reads no file contents, hashes no new source buffers and leaves destination timestamps alone',t=>{
 const h=setup(t);h.updater.sync();const timestamps=h.files.map(file=>fs.statSync(h.target(file)).mtimeMs),manifestTime=fs.statSync(h.manifest).mtimeMs;h.reads.length=0;h.writes.length=0;
 for(let i=1;i<=14;i++){h.time(i*2000);const r=h.updater.sync();assert.equal(r.sourceReads,0);assert.equal(r.verifiedTargets,0);assert.equal(r.manifestWritten,false);assert.deepEqual(r.updatedFiles,[]);}
 assert.deepEqual(h.reads,[]);assert.deepEqual(h.writes,[]);assert.deepEqual(h.files.map(file=>fs.statSync(h.target(file)).mtimeMs),timestamps);assert.equal(fs.statSync(h.manifest).mtimeMs,manifestTime);
});
test('a changed source is updated on the next poll even when its size and original mtime are preserved',t=>{
 const h=setup(t);const original=h.updater.sync().revision,file=h.source(h.files[0]),stat=fs.statSync(file);fs.writeFileSync(file,'bridge-v2');fs.utimesSync(file,stat.atime,stat.mtime);
 h.time(2000);const result=h.updater.sync();assert.notEqual(result.revision,original);assert.equal(result.sourceReads,1);assert.deepEqual(result.updatedFiles,[h.files[0]]);assert.equal(fs.readFileSync(h.target(h.files[0]),'utf8'),'bridge-v2');
});
test('missing or corrupted bridge copies are repaired although the manifest already has the current revision',t=>{
 const h=setup(t),original=h.updater.sync().revision;const state=path.join(h.temp,'clo_ai_bridge.json');fs.writeFileSync(state,'active user state');fs.unlinkSync(h.target(h.files[0]));fs.writeFileSync(h.target(h.files[1]),'corrupted');
 const result=h.updater.sync();assert.equal(result.revision,original);assert.deepEqual(result.updatedFiles,h.files);assert.equal(result.sourceReads,0);assert.equal(fs.readFileSync(state,'utf8'),'active user state');
 for(const name of h.files)assert(fs.readFileSync(h.source(name)).equals(fs.readFileSync(h.target(name))));
});
test('periodic byte verification catches changes hidden by coarse or preserved stat metadata',t=>{
 const h=setup(t),original=h.updater.sync().revision,stamps=new Map();for(const file of [...h.files.map(h.source),...h.files.map(h.target),h.manifest])stamps.set(file,fs.statSync(file));h.mask(stamps);
 fs.writeFileSync(h.source(h.files[0]),'bridge-v3');fs.writeFileSync(h.target(h.files[1]),'tampering');h.time(2000);assert.deepEqual(h.updater.sync().updatedFiles,[]);
 h.time(30000);const result=h.updater.sync();assert.equal(result.sourceReads,2);assert.equal(result.verifiedTargets,2);assert.notEqual(result.revision,original);assert.deepEqual(result.updatedFiles,h.files);
 assert.equal(fs.readFileSync(h.target(h.files[0]),'utf8'),'bridge-v3');assert.equal(fs.readFileSync(h.target(h.files[1]),'utf8'),'engine-v1');
});
test('invalid and foreign manifests are atomically replaced without rewriting correct bridge modules',t=>{
 const h=setup(t),hash=h.updater.sync().revision;for(const data of ['{invalid',JSON.stringify({revision:'foreign'})]){fs.writeFileSync(h.manifest,data);const r=h.updater.sync();assert(r.manifestWritten);assert.deepEqual(r.updatedFiles,[]);assert.equal(JSON.parse(fs.readFileSync(h.manifest)).revision,hash);}
});
test('a missing source or failed destination replacement leaves the prior manifest and can retry without a partial cache commit',t=>{
 const h=setup(t),original=h.updater.sync().revision;fs.unlinkSync(h.source(h.files[1]));assert.throws(()=>h.updater.sync(),/Не найден файл моста/);assert.equal(JSON.parse(fs.readFileSync(h.manifest)).revision,original);
 fs.writeFileSync(h.source(h.files[0]),'bridge-v2');fs.writeFileSync(h.source(h.files[1]),'engine-v2');h.fail(h.target(h.files[1]));assert.throws(()=>h.updater.sync(),/файл занят/);assert.equal(JSON.parse(fs.readFileSync(h.manifest)).revision,original);
 assert(fs.readdirSync(path.dirname(h.target(h.files[1]))).every(name=>!name.endsWith('.tmp')));h.fail(null);const result=h.updater.sync();assert.equal(result.revision,revision(['bridge-v2','engine-v2']));assert.notEqual(result.revision,original);assert.equal(fs.readFileSync(h.target(h.files[1]),'utf8'),'engine-v2');
});
test('source edits during reading are retried before publishing the resulting exact bytes',t=>{
 const h=setup(t);let edited=false;h.afterRead(file=>{if(file===h.source(h.files[0])&&!edited){edited=true;fs.writeFileSync(file,'bridge-edited-during-read');}});const r=h.updater.sync();assert.equal(r.sourceReads,3);assert.equal(r.revision,revision(['bridge-edited-during-read','engine-v1']));assert.equal(fs.readFileSync(h.target(h.files[0]),'utf8'),'bridge-edited-during-read');
});
test('synchronization rejects paths outside either fixed root and duplicate entries',t=>{
 const h=setup(t);for(const files of [['../outside.py'],['engineering/../../outside.py'],['/outside.py'],['clo_bridge.py','clo_bridge.py']])assert.throws(()=>create({root:h.root,temp:h.temp,files}));
});
test('native filtered watchers make idle polling zero-IO and still publish source edits and repair target corruption',async t=>{
 const h=setup(t,{watch:true});h.updater.sync();const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 // Windows notifications may arrive after an arbitrary 40 ms on a busy host.
 // Wait for an actual quiet cache instead of treating scheduler timing as API.
 async function settled(){const end=Date.now()+2000;let quiet=0;while(Date.now()<end){await pause(20);quiet=h.updater.sync().cacheHit?quiet+1:0;if(quiet===2)return;}assert.fail('Файловый наблюдатель не вернулся к спокойному опросу');}
 await settled();h.reads.length=0;assert.equal(h.updater.sync().cacheHit,true);assert.deepEqual(h.reads,[]);
 async function changed(name){const end=Date.now()+2000;while(Date.now()<end){await pause(20);const result=h.updater.sync();if(result.updatedFiles.includes(name))return result;}assert.fail('Изменение не замечено файловым наблюдателем');}
 fs.writeFileSync(h.source(h.files[0]),'bridge-watch-edit');await changed(h.files[0]);assert.equal(fs.readFileSync(h.target(h.files[0]),'utf8'),'bridge-watch-edit');
 fs.writeFileSync(h.target(h.files[1]),'broken-file');await changed(h.files[1]);assert.equal(fs.readFileSync(h.target(h.files[1]),'utf8'),'engine-v1');
 await settled();h.reads.length=0;
 fs.writeFileSync(path.join(h.temp,'clo_ai_bridge.json'),'heartbeat');await settled();assert.equal(h.updater.sync().cacheHit,true);assert.deepEqual(h.reads,[]);
});
test('watcher errors and unavailable watch support fall back to checked polling rather than trusting an idle cache',t=>{
 const {EventEmitter}=require('node:events'),watchers=[];let broken=false,closed=0;
 const h=setup(t,{watch:true,watcherFactory:()=>{if(broken)throw Error('Тест: наблюдение недоступно');const e=new EventEmitter();e.close=()=>closed++;watchers.push(e);return e;}});
 h.updater.sync();assert.equal(h.updater.sync().cacheHit,true);broken=true;watchers[0].emit('error',Error('Тест: наблюдатель закрыт'));fs.writeFileSync(h.source(h.files[0]),'bridge-after-watch-error');
 const result=h.updater.sync();assert.equal(result.cacheHit,undefined);assert.deepEqual(result.updatedFiles,[h.files[0]]);assert(closed>0);
 fs.writeFileSync(h.target(h.files[1]),'corrupt-after-error');assert.deepEqual(h.updater.sync().updatedFiles,[h.files[1]]);
});
test('periodic verification does not depend on watcher delivery or metadata changing',t=>{
 const {EventEmitter}=require('node:events'),h=setup(t,{watch:true,watcherFactory:()=>{const e=new EventEmitter();e.close=()=>{};return e;}});h.updater.sync();
 const frozen=new Map();for(const file of [...h.files.map(h.source),...h.files.map(h.target),h.manifest])frozen.set(file,fs.statSync(file));h.mask(frozen);
 fs.writeFileSync(h.source(h.files[0]),'bridge-v4');fs.writeFileSync(h.target(h.files[1]),'corruption');h.time(2000);assert.equal(h.updater.sync().cacheHit,true);
 h.time(30000);const result=h.updater.sync();assert.equal(result.sourceReads,2);assert.deepEqual(result.updatedFiles,h.files);assert.equal(fs.readFileSync(h.target(h.files[0]),'utf8'),'bridge-v4');
});
