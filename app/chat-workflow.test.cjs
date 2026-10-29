const testWorkspace = require('./test-workspace.cjs');
// Exercise the actual Electron IPC handler and job preparer with an isolated transport.
// No test-mode auth path is added to the application; only the SDK and native CLO reply are mocked here.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
test('incomplete request → explicit continuation → CLO confirmation → context-aware edit → restart',async()=>{
 const folder=testWorkspace.create('chat-workflow-');
 const profiles=new (require('./body-profiles.cjs').BodyProfiles)(path.join(folder,'body.json'));
 const runtime=new(require('./project-context.cjs').ProjectContexts)({directory:folder,profiles});
 runtime.update({available:true,document_id:'document-a',generation:1,name:'Тестовый проект',path:'C:/test.zprj',parts:[],content_digest:'empty'},'test-session');
 runtime.refresh=async()=>runtime.publicState();
 const {garments,semantics,conversation}=runtime.stores;
 const {ConversationStore}=require('./conversation-store.cjs');
 let handler,nextResponse,calls=[];
 const client={getSession:async()=>({status:'connected',sharing:true}),streamResponse:async options=>{calls.push(options);return {text:JSON.stringify(nextResponse)};}};
 const context=vm.createContext({require:createRequire(path.join(__dirname,'main.cjs')),profiles,garments,semantics,conversation,projectRuntime:runtime,client,commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,version:3,session:'test-session'}),ipcMain:{handle(name,fn){assert.equal(name,'call');handler=fn;}}});
 const source=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8'),start=source.indexOf(' async function prepareJob('),end=source.indexOf(' const win=new BrowserWindow');assert(start>0&&end>start);
 vm.runInContext(source.slice(start,end),context,{filename:'main-ipc-under-test.cjs'});
 const send=text=>handler({},'create',{text,model:'test-model'});
 nextResponse={tools:[{action:'plan_garment',args:{method:'tshirt_setin_engineering_v1',parameters:{length_mm:750}}}]};
 const plan=await send('Создай футболку длиной 75 см');assert.match(plan.message,/Профиль мерок/);assert.equal(garments.data.garments.length,0);
 assert.match(calls[0].instructions,/ONLY tshirt_setin_engineering_v1/);
 const draft=await send('Продолжай без этих данных');assert.equal(calls.length,1,'pure continuation must not ask AI for missing values again');assert.equal(draft.garment.parameters.length_mm,750);assert(draft.garment.approximate);assert.equal(profiles.data.profiles.length,0);assert.equal(draft.patterns[0].semantic.id,draft.garment.pieces[0].id);
 async function confirm(job){if(job.replace_targets?.length){assert.match((await handler({},'apply',job.id)).error,/Подтвердите/);assert((await handler({},'confirm-replacement',{id:job.id,confirmed:true})).confirmed);}assert((await handler({},'apply',job.id)).queued);assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'clo_ai_apply.json'))).id,job.id);const r={id:job.id,patterns:job.patterns.map((p,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'v'+job.garment.version+'-'+i,semantic:{parameters:p.parameters||{},contour:[]},internal_lines:{status:'manual'}}))};r.project_guard=job.project_guard;runtime.update({available:true,document_id:'document-a',generation:1,name:'Тестовый проект',path:'C:/test.zprj',parts:r.patterns.map(p=>({pattern_id:p.clo_pattern_id,name:'Деталь',fingerprint:p.fingerprint})),content_digest:'version-'+job.garment.version},'test-session');fs.writeFileSync(path.join(folder,'clo_ai_job_result.json'),JSON.stringify(r));await handler({},'result');await handler({},'result');}
 await confirm(draft);assert.equal(conversation.list().filter(m=>m.event===draft.id).length,1);
 nextResponse={tools:[{action:'update_garment',args:{query:'selected',parameter:'length_mm',delta_mm:20}}]};const edited=await send('Увеличь длину этой футболки на 2 см');
 assert.equal(edited.garment.parameters.length_mm,770);assert.equal(edited.garment.parameters.hem_circumference_mm,draft.garment.parameters.hem_circumference_mm);assert.equal(edited.garment.id,draft.garment.id);assert(edited.garment.approximate);assert.equal(edited.previous_pieces.length,5);assert.equal(edited.previous_pieces[0].id,draft.garment.pieces[0].id);assert.equal(edited.update_preview.replaced,2);assert.equal(edited.update_preview.reused,3);await confirm(edited);const queued=JSON.parse(fs.readFileSync(path.join(folder,'clo_ai_apply.json')));assert.equal(queued.previous_pieces[0].id,draft.garment.pieces[0].id);assert.equal(queued.update_preview.reused,3);
 assert.deepEqual(edited.update_preview.impact.replaced.map(p=>p.id),edited.garment.pieces.slice(0,2).map(p=>p.id));
 assert.equal(edited.update_preview.impact.connections.length,10);assert.equal(edited.update_preview.impact.reused.length,3);
 const transmitted=calls.at(-1).input.map(m=>m.content).join('\n');assert.match(transmitted,/75 см/);assert.match(transmitted,/Продолжай без этих данных/);assert.match(transmitted,/CLO подтвердил/);
 context.conversation=new ConversationStore(conversation.file);nextResponse={message:'Продолжаем футболку, длина теперь 770 мм.'};const answer=await send('Напомни, над чем работаем');assert.match(answer.message,/770/);assert.match(calls.at(-1).input.map(m=>m.content).join('\n'),/Увеличь длину/);
 nextResponse={tools:[{action:'create_draft_piece',args:{type:'rectangle'}}]};const blocked=await send('Создай прямоугольник');assert.match(blocked.error,/явное разрешение/);
 const allowed=await send('Сделай на твоё усмотрение');assert(allowed.approximate,JSON.stringify(allowed));assert.equal(allowed.patterns[0].width_mm,400);
 const beforeResearch=garments.data.garments.length;
 nextResponse={tools:[{action:'get_category_engineering',args:{category:'jacket'}}]};
 const research=await send('Какие куртки уже реализованы?');assert.match(research.message,/Пуховик: пока не реализовано/);
 assert.equal(garments.data.garments.length,beforeResearch);assert.equal(research.id,undefined);
});
