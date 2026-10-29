// Native Electron window checks; hidden windows, no network, user data or computer use.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../research/window-pin-checks');fs.mkdirSync(output,{recursive:true});
const isolated=fs.mkdtempSync(path.join(__dirname,'../research/window-pin-'));app.setPath('userData',path.join(isolated,'electron'));app.disableHardwareAcceleration();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const wait=async(predicate,label)=>{const deadline=Date.now()+2500;while(Date.now()<deadline){if(predicate())return;await pause(20);}throw Error('Timeout: '+label);};
app.whenReady().then(async()=>{
 const win=new BrowserWindow({...require('./window-config.cjs'),show:false,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true}}),passed=[];
 // Some platforms show a hidden native window during restore. Keep this
 // isolated test window hidden before it can paint or take focus.
 win.on('show',()=>win.hide());
 try{
  assert.equal(win.isVisible(),false);
  assert.equal(win.isAlwaysOnTop(),true);assert.equal(win.isMovable(),true);assert.equal(win.isMinimizable(),true);assert.equal(win.isClosable(),true);
  assert.equal(win.isResizable(),false);assert.equal(win.isMaximizable(),false);assert.equal(win.isFullScreenable(),false);
  passed.push('Главное окно закреплено поверх обычных окон; перемещение, сворачивание и закрытие разрешены');
  const before=win.getBounds();win.setPosition(before.x+20,before.y+20,false);const after=win.getBounds();assert.equal(after.x,before.x+20);assert.equal(after.y,before.y+20);assert.equal(win.isAlwaysOnTop(),true);
  passed.push('Перемещение меняет координаты, сохраняя закрепление окна');
  win.minimize();await wait(()=>win.isMinimized(),'minimize');assert.equal(win.isAlwaysOnTop(),true);
  win.restore();await wait(()=>!win.isMinimized(),'restore');assert.equal(win.isAlwaysOnTop(),true);win.hide();assert.equal(win.isVisible(),false);
  passed.push('Сворачивание и восстановление сохраняют закрепление');
  win.close();await wait(()=>win.isDestroyed(),'close');passed.push('Закрытие остаётся доступным');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,hidden_window:true,computer_use:false,real_gpt:false,real_clo:false},null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.stack,passed},null,2));if(!win.isDestroyed())win.destroy();app.exit(1);}
});
