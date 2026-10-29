'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {assess,describe,validateOwnArgs,validateAlterationArgs,alterationFeasibility}=require('./tailor-assessment.cjs');
function fixture(){return {id:'skirt-1',name:'Основа юбки',method:'parametric_design_v1',version:3,profile_id:'personal-1',profile_context:{name:'Тестовый профиль',sex:'female',metadata:{sex:'female'}},measurement_snapshot:{waist:{value:76,unit:'cm',source:'manual',status:'unverified'},hips:{value:1000,unit:'mm',source:'manual',status:'verified'},waist_hip_length:{value:200,unit:'mm',source:'manual',status:'verified'}},parameters:{length_mm:600,waist_ease_mm:10,hip_ease_mm:40,front_dart_length_mm:90,back_dart_length_mm:130,back_center_drop_mm:10,front_balance_mm:5,max_side_suppression_mm:30,seam_allowance_mm:10},pattern_design:{recipe:'patternmaking_skirt_v1'},recipe_details:{id:'patternmaking_skirt_v1',waist_closed_mm:770,hip_circumference_mm:1040,dart_count:8},pieces:[{id:'front',role:'front',name:'Перед',grainline:[[0,200],[0,570]],internal_lines:[[[10,0],[20,90]],[[30,0],[20,90]]],dart_details:[{name:'dart_0'}]},{id:'back',role:'back_left',name:'Спинка',grainline:[[400,200],[400,570]],internal_lines:[]}],sewing_graph:[{id:'side',a:{piece:0,segments:[4]},b:{piece:1,segments:[2]},ease_mm:0},{id:'dart',a:{piece:0,internal_line:0},b:{piece:0,internal_line:1},ease_mm:0}],qa_report:{valid:true,garment_version:3,fit_verified:true},material:{fabric_index:2}};}
function deepFreeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item);}return value;}

test('assessment is read-only, uses real garment snapshots and keeps all evidence provisional',()=>{
 const g=fixture(),args={query:'skirt-1',observations:[{kind:'pull',region:'waist',side:'back',source:'measurement',text:'Горизонтальное натяжение сзади, спереди спокойно.'}],fabric:{type:'woven',source:'measured',stretch_percent:0,recovery_percent:90,bias_cut:false}},before=structuredClone({g,args});deepFreeze(g);deepFreeze(args);
 const r=assess(g,args);assert.deepEqual({g,args},before);assert.equal(r.status,'provisional');assert.equal(r.read_only,true);assert.equal(r.fit_verified,false);assert.equal(r.sewing_ready,false);assert.equal(r.apply_authorized,false);assert.deepEqual(r.automatic_changes,[]);assert.equal(r.profile.sex,'female');assert.equal(r.profile.sex_inferred,false);assert.equal(r.profile.source,'construction_measurement_snapshot');assert.equal(r.profile.measurements.find(x=>x.id==='waist').value_mm,760);assert.equal(r.profile.measurements.find(x=>x.id==='waist').status,'unverified');
 assert.equal(r.construction.seam_map.declared_connections,2);assert.equal(r.construction.seam_map.internal_connections,1);assert.equal(r.construction.seam_map.native_sewing_verified,false);assert.equal(r.construction.material_assignment.fabric_index,2);assert.equal(r.construction.saved_geometry_check.independently_rerun,false);assert.equal(r.construction.recipe_facts.waist_closed_mm,770);
 const h=r.hypotheses[0];assert.equal(h.source,'measurement');assert.equal(h.evidence_status,'reported_not_independently_verified');assert.equal(h.diagnosis_confirmed,false);assert.equal(h.suggested_delta_mm,null);assert.ok(h.possible_causes.length>=3);assert.equal(h.orientation,'horizontal');assert.ok(h.required_checks.length>=3);
});

