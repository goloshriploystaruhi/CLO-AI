'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
let cached;
function executable(){
 if(cached)return cached;
 const root=path.resolve(__dirname,'..'),config=path.join(root,'.runtime.json');
 let configured;try{configured=JSON.parse(fs.readFileSync(config,'utf8')).python;}catch{}
 const candidates=[process.env.CLO_AI_PYTHON,configured,path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python')].filter(Boolean);
 for(const value of candidates)if(fs.existsSync(value))return cached=value;
 for(const [command,args]of process.platform==='win32'?[['py',['-3']],['python',[]]]:[['python3',[]],['python',[]]]){
  const result=spawnSync(command,[...args,'-c','import sys; print(sys.executable)'],{windowsHide:true,encoding:'utf8',timeout:5000});
  if(result.status===0&&result.stdout.trim())return cached=result.stdout.trim();
 }
 throw Error('Не найден Python. Установите Python 3.11+ и выполните npm run setup или задайте CLO_AI_PYTHON.');
}
module.exports={executable};
