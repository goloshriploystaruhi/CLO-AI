'use strict';
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'vendor/siwc/node_modules/electron/dist');
const executable=process.platform==='win32'?path.join(dist,'electron.exe'):path.join(dist,'electron');
if(!fs.existsSync(executable))throw Error('Сначала выполните npm run setup. Основная проверенная платформа — Windows.');
const child=spawn(executable,[path.join(root,'app/main.cjs')],{cwd:root,stdio:'inherit',windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',code=>process.exit(code||0));
