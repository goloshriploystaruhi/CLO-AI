// Small local combobox; keeps the existing profile value/change contract.
(()=>{
 const choices=[['unspecified','Не указан'],['female','Женский'],['male','Мужской']];
 function sex(value,onChange){
  const document=window.document,controller=new AbortController(),wrap=document.createElement('div'),button=document.createElement('button'),caption=document.createElement('span'),arrow=document.createElement('span'),menu=document.createElement('div');
  wrap.className='profile-choice';button.id='profile-sex';button.type='button';button.className='profile-choice-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-label','Пол');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','profile-sex-options');
  arrow.className='profile-choice-arrow';arrow.setAttribute('aria-hidden','true');button.append(caption,arrow);menu.id='profile-sex-options';menu.className='profile-choice-options';menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Пол');menu.hidden=true;wrap.append(button,menu);
  let active=0,opened=false,disposed=false,animation=null;
  const options=choices.map(([id,title],index)=>{const option=document.createElement('button');option.type='button';option.id='profile-sex-option-'+id;option.className='profile-choice-option';option.textContent=title;option.setAttribute('role','option');option.tabIndex=-1;option.addEventListener('pointerdown',e=>e.preventDefault(),{signal:controller.signal});option.addEventListener('click',()=>choose(index),{signal:controller.signal});menu.append(option);return option;});
  function paint(){const selected=Math.max(0,choices.findIndex(c=>c[0]===button.value));caption.textContent=choices[selected][1];options.forEach((option,index)=>{option.setAttribute('aria-selected',String(index===selected));option.dataset.active=String(opened&&index===active);});if(opened)button.setAttribute('aria-activedescendant',options[active].id);else button.removeAttribute('aria-activedescendant');}
  function close(focus=false){animation?.cancel();animation=null;opened=false;menu.hidden=true;button.setAttribute('aria-expanded','false');paint();if(focus&&!button.disabled&&button.isConnected)button.focus({preventScroll:true});}
  function open(){if(disposed||button.disabled)return;active=Math.max(0,choices.findIndex(c=>c[0]===button.value));opened=true;menu.hidden=false;button.setAttribute('aria-expanded','true');paint();
   if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){const style=getComputedStyle(document.documentElement);animation=menu.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0px)'}],{duration:parseFloat(style.getPropertyValue('--quiet-enter'))||200,easing:style.getPropertyValue('--quiet-easeIn').trim()||'cubic-bezier(0,0,.38,.9)'});}
  }
  function choose(index){if(button.disabled||disposed)return;const changed=button.value!==choices[index][0];button.value=choices[index][0];close(true);if(changed)button.dispatchEvent(new Event('change',{bubbles:true}));}
  button.value=choices.some(c=>c[0]===value)?value:'unspecified';button.onchange=()=>{if(!choices.some(c=>c[0]===button.value))button.value='unspecified';paint();onChange(button.value);};
  button.addEventListener('click',()=>opened?close():open(),{signal:controller.signal});
  button.addEventListener('keydown',e=>{if(button.disabled)return;if(e.key==='Escape'){if(opened){e.preventDefault();close(true);}return;}if(e.key==='Tab'){close();return;}
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const wasOpen=opened;if(!opened)open();if(e.key==='Home')active=0;else if(e.key==='End')active=choices.length-1;else if(wasOpen)active=(active+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;paint();}
   else if(opened&&['Enter',' '].includes(e.key)){e.preventDefault();choose(active);}
  },{signal:controller.signal});
  button.addEventListener('blur',()=>close(),{signal:controller.signal});
  document.addEventListener('pointerdown',e=>{if(opened&&!wrap.contains(e.target))close();},{capture:true,signal:controller.signal});
  document.addEventListener('scroll',()=>{if(opened)close();},{capture:true,passive:true,signal:controller.signal});
  window.addEventListener('resize',()=>close(),{signal:controller.signal});paint();
  return {element:wrap,close,dispose(){if(disposed)return;disposed=true;controller.abort();button.onchange=null;close();}};
 }
 window.ProfileControls={sex};
})();
