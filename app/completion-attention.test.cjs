const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const attention=require('./completion-attention.cjs');
function setup({focused=false,minimized=false,visible=true,supported=true,failToast=false,failSound=false}={}){
 const calls=[],toasts=[],win=new EventEmitter();let current=true,child=null;
 Object.assign(win,{isDestroyed:()=>false,isFocused:()=>focused,isMinimized:()=>minimized,isVisible:()=>visible,flashFrame:value=>calls.push(['flash',value]),restore:()=>{minimized=false;calls.push(['restore']);},show:()=>calls.push(['show']),focus:()=>{focused=true;win.emit('focus');calls.push(['focus']);},webContents:{isDestroyed:()=>false,send:(...args)=>{if(failSound)throw Error('renderer unavailable');calls.push(args);}}});
 class Toast extends EventEmitter{static isSupported(){return supported;}constructor(options){super();if(failToast)throw Error('notifications disabled');this.options=options;toasts.push(this);}show(){calls.push(['toast']);}close(){this.emit('close');calls.push(['close']);}}
 const controller=attention.create({window:win,Notification:Toast,isCurrent:()=>current,getFocusedWindow:()=>child,onFailure:error=>calls.push(['failure',error.message])}),ticket={session_id:'session'};
 return {calls,toasts,controller,win,ticket,done:(id='one',kind='confirmed')=>controller.complete({id,ticket,kind}),setFocused:value=>focused=value,setCurrent:value=>current=value,setChild:value=>child=value};
}
test('inactive and minimized completions flash once, use a private silent toast and a single custom cue',()=>{
 for(const options of [{},{minimized:true},{visible:false}]){const s=setup(options);assert(s.done());assert(!s.done());assert.equal(s.calls.filter(c=>c[0]==='flash'&&c[1]).length,1);assert.equal(s.calls.filter(c=>c[0]===attention.CHANNEL&&c[1].play).length,1);assert.equal(s.toasts.length,1);assert.equal(s.toasts[0].options.silent,true);assert.match(s.toasts[0].options.title,/Операция завершена/);assert(!s.calls.some(c=>['show','restore','focus'].includes(c[0])));s.controller.dispose();}
});
test('completion while focused stays silent even if the app loses focus before a duplicate result',()=>{
 const s=setup({focused:true});assert.equal(s.done(),false);assert.deepEqual(s.calls,[]);s.setFocused(false);assert.equal(s.done(),false);s.controller.dispose();
});
test('the measurement child window counts as app focus',()=>{
 const s=setup();s.setChild({getParentWindow:()=>s.win});assert(s.controller.active());assert(!s.done());assert.deepEqual(s.calls,[]);s.controller.dispose();
});
test('focus acknowledges attention; clicking a current toast restores minimized window and opens chat',()=>{
 const s=setup({minimized:true});s.done();s.toasts[0].emit('click');assert(s.calls.some(c=>c[0]==='restore'));assert(s.calls.some(c=>c[0]==='completion-open-chat'));assert(s.calls.some(c=>c[0]==='flash'&&c[1]===false));assert(s.calls.some(c=>c[0]===attention.CHANNEL&&c[1].play===false));assert.equal(s.controller.active(),true);s.controller.dispose();assert.equal(s.win.listenerCount('focus'),0);assert.equal(s.win.listenerCount('closed'),0);
});
test('old project completion and toast clicks are ignored; reset closes pending notification',()=>{
 const s=setup();s.done();s.setCurrent(false);assert(!s.done('late'));const before=s.calls.length;s.toasts[0].emit('click');assert.equal(s.calls.length,before);s.controller.reset();assert(s.calls.some(c=>c[0]==='close'));s.setCurrent(true);assert(s.done());s.controller.dispose();assert(!s.done('closed'));
});
test('desktop notifications or audio failure never prevent the taskbar fallback or escape to the caller',()=>{
 for(const options of [{supported:false},{failToast:true},{failSound:true}]){const s=setup(options);assert(s.done());assert(s.calls.some(c=>c[0]==='flash'&&c[1]));s.controller.dispose();}
 const s=setup();s.done();assert.doesNotThrow(()=>s.toasts[0].emit('failed',{},'Windows notifications disabled'));s.controller.dispose();
});
test('classification distinguishes response, request for input and native success from preparation and errors',()=>{
 assert.equal(attention.responseKind({message:'Ответ'}),'reply');assert.equal(attention.responseKind({message:'Уточнение',needs_input:true}),'question');assert.equal(attention.responseKind({message:'План',question:{actions:[{active:true}]}}),'question');assert.equal(attention.responseKind({message:'Проверка',qa_report:{valid:false}}),'review');assert.equal(attention.responseKind({id:'prepared',patterns:[{}]}),null);assert.equal(attention.responseKind({id:'prepared',replace_targets:[{}]}),'confirmation');
 for(const bad of [{cancelled:true},{error:'Сбой'},null]){assert.equal(attention.responseKind(bad),null);assert.equal(attention.nativeKind(bad,{kind:'success'}),null);}
 assert.equal(attention.nativeKind({patterns:[{}]},{kind:'success'}),'confirmed');assert.equal(attention.nativeKind({},{kind:'error'}),null);assert.equal(attention.nativeKind({assembly:{}},{kind:'assistant'}),'review');
});
test('shortcut identity uses the same runtime/entry, is idempotent and never overwrites unrelated links',()=>{
 const calls=[],p=require('node:path'),files={existsSync:()=>false,mkdirSync:(...args)=>calls.push(['mkdir',...args])},shell={writeShortcutLink:(...args)=>{calls.push(['write',...args]);return true;}},args={platform:'win32',appData:'C:/isolated',execPath:'C:/runtime/electron.exe',entry:'C:/project/app/main.cjs',shell,fileSystem:files};
 assert(attention.registerShortcut(args).registered);const details=calls.find(c=>c[0]==='write')[3];assert.equal(details.target,args.execPath);assert.equal(details.args,'"'+args.entry+'"');assert.equal(details.appUserModelId,'clo-ai');assert.equal(details.toastActivatorClsid,attention.TOAST_CLSID);assert.equal(details.cwd,p.dirname(p.dirname(args.entry)));
 files.existsSync=file=>file.endsWith('.lnk');shell.readShortcutLink=()=>({...details});calls.length=0;assert.deepEqual(attention.registerShortcut(args),{registered:true,changed:false});assert.deepEqual(calls,[]);
 shell.readShortcutLink=()=>({appUserModelId:'someone-else'});assert.equal(attention.registerShortcut(args).reason,'existing-shortcut');assert.deepEqual(calls,[]);
 assert.equal(attention.registerShortcut({...args,platform:'linux'}).reason,'platform');
});
