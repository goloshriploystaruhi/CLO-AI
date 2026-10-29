const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ConstructionMemory,clean}=require('./construction-memory.cjs');
const setup=()=>path.join(testWorkspace.create('construction-memory-'),'memory.json');
const command={action:'create_pattern_design',args:{design:{name:'Асимметричная накидка',parameters:{length_mm:600},pieces:[]}}};
const trial={command,result:{valid:true,fit_verified:true,clo_changed:true,message:'Проверена геометрия'},checked_at:'2026-10-29T00:00:00Z'};
test('construction evidence persists by project, profile and measurement fingerprint without authorizing an operation',()=>{
 const file=setup(),scope={project_id:'project-a',profile_id:'person',profile_hash:'first'},memory=new ConstructionMemory(file,scope);
 memory.save({brief:'Накидка с асимметричным передом',status:'validated',sources:[{url:'https://example.org/cape',title:'Источник',read:true}],trials:[trial],validated_designs:[trial],last_validated:trial});
 const saved=new ConstructionMemory(file,scope).load();assert.equal(saved.brief,'Накидка с асимметричным передом');assert.deepEqual(saved.last_validated.command,command);assert.equal(saved.last_validated.result.fit_verified,false);assert.equal(saved.last_validated.result.clo_changed,false);assert.equal(saved.approved,undefined);
 assert.equal(new ConstructionMemory(file,{...scope,project_id:'other'}).load(),null);assert.equal(new ConstructionMemory(file,{...scope,profile_hash:'edited'}).load(),null);
 const other=new ConstructionMemory(file,{...scope,profile_hash:'edited'});other.save({brief:'Новые мерки',status:'researching'});assert.equal(memory.load().brief,saved.brief);assert.equal(other.load().brief,'Новые мерки');
});
test('memory bounds inert sources and trial histories, keeps full commands or explicitly omits overlarge commands',()=>{
 const state=clean({brief:'x'.repeat(12000),sources:[{url:'file:///private'},{url:'https://user:secret@example.org/'},{url:'https://example.org/safe',title:'javascript: globalThis.EXECUTED=true;'}],trials:Array(20).fill(trial),validated_designs:[trial,{command:{action:'shell',args:{cmd:'danger'}},result:{valid:true}}]});
 assert.equal(state.brief.length,5000);assert.equal(state.sources.length,1);assert.equal(state.trials.length,8);assert.equal(state.validated_designs.length,1);assert.equal(globalThis.EXECUTED,undefined);
 const huge=clean({last_validated:{command:{action:'create_pattern_design',args:{design:{name:'x'.repeat(70000)}}},result:{valid:true}}});assert.equal(huge.last_validated.command.command_omitted,true);assert.equal(huge.last_validated.command.args,undefined);
});
test('corrupt and future memory files remain intact and failed atomic persistence preserves old evidence',()=>{
 const file=setup(),memory=new ConstructionMemory(file,{project_id:'project'});for(const raw of ['{not-json',JSON.stringify({version:9,records:[]})]){fs.writeFileSync(file,raw);assert.throws(()=>memory.load());assert.throws(()=>memory.save({brief:'Новый'}));assert.equal(fs.readFileSync(file,'utf8'),raw);}
 fs.unlinkSync(file);memory.save({brief:'Сохранённый'});const bytes=fs.readFileSync(file,'utf8'),writer=require('./atomic-json.cjs'),original=writer.writeJSON;writer.writeJSON=()=>{throw Error('Synthetic persistence failure');};try{assert.throws(()=>memory.save({brief:'Несохранённый'}));assert.equal(fs.readFileSync(file,'utf8'),bytes);assert.equal(memory.load().brief,'Сохранённый');}finally{writer.writeJSON=original;}
});
