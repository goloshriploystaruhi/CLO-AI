const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const {ProjectContexts}=require('./project-context.cjs'),{BodyProfiles}=require('./body-profiles.cjs');
const {DialogueManager,visiblePrefix}=require('./dialogue-manager.cjs');
function setup(){
 const folder=testWorkspace.create('dialogue-'),profiles=new BodyProfiles(path.join(folder,'profiles.json'));let scope,handler,reply=async()=>({message:'Ответ'});
 let snapshot={available:true,document_id:'doc-a',generation:1,name:'Проект A',path:'C:/a.zprj',parts:[],content_digest:'empty'};
 const runtime=new ProjectContexts({directory:folder,profiles,onChange:stores=>{if(scope){Object.assign(scope,stores);scope.pendingJob=null;scope.semanticJobs.clear();scope.creatingChat=false;}}});
 runtime.update(snapshot,'bridge');runtime.refresh=async()=>runtime.update(snapshot,'bridge');const calls=[];
 const client={getSession:async()=>({sharing:true}),streamResponse:async options=>{calls.push(options);return {text:JSON.stringify(await reply(options))};}};
 scope=vm.createContext({require:createRequire(path.join(__dirname,'main.cjs')),...runtime.stores,projectRuntime:runtime,client,commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,bridgeState:()=>({connected:true,session:'bridge',version:3}),ipcMain:{handle(_,fn){handler=fn;}}});
 const code=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');vm.runInContext(code.slice(code.indexOf(' async function prepareJob('),code.indexOf(' const win=new BrowserWindow')),scope);
 return {folder,profiles,runtime,scope,calls,handler,reply(fn){reply=fn;},set(next){snapshot={...snapshot,...next};},send:(text,extra={})=>handler({},'create',{text,model:'test',project_session:runtime.state.session_id,...extra}),choose:(q,type)=>handler({},'interactive-action',{id:q.actions.find(a=>a.type===type).id,question_id:q.id,project_session:runtime.state.session_id,model:'test'})};
}
test('A–C: discussion cannot construct; a project-bound approval and missing-measurement action build one disclosed draft',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'exploration',message:'Можно начать со свободного силуэта. Построим поддерживаемую основу?',brief:'Свободная куртка со стойкой и объёмными карманами',tools:[{action:'create_garment',args:{method:'jacket_utility_v1',parameters:{length_mm:700,chest_ease_mm:160,hem_circumference_mm:1160,sleeve_length_mm:500,cuff_circumference_mm:300}}}]}}));
 const idea=await h.send('Хочу необычную куртку');assert(idea.question);assert.equal(idea.id,undefined);assert.equal(h.scope.semanticJobs.size,0);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
 assert(idea.question.actions.some(a=>a.type==='approve_proposal'),JSON.stringify(idea));const missing=await h.choose(idea.question,'approve_proposal');assert(missing.needs_input);assert(missing.question.actions.some(a=>a.type==='open_profiles'));assert.equal(h.calls.length,1);
 const job=await h.choose(missing.question,'continue_draft');assert(job.id);assert.equal(job.patterns.length,16);assert(job.garment.approximate);assert.equal(h.profiles.data.profiles.length,0);assert.equal(h.calls.length,1);
 assert((await h.choose(missing.question,'continue_draft')).error);assert.equal(h.scope.semanticJobs.size,1);
 const events=await h.handler({},'dialogue-status',{session_id:h.runtime.state.session_id});assert(events.events.some(e=>e.action==='construction'));assert(events.events.some(e=>e.action==='validation'&&e.status==='verified'));
});
test('B: a short go-ahead uses a saved concrete proposal without another AI call',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'planning',message:'Предлагаю прямоугольную тестовую деталь 100 × 200 мм.',tools:[{action:'create_parametric_piece',args:{pattern:{type:'rectangle',width_mm:100,height_mm:200}}}]}}));
 const plan=await h.send('Какую тестовую деталь можно сделать?');assert(plan.question);
 const job=await h.send('Давай, делай');assert(job.id);assert.equal(h.calls.length,1);assert.equal(job.patterns[0].width_mm,100);
});

