// A receipt may repair local metadata after a disconnect/restart. It never
// dispatches or repeats a CLO operation. Every native target must still match.
const fs=require('node:fs'),path=require('node:path'),{writeJSON}=require('./atomic-json.cjs');
const attempts=new WeakMap(),safeID=id=>typeof id==='string'&&/^[\w-]{1,150}$/.test(id);
function folder(conversation){return path.dirname(path.dirname(conversation.file));}
function file(conversation,id){if(!safeID(id))throw Error('Некорректный идентификатор операции CLO');return path.join(folder(conversation),'native-jobs',id+'.json');}
function read(file){try{if(fs.statSync(file).size>16*1024*1024)return null;return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
function queue(conversation,job){
 if(job.project_ticket?.session_id!==path.basename(conversation.file,'.json')||job.project_ticket?.project_id!==path.basename(folder(conversation)))throw Error('Операция относится к другому проекту');
 const target=file(conversation,job.id),old=read(target);
 if(old){if(JSON.stringify(old.job)!==JSON.stringify(job))throw Error('Идентификатор операции CLO уже использован');return;}
 writeJSON(target,{version:1,job,queued_at:new Date().toISOString(),completed:false});
}
function complete(conversation,id){const target=file(conversation,id),entry=read(target);if(!entry||entry.completed)return;writeJSON(target,{...entry,completed:true,completed_at:new Date().toISOString()});}
function verified(runtime,job,result){
 const state=runtime.state,guard=job?.project_guard,snapshot=result?.project_snapshot,ticket=job?.project_ticket;
 if(!state.available||!safeID(job?.id)||job.id!==result?.id||result.error||result.transaction?.stage!=='committed'||result.transaction.requires_manual_recovery||!Array.isArray(job.patterns)||!Array.isArray(result.patterns)||!result.patterns.length||result.patterns.length!==job.patterns.length)return false;
 if(!ticket||ticket.project_id!==state.project_id||ticket.session_id!==state.session_id||guard?.context_session_id!==state.session_id)return false;
 if(!snapshot?.available||!snapshot.content_digest||snapshot.content_digest!==state.content_digest||snapshot.document_id!==state.document_id||guard.document_id!==snapshot.document_id)return false;
 if(!['document_id','generation','content_digest','context_session_id'].every(key=>guard[key]!==undefined&&guard[key]===result.project_guard?.[key]))return false;
 if((job.operation||'create')!=='create'||job.assembly_id||job.remove_ids?.length)return false;
 if(new Set(result.patterns.map(part=>String(part.clo_pattern_id))).size!==result.patterns.length||new Set(job.patterns.map(part=>part.semantic?.id)).size!==job.patterns.length)return false;
 return result.patterns.every((part,i)=>job.patterns[i]?.semantic?.id&&part.semantic&&typeof part.fingerprint==='string'&&state.parts.some(current=>String(current.pattern_id)===String(part.clo_pattern_id)&&current.fingerprint===part.fingerprint));
}
function recover(runtime,temp,activeJobs){
 if(!runtime.state.available)return {restored:false};
 const receiptFile=path.join(temp,'clo_ai_job_result.json');let stamp;
 try{const stat=fs.statSync(receiptFile);stamp=[runtime.state.project_id,runtime.state.session_id,runtime.state.document_id,runtime.state.content_digest,stat.mtimeMs,stat.size].join(':');}catch{return {restored:false};}
 if(attempts.get(runtime)===stamp)return {restored:false};
 const result=read(receiptFile);if(!safeID(result?.id)){attempts.set(runtime,stamp);return {restored:false};}
 if(activeJobs?.has(result.id))return {restored:false};
 const {conversation,semantics,garments}=runtime.stores,target=file(conversation,result.id),entry=read(target);
 if(entry?.completed||conversation.data.messages.some(message=>message.event===result.id)){attempts.set(runtime,stamp);return {restored:false};}
 // Compatibility recovery for the old app's uncommitted temporary command.
 // The original project/session and every native fingerprint remain mandatory.
 const job=entry?.job||read(path.join(temp,'clo_ai_apply.json'));
 if(!verified(runtime,job,result)){attempts.set(runtime,stamp);return {restored:false};}
 if(job.garment){const current=garments.data.garments.find(item=>item.id===job.garment.id);if(current&&current.version>job.garment.version){attempts.set(runtime,stamp);return {restored:false};}}
 if(!entry)queue(conversation,job);
 semantics.commit(job,result);garments.commit(job,result);
 if(job.work_order_id){try{require('./garment-patternmaking-tools.cjs').bind({stores:runtime.stores,runtime},job,result);}catch{result.work_order_warning='Связь с заданием не восстановлена. Проверьте изделие перед изменением.';}}
 const summary=require('./ui-format.js').resultSummary(result,job);
 const manager=new(require('./dialogue-manager.cjs').DialogueManager)(conversation,runtime);
 const events=manager.finish(result,result.id,summary.kind==='success');
 conversation.outcome(result.id,summary.text,summary.kind,{recovered:true,execution_events:events,context:JSON.stringify({job_id:result.id,confirmed:summary.kind==='success',recovered:true})});
 complete(conversation,result.id);attempts.set(runtime,stamp);return {restored:true,id:result.id};
}
module.exports={queue,complete,verified,recover};
