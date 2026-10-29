const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {GarmentStore}=require('./garment-store.cjs'),qa=require('./engineering-qa.cjs');
test('version-bound manual fitting evidence, persistent reports and invalidation on edit',async()=>{
 const folder=testWorkspace.create('shared-qa-');
 const store=new GarmentStore(path.join(folder,'garments.json')),profiles={tool(){throw Error('Выберите профиль');},snapshot:()=>({catalog:[]})};
 const job=await store.build({method:'tshirt_setin_engineering_v1',approximateConsent:true},profiles);
 const native=job=>({patterns:job.patterns.map((p,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'hash-'+job.garment.version+'-'+i,internal_lines:{status:'manual'}}))});
 store.commit(job,native(job));
 const report=await qa.check(store,'selected');assert(report.qa_report.valid);assert(fs.existsSync(report.files.json));
 assert(report.qa_report.assembly.links.some(l=>l.type==='растяжение рибаны'),'UTF-8 Russian seam types must survive the worker round trip');
 assert.match(fs.readFileSync(report.files.markdown,'utf8'),/Мерки и параметры/);
 const args={query:'selected',version:1,fingerprint:report.qa_report.quality.geometry_fingerprint,method:'clo_3d',notes:'Изолированный тест: наблюдения примерки на контрольном аватаре',confirmed:true};
 await assert.rejects(qa.review(store,{...args,confirmed:false}),/Подтвердите/);
 const reviewed=await qa.review(store,args);assert(reviewed.qa_report.quality.statuses.includes('FIT_REVIEWED'));assert.equal(reviewed.qa_report.sewing_ready,false);
 await assert.rejects(qa.review(store,{...args,version:2}),/Конструкция изменилась/);
 const edited=await store.build({query:'selected',parameter:'length_mm',delta_mm:20},profiles,true);assert(edited.qa_report.quality.statuses.includes('FIT_REVIEW_REQUIRED'));assert(!edited.qa_report.quality.statuses.includes('FIT_REVIEWED'));
 const restored=new GarmentStore(store.file);assert(restored.find('selected').fit_review);assert(fs.readFileSync(path.join(folder,'garments',job.garment.id,'qa-journal.jsonl'),'utf8').trim().split('\n').length>=3);
});
