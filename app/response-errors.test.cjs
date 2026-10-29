const {test}=require('node:test'),assert=require('node:assert/strict');
const {run}=require('./construction-agent.cjs'),diagnostics=require('./request-diagnostics.cjs'),format=require('./ui-format.js');
const noop=async()=>{};

test('ordinary requests do not depend on hosted search; explicit search falls back after a real 422 validation body',async()=>{
 const {streamResponse}=await import('./siwc-responses.mjs');const old=globalThis.fetch;let bodies=[],traces=[];
 const input=[{role:'user',content:[{type:'input_text',text:'Создай профиль, затем штаны'},{type:'input_image',image_url:'data:image/jpeg;base64,/9j/'}]}];
 try{
  globalThis.fetch=async(url,init)=>{
   const body=JSON.parse(init.body);bodies.push(body);
   if(body.tools)return new Response(JSON.stringify({detail:[{loc:['body','max_tool_calls'],type:'extra_forbidden',msg:'SECRET',input:'SECRET'}]}),{status:422,headers:{'content-type':'application/json','x-request-id':'req-validation'}});
   return new Response('data: '+JSON.stringify({type:'response.output_text.delta',delta:'{"message":"Профиль можно создать"}'})+'\n\ndata: '+JSON.stringify({type:'response.completed',response:{status:'completed'}})+'\n\n',{headers:{'content-type':'text/event-stream'}});
  };
  const request=o=>streamResponse('test-token',o,o.signal);
  const base={request,read:noop,preview:noop,ensureCurrent:noop,onTrace:e=>traces.push(e)};
  const plain=await run({...base,options:{model:'selected',input}});
  assert.match(plain.text,/Профиль/);assert.equal(bodies.length,1);assert.equal(bodies[0].tools,undefined);assert.equal(bodies[0].max_tool_calls,undefined);
  const fallback=await run({...base,options:{model:'selected',input,webSearch:true}});
  assert.match(fallback.text,/Профиль/);assert.equal(bodies.length,3);assert.equal(bodies[1].tools[0].type,'web_search');assert.equal(bodies[2].tools,undefined);
  assert.deepEqual(bodies[2].input[0],bodies[1].input[0]);assert.equal(traces.length,1);assert.equal(traces[0].kind,'capability');
 }finally{globalThis.fetch=old;}
});

test('validation diagnostics identify safe fields without echoing input or arbitrary server messages',async()=>{
 const {responseError}=await import('./response-errors.mjs');
 for(const [body,field]of [
  [{detail:[{loc:['body','tools',0,'type'],msg:'SECRET',input:'SECRET'}]},'tools'],
  [{error:{param:'tools[0].type',message:'SECRET'}},'tools'],
  [{detail:[{loc:['body','input',0,'content'],msg:'SECRET'}]},'input'],
 ]){
  const error=responseError(body,422,'req-safe');assert.equal(error.param,field);
  const safe=diagnostics.text(error);assert.match(safe,/HTTP 422/);assert.match(safe,/req-safe/);assert.doesNotMatch(safe,/SECRET/);
  assert.doesNotMatch(JSON.stringify(error),/SECRET/);
 }
 assert.equal(responseError({detail:[{loc:['body','PRIVATE'],msg:'SECRET'}]},422).param,undefined);
 assert.deepEqual(diagnostics.safe({status:422,param:'bad secret',requestId:'Bearer secret',message:'SECRET',input:'SECRET'}),{status:422});
});

test('only rejected optional tools trigger fallback, not input errors, access restrictions or limits',async()=>{
 const {responseError}=await import('./response-errors.mjs');
 for(const error of [responseError({detail:[{loc:['body','input']}]},422),responseError({},401),responseError({},403),responseError({},429),responseError({},500)]){
  let calls=0;
  await assert.rejects(run({options:{model:'selected',input:[],webSearch:true},request:async options=>{calls++;assert.equal(options.model,'selected');assert.equal(options.webSearch,true,'a transient retry must not switch tools or account');throw error;},waitForRetry:async()=>{},ensureCurrent:noop}),e=>e===error);
  assert.equal(calls,error.status===500?2:1);assert.doesNotMatch(format.errorText(error),/Не удалось выполнить действие/);
 }
 assert.match(format.errorText(responseError({error:{param:'model'}},400)),/выбранную модель.*HTTP 400/);
 assert.match(format.errorText(responseError({},429)),/лимит/);
 assert.match(format.errorText({code:'invalid_grant',status:400}),/повторно войти/);
 assert.match(format.errorText({code:'subscription_sharing_unsupported_capability',status:400}),/не разрешает/);
});