test('circumference ease and coupled front/back changes are never presented as a one-panel delta',()=>{
 const r=assess(fixture(),{observations:[{kind:'pull',region:'waist',side:'back'}]});
 const waist=r.construction.ease.find(x=>x.parameter==='waist_ease_mm'),hip=r.construction.ease.find(x=>x.parameter==='hip_ease_mm');assert.equal(waist.basis,'full_circumference');assert.equal(waist.body_mm,760);assert.equal(waist.target_finished_mm,770);assert.equal(waist.saved_finished_mm,770);assert.equal(hip.target_finished_mm,1040);
 const candidates=r.hypotheses[0].candidate_parameters,global=candidates.find(x=>x.id==='waist_ease_mm'),balance=candidates.find(x=>x.id==='front_balance_mm');assert.equal(global.coupled_scope,true);assert.match(global.preserve_caution,/Общий обхват/);assert.equal(balance.scope,'front_back_distribution');assert.equal(balance.coupled_scope,true);assert.match(balance.preserve_caution,/переда и спинки/);assert.ok(!candidates.some(x=>x.id==='front_dart_length_mm'));assert.ok(candidates.every(p=>Object.hasOwn(fixture().parameters,p.id)));
});

test('half-leg dimensions use their documented convention; body measurements are not multiplied',()=>{
 const g=fixture();g.method='balloon_tapered_v1';g.parameters={hip_ease_mm:160,waist_ease_mm:20,hem_flat_mm:260,knee_flat_mm:330};g.measurement_snapshot.garment_waist_girth={value:800,unit:'mm',source:'manual',status:'verified'};
 const r=assess(g),hem=r.construction.ease.find(x=>x.parameter==='hem_flat_mm');assert.equal(hem.basis,'half_leg_circumference');assert.equal(hem.target_finished_mm,520);assert.equal(hem.body_mm,null);assert.equal(hem.scope,'both_legs');assert.equal(r.construction.ease.find(x=>x.parameter==='waist_ease_mm').target_finished_mm,820);assert.equal(r.profile.measurements.find(x=>x.id==='hips').value_mm,1000);
});

test('a common back parameter names both actual halves instead of promising independent editing',()=>{
 const g=fixture();g.pieces.push({id:'right-back',role:'back_right',name:'Правая спинка'});
 const r=assess(g,{observations:[{kind:'wrinkle',region:'waist',side:'back'}]}),p=r.hypotheses[0].candidate_parameters.find(p=>p.id==='back_dart_length_mm');
 assert.equal(p.coupled_scope,true);assert.deepEqual(p.affected_piece_roles,['back_left','back_right']);assert.match(p.preserve_caution,/не меняет одну выбранную половинку независимо/);
});

test('unknown generic parameter meanings and absent local controls stay unknown',()=>{
 const g=fixture();delete g.pattern_design.recipe;delete g.recipe_details;g.parameters={waist_ease_mm:30,front_balance_mm:7,custom_width_mm:400};
 const r=assess(g,{observations:[{kind:'excess',region:'waist',side:'back'}]});assert.equal(r.construction.ease.length,0);assert.ok(r.construction.parameters.every(p=>p.basis==='unknown'&&p.coupled_scope===null));assert.equal(r.hypotheses[0].locality_status,'not_directly_supported');assert.deepEqual(r.hypotheses[0].candidate_parameters,[]);assert.match(r.hypotheses[0].required_checks.join(' '),/не найден параметр/);
});

test('actual workwear jacket chest and biceps ease are full girths with real profile values',()=>{
 const g=fixture();g.method='workwear_zip_jacket_v1';g.parameters={chest_ease_mm:180,biceps_ease_mm:80};g.measurement_snapshot={chest:{value:940,unit:'mm',status:'verified'},biceps:{value:300,unit:'mm',status:'unverified'}};
 const r=assess(g);assert.equal(r.construction.ease.find(x=>x.parameter==='chest_ease_mm').target_finished_mm,1120);assert.equal(r.construction.ease.find(x=>x.parameter==='biceps_ease_mm').target_finished_mm,380);assert.ok(r.construction.parameters.every(p=>p.coupled_scope));
});

test('insufficient evidence returns a useful provisional report without blocking construction',()=>{
 const r=assess({id:'new',name:'Неизвестная модель',parameters:{},pieces:[]});assert.equal(r.status,'provisional');assert.equal(r.observations_count,0);assert.deepEqual(r.hypotheses,[]);assert.ok(r.unresolved_checks.length>=4);assert.equal(r.profile.sex,'unspecified');assert.equal(r.profile.sex_inferred,false);assert.equal(r.construction.saved_geometry_check.version_matches,false);assert.equal(r.needs_input,undefined);assert.ok(r.next_steps.length>=3);
 const g=fixture();delete g.profile_context.sex;delete g.profile_context.metadata.sex;g.profile_context.name='Анастасия';assert.equal(assess(g).profile.sex,'unspecified');g.qa_report.garment_version=2;assert.equal(assess(g).construction.saved_geometry_check.version_matches,false);
});

