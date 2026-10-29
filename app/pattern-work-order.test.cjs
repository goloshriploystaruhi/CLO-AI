const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PatternWorkOrders,validateSaveArgs,measurement,fingerprint,describe,LIMITS}=require('./pattern-work-order.cjs');
test('arc measurement has a shared finite subdivision budget and never substitutes a chord on exhaustion',()=>{
 const piece={role:'front',seam_contour:[{start:[0,0],c1:[0,100],c2:[100,100],end:[100,0]},{start:[100,0],end:[0,0]}]};assert.throws(()=>measurement(piece,{kind:'perimeter'},{remaining:1}),/лимит расчёта/);
});
const clone=value=>JSON.parse(JSON.stringify(value));
function rectangle(role='front',width=100,height=200){return {id:'piece-'+role,role,name:'Название '+role,seam_contour:[{start:[0,0],end:[width,0]},{start:[width,0],end:[width,height]},{start:[width,height],end:[0,height]},{start:[0,height],end:[0,0]}],seams:{hem:[2]}};}
function garment(){return {id:'g',version:1,parameters:{length_mm:200},pieces:[rectangle()],bindings:[{id:'piece-front',role:'front',pattern_id:10,fingerprint:'native'}]};}
function fixture(){const folder=testWorkspace.create('work-order-'),file=path.join(folder,'order.json'),store=new PatternWorkOrders(file,{project_id:'project-a'});return {folder,file,store};}
function spec(){return {name:'Деталь по заданию',brief:'Перед с заданными размерами',required_roles:['front'],finished_checks:[{id:'front-width',role:'front',kind:'width',target_mm:100,tolerance_mm:.01}],fabric:{type:'woven',source:'measured'}};}
test('brief and provisional unknowns save immediately, persist independently and do not manufacture measurements',()=>{
 const {store,file}=fixture(),saved=store.save({...spec(),assumptions:['Застёжка ещё не уточнена']});assert(saved.order.id);assert.equal(saved.order.revision,1);assert.equal(saved.provisional,true);assert.equal(saved.fit_verified,false);assert.equal(saved.sewing_ready,false);assert(!JSON.stringify(saved).includes('measurement_snapshot'));assert.equal(new PatternWorkOrders(file,{project_id:'project-a'}).read().order.id,saved.order.id);
});
test('requirements and targets cannot be removed or weakened, while annotation updates use optimistic revisions',()=>{
 const {store,file}=fixture(),saved=store.save(spec()),before=fs.readFileSync(file,'utf8'),id=saved.order.id;
 for(const change of [{required_roles:[]},{finished_checks:[]},{finished_checks:[{...spec().finished_checks[0],tolerance_mm:50}]},{brief:'Другое поручение'},{preserve_parameters:['length_mm']}])assert.throws(()=>store.save({id,expected_revision:1,...change}),/неизменны/);
 assert.equal(fs.readFileSync(file,'utf8'),before);assert.throws(()=>store.save({id,closure:'Молния'}),/версию/);const updated=store.save({id,expected_revision:1,closure:'Молния'});assert.equal(updated.order.revision,2);assert.deepEqual(updated.order.required_roles,['front']);assert.throws(()=>store.save({id,expected_revision:1,name:'Устаревшее имя'}),/версию/);
});
test('missing required pieces stay missing through binding, so incomplete construction cannot become green',()=>{
 const {store}=fixture();store.save({...spec(),required_roles:['front','facing']});const g=garment(),assessment=store.assess({garment:g});assert.equal(assessment.valid,false);assert.deepEqual(assessment.missing_roles,['facing']);const bound=store.bind({garment:g,native_confirmed:true});assert.deepEqual(bound.order.required_roles,['front','facing']);assert.deepEqual(bound.order.binding.roles.find(r=>r.role==='facing').piece_ids,[]);assert.equal(bound.assessment.valid,false);assert.equal(bound.assessment.native_measurements_verified,false);
});
test('fresh mathematical assessment measures actual contour rather than parameter labels and remains read-only',()=>{
 const {store,file}=fixture();store.save(spec());const g=garment(),bytes=fs.readFileSync(file,'utf8'),snapshot=clone(g);g.parameters.fake_width_mm=999;const checked=store.assess({garment:g});assert.equal(checked.checks[0].actual_mm,100);assert.equal(checked.checks[0].basis,'mathematical_model');assert.equal(checked.valid,true);assert.equal(checked.fit_verified,false);assert.equal(checked.sewing_ready,false);assert.equal(fs.readFileSync(file,'utf8'),bytes);delete g.parameters.fake_width_mm;assert.deepEqual(g,snapshot);
 const wrong=garment();wrong.pieces=[rectangle('front',90)];assert.equal(store.assess({garment:wrong}).checks[0].status,'failed');
 const unknown=fixture();unknown.store.save({...spec(),fabric:{}});assert.equal(unknown.store.assess({garment:garment()}).provisional,true);
});
test('Bezier arc lengths use curves, and bounds use extrema instead of endpoints or control polygon',()=>{
 const piece={role:'curve',id:'curve',seam_contour:[{start:[0,0],end:[100,0],c1:[0,100],c2:[100,100]},{start:[100,0],end:[0,0]}],seams:{top:[0]}};
 assert.equal(measurement(piece,{kind:'height'}).value,75);assert.equal(measurement(piece,{kind:'width'}).value,100);assert(Math.abs(measurement(piece,{kind:'segment_length',segments:[0]}).value-200)<.0005);assert(Math.abs(measurement(piece,{kind:'seam_length',seam:'top'}).value-200)<.0005);assert(Math.abs(measurement(piece,{kind:'perimeter'}).value-300)<.0005);
 const {store}=fixture();store.save({name:'Кривая',brief:'Контроль дуги',required_roles:['curve'],finished_checks:[{id:'arc',role:'curve',kind:'seam_length',seam:'top',target_mm:200,tolerance_mm:.001}]});assert.equal(store.assess({garment:{...garment(),pieces:[piece]}}).valid,true);
 const quadratic={...piece,seam_contour:[{start:[0,0],end:[100,0],control:[50,100]},{start:[100,0],end:[0,0]}]};assert.equal(measurement(quadratic,{kind:'height'}).value,50);assert(Math.abs(measurement(quadratic,{kind:'segment_length',segments:[0]}).value-147.89428575445976)<.0005);
});
test('missing named seam, unsupported curve, ambiguous role and disconnected contours remain unknown',()=>{
 for(const mutate of [g=>{g.pieces[0].seams={};},g=>{g.pieces[0].seam_contour[0].type='arc';},g=>{g.pieces.push(rectangle());},g=>{g.pieces[0].seam_contour[0].end=[90,0];}]){const {store}=fixture();store.save({...spec(),finished_checks:[{id:'hem',role:'front',kind:'seam_length',seam:'hem',target_mm:100,tolerance_mm:1}]});const g=garment();mutate(g);const checked=store.assess({garment:g});assert.equal(checked.valid,false);assert.equal(checked.checks[0].status,'unknown');assert.equal(checked.checks[0].actual_mm,null);}
});
test('version, geometry, native binding and profile changes invalidate saved evidence even for local edits',()=>{
 const {store}=fixture();store.save(spec());const original=garment();store.bind({garment:original,native_confirmed:true,profile_hash:'body-a'});assert.equal(store.assess({garment:original,profile_hash:'body-a'}).evidence_stale,false);
 for(const mutate of [g=>g.version++,g=>g.parameters.length_mm++,g=>g.pieces[0].seam_contour[0].start[0]++,g=>g.bindings[0].fingerprint='manual-edit']){const g=clone(original);mutate(g);assert.equal(store.assess({garment:g,profile_hash:'body-a'}).evidence_stale,true);}
 assert.equal(store.assess({garment:original,profile_hash:'body-b'}).evidence_stale,true);
});
test('stable role/ID binding survives a display-name change and never derives requirements from latest pieces',()=>{
 const {store}=fixture(),saved=store.save(spec()),g=garment();store.bind({garment:g,native_confirmed:true});const old=fingerprint(g);g.name='Новое название изделия';g.pieces[0].name='Переименованный перед';assert.equal(fingerprint(g),old);const next=store.bind({garment:g,native_confirmed:true});assert.equal(next.order.id,saved.order.id);assert.deepEqual(next.order.binding.roles,[{role:'front',piece_ids:['piece-front']}]);assert.equal(store.forGarment('g').id,saved.order.id);assert.equal(store.forGarment('other'),null);
});
test('preserved parameters require an actual baseline, retain it across rebinding and report later violations',()=>{
 const {store}=fixture();store.save({...spec(),preserve_parameters:['length_mm']});const g=garment();assert.equal(store.assess({garment:g}).preserved_parameters[0].status,'unknown');store.bind({garment:g,native_confirmed:true});assert.equal(store.assess({garment:g}).preserved_parameters[0].status,'passed');g.parameters.length_mm=210;const rebound=store.bind({garment:g,native_confirmed:true});assert.equal(rebound.assessment.valid,false);assert.equal(rebound.assessment.preserved_parameters[0].status,'failed');assert.equal(rebound.order.binding.parameter_snapshot.length_mm,200);
});
test('strict schemas reject code-like fields, getters, wrong units, nonfinite numbers and invalid seam indices',()=>{
 for(const args of [{...spec(),execute:true},{...spec(),required_roles:['front','front']},{...spec(),finished_checks:[{...spec().finished_checks[0],target_mm:Infinity}]},{...spec(),finished_checks:[{...spec().finished_checks[0],target_mm:100,unit:'cm'}]},{...spec(),finished_checks:[{id:'bad',role:'front',kind:'segment_length',segments:[-1],target_mm:1,tolerance_mm:1}]}])assert.throws(()=>validateSaveArgs(args));
 let ran=false;assert.throws(()=>validateSaveArgs({...spec(),get closure(){ran=true;return 'injected';}}));assert.equal(ran,false);const bad=JSON.parse('{"__proto__":{"polluted":true}}');assert.throws(()=>validateSaveArgs(bad));assert.equal({}.polluted,undefined);
 const roles=['front'];Object.defineProperty(roles,'0',{get(){ran=true;return 'front';}});assert.throws(()=>validateSaveArgs({...spec(),required_roles:roles}));assert.equal(ran,false);const inherited=Object.create({get name(){ran=true;return 'injected';}});Object.assign(inherited,{brief:'Описание',required_roles:['front']});assert.throws(()=>validateSaveArgs(inherited));assert.equal(ran,false);
});
test('corrupt or wrong-project sidecars fail closed without overwriting source bytes',()=>{
 const {store,file}=fixture();store.save(spec());const bytes=fs.readFileSync(file,'utf8');const other=new PatternWorkOrders(file,{project_id:'project-b'});assert.throws(()=>other.read(),/Исходный файл сохранён/);assert.equal(fs.readFileSync(file,'utf8'),bytes);fs.writeFileSync(file,'{bad');assert.throws(()=>store.save(spec()),/Исходный файл сохранён/);assert.equal(fs.readFileSync(file,'utf8'),'{bad');
});
test('schemas expose exact nested kinds and numeric bounds; oversized save fails before writing',()=>{
 const schema=describe();assert.equal(schema.save_schema.additionalProperties,false);const check=schema.save_schema.properties.finished_checks.items;assert.equal(check.additionalProperties,false);assert.equal(check.properties.segments.items.maximum,2047);assert.equal(check.properties.tolerance_mm.maximum,100);assert(schema.immutable_fields.includes('finished_checks'));assert.equal(schema.limits.saveCharacters,24000);
 const {store,file}=fixture();assert.throws(()=>store.save({...spec(),brief:'x'.repeat(6000),assumptions:Array.from({length:32},(_,i)=>i+'x'.repeat(595))}),/24000/);assert.equal(fs.existsSync(file),false);
});
test('large legal work orders and assessments stay complete JSON inside the local tool envelope',()=>{
 const {store}=fixture(),roles=Array.from({length:64},(_,i)=>'role_'+i+'_'+('r'.repeat(70))),parameters=Object.fromEntries(Array.from({length:64},(_,i)=>['param_'+i+'_'+('p'.repeat(70)),200])),checks=roles.slice(0,32).map((role,i)=>({id:'dimension_'+i+'_'+('c'.repeat(90)),role,kind:'width',target_mm:100,tolerance_mm:.001}));
 const g={...garment(),parameters,pieces:roles.map((role,i)=>({...rectangle(role),id:String(i)+'x'.repeat(120),name:'Очень длинное название детали '.repeat(100)}))};const saved=store.save({...spec(),required_roles:roles,preserve_parameters:Object.keys(parameters),finished_checks:checks});assert(JSON.stringify(saved).length<LIMITS.outputCharacters);const bound=store.bind({garment:g,native_confirmed:true});assert(JSON.stringify(bound).length<=LIMITS.outputCharacters);const assessment=store.assess({garment:g});assert(JSON.stringify(assessment).length<=LIMITS.outputCharacters);assert.equal(assessment.checks.length,32);assert.equal(assessment.required_roles.length,64);assert.equal(assessment.valid,true);assert.equal(JSON.parse(JSON.stringify({action:'check_work_order',result:assessment})).result.checks.length,32);assert.equal(store.read({id:saved.order.id}).order.finished_checks.length,32);
});
