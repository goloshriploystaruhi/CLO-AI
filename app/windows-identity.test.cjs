const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const identity=require('./windows-identity.cjs'),attention=require('./completion-attention.cjs');
const entry=path.resolve('research/пробелы & символы/app/main.cjs'),root=path.dirname(path.dirname(entry)),launcher=path.join(root,'CLO AI.exe'),runtime=path.join(root,'vendor/electron.exe');
test('Windows window gets native taskbar branding and a safely quoted real launcher',()=>{
 const calls=[],window={setIcon:value=>calls.push(['icon',value]),setAppDetails:value=>calls.push(['details',value])};
 assert(identity.apply(window,{platform:'win32',entry,execPath:runtime,fileSystem:{existsSync:file=>file===launcher}}));
 const actual=calls[1][1];assert.equal(actual.appId,attention.APP_ID);assert.equal(actual.relaunchDisplayName,'CLO AI');assert.equal(actual.relaunchCommand,'"'+launcher+'"');assert.equal(actual.appIconIndex,0);assert.equal(calls[0][1],actual.appIconPath);assert(fs.existsSync(actual.appIconPath));
 assert.equal(identity.apply({}, {platform:'linux'}),false);
});
test('developer fallback preserves the same runtime and entry without changing authentication storage',()=>{
 const properties=identity.details({entry,execPath:runtime,fileSystem:{existsSync:()=>false}});assert.equal(properties.relaunchCommand,'"'+runtime+'" "'+entry+'"');assert.equal(properties.relaunchDisplayName,'CLO AI');
 assert.throws(()=>identity.details({entry,execPath:'invalid"path',fileSystem:{existsSync:()=>false}}),/Некорректный путь/);
});
test('owned Start Menu links migrate from Electron to CLO AI and subsequent launches are idempotent',()=>{
 let old={target:runtime,args:'"'+entry+'"',appUserModelId:identity.APP_ID},writes=[],exists=true;
 const fileSystem={existsSync:file=>file===launcher||exists,mkdirSync:()=>{}},shell={readShortcutLink:()=>old,writeShortcutLink:(file,operation,value)=>{writes.push({file,operation,value});old={...value};return true;}};
 const args={platform:'win32',appData:root,entry,execPath:runtime,fileSystem,shell};
 assert.deepEqual(attention.registerShortcut(args),{registered:true,changed:true});assert.equal(writes[0].operation,'update');assert.equal(writes[0].value.target,launcher);assert.equal(writes[0].value.args,'');assert.equal(writes[0].value.appUserModelId,identity.APP_ID);assert.equal(writes[0].value.toastActivatorClsid,attention.TOAST_CLSID);
 assert.deepEqual(attention.registerShortcut(args),{registered:true,changed:false});assert.equal(writes.length,1);
 old={appUserModelId:'unrelated'};assert.equal(attention.registerShortcut(args).reason,'existing-shortcut');assert.equal(writes.length,1);
});
test('main window taskbar identity is assigned before its first show and keeps the existing UI',()=>{
 const source=fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8'),start=source.indexOf(' const win=new BrowserWindow'),tail=source.slice(start);
 assert.match(tail,/show:false/);assert(tail.indexOf("require('./windows-identity.cjs').apply(win)")<tail.indexOf("win.once('ready-to-show'"));assert.match(tail,/ready-to-show',\(\)=>win.show\(\)/);assert.match(tail,/registerShortcut/);
});
test('a no-argument legacy child shortcut is migrated only for this installation and backed up',()=>{
 const child=path.join(root,'vendor','siwc','node_modules','electron','dist','CLO AI-3becca74f5b95b47fe37.exe');
 let old={target:child,args:'',description:'CLO AI',appUserModelId:'legacy-generated'},writes=[],backups=[];
 const fileSystem={existsSync:file=>file===launcher||file.endsWith('.lnk'),mkdirSync(){},copyFileSync:(from,to)=>backups.push([from,to])};
 const shell={readShortcutLink:()=>old,writeShortcutLink:(file,op,value)=>{writes.push(value);old=value;return true;}};
 assert(identity.ownsLegacyShortcut(old,{entry}));
 const result=attention.registerShortcut({platform:'win32',appData:root,entry,shell,fileSystem});assert(result.changed);assert.equal(writes[0].target,launcher);assert.equal(writes[0].args,'');assert.equal(backups.length,1);
 for(const target of [path.join(root,'elsewhere',path.basename(child)),child.replace('CLO AI-','Unrelated-')])assert(!identity.ownsLegacyShortcut({target,args:'',description:'CLO AI'},{entry}));
 assert(!identity.ownsLegacyShortcut({target:child,args:'',description:'Unrelated'},{entry}));
 assert(!identity.ownsLegacyShortcut({target:child,args:'other-app',description:'CLO AI'},{entry}));
});