test('fabric behavior is explicit evidence, not an invented negative ease or bias shortcut',()=>{
 for(const type of ['woven','knit','stretch_woven']){
  const r=assess(fixture(),{fabric:{type,source:'estimated',stretch_percent:75,recovery_percent:80}});assert.equal(r.fabric.bias_cut,null);assert.equal(r.fabric.stretch_percent,75);assert.equal(r.fabric.negative_ease_recommended,false);assert.equal(r.fabric.independently_verified,false);assert.equal(r.construction.ease.find(x=>x.parameter==='waist_ease_mm').current_value_mm,10);assert.match(r.unresolved_checks.join(' '),/проба растяжения/);
 }
 const r=assess(fixture(),{fabric:{type:'woven',source:'manufacturer',bias_cut:true},observations:[{kind:'twist',region:'grainline',source:'image'}]});assert.equal(r.fabric.bias_cut,true);assert.match(r.unresolved_checks.join(' '),/косой крой/);assert.match(r.hypotheses[0].required_checks[0],/без масштаба/);assert.equal(r.hypotheses[0].suggested_delta_mm,null);
});

test('illustrative upstream correction values never become a proposed adjustment',()=>{
 const r=assess(fixture(),{observations:[{kind:'pull',region:'waist',side:'back',text:'Спереди хорошо; 3/4 inch? Хочу понять причину.'}]});assert.equal(r.hypotheses[0].suggested_delta_mm,null);assert.deepEqual(r.hypotheses[0].automatic_changes,[]);assert.equal(r.apply_authorized,false);assert.ok(r.hypotheses[0].possible_causes.length>1);assert.doesNotMatch(r.hypotheses[0].possible_causes.join(' '),/19\.05|9\.525|3\/8|3\/4/);
});

test('alteration sums one physical edge at a time and retains required seam width',()=>{
 const args={required_increase_mm:38.1,edges:Array.from({length:4},(_,i)=>({id:'edge-'+i,available_mm:15.875,retain_mm:6}))},before=structuredClone(args);deepFreeze(args);const r=alterationFeasibility(args);assert.deepEqual(args,before);assert.equal(r.unit,'mm');assert.equal(r.measured_release_capacity_mm,39.5);assert.equal(r.status,'within_measured_capacity');assert.equal(r.deficit_mm,0);assert.equal(r.apply_authorized,false);assert.equal(r.fit_verified,false);assert.equal(r.sewing_ready,false);
 const two=alterationFeasibility({required_increase_mm:30,edges:[{id:'one',available_mm:16,retain_mm:6},{id:'two',available_mm:16,retain_mm:6}]});assert.equal(two.measured_release_capacity_mm,20);assert.equal(two.status,'exceeds_measured_capacity');assert.equal(two.deficit_mm,10);
 const none=alterationFeasibility({required_increase_mm:1,edges:[{id:'short',available_mm:4,retain_mm:6}]});assert.equal(none.measured_release_capacity_mm,0);assert.equal(none.warnings.length,1);
});

test('missing physical allowances remain unknown even with a large designed allowance',()=>{
 const r=alterationFeasibility({required_increase_mm:5,edges:[{id:'known',available_mm:20,retain_mm:6},{id:'unknown',retain_mm:6}]});assert.equal(r.status,'unknown');assert.equal(r.measured_release_capacity_mm,null);assert.equal(r.known_lower_bound_mm,14);assert.equal(r.deficit_mm,null);assert.equal(r.edges[1].releasable_mm,null);
 assert.throws(()=>alterationFeasibility({required_increase_mm:5,seam_allowance_mm:100,edges:[{id:'x',retain_mm:6}]}));
});

