const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),tools=require('./garment-patternmaking-tools.cjs'),validation=require('./command-validation.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const dir=testWorkspace.create('garment-order-tools-'),piece=role=>({id:role,role,name:role,seam_contour:[{start:[0,0],end:[100,0]},{start:[100,0],end:[100,200]},{start:[100,200],end:[0,200]},{start:[0,200],end:[0,0]}]}),a={id:'a',version:1,parameters:{length_mm:200},pieces:[piece('front'),piece('facing')],bindings:[{id:'front',pattern_id:1,fingerprint:'a'}]},b={...clone(a),id:'b'};
 const context={stores:{garments:{file:path.join(dir,'garments.json'),find:id=>id==='b'?b:a}},runtime:{state:{project_id:'project'},assertGarment:id=>id==='b'?b:a},turn:{ticket:{project_id:'project'},current_user_text:'Увеличь ширину переда до20см, остальное не меняй.'}},spec={name:'Требования',brief:'Перед и обтачка',required_roles:['front','facing'],finished_checks:[{id:'width',role:'front',kind:'width',target_mm:100,tolerance_mm:.1}]};return {context,a,b,spec,store:tools.orders(context)};}
test('new knowledge is available through strict existing command and capability paths',async()=>{
 const catalog=tools.catalog();assert.equal(catalog.knowledge.counts.cards,26);assert(catalog.knowledge.card_details_omitted);assert(catalog.work_order.schema.save_schema.properties.query);assert(catalog.work_order.schema.save_schema.properties.brief_change_quote);
 validation.tool({action:'read_garment_patternmaking',args:{id:'garmentcad:required-roles'}});const result=await require('./construction-tools.cjs').read({action:'read_garment_patternmaking',args:{id:'garmentcad:required-roles'}},{});assert.match(result.body,/из задания/);assert.equal(result.verification.sewing_ready,false);
 const found=require('./construction-references.cjs').search('Обтачка, подкладка и полнота комплекта',{limit:4});assert(found.results.some(r=>r.provider==='garment-patternmaking'&&r.read_tool==='read_garment_patternmaking'));
 for(const t of [{action:'read_garment_patternmaking',args:{id:'../../secret'}},{action:'save_pattern_work_order',args:{name:'Данные',execute:true}},{action:'check_pattern_work_order',args:{query:'a',source:'native'}}])assert.throws(()=>validation.tool(t));
});
test('a bound work order from another garment cannot override the actual garment contract',()=>{
 const h=fixture(),a=h.store.save(h.spec);h.store.bind({id:a.order.id,garment:h.a,native_confirmed:true});const b=h.store.save({...h.spec,required_roles:['front']});h.store.bind({id:b.order.id,garment:h.b,native_confirmed:true});h.context.turn.work_order_id=b.order.id;
 const report=tools.guard(h.context,h.a);assert.equal(report.allows_construction,false);assert.match(report.message,/другим изделием/);
});
test('new records and unbound turn scope cannot silently remove a facing or loosen a saved tolerance',async()=>{
 const h=fixture(),saved=h.store.save(h.spec);h.store.bind({id:saved.order.id,garment:h.a,native_confirmed:true});const before=fs.readFileSync(h.store.file,'utf8');
 await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{...h.spec,query:'a',required_roles:['front']}},h.context),/ослабляет/);assert.equal(fs.readFileSync(h.store.file,'utf8'),before);
 await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{...h.spec,query:'a',finished_checks:[{...h.spec.finished_checks[0],tolerance_mm:20}]}},h.context),/ослабляет/);
 const weak=h.store.save({...h.spec,required_roles:['front'],finished_checks:[]});h.context.turn.work_order_id=weak.order.id;assert.equal(tools.guard(h.context,h.a).allows_construction,false);
});
test('a target revision needs a verbatim current user instruction and keeps old requirements for comparison',async()=>{
 const h=fixture(),saved=h.store.save(h.spec);h.store.bind({id:saved.order.id,garment:h.a,native_confirmed:true});const args={...h.spec,query:'a',finished_checks:[{...h.spec.finished_checks[0],target_mm:200}]};
 await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args},h.context),/цитату/);await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{...args,brief_change_quote:'Пользователь разрешил всё убрать'}},h.context),/Цитата/);
 const next=await tools.read({action:'save_pattern_work_order',args:{...args,brief_change_quote:h.context.turn.current_user_text}},h.context);assert.notEqual(next.order.id,saved.order.id);assert.equal(h.store.read({id:saved.order.id}).order.finished_checks[0].target_mm,100);assert.deepEqual(next.order.required_roles,['front','facing']);assert(next.order.assumptions.some(s=>s.includes('Увеличь ширину')));
 const candidate=clone(h.a);candidate.version=2;candidate.pieces[0].seam_contour.forEach(s=>{s.start[0]*=2;s.end[0]*=2;});assert.equal(tools.guard(h.context,candidate).allows_construction,true);
});

