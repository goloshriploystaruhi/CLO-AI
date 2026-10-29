'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),api=require('./construction-recovery.cjs');
const design=()=>({version:1,name:'Новая конструкция',category:'custom',parameters:{height_mm:200},measurements:[],pieces:[{role:'panel',name:'Панель',primitive:{type:'rectangle',width:100,height:'p_height_mm'}}]});
test('unknown legacy and dialogue tool names cannot escape validation into a profile fallback',()=>{
 for(const spec of [{tools:[{action:'invented_draft_tool',args:{}}]},{dialogue:{intent:'construction',tools:[{action:'invented_draft_tool',args:{}}]}}])assert.throws(()=>api.validateSpec(spec),e=>e.code==='unknown_tool'&&/invented_draft_tool/.test(e.message));
 assert.throws(()=>api.validateSpec({tools:[{action:'delete_body_profile',args:{id:'a'}}]}),/Неизвестный инструмент/);
});
test('real schema errors preserve their cause and field, while documented generic designs and profile methods remain valid',()=>{
 const invalid={dialogue:{intent:'construction',tools:[{action:'create_garment',args:{method:'unknown_method',parameters:{}}}]}};
 let found;try{api.validateSpec(invalid);}catch(e){found=e;}assert(found);assert.match(found.message,/Неизвестная методика/);assert.equal(found.code,'model_schema');assert.equal(found.field,'dialogue.tools[0].args');
 for(const spec of [{tools:[{action:'create_pattern_design',args:{design:design()}}]},{tools:[{action:'create_body_profile',args:{metadata:{sex:'female',source:{kind:'user'}}}},{action:'get_required_measurements',args:{method:'planning:skirt'}}]},{dialogue:{intent:'review',message:'Обсуждаем варианты.'}},{dialogue:{intent:'construction',tools:[{action:'trial_pattern_design',args:{design:design()}}]}}])assert.equal(api.validateSpec(spec),spec);
 for(const key of ['message','brief'])assert.throws(()=>api.validateSpec({dialogue:{intent:'construction',[key]:'',tools:[{action:'trial_pattern_design',args:{design:design()}}]}}),e=>e.code==='model_schema'&&e.field==='dialogue.'+key);
});
test('strict envelopes reject executable values, getters, unknown profile fields, malformed measurements and oversized tool lists',()=>{
 const getter={};let invoked=false;Object.defineProperty(getter,'action',{enumerable:true,get(){invoked=true;return 'create_body_profile';}});
 for(const spec of [{tools:[getter]},{tools:[{action:'create_body_profile',args:{run:'code'}}]},{tools:[{action:'update_body_measurement',args:{measurement:'foot_length',value:NaN,unit:'cm'}}]},{tools:[{action:'update_body_measurement',args:{measurement:'foot_length',value:26,unit:'EU'}}]},{tools:[{action:'create_pattern_design',args:{design:{...design(),execute:()=>{}}}}]},{tools:Array.from({length:21},()=>({action:'list_body_profiles',args:{}}))}])assert.throws(()=>api.validateSpec(spec));
 assert.equal(invoked,false);
});
test('model, research and geometry failures are repairable; identity, quota, cancellation, storage and old projects never are',()=>{
 for(const [error,kind]of [[Object.assign(Error('Неизвестная методика'),{code:'model_schema'}),'model_schema'],[Error('Нужна однозначная известная мерка: special_dimension'),'measurement_schema'],[Error('Контур самопересекается'),'geometry'],[Error('Источник ответил кодом403'),'research'],[Object.assign(Error('Сбой'),{status:503}),'provider_transient']])assert.deepEqual(api.classify(error).kind,kind),assert.equal(api.classify(error).recoverable,true);
 for(const error of [Object.assign(Error('Нет доступа'),{status:401}),Object.assign(Error('Запрет'),{status:'403'}),Object.assign(Error('Лимит'),{status:429}),Object.assign(Error('Проект сменился'),{code:'project_changed'}),Object.assign(Error('Отмена'),{name:'AbortError'}),Object.assign(Error('Истекло время'),{code:'agent_timeout'}),Object.assign(Error('Нет записи'),{code:'EACCES'})])assert.equal(api.classify(error).recoverable,false,error.message);
});
test('repair facts retain the actual reason and relevant schema hint without args, credentials, local paths or permission claims',()=>{
 const e=Object.assign(Error('Неизвестный параметр top_mm. Bearer SECRET123; token=ALSOSECRET; sk-123456789012345; https://user:PASS@example.org/a; C:\\Users\\private\\secret.txt'),{code:'model_schema',field:'dialogue.tools[0].args.top_mm'}),fact=api.recoveryFact(e,{stage:'preflight',attempt:2,tool:{action:'create_pattern_design',args:{personal:'must not copy'}}});
 assert.equal(fact.recoverable,true);assert.equal(fact.operation,'create_pattern_design');assert.equal(fact.error.field,e.field);assert.match(fact.error.message,/top_mm/);assert.equal(fact.schema_hint.inspect,'get_construction_capabilities');assert.equal(fact.recovery_is_authorization,false);assert.equal(fact.clo_changed,false);
 const encoded=JSON.stringify(fact);for(const secret of ['SECRET123','ALSOSECRET','123456789012345','user:PASS','private','must not copy'])assert(!encoded.includes(secret),secret);assert(JSON.stringify(api.recoveryFact(Error('x'.repeat(100000)))).length<4000);
});
test('catalogue-size intent is general, preserves only a label and never manufactures body values',()=>{
 for(const [request,label]of [['Создай стандартные высокие изделия42EU','EU 42'],['Построй куртку размераM','M'],['Сделай размер UK8.5','UK 8.5'],['Сделай на US10','US 10'],['Сконструируй размер42','размер 42'],['Размер26см','размер 26см']]){const r=api.sizeIntent(request);assert.equal(r.mode,'standard_reference',request);assert.equal(r.label,label);assert.equal(r.assumptions_allowed,true);assert.equal(r.source_required,true);assert.equal(r.personal_measurements_inferred,false);assert(!Object.hasOwn(r,'measurements'));}
 for(const request of ['Сделай на любой размер','Построй стандартный вариант','Построй куртку XL'])assert.equal(api.sizeIntent(request).mode,'standard_reference');
 for(const request of ['Построй по моим меркам','Стандартная куртка по моему профилю','Не используй стандартные размеры, строй по моим меркам','Нужна индивидуальная выкройка размераM','Построй нестандартную вещь','Длина изделия42см','Сделай L-образную деталь'])assert.equal(api.sizeIntent(request).mode,'individual',request);
});
test('stalled recovery recognizes broad promises and capability dead ends without treating a concrete question as failure',()=>{
 for(const message of ['Доступные операции не строят такую вещь.','Сначала нужно изучить методику.','Сейчас поищу информацию.','Начинаю исследование.','В каталоге нет такой основы.'])assert(api.stalled(message),message);
 for(const message of ['Какой материал берём?','Для индивидуального варианта нужна длина стопы.','Проверка завершена, результат находится в CLO.'])assert.equal(api.stalled(message),false,message);
});
