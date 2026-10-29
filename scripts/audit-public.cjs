'use strict';
// Inspect the exact Git index, including all binary paths, before publication.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),entries=execFileSync('git',['ls-files','-s','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).map(row=>{const match=row.match(/^\d+ ([a-f0-9]+) 0\t([\s\S]+)$/);if(!match)throw Error('Неразрешённый конфликт в индексе');return {hash:match[1],name:match[2]};}),names=entries.map(row=>row.name),issues=[];
if(!names.length)throw Error('Индекс пуст. Сначала подготовьте файлы через git add.');
const forbidden=/^(?:vendor|node_modules|\.venv|projects|garments)\/|\.(?:zprj|zpac|avt|avte|fig|exe|dll|zip|log)$/i;
const secrets=/(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const blobs=execFileSync('git',['cat-file','--batch'],{cwd:root,input:entries.map(row=>row.hash).join('\n')+'\n',maxBuffer:32*1024*1024});let offset=0;
for(const {name} of entries){
 if(forbidden.test(name)||/(?:^|\/)(?:chatgpt-auth|body-profiles|conversation|construction-memory|pattern-work-orders)\.json$/.test(name))issues.push(name+': файл личных данных или сборочный артефакт');
 const newline=blobs.indexOf(10,offset),header=blobs.subarray(offset,newline).toString('ascii'),size=Number(header.split(' ')[2]);if(newline<0||!Number.isSafeInteger(size))throw Error('Не удалось прочитать Git blob');const data=blobs.subarray(newline+1,newline+1+size);offset=newline+1+size+1;if(data.includes(0))continue;
 const text=data.toString('utf8');if(secrets.test(text))issues.push(name+': похожее на секрет значение');
 const home=require('node:os').homedir();if(text.includes(home)||text.includes(home.replaceAll('\\','/')))issues.push(name+': абсолютный путь текущего пользователя');
}
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else console.log('Проверено файлов: '+names.length+'. Личные пути, известные форматы секретов и пользовательские артефакты не найдены. Проверка не заменяет ревью содержимого.');