test('zero retained allowance is arithmetic only and never a recommendation to release the entire seam',()=>{
 const r=alterationFeasibility({required_increase_mm:30,edges:[{id:'a',available_mm:15,retain_mm:0},{id:'b',available_mm:15,retain_mm:0}]});
 assert.equal(r.measured_release_capacity_mm,30);assert.equal(r.status,'within_measured_capacity');assert.equal(r.warnings.length,2);assert.ok(r.warnings.every(w=>/нулевой остаток/.test(w)&&/не подтверждает работоспособный шов/.test(w)&&/не рекомендует выпускать весь припуск/.test(w)));assert.equal(r.apply_authorized,false);assert.equal(r.sewing_ready,false);
});

test('strict schemas reject unknown operations, duplicate edges, nonfinite values and executable getters',()=>{
 for(const args of [{fix:true},{observations:[{kind:'diagnosis',region:'waist'}]},{observations:[{kind:'pull',region:'alien'}]},{observations:[{kind:'pull',region:'waist',source:'verified'}]},{observations:[{kind:'pull',region:'waist',delta_mm:20}]},{fabric:{type:'knit',stretch_percent:301}},{fabric:{recovery_percent:NaN}},{fabric:{bias_cut:75}},{fabric:{name:'magic negative ease'}}])assert.throws(()=>validateOwnArgs(args));
 for(const args of [{required_increase_mm:-1,edges:[{id:'a',retain_mm:0}]},{required_increase_mm:5,edges:[]},{required_increase_mm:5,edges:[{id:'a',retain_mm:0},{id:'a',retain_mm:0}]},{required_increase_mm:5,edges:[{id:'a',available_mm:Infinity,retain_mm:0}]},{required_increase_mm:5,edges:[{id:'a',available_mm:10}]},{required_increase_mm:5,edges:[{id:'a',retain_mm:0,design_allowance_mm:100}]}])assert.throws(()=>validateAlterationArgs(args));
 let evaluated=false;const unsafe={};Object.defineProperty(unsafe,'query',{enumerable:true,get(){evaluated=true;return 'x';}});assert.throws(()=>validateOwnArgs(unsafe));assert.equal(evaluated,false);assert.throws(()=>validateOwnArgs(JSON.parse('{"__proto__":{"polluted":true}}')));assert.equal({}.polluted,undefined);
 const obs=Array.from({length:64},()=>({kind:'wrinkle',region:'overall'}));assert.equal(assess(fixture(),{observations:obs}).observations_count,64);assert.throws(()=>validateOwnArgs({observations:[...obs,{kind:'wrinkle',region:'overall'}]}));
 const edges=Array.from({length:64},(_,i)=>({id:'e'+i,available_mm:10,retain_mm:6}));assert.equal(alterationFeasibility({required_increase_mm:0,edges}).edges.length,64);assert.throws(()=>alterationFeasibility({required_increase_mm:0,edges:[...edges,{id:'overflow',retain_mm:0}]}));
});

test('describe returns independent schema data and reports pinned provenance',()=>{
 const a=describe();a.limits.observations=999;a.schema.assessment.observations.item.kind.push('unsafe');const b=describe();assert.equal(b.limits.observations,64);assert.equal(b.schema.assessment.observations.item.kind.includes('unsafe'),false);assert.equal(b.source.commit,'9554f15f4c20bfa121d1dc85db24cf4389c5b737');assert.equal(b.read_only,true);assert.equal(b.source.license,'MIT');assert.ok(b.rules.length>=5);
});

test('maximum distinct Cyrillic observations produce valid bounded JSON with exact omitted counts',()=>{
 const schema=describe().schema.assessment.observations.item,observations=Array.from({length:64},(_,i)=>({kind:schema.kind[i%schema.kind.length],region:schema.region[i%schema.region.length],side:schema.side[i%schema.side.length],source:schema.source[i%schema.source.length],text:'Наблюдение примерки кириллицей. '.repeat(30).slice(0,600)})),args={observations},before=structuredClone(args);
 const r=assess(fixture(),args),raw=JSON.stringify(r);assert.ok(raw.length<=40000,raw.length);assert.deepEqual(JSON.parse(raw),r);assert.deepEqual(JSON.parse(JSON.stringify({action:'assess_garment_fit',result:r}).slice(0,45000)).result,r);assert.deepEqual(args,before);assert.equal(r.output_coverage.complete,false);assert.equal(r.output_coverage.compacted,true);assert.equal(r.observations_count,64);assert.equal(r.output_coverage.observations_total,64);assert.equal(r.output_coverage.observations_represented+r.output_coverage.observations_omitted,64);assert.ok(r.output_coverage.observations_omitted>0);assert.ok(r.output_coverage.observation_texts_shortened>0);assert.equal(r.garment.version,3);assert.equal(r.source.commit,'9554f15f4c20bfa121d1dc85db24cf4389c5b737');assert.equal(r.limits.output_characters,40000);assert.ok(r.next_steps.length);assert.ok(r.unresolved_checks.length);assert.match(r.output_warning,/не полный отчёт/);assert.equal(r.fit_verified,false);assert.equal(r.apply_authorized,false);
});