test('novel construction researches, corrects a failed trial and prepares a checked development in the same request',async()=>{
 const h=setup();let round=0;
 const feature=y=>({type:'patch_pocket',host:'front_right',width_mm:80,height_mm:100,y_mm:y});
 h.reply(async()=>{round++;const action=round===1?'get_category_engineering':round<4?'trial_garment':'develop_garment';
  return {dialogue:{intent:'construction',message:'Проверяю опытный вариант',tools:[{action,args:round===1?{category:'jacket'}:{method:'workwear_zip_jacket_v1',parameters:{},features:[feature(round===2?0:330)]}}]}};
 });
 const job=await h.send('Создай рабочую куртку с дополнительным карманом, продолжай без мерок');
 assert(job.id,JSON.stringify(job));assert.equal(round,4);assert.equal(job.garment.parameters.development.features[0].y_mm,330);
 assert.equal(job.garment.pieces.length,25);assert(job.garment.qa_report.valid);assert(job.garment.approximate);
 assert.equal(h.profiles.data.profiles.length,0);assert.equal(h.scope.semanticJobs.size,1);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
 assert(h.calls.some(o=>o.input.some(m=>typeof m.content==='string'&&m.content.includes('"valid":false')&&/карман/i.test(m.content))));
});
test('D/E/J: actual native results drive review, factual event history, manual assembly offer and recovery actions',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'construction',tools:[{action:'create_parametric_piece',args:{pattern:{type:'rectangle',width_mm:100,height_mm:200}}}]}}));
 const job=await h.send('Создай деталь 100 на 200 мм');assert(job.id);assert((await h.handler({},'apply',job.id)).queued);
 const r={id:job.id,project_guard:job.project_guard,error:'Контур в CLO не совпал с моделью',transaction:{requires_manual_recovery:true},execution_events:[{id:job.id+':clo:1',operation_id:job.id,action:'validation',object:'Контур',status:'failed',description:'CLO не подтвердил размеры контура.'}]};
 fs.writeFileSync(path.join(h.folder,'clo_ai_job_result.json'),JSON.stringify(r));const result=await h.handler({},'result');assert(result.error);assert(result.question.actions.some(a=>a.type==='reply'));assert.equal(h.scope.conversation.data.dialogue.stage,'review');
 const messages=await h.handler({},'chat-history',{session_id:h.runtime.state.session_id});const last=messages.at(-1);assert.equal(last.kind,'error');assert(last.execution_events.some(e=>e.status==='failed'));assert(!last.assembly_offer);assert.equal(last.question.status,'active');
});
test('G/H: discussion preserves construction context and old actions cannot cross a project or content change',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'exploration',message:'Выберем силуэт.',brief:'Куртка с мягким объёмом',choices:['Расслабленный','Архитектурный']}}));
 const first=await h.send('Обсудим куртку');const before=structuredClone(h.scope.garments.data);
 h.reply(async()=>({dialogue:{intent:'exploration',message:'Поговорим о форме плеча, лекала пока оставим.'}}));await h.send('Давай снова обсудим силуэт, без построения');assert.deepEqual(h.scope.garments.data,before);assert.match(h.calls.at(-1).instructions,/Куртка с мягким объёмом/);assert((await h.choose(first.question,'reply')).error);
 const fresh=await h.send('Ещё варианты');h.set({document_id:'doc-b',path:'C:/b.zprj',name:'Проект B',content_digest:'new'});await h.handler({},'project-state');assert((await h.choose(first.question,'reply')).error);assert.equal(h.scope.conversation.list().length,0);
});
test('stream parser excludes tool JSON and the live chat waits for the accepted response',async()=>{
 assert.equal(visiblePrefix('{"tools":[{"action":"delete"'), '');
 assert.equal(visiblePrefix('{"dialogue":{"intent":"exploration","message":"Привет\\n**Идея'), 'Привет\n**Идея');
 assert.equal(visiblePrefix('{"dialogue":{"intent":"review","brief":"скрыто","message":"Текст'), '');
 const h=setup();let finish,started;const ready=new Promise(r=>started=r);
 h.reply(async options=>{options.onDelta('{"dialogue":{"intent":"exploration","message":"Обсудим силуэт');started();await new Promise(r=>finish=r);return {dialogue:{intent:'exploration',message:'Обсудим силуэт.'}};});
 const pending=h.send('Есть идея');await ready;const state=await h.handler({},'dialogue-status',{session_id:h.runtime.state.session_id});assert.equal(state.preview,'');finish();const reply=await pending;assert.equal(reply.message,'Обсудим силуэт.');assert.equal(h.scope.conversation.list().filter(m=>m.role==='assistant').length,1);
});
test('stale draft hashes, forged action arguments and absent approval never execute a proposal',async()=>{
 const h=setup();const manager=new DialogueManager(h.scope.conversation,h.runtime),ticket=h.runtime.ticket(),turn={ticket,operation_id:'op'};
 manager.begin(ticket,'op','Идея');h.scope.garments.data.draft={method:'jacket_stand_v1',parameters:{length_mm:700}};
 const result=manager.missing(turn,{message:'Нужны мерки'});h.scope.garments.data.draft.parameters.length_mm=800;
 assert.match((await h.choose(result.question,'continue_draft')).error,/Черновик изменился/);
 assert((await h.handler({},'interactive-action',{id:'forged',question_id:result.question.id,project_session:ticket.session_id,code:'run()'})).error);
 manager.transition('construction','assistant');assert.equal(manager.state.stage,'planning');
 assert.throws(()=>manager.transition('unknown'));assert.equal(h.scope.semanticJobs.size,0);
 const legacy=manager.accept({tools:[{action:'build_trouser_from_profile',args:{}}]},turn,'Обсудим экспериментальную половинку');assert(legacy.question);assert.equal(h.scope.semanticJobs.size,0);
});

