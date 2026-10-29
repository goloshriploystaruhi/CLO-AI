'use strict';
// Installs public dependencies only. Never reads or copies an existing account.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),sdk=path.join(root,'vendor/siwc');
const revision='0a36fefeb913055c8c7a1a29b63d82b96b2e841a';
const run=(exe,args,cwd=root)=>execFileSync(exe,args,{cwd,stdio:'inherit',windowsHide:true});
const npm=process.env.npm_execpath;
if(!npm)throw Error('Запустите установку командой npm run setup.');
fs.mkdirSync(path.dirname(sdk),{recursive:true});
if(!fs.existsSync(sdk)){
 run('git',['clone','--no-checkout','https://github.com/openai/sign-in-with-chatgpt-devkit.git',sdk]);
 run('git',['checkout','--detach',revision],sdk);
}
const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:sdk,encoding:'utf8',windowsHide:true}).trim();
if(actual!==revision)throw Error('Версия SDK отличается от проверенной. Существующие файлы оставлены без изменений.');
// Dependency metadata only: keep upstream OAuth source unchanged and pin the
// patched HTTP dependency. The DevKit's own license remains in force.
const manifestPath=path.join(sdk,'package.json'),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.overrides={...manifest.overrides,undici:'7.30.1'};
manifest.cloAiModificationNotice='CLO AI: dependency metadata updated to pin undici 7.30.1; OAuth source unchanged. Original DevKit license applies.';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
run(process.execPath,[npm,'install','--package-lock-only','--ignore-scripts','--include=dev'],sdk);
run(process.execPath,[npm,'ci','--include=dev'],sdk);
const electron=path.join(sdk,'node_modules/electron');
const binary=path.join(electron,'dist',process.platform==='win32'?'electron.exe':'electron');
if(!fs.existsSync(binary))run(process.execPath,[path.join(electron,'install.js')],sdk);
if(!fs.existsSync(binary))throw Error('Не загружен Electron. Проверьте доступ к GitHub Releases и настройки ELECTRON_SKIP_BINARY_DOWNLOAD.');
run(process.execPath,[npm,'run','build','-w','@siwc/local'],sdk);
const systemPython=require('../app/python-runtime.cjs').executable();
if(!fs.existsSync(path.join(root,'.venv')))run(systemPython,['-m','venv',path.join(root,'.venv')]);
const python=path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
run(python,['-m','pip','install','-r',path.join(root,'requirements.txt')]);
run(python,['-m','pip','install','-r',path.join(root,'requirements-dev.txt')]);
fs.mkdirSync(path.join(root,'research'),{recursive:true});
if(process.platform==='win32')run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'launcher/Build-Launcher.ps1')]);
console.log('Готово. В Windows откройте CLO AI.exe в папке проекта или выполните npm start.');
