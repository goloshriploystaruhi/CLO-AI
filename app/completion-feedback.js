// The main process owns focus/identity/deduplication. The renderer only plays
// the fixed local cue; no audio URLs or arbitrary commands cross this bridge.
(()=>{
 if(!window.clo?.onCompletionAttention)return;
 const sound=CompletionSound.create();
 const detach=window.clo.onCompletionAttention(({play})=>{if(play)sound.play().catch(()=>{});else sound.stop();});
 const detachOpen=window.clo.onCompletionOpenChat(()=>UI.navigate('chat',true));
 window.addEventListener('pagehide',()=>{detach();detachOpen();sound.dispose();},{once:true});
})();
