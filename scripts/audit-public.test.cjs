'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync,spawnSync}=require('node:child_process');
function fixture(t){
 const parent=path.resolve(__dirname,'../research');fs.mkdirSync(parent,{recursive:true});const root=fs.mkdtempSync(path.join(parent,'publication-audit-'));
 t.after(()=>{if(path.dirname(fs.realpathSync(root))!==fs.realpathSync(parent))throw Error('Unexpected fixture location');fs.rmSync(root,{recursive:true,force:true});});
 fs.mkdirSync(path.join(root,'scripts'));fs.copyFileSync(path.join(__dirname,'audit-public.cjs'),path.join(root,'scripts/audit-public.cjs'));
 execFileSync('git',['init','--quiet'],{cwd:root});
 const add=name=>execFileSync('git',['add','--',name],{cwd:root});
 const audit=()=>spawnSync(process.execPath,['scripts/audit-public.cjs'],{cwd:root,encoding:'utf8'});
 return {root,add,audit};
}
test('publication audit inspects staged blobs even if a sensitive fixture is erased in the working tree',t=>{
 const h=fixture(t),file=path.join(h.root,'sample.txt');fs.writeFileSync(file,'ghp_'+'a'.repeat(40));h.add('sample.txt');fs.writeFileSync(file,'Безопасный рабочий текст');
 const result=h.audit();assert.equal(result.status,1);assert(result.stderr.includes('sample.txt'));assert(!result.stderr.includes('a'.repeat(40)));
});
test('publication audit accepts a clean staged file and rejects a project artifact',t=>{
 const h=fixture(t);fs.writeFileSync(path.join(h.root,'README.md'),'Синтетический пример');h.add('README.md');assert.equal(h.audit().status,0);
 fs.writeFileSync(path.join(h.root,'private.zprj'),'synthetic');h.add('private.zprj');const result=h.audit();assert.equal(result.status,1);assert(result.stderr.includes('private.zprj'));
});
