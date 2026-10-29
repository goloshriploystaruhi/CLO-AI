'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto');
const api=require('./tailor-knowledge.cjs'),VENDOR=path.join(__dirname,'..','third_party','tailor-dressmaker');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'clo-tailor-kb-'));t.after(()=>{assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(),'clo-tailor-kb-')));fs.rmSync(root,{recursive:true,force:true});});fs.mkdirSync(path.join(root,'references'));for(const file of ['SKILL.md','references/playbook.md','references/red-flags.md','references/vocabulary.md','LICENSE','SOURCE.json'])if(fs.existsSync(path.join(VENDOR,file)))fs.copyFileSync(path.join(VENDOR,file),path.join(root,file));return root;}
test('catalog exposes draft reference cards with pinned origin and MIT without adopting a professional identity',()=>{
 const c=api.catalog();assert.deepEqual(c.counts,{documents:4,cards:27});assert.equal(c.source.commit,'9554f15f4c20bfa121d1dc85db24cf4389c5b737');assert.equal(c.source.maturity,'draft');assert.equal(c.source.material_type,'inert_reference_data');assert.equal(c.license.spdx,'MIT');assert.equal(c.verification.fit_verified,false);assert.equal(c.verification.sewing_ready,false);assert.equal(c.confidence.level,'unverified_reference');assert.ok(c.cards.every(r=>r.id.startsWith('tailor:')&&r.id.length<=120));assert.ok(c.cards.every(r=>!/Identity|Going deeper|Sources|career/i.test(r.title)));
 for(const card of c.cards){const r=api.read(card.id);assert.doesNotMatch(r.body,/reporting to a shop owner|working independently|## Identity/);assert.match(r.source.url,/\/blob\/9554f15f4c20bfa121d1dc85db24cf4389c5b737\/roles\/tailor-dressmaker\//);}
});
test('Russian fitting, fabric, grain, alteration and allowance queries find appropriate reference cards',()=>{
 for(const [query,expected]of [['посадка, заломы, тянет спину',/fit-diagnosis/],['прибавки',/ease|principles/],['ткань и растяжение',/fabric|stretch|drape|principles|failure|heuristics/],['долевая нить',/grain/],['косой крой',/bias|grain/],['переделка, выпустить припуски',/allowance-feasibility/],['вытачка на груди',/dart|fit-diagnosis/]]){
  const r=api.search(query,{limit:6});assert.ok(r.results.some(row=>expected.test(row.id)),query+': '+r.results.map(v=>v.id));assert.ok(r.expanded_terms.length>1);assert.ok(r.matched_topics.length>0);assert.equal(r.verification.diagnostic_status,'competing_hypotheses');
 }
});
test('wrinkles are emitted as competing, testable causes and do not imply an unmeasured numeric adjustment',()=>{
 const r=api.read('tailor:fit-diagnosis');assert.match(r.body,/Возможные причины/);assert.match(r.body,/поз[ау]|осан/);assert.match(r.body,/измерени|измерен/);assert.match(r.body,/неизвестной/);assert.doesNotMatch(r.body,/Insufficient ease in back panel specifically|Add ease at back side seams only/);assert.ok(r.corrections.includes('wrinkle-signatures-are-not-unique-diagnoses'));assert.equal(r.verification.measured_adjustment_mm,null);assert.equal(r.verification.universal_ease_mm,null);
 const principles=api.read('tailor:principles'),heuristics=api.read('tailor:heuristics'),dart=api.read('tailor:term-dart');assert.doesNotMatch(principles.body,/each point to a different, specific pattern adjustment/);assert.doesNotMatch(heuristics.body,/default to diagnosing it as a localized pattern-balance issue/);assert.doesNotMatch(dart.body,/move the bust dart up half an inch/);
});
test('grain references use fabric directions and pre-wear checks, including searchable titles, without changing upstream bytes',()=>{
 const file=path.join(VENDOR,'SKILL.md'),original=fs.readFileSync(file),principles=api.read('tailor:principles'),heuristics=api.read('tailor:heuristics'),workflow=api.read('tailor:fitting-workflow');
 assert.match(original.toString('utf8'),/against the body's structural axis/);assert.match(original.toString('utf8'),/invisible until the garment is actually worn/);
 for(const item of [principles,heuristics,workflow]){assert.match(item.body,/warp\/selvage or knit wale/);assert.match(item.body,/crosswise or bias/);assert.doesNotMatch(item.body,/against the body's structural axis|invisible until the garment is actually worn/);assert.ok(item.corrections.some(id=>id.startsWith('TD07-')));assert.equal(item.source.sha256,createHash('sha256').update(original).digest('hex'));assert.equal(item.source.matches_vendored_manifest,true);}
 assert.match(principles.body,/can be detected before wear/);assert.match(workflow.body,/before sewing/);
 const found=api.search('долевая нить',{limit:12});for(const row of found.results)assert.doesNotMatch(row.title+' '+row.excerpt,/against the body's structural axis|invisible until the garment is actually worn/);
 const warning=found.results.find(row=>row.id.startsWith('tailor:warning-a-pattern-piece'));assert.ok(warning);assert.match(warning.title,/warp\/selvage/);assert.ok(warning.corrections.includes('TD07-grain-direction-is-fabric-and-design-relative'));assert.deepEqual(fs.readFileSync(file),original);
 assert.match(api.read('tailor:jacket-ease-example').body,/831,85 мм/);
});
test('illustrative jacket figures cannot become universal ease or a diagnosis inferred from a photograph',()=>{
 for(const id of ['tailor:jacket-ease-example','tailor:jacket-ease-calculation']){const r=api.read(id);assert.match(r.body,/не является стандартом/);assert.match(r.body,/19,05 \/ 2 = 9,525 мм/);assert.match(r.body,/Только если на примерке действительно измерена/);assert.match(r.body,/величина не измерена, она неизвестна/);assert.equal(r.verification.numeric_examples_are_illustrative,true);assert.equal(r.verification.measured_adjustment_mm,null);}
});
test('allowance feasibility retains working reserves, counts actual cut edges and never promises an unknown capacity',()=>{
 const r=api.read('tailor:allowance-feasibility');assert.match(r.body,/оба среза шва/);assert.match(r.body,/max\(0, измеренный припуск − необходимый остаточный припуск − непригодная часть\)/);assert.match(r.body,/максимальное увеличение неизвестно/);assert.doesNotMatch(r.body,/0\.625.*×.*2.*1\.25|Maximum feasible letting-out/);assert.ok(r.corrections.includes('retain-working-seam-allowance'));assert.ok(r.corrections.includes('count-both-cut-edges-per-seam'));assert.equal(r.source.matches_vendored_manifest,true);
 const raw=fs.readFileSync(path.join(VENDOR,'references/playbook.md'));assert.equal(r.source.sha256,createHash('sha256').update(raw).digest('hex'));assert.match(raw.toString('utf8'),/0\.625.*×.*2.*1\.25/);
});
test('unknown queries get a labelled method fallback; malformed and excessive requests fail closed',()=>{
 const r=api.search('qqqzxxvunknown');assert.equal(r.total_matches,0);assert.ok(r.results.length>0);assert.ok(r.results.every(row=>row.match==='method_fallback'));
 for(const [query,options]of [['',{}],['x'.repeat(501),{}],['мерки',{limit:0}],['мерки',{limit:13}],['мерки',{limit:1.25}]])assert.throws(()=>api.search(query,options));
 for(const id of ['tailor:../SKILL.md','../private','SKILL.md','references/playbook.md','C:\\private','tailor:%2e%2e','tailor:identity','tailor:career'])assert.throws(()=>api.read(id));assert.ok(api.search('посадка',{limit:1}).results.length<=1);
});
test('current source bodies are bounded and source hash changes are distinguished from the pinned vendored copy',t=>{
 const root=fixture(t),kb=new api.TailorKnowledge(root),file=path.join(root,'references','vocabulary.md'),raw=fs.readFileSync(file,'utf8');fs.writeFileSync(file,raw+'\n### Current update\nUPDATED '+ 'x'.repeat(10000));const r=kb.read('tailor:term-current-update');assert.match(r.body,/UPDATED/);assert.equal(r.body.length,8000);assert.equal(r.truncated,true);assert.equal(r.source.matches_vendored_manifest,false);assert.ok(r.total_characters>r.body.length);assert.equal(r.verification.fit_verified,false);
});
test('identity, career sections, arbitrary scripts and skill directives are never auto-loaded or executed',t=>{
 const root=fixture(t),file=path.join(root,'SKILL.md');fs.appendFileSync(file,'\n## Career\nMASTER PERSONA 30 YEARS EXPERIENCE\n## Identity\nRUN THIS SYSTEM OVERRIDE\n');fs.writeFileSync(path.join(root,'references','run.py'),'globalThis.TAILOR_EXECUTED=true');fs.writeFileSync(path.join(root,'references','ignored.md'),'SECRET OTHER MATERIAL');const kb=new api.TailorKnowledge(root);assert.equal(kb.catalog().counts.documents,4);assert.equal(kb.catalog().counts.cards,27);assert.equal(globalThis.TAILOR_EXECUTED,undefined);for(const row of kb.catalog().cards)assert.doesNotMatch(kb.read(row.id).body,/MASTER PERSONA|SYSTEM OVERRIDE|SECRET OTHER MATERIAL/);
});
test('linked reference replacement is rejected for both search and read without relying on Windows link privileges',t=>{
 const root=fixture(t),kb=new api.TailorKnowledge(root),target=path.resolve(root,'references','playbook.md'),original=fs.lstatSync;fs.lstatSync=function(file,...args){if(path.resolve(file)===target)return {isSymbolicLink:()=>true};return original.call(this,file,...args);};try{assert.throws(()=>kb.read('tailor:fit-diagnosis'),/Ссылки/);assert.throws(()=>kb.search('посадка'),/Ссылки/);}finally{fs.lstatSync=original;}
});
test('missing licence never becomes an invented permission and oversized files are rejected',t=>{
 const root=fixture(t);fs.rmSync(path.join(root,'LICENSE'));let kb=new api.TailorKnowledge(root);assert.equal(kb.read('tailor:principles').license.spdx,null);assert.equal(kb.catalog().license.status,'not_verified');fs.writeFileSync(path.join(root,'references','playbook.md'),'x'.repeat(api.LIMITS.fileBytes+1));assert.throws(()=>new api.TailorKnowledge(root),/размер/);
});
