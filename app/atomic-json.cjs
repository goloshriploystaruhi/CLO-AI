const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const transient=new Set(['EPERM','EACCES','EBUSY']),delay=new Int32Array(new SharedArrayBuffer(4));
function restore(target,snapshot){
 for(const key of Object.keys(target))if(!Object.hasOwn(snapshot,key))delete target[key];
 for(const [key,value]of Object.entries(snapshot)){
  if(value&&typeof value==='object'){
   if(!Object.hasOwn(target,key)||!target[key]||typeof target[key]!=='object'||Array.isArray(target[key])!==Array.isArray(value))Object.defineProperty(target,key,{value:Array.isArray(value)?[]:{},writable:true,enumerable:true,configurable:true});
   restore(target[key],value);
  }else Object.defineProperty(target,key,{value,writable:true,enumerable:true,configurable:true});
 }
 if(Array.isArray(snapshot))target.length=snapshot.length;
 return target;
}
// Never unlink the destination to get around a Windows sharing lock. A failed
// replacement leaves the previous JSON readable; retries are bounded to 24 ms.
function writeJSON(file,data,{backup=false,io=fs,wait=ms=>Atomics.wait(delay,0,0,ms)}={}){
 const payload=JSON.stringify(data,null,2),suffix=process.pid+'.'+randomUUID()+'.tmp',temporary=file+'.'+suffix,backupTemporary=file+'.bak.'+suffix;
 const retry=operation=>{for(let attempt=0;;attempt++){try{return operation();}catch(error){if(!transient.has(error.code)||attempt===2)throw error;wait(8*(attempt+1));}}};
 io.mkdirSync(path.dirname(file),{recursive:true});let descriptor;
 try{
  descriptor=io.openSync(temporary,'wx');io.writeFileSync(descriptor,payload,'utf8');io.fsyncSync(descriptor);io.closeSync(descriptor);descriptor=undefined;
  if(backup&&io.existsSync(file)){retry(()=>io.copyFileSync(file,backupTemporary));retry(()=>io.renameSync(backupTemporary,file+'.bak'));}
  retry(()=>io.renameSync(temporary,file));
 }finally{
  if(descriptor!==undefined)try{io.closeSync(descriptor);}catch{}
  // Cleanup must not replace the useful write/rename error if a scanner also
  // holds the temporary file. Unique names prevent a later save using it.
  for(const candidate of [temporary,backupTemporary])try{io.unlinkSync(candidate);}catch{}
 }
}
module.exports={writeJSON,restore};
