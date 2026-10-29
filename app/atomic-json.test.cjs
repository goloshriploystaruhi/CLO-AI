const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {writeJSON}=require('./atomic-json.cjs');
function setup(){const folder=testWorkspace.create('atomic-json-'),file=path.join(folder,'data.json');fs.writeFileSync(file,JSON.stringify({version:1,value:'old'}));return {folder,file};}
test('a transient Windows replacement lock retries without unlinking original data and keeps a complete backup',()=>{
 const {folder,file}=setup(),waits=[];let attempts=0;const io={...fs,renameSync:(source,target)=>{if(target===file&&++attempts===1)throw Object.assign(Error('Sharing lock'),{code:'EPERM'});return fs.renameSync(source,target);}};
 writeJSON(file,{version:1,value:'new'},{backup:true,io,wait:ms=>waits.push(ms)});assert.equal(attempts,2);assert.deepEqual(waits,[8]);assert.equal(JSON.parse(fs.readFileSync(file)).value,'new');assert.equal(JSON.parse(fs.readFileSync(file+'.bak')).value,'old');assert.deepEqual(fs.readdirSync(folder).sort(),['data.json','data.json.bak']);
});
test('permanent replacement failure is bounded, preserves destination and backup, and cannot poison the next save',()=>{
 const {folder,file}=setup(),waits=[];let attempts=0;const io={...fs,renameSync:(source,target)=>{if(target===file){attempts++;throw Object.assign(Error('Locked'),{code:'EBUSY'});}return fs.renameSync(source,target);}};
 assert.throws(()=>writeJSON(file,{value:'unsaved'},{backup:true,io,wait:ms=>waits.push(ms)}),{code:'EBUSY'});assert.equal(attempts,3);assert.deepEqual(waits,[8,16]);assert.equal(JSON.parse(fs.readFileSync(file)).value,'old');assert.equal(JSON.parse(fs.readFileSync(file+'.bak')).value,'old');assert.deepEqual(fs.readdirSync(folder).sort(),['data.json','data.json.bak']);
 writeJSON(file,{value:'retry'},{backup:true});assert.equal(JSON.parse(fs.readFileSync(file)).value,'retry');
});
test('non-transient errors do not retry or damage a valid file',()=>{
 const {file}=setup();let waits=0;const io={...fs,renameSync:()=>{throw Object.assign(Error('Device error'),{code:'EIO'});}};
 assert.throws(()=>writeJSON(file,{value:'bad'},{io,wait:()=>waits++}),{code:'EIO'});assert.equal(waits,0);assert.equal(JSON.parse(fs.readFileSync(file)).value,'old');
});

test('in-place rollback preserves nested references and treats prototype-like keys as data',()=>{const {restore}=require('./atomic-json.cjs'),target={dialogue:{questions:[{id:'old'}],brief:'new'}},state=target.dialogue,questions=state.questions;restore(target,{dialogue:{questions:[],brief:'saved'}});assert.equal(target.dialogue,state);assert.equal(state.questions,questions);assert.equal(questions.length,0);assert.equal(state.brief,'saved');const value=JSON.parse('{"__proto__":{"polluted":"no"}}');restore(target,value);assert.equal(Object.getPrototypeOf(target),Object.prototype);assert.equal({}.polluted,undefined);assert.equal(Object.getOwnPropertyDescriptor(target,'__proto__').value.polluted,'no');});
