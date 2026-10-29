// Real main IPC + construction loop. Provider data is synthetic; profiles,
// conversation persistence and mathematical trials use the ordinary adapters.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {ProjectContexts}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs'),dialogue=require('./dialogue-manager.cjs');

function setup(t,replies){
 const root=path.resolve(__dirname,'../research'),folder=fs.mkdtempSync(path.join(root,'stream-presentation-'));
 t.after(()=>{assert.equal(path.dirname(folder),root);fs.rmSync(folder,{recursive:true,force:true});});
 const profiles=new BodyProfiles(path.join(folder,'profiles.json'));profiles.create({name:'Проверка представления ответа'});
 const visible=[],prompts=[],chunks=[];let context,handler,index=-1;
 class CapturingDialogue extends dialogue.DialogueManager{
  preview(raw){super.preview(raw);visible.push(this.snapshot().preview||'');}
 }
 const snapshot=()=>({available:true,document_id:'presentation-document',generation:1,name:'Проверка диалога',path:'C:/presentation.zprj',parts:[],content_digest:'empty'});
 const runtime=new ProjectContexts({directory:folder,profiles,onChange:stores=>{if(context)Object.assign(context,stores);}});
 runtime.update(snapshot(),'native-presentation');runtime.refresh=async()=>runtime.update(snapshot(),'native-presentation');
 const client={getSession:async()=>({sharing:true,status:'connected'}),streamResponse:async options=>{
  ++index;assert(index<replies.length,'Unexpected additional model round');prompts.push(structuredClone(options.input));assert.equal(typeof options.onDelta,'function');
  const reply=replies[index],text=JSON.stringify(reply.value||reply),cut=Math.max(1,Math.floor(text.length*.7));
  options.onDelta(text.slice(0,cut));chunks.push(text.slice(0,cut));await Promise.resolve();
  if(reply.failure)throw Object.assign(Error('Временная ошибка тестового соединения'),{code:'network_error',status:503});
  options.onDelta(text.slice(cut));chunks.push(text.slice(cut));return {text};
 }};
 const requireMain=createRequire(path.join(__dirname,'main.cjs')),requireInVM=name=>name==='./dialogue-manager.cjs'?{...dialogue,DialogueManager:CapturingDialogue}:requireMain(name);
 context=vm.createContext({require:requireInVM,...runtime.stores,projectRuntime:runtime,client,commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,session:'native-presentation',version:3}),ipcMain:{handle(_,fn){handler=fn;}}});
 const main=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');vm.runInContext(main.slice(main.indexOf(' async function prepareJob('),main.indexOf(' const win=new BrowserWindow')),context);
 return {runtime,context,folder,visible,prompts,chunks,send:text=>handler({},'create',{text,model:'test',project_session:runtime.state.session_id})};
}
const final='Уточните назначение детали, чтобы выбрать подходящую конструкцию.';
function assertOneFinal(h,result){
 assert.equal(result.message,final);assert(h.visible.every(text=>!text),'No provisional stream is presented as an assistant message');
 const assistant=h.runtime.stores.conversation.list().filter(message=>message.role==='assistant');assert.equal(assistant.length,1);assert.equal(assistant[0].text,final);
 assert.equal(h.context.pendingJob,null);assert.equal(h.context.semanticJobs.size,0);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
}
test('a read-only tool plan stays private across model rounds and the final response is stored once',async t=>{
 const provisional='Проверю пробную схему из шести деталей, затем продолжу.';
 const h=setup(t,[{dialogue:{intent:'construction',message:provisional,tools:[{action:'get_body_profile',args:{}}]}},{message:final}]);
 const result=await h.send('Создай новую проверочную конструкцию');assertOneFinal(h,result);assert.equal(h.prompts.length,2);assert(h.chunks.join('').includes(provisional));
 assert(h.prompts[1].some(message=>message.content.includes('Local tool result')),'The actual tool result remains available to the next model round');
 assert(!h.runtime.stores.conversation.list().some(message=>message.text.includes(provisional)));
});
test('failed geometric preflight does not flash its rejected promise before the final clarification',async t=>{
 const provisional='Сейчас создам уже проверенную деталь.';
 const design={version:1,name:'Проверка размеров',category:'custom',parameters:{width_mm:100,height_mm:200},measurements:[],pieces:[{role:'panel',name:'Проверочная панель',primitive:{type:'rectangle',width:'p_width_mm',height:'p_height_mm'}}],checks:[{piece:'panel',metric:'width',expected:900,tolerance_mm:.1}]};
 const h=setup(t,[{dialogue:{intent:'construction',message:provisional,tools:[{action:'create_pattern_design',args:{design}}]}},{message:final}]);
 const result=await h.send('Создай новую проверочную деталь');assertOneFinal(h,result);assert.equal(h.prompts.length,2);assert(h.chunks.join('').includes(provisional));
 assert(h.prompts[1].some(message=>message.content.includes('Preflight FAILED')),'Geometric rejection still reaches the repair loop');
 assert.equal(h.runtime.stores.garments.data.garments.length,0);
});
test('a transient provider retry discards streamed draft text without exposing it as a chat message',async t=>{
 const provisional='Это незавершённый текст до сетевого сбоя.';
 const h=setup(t,[{value:{message:provisional},failure:true},{message:final}]);
 const result=await h.send('Обсудим новую конструкцию');assertOneFinal(h,result);assert.equal(h.prompts.length,2);assert(h.chunks.length>=3);
 assert(!h.runtime.stores.conversation.list().some(message=>message.text.includes(provisional)));
});
