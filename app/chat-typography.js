(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ChatTypography=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 function size(text,width,measure,{maximum=48,minimum=16}={}){
  const flat=text.replace(/\r?\n/g,' '),total=measure(flat,maximum),estimate=Math.max(minimum,Math.min(maximum,total?maximum*width/total:maximum));
  // Canvas shaping need not scale exactly linearly at fractional font sizes.
  // Refine only an overflowing estimate; the minimum keeps normal soft wrap.
  if(estimate===minimum||measure(flat,estimate)<=width)return estimate;
  let low=minimum,high=estimate;for(let i=0;i<12;i++){const middle=(low+high)/2;if(measure(flat,middle)<=width)low=middle;else high=middle;}return low;
 }
 function trackingRatio(style){return (parseFloat(style.letterSpacing)||0)/(parseFloat(style.fontSize)||16);}
 function mount(input,composer){const canvas=document.createElement('canvas'),context=canvas.getContext('2d'),mirror=document.createElement('div'),host=composer.parentElement;let frame,stopped=false;
  mirror.setAttribute('aria-hidden','true');mirror.style.cssText='position:fixed;left:-10000px;top:0;height:auto;min-height:0;max-height:none;margin:0;border:0;box-sizing:border-box;visibility:hidden;pointer-events:none;';document.body.append(mirror);
  const pixels=value=>parseFloat(value)||0;
  function height(style,hasMessages){
   // maxHeight resolves the grid's calc() to actual CSS pixels. Parsing an
   // unregistered custom property directly would silently restore the old 192px.
   const layout=getComputedStyle(composer),maximum=pixels(layout.maxHeight)||pixels(layout.getPropertyValue('--composer-height'))||192;
   let target=maximum;
   if(hasMessages&&input.clientWidth>0){
    for(const name of ['fontFamily','fontWeight','fontSize','fontStyle','fontStretch','lineHeight','letterSpacing','fontKerning','fontFeatureSettings','fontVariantLigatures','tabSize','wordSpacing','whiteSpace','overflowWrap','wordBreak','paddingLeft','paddingRight','paddingTop','paddingBottom'])mirror.style[name]=style[name];
    mirror.style.width=input.clientWidth+'px';mirror.textContent=input.value+'\u200b';
    const rows=Array.from(composer.children).filter(n=>!n.hidden),chrome=pixels(layout.paddingTop)+pixels(layout.paddingBottom)+pixels(layout.borderTopWidth)+pixels(layout.borderBottomWidth)+pixels(layout.rowGap)*Math.max(0,rows.length-1)+rows.filter(n=>!n.contains(input)).reduce((sum,n)=>sum+n.getBoundingClientRect().height,0);
    const minimum=2*pixels(style.lineHeight)+pixels(style.paddingTop)+pixels(style.paddingBottom);
    target=Math.min(maximum,Math.ceil(chrome+Math.max(minimum,mirror.getBoundingClientRect().height)));
   }
   const value=target+'px';if(host.style.getPropertyValue('--composer-size')!==value)host.style.setProperty('--composer-size',value);
  }
  function fit(){const hasMessages=document.getElementById('history').children.length>0,hasText=!!input.value;composer.classList.toggle('has-messages',hasMessages);composer.classList.toggle('has-text',hasText);input.placeholder=hasMessages?'Можешь уточнить детали':'Что создадим\nсегодня?';
   const style=getComputedStyle(input),maximum=hasMessages?16:48,width=input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-4;
   const tracking=trackingRatio(style),measure=(text,px)=>{context.font=style.fontWeight+' '+px+'px '+style.fontFamily;if('letterSpacing'in context){context.letterSpacing=(tracking*px)+'px';return context.measureText(text).width;}return Math.max(0,context.measureText(text).width+(Array.from(text).length-1)*(tracking*px));};
   const lines=input.value.split('\n').length,available=input.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
   if(width<=0||available<=0)return;
   const px=Math.max(16,Math.min(size(input.value,width,measure,{maximum,minimum:16}),hasText?available/lines:maximum));input.style.fontSize=px+'px';input.style.lineHeight=Math.max(pixels(style.getPropertyValue('--input-leading'))||20,px)+'px';
   height(getComputedStyle(input),hasMessages);
   // Native caret scrolling may survive a previous wrap. Clear it only when
   // the content fits; preserve caret/scroll behaviour for long multiline text.
   if(!hasText||(lines===1&&measure(input.value,px)<=width)){input.scrollLeft=0;if(!hasText||input.scrollHeight<=input.clientHeight)input.scrollTop=0;}
  }
  const schedule=()=>{if(stopped)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
  // Fit the new value before the browser paints it at the previous size. A
  // delayed fit or font-size transition briefly wraps it and moves the caret.
  const onInput=()=>{if(stopped)return;cancelAnimationFrame(frame);fit();};
  input.style.whiteSpace='pre-wrap';input.wrap='soft';input.addEventListener('input',onInput);document.fonts.ready.then(schedule);const mutations=new MutationObserver(schedule),resize=new ResizeObserver(schedule);mutations.observe(document.getElementById('history'),{childList:true});resize.observe(input);window.addEventListener('section-open',schedule);
  function dispose(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);mutations.disconnect();resize.disconnect();mirror.remove();host.style.removeProperty('--composer-size');input.removeEventListener('input',onInput);window.removeEventListener('section-open',schedule);window.removeEventListener('pagehide',dispose);}
  window.addEventListener('pagehide',dispose);schedule();return {fit:schedule,dispose};
 }
 return {size,mount,trackingRatio};
});
