(function(root,factory){const api=factory(root,typeof module==='object'&&module.exports?require('./cursor-suction.js'):root.CursorSuction);if(typeof module==='object'&&module.exports)module.exports=api;else root.ChatTyping=api;})(typeof window==='undefined'?globalThis:window,(root,motion)=>{
 'use strict';
 const active=new Map(),states=new WeakMap();let highlight=null,observer=null,media=null;
 function prefix(text,from){let end=Math.min(text.length,from?.text?.length||0,from?.cut||0),i=0;while(i<end&&text[i]===from.text[i])i++;return i;}
 function checkpoint(element){const state=element&&states.get(element);return state?{text:state.text,cut:state.cut}:null;}
 function settle(element){for(const [body,entry]of [...active])if(body===element||body.contains(element)||element.contains(body))entry.finish(false);}
 function cancelAll(){for(const entry of [...active.values()])entry.finish(false);}
 function check(){for(const [body,entry]of active)if(!body.isConnected||!body.getClientRects().length||body.textContent!==entry.state.text)entry.finish(false);}
 function interact(event){for(const [body,entry]of active)if(body.contains(event.target))entry.finish(false);}
 function watch(){if(observer)return;observer=new root.MutationObserver(check);observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  media=root.matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',cancelAll);
  // Auto-follow scroll events are queued after rendering. They must not finish
  // a fresh answer immediately; user scroll gestures still reveal it at once.
  for(const event of ['resize','blur','pagehide','section-open'])root.addEventListener(event,cancelAll,true);
  for(const event of ['wheel','touchmove'])root.addEventListener(event,cancelAll,{passive:true,capture:true});
  for(const event of ['pointerdown','keydown','focusin'])root.document.addEventListener(event,interact,true);
 }
 function unwatch(){if(active.size||!observer)return;observer.disconnect();observer=null;media.removeEventListener('change',cancelAll);media=null;
  for(const event of ['resize','blur','pagehide','section-open'])root.removeEventListener(event,cancelAll,true);
  for(const event of ['wheel','touchmove'])root.removeEventListener(event,cancelAll,true);
  for(const event of ['pointerdown','keydown','focusin'])root.document.removeEventListener(event,interact,true);
 }
 function reveal(element,{from=null}={}){
  active.get(element)?.finish(false);
  const text=element.textContent,state={text,cut:prefix(text,from)};states.set(element,state);
  const done=()=>{state.cut=text.length;return Promise.resolve(false);};
  if(state.cut===text.length||!element.isConnected||root.matchMedia('(prefers-reduced-motion: reduce)').matches||!root.CSS?.highlights||typeof root.Highlight!=='function')return done();
  const rows=motion.collect(element);if(!rows.length)return done();
  // Locate visible glyphs in the already-rendered, safe rich text. Off-screen
  // text stays readable, and Markdown, line wraps and full message height stay put.
  const offsets=new Map(),walker=element.ownerDocument.createTreeWalker(element,root.NodeFilter.SHOW_TEXT);let node,offset=0;
  while((node=walker.nextNode())){offsets.set(node,offset);offset+=node.length;}
  const pending=rows.map(r=>({...r,end:offsets.get(r.node)+r.range.endOffset})).filter(r=>r.end>state.cut);
  if(pending.length<2)return done();
  if(!highlight){highlight=new root.Highlight();root.CSS.highlights.set('chat-typing',highlight);}
  let shown=1,frame,finished=false,resolve;state.cut=pending[0].end;
  for(let i=shown;i<pending.length;i++)highlight.add(pending[i].range);
  element.dataset.typing='true';const promise=new Promise(r=>resolve=r);
  const entry={state,finish(completed){if(finished)return;finished=true;root.cancelAnimationFrame(frame);for(const r of pending)highlight?.delete(r.range);delete element.dataset.typing;state.cut=text.length;active.delete(element);
   if(!active.size){root.CSS.highlights.delete('chat-typing');highlight=null;}unwatch();resolve(completed);
  }};
  const started=root.performance.now(),duration=motion.typingDuration(pending.length);
  function tick(now){const elapsed=Math.max(0,now-started);if(elapsed>=duration){entry.finish(true);return;}
   const count=Math.max(shown,motion.typedCount(pending.length,elapsed));for(let i=shown;i<count;i++)highlight.delete(pending[i].range);shown=count;state.cut=pending[shown-1].end;frame=root.requestAnimationFrame(tick);
  }
  active.set(element,entry);watch();frame=root.requestAnimationFrame(tick);return promise;
 }
 return {reveal,checkpoint,settle,cancelAll,prefix,activeCount:()=>active.size};
});
