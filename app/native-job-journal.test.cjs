const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const journal=require('./native-job-journal.cjs'),{ProjectContexts}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs');
function fixture(t){
 const directory=fs.mkdtempSync(path.join(__dirname,'..','research','native-journal-')),temp=path.join(directory,'native-temp');fs.mkdirSync(temp);
 t.after(()=>{assert.equal(path.dirname(directory),path.resolve(__dirname,'../research'));fs.rmSync(directory,{recursive:true,force:true});});
 const profiles=new BodyProfiles(path.join(directory,'profiles.json')),runtime=new ProjectContexts({directory,profiles});
 const snapshot={available:true,document_id:randomUUID(),generation:1,name:'Футболка',path:'C:/Мои проекты/Футболка.zprj',content_digest:'empty',parts:[]};
 runtime.update(snapshot,'bridge');runtime.stores.conversation.add('user','Создай футболку');
 const recipe=runtime.stores.semantics.prepare([{type:'rectangle',width_mm:100,height_mm:200}])[0];
 const job={id:randomUUID(),project_ticket:runtime.ticket(),project_guard:runtime.nativeGuard(runtime.ticket()),patterns:[recipe]};
 const part={pattern_index:0,clo_pattern_id:42,name:recipe.semantic.name,fingerprint:'verified-shape',semantic:{parameters:{width_mm:100,height_mm:200},contour:[]}};
 const after={...snapshot,content_digest:'with-pattern',parts:[{pattern_id:42,name:part.name,fingerprint:part.fingerprint}]};
 const result={id:job.id,project_guard:job.project_guard,transaction:{stage:'committed'},project_snapshot:after,patterns:[part]};
 return {directory,temp,profiles,runtime,snapshot,after,job,result,writeResult(value=result){fs.writeFileSync(path.join(temp,'clo_ai_job_result.json'),JSON.stringify(value));}};
}
test('native command is saved before dispatch and a different command cannot replace the same journal entry',t=>{
 const h=fixture(t);journal.queue(h.runtime.stores.conversation,h.job);journal.queue(h.runtime.stores.conversation,h.job);
 assert.throws(()=>journal.queue(h.runtime.stores.conversation,{...h.job,patterns:[]}),/уже использован/);
 assert.throws(()=>journal.queue(h.runtime.stores.conversation,{...h.job,project_ticket:{...h.job.project_ticket,session_id:randomUUID()}}),/другому проекту/);
 assert.throws(()=>journal.queue(h.runtime.stores.conversation,{...h.job,id:'../other'}),/идентификатор/);
});
test('restart restores confirmed geometry metadata and one result without applying any CLO command',t=>{
 const h=fixture(t);journal.queue(h.runtime.stores.conversation,h.job);h.writeResult();
 const restarted=new ProjectContexts({directory:h.directory,profiles:h.profiles});restarted.update(h.after,'reconnected-bridge');
 assert.equal(restarted.state.session_id,h.job.project_ticket.session_id);assert(journal.recover(restarted,h.temp).restored);
 assert.equal(restarted.currentPieces().length,1);assert.equal(restarted.stores.conversation.list().length,2);
 assert.equal(restarted.stores.conversation.list().at(-1).recovered,true);assert(!fs.existsSync(path.join(h.temp,'clo_ai_apply.json')));
 assert(!journal.recover(restarted,h.temp).restored);
 const again=new ProjectContexts({directory:h.directory,profiles:h.profiles});again.update(h.after,'same-native');
 assert(!journal.recover(again,h.temp).restored);assert.equal(again.stores.conversation.list().length,2);
});
test('legacy temporary receipt recovers only its own project/session and preserves the original command',t=>{
 const h=fixture(t);h.runtime.update(h.after,'bridge');h.writeResult();const command=JSON.stringify(h.job),target=path.join(h.temp,'clo_ai_apply.json');fs.writeFileSync(target,command);
 assert(journal.recover(h.runtime,h.temp).restored);assert.equal(fs.readFileSync(target,'utf8'),command);
 assert.equal(h.runtime.currentPieces()[0].clo.pattern_id,42);
});
test('recovery rejects unconfirmed, unrelated, modified, incomplete and wrong native targets',t=>{
 const h=fixture(t);h.runtime.update(h.after,'bridge');
 for(const mutate of [
  r=>{r.error='Откат';},r=>{r.transaction.stage='partial';},r=>{r.project_guard.context_session_id=randomUUID();},
  r=>{r.project_snapshot.document_id=randomUUID();},r=>{r.project_snapshot.content_digest='other';},
  r=>{r.patterns[0].fingerprint='moved';},r=>{r.patterns[0].clo_pattern_id=99;},r=>{r.patterns=[];},r=>{r.transaction.requires_manual_recovery=true;},
 ]){const r=structuredClone(h.result);mutate(r);assert(!journal.verified(h.runtime,h.job,r));}
 assert(!journal.verified(h.runtime,{...h.job,project_ticket:{...h.job.project_ticket,project_id:randomUUID()}},h.result));
 assert.equal(h.runtime.currentPieces().length,0);assert.equal(h.runtime.stores.conversation.list().length,1);
});
test('a transient semantic registry write failure rolls back memory and recovery can persist the same receipt later',t=>{
 const h=fixture(t);journal.queue(h.runtime.stores.conversation,h.job);h.runtime.update(h.after,'bridge');h.writeResult();
 const rename=fs.renameSync,semanticFile=h.runtime.stores.semantics.file;
 const failure=t.mock.method(fs,'renameSync',function(source,target){if(target===semanticFile)throw Object.assign(Error('Тест: диск занят'),{code:'EBUSY'});return rename.call(fs,source,target);});
 assert.throws(()=>journal.recover(h.runtime,h.temp),/диск занят/);assert.equal(h.runtime.currentPieces().length,0);assert.equal(h.runtime.stores.conversation.list().length,1);
 failure.mock.restore();assert(journal.recover(h.runtime,h.temp).restored);
 assert.equal(JSON.parse(fs.readFileSync(semanticFile,'utf8')).pieces.length,1);assert.equal(h.runtime.stores.conversation.list().at(-1).kind,'success');
 assert.equal(h.runtime.stores.conversation.data.dialogue.stage,'review');
});
test('live result handling owns an in-flight job; recovery waits instead of racing its commit',t=>{
 const h=fixture(t);journal.queue(h.runtime.stores.conversation,h.job);h.runtime.update(h.after,'bridge');h.writeResult();
 assert(!journal.recover(h.runtime,h.temp,new Map([[h.job.id,h.job]])).restored);assert.equal(h.runtime.currentPieces().length,0);
 assert(journal.recover(h.runtime,h.temp,new Map()).restored);
});
test('a completed native receipt cannot overwrite a more recent local garment version',t=>{
 const h=fixture(t);h.job.garment={id:'garment',version:1};h.runtime.stores.garments.data.garments.push({id:'garment',version:2});
 journal.queue(h.runtime.stores.conversation,h.job);h.runtime.update(h.after,'bridge');h.writeResult();assert(!journal.recover(h.runtime,h.temp).restored);
 assert.equal(h.runtime.stores.garments.data.garments[0].version,2);assert.equal(h.runtime.currentPieces().length,0);
});
