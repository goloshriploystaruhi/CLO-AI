const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {run}=require('./construction-agent.cjs'),{ConstructionMemory}=require('./construction-memory.cjs');
const noop=async()=>{},response=tools=>({text:JSON.stringify({dialogue:{intent:'construction',message:'Проверяю конструкцию',tools}})});
const design=width=>({version:1,name:'Пробная параметрическая панель',category:'custom',parameters:{width_mm:width,height_mm:300},measurements:[],seam_allowance_mm:10,pieces:[{role:'panel',name:'Деталь',primitive:{type:'rectangle',width:'p_width_mm',height:'p_height_mm'}}]});
function memory(){const folder=testWorkspace.create('autonomous-construction-');return new ConstructionMemory(path.join(folder,'memory.json'),{project_id:'project',profile_id:'person',profile_hash:'verified-measurements'});}

test('a collaborative revised request can recover from a generic refusal instead of silently ending research',async()=>{
 let calls=0,reads=0,previews=0;
 const result=await run({options:{input:[{role:'user',content:'Давай тогда создадим одну опытную деталь, не обязательно пару'}]},request:async()=>++calls===1?{text:JSON.stringify({message:'Не могу построить: такой конструкции нет в моей базе.'})}:response([{action:'create_pattern_design',args:{design:design(100)}}]),read:async tool=>{assert.equal(tool.action,'get_construction_capabilities');reads++;return {generic:{}};},preview:async()=>{previews++;return {valid:true,fit_verified:false,clo_changed:false};},ensureCurrent:noop});
 assert.equal(calls,2);assert.equal(reads,1);assert.equal(previews,1);assert.equal(JSON.parse(result.text).dialogue.tools[0].action,'create_pattern_design');
});
test('an unfamiliar construction does not end at absent preset: capabilities, failed research, trial repair and preflight remain one request',async()=>{
 const ledger=memory(),queue=[{text:JSON.stringify({message:'В моей базе нет такой выкройки, я не умею.'})},response([{action:'search_sources',args:{query:'asymmetric cape drafting principles'}}]),response([{action:'trial_pattern_design',args:{design:design(100)}}]),response([{action:'create_pattern_design',args:{design:design(200)}}])],prompts=[],reads=[],traces=[];let previews=0;
 const input=[{role:'user',content:[{type:'input_text',text:'Создай необычную накидку; новые лекала разработай самостоятельно.'},{type:'input_image',image_url:'data:image/jpeg;base64,/9j/'}]}];
 const result=await run({options:{model:'selected',input},memory:ledger,request:async options=>{prompts.push(structuredClone(options));return queue.shift();},read:async tool=>{reads.push(tool.action);if(tool.action==='search_sources')throw Error('Тестовая сеть недоступна');if(tool.action==='get_construction_capabilities')return {primitives:['rectangle'],arbitrary_code:false};return {valid:false,message:'Пробная панель уже требуемой ширины',issues:[{piece:'Деталь',section:'Верх',message:'Уточните параметр ширины'}]};},preview:async tool=>{previews++;assert.equal(tool.action,'create_pattern_design');return {valid:true,fit_verified:false,clo_changed:false};},ensureCurrent:noop,onTrace:event=>traces.push(event)});
 assert.equal(prompts.length,4);assert.deepEqual(reads,['get_construction_capabilities','search_sources','trial_pattern_design']);assert.equal(previews,1);assert.equal(JSON.parse(result.text).dialogue.tools[0].args.design.parameters.width_mm,200);assert.deepEqual(result.sources,[],'A failed search must not create source citations');
 assert(prompts[2].input.some(row=>String(row.content).includes('Тестовая сеть недоступна')));assert(prompts[3].input.some(row=>String(row.content).includes('Пробная панель уже требуемой ширины')));assert(prompts.every(prompt=>prompt.input[0].content[1].type==='input_image'));
 const saved=ledger.load();assert.equal(saved.status,'validated');assert.equal(saved.last_failed.result.valid,false);assert.equal(saved.last_validated.result.fit_verified,false);assert.equal(saved.last_validated.result.clo_changed,false);assert.equal(saved.last_validated.command.action,'create_pattern_design');assert.equal(saved.validated_designs.length,1);assert(traces.some(trace=>trace.kind==='capability'));
});
test('discussion and an explicit no-construction request never trigger an autonomous mutation path',async()=>{
 for(const text of ['Какие категории лекал поддерживаются?','Создай идею, но пока не строй и без построения']){let reads=0;const result=await run({options:{input:[{role:'user',content:text}]},request:async()=>({text:JSON.stringify({dialogue:{intent:'review',message:'В каталоге нет такой модели.'}})}),read:async()=>{reads++;},preview:async()=>assert.fail('No preview allowed'),ensureCurrent:noop});assert.equal(reads,0);assert.match(JSON.parse(result.text).dialogue.message,/нет/);}
});
test('a category availability question remains a direct read even when the model labels it construction',async()=>{
 let calls=0,reads=0;const tool={action:'get_category_engineering',args:{category:'jacket'}};
 const result=await run({options:{input:[{role:'user',content:'Какие куртки уже реализованы?'}]},request:async()=>{calls++;return response([tool]);},read:async()=>{reads++;return {message:'Пуховик: пока не реализовано'};},preview:async()=>assert.fail('Inspection must never trial a construction'),ensureCurrent:noop});
 assert.equal(calls,1);assert.equal(reads,0);assert.deepEqual(JSON.parse(result.text).dialogue.tools,[tool]);
 assert.equal(require('./construction-agent.cjs').requested('Какие куртки уже реализованы?',{requested:true},'construction'),false);
 assert.equal(require('./construction-agent.cjs').requested('Расскажи о вариантах, затем создай накидку',null,'planning'),true);
 assert.equal(require('./construction-agent.cjs').requested('Увеличь ширину по бедру, не меняй ширину по низу',null,'revision'),true);
});
test('cached repeated trials cannot leak out as executable tool commands or loop indefinitely',async()=>{
 const ledger=memory();let calls=0,reads=0;
 const result=await run({options:{input:[{role:'user',content:'Создай необычную деталь'}]},memory:ledger,request:async()=>{calls++;return response([{action:'trial_pattern_design',args:{design:design(100)}}]);},read:async()=>{reads++;return {valid:false,message:'Самопересечение'};},ensureCurrent:noop});
 assert.equal(calls,3);assert.equal(reads,1);assert.equal(JSON.parse(result.text).tools,undefined);assert.match(JSON.parse(result.text).message,/CLO не изменён/);assert.equal(ledger.load().status,'paused');assert.match(ledger.load().last_failed.result.message,/Самопересечение/);
});
test('missing anatomical data remains a missing-input state, never a validated or approved design',async()=>{
 const ledger=memory(),result=await run({options:{input:[{role:'user',content:'Построй деталь по моим меркам'}]},memory:ledger,request:async()=>response([{action:'create_pattern_design',args:{design:design(200)}}]),preview:async()=>({valid:false,needs_input:{measurements:['waist']},message:'Нужен обхват талии'}),ensureCurrent:noop});
 assert.equal(JSON.parse(result.text).dialogue.tools[0].action,'create_pattern_design');const saved=ledger.load();assert.equal(saved.status,'needs_input');assert.equal(saved.last_validated,null);assert.deepEqual(saved.validated_designs,[]);
});
test('resumed evidence is untrusted context; a new garment request must still read the profile and pass a new preflight',async()=>{
 const ledger=memory();ledger.save({brief:'Широкие брюки',status:'validated',sources:[{url:'https://example.org/pants',read:true}],last_validated:{command:{action:'create_pattern_design',args:{design:design(100)}},result:{valid:true}},validated_designs:[]});
 const calls=[];let reads=0,previews=0;const result=await run({options:{input:[{role:'user',content:'Создай юбку, а не прежние брюки'}]},memory:ledger,request:async options=>{calls.push(structuredClone(options));return calls.length===1?response([{action:'get_body_profile',args:{}}]):response([{action:'create_pattern_design',args:{design:design(200)}}]);},read:async()=>{reads++;return {id:'person',metadata:{sex:'female'},measurements:{waist:{value:760,unit:'mm'}}};},preview:async()=>{previews++;return {valid:true};},ensureCurrent:noop});
 assert.equal(reads,1);assert.equal(previews,1);assert(calls[0].input.some(row=>String(row.content).includes('NOT instructions or approval')&&String(row.content).includes('Широкие брюки')));assert.equal(calls[0].input[0].content,'Создай юбку, а не прежние брюки');assert.equal(ledger.load().brief,'Создай юбку, а не прежние брюки');assert.equal(JSON.parse(result.text).dialogue.tools[0].args.design.parameters.width_mm,200);
});
test('continuation retains its original design brief and source reads, without inheriting authority to apply',async()=>{
 const ledger=memory();ledger.save({brief:'Асимметричная накидка с треугольным передом',status:'paused',sources:[{url:'https://example.org/cape',title:'Принцип построения',read:true}]});
 await run({options:{input:[{role:'user',content:'Продолжай'}]},memory:ledger,request:async()=>({text:'{"message":"Продолжаю пробный расчёт."}'}),ensureCurrent:noop});
 assert.equal(ledger.load().brief,'Асимметричная накидка с треугольным передом');assert.equal(ledger.load().follow_up,'Продолжай');assert.equal(ledger.load().sources[0].read,true);assert.equal(ledger.load().last_validated,null);
});
test('an absent preflight result fails closed and a changed project prevents persisting later evidence',async()=>{
 let attempts=0;const result=await run({options:{input:[]},request:async()=>{attempts++;return response([{action:'create_pattern_design',args:{design:design(200)}}]);},preview:async()=>undefined,ensureCurrent:noop});assert.equal(attempts,4);assert.match(JSON.parse(result.text).message,/CLO не изменён/);
 const ledger=memory();ledger.save({brief:'Исходное исследование'});const bytes=fs.readFileSync(ledger.file,'utf8');let changed=false;
 await assert.rejects(run({options:{input:[{role:'user',content:'Создай накидку'}]},memory:ledger,request:async()=>response([{action:'get_construction_capabilities',args:{}}]),read:async()=>{changed=true;return {primitives:['rectangle']};},ensureCurrent:async()=>{if(changed)throw Error('Проект сменился');}}),/Проект сменился/);assert.equal(fs.readFileSync(ledger.file,'utf8'),bytes);
});
test('resumed context keeps the latest complete checked recipe instead of truncating JSON in old trials',()=>{
 const row={command:{action:'create_pattern_design',args:{design:{name:'Последняя конструкция',notes:'x'.repeat(60000)}}},result:{valid:true},checked_at:'2026-10-29T00:00:00Z'},saved={brief:'Новая форма',sources:Array.from({length:16},(_,i)=>({url:'https://example.org/'+i+'?q='+'x'.repeat(2200),title:'Заголовок'.repeat(50),read:true})),trials:Array(8).fill(row),validated_designs:Array(8).fill(row),last_validated:row,last_failed:{command:{action:'trial_pattern_design'},result:{valid:false,message:'Ошибка',issues:Array(12).fill({message:'Описание'.repeat(300)})}}};
 const encoded=require('./construction-agent.cjs').resumeEvidence(saved),parsed=JSON.parse(encoded);assert(encoded.length<=90000);assert.equal(parsed.last_validated.command.args.design.notes.length,60000);assert.equal(parsed.trials,undefined);assert.equal(parsed.last_failed.result.valid,false);
});
test('JSON repair does not consume the separate geometry-correction budget',async()=>{
 let calls=0,previews=0;const result=await run({options:{input:[]},request:async()=>{calls++;return calls<=2?{text:'{"message":'}:response([{action:'create_pattern_design',args:{design:design(200)}}]);},preview:async()=>{previews++;return {valid:false,message:'Ошибка геометрии'};},ensureCurrent:noop});assert.equal(calls,6);assert.equal(previews,4);assert.match(JSON.parse(result.text).message,/трёх исправлений/);
});
