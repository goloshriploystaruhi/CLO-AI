(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UIChatRenderer=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 function inline(parent,text,ui){
  const {node}=ui;let cursor=0;const pattern=/\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([^\]\n]+)\]\((https:\/\/[^\s)]+|clo-artifact:\/\/[a-f0-9-]{36})\)/g;
  for(const m of text.matchAll(pattern)){
   if(m.index>cursor)parent.append(node('span',text.slice(cursor,m.index)));
   if(m[1])parent.append(node('strong',m[1]));else if(m[2])parent.append(node('code',m[2]));else{
    const a=node('a',m[3]);a.href=m[4];a.title=m[4];a.onclick=e=>{e.preventDefault();ui.api?.('open-link',m[4]).catch(()=>{});};parent.append(a);
   }cursor=m.index+m[0].length;
  }
  if(cursor<text.length)parent.append(node('span',text.slice(cursor)));
 }
 function render(parent,text,ui=globalThis.UI){
  const {node}=ui;parent.replaceChildren();let paragraph=[],list=null,listKind=null,code=null;
  function flush(){if(paragraph.length){const p=node('p');paragraph.forEach((s,i)=>{if(i)p.append(node('br'));inline(p,s,ui);});parent.append(p);paragraph=[];}}
  for(const line of String(text).replace(/\r/g,'').split('\n')){
   if(/^```/.test(line)){flush();list=null;if(code){parent.append(node('pre',code.join('\n')));code=null;}else code=[];continue;}
   if(code){code.push(line);continue;}
   const heading=line.match(/^#{1,3}\s+(.+)/),item=line.match(/^\s*(?:([-*•])\s+|(\d+)[.)]\s+)(.*)/);
   if(heading){flush();list=null;const h=node('h3');inline(h,heading[1],ui);parent.append(h);}
   else if(item){flush();const kind=item[2]?'ol':'ul';if(!list||kind!==listKind){list=node(kind);if(item[2])list.setAttribute('start',item[2]);parent.append(list);listKind=kind;}const li=node('li');inline(li,item[3],ui);list.append(li);}
   else{list=null;if(!line.trim())flush();else paragraph.push(line);}
  }
  flush();if(code)parent.append(node('pre',code.join('\n')));return parent;
 }
 function activeActions(q){return q?.status==='active'&&Array.isArray(q.actions)?q.actions.filter(a=>a.active===true&&a.status==='active'):[];}
 function reconcileQuestion(group,q,{busy=false}={}){
  const active=new Map(activeActions(q).map(a=>[a.id,a]));
  if(!active.size){group.remove();return false;}
  const selecting=group.dataset.busy==='true';group.hidden=selecting;
  for(const button of Array.from(group.children)){
   if(!button.dataset.actionId)continue;
   if(!active.has(button.dataset.actionId)){button.remove();continue;}
   button.disabled=busy||selecting;
  }
  return true;
 }
 function question(parent,q,choose,ui=globalThis.UI){
  const actions=activeActions(q);if(!actions.length)return;
  const {node}=ui,group=node('div',undefined,'chat-actions');group.dataset.questionId=q.id;group.setAttribute('role','group');group.setAttribute('aria-label','Варианты ответа');
  for(const a of actions){const b=node('button',a.label);b.type='button';b.dataset.actionId=a.id;b.dataset.actionType=a.type;b.dataset.status=a.status;
   b.onclick=()=>{
    if(b.disabled||group.dataset.busy==='true')return;
    for(const button of group.children)button.disabled=true;group.dataset.busy='true';group.hidden=true;b.dataset.status='running';b.setAttribute('aria-busy','true');
    return Promise.resolve().then(()=>choose(q,a)).then(()=>{group.remove();},error=>{
     // A transport failure before acceptance can be retried. A later poll
     // still removes the group if the server consumed or cancelled it.
     group.hidden=false;for(const button of group.children)if(button.dataset.actionId){button.disabled=false;button.dataset.status='active';}
     group.append(node('p',error.message,'error'));
    }).finally(()=>{group.dataset.busy='false';b.setAttribute('aria-busy','false');});
   };group.append(b);
  }parent.append(group);return group;
 }
 async function references(parent,refs,session,ui=globalThis.UI){
  if(!refs?.length)return;const {node,api}=ui,group=node('div',undefined,'chat-references');parent.append(group);
  for(const ref of refs){const figure=node('figure'),caption=node('figcaption',ref.name);group.append(figure);figure.append(caption);
   try{const r=await api('reference-image',{id:ref.id,project_session:session});if(!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(r.data_url||''))throw Error('Недоступный формат');
    const img=node('img');img.src=r.data_url;img.alt=ref.name;img.loading='lazy';img.tabIndex=0;img.setAttribute('role','button');img.title='Открыть '+ref.name;const open=()=>{if(!ui.editor)return;const full=node('img');full.src=r.data_url;full.alt=ref.name;full.className='reference-full';ui.editor(ref.name,[full],async()=>{},{save:'Закрыть'});};img.onclick=open;img.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};figure.append(img);
   }catch{caption.textContent=ref.name+' · Изображение сейчас недоступно';}
  }return group;
 }
 return {render,inline,question,reconcileQuestion,references};
});
