(()=>{
 const {$,node,api,notice}=UI;let creating=false,authBusy=false,sharing=false,canDisconnect=false,historyLoaded=false,sessionKnown=false,bridgeKnown=false,cloConnected=false,modelReady=false,checkingBridge=false,checkingSession=false,sessionTask=null;
 const history=$('history');let attached=[],pollingDialogue=false,requestStarted=0;const questionPanels=new Map();
 const removingReferences=new Set();
 let currentProject=null,projectTask=null,requestSerial=0,composing=false,assembling=false,lastRecoveredResult=null;const assemblyTasks=new Set();
 let authError='',bridgeNotice='',model='',modelError='',pickingReferences=false,workspaceVisible=false,authSerial=0,lastAuthStart=-Infinity;const typography=ChatTypography.mount($('text'),$('composer'));
 function availability(){
  const blocked=pickingReferences||creating||assembling||!currentProject?.available;
  $('send').disabled=!historyLoaded||!currentProject?.available||creating||assembling||authBusy||!sharing||!modelReady||(!$('text').value.trim()&&!attached.length);
  const hasReferences=attached.length>0||removingReferences.size>0;
  $('attach-reference').disabled=blocked;$('attach-reference').hidden=hasReferences;$('reference-strip').hidden=!hasReferences;$('add-reference').disabled=blocked||attached.length>=4;
  $('composer').classList.toggle('has-references',hasReferences);
  $('reauth-chatgpt').disabled=authBusy||checkingSession||creating||assembling;
  const banner=$('chat-notice');banner.replaceChildren();const recoveryWarning=currentProject?.recovery_warning;const msg=recoveryWarning||(sharing&&!modelReady&&!checkingSession?(modelError||'Не удалось получить модели ChatGPT.'):'');
  banner.hidden=!msg;if(msg){banner.append(node('span',msg));const b=node('button','Повторить');b.id=recoveryWarning?'retry-project':'retry-models';b.onclick=recoveryWarning?()=>syncProject():()=>refresh(true);banner.append(b);}
  $('auth-screen').hidden=sharing;$('bridge-screen').hidden=!sharing||(cloConnected&&!!currentProject?.available);$('workspace').hidden=!sharing||!cloConnected||!currentProject?.available;
  if(workspaceVisible!==!$('workspace').hidden){workspaceVisible=!$('workspace').hidden;if(!workspaceVisible)api('measurement-help-close').catch(()=>{});}
  // Keep sign-in retryable while the browser is waiting for an OAuth callback.
  $('auth-connect').disabled=!sessionKnown||creating||assembling;$('auth-connect').setAttribute('aria-busy',String(authBusy));$('auth-connect').title=authBusy?'Если вход не завершился, нажмите ещё раз, чтобы открыть его заново.':'';notice($('auth-notice'),authError);
  $('bridge-copy').disabled=!bridgeKnown;notice($('bridge-notice'),bridgeNotice);
  typography.fit();
 }
 function operation(text,state='pending'){const n=$('operation');n.hidden=!text;n.textContent=text;n.dataset.state=state;}
 function nearEnd(){return history.scrollHeight-history.scrollTop-history.clientHeight<55;}
 function latest(){history.scrollTop=history.scrollHeight;$('latest').hidden=true;}
 history.onscroll=()=>{$('latest').hidden=nearEnd();};$('latest').onclick=latest;
 function richText(parent,text){UIChatRenderer.render(parent,text);}
 function log(text,kind='assistant',details,detailTitle,meta={}){
  const follow=nearEnd(),animate=meta.animate!==false&&['assistant','success'].includes(kind);$('chat-empty')?.remove();const article=node('article',undefined,'message message-'+kind+(animate?' message-typewriter':'')),header=node('div',undefined,'message-header'),body=node('div',undefined,'message-body');
  header.append(node('span',({user:'Ты',error:'Не получилось',success:'Результат',assistant:'CLO AI'})[kind]||'CLO AI'));richText(body,text);body.classList.add('copyable');body.tabIndex=0;body.setAttribute('role','button');body.setAttribute('aria-label','Скопировать сообщение');body.title='Нажми, чтобы скопировать';
  const feedback=node('span',undefined,'sr-only');feedback.setAttribute('role','status');
  UI.bindCopy(body,{copy:()=>api('copy-text',text),shouldCopy:e=>e.type==='keydown'||(!e.target.closest('a')&&!window.getSelection()?.toString()),onSuccess:()=>{feedback.textContent='Сообщение скопировано';},onError:()=>{feedback.textContent='Не удалось скопировать сообщение';}});
  article.append(header);if(meta.references)UIChatRenderer.references(article,meta.references,currentProject?.session_id);article.append(body,feedback);
  if(details&&detailTitle&&detailTitle!=='Технические данные'){const d=node('details'),s=node('summary',detailTitle),pre=node('pre',typeof details==='string'?details:JSON.stringify(details,null,2));d.append(s,pre);article.append(d);}
  history.append(article);if(meta.question)renderQuestion(article,meta.question);if(follow||kind==='user')latest();else $('latest').hidden=false;
  if(animate)ChatTyping.reveal(body,{from:meta.typingFrom});return article;
 }
 function emptyProject(){
  history.replaceChildren();typography.fit();
 }
 function syncProject(){
  if(projectTask)return projectTask;
  projectTask=(async()=>{
   const next=await api('project-state'),changedSession=next.session_id!==currentProject?.session_id,invalidated=currentProject&&next.generation!==currentProject.generation;
   currentProject=next;
   if(changedSession||invalidated){++requestSerial;creating=false;assemblyTasks.clear();assembling=false;$('composer').removeAttribute('aria-busy');operation('');}
   if(changedSession){
    historyLoaded=false;attached=[];renderReferences();questionPanels.clear();$('text').value='';notice($('edit-context'),'');$('latest').hidden=true;emptyProject();
    window.dispatchEvent(new CustomEvent('workspace-changed',{detail:{project_session:next.session_id}}));
   }
   if(changedSession||next.available&&next.recovered_native_result&&next.recovered_native_result!==lastRecoveredResult){
    const session=next.session_id,follow=nearEnd(),scrollTop=history.scrollTop;
    const messages=await api('chat-history',{session_id:session});
    if(currentProject.session_id!==session)return;
    if(messages.length){history.replaceChildren();for(const m of messages){const article=log(m.text,m.kind||m.role,m.details,m.detailTitle,{...m,animate:false});if(m.assembly_offer)UIAssembly.offer(article,m.assembly_offer);}}
    historyLoaded=true;lastRecoveredResult=next.recovered_native_result||null;if(follow)latest();else history.scrollTop=scrollTop;
   }
  })().catch(e=>{notice($('chat-notice'),'Не удалось прочитать проект. '+e.message,true);}).finally(()=>{projectTask=null;availability();});
  return projectTask;
 }
 async function bridge(){
  if(checkingBridge)return;checkingBridge=true;try{const s=await api('bridge');bridgeKnown=true;cloConnected=!!s.connected&&!s.update_error;bridgeNotice=s.update_error?'Не удалось обновить мост. Скопируйте команду и выполните её в консоли CLO.':'';return s;}catch{cloConnected=false;bridgeKnown=true;bridgeNotice='Не удалось проверить CLO. Скопируйте команду и подключите мост повторно.';}finally{checkingBridge=false;availability();}
 }
 function refresh(forceModels=false){
  if(sessionTask)return sessionTask;checkingSession=true;availability();
  sessionTask=(async()=>{try{
   const s=await api('session'),wasSharing=sharing;sessionKnown=true;sharing=!!s.sharing;authError='';canDisconnect=sharing||!!s.profileId||['connected','reauth_required'].includes(s.status);
   if(s.error&&!sharing)authError=UIFormat.errorText(s.error);else if(!sharing&&s.status==='connected')authError='Разрешите использование подписки при подключении ChatGPT.';
   if(sharing&&(!wasSharing||forceModels||!modelReady)){
    try{const models=await api('models');model=(models.find(m=>m.slug===model)||models.find(m=>m.slug==='gpt-6.1-sol')||models[0])?.slug||'';modelReady=!!model;modelError=modelReady?'':'Для этого подключения нет доступных моделей.';if(!modelReady)return {ok:false};}
    catch(e){modelReady=false;modelError=e.message;return {ok:false,message:e.message};}
   }
   if(!sharing){modelReady=false;model='';modelError='';}return {ok:true};
  }catch(e){modelReady=false;sessionKnown=true;authError=e.message;return {ok:false,message:e.message};}
  finally{checkingSession=false;sessionTask=null;availability();}})();return sessionTask;
 }
 UI.bindCopy($('bridge-copy'),{copy:()=>api('bridge-command'),onSuccess:()=>{bridgeNotice='';availability();},onError:e=>{bridgeNotice=e.message;availability();}});
 async function auth(method='signin'){
  if(creating||assembling||(authBusy&&(method!=='signin'||performance.now()-lastAuthStart<400)))return;
  const serial=++authSerial,restart=authBusy;lastAuthStart=performance.now();authBusy=true;authError='';notice($('reauth-error'),'');availability();
  try{
   if(sessionTask)await sessionTask;
   if(serial!==authSerial)return;
   if(method==='reauth'&&canDisconnect){await api('signout');sharing=false;modelReady=false;model='';availability();}
   await api('signin',{restart});if(serial!==authSerial)return;await refresh(true);
  }catch(e){if(serial!==authSerial)return;authError=e.message;if(sharing)notice($('reauth-error'),e.message,true);}
  finally{if(serial===authSerial){authBusy=false;availability();}}
 }
 $('auth-connect').onclick=()=>auth();$('reauth-chatgpt').onclick=()=>auth('reauth');
 function changed(){window.dispatchEvent(new Event('profiles-changed'));window.dispatchEvent(new Event('workspace-changed'));}
 async function create(test=false,retryText=null,choice=null){
  if(creating||assembling||!historyLoaded||!currentProject?.available)return;const raw=choice?.action.label??retryText??$('text').value,text=raw.trim()||(attached.length?'Прикрепляю референс. Помоги определить, какие детали описать словами.':'');if(!test&&!text)return;
  if(!test&&!['approve_proposal','continue_draft'].includes(choice?.action.type)&&(!sharing||!modelReady)){refresh(true);return;}
  const serial=++requestSerial,session=currentProject.session_id,isCurrent=()=>serial===requestSerial&&session===currentProject?.session_id;
  creating=true;requestStarted=Date.now();availability();$('composer').setAttribute('aria-busy','true');
  const sentReferences=!choice&&retryText===null?[...attached]:[];
  if(test){UI.navigate('chat');log('Создать тестовую деталь 400 × 600 мм','user');}else log(text,'user',undefined,undefined,{references:sentReferences});
  if(!test&&!choice&&retryText===null)$('text').value='';$('text').focus({preventScroll:true});availability();
  let submitted=false,jobId;
  try{
   operation(test?'Готовлю тестовую деталь…':'Ожидаю ответ AI…');
   const refs=sentReferences.map(r=>r.id);const job=await api(choice?'interactive-action':'create',choice?{id:choice.action.id,question_id:choice.question.id,project_session:session,model}:{test,text,references:refs,project_session:session,model});
   attached=attached.filter(r=>!refs.includes(r.id));renderReferences();
   if(job.cancelled){await syncProject();return;}if(!isCurrent())return;
   if(job.message){const article=log(UIFormat.readable(job.message),'assistant',undefined,undefined,job);if(job.assembly_offer)UIAssembly.offer(article,job.assembly_offer);operation('Ответ получен.');$('operation').dataset.state='neutral';changed();return;}
   if(job.chat_notice)log(job.chat_notice,'assistant',job.chat_details,'Принятые допущения');
   jobId=job.id;
   if(!job.id)throw Error('Не получена команда для CLO. Попробуйте уточнить запрос.');
   await bridge();await syncProject();if(!isCurrent())return;if(!cloConnected)throw Error('Подключите мост командой на стартовом экране и повторите запрос. Детали ещё не отправлены.');
   if(job.replace_target||job.replace_targets?.length||job.operation==='delete'){
    const question=UIFormat.replacementQuestion(job);
    if(!window.confirm(question)){operation('Изменение не применено.','neutral');return;}
    await api('confirm-replacement',{id:job.id,confirmed:true});
   }
   operation('Передаю детали в CLO…');await api('apply',job.id);submitted=true;operation('Проверяю результат в CLO…');
   const deadline=Date.now()+600000;
   while(Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,500));if(!isCurrent())return;const result=await api('result');
    if(result?.id!==job.id)continue;
    if(!isCurrent()||result?.cancelled)return;
    const summary=UIFormat.resultSummary(result,job);const article=log(summary.text,summary.kind,undefined,undefined,{execution_events:result.execution_events,question:result.question});
    if(result.assembly_offer)UIAssembly.offer(article,result.assembly_offer);
    if(summary.kind==='error'&&!test&&!submitted)addRetry(article,raw,isCurrent);
    operation(summary.kind==='success'?'Операция завершена.':'Операция не завершена.',summary.kind);changed();return;
   }
   throw Error('CLO не подтвердил результат за 10 минут. Проверьте проект перед повторной отправкой: операция могла выполниться.');
  }catch(e){if(!isCurrent())return;const article=log(e.message,'error',e.details,'Диагностика подключения',{question:e.question,execution_events:e.execution_events});if(!test&&!submitted&&!choice)addRetry(article,raw,isCurrent);if(!test&&e.stage!=='create'&&!e.recorded)await api('chat-error',{id:jobId||String(Date.now()),text:e.message,session_id:session}).catch(()=>{});operation(submitted?'Результат не подтверждён. Проверьте проект CLO.':'Операция не выполнена.', 'error');if(choice)throw e;}
  finally{if(isCurrent()){creating=false;$('composer').removeAttribute('aria-busy');availability();}}
 }
 function renderQuestion(article,question){
  const old=questionPanels.get(question.id);old?.remove();questionPanels.delete(question.id);
  const panel=UIChatRenderer.question(article,question,chooseQuestion);if(panel)questionPanels.set(question.id,panel);
 }
 async function chooseQuestion(question,action){
  if(creating||assembling)throw Error('Дождись текущей операции');
  if(action.type==='open_profiles'){
   const result=await api('interactive-action',{id:action.id,question_id:question.id,project_session:currentProject.session_id});
   if(result.navigate){log(action.label,'user');UI.navigate(result.navigate);}return;
  }
  await create(false,null,{question,action});
 }
 async function pollDialogue(){
  if(pollingDialogue||!currentProject?.available)return;pollingDialogue=true;const session=currentProject.session_id,serial=requestSerial;
  try{const state=await api('dialogue-status',{session_id:session});if(state.cancelled||session!==currentProject?.session_id||serial!==requestSerial)return;
   const active=new Map((state.questions||[]).map(q=>[q.id,q]));for(const [id,panel]of questionPanels){if(!panel.isConnected||!UIChatRenderer.reconcileQuestion(panel,active.get(id),{busy:creating||assembling}))questionPanels.delete(id);}
   if(!creating||state.started_at<requestStarted||!state.operation_id)return;
   const status=UIFormat.operationStatus(state.events);if(status)operation(status.text,status.state);
  }catch{}finally{pollingDialogue=false;}
 }
 function renderReferences(){
  for(const row of removingReferences)for(const animation of row.getAnimations())animation.cancel();removingReferences.clear();
  const offset=$('reference-scroll').scrollLeft;$('reference-list').replaceChildren();for(const ref of attached){const row=node('div',undefined,'reference-preview'),image=node('img'),remove=node('button','×');image.alt=ref.name;remove.type='button';remove.setAttribute('aria-label','Убрать '+ref.name);remove.onclick=()=>removeReference(ref,row,remove);row.append(image,remove);$('reference-list').append(row);api('reference-image',{id:ref.id,project_session:currentProject?.session_id}).then(r=>{if(row.isConnected&&/^data:image\/(png|jpeg);base64,/.test(r.data_url||''))image.src=r.data_url;}).catch(()=>{image.alt='Не удалось загрузить '+ref.name;});}
  requestAnimationFrame(()=>{$('reference-scroll').scrollLeft=offset;referenceFade();});
 }
 async function removeReference(ref,row,button){
  if(removingReferences.has(row)||!attached.some(r=>r.id===ref.id))return;
  const session=currentProject?.session_id,focused=document.activeElement===button,width=row.getBoundingClientRect().width,gap=parseFloat(getComputedStyle($('reference-list')).columnGap)||0;
  attached=attached.filter(r=>r.id!==ref.id);removingReferences.add(row);row.dataset.removing='true';button.disabled=true;availability();
  try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await row.animate([
   {width:width+'px',marginRight:'0px',opacity:1,transform:'translateY(0) scale(1)'},
   {offset:.55,width:width*.35+'px',marginRight:-gap*.65+'px',opacity:0,transform:'translateY(3px) scale(.94)'},
   {width:'0px',marginRight:-gap+'px',opacity:0,transform:'translateY(3px) scale(.94)'}
  ],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}).finished;}catch{}
  finally{row.remove();removingReferences.delete(row);if(currentProject?.session_id===session){availability();referenceFade();if(focused&&(document.activeElement===button||document.activeElement===document.body)){
   const next=$('reference-list').querySelector('button:not(:disabled)')||(attached.length?$('add-reference'):$('attach-reference'));next.focus({preventScroll:true});
  }}}
 }
 async function pickReferences(){if(pickingReferences)return;if(attached.length>=4){log('К сообщению можно добавить не больше четырёх референсов.');return;}const session=currentProject?.session_id;pickingReferences=true;availability();try{const result=await api('pick-reference',{project_session:session,multiple:true,remaining:4-attached.length});if(!result.cancelled&&session===currentProject?.session_id){const picked=result.references||[result];if(attached.length+picked.length>4)throw Error('К сообщению можно добавить не больше четырёх референсов');attached.push(...picked);renderReferences();requestAnimationFrame(()=>{$('reference-scroll').scrollLeft=$('reference-scroll').scrollWidth;referenceFade();});}}catch(e){if(session===currentProject?.session_id)log(e.message,'error');}finally{pickingReferences=false;availability();}};
 $('attach-reference').onclick=$('add-reference').onclick=pickReferences;
 const referenceScroll=$('reference-scroll');
 function referenceFade(){const end=Math.max(0,referenceScroll.scrollWidth-referenceScroll.clientWidth);$('reference-strip').style.setProperty('--fade-left',referenceScroll.scrollLeft>1?'18px':'0px');$('reference-strip').style.setProperty('--fade-right',referenceScroll.scrollLeft<end-1?'18px':'0px');}
 referenceScroll.addEventListener('scroll',referenceFade);const referenceResize=new ResizeObserver(referenceFade);referenceResize.observe(referenceScroll);referenceResize.observe($('reference-list'));
 referenceScroll.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<=Math.abs(e.deltaX)||referenceScroll.scrollWidth<=referenceScroll.clientWidth)return;const previous=referenceScroll.scrollLeft;referenceScroll.scrollLeft+=e.deltaY*(e.deltaMode===1?24:e.deltaMode===2?referenceScroll.clientWidth:1);if(referenceScroll.scrollLeft!==previous)e.preventDefault();},{passive:false});
 referenceScroll.addEventListener('keydown',e=>{if(e.target!==referenceScroll)return;const steps={ArrowLeft:-54,ArrowRight:54,Home:-referenceScroll.scrollWidth,End:referenceScroll.scrollWidth};if(steps[e.key]!==undefined){e.preventDefault();referenceScroll.scrollLeft+=steps[e.key];}});
 setInterval(pollDialogue,500);
 function addRetry(article,text){const session=currentProject.session_id,b=node('button','Повторить','retry-message');b.type='button';b.onclick=()=>{if(currentProject?.available&&currentProject.session_id===session&&!creating&&!assembling&&sharing&&modelReady){b.remove();create(false,text);}};article.append(b);}
 window.addEventListener('assembly-busy',e=>{if(e.detail.busy)assemblyTasks.add(e.detail.id);else assemblyTasks.delete(e.detail.id);assembling=assemblyTasks.size>0;availability();});
 window.addEventListener('assembly-offer',e=>{UI.navigate('chat');UIAssembly.offer(log('Проверка сборки изделия в 3D.'),e.detail);});
 $('composer').onsubmit=e=>{e.preventDefault();if(!composing)create();};$('text').oninput=availability;
 $('text').addEventListener('compositionstart',()=>{composing=true;});$('text').addEventListener('compositionend',()=>{composing=false;});
 $('text').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&e.keyCode!==229){e.preventDefault();if(!e.repeat)create();}};
 document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('text').value=b.dataset.prompt;availability();$('text').focus();});
 window.addEventListener('edit-in-ai',e=>{UI.navigate('chat');$('text').value=e.detail.text;notice($('edit-context'),'Редактирование: '+e.detail.name);const b=node('button','Скрыть');b.onclick=()=>notice($('edit-context'),'');$('edit-context').append(b);availability();$('text').focus();});
 syncProject();refresh();bridge();setInterval(()=>{bridge();syncProject();},1500);setInterval(()=>{if(!authBusy)refresh();},15000);window.addEventListener('focus',()=>{if(!authBusy)refresh();bridge();syncProject();});
})();
