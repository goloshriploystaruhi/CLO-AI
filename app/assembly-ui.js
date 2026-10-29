(()=>{
 const {node,api}=UI;
 const proposals=new Map();
 function offer(parent,proposal){
  if(!proposal||!parent?.isConnected)return;const panel=node('section',undefined,'assembly-offer'),text=node('p','Лекала «'+proposal.name+'», версия '+proposal.version+'. Открыть карту сборки?'),hint=node('p','Сшивание выполняется вручную в CLO. Плагин проверит комплект, карту соединений и наличие аватара. Швы и размещение не будут изменены.','muted'),actions=node('div',undefined,'button-row'),check=node('button','Проверить карту в CLO'),leave=node('button','Оставить лекала'),status=node('p');status.setAttribute('role','status');actions.append(check,leave);panel.append(text,hint,actions,status);parent.append(panel);
  let busy=false,retired=false;
  if(proposal.garment_id){const previous=proposals.get(proposal.garment_id);if(previous&&previous.id!==proposal.id)previous.retire();proposals.set(proposal.garment_id,{id:proposal.id,retire(){retired=true;if(panel.isConnected){for(const b of panel.querySelectorAll('button'))b.disabled=true;status.textContent='Открой последнее предложение карты сборки в чате.';}}});}
  function display(report){
   status.textContent=report.text;status.classList.remove('error');actions.replaceChildren();for(const old of panel.querySelectorAll('.sewing-map,.legacy-map'))old.remove();
   if(report.sewing_map)UISewingMap.render(panel,report.sewing_map);
     if(report.status==='unavailable'){
      if(!report.sewing_map){const map=node('details',undefined,'legacy-map'),summary=node('summary','Карта соединений для ручной сборки'),list=node('ol');
      for(const seam of report.sewing_graph||[]){const ends=seam.ends.map(e=>e.name+' ['+e.segment_ids.map(s=>s.split('/').at(-1)).join(', ')+'] '+UIFormat.num(e.length_mm)+' мм');list.append(node('li',ends.join(' ↔ ')+'; направление '+(seam.direction==='same'?'одинаковое':'встречное')+'; допуск '+seam.tolerance_mm+' мм'));}
      map.append(summary,node('p','Сшивайте по линиям стачивания, не по внешнему срезу припуска. Сверяйте контрольные метки. После швов разместите передние детали перед аватаром, задние — позади, рукава — возле рук. Это ручные действия.','muted'),list);panel.append(map);}
      if(report.capabilities?.simulate_callable&&report.avatar_count>0){const simulate=node('button','Симуляция после ручной сборки');simulate.onclick=()=>{if(window.confirm('Подтверждаю: я вручную сшил и разместил детали этой версии на аватаре.\nРазрешаю 100 шагов симуляции всей текущей сцены CLO. Перед запуском сохранится резервная копия. Посадку потребуется проверить отдельно.'))run('simulate',true);};actions.append(simulate);}
      else if(report.avatar_count===0)panel.append(node('p','Добавь аватар в CLO. Затем попроси в чате открыть карту сборки этого изделия.','muted'));
     }
  }
  async function run(action,manual=false){
   if(busy||retired||!panel.isConnected)return;busy=true;for(const b of actions.querySelectorAll('button'))b.disabled=true;
   window.dispatchEvent(new CustomEvent('assembly-busy',{detail:{id:proposal.id,busy:true}}));
   let queuedID;
   try{
    status.textContent=action==='decline'?'Сохраняю выбор…':action==='check'?'Проверяю детали и соединения в CLO…':'Запрашиваю запуск 100 шагов симуляции…';
    const job=await api('assembly-action',{id:proposal.id,action,confirmed:true,...(manual?{manual_scene_confirmed:true}:{})});if(!panel.isConnected)return;
    if(job.declined){actions.replaceChildren();status.textContent='Лекала оставлены без сборки. Швы, размещение и симуляция не изменены.';return;}
    if(job.existing){if(job.offer.report)display(job.offer.report);else status.textContent='Эта операция уже обрабатывается. Дождитесь результата CLO.';return;}
    await api('apply',job.id);queuedID=job.id;const end=Date.now()+30000;
    while(Date.now()<end){await new Promise(r=>setTimeout(r,500));const result=await api('result');if(!panel.isConnected)return;if(result?.id!==job.id)continue;if(result.cancelled)return;
     if(result.error)throw Error(result.error);const report=result.assembly;if(!report)throw Error('CLO не подтвердил результат проверки сборки');
     display(report);
     window.dispatchEvent(new Event('workspace-changed'));return;
    }
    throw Error('CLO не подтвердил операцию за 30 секунд. Проверьте сцену перед повтором; автоматического повторения нет.');
   }catch(e){if(panel.isConnected){status.textContent=e.message;status.classList.add('error');actions.replaceChildren();if(queuedID){const retry=node('button','Проверить результат');retry.onclick=async()=>{retry.disabled=true;try{const r=await api('result');if(!panel.isConnected)return;if(r?.id!==queuedID){status.textContent='CLO пока не передал результат. Проверьте подключение и повторите проверку. Команда заново не отправляется.';return;}status.textContent=r.cancelled?'Проект или диалог сменился. Старый результат отклонён.':r.error||r.assembly?.text||'Результат не подтверждён.';actions.replaceChildren();if(r.assembly)display(r.assembly);window.dispatchEvent(new Event('workspace-changed'));}catch(err){status.textContent=err.message;}finally{retry.disabled=false;}};actions.append(retry);}}}
   finally{busy=false;for(const b of actions.querySelectorAll('button'))b.disabled=retired;window.dispatchEvent(new CustomEvent('assembly-busy',{detail:{id:proposal.id,busy:false}}));}
  }
  check.onclick=()=>run('check');leave.onclick=()=>run('decline');
 }
 window.UIAssembly={offer};
})();
