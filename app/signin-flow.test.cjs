const {test}=require('node:test'),assert=require('node:assert/strict');
const {SignInFlow}=require('./signin-flow.cjs'),format=require('./ui-format.js');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fakeClient(){
 const calls=[];let active=0,maxActive=0,cancelled=0;
 const client={signIn({signal}){
  active++;maxActive=Math.max(active,maxActive);
  const call={signal,resolve:null,reject:null};calls.push(call);
  return new Promise((resolve,reject)=>{
   const finish=(fn,value)=>{if(call.finished)return;call.finished=true;signal.removeEventListener('abort',abort);active--;fn(value);};
   const abort=()=>{call.aborting=true;setTimeout(()=>finish(reject,Object.assign(new Error('Sign-in was cancelled.'),{code:'cancelled'})),25);};
   call.resolve=value=>finish(resolve,value);call.reject=error=>finish(reject,error);
   signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  });
 },cancelSignIn(){cancelled++;}};
 return {client,calls,get active(){return active;},get maxActive(){return maxActive;},get cancelled(){return cancelled;}};
}
test('duplicate calls share one sign-in; explicit retry waits for cancellation cleanup',async()=>{
 const sdk=fakeClient(),flow=new SignInFlow(sdk.client);
 const first=flow.run(),observed=assert.rejects(first,{code:'cancelled'});
 assert.equal(flow.run(),first);assert.equal(sdk.calls.length,1);
 const next=flow.run({restart:true});assert.equal(sdk.cancelled,1);assert(sdk.calls[0].signal.aborted);
 assert.equal(sdk.calls.length,1,'Old listener/store cleanup must finish before retry starts');
 await observed;await pause(0);assert.equal(sdk.calls.length,2);assert.equal(sdk.maxActive,1);
 const session={sharing:true,status:'connected'};sdk.calls[1].resolve(session);assert.equal(await next,session);assert.equal(flow.current,null);
});
test('rapid retries cancel queued attempts; only the latest starts a new SDK flow',async()=>{
 const sdk=fakeClient(),flow=new SignInFlow(sdk.client);
 const first=flow.run(),observedFirst=assert.rejects(first,{code:'cancelled'});
 const queued=flow.run({restart:true}),observedQueued=assert.rejects(queued,{name:'AbortError'});
 const latest=flow.run({restart:true});assert.equal(sdk.calls.length,1);
 await Promise.all([observedFirst,observedQueued]);await pause(0);assert.equal(sdk.calls.length,2);assert.equal(sdk.maxActive,1);
 sdk.calls[1].resolve({sharing:true});await latest;assert.equal(flow.current,null);
});
test('a real cancellation deadline releases the SDK and permits a fresh attempt',async()=>{
 const sdk=fakeClient(),flow=new SignInFlow(sdk.client,{timeoutMs:20});
 await assert.rejects(flow.run(),error=>error.code==='signin_timeout'&&error.retryable&&/время|Время/.test(error.message));
 assert.equal(flow.current,null);assert.equal(sdk.active,0);assert.equal(sdk.cancelled,1);
 const next=flow.run();sdk.calls[1].resolve({sharing:true});assert.deepEqual(await next,{sharing:true});
});
test('provider failures release the attempt without signing out or changing credentials',async()=>{
 const sdk=fakeClient(),flow=new SignInFlow(sdk.client),denied=Object.assign(new Error('Declined'),{code:'access_denied'});
 const first=flow.run(),observed=assert.rejects(first,error=>error===denied);sdk.calls[0].reject(denied);await observed;assert.equal(flow.current,null);assert.equal(sdk.cancelled,0);
 const next=flow.run();sdk.calls[1].resolve({status:'connected',sharing:false});assert.deepEqual(await next,{status:'connected',sharing:false});
});
test('explicit cancellation also cancels a retry queued behind SDK cleanup',async()=>{
 const sdk=fakeClient(),flow=new SignInFlow(sdk.client),first=flow.run(),seen=assert.rejects(first,{code:'cancelled'});
 const next=flow.run({restart:true}),seenNext=assert.rejects(next,{name:'AbortError'});flow.cancel();
 await Promise.all([seen,seenNext]);assert.equal(sdk.calls.length,1);assert.equal(flow.current,null);
});
test('sign-in timeout and declined consent have actionable Russian messages',()=>{
 assert.match(format.errorText({code:'signin_timeout',message:'timeout'}),/Время ожидания.*Подключи ChatGPT/);
 assert.match(format.errorText({code:'access_denied',message:'access denied'}),/браузере/);
});
