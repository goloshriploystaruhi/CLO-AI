const testWorkspace = require('./test-workspace.cjs');
// Actual IPC/preparation/result code with isolated stores and synthetic GPT/CLO.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),{EventEmitter}=require('node:events');
function setup(){
 const folder=testWorkspace.create('completion-workflow-'),profiles=new(require('./body-profiles.cjs').BodyProfiles)(path.join(folder,'profiles.json')),calls=[],window=new EventEmitter();let context,handler,focused=false,reply=async()=>({message:'Ответ готов'}),documentID='a';
 Object.assign(window,{isDestroyed:()=>false,isMinimized:()=>false,isVisible:()=>true,isFocused:()=>focused,flashFrame:value=>calls.push(['flash',value]),webContents:{isDestroyed:()=>false,send:(...args)=>calls.push(args)}});
 const runtime=new(require('./project-context.cjs').ProjectContexts)({directory:folder,profiles,onChange:stores=>{if(context){context.completionAttention.reset();Object.assign(context,stores);context.semanticJobs.clear();context.pendingJob=null;context.creatingChat=false;}}});
 const snapshot=()=>({available:true,document_id:documentID,name:'Тест',path:'C:/test-'+documentID+'.zprj',generation:1,content_digest:'empty',parts:[]});runtime.update(snapshot(),'bridge');runtime.refresh=async()=>runtime.update(snapshot(),'bridge');
 const completionAttention=require('./completion-attention.cjs').create({window,Notification:{isSupported:()=>false},isCurrent:t=>runtime.isCurrent(t)});
 context=vm.createContext({require:createRequire(path.join(__dirname,'main.cjs')),...runtime.stores,projectRuntime:runtime,completionAttention,client:{getSession:async()=>({sharing:true,status:'connected'}),streamResponse:async()=>({text:JSON.stringify(await reply())})},commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,version:3,session:'bridge'}),ipcMain:{handle:(_,fn)=>handler=fn}});
 const source=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');vm.runInContext(source.slice(source.indexOf(' async function prepareJob('),source.indexOf(' const win=new BrowserWindow')),context);
 const send=text=>handler({},'create',{text,model:'test',project_session:runtime.state.session_id});
 return {calls,context,runtime,folder,handler,send,reply:value=>reply=value,focus:value=>focused=value,change:async()=>{documentID='b';await handler({},'project-state');},confirm:async(job,extra={})=>{fs.writeFileSync(path.join(folder,'clo_ai_job_result.json'),JSON.stringify({id:job.id,project_guard:job.project_guard,patterns:job.patterns.map((_,i)=>({clo_pattern_id:100+i,pattern_index:i,fingerprint:'confirmed-'+i})),...extra}));return handler({},'result');},cueCount:()=>calls.filter(c=>c[0]==='completion-attention'&&c[1].play).length};
}
test('preparation and dispatch stay silent; only a verified native result signals once',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));const job=await h.send('Создай прямоугольник 100 на200мм');assert(job.id,JSON.stringify(job));assert.equal(h.cueCount(),0);assert((await h.handler({},'apply',job.id)).queued);assert.equal(h.cueCount(),0);const result=await h.confirm(job);assert(!result.error,JSON.stringify(result));assert.equal(h.cueCount(),1);assert.equal(await h.handler({},'result'),null);assert.equal(h.cueCount(),1);
});
test('finished response signals in background, but a focused response and restored history do not',async()=>{
 const h=setup();await h.send('Расскажи про припуски');assert.equal(h.cueCount(),1);h.focus(true);await h.send('Продолжи объяснение');assert.equal(h.cueCount(),1);h.focus(false);await h.handler({},'chat-history',{session_id:h.runtime.state.session_id});assert.equal(h.cueCount(),1);
});
test('failed native result and queued work invalidated by project change do not announce success',async()=>{
 const h=setup();h.reply(async()=>({patterns:[{type:'rectangle',width_mm:100,height_mm:200}]}));const failed=await h.send('Создай прямоугольник100на200мм');await h.confirm(failed,{error:'CLO отклонил геометрию',patterns:[]});assert.equal(h.cueCount(),0);
 const late=await h.send('Создай прямоугольник100на200мм');await h.change();assert.equal(await h.confirm(late),null);assert.equal(h.cueCount(),0);
});
test('late AI response is discarded after a project switch and emits no old-project notification',async()=>{
 const h=setup();let resolve,started;const began=new Promise(r=>started=r);h.reply(async()=>{started();return new Promise(r=>resolve=r);});const pending=h.send('Объясни устройство воротника');await began;await h.change();resolve({message:'Запоздавший ответ'});assert((await pending).cancelled);assert.equal(h.cueCount(),0);
});
