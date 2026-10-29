// Actual profile renderer and persisted storage, isolated transport and data.
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const folder=fs.mkdtempSync(path.join(__dirname,'../research/profile-measurements-')),output=path.join(__dirname,'../research/profile-measurements-checks');fs.mkdirSync(output,{recursive:true});app.setPath('userData',path.join(folder,'electron'));app.disableHardwareAcceleration();
const {BodyProfiles}=require('./body-profiles.cjs'),store=new BodyProfiles(path.join(folder,'profiles.json'));
const original=store.create({name:'Сохранённый профиль',metadata:{sex:'male'}});
for(const [measurement,value]of Object.entries({height:1720,underbust:800,bust_height:260,bust_spacing:180,waist_level:170,seat_length:700,ankle_floor:80}))store.update({measurement,value,unit:'mm'});
const custom=store.tool('add_custom_measurement',{name:'Моя мерка',instruction:'От отмеченной точки до второй отметки.',landmarks:'Две отмеченные точки'});
store.update({measurement:custom.id,value:120,unit:'mm'});
const savedBefore=structuredClone(store.profile().measurements),updates=[],helpOpened=[];let helpClosed=0;
ipcMain.handle('profile-measurements-call',async(_,method,arg)=>{
 if(method==='measurement-help-close'){helpClosed++;return {closed:true};}
 if(method==='measurement-help-open'){helpOpened.push(arg.id);return {opened:true};}
 if(method!=='profiles')throw Error('Unexpected IPC: '+method);
 if(arg.action==='update_body_measurement')updates.push(arg.args);
 return store.tool(arg.action,arg.args);
});
const url=file=>pathToFileURL(path.join(__dirname,file)).href;
fs.writeFileSync(path.join(folder,'preload.cjs'),`const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('profileTest',{call:(method,arg)=>ipcRenderer.invoke('profile-measurements-call',method,arg)});`);
fs.writeFileSync(path.join(folder,'ui.js'),`window.UI={$:id=>document.getElementById(id),node:(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},api:(method,arg)=>window.profileTest.call(method,arg),tabReselect:()=>{},reveal:(host,commit)=>commit()};`);
fs.writeFileSync(path.join(folder,'index.html'),'<meta charset="utf-8"><link rel="stylesheet" href="'+url('ui.css')+'"><link rel="stylesheet" href="'+url('profile-controls.css')+'"><section id="page-profiles" style="width:560px;height:500px"><div id="profiles-root"></div></section><script src="ui.js"></script><script src="'+url('measurement-fields.js')+'"></script><script src="'+url('profile-controls.js')+'"></script><script src="'+url('profiles-ui.js')+'"></script>');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:600,height:600,show:false,webPreferences:{preload:path.join(folder,'preload.cjs'),offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}}),passed=[],errors=[];
 win.webContents.on('console-message',(_,detail)=>{if(detail?.level==='error')errors.push(detail.message);});
 const js=source=>win.webContents.executeJavaScript(source,true),wait=async source=>{const deadline=Date.now()+5000;while(Date.now()<deadline){if(typeof source==='function'?source():await js(source))return;await pause(20);}throw Error('Timeout: '+source);};
 const click=selector=>js('document.querySelector('+JSON.stringify(selector)+').click()');
 const input=(selector,value)=>js('(()=>{const n=document.querySelector('+JSON.stringify(selector)+');n.value='+JSON.stringify(value)+';n.dispatchEvent(new Event("input",{bubbles:true}));})()');
 const choose=async value=>{await click('#profile-sex');await click('#profile-sex-option-'+value);};
 const visibleCount=()=>js('document.querySelectorAll("[data-measurement]:not([hidden])").length');
 const hiddenFemale=()=>js('["underbust","bust_height","bust_spacing"].every(id=>document.getElementById("measure-"+id).closest("[data-measurement]").hidden)');
 try{
  await win.loadFile(path.join(folder,'index.html'));await js('document.fonts.ready');await wait('!!document.getElementById("profile-create")');await click('[data-profile-id="'+original.id+'"]');await wait('!!document.getElementById("profile-sex")');
  assert.equal(await visibleCount(),38);assert.equal(await hiddenFemale(),true);assert(await js('!document.getElementById("measure-waist_level")&&!document.getElementById("measure-seat_length")&&!document.getElementById("measure-ankle_floor")'));
  assert.deepEqual(await js('[...document.querySelectorAll("#profile-form > .profile-row")].slice(0,5).map(row=>row.querySelector(".name-cell").textContent)'),['Имя','Пол','Возраст','Рост','Вес']);
  assert(await js('!!document.getElementById('+JSON.stringify('measure-'+custom.id)+')'));
  passed.push('Мужской профиль показывает37 действующих общих мерок и пользовательскую; скрытые исторические поля не создаются, порядок общих данных сохранён');

  await choose('female');assert.equal(await visibleCount(),41);assert.equal(await hiddenFemale(),false);
  await input('#measure-bust_height','26,5');await click('[data-measurement="bust_height"] .name-cell');await wait(()=>helpOpened.at(-1)==='bust_height');
  await js('window.retainedHeight=document.getElementById("measure-bust_height");window.retainedSex=document.getElementById("profile-sex")');const closeBefore=helpClosed;
  await choose('male');assert.equal(await visibleCount(),38);assert.equal(await hiddenFemale(),true);await wait(()=>helpClosed>closeBefore);
  assert(await js('retainedHeight===document.getElementById("measure-bust_height")&&retainedSex===document.getElementById("profile-sex")&&document.activeElement===retainedSex&&retainedHeight.value==="26,5"'));
  await choose('unspecified');assert.equal(await visibleCount(),41);assert.equal(await hiddenFemale(),false);assert.equal(await js('document.getElementById("measure-bust_height").value'),'26,5');
  passed.push('Женский и неуказанный пол показывают все40 действующих мерок; переключение не пересоздаёт поля, сохраняет черновик и фокус, закрывает прежнюю инструкцию');

  await input('#measure-bust_height','не число');await js('document.getElementById("measure-bust_height").dispatchEvent(new Event("blur"))');assert(await js('document.getElementById("profile-feedback").dataset.measurement==="bust_height"'));assert(await js('document.getElementById("profile-save").disabled'));await choose('male');assert(await js('!document.getElementById("profile-save").disabled&&!document.getElementById("profile-feedback")'));
  await input('#measure-height','180');await click('#profile-save');await wait('document.getElementById("profile-save")?.textContent==="Удалить"');
  assert.equal(store.profile().metadata.sex,'male');assert.equal(store.profile().measurements.height.value,1800);
  for(const id of ['underbust','bust_height','bust_spacing','waist_level','seat_length','ankle_floor',custom.id])assert.deepEqual(store.profile().measurements[id],savedBefore[id],id+' must survive unchanged');
  assert.deepEqual(updates.map(update=>update.measurement),['height']);
  passed.push('Неверный скрытый черновик не блокирует сохранение; обновляется только видимая изменённая мерка, старые женские и скрытые данные не затираются');

  const restored=new BodyProfiles(store.file).profile(original.id);for(const id of ['underbust','bust_height','bust_spacing','waist_level','seat_length','ankle_floor',custom.id])assert.deepEqual(restored.measurements[id],savedBefore[id]);
  await choose('female');assert.equal(await visibleCount(),41);assert.equal(await js('document.getElementById("measure-bust_height").value'),'26');await input('#measure-bust_height','28,5');await click('#profile-save');await wait('document.getElementById("profile-save")?.textContent==="Удалить"');
  assert.equal(store.profile().metadata.sex,'female');assert.equal(store.profile().measurements.bust_height.value,285);assert.equal(new BodyProfiles(store.file).profile(original.id).measurements.bust_height.value,285);
  passed.push('После перезагрузки хранилища старые значения сохранены; женскую мерку можно снова открыть, отредактировать и записать');

  await js('window.dispatchEvent(new CustomEvent("section-reselect",{detail:"profiles"}))');await wait('!!document.getElementById("profile-create")');await click('#profile-create');assert.equal(await visibleCount(),41);
  await input('#profile-name','Новый человек');await input('#measure-height','175');await choose('female');await input('#measure-bust_spacing','20');await choose('male');assert.equal(await visibleCount(),38);
  await click('#profile-save');await wait('!!document.getElementById("profile-create")');const created=store.data.profiles.find(profile=>profile.name==='Новый человек');assert(created);assert.equal(created.metadata.sex,'male');assert.equal(created.measurements.height.value,1750);assert.equal(created.measurements.bust_spacing,undefined);assert.equal(store.data.profiles.length,2);
  await click('[data-profile-id="'+created.id+'"]');await wait('!!document.getElementById("profile-sex")');assert.equal(await visibleCount(),38);await choose('unspecified');assert.equal(await visibleCount(),41);assert.equal(await js('document.getElementById("measure-bust_spacing").value'),'');
  passed.push('Новый профиль применяет ту же фильтрацию; скрытые незаписанные значения не подменяют данные и не мешают созданию');

  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,renderer_errors:errors,active_builtin_measurements:40,male_builtin_measurements:37,custom_measurements:1,computer_use:false,isolated_profiles:true,real_gpt:false,real_clo:false},null,2));app.exit(0);
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.stack,passed,renderer_errors:errors},null,2));app.exit(1);}
});
