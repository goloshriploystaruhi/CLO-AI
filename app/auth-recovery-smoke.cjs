// Actual renderer and retry coordinator, isolated SDK/browser/CLO transport.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {SignInFlow}=require('./signin-flow.cjs');
const output=path.join(__dirname,'..','research','auth-recovery-checks');fs.mkdirSync(output,{recursive:true});
const isolated=fs.mkdtempSync(path.join(__dirname,'..','research','auth-recovery-'));
app.setPath('userData',path.join(isolated,'electron'));app.disableHardwareAcceleration();
console.log=(...args)=>fs.appendFileSync(path.join(output,'output.log'),args.join(' ')+'\n');console.error=console.log;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let sharing=false,active=null,cancelCalls=0,maxActive=0,activeCount=0,modelCalls=0;
const attempts=[],signinCalls=[];
const client={
 signIn({signal}){
  assert.equal(active,null,'An older SDK attempt must finish cleanup first');
  const id=attempts.length+1;activeCount++;maxActive=Math.max(maxActive,activeCount);
  return new Promise((resolve,reject)=>{
   let settled=false;
   const finish=(error,session)=>{if(settled)return;settled=true;signal.removeEventListener('abort',abort);active=null;activeCount--;if(error)reject(error);else{sharing=true;resolve(session);}};
   const abort=()=>{attempt.aborted=true;setTimeout(()=>finish(Object.assign(Error('Sign-in was cancelled.'),{code:'cancelled'})),120);};
   const attempt={id,aborted:false,reject:error=>finish(error),resolve:()=>finish(null,{status:'connected',sharing:true})};
   attempts.push(attempt);active=attempt;signal.addEventListener('abort',abort,{once:true});
  });
 },
 cancelSignIn(){cancelCalls++;}
};
const flow=new SignInFlow(client,{timeoutMs:10_000});
ipcMain.handle('call',async(_event,method,arg)=>{
 try{
  if(method==='session')return {status:sharing?'connected':'disconnected',sharing};
  if(method==='signin'){signinCalls.push(arg);return await flow.run(arg);}
  if(method==='models'){modelCalls++;return [{slug:'isolated-test-model'}];}
  if(method==='project-state')return {available:false,session_id:'isolated-project',name:'Тест',part_count:0,context_version:1};
  if(method==='bridge')return {connected:false,version:3,auto_update:true};
  if(method==='chat-history')return [];
  if(method==='measurement-help-close')return {closed:true};
  if(method==='profiles'&&arg.action==='list_body_profiles')return {profiles:[],active:null,catalog:[]};
  throw Error('Unexpected IPC: '+method);
 }catch(error){return {error:error.message,code:error.code||'unknown',stage:method};}
});
app.whenReady().then(async()=>{
 const win=new BrowserWindow({...require('./window-config.cjs'),show:false,webPreferences:{offscreen:true,backgroundThrottling:false,preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const rendererErrors=[],passed=[];
 win.webContents.on('console-message',(...args)=>{const detail=args[1];if(typeof detail==='object'){if(detail.level==='error')rendererErrors.push(detail.message);}else if(detail===3)rendererErrors.push(args[2]);});
 win.webContents.on('render-process-gone',(_,detail)=>rendererErrors.push(detail.reason));
 const js=source=>win.webContents.executeJavaScript(source,true),click=()=>js('document.getElementById("auth-connect").click()');
 const wait=async(source,label=source)=>{const deadline=Date.now()+6_000;while(Date.now()<deadline){if(typeof source==='function'?source():await js(source))return;await pause(20);}throw Error('Timeout: '+label);};
 const busy=()=>js('document.getElementById("auth-connect").getAttribute("aria-busy")');
 const enabled=()=>js('!document.getElementById("auth-connect").disabled');
 try{
  await win.loadFile(path.join(__dirname,'index.html'));await wait('!document.getElementById("auth-connect").disabled');
  await js('document.getElementById("auth-connect").click();document.getElementById("auth-connect").click()');
  await wait(()=>attempts.length===1,'First SDK attempt starts');assert.equal(await busy(),'true');assert.equal(await enabled(),true);assert.equal(signinCalls.length,1);
  await js('window.dispatchEvent(new Event("blur"));window.dispatchEvent(new Event("focus"))');assert.equal(signinCalls.length,1);
  passed.push('Ожидание браузера оставляет подключение доступным; двойное нажатие и возврат фокуса не создают второй вход');

  await pause(430);await click();await wait(()=>attempts[0].aborted,'Old attempt cancelled');
  assert.equal(attempts.length,1,'Retry waits for SDK cleanup');assert.equal(await busy(),'true');assert.equal(await enabled(),true);
  await wait(()=>attempts.length===2,'Retry starts after cleanup');assert.equal(cancelCalls,1);assert.equal(maxActive,1);assert.deepEqual(signinCalls,[{restart:false},{restart:true}]);
  assert.equal(await busy(),'true');assert.equal(await js('document.getElementById("auth-notice").hidden'),true);
  passed.push('Повтор отменяет прежнюю попытку и ждёт очистки; поздняя отмена не снимает состояние нового входа и не выводит ошибку');

  attempts[1].reject(Object.assign(Error('Access denied.'),{code:'access_denied'}));
  await wait('document.getElementById("auth-connect").getAttribute("aria-busy")==="false"');assert.equal(await enabled(),true);
  assert.match(await js('document.getElementById("auth-notice").textContent'),/Вход не завершён|разрешение отклонено/);
  assert.equal(await js('document.getElementById("workspace").hidden'),true);
  passed.push('Отклонённый вход показывает русскую причину и разрешает новую попытку без ложного успеха');

  flow.timeoutMs=160;await click();await wait(()=>attempts.length===3,'Timeout attempt starts');
  await wait('document.getElementById("auth-notice").textContent.includes("Время ожидания входа истекло")');
  assert.equal(attempts[2].aborted,true);assert.equal(await busy(),'false');assert.equal(await enabled(),true);assert.equal(flow.current,null);
  passed.push('Тайм-аут отменяет SDK-ожидание, очищает координатор и сохраняет работающую кнопку');

  flow.timeoutMs=10_000;await click();await wait(()=>attempts.length===4,'Successful retry starts');attempts[3].resolve();
  await wait('!document.getElementById("bridge-screen").hidden');await wait('document.getElementById("auth-connect").getAttribute("aria-busy")==="false"');
  assert.equal(modelCalls,1);assert.equal(await js('document.getElementById("auth-screen").hidden'),true);assert.equal(await js('document.getElementById("workspace").hidden'),true);
  assert.equal(maxActive,1);assert.deepEqual(rendererErrors,[]);
  passed.push('Повтор после тайм-аута подключает AI, загружает модели и открывает этап CLO; параллельных SDK-попыток нет');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,renderer_errors:rendererErrors,attempts:attempts.length,cancel_calls:cancelCalls,max_parallel_sdk_attempts:maxActive,real_gpt:false,real_clo:false,computer_use:false},null,2));
  app.quit();
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.message,passed,renderer_errors:rendererErrors},null,2));flow.cancel();app.exit(1);}
});
