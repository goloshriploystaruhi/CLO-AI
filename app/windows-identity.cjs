// Window properties complement the branded runtime PE prepared by Launcher.cs.
// Explorer may also resolve the executable's embedded name and icon.
const path=require('node:path'),fs=require('node:fs');
const APP_ID='clo-ai',NAME='CLO AI';
function quote(value){if(typeof value!=='string'||/["\0\r\n]/.test(value))throw Error('Некорректный путь запуска CLO AI');return '"'+value+'"';}
function launchDetails({entry=path.join(__dirname,'main.cjs'),execPath=process.execPath,fileSystem=fs}={}){
 const cwd=path.dirname(path.dirname(entry)),launcher=path.join(cwd,'CLO AI.exe'),available=fileSystem.existsSync(launcher);
 return {target:available?launcher:execPath,args:available?'':quote(entry),cwd};
}
function details(options={}){
 const launch=launchDetails(options);
 return {appId:APP_ID,appIconPath:path.join(__dirname,'assets','clo-ai.ico'),appIconIndex:0,relaunchCommand:quote(launch.target)+(launch.args?' '+launch.args:''),relaunchDisplayName:NAME};
}
function ownsLegacyShortcut(shortcut,{entry=path.join(__dirname,'main.cjs')}={}){
 const root=path.dirname(path.dirname(entry)),distribution=path.join(root,'vendor','siwc','node_modules','electron','dist');
 const canonical=value=>typeof value==='string'?path.resolve(value).toLowerCase():'';
 return shortcut?.description===NAME&&/^(?:CLO AI-[a-f0-9]{20}|CLO AI)\.exe$/i.test(path.basename(shortcut.target||''))&&canonical(path.dirname(shortcut.target||''))===canonical(distribution)&&!String(shortcut.args||'').trim();
}
function apply(window,{platform=process.platform,...options}={}){
 if(platform!=='win32')return false;
 const properties=details(options);window.setIcon(properties.appIconPath);window.setAppDetails(properties);return true;
}
module.exports={APP_ID,NAME,launchDetails,details,apply,ownsLegacyShortcut};
