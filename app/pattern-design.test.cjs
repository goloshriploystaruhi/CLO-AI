const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles}=require('./body-profiles.cjs'),{GarmentStore}=require('./garment-store.cjs'),designs=require('./pattern-design.cjs'),tools=require('./construction-tools.cjs'),validation=require('./command-validation.cjs');
const setup=()=>{const folder=testWorkspace.create('generic-integration-');return {folder,profiles:new BodyProfiles(path.join(folder,'profiles.json')),garments:new GarmentStore(path.join(folder,'garments.json'),{libraryFile:path.join(folder,'shared-library.json')})};};
const design=()=>({version:1,name:'Новая асимметричная накидка',category:'cape',parameters:{width_mm:240,height_mm:360,offset_mm:30},measurements:[],seam_allowance_mm:10,pieces:[{role:'panel',name:'Перед накидки',primitive:{type:'trapezoid',top:'p_width_mm',bottom:'p_width_mm+80',height:'p_height_mm',offset:'p_offset_mm'}}],checks:[{piece:'panel',metric:'height',expected:'p_height_mm',tolerance_mm:.1}]});
function commit(store,job){store.commit(job,{patterns:job.patterns.map((p,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'native-'+job.garment.version+'-'+i}))});}
test('unavailable saved recipes do not block new design capabilities or rewrite the library',async()=>{
 const s=setup();for(const bytes of ['{broken',JSON.stringify({version:99,recipes:[]})]){fs.writeFileSync(s.garments.libraryFile,bytes);const c=await tools.read({action:'get_construction_capabilities',args:{}},{stores:s});assert(c.generic);assert.deepEqual(c.saved_recipes,[]);assert.match(c.library_warning,/Новое построение/);assert.equal(fs.readFileSync(s.garments.libraryFile,'utf8'),bytes);await assert.rejects(tools.read({action:'get_design_recipe',args:{id:'absent'}},{stores:s}));assert.equal(fs.readFileSync(s.garments.libraryFile,'utf8'),bytes);}
});
test('native evidence survives only an audited identical geometry fingerprint',async()=>{
 const s=setup(),qa=require('./engineering-qa.cjs');s.profiles.create({name:'Профиль'});const job=await s.garments.buildDesign({design:design()},s.profiles);commit(s.garments,job);const g=s.garments.find(job.garment.id);assert.match(g.qa_report.quality.geometry_fingerprint,/^[a-f0-9]{64}$/);await qa.check(s.garments,g.id);g.qa_report.native_export={status:'verified',sentinel:'actual-readback'};const same=await qa.check(s.garments,g.id);assert.equal(same.qa_report.native_export.sentinel,'actual-readback');g.parameters.height_mm+=10;const changed=await qa.check(s.garments,g.id);assert.equal(changed.qa_report.valid,false);assert.notEqual(changed.qa_report.native_export?.sentinel,'actual-readback');
});
test('new category flows through actual mathematical trial, native-confirmed registry, parameter edit, QA and undo',async()=>{
 const s=setup();s.profiles.create({name:'Человек',metadata:{sex:'female'}});const bytes=fs.readFileSync(s.profiles.file,'utf8'),d=design(),trial=await tools.trial({action:'trial_pattern_design',args:{design:d}},{stores:s,turn:{allowApproximate:false}});assert(trial.valid);assert(!fs.existsSync(s.garments.file));assert(!fs.existsSync(s.garments.libraryFile));
 const job=await s.garments.buildDesign({design:d},s.profiles);assert.equal(job.garment.category,'cape');assert(job.qa_report.valid);assert.equal(job.garment.profile_context.sex,'female');assert.equal(job.garment.readiness.sewing_ready,false);commit(s.garments,job);assert.equal(new(require('./design-library.cjs').DesignLibrary)(s.garments.libraryFile).list().length,1);
 const changed=await s.garments.buildDesign({query:job.garment.id,parameters:{height_mm:430}},s.profiles,true);assert.equal(changed.garment.id,job.garment.id);assert.deepEqual(changed.garment.pieces.map(p=>p.id),job.garment.pieces.map(p=>p.id));assert.equal(changed.garment.parameters.width_mm,240);assert.equal(changed.garment.parameters.height_mm,430);assert(changed.update_preview.replaced>0);commit(s.garments,changed);
 const audit=await require('./engineering-qa.cjs').check(s.garments,job.garment.id);assert(audit.qa_report.valid);const undo=await s.garments.build({query:job.garment.id,_restore:true},s.profiles,true);assert.equal(undo.garment.parameters.height_mm,360);assert.equal(fs.readFileSync(s.profiles.file,'utf8'),bytes);
});
test('measured body variables, exact dimension guards and edited lengths keep real provenance',async()=>{
 const s=setup();s.profiles.create({name:'Профиль',metadata:{sex:'female'}});s.profiles.update({measurement:'waist',value:80,unit:'cm'});const before=fs.readFileSync(s.profiles.file,'utf8'),example=(await designs.worker({describe:true})).example;
 const job=await s.garments.buildDesign({design:example},s.profiles);assert(job.qa_report.valid);assert.equal(job.garment.measurement_snapshot.waist.value,800);assert.equal(job.garment.measurement_snapshot.waist.status,'unverified');assert(job.qa_report.warnings.some(w=>w.code==='UNVERIFIED_MEASUREMENTS'));assert.equal(fs.readFileSync(s.profiles.file,'utf8'),before);
 const bad=structuredClone(example);bad.checks[0].expected='1';await assert.rejects(s.garments.buildDesign({design:bad},s.profiles),/размер|провер|ожид|мм/i);
});
test('missing newly needed measurements return to the profile without reviving ambiguous legacy fields',async()=>{
 const s=setup();s.profiles.create({name:'Профиль'});s.garments.data.draft={method:'wide_trousers_experimental_v1',parameters:{}};
 const d=design();d.measurements=['foot_length'];d.pieces[0].primitive.top='m_foot_length';const r=await s.garments.buildDesign({design:d},s.profiles);assert(r.needs_input.missing_measurements.includes('foot_length'));assert.equal(s.garments.data.draft,null);
 const snapshot=designs.profileSnapshot(s.profiles,s.garments);assert(snapshot.catalog.find(m=>m.id==='foot_length').profile_visible);assert.equal(snapshot.catalog.find(m=>m.id==='seat_length').profile_visible,false);
 d.measurements=['seat_length'];await assert.rejects(s.garments.buildDesign({design:d},s.profiles),/однозначн/);
});
test('explicit approximate consent uses disclosed reference inputs only in the draft, never in the body profile',async()=>{
 const s=setup();s.profiles.create({name:'Без мерок'});const bytes=fs.readFileSync(s.profiles.file,'utf8'),d=(await designs.worker({describe:true})).example;
 assert((await s.garments.buildDesign({design:d},s.profiles)).needs_input);const result=await s.garments.buildDesign({design:d,approximateConsent:true},s.profiles);assert(result.qa_report.valid);assert(result.approximate);assert.equal(result.garment.measurement_snapshot.waist.source,'estimated');assert.equal(result.garment.measurement_snapshot.waist.status,'unverified');assert(result.assumptions.length);assert.equal(fs.readFileSync(s.profiles.file,'utf8'),bytes);
});
test('capabilities cover the complete registered catalogue and strict generic tools reject executable payloads',async()=>{
 const s=setup(),cap=await tools.capabilities?.(s)||await tools.read({action:'get_construction_capabilities',args:{}},{stores:s});assert(cap.generic.schema);assert(new Set(cap.registered.map(m=>m.category)).size>8);
 assert.throws(()=>validation.tool({action:'create_pattern_design',args:{design:{...design(),code:'run()'}}}),/Неизвестн/);assert.throws(()=>validation.tool({action:'revise_pattern_design',args:{query:'selected',parameters:{width_mm:Infinity}}}));
 const attack=design();attack.pieces[0].primitive.top='__import__("os").system("x")';await assert.rejects(s.garments.buildDesign({design:attack},s.profiles));
});
test('PDF artifact links resolve only registered PDFs inside the current project',()=>{
 const s=setup(),artifact=require('./print-artifacts.cjs'),pdf=path.join(s.folder,'test.pdf');fs.writeFileSync(pdf,'%PDF-1.4\n');const link=artifact.register(s.folder,pdf);assert.equal(artifact.resolve(s.folder,link),fs.realpathSync(pdf));const other=setup();assert.throws(()=>artifact.resolve(other.folder,link),/недоступен/);assert.throws(()=>artifact.resolve(s.folder,'file:///C:/private.pdf'));assert.throws(()=>artifact.register(s.folder,path.join(__dirname,'main.cjs')));
 const registry=path.join(s.folder,'print-artifacts.json'),data=JSON.parse(fs.readFileSync(registry,'utf8'));data.files[link.slice(15)].file='../outside.pdf';fs.writeFileSync(registry,JSON.stringify(data));assert.throws(()=>artifact.resolve(s.folder,link));
});
test('independent assemblies have a strict complete unique role partition before reaching the worker',()=>{
 const d={version:1,name:'Независимый комплект',category:'custom',parameters:{},measurements:[],pieces:['first_a','first_b','second_a','second_b'].map(role=>({role,name:role,primitive:{type:'rectangle',width:100,height:200}})),assembly_groups:[['first_a','first_b'],['second_a','second_b']]};
 assert.equal(require('./pattern-design-schema.cjs').validateDesign(d),d);
 for(const groups of [[],null,[[]],[['first_a','first_b']],[['first_a','first_b'],['second_a','unknown']],[['first_a','first_b'],['first_a','second_b']],[['first_a','first_b'],['second_a',42]]]){
  assert.throws(()=>require('./pattern-design-schema.cjs').validateDesign({...d,assembly_groups:groups}),/Группы сборки|Каждая деталь/);
 }
});
