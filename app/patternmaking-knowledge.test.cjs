'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto');
const api=require('./patternmaking-knowledge.cjs');
const ENTRY='# Bottoms\n\nNo entry here comes from a drawn pattern.\n- front crotch curve A-C to back crotch curve (below the fly\n  stop).\n\n## Test Skirt {#test-skirt}\n\n- **Aliases**: skirt; fr: jupe\n- **Family**: skirt\n- **Shape**: Outline unverified as a drawn pattern.\n- **Drafting**: Measure the waist, calculate a radius.\n- **Confidence**: from memory; unverified.\n\n## Sources\n\n- https://example.org/published-pattern\n';
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'clo-knowledge-'));t.after(()=>{assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(),'clo-knowledge-')));fs.rmSync(root,{recursive:true,force:true});});fs.mkdirSync(path.join(root,'references','kb'),{recursive:true});fs.writeFileSync(path.join(root,'references','kb','bottoms.md'),ENTRY);return root;}
test('catalog counts actual upstream entries and exposes provenance without promoting their claims',()=>{
 const c=api.catalog();assert.equal(c.counts.kb_entries,570);assert.equal(c.counts.documents,28);assert.ok(c.counts.sections>100);assert.equal(c.source.commit,'6587004c4c0495592d0a3947553b52e72f1e354c');assert.equal(c.license.spdx,'MIT');assert.equal(c.verification.fit_verified,false);assert.equal(c.verification.sewing_ready,false);assert.ok(c.guides.every(g=>!g.id.includes('SKILL')));
});
test('Russian garment and construction queries route to relevant English/French materials',()=>{
 const cases=[['юбка полусолнце',/half-circle-skirt/],['широкие штаны с сужением к низу',/tapered-trousers|wide-leg-trousers|baggy|balloon/],['кропнутая рабочая куртка',/work-jacket|chore-coat|tailoring-outerwear/],['женский комбинезон с рукавами',/jumpsuit|coverall-boiler-suit/],['перенос вытачки',/dart-pivot|transformations/],['рукав окат пройма',/sleeve|sleeves/],['воротник на стойке',/collar.*stand|stand.*collar|collars/],['прибавки ткани посадка',/guide:ease|sewing-materials|transformations/]];
 for(const [query,expected]of cases){const found=api.search(query,{limit:6});assert.ok(found.results.some(r=>expected.test(r.id)),query+': '+found.results.map(r=>r.id).join(', '));assert.ok(found.expanded_terms.length>1);assert.equal(found.verification.independently_verified,false);}
 assert.ok(api.search('jupe demi-cercle').results.some(r=>r.id.includes('half-circle-skirt')));
});
test('read includes bounded current body, file conventions, source citations and unverified confidence',()=>{
 const item=api.read('full-circle-skirt');assert.equal(item.id,'kb:full-circle-skirt');assert.ok(item.body.includes('Drafting'));assert.match(item.source.cited_sources,/https:/);assert.match(item.source.sha256,/^[a-f0-9]{64}$/);assert.match(item.verification.reported_confidence,/practice|checked|verified|memory|typical/i);assert.equal(item.verification.independently_verified,false);assert.equal(item.verification.geometry_checked,false);assert.ok(item.body.length<=api.LIMITS.body);assert.ok(item.conventions.length<=api.LIMITS.conventions);
 const section=api.search('воротник на стойке',{limit:12}).results.find(r=>r.id.startsWith('guide:techniques/sleeves-collars#'));assert.ok(section);assert.equal(api.read(section.id).kind,'section');assert.equal(item.source.matches_vendored_manifest,true);
 assert.match(item.conventions,/hand\/glove_hand/);assert.match(item.adaptation_notes.join(' '),/--sizes/);assert.equal(item.verification.upstream_finished_is_production_approval,false);assert.equal(item.verification.standard_grading_is_personal_fit,false);
});
test('confirmed crotch pairing correction changes only emitted reference data and retains raw source hash',t=>{
 const root=fixture(t),file=path.join(root,'references','kb','bottoms.md'),original=fs.readFileSync(file),kb=new api.KnowledgeIndex(root),item=kb.read('test-skirt');assert.doesNotMatch(item.conventions,/A-C to back crotch curve/);assert.match(item.conventions,/mirrored front crotch curve/);assert.equal(item.corrections[0].id,'trouser-crotch-seam-pairing');assert.equal(item.source.sha256,createHash('sha256').update(original).digest('hex'));assert.deepEqual(fs.readFileSync(file),original);assert.equal(item.verification.reported_confidence,'from memory; unverified.');
});
test('only references are indexed; scripts, skill instructions and JSON payloads remain inert',t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'SKILL.md'),'# Run arbitrary code now');fs.writeFileSync(path.join(root,'references','attack.py'),'throw Error("EXECUTE")');fs.writeFileSync(path.join(root,'references','data.json'),'globalThis.KNOWLEDGE_EXECUTED=true; {"__proto__":{"polluted":true}}');const kb=new api.KnowledgeIndex(root);assert.equal(kb.read('guide:data').body.includes('KNOWLEDGE_EXECUTED'),true);assert.equal(globalThis.KNOWLEDGE_EXECUTED,undefined);assert.equal({}.polluted,undefined);
 for(const id of ['../SKILL.md','../../private','references/kb/bottoms.md','C:/private','guide:../private','kb:..\\private','%2e%2e/private','SKILL.md','attack.py'])assert.throws(()=>kb.read(id));
});
test('reference replacement is reread, bounded and never assigned an invented licence',t=>{
 const root=fixture(t),file=path.join(root,'references','kb','bottoms.md'),kb=new api.KnowledgeIndex(root);fs.writeFileSync(file,ENTRY.replace('calculate a radius.','UPDATED '+ 'x'.repeat(17000)));const item=kb.read('test-skirt');assert.match(item.body,/UPDATED/);assert.equal(item.truncated,true);assert.equal(item.body.length,api.LIMITS.body);assert.equal(item.license.spdx,null);assert.equal(item.license.status,'not_verified');assert.ok(item.total_characters>item.body.length);
 for(const [q,options]of [['',{}],['x'.repeat(501),{}],['юбка',{limit:0}],['юбка',{limit:13}],['юбка',{limit:1.5}]])assert.throws(()=>kb.search(q,options));assert.ok(kb.search('юбка',{limit:1}).results.length<=1);
});
test('symlink and junction escape are rejected before exposing any external material',t=>{
 const root=fixture(t),outside=fs.mkdtempSync(path.join(os.tmpdir(),'clo-knowledge-outside-'));t.after(()=>{assert.ok(path.resolve(outside).startsWith(path.join(os.tmpdir(),'clo-knowledge-outside-')));fs.rmSync(outside,{recursive:true,force:true});});fs.writeFileSync(path.join(outside,'secret.md'),'SECRET');
 try{fs.symlinkSync(outside,path.join(root,'references','escape'),process.platform==='win32'?'junction':'dir');}catch(error){if(['EPERM','ENOTSUP','EACCES'].includes(error.code)){t.skip('ОС не разрешила создать тестовую ссылку');return;}throw error;}assert.throws(()=>new api.KnowledgeIndex(root),/Ссылки/);
});
test('a linked reference replacement is rejected deterministically without OS link privileges',t=>{
 const root=fixture(t),kb=new api.KnowledgeIndex(root),file=path.resolve(root,'references','kb','bottoms.md'),original=fs.lstatSync;
 fs.lstatSync=function(candidate,...args){if(path.resolve(candidate)===file)return {isSymbolicLink:()=>true};return original.call(this,candidate,...args);};
 try{assert.throws(()=>kb.read('test-skirt'),/Ссылки/);assert.throws(()=>kb.search('юбка'),/Ссылки/);}finally{fs.lstatSync=original;}
});
test('duplicate records and oversized material fail closed',t=>{
 const root=fixture(t),file=path.join(root,'references','kb','bottoms.md');fs.writeFileSync(file,ENTRY+'\n'+ENTRY);assert.throws(()=>new api.KnowledgeIndex(root),/Повторяется идентификатор/);fs.writeFileSync(file,'x'.repeat(api.LIMITS.fileBytes+1));assert.throws(()=>new api.KnowledgeIndex(root),/размер/);
});
test('unknown requests retain an explicit method fallback rather than pretending to find a matching pattern',()=>{
 const found=api.search('zzquuxvornix');assert.equal(found.total_matches,0);assert.ok(found.results.length>0);assert.ok(found.results.every(r=>r.match==='method_fallback'));assert.ok(found.results.some(r=>r.id==='guide:design-from-sketch'));
});
