(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UIFormat=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const labels={width_mm:'Ширина',height_mm:'Высота',length_mm:'Длина',top_mm:'Ширина сверху',bottom_mm:'Ширина снизу',diameter_mm:'Диаметр',top_round_mm:'Скругление верха',offset_mm:'Смещение',hip_width_mm:'Ширина по бёдрам',knee_width_mm:'Ширина в колене',hem_width_mm:'Ширина низа',waist_width_mm:'Ширина по талии',rise_mm:'Высота сидения',crotch_extension_mm:'Выступ шагового шва',allowance_mm:'Припуск',rotate_deg:'Поворот',scale:'Масштаб',reflect_axis:'Отражение'};
 const num=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v);
 function changeImpact(garment,previous,states){
  if(!garment||!Array.isArray(previous)||!Array.isArray(states)||states.length!==garment.pieces.length||states.some(s=>!['reused','replaced','added'].includes(s)))return null;
  const pieces=garment.pieces,ids=new Set(pieces.map(p=>p.id)),item=p=>({id:p.id,name:p.name});
  const impact={replaced:[],reused:[],added:[],removed:previous.filter(p=>!ids.has(p.id)).map(item),connections:[]};
  pieces.forEach((p,i)=>impact[states[i]].push(item(p)));
  const changed=new Set([...impact.replaced,...impact.added].map(p=>p.id));
  for(const seam of garment.sewing_graph||[]){
   const ends=[seam.a,seam.b].map(ref=>({ref,piece:pieces[ref.piece]}));
   if(!ends.every(e=>e.piece)||!ends.some(e=>changed.has(e.piece.id)))continue;
   const label=ends.map(({ref,piece})=>piece.name+(ref.segments?' · участки конструкции '+ref.segments.map(i=>i+1).join(', '):' · внутренняя линия конструкции '+(ref.internal_line+1))).join(' ↔ ');
   impact.connections.push({id:seam.id,label});
  }
  return impact;
 }
 function impactText(impact,limit=Infinity){
  if(!impact)return '';
  const lines=[];
  for(const [key,label]of [['replaced','Заменяемые детали'],['added','Добавляемые детали'],['removed','Удаляемые детали'],['reused','Без пересоздания']])if(impact[key].length)lines.push(label+': '+impact[key].map(p=>p.name).join('; ')+'.');
  if(impact.connections.length)lines.push('Соединения по карте для ручного сшивания: '+impact.connections.length+'.\n'+impact.connections.slice(0,limit).map(c=>'• '+c.label).join('\n')+(impact.connections.length>limit?'\nОстальные '+(impact.connections.length-limit)+' — в карте сборки актуальной версии.':''));
  if(impact.replaced.length||impact.removed.length)lines.push('Другие швы, добавленные вручную в CLO, прочитать через API не удалось. Проверьте все соединения заменяемых и удаляемых деталей, в том числе с другими изделиями.');
  return lines.join('\n');
 }
 function replacementQuestion(job){
  const changes=job.update_preview,count=job.replace_targets?.length||job.targets?.length||1;
  if(!changes)return 'Подтвердить '+(job.operation==='delete'?'удаление':'замену')+' существующих деталей: '+count+'?\nПеред операцией сохранится резервная копия. При замене нативные материалы и стачивание не переносятся.';
  const manual=changes.replaced||changes.removed;
  return 'Обновить изделие? Заменяемых деталей: '+changes.replaced+', сохраняемых: '+changes.reused+'. Добавляется: '+(changes.added||0)+', удаляется: '+(changes.removed||0)+'.\n'+(impactText(changes.impact,6)||'')+'\n'+(manual?'Доступные свойства заменяемых деталей будут перенесены и проверены. Их швы, ручные линии и положение в 3D потребуется восстановить вручную. ':'Все нативные детали сохраняются. ')+(changes.added?'Новые детали потребуется сшить и разместить вручную. ':'')+'Перед операцией сохранится резервная копия.';
 }
 function parameter(key,value,extra={}){const name=extra[key]||labels[key];if(!name)return null;if(typeof value==='number')return [name,num(value)+(key.endsWith('_mm')?' мм':key.endsWith('_deg')?'°':'')];if(key==='reflect_axis')return [name,'Ось '+String(value).toUpperCase()];return null;}
 function parsed(value){if(typeof value!=='string')return value;try{return JSON.parse(value);}catch{return value;}}
 function readable(value){
  value=parsed(value);if(typeof value==='string'){const text=value.replace(/\\n/g,'\n');if(/^[\s]*[\[{]/.test(text)){const parts=text.split('\n').filter(Boolean).map(parsed);if(parts.every(p=>typeof p!=='string'))return parts.map(readable).join('\n\n');return 'Данные получены. Подробности доступны в разделах изделий и профилей.';}return text;}
  if(Array.isArray(value)){if(!value.length)return 'Список пуст. Создайте изделие или деталь.';return value.map(readable).join('\n\n');}
  if(!value||typeof value!=='object')return String(value??'');
  if(value.message)return readable(value.message);
  if(value.profiles)return value.profiles.length?'Профили мерок:\n'+value.profiles.map(p=>'• '+p.name+(p.id===value.active?' — активный':'')).join('\n'):'Профилей пока нет. Создайте профиль в разделе «Профили и мерки».';
  if(value.required){const missing=value.missing?.length;return 'Требования к профилю: '+value.required.length+' мерок.'+(missing?' Не заполнено: '+missing+'. Откройте «Профили и мерки».':value.missing?' Все обязательные значения заполнены.':' Подробности — в разделе «Профили и мерки».')+(value.unverified?.length?' Требуют подтверждения: '+value.unverified.length+'.':'')+(value.note?'\n'+value.note:'');}
  if(value.name){const parameters=value.parameters||value.geometry?.parameters,lines=parameters?Object.entries(parameters).map(([k,v])=>parameter(k,v)).filter(Boolean).map(([k,v])=>'• '+k+': '+v):[];return value.name+(value.version?' · версия '+value.version:'')+(value.pieces?' · деталей: '+value.pieces.length:'')+(value.measurements?'\nМерки и заметки доступны в разделе «Профили и мерки».':lines.length?'\n'+lines.join('\n'):'\nПодробности — в разделе «Изделия и детали».');}
  if(value.value!==undefined)return 'Мерка сохранена. Значение: '+(value.value===null?'не заполнено':num(value.value)+' '+({mm:'мм',kg:'кг',year:'лет',deg:'°'}[value.unit]||''));
  return 'Данные получены. Откройте соответствующий раздел для просмотра.';
 }
 function resultSummary(result,job){
  if(result.error)return {text:'Не удалось выполнить операцию: '+result.error+(result.transaction?.requires_manual_recovery?'\nОперация завершилась частично. Не повторяйте её автоматически; проверьте проект и резервную копию.':''),kind:'error'};
  if(result.validation){const v=result.validation;return {text:(v.valid?'Проверка геометрии пройдена.':'В геометрии найдены ошибки:\n'+(v.errors||[]).map(e=>'• '+e.piece+' / '+e.section+': '+e.message).join('\n'))+'\nПосадка и готовность к пошиву не подтверждены.',kind:v.valid?'success':'error'};}
  if(result.inspection)return {text:'В текущем проекте CLO деталей: '+result.inspection.length+'.'+(result.inspection.length?'\n'+result.inspection.map((p,i)=>'• '+(p.name||'Деталь '+(i+1))).join('\n'):''),kind:'success'};
  if(result.measurement){const lines=[];function visit(v){v=parsed(v);if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(typeof x==='number'&&/length|width|height|perimeter/i.test(k))lines.push('• '+({Width:'Ширина',Height:'Высота',Length:'Длина'}[k]||(/length/i.test(k)?'Длина участка':/width/i.test(k)?'Ширина':'Высота'))+': '+num(x)+' мм');else if(typeof x==='object'||typeof x==='string'&&x.trim().startsWith('{'))visit(x);}}visit(result.measurement);return {text:lines.length?'Измерения CLO:\n'+lines.slice(0,50).join('\n'):'CLO вернул измерения. Подробные данные можно раскрыть под сообщением.',kind:'success'};}
  if(result.deleted)return {text:'Последнее создание отменено.'+(result.backup?'\nРезервная копия сохранена.':''),kind:'success'};
  const count=result.patterns?.length||(result.line_lengths_mm?.length?1:0);
  if(!count)return {text:'CLO ответил без подтверждения изменения. Проверьте проект перед повторной отправкой.',kind:'error'};
  const editing=!!(job.replace_target||job.replace_targets),lines=[(editing?'Обновлено':'Создано')+' деталей: '+count+'. CLO подтвердил результат.'];
  if(job.garment?.method==='parametric_design_v1'&&job.garment.pieces?.some(p=>p.cut_quantity>1)){const cutting=job.garment.pieces.reduce((n,p)=>n+(p.cut_quantity||1),0);lines.push('Шаблонов лекал: '+job.garment.pieces.length+'. Деталей кроя по карте: '+cutting+'. Количество кроя указано в свойствах; дополнительные копии в CLO не создавались.');}
  if(result.update_summary){const u=result.update_summary;lines[0]='Заменено деталей: '+u.replaced+'. Сохранено без пересоздания: '+u.reused+'. CLO подтвердил результат.';if(u.added||u.removed)lines.push('Добавлено деталей: '+(u.added||0)+'. Удалено: '+(u.removed||0)+'.');if(u.replaced)lines.push('Швы заменённых деталей, ручные линии и положение в 3D восстановите вручную.');}
  if(result.update_summary&&job.garment&&job.previous_pieces){const impact=changeImpact(job.garment,job.previous_pieces,result.patterns.map(p=>p.update));if(impact)lines.push(impactText(impact));}
  if(job.garment)lines.push(job.garment.name+'. Стачивание, проверку долевой, меток и посадки выполните вручную.');
  else{const names=(job.patterns||[]).map(p=>p.semantic?.name||p.name||({rectangle:'Прямоугольник',trapezoid:'Трапеция',rounded_trapezoid:'Трапеция с плавным верхом',shaped_panel:'Деталь с плавными боковыми линиями',circle:'Круг',trouser_panel:'Половинка брюк'})[p.type]).filter(Boolean);if(names.length)lines.push(names.slice(0,5).join(', ')+(names.length>5?' и ещё '+(names.length-5):'')+'.');if(count===1){const lengths=result.line_lengths_mm;if(lengths?.length)lines.push('Длины сторон: '+lengths.map(num).join(' × ')+' мм.');else if(Number.isFinite(result.patterns?.[0]?.perimeter_mm))lines.push('Периметр контура в CLO: '+num(result.patterns[0].perimeter_mm)+' мм.');}}
  if(job.garment?.approximate||job.approximate)lines.push('Приблизительный макет с допущениями. Это не персональная конструкция и не подтверждение посадки.');
  if(result.qa_report?.quality?.labels)lines.push(result.qa_report.quality.labels.join(' · ')+'. Подробности — «Отчёт качества» в списке изделий.');
  const restored=result.patterns?.filter(p=>p.preserved_properties?.status==='verified').length;
  if(restored)lines.push('Перенос доступных свойств подтверждён CLO: '+restored+' деталей.');
  const unavailable=result.patterns?.filter(p=>p.preserved_properties?.unavailable?.length).length;
  if(unavailable)lines.push('Для '+unavailable+' деталей часть свойств недоступна через API. Проверьте свойства в CLO вручную.');
  const manual=result.patterns?.filter(p=>['manual','partial_manual'].includes(p.internal_lines?.status)||p.material?.status==='manual').length;
  if(manual)lines.push('Требуют ручной проверки внутренних линий или материала: '+manual+' деталей.');
  if(result.backup)lines.push('Резервная копия проекта сохранена.');
  if(result.print_export?.print_preparation==='created'&&typeof result.print_export.message==='string')lines.push(result.print_export.message);
  if(result.print_warning)lines.push('Лекала созданы, но PDF не подготовлен: '+result.print_warning);
  if(result.learning_warning)lines.push(result.learning_warning);
  if(result.work_order_warning)lines.push(result.work_order_warning);
  return {text:lines.join('\n'),kind:'success'};
 }
 function errorText(error){
  const code=typeof error==='object'?error?.code:undefined,raw=typeof error==='string'?error:error?.message;
  const status=error?.status,param=error?.param;
  if(code==='subscription_sharing_unsupported_capability')return 'Текущее подключение ChatGPT не разрешает запрошенную возможность. Проверь доступность выбранной модели и разрешения подключения; изображения не заменены именами файлов.';
  if(code==='network_error'||/Could not reach ChatGPT|fetch failed|ERR_(?:CONNECTION|NAME_NOT|PROXY|TIMED_OUT)/i.test(raw||''))return 'Не удалось связаться с ChatGPT. Проверьте интернет и системный прокси, затем повторите попытку.';
  if(code==='identity_verification_unavailable')return 'Не удалось проверить вход ChatGPT. Сохранённое подключение не удалено. Повторите проверку немного позже.';
  if(code==='cancelled')return 'Подключение отменено или истекло время ожидания. Повторите попытку.';
  if(code==='signin_timeout')return 'Время ожидания входа истекло. Нажмите «Подключи ChatGPT», чтобы открыть вход заново.';
  if(code==='access_denied')return 'Вход не завершён или разрешение отклонено. Нажмите «Подключи ChatGPT» и завершите вход в браузере.';
  if(code==='browser_unavailable')return 'Не удалось открыть браузер для входа. Проверьте браузер по умолчанию и повторите попытку.';
  if(['invalid_grant','invalid_refresh_token','token_expired','refresh_token_expired','invalid_id_token'].includes(code))return 'Нужно повторно войти в ChatGPT. Нажмите «Подключить ChatGPT».';
  if(code==='connection_error')return 'Не удалось завершить подключение ChatGPT. Повторите попытку.';
  if(code==='model_not_found')return 'Выбранная модель недоступна для этого подключения ChatGPT. Выберите другую модель в настройках.';
  if(status===401||['sign_in_required','invalid_token','invalid_api_key'].includes(code))return 'ChatGPT не принял сохранённое подключение. Повторно войдите через «Подключить ChatGPT». Запрос остался в истории.';
  if(status===403)return 'ChatGPT отклонил запрос: у подключения нет разрешения либо сервис недоступен для аккаунта или региона. Проверьте подключение и разрешения. Повторная отправка без изменений не устранит ограничение.';
  if(status===429||code==='subscription_sharing_usage_limit_exceeded')return 'Достигнут лимит запросов ChatGPT. Проверьте лимиты в настройках ChatGPT и повторите после их восстановления. Запрос остался в истории.';
  if(status>=500)return 'Сервис ChatGPT временно не отвечает (HTTP '+status+'). Повторите запрос немного позже. Лекала не были построены по этому ответу.';
  if([400,422].includes(status)){
   const reasons={tools:'встроенный веб-поиск',max_tool_calls:'настройку встроенного веб-поиска',input:'формат текста или референсов',model:'выбранную модель',instructions:'инструкции запроса',store:'настройку хранения ответа',stream:'потоковый ответ'};
   return 'ChatGPT отклонил '+(reasons[param]||'формат запроса')+' (HTTP '+status+'). '+(param==='model'?'Выберите доступную модель.':param==='input'?'Проверьте вложения; если ошибка повторяется, передайте диагностику разработчику.':'Передайте диагностику разработчику; повторять тот же запрос без исправления не нужно.');
  }
  if(/policy or permission restriction/i.test(raw||''))return 'OpenAI отклонил запрос: проверьте разрешения приложения и доступность сервиса для аккаунта.';
  if(raw&&/[а-яё]/i.test(raw))return raw;
  return 'Не удалось выполнить действие'+(code?' (код: '+code+')':'')+'. Повторите попытку.';
 }
 function operationStatus(events){
  if(!Array.isArray(events))return null;
  const phases={request:['Анализирую запрос…','Готовлю ответ…'],research:['Изучаю источники…','Продолжаю обработку запроса…'],planning:['Подготавливаю конструкцию…','План подготовлен.'],construction:['Строю лекала…','Лекала рассчитаны.'],validation:['Проверяю лекала…','Проверка лекал завершена.'],revision:['Пересчитываю лекала…','Лекала пересчитаны.'],assembly:['Проверяю сборку…','Проверка сборки завершена.']};
  for(let i=events.length-1;i>=0;i--){const e=events[i];if(!e||!Object.hasOwn(phases,e.action)||!['running','completed','verified','failed'].includes(e.status))continue;
   if(e.status==='failed')return {text:'Проверка выявила проблему. Продолжаю обработку запроса…',state:'pending'};
   return {text:phases[e.action][e.status==='running'?0:1],state:'pending'};
  }
  return null;
 }
 return {num,parameter,readable,resultSummary,errorText,changeImpact,impactText,replacementQuestion,operationStatus};
});
