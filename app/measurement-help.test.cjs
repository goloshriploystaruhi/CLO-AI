const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles,catalog}=require('./body-profiles.cjs'),help=require('./measurement-help.js');
const setup=()=>new BodyProfiles(path.join(testWorkspace.create('universal-profile-'),'body.json'));
test('every built-in measurement has distinct authored help and extensible illustration metadata',()=>{
 for(const m of catalog){const h=help.getHelp(m);assert(h.title&&h.short_description&&h.detailed_description);assert(h.steps.length>=2);assert(h.body_position&&h.tape_position);assert(h.common_mistakes.length);assert.equal(h.measurement_unit,m.unit);assert.equal(h.illustration.src,'assets/measurements/'+m.id+'.gif');assert(h.illustration.poster.endsWith('.png'));assert(h.illustration.alt);assert(h.method_reference.definition);assert(help.locales.ru[m.id].title);}
 assert.equal(new Set(help.basicIds).size,32);assert(help.basicIds.every(id=>catalog.some(m=>m.id===id)));
 assert.match(help.getHelp(catalog.find(m=>m.id==='hip_height')).short_description,/от пола/);
 assert.match(help.getHelp(catalog.find(m=>m.id==='waist_hip_length')).short_description,/от.*талии/);
});
test('migration backs up bytes and preserves identities, notes, metadata, units, history and custom measurements',()=>{
 const s=setup(),old={version:1,active:'old-person',profiles:[{id:'old-person',name:'Иван',units:'in',metadata:{category:'trousers'},measurements:{hips:{value:1020,unit:'mm',source:'estimated',status:'disputed'},hip_height:{value:800,unit:'mm'}},notes:[{text:'Старая инструкция'}],history:[{old:true}]}],custom:[{id:'custom_old',name:'Моя мерка',instruction:'По отмеченным точкам',landmarks:['А','Б'],unit:'mm'}]};
 const raw=JSON.stringify(old);fs.writeFileSync(s.file,raw);const migrated=new BodyProfiles(s.file);assert.equal(fs.readFileSync(s.file+'.pre-universal-v1.json','utf8'),raw);
 const p=migrated.profile();assert.equal(p.id,'old-person');assert.equal(p.profile_type,'person');for(const key of ['notes','history','units','metadata'])assert.deepEqual(p[key],old.profiles[0][key]);assert.deepEqual(p.measurements.hips,old.profiles[0].measurements.hips);assert.equal(p.measurements.hip_height.value,800);assert.equal(p.measurements.hip_height.source,'import');assert(p.measurements.hip_height.migration_source_unknown);assert.equal(p.measurements.hip_height.status,'unverified');
 assert.equal(migrated.definitions().find(m=>m.id==='custom_old').help.title,'Моя мерка');assert.equal(new BodyProfiles(s.file).profile().measurements.hip_height.value,800);
});
test('unusual dimensions and contradictions warn without blocking persistence; invalid format and units still reject',()=>{
 const s=setup();s.create({name:'Человек'});let r=s.update({measurement:'waist',value:8,unit:'cm'});assert.equal(r.value,80);assert(r.warnings.length);
 r=s.update({measurement:'height',value:410,unit:'cm',source:'estimated'});assert(r.warnings.length);assert.equal(r.source,'estimated');
 s.update({measurement:'outseam',value:100,unit:'cm'});r=s.update({measurement:'inseam',value:120,unit:'cm'});assert.match(r.warnings.join(' '),/Длина/);
 assert.throws(()=>s.update({measurement:'height',value:NaN,unit:'cm'}));assert.throws(()=>s.update({measurement:'height',value:170,unit:'kg'}));s.update({measurement:'shoulder_slope',value:0,unit:'deg'});
 assert.equal(new BodyProfiles(s.file).profile().measurements.inseam.value,1200);
 const history=structuredClone(s.profile().history);s.update({measurement:'outseam',value:140,unit:'cm'});assert.deepEqual(s.profile().measurements.inseam.warnings,[]);assert.deepEqual(s.profile().history.slice(0,-1),history);
});
test('future profile schema is rejected without rewriting the source',()=>{const s=setup(),raw=JSON.stringify({version:1,schema_version:99,profiles:[]});fs.writeFileSync(s.file,raw);assert.throws(()=>new BodyProfiles(s.file),/новым CLO AI/);assert.equal(fs.readFileSync(s.file,'utf8'),raw);});
test('one person supports multiple garment requirement sets without copying or changing stored values',()=>{
 const s=setup();s.create({name:'Человек'});s.update({measurement:'chest',value:98,unit:'cm'});const before=structuredClone(s.profile().measurements);
 for(const method of ['planning:trousers','planning:tshirt','planning:jacket'])s.validate({method});assert.equal(s.data.profiles.length,1);assert.deepEqual(s.profile().measurements,before);
});
