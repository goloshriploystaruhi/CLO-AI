const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {ProjectContexts}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs'),dialogueModule=require('./dialogue-manager.cjs');

test('schema recovery keeps rejected streaming text private and publishes only the accepted answer',async t=>{
 const research=path.resolve(__dirname,'../research'),folder=fs.mkdtempSync(path.join(research,'recovery-streaming-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(folder)),research);fs.rmSync(folder,{recursive:true,force:true});});
 const profiles=new BodyProfiles(path.join(folder,'profiles.json'));profiles.create({name:'Проверка потокового ответа'});
 const replies=[
  {dialogue:{intent:'construction',message:'Текст отклонённого ответа.',tools:[{action:'invented_draft_tool',args:{}}]}},
  {message:'Уточните высоту детали.'}
 ],previews=[],prompts=[],streamed=[];let context,handler,round=-1;
 class CapturingDialogueManager extends dialogueModule.DialogueManager{
  preview(raw){super.preview(raw);previews.push({round,raw,visible:this.snapshot().preview});}
 }
 const snapshot=()=>({available:true,document_id:'streaming-test',generation:1,name:'Проверка восстановления',path:'C:/streaming-test.zprj',parts:[],content_digest:'empty'});
 const runtime=new ProjectContexts({directory:folder,profiles,onChange:stores=>{if(context)Object.assign(context,stores);}});
 runtime.update(snapshot(),'test-bridge');runtime.refresh=async()=>runtime.update(snapshot(),'test-bridge');
 const client={getSession:async()=>({sharing:true,status:'connected'}),streamResponse:async options=>{
  ++round;assert(round<replies.length,'Unexpected extra model round');prompts.push(structuredClone(options.input));
  const text=JSON.stringify(replies[round]),message=replies[round].message||replies[round].dialogue.message,cut=text.indexOf(message)+Math.ceil(message.length/2);
  assert.equal(typeof options.onDelta,'function');streamed.push(text);options.onDelta(text.slice(0,cut));options.onDelta(text.slice(cut));return {text};
 }};
 const mainRequire=createRequire(path.join(__dirname,'main.cjs')),requireInVM=name=>name==='./dialogue-manager.cjs'?{...dialogueModule,DialogueManager:CapturingDialogueManager}:mainRequire(name);
 context=vm.createContext({require:requireInVM,...runtime.stores,projectRuntime:runtime,client,commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,session:'test-bridge',version:3}),ipcMain:{handle(name,fn){assert.equal(name,'call');handler=fn;}}});
 const main=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');vm.runInContext(main.slice(main.indexOf(' async function prepareJob('),main.indexOf(' const win=new BrowserWindow')),context);
 const result=await handler({},'create',{text:'Создай новую параметрическую деталь.',model:'test',project_session:runtime.state.session_id});
 assert.equal(result.message,replies[1].message);assert.equal(round,1);
 assert(prompts[1].some(row=>typeof row.content==='string'&&row.content.includes('unknown_tool')&&row.content.includes('invented_draft_tool')),'Repair receives the actual failed operation');
 assert.equal(streamed.length,2,'The SDK stream remains consumed, including a repaired round');
 assert(previews.every(row=>!row.visible),'Provisional model text must not appear and disappear in chat');
 const history=runtime.stores.conversation.list();assert.equal(history.filter(message=>message.role==='assistant').length,1);
 assert.equal(history.at(-1).text,replies[1].message);assert(!history.some(message=>message.text.includes('отклонённого')));
 assert.equal(context.pendingJob,null,'Schema recovery and clarification do not queue a CLO mutation');assert.equal(runtime.stores.garments.data.garments.length,0);
});
