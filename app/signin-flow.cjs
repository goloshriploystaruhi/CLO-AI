// Serialize retries through the SDK's own cancellation/cleanup. A browser error
// page may never reach the loopback callback; it must not make retry impossible.
class SignInFlow {
 constructor(client,{timeoutMs=10*60_000}={}){
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new TypeError('Invalid sign-in timeout');
  this.client=client;this.timeoutMs=timeoutMs;this.current=null;
 }
 abort(attempt){
  if(!attempt||attempt.controller.signal.aborted)return;
  attempt.controller.abort();
  if(attempt.started)this.client.cancelSignIn();
 }
 run({restart=false}={}){
  const previous=this.current;
  if(previous&&!restart)return previous.promise;
  this.abort(previous);
  const attempt={controller:new AbortController(),started:false,timedOut:false,timer:null,promise:null};
  this.current=attempt;
  attempt.promise=(async()=>{
   try{
    // Do not start another SDK attempt while its predecessor still owns the
    // callback listener or is finishing a credential-store transaction.
    if(previous)await previous.promise.catch(()=>{});
    attempt.controller.signal.throwIfAborted();
    attempt.started=true;
    attempt.timer=setTimeout(()=>{attempt.timedOut=true;this.abort(attempt);},this.timeoutMs);
    const session=await this.client.signIn({signal:attempt.controller.signal});
    attempt.controller.signal.throwIfAborted();
    return session;
   }catch(error){
    if(attempt.timedOut)throw Object.assign(new Error('Время ожидания входа истекло. Нажмите «Подключи ChatGPT», чтобы открыть вход заново.'),{code:'signin_timeout',retryable:true});
    throw error;
   }finally{
    clearTimeout(attempt.timer);
    if(this.current===attempt)this.current=null;
   }
  })();
  return attempt.promise;
 }
 cancel(){this.abort(this.current);}
}
module.exports={SignInFlow};
