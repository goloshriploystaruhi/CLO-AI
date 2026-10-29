const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const policy=require('./measurement-fields.js'),{BodyProfiles,catalog}=require('./body-profiles.cjs'),methods=require('../construction-catalog.json');
const store=()=>new BodyProfiles(path.join(testWorkspace.create('field-policy-'),'profiles.json'));
test('compact catalogue retains every basic, construction and planning field without ambiguous legacy fields',()=>{
 assert.equal(catalog.length,63);assert.equal(catalog.filter(d=>policy.visible(d)).length,40);
 const active=new Set(catalog.filter(d=>policy.visible(d)).map(d=>d.id));
 for(const m of Object.values(methods))for(const key of [...m.required_measurements,...(m.recommended_measurements||[])])assert(active.has(key),m.id+': '+key);
 for(const d of catalog)if(d.required_for.length)assert(active.has(d.id),d.id);
 for(const id of ['waist_level','seat_length']){const d=catalog.find(m=>m.id===id);assert.equal(d.profile_visible,false);assert.equal(d.hidden_reason,'ambiguous_legacy');assert.equal(d.replacement_ids,undefined,'Ambiguous values must not acquire an automatic replacement');}
 for(const id of ['seated_depth','crotch_arc','waist_hip_length','garment_waist_girth'])assert(active.has(id));
});
test('sex-specific visibility is shared by Node/browser and keeps common anatomy visible',()=>{
 const browser={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'measurement-fields.js'),'utf8'),browser);
 for(const sex of ['female','male','unspecified',undefined])for(const d of catalog)assert.equal(browser.MeasurementFields.visible(d,sex),policy.visible(d,sex));
 assert.equal(catalog.filter(d=>policy.visible(d,'male')).length,37);assert.equal(catalog.filter(d=>policy.visible(d,'female')).length,40);
 for(const id of policy.femaleIds){const d=catalog.find(m=>m.id===id);assert(!policy.visible(d,'male'));assert(policy.visible(d,'female'));assert(policy.visible(d,'unspecified'));}
 for(const id of ['chest','chest_width','front_waist_length','waist','hips','seated_depth','crotch_arc'])assert(policy.visible(catalog.find(d=>d.id===id),'male'),id);
 assert(policy.visible({id:'custom_measurement'},'male'));assert(!policy.visible({applies_to:['male']},'female'));assert(policy.visible({applies_to:['male']},'male'));assert(policy.visible({applies_to:['male']},'unspecified'));
});
test('new registered dependencies automatically return an otherwise unused field to the form',()=>{
 const extra={id:'new_required',name:'Новая мерка'},defs=policy.annotate([extra],{methods:{future:{required_measurements:['new_required']}}});
 assert(policy.visible(defs[0],'male'));assert(policy.visible(defs[0],'female'));
 const maleOnly=policy.annotate([{...extra,applies_to:['male']}],{basicIds:['new_required']})[0];assert(policy.visible(maleOnly,'male'));assert(!policy.visible(maleOnly,'female'));assert(policy.visible(maleOnly));
});
test('planning checklists do not require hidden female fields from male profiles',()=>{
 const s=store(),female=s.create({name:'Женский',metadata:{sex:'female'}}),male=s.create({name:'Мужской',metadata:{sex:'male'}});
 assert(!s.required('planning:underwear').required.includes('underbust'));
 assert(!s.validate({id:male.id,method:'planning:underwear'}).missing.includes('underbust'));
 assert(s.validate({id:female.id,method:'planning:underwear'}).missing.includes('underbust'),'Explicit non-active profile must use its own sex');
 s.tool('update_profile_metadata',{id:male.id,metadata:{sex:'unspecified'}});assert(s.required('planning:underwear').required.includes('underbust'));
 // A real base never loses its exact mathematical inputs due to presentation.
 s.tool('update_profile_metadata',{id:male.id,metadata:{sex:'male'}});
 for(const m of Object.values(methods))assert.deepEqual(s.required('garment:'+m.id).required,m.required_measurements);
});
test('reading compact definitions and changing sex preserves hidden values and historical provenance',()=>{
 const s=store(),p=s.create({name:'Архив',metadata:{sex:'female'}});
 for(const measurement of ['underbust','bust_height','bust_spacing','waist_level','seat_length','foot_length'])s.update({measurement,value:30,unit:'cm',note:'Исходные ориентиры',source:'import',status:'unverified'});
 const before=structuredClone(s.profile().measurements),history=structuredClone(s.profile().history);
 s.definitions();s.snapshot();s.tool('update_profile_metadata',{metadata:{sex:'male'}});
 const restored=new BodyProfiles(s.file).profile(p.id);assert.deepEqual(restored.measurements,before);assert.deepEqual(restored.history,history);
 assert(s.definitions().find(d=>d.id==='foot_length'));assert(s.definitions().find(d=>d.id==='seat_length'));
 const custom=s.tool('add_custom_measurement',{name:'Своя мерка',instruction:'По отмеченным точкам',landmarks:'А и Б'});assert(policy.visible(s.definitions().find(d=>d.id===custom.id),'male'));
});
