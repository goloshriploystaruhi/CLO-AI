const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles}=require('./body-profiles.cjs'),{GarmentStore}=require('./garment-store.cjs');
const validation=require('./command-validation.cjs'),catalog=require('../construction-catalog.json');
const choices=[['balloon_tapered_v1','hem_flat_mm',250],['workwear_zip_jacket_v1','length_mm',520],['women_baggy_boilersuit_v1','torso_ease_mm',60]];

test('reference constructors work through the existing local AI tool/store create-edit-undo path without modifying personal profiles',async()=>{
 for(const [method,parameter,value_mm] of choices){
  const folder=testWorkspace.create('reference-store-');
  const profiles=new BodyProfiles(path.join(folder,'body.json')),store=new GarmentStore(path.join(folder,'garments.json'));
  profiles.create({name:'Проверка сохранности'});profiles.update({measurement:'chest',value:96,unit:'cm'});
  const snapshot=fs.readFileSync(profiles.file,'utf8');
  validation.tool({action:'create_garment',args:{method,parameters:{}}});
  const job=await store.build({method,parameters:{},approximateConsent:true},profiles);
  assert(job.patterns?.length,method);assert.equal(job.garment.method,method);assert.equal(job.garment.approximate,true);
  assert.equal(job.garment.readiness.fit_verified,false);assert.equal(fs.readFileSync(profiles.file,'utf8'),snapshot);
  const bindings=job.patterns.map((_,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'native-'+i}));
  store.commit(job,{patterns:bindings});
  validation.tool({action:'update_garment',args:{query:job.garment.id,parameter,value_mm}});
  const edit=await store.build({query:job.garment.id,parameter,value_mm},profiles,true);
  assert.equal(edit.garment.id,job.garment.id);assert.equal(edit.garment.parameters[parameter],value_mm);assert(edit.update_preview.reused>0);
  store.commit(edit,{patterns:bindings});
  const restored=await store.build({query:job.garment.id,_restore:true},profiles,true);
  assert.deepEqual(restored.garment.parameters,job.garment.parameters);assert.equal(restored.garment.version,3);
  assert.equal(fs.readFileSync(profiles.file,'utf8'),snapshot);
 }
});

test('the model sees distinct supported silhouettes and disclosed prototype limits',()=>{
 const {instructions,labels}=require('./engineering-methods.cjs');
 for(const [method] of choices){assert(instructions.includes(method));assert(catalog[method].limits.length);assert(catalog[method].source_references.every(s=>s.original_pattern_available===false));}
 for(const key of ['hem_dart_intake_mm','collar_fall_mm','cap_ease_mm'])assert(labels[key]);
 assert(instructions.includes('not original brand patterns'));assert(instructions.includes('No auto-sewing'));
});
