const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {BodyProfiles}=require('./body-profiles.cjs'),{GarmentStore}=require('./garment-store.cjs'),tools=require('./agent-tools.cjs'),validation=require('./command-validation.cjs');
test('trial is read-only; composed features edit in place and undo restores their design without touching profiles',async()=>{
 const folder=testWorkspace.create('development-'),profiles=new BodyProfiles(path.join(folder,'body.json')),garments=new GarmentStore(path.join(folder,'garments.json'));
 profiles.create({name:'Профиль'});const before=fs.readFileSync(profiles.file,'utf8');
 const features=y=>[{type:'patch_pocket',host:'front_right',width_mm:80,height_mm:100,y_mm:y}];
 const job=await garments.build({method:'workwear_zip_jacket_v1',parameters:{development:{version:1,features:features(330)}},approximateConsent:true},profiles);
 assert.equal(job.patterns.length,25);const bindings=job.patterns.map((_,i)=>({pattern_index:i,clo_pattern_id:100+i,fingerprint:'native-'+i}));garments.commit(job,{patterns:bindings});
 const data=fs.readFileSync(garments.file,'utf8');
 const command={action:'revise_development',args:{query:job.garment.id,features:features(320)}};validation.tool(command);
 const trial=await tools.trial(command,{stores:{garments,profiles},turn:{allowApproximate:false}});assert(trial.valid);assert.equal(fs.readFileSync(garments.file,'utf8'),data);
 const changed=await garments.build({query:job.garment.id,_development:{version:1,features:features(320)}},profiles,true);
 assert.equal(changed.garment.id,job.garment.id);assert.equal(changed.garment.parameters.length_mm,job.garment.parameters.length_mm);assert.equal(changed.garment.parameters.development.features[0].y_mm,320);
 assert.deepEqual(changed.garment.pieces.map(p=>p.id),job.garment.pieces.map(p=>p.id));assert(changed.update_preview.reused>0);
 garments.commit(changed,{patterns:bindings});const undo=await garments.build({query:job.garment.id,_restore:true},profiles,true);
 assert.deepEqual(undo.garment.parameters,job.garment.parameters);assert.equal(fs.readFileSync(profiles.file,'utf8'),before);
});

test('development tools reject code, URLs of executables and malformed feature parameters before the worker',()=>{
 assert.throws(()=>validation.tool({action:'develop_garment',args:{method:'workwear_zip_jacket_v1',parameters:{},features:[{type:'python',code:'run()'}]}}));
 assert.throws(()=>validation.tool({action:'revise_development',args:{query:'selected',features:[{type:'patch_pocket',host:'back',width_mm:NaN,height_mm:100,y_mm:100}]}}));
 assert.throws(()=>validation.tool({action:'read_web_source',args:{url:'https://example.org',code:'run()'}}));
});
