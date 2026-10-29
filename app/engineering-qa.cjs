const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
function worker(request){if(request.garment?.method==='parametric_design_v1')return require('./pattern-design.cjs').worker(request);return new Promise((resolve,reject)=>{
 const python=require('./python-runtime.cjs').executable();
 const child=spawn(python,[path.join(__dirname,'..','garment_engine.py')],{windowsHide:true,env:{...process.env,PYTHONIOENCODING:'utf-8'},stdio:['pipe','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>{child.kill();reject(Error('Превышено время проверки конструкции'));},45000);
 child.stdout.on('data',d=>{out+=d;if(out.length>16000000){child.kill();reject(Error('Слишком большой отчёт'));}});child.stderr.on('data',d=>err+=d);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',()=>{clearTimeout(timer);try{const r=JSON.parse(out);if(r.error)reject(Error(r.error));else resolve(r);}catch{reject(Error('Не удалось прочитать отчёт проверки: '+err.slice(-500)));}});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(request));
});}
function readable(r){
 const lines=[r.valid?'Проверки пройдены.':'Обнаружены ошибки.',r.method?.name||'',...(r.quality?.labels||[]),
  'Проверено соответствие экспериментальному алгоритму. Профессиональный стандарт и посадка не подтверждены.','',
  ...r.issues.map(e=>e.piece+' / '+e.section+': '+e.message),...(r.warnings||[]).map(e=>e.message),
  '',...(r.parts||[]).map(p=>{const b=p.geometry.seam_contour;return p.name+(b?' — '+b.width_mm.toFixed(2)+' × '+b.height_mm.toFixed(2)+' мм':' — контур не прошёл проверку');}),
  '',...(r.assembly?.links||[]).map(l=>l.ends.map(e=>e.name+' ['+e.segment_ids.map(s=>s.split('/').at(-1)).join(', ')+']: '+e.length_mm.toFixed(3)+' мм').join(' ↔ ')+'; посадка '+l.ease_mm.toFixed(3)+'; невязка '+l.residual_mm.toFixed(3)+'; допуск '+l.tolerance_mm+' мм'),
  '',...(r.fit?.level_A?.risks||[]),...(r.fit?.level_B?.instructions||[]),
  '',r.native_export?.note||'Фактические измерения CLO ещё не получены.'];
 return lines.filter(x=>x!==undefined).join('\n');
}
function writeReports(store,g){
 if(!g.qa_report)return;
 if(!/^[\w-]+$/.test(g.id)||!Number.isSafeInteger(g.version)||g.version<1)throw Error('Некорректный идентификатор отчёта');
 const folder=path.join(path.dirname(store.file),'garments',g.id);fs.mkdirSync(folder,{recursive:true});
 const prefix=path.join(folder,'v'+g.version+'-qa');fs.writeFileSync(prefix+'.json',JSON.stringify(g.qa_report,null,2));
 const table=g.qa_report;const detailed=readable(table)+'\n\nМерки и параметры:\n'+JSON.stringify({profile:g.profile_id,measurements:g.measurement_snapshot,parameters:g.parameters,method:table.method},null,2);
 fs.writeFileSync(prefix+'.md','# Отчёт по изделию «'+g.name+'»\n\n'+detailed+'\n');
 fs.appendFileSync(path.join(folder,'qa-journal.jsonl'),JSON.stringify({at:new Date().toISOString(),version:g.version,valid:g.qa_report.valid,
  statuses:g.qa_report.quality?.statuses,geometry_fingerprint:g.qa_report.quality?.geometry_fingerprint,evidence:g.qa_report.quality?.evidence})+'\n');
 return {json:prefix+'.json',markdown:prefix+'.md'};
}
async function check(store,query){const g=store.find(query),r=await worker({operation:'qa',garment:g});
 // Preserve separately collected native evidence only for this unchanged version.
 if(typeof g.qa_report?.quality?.geometry_fingerprint==='string'&&g.qa_report.quality.geometry_fingerprint===r.qa_report.quality?.geometry_fingerprint&&typeof g.qa_report.native_export?.status==='string'&&g.qa_report.native_export.status!=='not_measured')r.qa_report.native_export=g.qa_report.native_export;
 g.qa_report=r.qa_report;g.quality_status=r.qa_report.quality;store.save();const files=writeReports(store,g);return {...r,text:readable(r.qa_report),files};}
async function review(store,args){
 if(args?.confirmed!==true||!['clo_3d','physical'].includes(args.method)||typeof args.notes!=='string'||args.notes.trim().length<10||args.notes.length>8000)throw Error('Подтвердите фактическую примерку и опишите наблюдения (10–8000 знаков)');
 const g=store.find(args.query),r=await check(store,g.id);
 if(args.version!==g.version||args.fingerprint!==r.qa_report.quality?.geometry_fingerprint)throw Error('Конструкция изменилась. Откройте актуальный отчёт и повторите подтверждение');
 if(!r.qa_report.valid)throw Error('Сначала устраните ошибки конструкции');
 g.fit_review={version:g.version,geometry_fingerprint:args.fingerprint,method:args.method,notes:args.notes.trim(),at:new Date().toISOString(),source:'explicit_user_attestation'};
 store.save();return check(store,g.id);
}
module.exports={worker,readable,writeReports,check,review};
