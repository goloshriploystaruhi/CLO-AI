// Main-process completion signals. No request text, body measurements or paths
// are exposed in an OS notification. Preparation/queueing is not completion.
const path=require('node:path'),fs=require('node:fs');
const {APP_ID}=require('./windows-identity.cjs');
const CHANNEL='completion-attention',TOAST_CLSID='{5B735E8A-6F7D-40F0-9163-9C4C83246FC8}';
const messages=Object.freeze({
 reply:{title:'Ответ готов',body:'CLO AI закончил ответ. Открой чат, чтобы продолжить.'},
 question:{title:'Нужен твой ответ',body:'CLO AI подготовил уточнение. Открой чат, чтобы продолжить.'},
 review:{title:'Проверь результат',body:'CLO AI закончил проверку. В чате есть замечания.'},
 confirmed:{title:'Операция завершена',body:'CLO подтвердил результат. Он доступен в проекте и в чате.'},
 confirmation:{title:'Нужно подтверждение',body:'Изменение подготовлено. Вернись в CLO AI, чтобы проверить и подтвердить его.'}
});
function responseKind(result){
 if(!result||result.cancelled||result.error)return null;
 if(result.qa_report?.valid===false)return 'review';
 if(result.message)return result.needs_input||result.question?.actions?.some(a=>a.active)?'question':'reply';
 if(result.id&&(result.replace_target||result.replace_targets?.length||result.operation==='delete'))return 'confirmation';
 return null;
}
function nativeKind(result,summary){
 if(!result||result.cancelled||result.error)return null;
 if(summary?.kind==='success')return 'confirmed';
 if(result.assembly&&summary?.kind==='assistant')return 'review';
 return null;
}
function create({window,Notification,isCurrent=()=>true,getFocusedWindow=()=>null,onFailure=()=>{}}){
 const seen=new Set();let disposed=false,toast=null;
 const safely=fn=>{try{return fn();}catch(error){try{onFailure(error);}catch{}return undefined;}};
 function alive(){return !disposed&&window&&!window.isDestroyed();}
 function active(){
  if(!alive()||window.isMinimized()||!window.isVisible())return false;
  if(window.isFocused())return true;
  for(let focused=getFocusedWindow();focused;focused=focused.getParentWindow?.())if(focused===window)return true;
  return false;
 }
 function send(play){safely(()=>{if(alive()&&!window.webContents.isDestroyed())window.webContents.send(CHANNEL,{play});});}
 function acknowledge(){safely(()=>{if(alive())window.flashFrame(false);});send(false);const old=toast;toast=null;safely(()=>old?.close());}
 function reset(){seen.clear();acknowledge();}
 function complete({id,ticket,kind}){
  // Bounded, per-session IDs also cover simultaneous result IPC deliveries.
  if(!alive()||typeof id!=='string'||!id||id.length>200||!messages[kind]||!safely(()=>isCurrent(ticket)))return false;
  const key=ticket?.session_id+':'+id;if(seen.has(key))return false;seen.add(key);if(seen.size>256)seen.delete(seen.values().next().value);
  if(safely(active)!==false)return false;
  safely(()=>window.flashFrame(true));send(true);
  const old=toast;toast=null;safely(()=>old?.close());
  safely(()=>{if(!Notification?.isSupported())return;
   const current=new Notification({title:'CLO AI · '+messages[kind].title,body:messages[kind].body,icon:path.join(__dirname,'assets','clo-ai-icon.png'),silent:true,timeoutType:'default'});toast=current;
   current.on('failed',(_,error)=>{if(toast===current)toast=null;try{onFailure(Error(String(error||'Уведомление Windows недоступно')));}catch{}});
   current.on('close',()=>{if(toast===current)toast=null;});
   current.on('click',()=>{if(!alive()||!safely(()=>isCurrent(ticket)))return;acknowledge();safely(()=>{if(window.isMinimized())window.restore();window.show();window.focus();window.webContents.send('completion-open-chat');});});
   current.show();
  });return true;
 }
 function dispose(){if(disposed)return;acknowledge();seen.clear();disposed=true;window.removeListener('focus',acknowledge);window.removeListener('closed',dispose);}
 window.on('focus',acknowledge);window.once('closed',dispose);
 return {complete,acknowledge,reset,dispose,active};
}
// Electron's Windows toast identity needs a Start Menu shortcut. Use the same
// identity and launcher as the taskbar window; never overwrite another app's shortcut.
function registerShortcut({platform=process.platform,appData,execPath=process.execPath,entry=path.join(__dirname,'main.cjs'),shell,fileSystem=fs}){
 if(platform!=='win32')return {registered:false,reason:'platform'};
 const directory=path.join(appData,'Microsoft','Windows','Start Menu','Programs'),file=path.join(directory,'CLO AI.lnk');
 const details={...require('./windows-identity.cjs').launchDetails({execPath,entry,fileSystem}),description:'CLO AI',icon:path.join(__dirname,'assets','clo-ai.ico'),iconIndex:0,appUserModelId:APP_ID,toastActivatorClsid:TOAST_CLSID};
 try{
  const exists=fileSystem.existsSync(file);if(exists){const old=shell.readShortcutLink(file),legacy=require('./windows-identity.cjs').ownsLegacyShortcut(old,{entry});if(old.appUserModelId!==APP_ID&&!legacy)return {registered:false,reason:'existing-shortcut'};if(Object.keys(details).every(k=>k==='toastActivatorClsid'?String(old[k]).toUpperCase()===details[k]:old[k]===details[k]))return {registered:true,changed:false};
   // Old Windows-generated links used the branded child with empty args.
   // Only a proven link into this installation is migrated, with a backup.
   const backup=file+'.pre-standalone.bak';if(legacy&&typeof fileSystem.copyFileSync==='function'&&!fileSystem.existsSync(backup))fileSystem.copyFileSync(file,backup);
  }
  fileSystem.mkdirSync(directory,{recursive:true});return {registered:!!shell.writeShortcutLink(file,exists?'update':'create',details),changed:true};
 }catch{return {registered:false,reason:'unavailable'};}
}
module.exports={create,registerShortcut,responseKind,nativeKind,CHANNEL,APP_ID,TOAST_CLSID};