test('read-only inspection announces validation rather than fictitious construction',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'review',tools:[{action:'list_current_project_pieces',args:{}}]}}));const job=await h.send('Что сейчас в проекте?');assert(job.id);assert.equal(job.operation,'inspect');
 assert((await h.handler({},'apply',job.id)).queued);const manager=new DialogueManager(h.scope.conversation,h.runtime),events=manager.snapshot().events;
 assert.equal(events.at(-1).action,'validation');assert(!events.some(e=>e.action==='construction'));
});

test('profile commands from chat call the real profile store without queuing CLO geometry',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'clarification',tools:[{action:'create_body_profile',args:{name:'Тестовый профиль',units:'cm'}},{action:'update_body_measurement',args:{measurement:'height',value:172,unit:'cm'}},{action:'update_body_measurement',args:{measurement:'weight',value:67,unit:'kg'}}]}}));
 const created=await h.send('Создай профиль Тестовый профиль, рост 172, вес 67');assert(created.profile_changed);assert.equal(h.profiles.profile().name,'Тестовый профиль');assert.equal(h.profiles.profile().measurements.height.value,1720);assert.equal(h.profiles.profile().measurements.weight.value,67);assert.equal(h.scope.semanticJobs.size,0);
 h.reply(async()=>({dialogue:{intent:'revision',tools:[{action:'update_body_measurement',args:{measurement:'chest',value:94,unit:'cm'}}]}}));await h.send('Добавь обхват груди 94 сантиметра');assert.equal(new BodyProfiles(h.profiles.file).profile().measurements.chest.value,940);
});

test('profile then tapered trousers do not request hosted search; API diagnostics survive history reload',async()=>{
 const h=setup();
 h.reply(async()=>{throw Object.assign(Error('Server validation with PRIVATE input'),{code:'api_error',status:422,param:'tools',requestId:'req-test-422',retryable:false});});
 const failed=await h.send('Создай профиль');assert.equal(failed.status,422);assert.equal(failed.param,'tools');assert.match(failed.diagnostics,/req-test-422/);
 assert.match(h.scope.conversation.list().at(-1).details,/HTTP 422/);assert.doesNotMatch(h.scope.conversation.list().at(-1).text,/PRIVATE/);
 assert.equal(h.scope.semanticJobs.size,0);assert.equal(h.scope.creatingChat,false);
 h.reply(async()=>({dialogue:{intent:'clarification',tools:[{action:'create_body_profile',args:{name:'Тестовый профиль',units:'cm'}}]}}));
 const created=await h.send('Создай профиль');assert(created.profile_changed);assert.equal(h.profiles.profile().name,'Тестовый профиль');
 for(const [measurement,value]of Object.entries({garment_waist_girth:840,hips:1000,waist_hip_length:210,seated_depth:310,waist_knee:620}))h.profiles.update({measurement,value,unit:'mm',status:'verified'});
 const parameters={length_mm:1050,waist_drop_mm:20,hip_ease_mm:160,waist_ease_mm:20,knee_flat_mm:280,hem_flat_mm:240};
 h.reply(async()=>({dialogue:{intent:'construction',tools:[{action:'create_garment',args:{method:'wide_trousers_experimental_v1',parameters}}]}}));
 const job=await h.send('Создай широкие штаны, чтобы к низу было сужение');assert(job.id,JSON.stringify(job));assert.equal(job.garment.parameters.hem_flat_mm,240);assert(job.garment.qa_report.valid);
 assert(h.calls.every(o=>o.webSearch===false));assert.equal(h.scope.semanticJobs.size,1);assert(!fs.existsSync(path.join(h.folder,'clo_ai_apply.json')));
 const reloaded=new(require('./conversation-store.cjs').ConversationStore)(h.scope.conversation.file);
 assert.match(reloaded.list().find(m=>m.kind==='error').details,/req-test-422/);
 assert(reloaded.input().some(m=>m.content==='Создай профиль'));
});

