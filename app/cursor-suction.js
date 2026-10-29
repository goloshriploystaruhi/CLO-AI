(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.CursorSuction=api;})(typeof window==='undefined'?globalThis:window,root=>{
 'use strict';
 const timing=Object.freeze({take:600,hold:400,typingMin:360,typingMax:1400}),active=new Map(),bindings=new WeakMap();
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>x*x*(3-2*x);
 function graphemes(text){
  if(typeof Intl.Segmenter==='function')return [...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(text)].map(({segment,index})=>({segment,index}));
  const out=[];let index=0,join=false;
  for(const char of text){const last=out.at(-1),mark=/[\p{M}\uFE00-\uFE0F\u{1F3FB}-\u{1F3FF}]/u.test(char),flag=/\p{Regional_Indicator}/u.test(char);
   if(last&&(mark||join||char==='\u200d'||(flag&&/^\p{Regional_Indicator}$/u.test(last.segment))))last.segment+=char;else out.push({segment:char,index});join=char==='\u200d';index+=char.length;
  }return out;
 }
 function path(rect,origin,index,max){const dx=origin.x-(rect.left+rect.width/2),dy=origin.y-(rect.top+rect.height/2),distance=Math.hypot(dx,dy),far=clamp(distance/Math.max(1,max)),seed=Math.sin((index+1)*79.217)*43758.5;
  const ux=dx/Math.max(1,distance),uy=dy/Math.max(1,distance),reach=Math.max(.5,(Math.abs(ux)*rect.width+Math.abs(uy)*rect.height)/2);
  return {dx,dy,distance,far,angle:Math.atan2(dy,dx),ux,uy,reach,seed:seed-Math.floor(seed),delay:35*far,duration:500+65*far};
 }
 // A longer visible passage types faster per grapheme, with a fixed upper
 // bound. Only visible text participates; a long off-screen message adds no wait.
 function typingDuration(count){return count>0?Math.min(timing.typingMax,timing.typingMin+32*Math.sqrt(count)):0;}
 function typedCount(count,elapsed){return count>0&&elapsed>=0?Math.min(count,1+Math.floor((count-1)*clamp(elapsed/typingDuration(count))+1e-9)):0;}
 function timeline(elapsed,count){
  if(elapsed<timing.take)return {phase:'take',time:Math.max(0,elapsed),visible:0};
  const typingTime=elapsed-timing.take-timing.hold;
  if(typingTime<0)return {phase:'hold',time:timing.take,visible:0};
  return {phase:typingTime<typingDuration(count)?'type':'done',time:typingTime,visible:typedCount(count,typingTime)};
 }
 function sample(p,time){
  const a=Math.pow(clamp((time-p.delay)/p.duration),2.3),pulse=a>0&&a<1?Math.sin(Math.PI*a):0,swell=pulse*(.16+.12*p.far),shrink=1-.985*Math.pow(a,3.2),tangent=(p.seed-.5)*p.distance*.014*pulse;
  // Keep the original gentle flight. A bounded projective pull leaves the far
  // edge and centre fixed, increasing only toward the edge nearest the cursor.
  // Peak near-edge stretch is about 28%, with no extra twist or flight change.
  const edge=p.distance>=1?.22*pulse:0;
  return {x:p.dx*a+p.uy*tangent,y:p.dy*a-p.ux*tangent,sx:shrink*(1+swell),sy:shrink*(1-.24*swell),angle:p.angle,wx:-edge*p.ux/(2*p.reach),wy:-edge*p.uy/(2*p.reach),w0:1-edge/2,opacity:1-smooth(clamp((a-.67)/.31))};
 }
 function origin(element,event){const touch=event?.changedTouches?.[0]||event?.touches?.[0];if(touch)return {x:touch.clientX,y:touch.clientY};
  if(event&&(event.detail>0||event.pointerType)&&Number.isFinite(event.clientX)&&Number.isFinite(event.clientY))return {x:event.clientX,y:event.clientY};
  const r=element.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};
 }
 function intersection(a,b){return {left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)};}
 function visibleBox(element){let box={left:0,top:0,right:root.innerWidth,bottom:root.innerHeight};
  for(let p=element;p;p=p.parentElement){const s=root.getComputedStyle(p);if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0||p.hidden)return null;
   if(/hidden|clip|scroll|auto/.test(s.overflowX+' '+s.overflowY)){const r=p.getBoundingClientRect(),x=/hidden|clip|scroll|auto/.test(s.overflowX),y=/hidden|clip|scroll|auto/.test(s.overflowY);box=intersection(box,{left:x?r.left+p.clientLeft:box.left,right:x?r.left+p.clientLeft+p.clientWidth:box.right,top:y?r.top+p.clientTop:box.top,bottom:y?r.top+p.clientTop+p.clientHeight:box.bottom});}
  }return box.right>box.left&&box.bottom>box.top?box:null;
 }
 // Freeze the existing onboarding gradient into per-letter solid colours. No
 // gradient, decoration or custom cursor is added to the motion layer.
 function textColour(style,rect,box){
  const image=style.backgroundImage,angle=image.match(/^linear-gradient\(([-\d.]+)deg,/),stops=[...image.matchAll(/rgb\((\d+),\s*(\d+),\s*(\d+)\)\s+([\d.]+)%/g)];
  if(style.backgroundClip!=='text'||!angle||stops.length<2)return style.color;
  const sizes=style.backgroundSize.split(' '),positions=style.backgroundPosition.split(' '),length=(value,base)=>value?.endsWith('%')?parseFloat(value)/100*base:parseFloat(value)||base;
  const w=length(sizes[0],box.width),h=length(sizes[1]||sizes[0],box.height),offset=(value,space)=>value?.endsWith('%')?parseFloat(value)/100*space:parseFloat(value)||0;
  const dx=Math.sin(Number(angle[1])*Math.PI/180),dy=-Math.cos(Number(angle[1])*Math.PI/180),span=Math.abs(w*dx)+Math.abs(h*dy),cx=box.left+offset(positions[0],box.width-w)+w/2,cy=box.top+offset(positions[1],box.height-h)+h/2;
  const t=clamp(.5+((rect.left+rect.width/2-cx)*dx+(rect.top+rect.height/2-cy)*dy)/Math.max(1,span))*100;
  let a=stops[0],b=stops.at(-1);for(let i=1;i<stops.length;i++)if(t<=Number(stops[i][4])){a=stops[i-1];b=stops[i];break;}
  const mix=clamp((t-Number(a[4]))/Math.max(.001,Number(b[4])-Number(a[4])));return 'rgb('+[1,2,3].map(i=>Math.round(Number(a[i])+(Number(b[i])-Number(a[i]))*mix)).join(',')+')';
 }
 function collect(element){
  const document=element.ownerDocument,walker=document.createTreeWalker(element,root.NodeFilter.SHOW_TEXT),rows=[],cache=new Map();let node;
  while((node=walker.nextNode())){
   const parent=node.parentElement;if(!node.data.trim()||parent.closest('svg,math,script,style,input,textarea,[aria-hidden=true],[hidden],.sr-only,.icon,[data-icon]'))continue;
   let cached=cache.get(parent);if(!cached){const style=root.getComputedStyle(parent);cached={style,clip:visibleBox(parent)};cache.set(parent,cached);}
   const {style,clip}=cached;if(!clip||style.writingMode!=='horizontal-tb')continue;
   const range=document.createRange();range.selectNodeContents(node);if(![...range.getClientRects()].some(r=>r.bottom>clip.top&&r.top<clip.bottom&&r.right>clip.left&&r.left<clip.right))continue;
   // Horizontal text has monotone line Y positions, including RTL. Binary
   // search avoids measuring thousands of off-screen characters in long nodes.
   const charRect=i=>{range.setStart(node,i);range.setEnd(node,Math.min(node.length,i+1));return range.getBoundingClientRect();};
   const lower=predicate=>{let a=0,b=node.length;while(a<b){const m=(a+b)>>1;if(predicate(charRect(m)))b=m;else a=m+1;}return a;};
   const start=lower(r=>r.bottom>clip.top),end=lower(r=>r.top>=clip.bottom);
   const segments=typeof Intl.Segmenter==='function'?new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(node.data):null;
   function* visibleGraphemes(){if(segments?.containing){let g=segments.containing(start);while(g&&g.index<end){yield g;g=segments.containing(g.index+g.segment.length);}}else for(const g of graphemes(node.data))if(g.index+g.segment.length>start&&g.index<end)yield g;}
   for(const g of visibleGraphemes()){if(/^\s+$/u.test(g.segment))continue;
    const r=document.createRange();r.setStart(node,g.index);r.setEnd(node,g.index+g.segment.length);const rect=r.getBoundingClientRect(),visible=intersection(rect,clip);if(visible.right<=visible.left||visible.bottom<=visible.top||!rect.width||!rect.height)continue;
    rows.push({range:r,node,text:node.data,segment:g.segment,rect,visible,style});if(rows.length>1600)return [];
   }
  }return rows;
 }
 let highlight=null,observer=null,watching=false,motionMedia=null;
 function cancelAll(){for(const entry of [...active.values()])entry.cancel();}
 function check(){for(const [element,entry]of active)if(!element.isConnected||!element.getClientRects().length||entry.rows.some(r=>!element.contains(r.node)||r.node.data!==r.text))entry.cancel();}
 function watch(){if(watching)return;watching=true;observer=new root.MutationObserver(check);observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  root.addEventListener('scroll',cancelAll,true);root.addEventListener('resize',cancelAll);root.addEventListener('blur',cancelAll);root.addEventListener('pagehide',cancelAll);root.addEventListener('section-open',cancelAll);root.document.addEventListener('visibilitychange',cancelAll);motionMedia=root.matchMedia('(prefers-reduced-motion: reduce)');motionMedia.addEventListener('change',cancelAll);
 }
 function unwatch(){if(active.size||!watching)return;watching=false;observer.disconnect();observer=null;root.removeEventListener('scroll',cancelAll,true);root.removeEventListener('resize',cancelAll);root.removeEventListener('blur',cancelAll);root.removeEventListener('pagehide',cancelAll);root.removeEventListener('section-open',cancelAll);root.document.removeEventListener('visibilitychange',cancelAll);motionMedia.removeEventListener('change',cancelAll);motionMedia=null;}
 function play(element,point){
  root.ChatTyping?.settle(element);
  root.QuietReveal?.settle(element);
  active.get(element)?.cancel();
  if(!element.isConnected||root.matchMedia('(prefers-reduced-motion: reduce)').matches||!root.CSS?.highlights||typeof root.Highlight!=='function')return Promise.resolve(false);
  const rows=collect(element);if(!rows.length)return Promise.resolve(false);
  const document=element.ownerDocument,layer=document.createElement('div');layer.className='cursor-suction-layer';layer.setAttribute('aria-hidden','true');layer.inert=true;
  const elementStyle=root.getComputedStyle(element),box=element.getBoundingClientRect();let max=1;for(const r of rows)max=Math.max(max,Math.hypot(point.x-r.rect.left-r.rect.width/2,point.y-r.rect.top-r.rect.height/2));
  const fragment=document.createDocumentFragment();rows.forEach((r,i)=>{const glyph=document.createElement('span');glyph.className='cursor-suction-glyph';glyph.textContent=r.segment;const s=r.style;
   Object.assign(glyph.style,{left:r.rect.left+'px',top:r.rect.top+'px',width:r.rect.width+'px',height:r.rect.height+'px',fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,fontStyle:s.fontStyle,fontStretch:s.fontStretch,fontVariant:s.fontVariant,fontFeatureSettings:s.fontFeatureSettings,fontVariationSettings:s.fontVariationSettings,letterSpacing:s.letterSpacing,lineHeight:r.rect.height+'px',textTransform:s.textTransform,textDecoration:s.textDecoration,color:textColour(elementStyle.backgroundClip==='text'?elementStyle:s,r.rect,box),clipPath:'inset('+[r.visible.top-r.rect.top,r.rect.right-r.visible.right,r.rect.bottom-r.visible.bottom,r.visible.left-r.rect.left].map(v=>Math.max(0,v)+'px').join(' ')+')'});
   if(r.visible.left===r.rect.left&&r.visible.right===r.rect.right&&r.visible.top===r.rect.top&&r.visible.bottom===r.rect.bottom)glyph.style.clipPath='none';r.glyph=glyph;r.path=path(r.rect,point,i,max);fragment.append(glyph);
  });layer.append(fragment);
  if(!highlight){highlight=new root.Highlight();root.CSS.highlights.set('cursor-suction',highlight);}for(const r of rows)highlight.add(r.range);
  element.classList.add('cursor-suction-active');(element.closest('dialog[open]')||document.body).append(layer);
  let frame,done=false,resolve;const finished=new Promise(r=>resolve=r),entry={rows,cancel:()=>finish(false)};
  function finish(completed){if(done)return;done=true;root.cancelAnimationFrame(frame);layer.remove();element.classList.remove('cursor-suction-active');for(const r of rows)highlight?.delete(r.range);active.delete(element);if(!active.size){root.CSS.highlights.delete('cursor-suction');highlight=null;}unwatch();resolve(completed);}
  let phase='take',visible=0;layer.dataset.phase=phase;
  const started=root.performance.now();function tick(now){const state=timeline(now-started,rows.length);if(state.phase==='done'){finish(true);return;}
   if(state.phase==='type'){
    if(phase!=='type')for(const r of rows){r.glyph.style.transform='none';r.glyph.style.opacity='0';}
    // Discrete glyphs at their original positions: no reverse flight, fade or
    // moving container. Several letters can share a frame on long passages.
    for(let i=visible;i<state.visible;i++)rows[i].glyph.style.opacity='1';visible=state.visible;
   }else if(state.phase==='take'||phase!=='hold')for(const r of rows){const p=sample(r.path,state.time);r.glyph.style.transform=`translate3d(${p.x}px,${p.y}px,0) rotate(${p.angle}rad) scale(${p.sx},${p.sy}) rotate(${-p.angle}rad) matrix3d(1,0,0,${p.wx},0,1,0,${p.wy},0,0,1,0,0,0,0,${p.w0})`;r.glyph.style.opacity=String(p.opacity);}
   phase=state.phase;layer.dataset.phase=phase;frame=root.requestAnimationFrame(tick);
  }
  active.set(element,entry);watch();frame=root.requestAnimationFrame(tick);return finished;
 }
 function bind(element,{copy,onSuccess=()=>{},onError=()=>{},shouldCopy=()=>true}){
  bindings.get(element)?.();let pending=false,disposed=false;const controller=new root.AbortController();element.classList.add('cursor-copy-target');
  async function run(event){if(disposed||pending||element.disabled||element.getAttribute('aria-disabled')==='true'||!shouldCopy(event))return;
   const point=origin(element,event);pending=true;let copied=false;try{await copy();copied=true;if(disposed||!element.isConnected)return;await onSuccess();if(!disposed)play(element,point);}catch(error){if(!disposed&&!copied)onError(error);else active.get(element)?.cancel();}finally{pending=false;}
  }
  element.addEventListener('click',run,{signal:controller.signal});element.addEventListener('keydown',event=>{if(element.tagName==='BUTTON'||element.tagName==='A'||event.target!==element||event.repeat||!['Enter',' '].includes(event.key))return;event.preventDefault();run(event);},{signal:controller.signal});
  const dispose=()=>{disposed=true;controller.abort();active.get(element)?.cancel();element.classList.remove('cursor-copy-target');bindings.delete(element);};bindings.set(element,dispose);return dispose;
 }
 return {bind,play,cancelAll,timing,timeline,typingDuration,typedCount,sample,path,graphemes,origin,collect,activeCount:()=>active.size};
});
