'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'research'),{recursive:true});
const files=fs.readdirSync(path.join(root,'app')).filter(name=>name.endsWith('.test.cjs')).map(name=>path.join(root,'app',name));
if(!files.length)throw Error('Тестовые файлы не найдены.');
const result=spawnSync(process.execPath,['--test','--test-concurrency=4',...files],{cwd:root,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;process.exitCode=result.status??1;