function pairBrief(){return {name:'Два независимых экземпляра',brief:'Полный комплект из двух самостоятельных сборок, по три детали в каждой.',required_roles:['left_a','left_b','left_c','right_a','right_b','right_c'],finished_checks:[],assumptions:['Опытная конструкция без проверки физической посадки.']};}
const singleRequest='Давай тогда создадим один носок, не обязательно пару';

test('a quoted annotation-only update keeps existing notes even when no requirement fork is needed',async()=>{
 const h=fixture(),assumptions=Array.from({length:32},(_,i)=>'Сохранённая заметка '+i),initial=h.store.save({...pairBrief(),assumptions});
 h.context.turn.current_user_text='Уточни описание обработки манжеты, состав комплекта сохрани';
 const result=await tools.read({action:'save_pattern_work_order',args:{id:initial.order.id,expected_revision:1,closure:'Уточнённая обработка манжеты',brief_change_quote:h.context.turn.current_user_text}},h.context);
 assert.equal(result.order.id,initial.order.id);assert.equal(result.order.revision,2);assert.deepEqual(result.order.assumptions,assumptions);
});

test('a natural current request revises an unbuilt six-piece brief to three pieces without a formal verb template',async()=>{
 const h=fixture(),initial=await tools.read({action:'save_pattern_work_order',args:pairBrief()},h.context),before=h.store.read({id:initial.order.id}).order;
 h.context.turn.current_user_text=singleRequest;
 const next=await tools.read({action:'save_pattern_work_order',args:{id:initial.order.id,expected_revision:1,name:'Один опытный экземпляр',brief:'Один экземпляр из трёх деталей.',required_roles:['left_a','left_b','left_c'],brief_change_quote:singleRequest}},h.context);
 assert.notEqual(next.order.id,initial.order.id);assert.equal(next.previous_order_id,initial.order.id);assert.equal(next.requirements_revised,true);
 assert.deepEqual(next.order.required_roles,['left_a','left_b','left_c']);assert.deepEqual(h.store.read({id:initial.order.id}).order,before);
 assert.equal(next.revision.previous_revision,1);assert.equal(next.revision.source,'current_user_message');assert.match(next.revision.user_message_sha256,/^[a-f0-9]{64}$/);
 assert.equal(h.context.turn.work_order_id,next.order.id);assert.equal(next.clo_changed,false);assert.equal(next.profile_changed,false);assert(next.order.assumptions.some(s=>s.includes(singleRequest)));
});

test('an unbuilt active brief cannot be silently weakened by saving a new ID-less order',async()=>{
 const h=fixture(),initial=await tools.read({action:'save_pattern_work_order',args:pairBrief()},h.context),before=fs.readFileSync(h.store.file,'utf8');
 await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{...pairBrief(),required_roles:['left_a','left_b','left_c']}},h.context),/ослабляет/);
 assert.equal(fs.readFileSync(h.store.file,'utf8'),before);assert.equal(h.store.read().order.id,initial.order.id);
});

test('bound garment requirements can be forked with the same natural current request while preserving the original baseline',async()=>{
 const h=fixture(),initial=h.store.save(h.spec);h.store.bind({id:initial.order.id,garment:h.a,native_confirmed:true});const before=h.store.read({id:initial.order.id}).order;
 h.context.turn.current_user_text='Мне достаточно одного переда для этого опыта, обтачку пока исключаем.';
 const next=await tools.read({action:'save_pattern_work_order',args:{id:initial.order.id,expected_revision:1,required_roles:['front'],brief_change_quote:h.context.turn.current_user_text}},h.context);
 assert.notEqual(next.order.id,initial.order.id);assert.equal(next.order.binding.garment_id,h.a.id);assert.equal(h.store.forGarment(h.a.id).id,next.order.id);
 assert.deepEqual(h.store.read({id:initial.order.id}).order,before);assert.deepEqual(next.order.required_roles,['front']);assert.equal(next.order.finished_checks.length,1);
});

