// Real mathematical worker and normal AI-tool adapters; no CLO, network or user data.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles}=require('./body-profiles.cjs'),{GarmentStore}=require('./garment-store.cjs'),tools=require('./construction-tools.cjs'),validation=require('./command-validation.cjs');
function setup(t){
 const root=path.resolve(__dirname,'../research'),folder=fs.mkdtempSync(path.join(root,'pattern-check-workflow-'));
 t.after(()=>{assert.equal(path.dirname(folder),root);fs.rmSync(folder,{recursive:true,force:true});});
 const stores={profiles:new BodyProfiles(path.join(folder,'profiles.json')),garments:new GarmentStore(path.join(folder,'garments.json'),{libraryFile:path.join(folder,'library.json')})};
 stores.profiles.create({name:'Профиль проверки',metadata:{sex:'female'}});
 return {folder,stores,context:{stores,turn:{allowApproximate:false}}};
}
function design(){return {
 version:1,name:'Панель с обтачкой и сгибом',category:'construction_test',measurements:[],
 parameters:{width_mm:200,height_mm:400,child_layout_mm:300},seam_allowance_mm:10,
 pieces:[
  {role:'panel',name:'Основная панель',points:{a:[0,0],b:['p_width_mm',0],c:['p_width_mm',50],d:['p_width_mm','p_height_mm'],e:[0,'p_height_mm']},segments:[
   {type:'line',name:'top',from:'a',to:'b'},
   {type:'line',name:'facing_attach',from:'b',to:'c'},
   {type:'line',name:'right_rest',from:'c',to:'d'},
   {type:'line',name:'bottom',from:'d',to:'e'},
   {type:'line',name:'left',from:'e',to:'a'},
  ],seams:{right:[1,2]}},
  {role:'facing',name:'Обтачка',primitive:{type:'rectangle',width:80,height:50},translate:['p_child_layout_mm',0]},
 ],
 relations:[{a:{piece:'panel',seam:'facing_attach'},b:{piece:'facing',seam:'right'},direction:'reverse',ease_mm:0,tolerance_mm:.1,alignment:[0,1]}],
 pattern_checks:[
  {type:'fold',piece:'panel',seam:'left',tolerance_deg:1},
  {type:'within',piece:'facing',parent:'panel',translate:['20-p_child_layout_mm+(p_width_mm-200)/2',20],tolerance_mm:.1},
 ],
};}
function command(action,d){return {action,args:{design:d}};}
function commitFixture(stores,job){
 // Synthetic readback only commits local model metadata; it never calls CLO.
 stores.garments.commit(job,{patterns:job.patterns.map((part,i)=>({pattern_index:i,clo_pattern_id:501+i,fingerprint:'fixture-'+job.garment.version+'-'+i}))});
}
test('normal trial and create tools verify fold tangents and a separately laid-out facing without claiming sewing readiness',async t=>{
 const s=setup(t),d=design(),profile=fs.readFileSync(s.stores.profiles.file,'utf8');
 const trial=await tools.trial(command('trial_pattern_design',d),s.context);
 assert.equal(trial.valid,true);assert.equal(trial.clo_changed,false);assert.equal(trial.sewing_ready,false);assert.equal(trial.fit_verified,false);
 assert.equal(fs.existsSync(s.stores.garments.file),false);assert.equal(fs.existsSync(s.stores.garments.libraryFile),false);
 assert.equal(trial.qa_report.pattern_checks.length,2);assert(trial.qa_report.pattern_checks.every(check=>check.passed));
 const job=await tools.execute(command('create_pattern_design',d),s.context);
 assert.equal(job.garment.pattern_constraints.length,2);assert.equal(job.garment.profile_context.sex,'female');assert.equal(job.garment.readiness.sewing_ready,false);
 const within=job.garment.pattern_check_results.find(check=>check.type==='within');assert.deepEqual(within.translate,[-280,20]);assert.equal(within.coordinate_frame,'stored_child_to_stored_parent');
 assert.equal(job.garment.pattern_design.seam_allowance_mm,10,'A fold check must not silently change cutting allowances');
 assert.equal(fs.readFileSync(s.stores.profiles.file,'utf8'),profile);
});
test('a parameter revision recomputes containment expressions; an invalid local revision cannot replace the stored construction',async t=>{
 const s=setup(t),job=await tools.execute(command('create_pattern_design',design()),s.context);commitFixture(s.stores,job);
 const changed=await tools.execute({action:'revise_pattern_design',args:{query:job.garment.id,parameters:{width_mm:240}}},s.context);
 assert.equal(changed.garment.parameters.width_mm,240);assert.equal(changed.garment.parameters.height_mm,400);
 assert.deepEqual(changed.garment.pattern_check_results.find(check=>check.type==='within').translate,[-260,20]);
 assert.deepEqual(changed.garment.pieces.map(piece=>piece.id),job.garment.pieces.map(piece=>piece.id));commitFixture(s.stores,changed);
 await assert.rejects(tools.execute({action:'revise_pattern_design',args:{query:job.garment.id,parameters:{width_mm:30}}},s.context),/Обтачка|внутри|вложенн|родительск/i);
 assert.equal(s.stores.garments.find(job.garment.id).parameters.width_mm,240);
 const reopened=new GarmentStore(s.stores.garments.file);assert.equal(reopened.find(job.garment.id).parameters.width_mm,240);
});
test('fold verification uses the analytic curve tangent rather than its horizontal endpoint chord',async t=>{
 const s=setup(t),d=design();d.pattern_checks=[d.pattern_checks[0]];
 d.pieces[0]={role:'panel',name:'Основная панель',points:{a:[0,0],b:[200,0],c:[200,400],d:[0,400],q:[5,-20]},segments:[
  {type:'quadratic',name:'top',from:'a',to:'b',control:'q'},
  {type:'line',name:'right',from:'b',to:'c'},
  {type:'line',name:'bottom',from:'c',to:'d'},
  {type:'line',name:'left',from:'d',to:'a'},
 ]};d.pieces=[d.pieces[0]];d.relations=[];
 await assert.rejects(tools.trial(command('trial_pattern_design',d),s.context),/Основная панель.*сгиб.*касательн/isu);
 assert.equal(s.stores.garments.data.garments.length,0);assert.equal(fs.existsSync(s.stores.garments.file),false);
});
test('AI capability discovery supplies both exact pattern-check schemas and alignment guidance',async t=>{
 const s=setup(t),capabilities=await tools.read({action:'get_construction_capabilities',args:{}},s.context),generic=capabilities.generic;
 assert(generic.design_keys.includes('pattern_checks'));
 const schema=generic.pattern_checks||generic.schema.pattern_checks;assert.equal(schema.fold.type,'fold');assert.equal(schema.within.type,'within');assert(schema.within.translate);
 assert(Array.isArray(generic.relation.alignment));assert.equal(generic.relation.alignment[0],0);assert.equal(generic.relation.alignment.at(-1),1);
});
test('AI schemas reject extra operation fields, missing coordinate transforms and invalid control-point alignment',async t=>{
 const malformed=[
  d=>{d.pattern_checks[0].exec='run()';},d=>{delete d.pattern_checks[1].translate;},d=>{d.pattern_checks[1].mirror='diagonal';},
  d=>{d.pattern_checks=Array.from({length:65},()=>({...d.pattern_checks[0]}));},d=>{d.pattern_checks[0].type='execute_python';},
 ];
 for(const modify of malformed){const d=design();modify(d);assert.throws(()=>validation.tool(command('create_pattern_design',d)));}
 const s=setup(t),attack=design();attack.pattern_checks[1].translate[0]='__import__("os").getpid()';
 await assert.rejects(tools.trial(command('trial_pattern_design',attack),s.context));
 for(const alignment of [[0,.5,.5,1],[.1,1],[0,.5],[0,true,1],[0,NaN,1],Array.from({length:17},(_,i)=>i/16)]){
  const d=design();d.relations=[{a:{piece:'panel',seam:'right'},b:{piece:'facing',seam:'left'},alignment}];
  assert.throws(()=>validation.tool(command('create_pattern_design',d)));
 }
});
test('custom control fractions survive the real worker, local confirmation and a parameter edit',async t=>{
 const s=setup(t),d=design();d.pattern_checks=[d.pattern_checks[0]];
 d.pieces[1].primitive={type:'rectangle',width:'p_width_mm',height:'p_height_mm'};
 d.relations=[{a:{piece:'panel',seam:'right'},b:{piece:'facing',seam:'left'},direction:'reverse',ease_mm:0,tolerance_mm:.1,alignment:[0,.25,.75,1]}];
 const trial=await tools.trial(command('trial_pattern_design',d),s.context);assert.equal(trial.valid,true);
 const job=await tools.execute(command('create_pattern_design',d),s.context);assert.deepEqual(job.garment.sewing_graph[0].alignment,[0,.25,.75,1]);commitFixture(s.stores,job);
 const edited=await tools.execute({action:'revise_pattern_design',args:{query:job.garment.id,parameters:{height_mm:450}}},s.context);
 assert.equal(edited.qa_report.valid,true);assert.deepEqual(edited.garment.sewing_graph[0].alignment,[0,.25,.75,1]);
 assert.equal(edited.garment.pieces.length,2);assert.equal(edited.garment.readiness.sewing_ready,false);
});
test('persisted quality replays construction-check expressions instead of accepting a tampered resolved check',async t=>{
 const s=setup(t),job=await tools.execute(command('create_pattern_design',design()),s.context);commitFixture(s.stores,job);
 const stored=s.stores.garments.find(job.garment.id);stored.pattern_constraints.find(check=>check.type==='within').translate[0]+=5;
 const audited=await require('./engineering-qa.cjs').check(s.stores.garments,job.garment.id);
 assert.equal(audited.qa_report.valid,false);assert(audited.qa_report.issues.some(issue=>issue.code==='DESIGN_CONSTRAINTS'));
 assert.equal(audited.qa_report.sewing_ready,false);assert.equal(audited.qa_report.fit_verified,false);
});
