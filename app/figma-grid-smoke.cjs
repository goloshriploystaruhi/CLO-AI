// Inspect the real renderer against CLO.fig / MVP, with isolated transport/data.
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../research/figma-grid-checks');fs.mkdirSync(output,{recursive:true});const folder=fs.mkdtempSync(path.join(output,'session-'));app.setPath('userData',path.join(folder,'electron'));app.disableHardwareAcceleration();
const profiles=new(require('./body-profiles.cjs').BodyProfiles)(path.join(folder,'profiles.json'));profiles.create({name:'Тестовый профиль'});
let sharing=false,connected=false;const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
ipcMain.handle('call',(_,method,arg)=>{
 if(method==='session')return {sharing,status:sharing?'connected':'disconnected'};
 if(method==='signin'){sharing=true;return {sharing,status:'connected'};}
 if(method==='bridge')return {connected,version:3};
 if(method==='project-state')return {available:connected,session_id:'grid',name:'Изолированная проверка',part_count:0};
 if(method==='models')return [{slug:'test-model'}];
 if(method==='profiles')return profiles.tool(arg.action,arg.args);
 if(method==='chat-history')return [];
 if(method==='dialogue-status')return {questions:[]};
 if(['measurement-help-close','bridge-command','copy-text'].includes(method))return {};
 throw Error('Неожиданный IPC: '+method);
});
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:600,height:600,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}}),errors=[],checks=[];
 const js=code=>win.webContents.executeJavaScript(code,true),wait=async code=>{const deadline=Date.now()+5000;while(Date.now()<deadline){if(await js(code))return;await pause(20);}throw Error('Timeout: '+code);},near=(a,b)=>assert(Math.abs(a-b)<1,JSON.stringify({actual:a,expected:b}));
 win.webContents.on('console-message',(_,detail)=>{if(detail?.level==='error')errors.push(detail.message);});
 try{
 for(const [width,height]of [[598,569],[584,561]]){
  win.setContentSize(width,height);sharing=false;connected=false;await win.loadFile(path.join(__dirname,'index.html'));await js('document.fonts.ready');await wait('!document.getElementById("auth-connect").disabled');await pause(240);
  const sample=selector=>js(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontSize,line:s.lineHeight,tracking:s.letterSpacing,color:s.color,background:s.backgroundColor};})()`),row=(height-29)/12;
  const theme=await js('(()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(["--primary","--secondary","--accent","--inactive","--border","--background"].map(k=>[k,s.getPropertyValue(k).trim()]));})()');assert.deepEqual(theme,{'--primary':'#e5e5e5','--secondary':'#7f7f7f','--accent':'#e08e62','--inactive':'#333333','--border':'#191919','--background':'#060606'});
  const auth=await sample('#auth-connect');near(auth.x,20);near(auth.y,8*row);assert.equal(auth.font,'48px');assert.equal(auth.line,'48px');assert.equal(auth.tracking,'-1.92px');
  await js('document.getElementById("auth-connect").click()');await wait('!document.getElementById("bridge-screen").hidden');const guide=await sample('#bridge-guide'),copy=await sample('#bridge-copy');near(guide.y,row);near(guide.height,6*row);near(copy.y,8*row);near(guide.width,width-40);
  connected=true;await js('window.dispatchEvent(new Event("focus"))');await wait('!document.getElementById("workspace").hidden');await pause(300);
  const nav=await sample('.tabs'),input=await sample('#composer'),footer=await sample('.composer-actions');near(nav.y,row);near(input.y,7*row);near(footer.y+footer.height,12*row);near(input.width,width-40);
  await js('document.getElementById("tab-profiles").click()');await pause(310);await wait('!!document.getElementById("profile-create")');const create=await sample('#profile-create'),names=await sample('[data-profile-id]'),reauth=await sample('.profile-footer');near(create.y,3*row);near(names.y,5*row);near(reauth.y,11*row);
  await js('document.getElementById("profile-create").click()');await wait('!!document.getElementById("profile-form")');await pause(300);const table=await sample('#profile-form > .profile-row'),label=await sample('.profile-row .name-cell'),value=await sample('#profile-name'),action=await sample('.name-action');near(table.y,3*row);near(value.x,20+(width-40)/3);near(action.x,20+2*(width-40)/3);near((await sample('.profile-row')).height,38);assert.equal(label.font,'16px');assert.equal(label.line,'20px');assert.equal(label.tracking,'0.32px');assert.equal(await js('getComputedStyle(document.querySelector(".profile-footer")).display'),'none');
  assert.equal(await js('document.documentElement.scrollWidth>innerWidth'),false);checks.push({viewport:{width,height},row,theme,auth,guide,copy,nav,input,footer,create,names,table,label,value,action});
  fs.writeFileSync(path.join(output,`profile-${width}.png`),(await win.webContents.capturePage()).toPNG());
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,computer_use:false,real_gpt:false,real_clo:false,renderer_errors:errors,checks},null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.stack,checks,renderer_errors:errors},null,2));fs.writeFileSync(path.join(output,'failure.png'),(await win.webContents.capturePage()).toPNG());app.exit(1);}
});
