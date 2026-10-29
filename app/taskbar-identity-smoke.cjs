// Native taskbar-property probe only. Never starts main.cjs or opens user data.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const folder=process.argv[2];
if(!folder||!path.isAbsolute(folder)||!fs.existsSync(folder))throw Error('Нужна изолированная папка проверки');
app.setPath('userData',path.join(folder,'electron'));
app.disableHardwareAcceleration();
app.whenReady().then(()=>{
 const window=new BrowserWindow({show:false,width:600,height:600,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 try{
  require('./windows-identity.cjs').apply(window,{platform:'win32',entry:path.join(__dirname,'main.cjs'),execPath:process.execPath});
  const handle=window.getNativeWindowHandle(),hwnd=(handle.length===8?handle.readBigUInt64LE():BigInt(handle.readUInt32LE())).toString();
  fs.writeFileSync(path.join(folder,'ready.json'),JSON.stringify({hwnd,pid:process.pid,visible:window.isVisible(),expected_launcher:path.join(__dirname,'../CLO AI.exe'),expected_icon:path.join(__dirname,'assets/clo-ai.ico')}));
  const started=Date.now(),timer=setInterval(()=>{if(fs.existsSync(path.join(folder,'done'))){clearInterval(timer);window.destroy();app.quit();}else if(Date.now()-started>20000){clearInterval(timer);fs.writeFileSync(path.join(folder,'error.txt'),'Истекло время чтения нативных свойств');window.destroy();app.exit(1);}},50);
 }catch(error){fs.writeFileSync(path.join(folder,'error.txt'),error.stack);window.destroy();app.exit(1);}
});
