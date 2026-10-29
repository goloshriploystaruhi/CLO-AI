const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles}=require('./body-profiles.cjs'),{GarmentStore}=require('./garment-store.cjs'),draft=require('./draft-defaults.cjs'),catalog=require('../construction-catalog.json');
function setup(){const folder=testWorkspace.create('clo-draft-');return {profiles:new BodyProfiles(path.join(folder,'body.json')),store:new GarmentStore(path.join(folder,'garments.json'))};}
test('missing profile creates a resumable plan, explicit continuation builds every supported garment',async()=>{
 for(const method of Object.keys(catalog)){
  const {profiles,store}=setup(),plan=await store.build({method,parameters:{}},profiles);assert(plan.message,method);assert.equal(store.data.garments.length,0);
  const result=await store.build({method,approximateConsent:true},profiles);assert(result.patterns?.length,method);assert.equal(result.garment.approximate,true,method);assert.equal(result.garment.readiness.fit_verified,false);assert.equal(result.garment.readiness.sewing_ready,false);assert.equal(profiles.data.profiles.length,0);
 }
});
test('known dimensions and personal measurements are preserved; approximate status survives edits',async()=>{
 const {profiles,store}=setup();profiles.create({name:'Проверка'});profiles.update({measurement:'chest',value:104,unit:'cm'});const before=fs.readFileSync(profiles.file,'utf8');
 const r=await store.build({method:'tshirt_drop_v1',parameters:{length_mm:750},approximateConsent:true},profiles);
 assert.equal(r.garment.parameters.length_mm,750);assert.equal(r.garment.measurement_snapshot.chest.value,1040);assert.equal(fs.readFileSync(profiles.file,'utf8'),before);assert.equal(profiles.profile().measurements.chest.status,'unverified');
 store.commit(r,{patterns:r.patterns.map((p,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'hash'+i}))});
 const edit=await store.build({query:r.garment.id,parameter:'length_mm',delta_mm:20},profiles,true);assert.equal(edit.garment.approximate,true);assert.deepEqual(edit.garment.assumptions,r.garment.assumptions);assert.equal(edit.garment.parameters.length_mm,770);assert.equal(edit.garment.id,r.garment.id);
});
test('incomplete measurements never trigger unrequested approximation',async()=>{
 const {profiles,store}=setup();profiles.create({});const result=await store.build({method:'tshirt_drop_v1',parameters:{length_mm:750}},profiles);assert(result.message);assert.equal(result.patterns,undefined);assert.equal(Object.keys(profiles.profile().measurements).length,0);
});
test('basic draft dimensions are deterministic and validated',()=>{
 const r=draft.piece('rectangle',{width_mm:350});assert.equal(r.patterns[0].height_mm,600);assert.equal(r.patterns[0].width_mm,350);assert.equal(r.assumptions.length,1);assert.throws(()=>draft.piece('rectangle',{height_mm:-5}));assert.throws(()=>draft.piece('rectangle',{script:'x'}));assert.throws(()=>draft.piece('arbitrary_code',{}));
});
