// Real hidden Electron renderer; isolated IPC, no user data, network or computer use.
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const folder=fs.mkdtempSync(path.join(__dirname,'../research/composer-layout-')),output=path.join(__dirname,'../research/composer-layout-checks');fs.mkdirSync(output,{recursive:true});
app.setPath('userData',path.join(folder,'electron'));app.disableHardwareAcceleration();
const profiles=new(require('./body-profiles.cjs').BodyProfiles)(path.join(folder,'profiles.json'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));let epoch=1,pending=false,started=0,finish,request;
const events=[{action:'construction',object:'Перед',status:'running',description:'Техническая подробность построения'}];
const history=[{kind:'user',text:'Создай деталь'},{kind:'assistant',text:'Деталь создана.',execution_events:events}];
ipcMain.handle('call',async(_,method,arg)=>{
 if(method==='session')return {sharing:true,status:'connected'};
 if(method==='models')return [{slug:'test-model'}];
 if(method==='bridge')return {connected:true,version:3};
 if(method==='project-state')return {available:true,session_id:'composer-'+epoch,name:'Тест',part_count:0};
 if(method==='chat-history')return epoch===1?[]:history;
 if(method==='profiles')return profiles.tool(arg.action,arg.args);
 if(method==='dialogue-status')return {questions:[],started_at:started,operation_id:pending?'operation':null,preview:pending?'Проверяю результат.':'',events};
 if(method==='create'){request=arg;started=Date.now();pending=true;return new Promise(resolve=>{finish=()=>{pending=false;resolve({message:'Готово. Деталь создана.',execution_events:events});};});}
 if(method==='pick-reference')return {references:[{id:'ref-'+Date.now(),name:'Референс.png'}]};
 if(method==='reference-image')return {data_url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='};
 if(['measurement-help-close','copy-text','open-link'].includes(method))return {};
 throw Error('Неожиданный IPC: '+method);
});
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:600,height:600,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}}),errors=[],passed=[];
 win.setContentSize(Number(process.argv[2])||600,Number(process.argv[3])||572);win.webContents.on('console-message',(_,d)=>{if(d?.level==='error')errors.push(d.message);});win.webContents.on('render-process-gone',(_,d)=>errors.push(d.reason));
 const js=s=>win.webContents.executeJavaScript(s,true),wait=async s=>{const end=Date.now()+6000;while(Date.now()<end){if(await js(s))return;await pause(20);}throw Error('Timeout: '+s);};
 const text=value=>js('(()=>{const n=document.getElementById("text");n.value='+JSON.stringify(value)+';n.setSelectionRange(n.value.length,n.value.length);n.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertFromPaste"}));})()');
 const sample=()=>js(`(()=>{const input=document.getElementById('text'),composer=document.getElementById('composer'),history=document.getElementById('history'),actions=document.querySelector('.composer-actions'),send=document.getElementById('send'),s=getComputedStyle(input),r=input.getBoundingClientRect();return {viewport:{width:innerWidth,height:innerHeight},row:(innerHeight-29)/12,nav:document.querySelector(".tabs").getBoundingClientRect().top,composerTop:composer.getBoundingClientRect().top,composer:composer.getBoundingClientRect().height,input:{x:r.x,y:r.y,width:r.width,height:r.height},usable:r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),line:parseFloat(s.lineHeight),font:parseFloat(s.fontSize),gap:send.getBoundingClientRect().top-r.bottom,footer:actions.getBoundingClientRect().bottom,history:history.clientHeight,scroll:input.scrollHeight,client:input.clientHeight,target:getComputedStyle(composer).flexBasis,transition:getComputedStyle(composer).transitionDuration,overflow:document.documentElement.scrollWidth>innerWidth,selection:input.selectionStart,value:input.value,focused:document.activeElement===input};})()`);
 const capture=async name=>fs.writeFileSync(path.join(output,name+'.png'),(await win.webContents.capturePage()).toPNG());
 try{
  await win.loadFile(path.join(__dirname,'index.html'));await js('document.fonts.ready');await wait('!document.getElementById("workspace").hidden');await pause(300);
  const initial=await sample();assert(Math.abs(initial.composer-5*initial.row)<.1,JSON.stringify(initial));assert(Math.abs(initial.nav-initial.row)<.1);assert(Math.abs(initial.composerTop-7*initial.row)<.1);assert.equal(initial.gap,28);assert(initial.input.height>127);assert(Math.abs(initial.footer-12*initial.row)<.1);assert.equal(initial.font,48);assert(!initial.overflow);await capture('01-initial');
  passed.push('Начальный блок занимает5рядов FIG: поле и нижние действия на сетке, отступ28px, шрифт48px');
  epoch=2;await js('window.dispatchEvent(new Event("focus"))');await wait('document.querySelectorAll("#history article").length===2');await pause(320);
  const compact=await sample();assert(Math.abs(compact.usable-2*compact.line)<1);assert.equal(compact.line,20);assert(Math.abs(compact.composer-3*compact.row)<1);assert.equal(compact.font,16);assert.equal(compact.gap,28);assert.equal(compact.footer,initial.footer);assert(compact.history>initial.history);assert.equal(await js('document.querySelectorAll(".execution-events").length'),0);assert(!await js('document.getElementById("history").textContent.includes("Ход работы")'));assert(!await js('document.getElementById("history").textContent.includes("Техническая подробность")'));await capture('02-compact');
  passed.push('Продолжение диалога: ровно две строки, история получает освободившееся место, прежние события не выводятся');
  await js('document.getElementById("text").focus()');await text('Короткое уточнение');await pause(240);assert.equal((await sample()).composer,compact.composer);
  const long='Свободная куртка с большими карманами и длинными рукавами. '.repeat(16);await text(long);await pause(65);const intermediate=await sample();assert(intermediate.composer>compact.composer&&intermediate.composer<initial.composer,JSON.stringify(intermediate));assert(intermediate.focused);assert.equal(intermediate.value,long);assert.equal(intermediate.selection,long.length);await pause(260);
  const expanded=await sample();assert.equal(expanded.composer,initial.composer);assert.equal(expanded.input.height,initial.input.height);assert(expanded.scroll>expanded.client);assert.equal(expanded.gap,28);assert.equal(expanded.footer,initial.footer);assert(!expanded.overflow);assert.equal(expanded.font,16);await capture('03-expanded');
  passed.push('Длинный текст плавно расширяет блок за200мс до исходного максимума; ввод, выделение и прокрутка доступны сразу');
  await text('Строка1\nСтрока2\nСтрока3');await pause(300);const three=await sample();assert(Math.abs(three.usable-3*three.line)<1);assert.equal(three.gap,28);
  await js('document.getElementById("attach-reference").click()');await wait('!!document.querySelector(".reference-preview")');await pause(260);const attached=await sample();assert.deepEqual(attached.input,three.input);assert.equal(attached.composer,three.composer);
  assert(await js(`(()=>{const p=document.querySelector('.reference-preview').getBoundingClientRect(),r=document.getElementById('text').getBoundingClientRect(),s=getComputedStyle(document.getElementById('text')),send=document.getElementById('send').getBoundingClientRect(),strip=document.getElementById('reference-strip').getBoundingClientRect();return p.top>=r.bottom-parseFloat(s.paddingBottom)&&Math.abs(send.left-strip.right-18)<1&&p.bottom<=innerHeight;})()`));await capture('04-references');
  await js('document.querySelector(".reference-preview button").click()');await wait('!document.querySelector(".reference-preview")');await pause(260);assert.deepEqual((await sample()).input,three.input);
  passed.push('Референс и его удаление сохраняют размеры поля; картинки не перекрывают текст,18px до отправки сохранены');
  // A rapid opposite change must retarget the current transition, not queue it.
  await text(long);await pause(55);await text('');await pause(50);assert((await sample()).composer<initial.composer);await pause(260);assert.equal((await sample()).composer,compact.composer);assert((await sample()).focused);
  await js('document.getElementById("tab-profiles").click()');await pause(300);await js('document.getElementById("tab-chat").click()');await pause(320);assert.equal((await sample()).composer,compact.composer);
  passed.push('Быстрый набор/очистка и переход между вкладками не оставляют зависших размеров или потери фокуса');
  win.webContents.debugger.attach();await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await text(long);await pause(30);assert.equal((await sample()).composer,initial.composer);await text('');await pause(30);assert.equal((await sample()).composer,compact.composer);await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});
  passed.push('prefers-reduced-motion убирает переход размеров');
  await text('Создай деталь');await js('document.getElementById("composer").requestSubmit()');await wait('!!document.querySelector(".message-live")');assert.equal(await js('document.querySelectorAll(".message-live details,.execution-events").length'),0);assert.equal(request.text,'Создай деталь');finish();await wait('!document.querySelector(".message-live")&&document.getElementById("history").textContent.includes("Готово.")');await pause(300);assert.equal(await js('document.querySelectorAll(".execution-events").length'),0);assert.equal((await sample()).composer,compact.composer);
  passed.push('Отправка, живой ответ и итог работают; Ход работы отсутствует и в процессе, и после ответа');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,initial,compact,expanded,computer_use:false,real_gpt:false,real_clo:false,renderer_errors:errors},null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,error:error.message,stack:error.stack,renderer_errors:errors},null,2));app.exit(1);}
});