test('multi-file references enforce remaining slots and stay bound to the picker project',async()=>{
 const h=setup(),file=path.join(__dirname,'..','reports','three-categories','jacket_utility_v1.png');h.scope.nativeImage={createFromBuffer:()=>({isEmpty:()=>false,getSize:()=>({width:100,height:100})})};h.scope.dialog={showOpenDialog:async()=>({filePaths:[file,file]})};
 const tooMany=await h.handler({},'pick-reference',{project_session:h.runtime.state.session_id,multiple:true,remaining:1});assert(tooMany.error);assert.equal(h.scope.conversation.data.references,undefined);
 const picked=await h.handler({},'pick-reference',{project_session:h.runtime.state.session_id,multiple:true,remaining:2});assert.equal(picked.references.length,2);assert.notEqual(picked.references[0].id,picked.references[1].id);
 let complete;h.scope.dialog.showOpenDialog=()=>new Promise(r=>complete=r);const pending=h.handler({},'pick-reference',{project_session:h.runtime.state.session_id,multiple:true,remaining:4});while(!complete)await new Promise(r=>setTimeout(r,1));h.set({document_id:'doc-b',path:'C:/b.zprj',name:'Проект B',content_digest:'other'});await h.handler({},'project-state');complete({filePaths:[file]});assert((await pending).error);assert.equal(h.scope.conversation.data.references,undefined);
});
test('I: actual image content remains scoped and invalid IDs do not lock chat',async()=>{
 const h=setup();const bad=await h.send('Референс',{references:['../private']});assert(bad.error);assert.equal(h.scope.creatingChat,false);
 const bytes=Buffer.alloc(30);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(100,16);bytes.writeUInt32BE(200,20);
 const file=path.join(h.folder,'Куртка.png');fs.writeFileSync(file,bytes);
 const image={isEmpty:()=>false,getSize:()=>({width:100,height:200}),toJPEG:()=>Buffer.from([255,216,255,1])};h.scope.nativeImage={createFromBuffer:()=>image,createFromDataURL:()=>image};
 const ref=require('./chat-references.cjs').add(h.scope.conversation,file,h.scope.nativeImage);
 h.reply(async()=>({dialogue:{intent:'clarification',message:'На референсе можно изучить силуэт и детали; точные мерки нужны отдельно.'}}));
 const response=await h.send('Расслабленный силуэт',{references:[ref.id]});assert(response.message,JSON.stringify(response));assert(h.calls.at(-1).input.at(-1).content.some(p=>p.type==='input_image'));
 const history=await h.handler({},'chat-history',{session_id:h.runtime.state.session_id});assert.equal(history[0].references[0].id,ref.id);
});

