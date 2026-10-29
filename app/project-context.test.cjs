const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ProjectContexts,ProjectRuntime}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs');
function setup(){const directory=testWorkspace.create('project-context-'),profiles=new BodyProfiles(path.join(directory,'body.json'));const c=new ProjectContexts({directory,profiles});return {c,profiles,directory};}
function snap(document='a',parts=[{pattern_id:1,name:'Перед',fingerprint:'shape-1'}],file='C:/a.zprj'){return {available:true,document_id:document,generation:1,revision:1,name:'Проект '+document,path:file,parts,content_digest:JSON.stringify(parts)};}
test('different projects isolate chat and reopening a saved project restores its conversation',()=>{
 const {c,profiles,directory}=setup();profiles.create({name:'Мерки'});c.update(snap(),'bridge');const a=c.state.session_id,oldFile=c.stores.conversation.file;
 c.stores.conversation.add('user','Секрет старого проекта: длина 700');c.stores.garments.data.draft={method:'old',parameters:{length_mm:700}};c.stores.garments.save();
 c.update(snap('b',[{pattern_id:9,name:'Спинка',fingerprint:'other'}],'C:/b.zprj'),'bridge');assert.notEqual(c.state.session_id,a);assert.deepEqual(c.stores.conversation.list(),[]);assert(!c.aiContext().garments.length);
 c.update(snap('a-reopened'),'bridge');assert.equal(c.state.session_id,a);assert.match(c.stores.conversation.list()[0].text,/700/);assert.equal(c.stores.garments.data.draft.method,'old');
 assert.match(fs.readFileSync(oldFile,'utf8'),/700/);assert.equal(profiles.snapshot().profiles.length,1);assert(fs.existsSync(path.join(directory,'body.json')));
});
test('content changes and save-as update context without clearing conversation',()=>{
 const {c}=setup();c.update(snap(),'bridge');const id=c.state.session_id;c.stores.conversation.add('user','Создай деталь');
 c.update(snap('a',[{pattern_id:1,name:'Новое имя',fingerprint:'moved'}]),'bridge');assert.equal(c.state.session_id,id);assert.equal(c.stores.conversation.list().length,1);
 c.update(snap('a',[],'C:/saved-as.zprj'),'bridge');assert.equal(c.state.session_id,id);assert(c.state.context_version>1);
});
test('tickets reject old project and old content; geometry claims require current native bindings',()=>{
 const {c}=setup();c.update(snap(),'bridge');const t=c.ticket();
 c.stores.garments.data.garments=[{id:'g',name:'Изделие',version:1,parameters:{length_mm:700},bindings:[{pattern_id:1,fingerprint:'shape-1'}]}];c.stores.garments.data.active='g';assert.equal(c.aiContext().garments.length,1);
 c.update(snap('a',[{pattern_id:1,name:'Перед',fingerprint:'changed'}]),'bridge');assert(c.isCurrent(t));assert.throws(()=>c.assert(t,true),/Содержимое/);assert.equal(c.aiContext().garments.length,0);
 c.update(snap('b',[],'C:/b.zprj'),'bridge');assert(!c.isCurrent(t));assert.throws(()=>c.assert(t),/сменился/);
});
test('manual new dialogue archives history and invalidates tickets without resetting profiles',()=>{
 const {c,profiles}=setup();c.update(snap(),'bridge');const t=c.ticket(),file=c.stores.conversation.file;c.stores.conversation.add('user','До нового диалога');
 c.resetDialogue();assert(c.state.available);assert(!c.isCurrent(t));assert.equal(c.profiles,profiles);assert.equal(c.stores.conversation.list().length,0);assert(fs.existsSync(file));
});
test('legacy root history and registries remain untouched and never become current by accident',()=>{
 const {profiles,directory}=setup(),legacy=['conversation.json','garments.json','semantic-patterns.json'];
 for(const file of legacy)fs.writeFileSync(path.join(directory,file),'legacy-user-data');
 const c=new ProjectContexts({directory,profiles});c.update(snap(),'bridge');
 assert.deepEqual(c.stores.conversation.list(),[]);assert.deepEqual(c.currentGarments(),[]);assert.deepEqual(c.currentPieces(),[]);
 for(const file of legacy)assert.equal(fs.readFileSync(path.join(directory,file),'utf8'),'legacy-user-data');
});
test('fresh native handshake reads current inventory and publishes session guard; disconnect invalidates tickets',async()=>{
 const {profiles,directory}=setup(),temp=path.join(directory,'native-temp');fs.mkdirSync(temp);
 const refreshFile=path.join(temp,'clo_ai_context_refresh.json');let connected=true;
 const c=new ProjectRuntime({directory,profiles,temp,readBridge:()=>({connected,session:'native',project:snap(),
  project_refresh_nonce:fs.existsSync(refreshFile)?JSON.parse(fs.readFileSync(refreshFile)).nonce:null})});
 await c.refresh(true);const ticket=c.ticket(),sessionFile=path.join(temp,'clo_ai_context_session.json');
 assert.deepEqual(JSON.parse(fs.readFileSync(sessionFile)),{document_id:'a',context_session_id:ticket.session_id});
 c.resetDialogue();assert.notEqual(JSON.parse(fs.readFileSync(sessionFile)).context_session_id,ticket.session_id);
 const newTicket=c.ticket();connected=false;await c.refresh();assert(!c.isCurrent(newTicket));assert(!c.state.available);
});

