const {randomUUID,createHash}=require('node:crypto');
const fingerprint=g=>createHash('sha256').update(JSON.stringify(g.bindings)).digest('hex');
function publicOffer(g){const a=g.assembly;return a?{id:a.id,garment_id:g.id,name:g.name,version:g.version,status:a.status,report:a.report||null}:null;}
function offer(store,g,ticket){g.assembly={id:randomUUID(),ticket,version:g.version,binding_hash:fingerprint(g),status:'offered',created_at:new Date().toISOString()};store.save();return publicOffer(g);}
function current(store,runtime,arg){
 if(!arg||Object.keys(arg).some(k=>!['id','action','confirmed','manual_scene_confirmed'].includes(k))||!['check','decline','simulate'].includes(arg.action))throw Error('Неизвестное действие сборки');
 const g=store.data.garments.find(g=>g.assembly?.id===arg.id);if(!g)throw Error('Предложение сборки больше недоступно');
 const a=g.assembly;runtime.assert(a.ticket,true);runtime.assertGarment(g.id);
 if(a.version!==g.version||a.binding_hash!==fingerprint(g))throw Error('Изделие изменилось. Проверьте актуальную версию перед сборкой');return g;
}
function prepare(store,runtime,arg){
 const g=current(store,runtime,arg),a=g.assembly;
 if(arg.action==='decline'){if(['checking','simulation_queued'].includes(a.status))throw Error('Дождитесь результата уже отправленной операции');a.status='declined';store.save();return {declined:true,offer:publicOffer(g)};}
 if(arg.confirmed!==true)throw Error('Подтвердите действие для этой версии изделия');
 if(arg.action==='check'&&a.status!=='offered')return {existing:true,offer:publicOffer(g)};
 if(arg.action==='simulate'&&(a.status!=='unavailable'||arg.manual_scene_confirmed!==true))throw Error('Сначала проверьте комплект, затем подтвердите ручное сшивание и размещение сцены');
 const operation=arg.action==='check'?'assembly_preflight':'simulate_confirmed',ticket=runtime.ticket();
 a.status=arg.action==='check'?'checking':'simulation_queued';store.save();
 return {id:randomUUID(),operation,assembly_id:a.id,garment:JSON.parse(JSON.stringify(g)),targets:g.bindings,patterns:[],project_ticket:ticket,project_guard:runtime.nativeGuard(ticket),...(arg.action==='simulate'?{confirmed_simulation:true,manual_scene_confirmed:true,simulation_steps:100}:{})};
}
function commit(store,job,result){
 const g=store.data.garments.find(g=>g.id===job.garment.id);if(!g||g.version!==job.garment.version||g.assembly?.id!==job.assembly_id)return;
 g.assembly.status=result.error?'failed':result.assembly?.status||'failed';g.assembly.report=result.assembly||{text:result.error};g.assembly.updated_at=new Date().toISOString();
 if(job.operation==='simulate_confirmed'){g.integration={...g.integration,simulation:result.assembly?.simulation_status||(result.transaction?.requires_manual_recovery?'unconfirmed':'not_run'),simulation_steps:100,sewing:'manual_attested',arrangement:'manual_attested'};}
 store.save();
}
function summary(result){return {kind:result.error||result.assembly?.status==='simulation_unconfirmed'?'error':result.assembly?.status==='simulation_steps_completed'?'success':'assistant',text:result.error||result.assembly?.text||'Результат сборки не подтверждён. Проверьте CLO.'};}
module.exports={offer,prepare,commit,publicOffer,summary};
