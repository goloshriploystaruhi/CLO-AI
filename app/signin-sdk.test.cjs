// Real SDK + loopback listener, synthetic encrypted credentials, no provider or browser access.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCipheriv,createDecipheriv,randomBytes}=require('node:crypto');
const {mkdtemp,readFile,rm}=require('node:fs/promises');
const path=require('node:path'),{pathToFileURL}=require('node:url'),http=require('node:http');
const issuer='https://auth.openai.com',pause=ms=>new Promise(r=>setTimeout(r,ms));
const moduleURL=name=>pathToFileURL(path.join(__dirname,'..','vendor','siwc','packages','local','dist',name)).href;
function encryption(){
 const key=randomBytes(32);
 return {id:'signin-loopback-test-aes-gcm',isAvailable:()=>true,
  encrypt(text){const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce),body=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return Buffer.concat([nonce,cipher.getAuthTag(),body]);},
  decrypt(value){const bytes=Buffer.from(value),decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');}};
}
async function waitFor(predicate){const end=Date.now()+3000;while(Date.now()<end){if(predicate())return;await pause(10);}assert.fail('Synthetic SDK sign-in did not reach the expected stage');}
function callback(authorization){
 const target=new URL(authorization.searchParams.get('redirect_uri'));
 assert.equal(target.hostname,'127.0.0.1');
 target.searchParams.set('state',authorization.searchParams.get('state'));target.searchParams.set('error','access_denied');
 return new Promise(resolve=>{
  const request=http.get(target,{agent:false},response=>{response.resume();response.on('end',()=>resolve({status:response.statusCode}));response.on('error',error=>resolve({error:error.code}));});
  request.on('error',error=>resolve({error:error.code}));request.setTimeout(1000,()=>request.destroy(Object.assign(Error('Synthetic loopback request timed out'),{code:'ETIMEDOUT'})));
 });
}
async function fixture(t){
 const root=path.resolve(__dirname,'..','research'),directory=await mkdtemp(path.join(root,'signin-sdk-'));
 t.after(async()=>{assert(path.resolve(directory).startsWith(root+path.sep));await rm(directory,{recursive:true,force:true});});
 const provider=encryption(),{createChatGPT}=await import(moduleURL('index.js')),{ConnectionStore}=await import(moduleURL('storage.js'));
 t.mock.method(globalThis,'fetch',async url=>{
  assert.equal(String(url),issuer+'/.well-known/openid-configuration','All requests other than synthetic discovery are forbidden');
  return Response.json({issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/oauth/token',jwks_uri:issuer+'/jwks'});
 });
 const store=new ConnectionStore(directory,provider),saved={version:2,activeProfileId:'synthetic-profile',profiles:[{version:1,id:'synthetic-profile',label:'Synthetic saved registration',clientId:'synthetic_saved_client',subject:'synthetic-subject',status:'disconnected',scopes:[],savedAt:'2026-10-28T00:00:00.000Z'}],pendingRegistrations:[]};
 await store.withLock(()=>store.write(saved));
 const filename=path.join(directory,'chatgpt-auth.json'),before=await readFile(filename),opened=[];
 const client=createChatGPT({appName:'CLO SDK Sign-in Test',appId:'clo-signin-test',redirectPort:0,storageDir:directory,credentialEncryption:provider,openBrowser:async url=>{const authorization=new URL(url);assert.equal(authorization.origin,issuer);assert.equal(authorization.searchParams.get('client_id'),'synthetic_saved_client');opened.push(authorization);}});
 t.after(()=>client.cancelSignIn());
 return {client,opened,unchanged:async()=>assert.deepEqual(await readFile(filename),before,'Cancellation and rejected callback must preserve saved encrypted registration')};
}
function freshAttempt(previous,next){
 for(const key of ['state','nonce','code_challenge']){assert(previous.searchParams.get(key));assert(next.searchParams.get(key));assert.notEqual(previous.searchParams.get(key),next.searchParams.get(key),key+' must be renewed');}
 assert.equal(next.searchParams.get('code_challenge_method'),'S256');
 assert.equal(previous.searchParams.get('client_id'),next.searchParams.get('client_id'));
}
const outcome=promise=>promise.then(value=>({value}),error=>({error}));

test('SDK cancellation closes the callback listener and allows a fresh saved-registration sign-in', {timeout:8000},async t=>{
 const f=await fixture(t),first=outcome(f.client.signIn());await waitFor(()=>f.opened.length===1);
 f.client.cancelSignIn();assert.equal((await first).error?.code,'cancelled');
 const old=await callback(f.opened[0]);assert.notEqual(old.status,200,'A cancelled listener must not accept its old callback');
 assert.equal((await f.client.getSession()).status,'disconnected');await f.unchanged();
 const second=outcome(f.client.signIn());await waitFor(()=>f.opened.length===2);freshAttempt(f.opened[0],f.opened[1]);
 assert.equal((await callback(f.opened[1])).status,200);assert.equal((await second).error?.code,'access_denied');await f.unchanged();
});

test('SignInFlow restarts actual SDK authorization without overlapping attempts or accepting stale callbacks', {timeout:8000},async t=>{
 const f=await fixture(t),{SignInFlow}=require('./signin-flow.cjs'),flow=new SignInFlow(f.client,{timeoutMs:3000});
 let active=0,maximum=0,cancelled=0;const originalSignIn=f.client.signIn,originalCancel=f.client.cancelSignIn;
 t.mock.method(f.client,'signIn',async options=>{active++;maximum=Math.max(maximum,active);try{return await originalSignIn(options);}finally{active--;}});
 t.mock.method(f.client,'cancelSignIn',()=>{cancelled++;originalCancel();});
 t.after(()=>flow.cancel());
 const first=outcome(flow.run());await waitFor(()=>f.opened.length===1);
 const second=outcome(flow.run({restart:true}));await waitFor(()=>f.opened.length===2);
 assert.equal((await first).error?.code,'cancelled');assert.equal(maximum,1);assert(cancelled>=1);freshAttempt(f.opened[0],f.opened[1]);
 assert.notEqual((await callback(f.opened[0])).status,200,'A stale callback must never complete the new attempt');
 assert.equal((await callback(f.opened[1])).status,200);assert.equal((await second).error?.code,'access_denied');assert.equal(active,0);await f.unchanged();
});

test('SignInFlow timeout cancels the actual listener and the next sign-in remains usable', {timeout:8000},async t=>{
 const f=await fixture(t),{SignInFlow}=require('./signin-flow.cjs'),flow=new SignInFlow(f.client,{timeoutMs:350});t.after(()=>flow.cancel());
 const timed=outcome(flow.run());await waitFor(()=>f.opened.length===1);assert.equal((await timed).error?.code,'signin_timeout');
 assert.notEqual((await callback(f.opened[0])).status,200);await f.unchanged();
 const retried=outcome(flow.run());await waitFor(()=>f.opened.length===2);freshAttempt(f.opened[0],f.opened[1]);
 assert.equal((await callback(f.opened[1])).status,200);assert.equal((await retried).error?.code,'access_denied');await f.unchanged();
});
