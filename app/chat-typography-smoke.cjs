// Real Chromium input/layout sampling; no network, user data or computer use.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const output=path.join(__dirname,'../research/typing-stability-checks');fs.mkdirSync(output,{recursive:true});
const isolated=fs.mkdtempSync(path.join(__dirname,'../research/typing-stability-'));app.setPath('userData',path.join(isolated,'electron'));app.disableHardwareAcceleration();
const url=file=>pathToFileURL(path.join(__dirname,file)).href,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
fs.writeFileSync(path.join(isolated,'index.html'),'<meta charset="utf-8"><link rel="stylesheet" href="'+url('ui.css')+'"><div id="history"></div><form id="composer" class="composer" style="position:absolute;left:20px;right:20px;bottom:20px;height:192px"><div class="input-area"><textarea id="text" rows="2"></textarea></div><div class="composer-actions"><button type="button">Добавить референс</button><button type="button">Отправить</button></div></form><script src="'+url('chat-typography.js')+'"></script><script src="fixture.js"></script>');
fs.writeFileSync(path.join(isolated,'fixture.js'),`const input=document.getElementById('text'),composer=document.getElementById('composer');
window.typography=ChatTypography.mount(input,composer);
const mirror=document.createElement('div');document.body.append(mirror);let frame,running=false;
window.samples=[];
window.sample=(kind='manual')=>{
 const style=getComputedStyle(input);mirror.style.cssText='position:fixed;left:-10000px;top:0;height:auto;margin:0;border:0;box-sizing:border-box;visibility:hidden;';
 for(const name of ['fontFamily','fontWeight','fontSize','fontStyle','fontStretch','lineHeight','letterSpacing','fontKerning','fontFeatureSettings','fontVariantLigatures','tabSize','wordSpacing','whiteSpace','overflowWrap','wordBreak','paddingLeft','paddingRight','paddingTop','paddingBottom'])mirror.style[name]=style[name];
 mirror.style.width=input.clientWidth+'px';mirror.textContent=input.value||'\u200b';
 const box=input.getBoundingClientRect(),font=parseFloat(style.fontSize),line=parseFloat(style.lineHeight),height=mirror.getBoundingClientRect().height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
 return {kind,length:input.value.length,newlines:input.value.split(String.fromCharCode(10)).length,font,target:parseFloat(input.style.fontSize),lines:Math.round(height/line),left:box.left,top:box.top,width:box.width,height:box.height,scrollLeft:input.scrollLeft,scrollTop:input.scrollTop,scrollHeight:input.scrollHeight,clientHeight:input.clientHeight,selectionStart:input.selectionStart,selectionEnd:input.selectionEnd,wrap:input.wrap,transitions:input.getAnimations().filter(a=>a.transitionProperty==='font-size'||a.transitionProperty==='line-height').map(a=>a.transitionProperty)};
};
input.addEventListener('input',()=>window.samples.push(window.sample('input')));
window.startSamples=()=>{window.samples=[];running=true;const tick=()=>{if(!running)return;window.samples.push(window.sample('frame'));frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);};
window.stopSamples=()=>{running=false;cancelAnimationFrame(frame);return window.samples;};
window.setText=(value,type='insertFromPaste')=>{input.value=value;input.setSelectionRange(value.length,value.length);input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:type,data:value}));return window.sample();};`);
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:600,height:600,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}}),passed=[],errors=[];
 win.webContents.on('console-message',(_,detail)=>{if(detail?.level==='error')errors.push(detail.message);});
 const js=source=>win.webContents.executeJavaScript(source,true);
 const wait=async source=>{const end=Date.now()+4000;while(Date.now()<end){if(await js(source))return;await pause(15);}throw Error('Timeout: '+source);};
 const exact=sample=>{assert(Math.abs(sample.font-sample.target)<.02,JSON.stringify(sample));assert.deepEqual(sample.transitions,[]);assert(sample.font>=16&&sample.font<=48);};
 try{
  await win.loadFile(path.join(isolated,'index.html'));await js('document.fonts.ready');await wait('parseFloat(input.style.fontSize)===48');
  win.webContents.debugger.attach();await win.webContents.debugger.sendCommand('Emulation.setFocusEmulationEnabled',{enabled:true});await js('input.focus()');
  const bounds=await js('window.sample()');assert.equal(bounds.width,560);exact(bounds);assert.equal(bounds.font,48);
  await js('window.startSamples()');
  const text=('Хочу создать свободную куртку с большими карманами и объёмными рукавами для прогулок. ').repeat(3);
  for(const character of text)await win.webContents.insertText(character);
  await pause(190);const samples=await js('window.stopSamples()'),typed=samples.filter(s=>s.kind==='input');
  assert.equal(typed.length,text.length);let previous=48;
  for(const sample of samples){exact(sample);assert.equal(sample.left,bounds.left);assert.equal(sample.top,bounds.top);assert.equal(sample.width,bounds.width);assert.equal(sample.height,bounds.height);if(sample.font>16.01&&sample.length){assert.equal(sample.lines,1,JSON.stringify(sample));assert.equal(sample.scrollLeft,0,JSON.stringify(sample));}}
  for(const sample of typed){assert(sample.font<=previous+.02,JSON.stringify(sample));previous=sample.font;assert.equal(sample.selectionStart,sample.length);assert.equal(sample.selectionEnd,sample.length);}
  assert(typed.some(s=>s.font>16&&s.font<48));assert.equal(typed.at(-1).font,16);assert(typed.at(-1).lines>1);
  passed.push('Быстрый нативный ввод проходит48→16px без промежуточного переноса, CSS-погони за размером, смещения поля и скачков курсора');

  await js('window.setText("Хочу куртку с большими карманами и удобным воротником");window.startSamples()');
  for(let i=0;i<24;i++){win.webContents.sendInputEvent({type:'keyDown',keyCode:'Backspace'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Backspace'});await pause(3);}
  await pause(180);const removed=await js('window.stopSamples()'),deletions=removed.filter(s=>s.kind==='input');assert.equal(deletions.length,24);previous=deletions[0].font;
  for(const sample of deletions){exact(sample);assert(sample.font>=previous-.02);previous=sample.font;assert.equal(sample.lines,1);assert.equal(sample.selectionStart,sample.length);}
  passed.push('Backspace увеличивает шрифт предсказуемо; строка и позиция курсора не прыгают');

  const paste='Свободная куртка\nС карманами\nС воротником\nБез подкладки';const pasted=await js('window.setText('+JSON.stringify(paste)+')');exact(pasted);assert(pasted.font<48);assert(pasted.lines>=4);assert.equal(pasted.wrap,'soft');assert.equal(await js('input.value'),paste);
  const long=await js('window.setText("Тестовый профильица и длинный текст ".repeat(180))');exact(long);assert.equal(long.font,16);assert(long.scrollHeight>long.clientHeight);
  const scrolled=await js('input.scrollTop=input.scrollHeight;window.sample()');assert(scrolled.scrollTop>0);
  const retained=await js('input.setSelectionRange(17,17);input.dispatchEvent(new Event("input",{bubbles:true}));window.sample()');assert.equal(retained.selectionStart,17);assert.equal(retained.selectionEnd,17);assert.equal(retained.scrollTop,scrolled.scrollTop);assert.equal(retained.wrap,'soft');
  passed.push('Вставка с явными переносами и длинный текст сохраняют переносы,16px, выделение и доступную прокрутку');

  const ime=await js('input.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:true,data:""}));input.value="Куртка для прогулок 日本語";input.setSelectionRange(input.value.length,input.value.length);input.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertCompositionText",data:"日本語",isComposing:true}));input.dispatchEvent(new CompositionEvent("compositionend",{bubbles:true,data:"日本語"}));window.sample()');exact(ime);assert.equal(await js('input.value'),'Куртка для прогулок 日本語');assert.equal(ime.selectionStart,ime.length);
  const empty=await js('window.setText("")');exact(empty);assert.equal(empty.font,48);assert.equal(empty.scrollTop,0);assert.equal(empty.scrollLeft,0);
  await js('document.getElementById("history").append(document.createElement("article"))');await wait('parseFloat(getComputedStyle(input).fontSize)===16');assert.equal((await js('window.sample()')).font,16);
  await js('document.getElementById("history").replaceChildren()');await wait('parseFloat(getComputedStyle(input).fontSize)===48');
  passed.push('IME, очистка текста и переход к чату сохраняют содержимое и немедленно применяют нужный размер');

  await js('typography.dispose();window.setText("Длинная строка после отключения обработчиков".repeat(8))');await pause(70);assert.equal((await js('window.sample()')).font,48);assert.deepEqual(errors,[]);
  passed.push('Отключение типографики очищает обработчики и отложенные пересчёты; ошибок renderer нет');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,renderer_errors:errors,native_input_samples:typed.length,frame_samples:samples.filter(s=>s.kind==='frame').length,computer_use:false,real_gpt:false,real_clo:false},null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.message,stack:error.stack,passed,renderer_errors:errors},null,2));app.exit(1);}
});