test('repeated observations are grouped with representative text without silently losing counts',()=>{
 const observations=Array.from({length:64},(_,i)=>({kind:'pull',region:'waist',side:'back',source:'user',text:('Разное наблюдение '+i+': '+'я'.repeat(600)).slice(0,600)})),r=assess(fixture(),{observations});
 assert.ok(JSON.stringify(r).length<=40000);assert.equal(r.hypotheses.length,1);assert.equal(r.hypotheses[0].observation_count,64);assert.equal(r.hypotheses[0].observation_indices.length,64);assert.equal(r.output_coverage.observations_represented,64);assert.equal(r.output_coverage.observations_omitted,0);assert.equal(r.output_coverage.observation_texts_total,64);assert.equal(r.output_coverage.observation_texts_returned+r.output_coverage.observation_texts_omitted,64);assert.ok(r.output_coverage.observation_texts_omitted>0);assert.equal(r.output_coverage.complete,false);assert.ok(r.hypotheses[0].reported_text_is_excerpt);assert.equal(r.hypotheses[0].additional_text_samples.length,1);
});

test('large saved contexts stay bounded and explicitly disclose omitted parameters, measurements and pieces',()=>{
 const g=fixture();g.parameters={};g.pattern_design.parameter_labels={};g.measurement_snapshot={};g.pieces=[];
 for(let i=0;i<64;i++){g.parameters['custom_'+i]=i;g.pattern_design.parameter_labels['custom_'+i]='Параметр '+i+' я'.repeat(300);g.measurement_snapshot['body_'+i]={value:400+i,unit:'mm',status:'unverified',source:'Источник измерения '.repeat(100)};g.pieces.push({id:'piece-'+i,role:'panel_'+i,name:'Название детали '.repeat(30),internal_lines:[]});}
 const observations=Array.from({length:64},(_,i)=>({kind:'wrinkle',region:i%2?'waist':'overall',side:i%2?'left':'right',text:'Складки и натяжение '.repeat(40).slice(0,600)})),before=structuredClone(g),r=assess(g,{observations}),raw=JSON.stringify(r);
 assert.ok(raw.length<=40000,raw.length);assert.deepEqual(g,before);assert.equal(r.output_coverage.complete,false);for(const key of ['parameter_facts','measurements','pieces'])assert.equal(r.output_coverage[key+'_returned']+r.output_coverage[key+'_omitted'],64);assert.equal(r.limits.observations,64);assert.equal(r.source.license,'MIT');assert.equal(r.requires_preflight,true);assert.ok(r.next_steps.length);assert.equal(JSON.parse(raw).schema_version,1);
});

test('binary floating point noise does not become a fictitious alteration deficit',()=>{
 const r=alterationFeasibility({required_increase_mm:19.05,edges:[{id:'left',available_mm:25.4,retain_mm:15.875},{id:'right',available_mm:25.4,retain_mm:15.875}]});
 assert.equal(r.status,'within_measured_capacity');assert.equal(r.deficit_mm,0);assert.ok(Math.abs(r.measured_release_capacity_mm-19.05)<=1e-9);assert.ok(r.arithmetic_epsilon_mm<=1e-9);assert.equal(r.apply_authorized,false);
 const actual=alterationFeasibility({required_increase_mm:19.050001,edges:[{id:'left',available_mm:25.4,retain_mm:15.875},{id:'right',available_mm:25.4,retain_mm:15.875}]});assert.equal(actual.status,'exceeds_measured_capacity');assert.ok(actual.deficit_mm>1e-9);
});
