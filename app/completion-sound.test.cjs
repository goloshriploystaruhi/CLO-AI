const {test}=require('node:test'),assert=require('node:assert/strict'),{create,TIMING,TONES,HARMONIC,VOLUME}=require('./completion-sound.js');
class Parameter{
 constructor(){this.events=[];this.value=0;}
 record(kind,value,time){this.events.push({kind,value,time});this.value=value;}
 setValueAtTime(v,t){this.record('set',v,t);}
 linearRampToValueAtTime(v,t){this.record('linear',v,t);}
 exponentialRampToValueAtTime(v,t){this.record('exponential',v,t);}
 cancelScheduledValues(t){this.events.push({kind:'cancel',time:t});}
}
class Node{
 constructor(){this.connections=[];this.disconnected=false;this.gain=new Parameter();this.frequency=new Parameter();this.stops=[];}
 connect(n){this.connections.push(n);}
 disconnect(){this.disconnected=true;this.connections=[];}
 start(t){this.startAt=t;}
 stop(t){this.stops.push(t);}
 end(){this.onended?.();}
}
function fixture({state='running',resumeFailure=false}={}){
 const instances=[],timers=new Map();let sequence=0;
 class Context{
  constructor(options){this.options=options;this.state=state;this.currentTime=12;this.destination={};this.nodes=[];this.oscillators=[];this.resumeCalls=0;this.closeCalls=0;instances.push(this);}
  createGain(){const n=new Node();this.nodes.push(n);return n;}
  createOscillator(){const n=new Node();this.nodes.push(n);this.oscillators.push(n);return n;}
  async resume(){this.resumeCalls++;if(resumeFailure)throw Error('Device denied');if(this.deferResume)await new Promise(resolve=>{this.resolveResume=resolve;});this.state='running';}
  async close(){this.closeCalls++;this.state='closed';}
 }
 const sound=create({AudioContext:Context,setTimeout:(fn,ms)=>{const id=++sequence;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
 return {instances,sound,timers,Context,flush(){for(const [id,t]of [...timers]){timers.delete(id);t.fn();}}};
}
test('sound is lazy, quiet, finite and uses two original sine notes with a weak harmonic',async()=>{
 const {sound,instances}=fixture();assert.equal(instances.length,0);assert.equal(await sound.play(),true);assert.equal(instances.length,1);
 const context=instances[0],voices=context.oscillators;assert.equal(context.options.latencyHint,'interactive');assert.equal(voices.length,4);assert.equal(context.resumeCalls,0);
 for(let i=0;i<voices.length;i++){
  const tone=TONES[Math.floor(i/2)],osc=voices[i],gain=osc.connections[0],onset=context.currentTime+TIMING.lead+tone.onset,end=onset+tone.duration;
  assert.equal(osc.type,'sine');assert.equal(osc.frequency.events[0].value,tone.frequency*(i%2?2:1));assert.equal(osc.startAt,onset);assert.equal(osc.stops[0],end);
  assert.deepEqual(gain.gain.events[0],{kind:'set',value:0,time:onset});assert.equal(gain.gain.events[1].value,tone.peak*(i%2?HARMONIC:1));assert.equal(gain.gain.events[1].time,onset+TIMING.attack);assert.deepEqual(gain.gain.events.at(-1),{kind:'linear',value:0,time:end});assert(gain.gain.events.every(e=>e.value>=0&&Number.isFinite(e.time)));
 }
 assert(Math.abs(Math.max(...voices.map(o=>o.stops[0]))-context.currentTime-TIMING.duration)<1e-9);assert(TIMING.duration>=.65&&TIMING.duration<=.75);assert(TIMING.attack>=.015);assert(TONES.reduce((n,t)=>n+t.peak,0)*(1+HARMONIC)*VOLUME<.07);
 voices.forEach(o=>o.end());assert(context.nodes.every(n=>n.disconnected));assert(voices.every(o=>o.onended===null));await sound.dispose();assert.equal(context.closeCalls,1);
});
test('new playback releases the previous sound and reuses one context; stop is repeatable',async()=>{
 const f=fixture();await f.sound.play();const context=f.instances[0],first=context.oscillators.slice();await f.sound.play();assert.equal(f.instances.length,1);assert.equal(context.oscillators.length,8);assert(first.every(o=>o.stops.at(-1)===context.currentTime+TIMING.stopRelease));
 assert.equal(f.timers.size,1);f.flush();assert(first.every(o=>o.disconnected));assert(context.oscillators.slice(4).every(o=>!o.disconnected));f.sound.stop();f.sound.stop();assert.equal(f.timers.size,1);f.flush();assert(context.nodes.every(n=>n.disconnected));await f.sound.dispose();
});
test('stop cancels a pending suspended-context resume instead of playing on return to focus',async()=>{
 const f=fixture({state:'suspended'}),pending=f.sound.play(),context=f.instances[0];
 // The initial synchronous resume can settle only after the async play yields.
 f.sound.stop();assert.equal(await pending,false);assert.equal(context.oscillators.length,0);assert.equal(await f.sound.play(),true);assert.equal(context.resumeCalls,1);await f.sound.dispose();
});
test('only the newest concurrent resume request may schedule a signal',async()=>{
 const f=fixture();await f.sound.play();const context=f.instances[0];context.oscillators.forEach(o=>o.end());context.state='suspended';context.deferResume=true;
 const first=f.sound.play(),resolveFirst=context.resolveResume,second=f.sound.play(),resolveSecond=context.resolveResume;resolveSecond();assert.equal(await second,true);resolveFirst();assert.equal(await first,false);assert.equal(context.oscillators.length,8);await f.sound.dispose();
});
test('dispose cancels pending resume, disconnects all graphs and closes its context once',async()=>{
 const f=fixture();await f.sound.play();const context=f.instances[0];context.state='suspended';context.deferResume=true;const pending=f.sound.play(),resume=context.resolveResume;await f.sound.dispose();resume();assert.equal(await pending,false);assert(context.nodes.every(n=>n.disconnected));assert.equal(context.closeCalls,1);assert.equal(f.timers.size,0);assert.equal(await f.sound.play(),false);await f.sound.dispose();assert.equal(context.closeCalls,1);
});
test('missing audio, rejected resume or a failed device do not throw or break UI',async()=>{
 const absent=create({AudioContext:null});assert.equal(await absent.play(),false);absent.stop();await absent.dispose();
 const denied=fixture({state:'suspended',resumeFailure:true});assert.equal(await denied.sound.play(),false);assert.equal(denied.instances[0].oscillators.length,0);await denied.sound.dispose();
 const broken=create({AudioContext:class{constructor(){throw Error('No output device');}}});assert.equal(await broken.play(),false);await broken.dispose();
});
test('offline rendering does not wait for resume, which can only finish during rendering',async()=>{
 const f=fixture({state:'suspended'});f.Context.prototype.startRendering=()=>{};assert.equal(await f.sound.play(),true);assert.equal(f.instances[0].resumeCalls,0);assert.equal(f.instances[0].oscillators.length,4);await f.sound.dispose();
});
