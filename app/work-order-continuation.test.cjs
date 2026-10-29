'use strict';

// Generic panel fixtures exercise the complete IPC → research → mathematical
// worker → native acknowledgement route. They are not a sock drafting recipe.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const testWorkspace=require('./test-workspace.cjs');
const work=require('./garment-patternmaking-tools.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));

function design(copies=2){
 const roles=Array.from({length:copies},(_,i)=>['front','back','band'].map(part=>'item_'+(i+1)+'_'+part));
 const value={version:1,name:'Учебный комплект панелей',category:'custom',parameters:{width_mm:100,height_mm:200},measurements:[],seam_allowance_mm:7,
  pieces:roles.flat().map(role=>({role,name:role,primitive:{type:'rectangle',width:'p_width_mm',height:'p_height_mm'}})),relations:[]};
 for(const group of roles){
  for(let i=0;i<2;i++)value.relations.push({a:{piece:group[i],seam:'right'},b:{piece:group[i+1],seam:'left'},tolerance_mm:.1});
 }
 if(copies>1)value.assembly_groups=roles;
 return value;
}

function brief(value){
 return {name:'Проверка комплекта',brief:value.pieces.length===6?'Два независимых учебных комплекта, по три детали в каждом.':'Один учебный комплект из трёх деталей.',
  required_roles:value.pieces.map(p=>p.role),finished_checks:value.pieces.map(p=>({id:p.role+'-height',role:p.role,kind:'height',target_mm:200,tolerance_mm:.1})),
  fabric:{type:'knit',source:'unknown'},assumptions:['Геометрический опыт; материал и физическая посадка не проверены.']};
}

function fixture(){
 const folder=testWorkspace.create('work-order-continuation-');
 const profiles=new(require('./body-profiles.cjs').BodyProfiles)(path.join(folder,'profiles.json'));
 let scope,handler,responses=[],parts=[];
 const prompts=[];
 const snapshot=()=>({available:true,document_id:'document',generation:1,name:'Изолированный комплект',path:'C:/isolated-kit.zprj',parts,content_digest:JSON.stringify(parts)});
 const runtime=new(require('./project-context.cjs').ProjectContexts)({directory:folder,profiles,onChange:stores=>{
  if(scope){Object.assign(scope,stores);scope.semanticJobs.clear();scope.pendingJob=null;scope.creatingChat=false;}
 }});
 runtime.update(snapshot(),'test-bridge');runtime.refresh=async()=>runtime.update(snapshot(),'test-bridge');
 const client={getSession:async()=>({sharing:true,status:'connected'}),streamResponse:async options=>{
  prompts.push(clone({input:options.input}));
  assert(responses.length,'Неожиданный дополнительный запрос модели');
  return {text:JSON.stringify(responses.shift())};
 }};
 scope=vm.createContext({require:createRequire(path.join(__dirname,'main.cjs')),...runtime.stores,projectRuntime:runtime,client,
  commandValidation:require('./command-validation.cjs'),fs,path,os:{tmpdir:()=>folder},profileInstructions:()=>'',semanticJobs:new Map(),pendingJob:null,creatingChat:false,
  bridgeState:()=>({connected:true,session:'test-bridge',version:3}),ipcMain:{handle:(_,fn)=>handler=fn}});
 const source=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8');
 vm.runInContext(source.slice(source.indexOf(' async function prepareJob('),source.indexOf(' const win=new BrowserWindow')),scope);
 return {folder,profiles,runtime,prompts,scope,
  reply(...values){responses=values;},
  send:text=>handler({},'create',{text,model:'synthetic',project_session:runtime.state.session_id}),
  orders:()=>work.orders({stores:runtime.stores,runtime}),
  async queue(job){
   const result=await handler({},'apply',job.id);assert.equal(result.queued,true);
   const queued=JSON.parse(fs.readFileSync(path.join(folder,'clo_ai_apply.json'),'utf8'));
   assert.equal(queued.id,job.id);assert.equal(queued.session,'test-bridge');return queued;
  },
  async confirm(job){
   parts=job.patterns.map((p,i)=>({pattern_id:1000+i,name:p.name,fingerprint:'native-'+job.id+'-'+i}));
   fs.writeFileSync(path.join(folder,'clo_ai_job_result.json'),JSON.stringify({id:job.id,project_guard:{context_session_id:runtime.state.session_id},patterns:parts.map((p,i)=>({clo_pattern_id:p.pattern_id,pattern_index:i,fingerprint:p.fingerprint}))}));
   return handler({},'result');
  }
 };
}

test('two explicitly independent three-piece assemblies pass real preflight and queue together without a fictitious seam',async()=>{
 const h=fixture(),pair=design(2),order=brief(pair);
 h.reply({tools:[{action:'save_pattern_work_order',args:order}]},
  {tools:[{action:'trial_pattern_design',args:{design:pair}}]},
  {tools:[{action:'create_pattern_design',args:{design:pair}}]});
 const job=await h.send('Создай два независимых учебных комплекта по три детали. Между комплектами швов нет.');
 assert(job.garment,JSON.stringify(job));assert.equal(job.patterns.length,6);assert.equal(job.garment.pieces.length,6);
 assert.deepEqual(job.garment.pattern_design.assembly_groups,pair.assembly_groups);
 assert.equal(job.garment.sewing_graph.length,4);
 for(const seam of job.garment.sewing_graph)assert.equal(Math.floor(seam.a.piece/3),Math.floor(seam.b.piece/3),'Нельзя добавлять фиктивное соединение между комплектами');
 assert.equal(h.runtime.stores.garments.data.garments.length,0,'Сохранение изделия ждёт фактического ответа CLO');
 const queued=await h.queue(job);assert.equal(queued.patterns.length,6);assert.equal(queued.assembly_id,undefined);
 assert.equal(h.runtime.stores.garments.data.garments.length,0);
 const result=await h.confirm(job);assert(!result.error,JSON.stringify(result));assert(result.work_order.order.binding.native_confirmed);
 assert.equal(result.work_order.assessment.fit_verified,false);assert.equal(result.work_order.assessment.sewing_ready,false);
 assert.equal(h.runtime.stores.garments.data.garments.length,1);assert.equal(h.profiles.data.profiles.length,0);
});

test('an exact current request can fork a failed six-piece brief into three pieces and complete without repeating measurements',async()=>{
 const h=fixture(),pair=design(2),original=brief(pair),invalid=clone(pair);
 invalid.relations[0].b.seam='top'; // A measured 200↔100 mm failure, not a missing preset.
 h.reply({tools:[{action:'save_pattern_work_order',args:original}]},
  {tools:[{action:'trial_pattern_design',args:{design:invalid}}]},
  {message:'Пробный расчёт остановлен из-за несовпадения длин шва. Текущий комплект не изменён.'});
 const stopped=await h.send('Создай пару учебных изделий из шести деталей.');
 assert(stopped.message,JSON.stringify(stopped));assert.equal(stopped.patterns,undefined);
 assert.equal(h.runtime.stores.garments.data.garments.length,0);assert.equal(h.scope.semanticJobs.size,0);
 assert.equal(fs.existsSync(path.join(h.folder,'clo_ai_apply.json')),false);
 const previous=h.orders().read().order;assert.equal(previous.required_roles.length,6);assert.equal(previous.binding,undefined);
 const single=design(1),request='Давай тогда создадим один носок, не обязательно пару';
 h.reply({tools:[{action:'read_pattern_work_order',args:{}}]},
  {tools:[{action:'save_pattern_work_order',args:{...brief(single),id:previous.id,expected_revision:previous.revision,brief_change_quote:request}}]},
  {tools:[{action:'trial_pattern_design',args:{design:single}}]},
  {tools:[{action:'create_pattern_design',args:{design:single}}]});
 const job=await h.send(request);
 assert(job.garment,JSON.stringify(job));assert.equal(job.patterns.length,3);assert.equal(job.garment.sewing_graph.length,2);
 assert.notEqual(job.work_order_id,previous.id);assert.equal(job.question,undefined,'Дословное поручение не требует повторного подтверждения');
 assert.equal(h.runtime.stores.garments.data.garments.length,0);assert.equal(h.profiles.data.profiles.length,0);
 assert.deepEqual(h.orders().read({id:previous.id}).order.required_roles,original.required_roles);
 const current=h.orders().read({id:job.work_order_id}).order;
 assert.deepEqual(current.required_roles,single.pieces.map(p=>p.role));
 assert(current.assumptions.some(a=>a.includes(request)));
 const queued=await h.queue(job);assert.equal(queued.patterns.length,3);assert.equal(queued.assembly_id,undefined);
 const result=await h.confirm(job);assert(!result.error,JSON.stringify(result));assert(result.work_order.order.binding.native_confirmed);
 assert.equal(result.work_order.assessment.missing_roles.length,0);assert.equal(result.work_order.assessment.fit_verified,false);
 assert.equal(h.runtime.stores.garments.data.garments.length,1);
 assert.deepEqual(h.orders().read({id:previous.id}).order.required_roles,original.required_roles);
 assert(h.prompts.some(p=>p.input.some(row=>String(row.content).includes('save_pattern_work_order'))));
});