test('a ready local plan survives reloading; approval uses exact parameters and success offers the existing manual map',async()=>{
 const h=setup();h.profiles.create({name:'Профиль'});
 for(const [measurement,value]of Object.entries({garment_waist_girth:840,hips:1000,waist_hip_length:210,seated_depth:310,waist_knee:620}))h.profiles.update({measurement,value,unit:'mm',status:'verified'});
 const parameters={length_mm:1050,waist_drop_mm:20,hip_ease_mm:160,waist_ease_mm:20,knee_flat_mm:280,hem_flat_mm:240};
 h.reply(async()=>({dialogue:{intent:'planning',message:'Подготовлю план.',tools:[{action:'plan_garment',args:{method:'wide_trousers_experimental_v1',parameters}}]}}));
 const plan=await h.send('Подготовь план широких брюк');assert(plan.question);assert.match(plan.message,/В CLO их ещё не добавлял/);assert.equal(h.scope.semanticJobs.size,0);
 const {ConversationStore}=require('./conversation-store.cjs'),restored=new ConversationStore(h.scope.conversation.file),manager=new DialogueManager(restored,h.runtime);
 assert.equal(manager.state.proposal.spec.tools[0].args.parameters.hem_flat_mm,240);assert.equal(manager.decorate(restored.list()).at(-1).question.id,plan.question.id);
 const job=await h.choose(plan.question,'approve_proposal');assert(job.id);assert.equal(h.calls.length,1);assert.equal(job.garment.parameters.hem_flat_mm,240);
 await h.handler({},'apply',job.id);fs.writeFileSync(path.join(h.folder,'clo_ai_job_result.json'),JSON.stringify({id:job.id,project_guard:job.project_guard,patterns:job.patterns.map((p,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'native-'+i}))}));
 const result=await h.handler({},'result');assert(result.assembly_offer);assert.equal(h.scope.garments.data.garments.length,1);assert.equal(result.execution_events.at(-1).status,'verified');
 assert.equal(h.scope.conversation.data.dialogue.stage,'review');assert.match(h.scope.conversation.list().at(-1).text,/вручную/);
 h.set({content_digest:'native-created',parts:h.scope.garments.data.garments[0].bindings.map(b=>({pattern_id:b.pattern_id,fingerprint:b.fingerprint,name:b.id}))});
 h.reply(async()=>({dialogue:{intent:'review',tools:[{action:'get_assembly_map',args:{query:job.garment.id}}]}}));const map=await h.send('Открой карту ручной сборки этих брюк');assert(map.assembly_offer,JSON.stringify(map));assert.notEqual(map.assembly_offer.id,result.assembly_offer.id);assert.equal(map.id,undefined);assert.equal(h.scope.semanticJobs.size,0);assert.equal(h.scope.conversation.list().at(-1).assembly_offer.id,map.assembly_offer.id);
 assert.throws(()=>require('./command-validation.cjs').tool({action:'get_assembly_map',args:{query:job.garment.id,execute:true}}));
});

test('measurement changes expire button approvals and textual go-aheads without locking the chat',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'planning',message:'Предлагаю деталь.',tools:[{action:'create_parametric_piece',args:{pattern:{type:'rectangle',width_mm:100,height_mm:200}}}]}}));
 const plan=await h.send('Что можно построить?');h.profiles.create({name:'Другой человек'});
 assert.match((await h.choose(plan.question,'approve_proposal')).error,/мерок изменился/);
 assert.match((await h.send('Давай, делай')).error,/Мерки изменились/);assert.equal(h.scope.creatingChat,false);assert.equal(h.scope.semanticJobs.size,0);
 const state=await h.handler({},'dialogue-status',{session_id:h.runtime.state.session_id});assert.equal(state.questions.length,0);
 h.reply(async()=>({dialogue:{intent:'exploration',message:'Обсудим вариант с новым профилем.'}}));const fresh=await h.send('Давай обсудим заново');assert(fresh.message,JSON.stringify(fresh));
});

test('a short go-ahead can continue a saved design brief; preparation errors offer recovery without fake success',async()=>{
 const h=setup();h.reply(async()=>({dialogue:{intent:'exploration',message:'Обсудим корпус.',brief:'Прямоугольная тестовая деталь шириной 100 и высотой 200 мм'}}));await h.send('Хочу тестовый корпус');
 h.reply(async()=>({dialogue:{intent:'construction',tools:[{action:'create_parametric_piece',args:{pattern:{type:'rectangle',width_mm:100,height_mm:200}}}]}}));assert((await h.send('Давай, делай')).id);
 const manager=new DialogueManager(h.scope.conversation,h.runtime);manager.engineEvent({id:'foreign',operation_id:manager.snapshot().operation_id,project_id:'other',action:'construction',description:'Не наш проект'});assert(!manager.snapshot().events.some(e=>e.description==='Не наш проект'));
 h.reply(async()=>{throw Error('Тестовая ошибка подключения');});const failed=await h.send('Объясни конструкцию');assert(failed.error);assert(failed.question.actions.length);assert.equal(failed.execution_events.at(-1).status,'failed');
 const messages=await h.handler({},'chat-history',{session_id:h.runtime.state.session_id});assert.equal(messages.at(-1).question.id,failed.question.id);assert.equal(messages.at(-1).kind,'error');
 manager.finish({},manager.snapshot().operation_id,false);assert.equal(manager.snapshot().events.at(-1).status,'failed');
});
