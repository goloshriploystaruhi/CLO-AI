(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.QuietReveal=api;})(typeof window==='undefined'?globalThis:window,root=>{
 'use strict';
 const defaults=Object.freeze({exit:95,enter:200,overlap:65,exitY:-4,enterY:5,stagger:15,maxStagger:60,total:280,easeOut:'cubic-bezier(.2,0,1,.9)',easeIn:'cubic-bezier(0,0,.38,.9)'});
 const keys=new WeakMap(),active=new Map();let sheet=null,observer=null,media=null;
 function delay(index,t=defaults,stagger=true){return t.overlap+(stagger?Math.min(index*t.stagger,t.maxStagger,Math.max(0,t.total-t.overlap-t.enter)):0);}
 function tokens(){const s=root.getComputedStyle(root.document.documentElement),t={...defaults};for(const key of Object.keys(t)){const value=s.getPropertyValue('--quiet-'+key);if(value.trim())t[key]=typeof t[key]==='number'?parseFloat(value):value.trim();}return t;}
 function prime(host,key){if(!keys.has(host))keys.set(host,key);}
 function settle(element){for(const [host,entry]of [...active])if(host.contains(element)||element.contains(host))entry.cancel();}
 function cancelAll(){for(const entry of [...active.values()])entry.cancel();}
 function check(){for(const [host,entry]of active)if(!host.isConnected||!host.getClientRects().length)entry.cancel();}
 function onKey(event){if(['PageDown','PageUp','Home','End'].includes(event.key)&&!event.target.closest('input,textarea,button,[role=tab]'))cancelAll();}
 function watch(){if(observer)return;observer=new root.MutationObserver(check);observer.observe(root.document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});media=root.matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',cancelAll);
  root.addEventListener('resize',cancelAll);root.addEventListener('pagehide',cancelAll);root.addEventListener('wheel',cancelAll,{passive:true});root.addEventListener('touchmove',cancelAll,{passive:true});root.document.addEventListener('keydown',onKey);
 }
 function unwatch(){if(active.size||!observer)return;observer.disconnect();observer=null;media.removeEventListener('change',cancelAll);media=null;root.removeEventListener('resize',cancelAll);root.removeEventListener('pagehide',cancelAll);root.removeEventListener('wheel',cancelAll);root.removeEventListener('touchmove',cancelAll);root.document.removeEventListener('keydown',onKey);}
 function snapshotStyle(){
  if(sheet)return sheet;sheet=new root.CSSStyleSheet();let css='';for(const source of root.document.styleSheets){try{for(const rule of source.cssRules)if(rule.type!==5&&rule.type!==3)css+=rule.cssText+'\n';}catch{}}
  sheet.replaceSync(css+'\n*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;pointer-events:none!important}');return sheet;
 }
 function snapshot(host){
  const document=host.ownerDocument,r=host.getBoundingClientRect();if(!r.width||!r.height)return null;
  const layer=document.createElement('div');layer.className='quiet-reveal-outgoing';layer.setAttribute('aria-hidden','true');layer.inert=true;
  Object.assign(layer.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  // A closed shadow tree keeps duplicate IDs, inert fields and old actions out
  // of application selectors and the accessibility tree. It never receives input.
  const shadow=layer.attachShadow({mode:'closed'});shadow.adoptedStyleSheets=[snapshotStyle()];const copy=host.cloneNode(true),sources=[host,...host.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')],animated=new Set(host.getAnimations({subtree:true}).map(a=>a.effect?.target));
  for(let i=0;i<sources.length;i++){const a=sources[i],b=clones[i];if(a.tagName==='INPUT'){b.value=a.value;b.checked=a.checked;}if(a.tagName==='TEXTAREA')b.value=a.value;if(a.tagName==='SELECT')b.selectedIndex=a.selectedIndex;
   if(animated.has(a)&&i){const s=root.getComputedStyle(a);b.style.opacity=s.opacity;b.style.transform=s.transform;}
  }
  Object.assign(copy.style,{position:'relative',inset:'auto',width:'100%',height:'100%',minWidth:'0',minHeight:'0',maxWidth:'none',maxHeight:'none',margin:'0',flex:'none',transform:'none'});shadow.append(copy);
  (host.closest('dialog[open]')||document.body).append(layer);for(let i=0;i<sources.length;i++){clones[i].scrollTop=sources[i].scrollTop;clones[i].scrollLeft=sources[i].scrollLeft;}return layer;
 }
 function focusState(host){const e=host.ownerDocument.activeElement;if(!e||!host.contains(e))return null;return {id:e.id,start:e.selectionStart,end:e.selectionEnd,direction:e.selectionDirection};}
 function restoreFocus(host,before,selector,changed){
  const document=host.ownerDocument,activeElement=document.activeElement;
  if(activeElement&&activeElement!==document.body&&!host.contains(activeElement))return;
  const target=(!changed&&before?.id?host.querySelector('#'+root.CSS.escape(before.id)):null)||(before||activeElement===document.body?selector&&host.querySelector(selector):null);
  if(!target||target.disabled)return;target.focus({preventScroll:true});if(!changed&&before?.start!=null&&typeof target.setSelectionRange==='function')target.setSelectionRange(before.start,before.end,before.direction||'none');
 }
 function transition(host,commit,{key,targets,focus,stagger=true,scroll:scrollHost=host}={}){
  const changed=keys.has(host)&&keys.get(host)!==key,before=focusState(host),scroll={top:scrollHost.scrollTop,left:scrollHost.scrollLeft},visible=host.isConnected&&host.getClientRects().length>0,reduced=root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(changed&&visible)root.CursorSuction?.cancelAll();let outgoing=null;
  if(changed&&visible&&!reduced){try{outgoing=snapshot(host);}catch{outgoing?.remove();}}
  if(changed&&visible)settle(host);else for(const [other,entry]of [...active])if(other===host||host.contains(other))entry.cancel();
  let result;try{result=commit();keys.set(host,key);}catch(error){outgoing?.remove();throw error;}
  if(changed){scrollHost.scrollTop=0;scrollHost.scrollLeft=0;}else{scrollHost.scrollTop=scroll.top;scrollHost.scrollLeft=scroll.left;}
  restoreFocus(host,before,focus,changed);
  if(!changed||!visible||reduced||!host.getClientRects().length){outgoing?.remove();return result;}
  const t=tokens(),animations=[],bounds=host.getBoundingClientRect(),items=typeof targets==='function'?targets(host):typeof targets==='string'?[...host.querySelectorAll(targets)]:[...host.children];
  let index=0;for(const item of items){const r=item.getBoundingClientRect();if(!r.width||!r.height||r.bottom<=bounds.top||r.top>=bounds.bottom||item.closest('[hidden]'))continue;
   animations.push(item.animate([{opacity:0,transform:'translateY('+t.enterY+'px)'},{opacity:1,transform:'translateY(0px)'}],{duration:t.enter,delay:delay(index++,t,stagger),easing:t.easeIn,fill:'both'}));
  }
  if(outgoing)animations.push(outgoing.animate([{opacity:1,transform:'translateY(0px)'},{opacity:0,transform:'translateY('+t.exitY+'px)'}],{duration:t.exit,easing:t.easeOut,fill:'forwards'}));
  if(!animations.length){outgoing?.remove();return result;}
  let finished=false;const entry={cancel:()=>finish()};function finish(){if(finished)return;finished=true;for(const a of animations)a.cancel();outgoing?.remove();if(active.get(host)===entry)active.delete(host);unwatch();}
  active.set(host,entry);watch();Promise.allSettled(animations.map(a=>a.finished)).then(finish);return result;
 }
 return {transition,prime,settle,cancelAll,defaults,delay,activeCount:()=>active.size};
});