test('disconnect during a fresh handshake immediately invalidates the previous project and tickets',async()=>{
 const {profiles,directory}=setup(),temp=path.join(directory,'native-temp');fs.mkdirSync(temp);let reads=0;
 const c=new ProjectRuntime({directory,profiles,temp,readBridge:()=>++reads===1?{connected:true,session:'native',project:snap()}:{connected:false}});
 c.update(snap(),'native');const ticket=c.ticket(),oldConversation=c.stores.conversation;
 oldConversation.add('user','Запрос до потери соединения');
 await assert.rejects(c.refresh(true),e=>e.code==='project_unavailable');
 assert.equal(c.state.available,false);assert.equal(c.isCurrent(ticket),false);assert.throws(()=>c.ticket(),/Откройте проект/);
 assert.equal(c.stores.conversation,oldConversation);assert.equal(oldConversation.list().length,1);assert.deepEqual(c.currentGarments(),[]);
});

test('disconnect retains project stores and chat while invalidating native tickets; reconnect restores the same session',()=>{
 const {directory,profiles}=setup();let invalidations=0,changes=0;
 const c=new ProjectContexts({directory,profiles,onChange:()=>changes++,onInvalidate:()=>invalidations++});c.update(snap(),'bridge');
 c.stores.conversation.add('user','Не теряй контекст');const ticket=c.ticket(),stores=c.stores,session=c.state.session_id,changeCount=changes;
 c.stores.garments.data.draft={method:'parametric-draft',parameters:{hem_mm:420}};c.stores.garments.save();
 c.update(null,null);c.update(null,null);assert.equal(invalidations,1);assert.equal(changes,changeCount);assert.equal(c.stores,stores);assert.equal(c.state.session_id,session);assert(!c.isCurrent(ticket));
 c.update(snap(),'bridge-restarted');assert.equal(c.state.session_id,session);assert.equal(c.stores,stores);assert.equal(changes,changeCount);assert.equal(c.stores.conversation.list().length,1);assert(!c.isCurrent(ticket));
 assert.equal(c.stores.garments.data.draft.parameters.hem_mm,420);
 const fresh=c.ticket();c.update(snap('a',[{pattern_id:2,fingerprint:'new'}]),'bridge-restarted');assert(c.isCurrent(fresh));assert.equal(invalidations,1);
 c.update(snap('another',[],'C:/another.zprj'),'bridge-restarted');assert.equal(invalidations,2);assert.notEqual(c.state.session_id,session);assert.deepEqual(c.stores.conversation.list(),[]);
});

test('application and CLO restart restore a saved project even when every native ID changes, without trusting stale bindings',()=>{
 const {c,directory,profiles}=setup();c.update(snap(),'old-native');const project=c.state.project_id,session=c.state.session_id;
 c.stores.conversation.add('user','Увеличь только ширину низа');c.stores.conversation.add('assistant','Верх оставлен прежним',{context:JSON.stringify({parameters:{hem_mm:430}})});
 c.stores.garments.data.garments=[{id:'g',name:'Брюки',bindings:[{pattern_id:1,fingerprint:'shape-1'}]}];c.stores.garments.save();
 const reopened=new ProjectContexts({directory,profiles});reopened.update(snap('new-native',[{pattern_id:999,fingerprint:'reindexed'}]),'new-bridge');
 assert.equal(reopened.state.project_id,project);assert.equal(reopened.state.session_id,session);assert.equal(reopened.stores.conversation.list().length,2);assert.match(reopened.stores.conversation.input()[1].content,/430/);
 assert.deepEqual(reopened.currentGarments(),[]);assert.throws(()=>reopened.assertGarment('g'),/отсутствуют или изменены/);
});

test('an empty saved project persists chat, but installed startup templates and managed backups never merge unrelated documents',()=>{
 for(const file of ['C:/Program Files/CLO/Preset/Project/CLO/Default_Modelist.zprj','C:/Temp/CLO_AI_Backups/batch_abc.zprj']){
  const {c,directory,profiles}=setup();c.update(snap('first',[],file),'bridge');c.stores.conversation.add('user','Только для этого документа');
  const first=c.state.project_id;const reopened=new ProjectContexts({directory,profiles});reopened.update(snap('second',[],file),'new-bridge');
  assert.notEqual(reopened.state.project_id,first);assert.deepEqual(reopened.stores.conversation.list(),[]);
 }
 const {c,directory,profiles}=setup();c.update(snap('first',[],'C:/Мои проекты/Пустой.zprj'),'bridge');c.stores.conversation.add('user','Начали обсуждение без деталей');const session=c.state.session_id;
 const reopened=new ProjectContexts({directory,profiles});reopened.update(snap('second',[],'c:\\МОИ ПРОЕКТЫ\\Пустой.zprj'),'new-bridge');assert.equal(reopened.state.session_id,session);assert.equal(reopened.stores.conversation.list().length,1);
});

