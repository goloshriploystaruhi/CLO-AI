// Shared edge fades for the existing scroll surfaces, including the guide window.
(()=>{
 const document=window.document,selector='textarea,pre,.history,.scroll-page,#profiles-root,#editor-fields,.dialog-body,.operation',tracked=new Set();let frame=0,stopped=false;
 const resize=new ResizeObserver(schedule);
 function schedule(){if(!stopped&&!frame)frame=requestAnimationFrame(refresh);}
 function refresh(){frame=0;const candidates=new Set(document.querySelectorAll(selector));if(document.scrollingElement)candidates.add(document.scrollingElement);
  for(const node of candidates){const root=node===document.scrollingElement;if(!root&&!/auto|scroll/.test(getComputedStyle(node).overflowY))continue;
   if(!tracked.has(node)){tracked.add(node);resize.observe(node);node.classList.add('scroll-fade');}
   const height=root?window.innerHeight:node.clientHeight,remaining=Math.max(0,node.scrollHeight-height-node.scrollTop),amount=height>0&&remaining>1?Math.min(24,remaining,height/4):0;
   const value=amount.toFixed(2)+'px';if(node.style.getPropertyValue('--scroll-fade-bottom')!==value)node.style.setProperty('--scroll-fade-bottom',value);
   const hidden=amount>0?'true':'false';if(node.dataset.fadeBottom!==hidden)node.dataset.fadeBottom=hidden;
   const top=height>0&&node.scrollTop>1?Math.min(24,node.scrollTop,height/4):0,topValue=top.toFixed(2)+'px';if(node.style.getPropertyValue('--scroll-fade-top')!==topValue)node.style.setProperty('--scroll-fade-top',topValue);
   const topHidden=top>0?'true':'false';if(node.dataset.fadeTop!==topHidden)node.dataset.fadeTop=topHidden;
  }
  for(const node of tracked)if(!node.isConnected||!candidates.has(node)){resize.unobserve(node);tracked.delete(node);node.classList.remove('scroll-fade');delete node.dataset.fadeBottom;delete node.dataset.fadeTop;node.style.removeProperty('--scroll-fade-bottom');node.style.removeProperty('--scroll-fade-top');}
 }
 const observer=new MutationObserver(records=>{if(records.some(r=>!r.target.parentElement?.closest('.cursor-suction-layer')))schedule();});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','open']});
 document.addEventListener('scroll',schedule,true);document.addEventListener('input',schedule,true);document.addEventListener('transitionend',schedule,true);document.addEventListener('toggle',schedule,true);window.addEventListener('resize',schedule);window.addEventListener('section-open',schedule);
 window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();},{once:true});schedule();
})();
