(()=>{
 const $=id=>document.getElementById(id);
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function updateTabActions(){for(const b of document.querySelectorAll('[data-tab]'))b.setAttribute('aria-disabled',String(b.getAttribute('aria-selected')==='true'&&b.dataset.reselect!=='true'));}
 function tabReselect(name,enabled){const b=document.querySelector('[data-tab="'+name+'"]');if(b){b.dataset.reselect=String(enabled);updateTabActions();}}
 function navigate(name,focus=false){
  const host=$('page-chat').parentElement;
  return QuietReveal.transition(host,()=>{
  for(const b of document.querySelectorAll('[data-tab]')){const active=b.dataset.tab===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('page-'+b.dataset.tab).hidden=!active;if(active&&focus)b.focus();}
  updateTabActions();window.dispatchEvent(new CustomEvent('section-open',{detail:name}));
  },{key:name,targets:()=>[...$('page-'+name).children]});
 }
 document.querySelectorAll('[data-tab]').forEach(b=>{b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true')return;if(b.getAttribute('aria-selected')==='true')window.dispatchEvent(new CustomEvent('section-reselect',{detail:b.dataset.tab}));else navigate(b.dataset.tab);};b.onkeydown=e=>{const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();navigate(tabs[next].dataset.tab,true);}};});updateTabActions();
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
 let saving=false,onSubmit;
 for(const id of ['editor-close','editor-cancel'])$(id).onclick=()=>{if(!saving)$('editor').close();};
 $('editor').addEventListener('cancel',e=>{if(saving)e.preventDefault();});
 $('editor-form').onsubmit=async e=>{e.preventDefault();if(saving)return;saving=true;for(const id of ['editor-save','editor-close','editor-cancel'])$(id).disabled=true;$('editor-error').hidden=true;try{await onSubmit();$('editor').close();}catch(err){$('editor-error').textContent=err.message;$('editor-error').hidden=false;}finally{saving=false;for(const id of ['editor-save','editor-close','editor-cancel'])$(id).disabled=false;}};
 function editor(title,fields,submit,{save='Сохранить',danger=false}={}){
  if($('editor').open)return;
  $('editor-title').textContent=title;$('editor-fields').replaceChildren(...fields);$('editor-save').textContent=save;$('editor-save').className=danger?'danger':'primary';$('editor-error').hidden=true;onSubmit=submit;$('editor').showModal();
 }
 function field(label,value='',{type='text',hint='',options,required=false}={}){const wrap=node('label',undefined,'field'),caption=node('span',label),input=node(options?'select':type==='textarea'?'textarea':'input');if(!options&&type!=='textarea')input.type=type;if(options)for(const [v,t] of options){const o=node('option',t);o.value=v;input.append(o);}input.value=value??'';input.required=required;wrap.append(caption,input);if(hint)wrap.append(node('span',hint,'hint'));return {wrap,input};}
 async function api(method,args){const r=await window.clo.call(method,args);
  // SDK sessions can contain a diagnostic from an earlier request. This is not an IPC failure.
  const session=['session','signin','signout'].includes(method)&&typeof r?.status==='string'&&typeof r?.sharing==='boolean'&&!r.stage;
  if(r?.error&&!session){const detail=typeof r.error==='string'?{message:r.error,code:r.code,status:r.status,param:r.param,retryable:r.retryable}:r.error;const err=Error(UIFormat.errorText(detail));err.code=detail.code;err.status=detail.status;err.param=detail.param;err.details=r.diagnostics;err.stage=r.stage;err.retryable=detail.retryable;err.question=r.question;err.execution_events=r.execution_events;err.recorded=method==='result';throw err;}return r;
 }
 function notice(target,text,error=false){target.textContent=text;target.hidden=!text;target.classList.toggle('error',error);}
 const bindCopy=(element,options)=>CursorSuction.bind(element,options);
 QuietReveal.prime($('page-chat').parentElement,'chat');
 window.UI={$,node,navigate,editor,field,api,notice,tabReselect,bindCopy,reveal:QuietReveal.transition};
})();
