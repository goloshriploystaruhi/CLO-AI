(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.CompletionSound=api;})(typeof window==='undefined'?globalThis:window,root=>{
 'use strict';
 // An original, quiet ascending third: no recorded/system notification sound.
 const TIMING=Object.freeze({lead:.015,attack:.018,duration:.72,stopRelease:.012});
 const TONES=Object.freeze([
  Object.freeze({frequency:523.2511306011972,onset:0,duration:.42,peak:.045}),
  Object.freeze({frequency:659.2551138257398,onset:.19,duration:.515,peak:.036})
 ]);
 const HARMONIC=.08,VOLUME=.75;
 function create({AudioContext=root.AudioContext||root.webkitAudioContext,setTimeout=root.setTimeout?.bind(root),clearTimeout=root.clearTimeout?.bind(root)}={}){
  let context=null,current=null,serial=0,disposed=false;const graphs=new Set();
  function clean(graph){
   if(graph.cleaned)return;graph.cleaned=true;if(graph.timer!==null&&clearTimeout)clearTimeout(graph.timer);graphs.delete(graph);if(current===graph)current=null;
   for(const voice of graph.voices){voice.oscillator.onended=null;try{voice.oscillator.disconnect();}catch{}try{voice.gain.disconnect();}catch{}}
   try{graph.master.disconnect();}catch{}
  }
  function halt(graph){
   if(!graph||graph.cleaned)return;const now=context?.currentTime||0,end=now+TIMING.stopRelease;
   try{graph.master.gain.cancelScheduledValues(now);graph.master.gain.setValueAtTime(VOLUME,now);graph.master.gain.linearRampToValueAtTime(0,end);}catch{}
   for(const voice of graph.voices)try{voice.oscillator.stop(end);}catch{}
   // A suspended device might not emit ended until it is resumed. Disconnect
   // stopped graphs anyway; do not leave a queued beep to play after focus.
   if(setTimeout)graph.timer=setTimeout(()=>clean(graph),Math.ceil(TIMING.stopRelease*1000)+20);else clean(graph);
  }
  function stop(){++serial;const graph=current;current=null;halt(graph);}
  async function play(){
   if(disposed||typeof AudioContext!=='function')return false;
   const token=++serial;halt(current);current=null;
   try{
    if(!context||context.state==='closed')context=new AudioContext({latencyHint:'interactive'});
    // OfflineAudioContext is supported for deterministic audio QA. It starts
    // rendering after this call, so awaiting its resume here would deadlock.
    const offline=typeof context.startRendering==='function';
    if(context.state!=='running'&&!offline)await context.resume();
    if(disposed||token!==serial||context.state==='closed'||(!offline&&context.state!=='running'))return false;
    const start=context.currentTime+TIMING.lead,graph={master:context.createGain(),voices:[],ended:0,timer:null,cleaned:false};graphs.add(graph);current=graph;
    try{
     graph.master.gain.setValueAtTime(VOLUME,context.currentTime);graph.master.connect(context.destination);
     for(const tone of TONES)for(const [multiple,weight]of [[1,1],[2,HARMONIC]]){
      const oscillator=context.createOscillator(),gain=context.createGain(),voice={oscillator,gain};graph.voices.push(voice);
      const onset=start+tone.onset,end=onset+tone.duration,peak=tone.peak*weight;
      oscillator.type='sine';oscillator.frequency.setValueAtTime(tone.frequency*multiple,onset);oscillator.connect(gain);gain.connect(graph.master);
      gain.gain.setValueAtTime(0,onset);gain.gain.linearRampToValueAtTime(peak,onset+TIMING.attack);gain.gain.exponentialRampToValueAtTime(peak*.32,onset+tone.duration*.55);gain.gain.linearRampToValueAtTime(0,end);
      oscillator.onended=()=>{if(++graph.ended===graph.voices.length)clean(graph);};oscillator.start(onset);oscillator.stop(end);
     }
     return true;
    }catch{for(const voice of graph.voices)try{voice.oscillator.stop();}catch{}clean(graph);return false;}
   }catch{return false;}
  }
  async function dispose(){
   if(disposed)return;disposed=true;++serial;for(const graph of [...graphs]){for(const voice of graph.voices)try{voice.oscillator.stop();}catch{}clean(graph);}current=null;
   const owned=context;context=null;if(owned&&owned.state!=='closed'&&typeof owned.close==='function')try{await owned.close();}catch{}
  }
  return Object.freeze({play,stop,dispose});
 }
 return {create,TIMING,TONES,HARMONIC,VOLUME};
});
