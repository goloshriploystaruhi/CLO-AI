const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {ProjectContexts}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs');
function snapshot(id='a',parts=[]){return {available:true,document_id:id,generation:1,name:'Проект '+id,path:'C:/'+id+'.zprj',parts,content_digest:JSON.stringify(parts)};}
function setup(){
 const folder=testWorkspace.create('project-ipc-'),profiles=new BodyProfiles(path.join(folder,'body.json'));let context,handler,latest=snapshot(),reply=async()=>({message:'Ответ текущего проекта'}),disconnects=0,calls=[];
 const runtime=new ProjectContexts({directory:folder,profiles,onChange:stores=>{if(context){Object.assign(context,stores);context.pendingJob=null;context.semanticJobs.clear();context.creatingChat=false;}}});runtime.update(latest,'bridge');runtime.refresh=async()=>runtime.update(latest,'bridge');
 const client={getSession:async()=>({sharing:true,status:'connected'}),disconnect:async()=>{disconnects++;},streamResponse:async options=>{calls.push(options);return {text:JSON.stringify(await reply(options))};}};
 context=vm.createContext({require:createRequire(path.join(__dirname,'main.cjs')),...runtime.stores,projectRuntime:runtime,client,commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,session:'bridge',version:3}),ipcMain:{handle(name,fn){handler=fn;}}});
 const source=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');vm.runInContext(source.slice(source.indexOf(' async function prepareJob('),source.indexOf(' const win=new BrowserWindow')),context);
 return {folder,runtime,context,profiles,calls,handler,reply(fn){reply=fn;},set(snapshot){latest=snapshot;},get disconnects(){return disconnects;},send:text=>handler({},'create',{text,model:'test',project_session:runtime.state.session_id})};
}
test('late AI answer is discarded and does not block a new project or leak its history',async()=>{
 const h=setup();h.profiles.create({name:'Глобальный профиль'});let resolve,started;
 const began=new Promise(r=>started=r);h.reply(async()=>{started();return await new Promise(r=>resolve=r);});
 const old=h.send('Предыдущий проект: ширина 321 мм');await began;
 const oldConversation=h.runtime.stores.conversation,oldFile=oldConversation.file;
 h.set(snapshot('b'));await h.handler({},'project-state');h.reply(async()=>({message:'Чистый проект B'}));
 const fresh=await h.send('Что в новом проекте?');assert.match(fresh.message,/Чистый/);
 resolve({message:'Запоздавший секрет 321'});assert((await old).cancelled);
 assert(!h.runtime.stores.conversation.list().some(m=>m.text.includes('321')));
 assert(!h.calls.at(-1).input.some(m=>m.content.includes('321')));assert.match(fs.readFileSync(oldFile,'utf8'),/321/);
 assert.equal(h.disconnects,0);assert.equal(h.profiles.snapshot().profiles.length,1);
});
test('prepared command cannot apply after project change; late result is not returned',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));
 const job=await h.send('Создай 100 на 200 мм');assert(job.project_guard);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
 h.set(snapshot('b'));const applied=await h.handler({},'apply',job.id);assert(applied.error);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
 fs.writeFileSync(path.join(h.folder,'clo_ai_job_result.json'),JSON.stringify({id:job.id,project_guard:job.project_guard,patterns:[{}]}));assert.equal(await h.handler({},'result'),null);
 assert.equal(h.runtime.stores.semantics.list().length,0);
});
test('content change preserves chat and cancels a stale prepared operation',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));const job=await h.send('Создай 100 на 200 мм'),session=h.runtime.state.session_id;
 h.set(snapshot('a',[{pattern_id:44,fingerprint:'actual',name:'Ручная деталь'}]));
 const result=await h.handler({},'apply',job.id);assert.match(result.error,/Содержимое/);assert.equal(h.runtime.state.session_id,session);assert(h.runtime.stores.conversation.list().length);
 h.reply(async()=>({message:'Актуальная ручная деталь'}));await h.send('Что есть сейчас?');assert.match(h.calls.at(-1).instructions,/Ручная деталь/);
});
test('successful native construction keeps the same dialogue and persists its result across application restart',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));
 const job=await h.send('Создай деталь 100 на 200 мм'),session=h.runtime.state.session_id,project=h.runtime.state.project_id;
 assert((await h.handler({},'apply',job.id)).queued);
 assert(fs.existsSync(path.join(h.folder,'project-contexts',project,'native-jobs',job.id+'.json')));
 const part={pattern_index:0,clo_pattern_id:51,name:'Новая деталь',fingerprint:'native-confirmed',semantic:{parameters:{width_mm:100,height_mm:200},contour:[]}};
 const after=snapshot('a',[{pattern_id:51,name:part.name,fingerprint:part.fingerprint}]);h.set(after);
 fs.writeFileSync(path.join(h.folder,'clo_ai_job_result.json'),JSON.stringify({id:job.id,project_guard:job.project_guard,transaction:{stage:'committed'},project_snapshot:after,patterns:[part]}));
 assert.equal((await h.handler({},'result')).id,job.id);assert.equal(h.runtime.state.session_id,session);
 const history=await h.handler({},'chat-history',{session_id:session});assert(history.some(message=>message.event===job.id&&message.kind==='success'));
 const reopened=new ProjectContexts({directory:h.folder,profiles:h.profiles});reopened.update({...after,document_id:'new-native-id'},'new-clo-process');
 assert.equal(reopened.state.project_id,project);assert.equal(reopened.state.session_id,session);assert.deepEqual(reopened.stores.conversation.list().map(m=>m.text),history.map(m=>m.text));
 assert.equal(reopened.currentPieces().length,1);
});
test('new dialogue invalidates old queued session while GPT and profiles stay global',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));const job=await h.send('Создай деталь');
 const ticket=job.project_ticket;await h.handler({},'new-dialogue');assert(!h.runtime.isCurrent(ticket));assert.equal(h.runtime.stores.conversation.list().length,0);assert.equal(h.disconnects,0);
 assert((await h.handler({},'apply',job.id)).error);
});
test('assembly confirmation is cancelled on project change before native dispatch',async()=>{
 const h=setup();h.set(snapshot('a',[{pattern_id:10,name:'Перед',fingerprint:'shape'}]));await h.handler({},'project-state');
 h.runtime.stores.garments.data.garments.push({id:'g',name:'Изделие',version:1,pieces:[{id:'p'}],bindings:[{id:'p',pattern_id:10,fingerprint:'shape'}]});
 const offer=await h.handler({},'assembly-offer',{query:'g'});const job=await h.handler({},'assembly-action',{id:offer.id,action:'check',confirmed:true});assert.equal(job.operation,'assembly_preflight');
 assert((await h.send('Создай другую деталь')).error);assert((await h.handler({},'assembly-action',{id:offer.id,action:'check',confirmed:true})).error);
 h.set(snapshot('b'));assert((await h.handler({},'apply',job.id)).error);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));assert.equal(h.disconnects,0);
});