test('legacy sessions migrate to latest nonempty history; an explicitly reset empty conversation stays empty after restart',()=>{
 const {c,directory,profiles}=setup();c.update(snap(),'bridge');const record=c.data.projects[0],session=c.state.session_id;
 c.stores.conversation.add('user','Старая история сохраняется');delete record.active_session_id;c.save();
 const empty='00000000-0000-4000-8000-000000000000';fs.writeFileSync(path.join(c.folder(record),'sessions',empty+'.json'),JSON.stringify({version:1,messages:[]}));
 const migrated=new ProjectContexts({directory,profiles});migrated.update(snap('reopen'),'new');assert.equal(migrated.state.session_id,session);
 migrated.resetDialogue();const reset=migrated.state.session_id;const again=new ProjectContexts({directory,profiles});again.update(snap('reopen-again'),'newer');assert.equal(again.state.session_id,reset);assert.deepEqual(again.stores.conversation.list(),[]);
});

test('verified committed receipt recovers the conversation split off by an older backup-path bug, once only',()=>{
 const {c,directory,profiles}=setup(),temp=path.join(directory,'native-temp');fs.mkdirSync(temp);
 c.update(snap('before',[],'C:/Program Files/CLO/Preset/Project/CLO/Default_Modelist.zprj'),'bridge');c.stores.conversation.add('user','Сконструируй футболку');const project=c.state.project_id,session=c.state.session_id;
 const native=snap('before',[{pattern_id:77,fingerprint:'shirt'}],path.join(temp,'CLO_AI_Backups','batch_test.zprj'));
 // Simulate the buggy version having archived the original conversation and
 // selected a new empty context for the backup filename.
 c.update({...native,document_id:'false-boundary'},'bridge');assert.notEqual(c.state.project_id,project);
 const receipt={id:'11111111-1111-4111-8111-111111111111',project_guard:{document_id:'before',context_session_id:session},transaction:{stage:'committed'},backup:native.path,project_snapshot:native};
 fs.writeFileSync(path.join(temp,'clo_ai_job_result.json'),JSON.stringify(receipt));
 const runtime=new ProjectRuntime({directory,profiles,temp,readBridge:()=>null});runtime.update(native,'bridge');assert.equal(runtime.state.project_id,project);assert.equal(runtime.state.session_id,session);assert.equal(runtime.recoveryReceipt.id,receipt.id);assert.match(runtime.stores.conversation.list()[0].text,/футболку/);
 assert.equal(runtime.state.name,'Проект before');assert.match(runtime.state.path,/Default_Modelist/);assert.equal(runtime.state.native_path,native.path);
 const originalRecovery=runtime.receiptRecovery;runtime.receiptRecovery=()=>{throw Error('Повторное чтение транзакции при обычном опросе');};runtime.update(native,'bridge');assert.match(runtime.state.path,/Default_Modelist/);runtime.receiptRecovery=originalRecovery;
 runtime.resetDialogue();const reset=runtime.state.session_id;runtime.update(native,'bridge');assert.equal(runtime.state.session_id,reset);assert.deepEqual(runtime.stores.conversation.list(),[]);
 const restarted=new ProjectRuntime({directory,profiles,temp,readBridge:()=>null});restarted.update(native,'bridge');assert.equal(restarted.state.session_id,reset);
 assert.match(restarted.state.path,/Default_Modelist/);assert.equal(restarted.state.name,'Проект before');
});

test('receipt recovery rejects unrelated, incomplete or failed native results',()=>{
 for(const corrupt of [r=>r.project_snapshot.content_digest='different',r=>r.project_snapshot.document_id='other',r=>r.project_guard.document_id='other',r=>r.transaction.stage='failed',r=>r.error='Ошибка',r=>r.backup='C:/user-project.zprj']){
  const {c,directory,profiles}=setup(),temp=path.join(directory,'native-temp');fs.mkdirSync(temp);c.update(snap('old',[],null),'bridge');c.stores.conversation.add('user','Не переносить в чужой проект');const old=c.state.project_id;
  const native=snap('current',[{pattern_id:4,fingerprint:'current'}],null),receipt={id:'11111111-1111-4111-8111-111111111111',project_guard:{document_id:'current',context_session_id:c.state.session_id},transaction:{stage:'committed'},backup:'C:/Temp/CLO_AI_Backups/batch_test.zprj',project_snapshot:JSON.parse(JSON.stringify(native))};corrupt(receipt);fs.writeFileSync(path.join(temp,'clo_ai_job_result.json'),JSON.stringify(receipt));
  const runtime=new ProjectRuntime({directory,profiles,temp,readBridge:()=>null});runtime.update(native,'bridge');assert.notEqual(runtime.state.project_id,old);assert.equal(runtime.recoveryReceipt,undefined);assert.deepEqual(runtime.stores.conversation.list(),[]);
 }
});
module.exports={setup,snap};
