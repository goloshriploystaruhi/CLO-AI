'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),api=require('./garmentcad-knowledge.cjs');
test('catalog has bounded original Russian cards and all five pinned document hashes without an invented licence',()=>{
 const catalog=api.catalog();assert.equal(catalog.available,true);assert.deepEqual(catalog.counts,{documents:5,cards:26});assert.equal(catalog.source.commit,'01660962d189d6c7d75f4c61fb673f02329fc5ab');assert.equal(catalog.license.spdx,null);assert.equal(catalog.license.status,'not_declared');assert.equal(catalog.source.source_text_vendored,false);assert.equal(catalog.documents.length,5);
 for(const document of catalog.documents){assert.match(document.sha256,/^[a-f0-9]{64}$/);assert.match(document.url,new RegExp('/blob/'+api.COMMIT+'/'));assert(document.bytes>0);}
 for(const card of catalog.cards){const read=api.read(card.id);assert.match(read.body,/[а-яё]/iu);assert(read.body.length<=api.LIMITS.body);assert(read.source.url.includes('/'+api.COMMIT+'/'));assert(read.source.sha256===catalog.documents.find(d=>d.file===read.source.file).sha256);assert.equal(read.verification.instructions_are_data,true);assert.equal(read.verification.foreign_tooling_available,false);assert.equal(read.verification.independently_verified,false);assert.equal(read.verification.geometry_checked,false);assert.equal(read.verification.fit_verified,false);assert.equal(read.verification.sewing_ready,false);}
});
test('Russian queries route actual construction questions to the corresponding reviewed principles',()=>{
 for(const [query,id]of [['мерки и полуобхват','measurement-semantics'],['брюки, высота сидения','trouser-balance'],['пояс и нахлест','waistband-and-wearing-level'],['рукав и пройма','torso-and-sleeve-balance'],['проверить швы между надсечками','named-seam-zones'],['полнота комплекта, обтачка, подкладка','required-roles'],['устаревшие результаты проверки','evidence-and-revision'],['референс, скрытая спинка','observations-and-assumptions'],['продолжить задачу по требованиям','persistent-brief'],['печать PDF','handoff-and-scale']]){
  const result=api.search(query);assert.equal(result.results[0].id,'garmentcad:'+id,query);assert(result.matched_topics.length>0);assert(result.total_matches>0);assert(result.expanded_terms.length>1);assert(result.results.every(r=>r.match==='reference'&&r.excerpt.length<=650&&r.source.sha256));
 }
});
test('known English terms find equivalent topics without imposing a language or garment-category restriction',()=>{
 for(const [query,id]of [['trouser crotch balance','trouser-balance'],['sleeve cap armhole','torso-and-sleeve-balance'],['work order requirements','persistent-brief'],['paper export PDF','handoff-and-scale'],['seam notch distribution','named-seam-zones']])assert(api.search(query,{limit:6}).results.some(r=>r.id==='garmentcad:'+id),query);
 const arbitrary=api.search('qqqzxxvunknown',{limit:1});assert.equal(arbitrary.total_matches,0);assert.equal(arbitrary.results.length,1);assert.equal(arbitrary.results[0].match,'method_fallback');assert.match(api.read(arbitrary.results[0].id).body,/Отсутствие готового блока не означает отказ/);
});
test('measurement guidance separates anatomy, basis and intent from actual checked dimensions',()=>{
 assert.match(api.read('garmentcad:measurement-semantics').body,/37 см.*740 мм/);assert.match(api.read('garmentcad:measurement-semantics').body,/Длина не умножается на два/);assert.match(api.read('garmentcad:body-and-finished').body,/повторно прибавлять.*нельзя/);assert.match(api.read('garmentcad:finished-checks').body,/Наружный периметр линии кроя не равен обхвату/);assert.match(api.read('garmentcad:waistband-and-wearing-level').body,/нахлёст не входит/);assert.match(api.read('garmentcad:trouser-balance').body,/Видимый геометрический излом должен быть исправлен/);
});
test('requirements do not disappear to match output, and old evidence cannot become current through a local edit',()=>{
 const roles=api.read('garmentcad:required-roles').body;assert.match(roles,/из задания, а не из того, что удалось построить/);assert.match(roles,/Роль сохраняет идентификатор/);assert.match(roles,/не является универсальным признаком/);
 const evidence=api.read('garmentcad:evidence-and-revision').body;assert.match(evidence,/устаревшим/);assert.match(evidence,/даже после кажущейся локальной правки/);assert.match(evidence,/не является независимым разрешением/);
 const seam=api.read('garmentcad:named-seam-zones').body;assert.match(seam,/Совпавшая сумма не доказывает/);assert.match(seam,/после ошибки их не ослабляют/);assert.match(api.read('garmentcad:seam-curves').body,/не по хорде/);
});
test('production completeness is distinguished from a block, a simulation proxy and numeric fit approval',()=>{
 assert.match(api.read('garmentcad:complete-construction').body,/Промежуточ|промежуточной/);assert.match(api.read('garmentcad:darts-and-paper').body,/не означают V-образный вырез/);assert.match(api.read('garmentcad:cut-copies-and-fold').body,/не разворачивает половину автоматически/);assert.match(api.read('garmentcad:paper-vs-simulation').body,/не доказывают физическую симуляцию/);assert.match(api.read('garmentcad:fabric-and-body').body,/не подтверждают личные мерки/);assert.match(api.read('garmentcad:physical-feedback').body,/Не выдумывайте будущий отзыв/);
 for(const card of api.catalog().cards){const r=api.read(card.id);assert.doesNotMatch(r.body,/assembly_sync_from_pattern|valentina_cad|garmentcode_cad|simulation_run_local|Project\.commit|pip install|child_process|eval\(/);assert.equal(r.verification.fit_verified,false);assert.equal(r.verification.sewing_ready,false);}
});
test('only existing CLO AI construction/export tools are described, with native truth and actual scale limits',()=>{
 const workflow=api.read('garmentcad:method-selection').body;assert.match(workflow,/get_construction_capabilities/);assert.match(workflow,/trial_pattern_design/);assert.match(workflow,/формулами от мерок и параметров/);
 const native=api.read('garmentcad:trial-and-native-truth').body;assert.match(native,/ещё не подтверждает появление геометрии/);assert.match(native,/не является доказательством готовности/);
 const handoff=api.read('garmentcad:handoff-and-scale').body;assert.match(handoff,/export_print_patterns/);assert.match(handoff,/масштаб 1:1 и контрольный размер 100 мм/);assert.match(handoff,/из результата, а не из предполагаемого пути/);
});
test('malformed paths, unknown identifiers, excessive queries and invalid limits fail closed',()=>{
 for(const query of ['', ' '.repeat(5), 'x'.repeat(501),null,{},[]])assert.throws(()=>api.search(query));
 for(const limit of [0,13,1.5,Infinity,NaN,'4'])assert.throws(()=>api.search('брюки',{limit}));
 for(const id of ['garmentcad:../SKILL.md','garmentcad:..','garmentcad:%2e%2e','C:/private','SKILL.md','garmentcad:missing','garmentcad:__proto__',null,{},'garmentcad:'+'x'.repeat(121)])assert.throws(()=>api.read(id));
 assert.equal(api.search('брюки',{limit:1}).results.length,1);assert(api.search('брюки',{limit:12}).results.length<=12);
});
test('returned arrays and metadata cannot mutate the subsequent reference result',()=>{
 const catalog=api.catalog(),result=api.search('мерки',{limit:1}),read=api.read('garmentcad:measurement-semantics');catalog.documents[0].sha256='modified';catalog.cards[0].topics.push('INJECTED');read.source.sha256='modified';read.license.spdx='MIT';read.verification.fit_verified=true;read.topics.push('INJECTED');result.results[0].source.url='file:///private';
 const next=api.read('garmentcad:measurement-semantics');assert.equal(next.license.spdx,null);assert.equal(next.verification.fit_verified,false);assert(!next.topics.includes('INJECTED'));assert.match(next.source.sha256,/^[a-f0-9]{64}$/);assert(next.source.url.startsWith('https://github.com/'));assert(api.catalog().documents[0].sha256!=='modified');
});