test('historical, invented, extracted and explicitly read-only quotations cannot revise a pending brief',async()=>{
 for(const [current,quote]of [['Проверь пока прежнюю пару.',singleRequest],[singleRequest,'Пользователь разрешил удалить всё'],['Не создавай один носок; сохрани прежнее задание.','создавай один носок'],['Ничего не меняй. '+singleRequest,'Ничего не меняй. '+singleRequest],...['Объясни проблему','Проверь пока прежнюю пару','Не создавай один носок; сохрани прежнее задание'].map(text=>[text,text])]){
  const h=fixture(),saved=await tools.read({action:'save_pattern_work_order',args:pairBrief()},h.context),before=fs.readFileSync(h.store.file,'utf8');h.context.turn.current_user_text=current;
  await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{id:saved.order.id,expected_revision:1,required_roles:['left_a','left_b','left_c'],brief_change_quote:quote}},h.context),/Цитата/);
  assert.equal(fs.readFileSync(h.store.file,'utf8'),before);
 }
});

test('a pending unbound work order still guards a fresh turn or restored draft without a turn-local order ID',async()=>{
 const h=fixture(),saved=await tools.read({action:'save_pattern_work_order',args:pairBrief()},h.context);
 h.context.turn={ticket:{project_id:'project'},current_user_text:'Построй актуальный пробный вариант'};
 const candidate={...clone(h.a),id:'new-candidate',pieces:['left_a','left_b','left_c'].map(role=>({...clone(h.a.pieces[0]),id:role,role,name:role}))};
 const report=tools.guard(h.context,candidate);assert.equal(report.order_id,saved.order.id);assert.equal(report.allows_construction,false);assert.deepEqual(report.missing_roles,['right_a','right_b','right_c']);
 h.store.bind({id:saved.order.id,garment:h.b,native_confirmed:true});assert.equal(tools.guard(h.context,candidate),null,'Another bound garment must not supply the new garment brief');
});

test('long multiline current instructions use bounded audit text and keep all existing notes',async()=>{
 const h=fixture(),spec={...pairBrief(),assumptions:Array.from({length:32},(_,i)=>'Исходное замечание '+i)},saved=await tools.read({action:'save_pattern_work_order',args:spec},h.context);
 const request=singleRequest+'\n\n'+('Сохраняем остальные размеры и предварительный статус. '.repeat(80));assert(request.length>600);h.context.turn.current_user_text=request;
 const next=await tools.read({action:'save_pattern_work_order',args:{id:saved.order.id,expected_revision:1,required_roles:['left_a','left_b','left_c'],brief_change_quote:request}},h.context);
 assert.equal(next.order.assumptions.length,32);assert.deepEqual(next.order.assumptions,spec.assumptions);assert.equal(next.requirements_revised,true);assert.equal(next.revision.source,'current_user_message');assert(JSON.stringify(next).length<42000);
 const another=fixture(),first=await tools.read({action:'save_pattern_work_order',args:pairBrief()},another.context);another.context.turn.current_user_text=request;
 const annotated=await tools.read({action:'save_pattern_work_order',args:{id:first.order.id,expected_revision:1,required_roles:['left_a','left_b','left_c'],brief_change_quote:request}},another.context);
 assert(annotated.order.assumptions.every(s=>s.length<=600));assert(annotated.order.assumptions.some(s=>s.includes('SHA256:')));
});

test('current-message whitespace and NFC normalization is accepted, stale order revisions are not',async()=>{
 const h=fixture(),saved=await tools.read({action:'save_pattern_work_order',args:pairBrief()},h.context);h.context.turn.current_user_text='Давай  тогда\nсоздадим один носок, не обязательно пару'.normalize('NFD');
 const next=await tools.read({action:'save_pattern_work_order',args:{id:saved.order.id,expected_revision:1,required_roles:['left_a','left_b','left_c'],brief_change_quote:singleRequest}},h.context);assert(next.requirements_revised);
 const changed=h.store.save({id:next.order.id,expected_revision:1,name:'Уточнённое имя'});assert.equal(changed.order.revision,2);
 await assert.rejects(()=>tools.read({action:'save_pattern_work_order',args:{id:next.order.id,expected_revision:1,required_roles:['left_a'],brief_change_quote:singleRequest}},h.context),/Задание изменилось/);
});
