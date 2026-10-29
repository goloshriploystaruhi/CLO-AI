const {test}=require('node:test'),assert=require('node:assert/strict'),{connection}=require('./bridge-state.cjs');
test('fresh heartbeat connects; normal stale or future heartbeat does not',()=>{assert(connection({heartbeat:99},100).connected);assert(!connection({heartbeat:80},100).connected);assert(!connection({heartbeat:110},100).connected);});
test('confirmed synchronous simulation preserves context only while native process lives and wait is bounded',()=>{
 const state={heartbeat:10,native_busy:{operation:'simulate_confirmed',job_id:'j',pid:123,started_at:10}};
 assert(connection(state,100,()=>true).connected);assert(connection(state,100,()=>true).waiting_native_simulation);
 assert(!connection(state,100,()=>false).connected);assert(!connection(state,700,()=>true).connected);
 assert(!connection({...state,native_busy:{...state.native_busy,operation:'arbitrary_code'}},100,()=>true).connected);
});
test('construction and readback keep the workspace connected while CLO blocks its UI timer',()=>{
 for(const operation of ['create','inspect','validate','measure','qa_measure','delete','assembly_preflight']){
  const s={pid:123,heartbeat:10,native_busy:{operation,job_id:'j',pid:123,started_at:10}};
  assert(connection(s,45,()=>true).connected,operation);assert(connection(s,45,()=>true).waiting_native_operation);
  assert(!connection(s,45,()=>true).waiting_native_simulation);assert(!connection({...s,native_busy:undefined},45,()=>true).connected);
 }
});
test('a dead CLO, forged owner, expired operation or future start cannot keep a stale bridge alive',()=>{
 const s={pid:123,heartbeat:100,native_busy:{operation:'create',job_id:'j',pid:123,started_at:10}};
 assert(!connection(s,101,()=>false).connected);
 for(const native_busy of [{...s.native_busy,pid:124},{...s.native_busy,job_id:''},{...s.native_busy,started_at:200},{...s.native_busy,started_at:-600}])assert(!connection({...s,heartbeat:10,native_busy},100,()=>true).connected);
});
