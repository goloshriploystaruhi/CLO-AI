// CLO executes native operations on the same UI thread as its heartbeat timer.
// A bounded, explicitly published operation is evidence of work, not a disconnect.
const OPERATIONS=new Set(['create','inspect','validate','measure','qa_measure','delete','assembly_preflight','simulate_confirmed','sewing_test_prepare','sewing_test_inspect','sewing_test_cleanup']);
function connection(state,now=Date.now()/1000,alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}}){
 const age=now-state.heartbeat,busy=state.native_busy,hasPID=Number.isSafeInteger(state.pid)&&state.pid>0;
 const processAlive=!hasPID||alive(state.pid);
 const waiting=processAlive&&OPERATIONS.has(busy?.operation)&&typeof busy.job_id==='string'&&busy.job_id.length>0&&busy.job_id.length<=200&&Number.isSafeInteger(busy.pid)&&busy.pid>0&&(!hasPID||state.pid===busy.pid)&&Number.isFinite(busy.started_at)&&now>=busy.started_at&&now-busy.started_at<600&&alive(busy.pid);
 return {...state,connected:processAlive&&(age>=0&&age<4||!!waiting),waiting_native_operation:!!waiting,waiting_native_simulation:!!waiting&&busy.operation==='simulate_confirmed'};
}
module.exports={connection};
