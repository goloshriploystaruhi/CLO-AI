const {randomUUID,createHash}=require('node:crypto');
const validation=require('./command-validation.cjs');
const STAGES=['exploration','clarification','planning','construction','validation','assembly','review','revision'];
const LABELS={exploration:'Обсуждаем идею',clarification:'Уточняем детали',planning:'Готовим построение',construction:'Строим лекала',validation:'Проверяем конструкцию',assembly:'Проверяем сборку',review:'Обсуждаем результат',revision:'Вносим изменения'};
const TRANSITIONS=Object.fromEntries(STAGES.map(stage=>[stage,new Set([...['exploration','clarification','planning','review','revision'],...(['planning','construction','validation','assembly','review','revision'].includes(stage)?['construction','validation','assembly']:[])])]));
const nativeTools=new Set(['create_pattern_design','revise_pattern_design','revise_development','develop_garment','create_garment','update_garment','undo_garment_change','create_parametric_piece','create_linked_set','create_draft_piece','build_trouser_from_profile','change_pattern_parameter','undo_last_ai_change']);
const live=new WeakMap(),clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const initialState=()=>({version:1,stage:'exploration',brief:'',questions:[],proposal:null});
const genericGo=text=>/^\s*(?:да[,!.\s]*)?(?:давай[,!.\s]*)?(?:делай|строй|построй|начинай|начни построение)[.!\s]*$/iu.test(text||'');
const continueApproximate=text=>/^\s*(?:да[,!.\s]*)?(?:давай[,!.\s]*)?(?:продолжай|делай|строй|построй|начинай)\s+без\s+(?:этих\s+)?(?:данных|деталей|мерок|измерений|уточнений|параметров|них)[.!\s]*$/iu.test(text||'');
// A direct collaborative request is permission just like an imperative. Keep
// suggestions, discussion and explicit prohibitions subject to the same gates.
const collaborativeChange=text=>/(?:^|[\s,.!?;:])давай(?:те)?(?:\s+(?:тогда|теперь|сейчас|лучше|пока|вс[её]\s+же|для\s+начала)){0,3}\s+(?:создадим|сделаем|построим|сконструируем|разработаем|изменим|увеличим|уменьшим|исправим|укоротим|удлиним|добавим|переместим|сдвинем|расширим|сузим|перестроим)(?:\s|[.,!?;:]|$)/iu.test(text||'');
function clearGrant(text){
 if(typeof text!=='string'||/(?:не\s+(?:строй|создавай|делай|применяй)|пока\s+только\s+обсуд|без\s+построения|давай\s+обсудим|может\s+(?:сделаем|построим)|как\s+думаешь)/iu.test(text))return false;
 const assessment=/^\s*(?:пожалуйста[,\s]+)?(?:сделай|проведи|выполни|подготовь)\s+(?:(?:предварительную|предварительный|подробную|подробный)\s+)?(?:оценку|анализ|диагностику|проверку|отч[её]т)(?:\s|[.,:!?]|$)/iu.test(text);
 const explicitChange=collaborativeChange(text)||/(?:^|[\s,.!?;:])(?:создай|построй|измени|увеличь|уменьши|исправь|укороти|удлини|добавь|перемести|подвинь|сдвинь|расширь|сузь|перестрой)(?:\s|[.,!?]|$)/iu.test(text);
 if(assessment&&!explicitChange||/(?:ничего\s+не\s+(?:меняй|изменяй)|не\s+(?:меняй|изменяй)\s+ничего)/iu.test(text))return false;
 return explicitChange||/(?:^|[.!?]\s*|\b)(?:создай|построй|построить|сделай|увеличь|уменьши|измени|исправь|укороти|удлини|отмени|добавь|перемести|подвинь|сдвинь|расширь|сузь|перестрой|начни\s+построение|теперь\s+построй|продолжай\s+без)/iu.test(text);
}
function validateDialogue(d){
 const allowed=['intent','message','choices','brief','tools'];
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!allowed.includes(k))||!STAGES.includes(d.intent))throw Error('Не удалось определить следующий шаг диалога. Лекала не изменены.');
 for(const [key,max]of [['message',20000],['brief',2000]])if(d[key]!==undefined&&(typeof d[key]!=='string'||!d[key].trim()||d[key].length>max))throw Error('Некорректный текст диалога');
 if(d.choices!==undefined&&(!Array.isArray(d.choices)||d.choices.length>3||d.choices.some(x=>typeof x!=='string'||!x.trim()||x.length>100)||new Set(d.choices).size!==d.choices.length))throw Error('Некорректные варианты ответа');
 if(d.tools!==undefined){if(!Array.isArray(d.tools)||!d.tools.length||d.tools.length>20)throw Error('Некорректный список действий');for(const t of d.tools)validation.tool(t);}
 if(!d.message&&!d.tools?.length)throw Error('AI не предложил ответ или действие');return d;
}
class DialogueManager{
 constructor(conversation,runtime){this.store=conversation;this.runtime=runtime;const s=conversation.data.dialogue;if(s&&s.version!==1)throw Error('Неизвестная версия состояния диалога');this.state=s||initialState();conversation.data.dialogue=this.state;}
 save(){this.store.data.dialogue=this.state;try{this.store.save();}catch(error){this.state=this.store.data.dialogue||initialState();this.store.data.dialogue=this.state;throw error;}}
 profileHash(){const data=this.runtime.stores.profiles.data,p=data.profiles.find(p=>p.id===data.active);return hash({id:p?.id,measurements:p?.measurements,metadata:p?.metadata});}
 currentDraft(){const data=this.runtime.stores.garments.data;return data.design_draft?{...clone(data.design_draft),kind:'pattern_design'}:data.draft||null;}
 draftSpec(draft=this.currentDraft()){
  if(draft?.kind!=='pattern_design')return null;
  const tool=draft.query?{action:'revise_pattern_design',args:{query:draft.query,design:clone(draft.design)}}:{action:'create_pattern_design',args:{design:clone(draft.design)}};
  validation.tool(tool);return this.pinSpec({tools:[tool]});
 }
 transition(stage,source='assistant'){
  if(!STAGES.includes(stage))throw Error('Неизвестный этап работы');
  if(source==='assistant'&&['construction','validation','assembly'].includes(stage))stage='planning';
  if(this.state.stage===stage)return stage;
  if(!TRANSITIONS[this.state.stage]?.has(stage))throw Error('Для перехода к выполнению нужен план и подтверждение действия');
  this.state.stage=stage;this.save();return stage;
 }
 begin(ticket,id,text){
  this.runtime.assert(ticket,true);let approved=null;
  this.conceptApproved=genericGo(text)&&!!this.state.brief.trim();
  if(genericGo(text)&&this.state.proposal){this.runtime.assert(this.state.proposal.ticket,true);if(this.state.proposal.profile_hash&&this.state.proposal.profile_hash!==this.profileHash())throw Error('Мерки изменились после подготовки плана. Обнови план с актуальными данными.');approved=clone(this.state.proposal.spec);}
  // Explicit permission to continue this draft does not authorize a different
  // old trouser draft. Actual generation still recalculates and validates it.
  if(!approved&&continueApproximate(text)){
   const draft=this.currentDraft(),profiles=this.runtime.stores.profiles.data;
   if(draft?.kind==='pattern_design'&&draft.profile_id&&draft.profile_id!==profiles.active&&profiles.profiles.some(p=>p.id===draft.profile_id))throw Error('Черновик относится к другому профилю. Выберите прежний профиль или подготовьте новый план с текущими мерками.');
   approved=this.draftSpec(draft);
  }
  for(const q of this.state.questions)if(q.status==='active'){q.status='cancelled';for(const a of q.actions)if(a.status==='active')a.status='cancelled';}
  this.state.proposal=null;this.save();live.set(this.store,{operation_id:id,project_id:ticket.project_id,session_id:ticket.session_id,started_at:Date.now(),events:[],preview:'',sequence:0});
  return approved;
 }
 event(action,object,status,description,result){
  const run=live.get(this.store);if(!run||this.runtime.state.session_id!==run.session_id)return;
  const e={id:run.operation_id+':host:'+(++run.sequence),operation_id:run.operation_id,project_id:run.project_id,action,object,status,description,result,at:new Date().toISOString()};
  run.events.push(e);if(run.events.length>256)run.events.shift();
  if(['construction','validation','assembly','revision'].includes(action))this.transition(action,'tool');return e;
 }
 engineEvent(e){const run=live.get(this.store);if(!run||!e||typeof e.description!=='string'||e.operation_id!==run.operation_id||(e.project_id&&e.project_id!==run.project_id)||run.events.some(x=>x.source_id===e.id))return;const added=this.event(e.action,e.object,e.status,e.description,e.result);if(added)added.source_id=e.id;return added;}
 preview(raw){const run=live.get(this.store);if(run&&this.runtime.state.session_id===run.session_id)run.preview=visiblePrefix(raw);}
 snapshot(){let expired=false;for(const q of this.state.questions)if(q.status==='active'&&(!this.runtime.isCurrent(q.ticket)||q.ticket.content_digest!==this.runtime.state.content_digest||(q.profile_hash&&q.profile_hash!==this.profileHash()))){q.status='cancelled';for(const a of q.actions)a.status='cancelled';expired=true;}if(expired)this.save();const run=live.get(this.store);return {stage:this.state.stage,label:LABELS[this.state.stage],brief:this.state.brief,...(run&&run.session_id===this.runtime.state.session_id?clone(run):{}),questions:this.state.questions.filter(q=>q.status==='active').map(q=>this.publicQuestion(q))};}
 publicQuestion(q){return {id:q.id,operation_id:q.operation_id,project_id:q.ticket.project_id,session_id:q.ticket.session_id,status:q.status,actions:q.actions.map(({ticket,...a})=>({...a,active:q.status==='active'&&a.status==='active'}))};}
 ask(turn,actions){
  if(!actions.length)return;
  const q={id:randomUUID(),operation_id:turn.operation_id,ticket:clone(turn.ticket),profile_hash:this.profileHash(),status:'active',actions:actions.map(a=>({id:randomUUID(),...a,status:'active'}))};
  this.state.questions.push(q);this.save();return this.publicQuestion(q);
 }
 plan(turn,result){
  const g=result.garment;this.state.proposal={spec:{tools:[{action:'create_garment',args:{method:g.method,parameters:clone(g.parameters)}}]},ticket:clone(turn.ticket),profile_hash:this.profileHash()};this.transition('planning');
  const labels=require('./garment-store.cjs').labels;
  const parameters=g.method_spec.required_parameters.map(k=>'• '+(labels[k]||k)+': '+g.parameters[k]+(k.endsWith('_mm')?' мм':'')).join('\n');
  return {message:'Подготовил план: '+g.subcategory+'.\n\nДеталей: '+g.pieces.length+'. В CLO их ещё не добавлял.\n\n'+parameters+'\n\nПосле передачи проверю фактические контуры и швы. Посадку понадобится проверить отдельно.',
          question:this.ask(turn,[{type:'approve_proposal',label:'Начать построение',params:{}},{type:'reply',label:'Обсудим план',params:{text:'Обсудим этот план, пока не строй'}}])};
 }
 consume(arg){
  if(!arg||Object.keys(arg).some(k=>!['id','question_id','project_session','model'].includes(k)))throw Error('Некорректное действие диалога');
  const q=this.state.questions.find(q=>q.id===arg.question_id),a=q?.actions.find(a=>a.id===arg.id);
  if(!q||!a||q.status!=='active'||a.status!=='active'||arg.project_session!==q.ticket.session_id||(a.type==='approve_proposal'&&!this.state.proposal))throw Error('Этот вопрос больше не актуален. Продолжи текущий диалог.');
  this.runtime.assert(q.ticket,true);
  if(q.profile_hash&&q.profile_hash!==this.profileHash())throw Error('Профиль мерок изменился. Продолжи диалог с актуальными данными.');
  if(a.type==='continue_draft'&&a.params.draft_hash!==hash(this.currentDraft()))throw Error('Черновик изменился. Продолжи актуальный запрос.');
  const continued=a.type==='continue_draft'?this.draftSpec():null;
  q.status='completed';for(const other of q.actions)other.status=other.id===a.id?'completed':'cancelled';q.selected=a.id;this.save();
  return {...clone(a),question:this.publicQuestion(q),...(a.type==='approve_proposal'?{spec:clone(this.state.proposal.spec)}:continued?{spec:continued}:{})};
 }
 pinSpec(spec){
  const copy=clone(spec);for(const t of copy.tools||[]){
   if(['revise_pattern_design','update_garment','undo_garment_change','revise_development'].includes(t.action))t.args.query=this.runtime.assertGarment(t.args.query).id;
   if(['change_pattern_parameter','measure_pattern','validate_construction','get_pattern_piece'].includes(t.action))t.args.query=this.runtime.assertPiece(t.args.query).id;
  }return copy;
 }
 accept(spec,turn,text){
  const d=spec.dialogue?validateDialogue(spec.dialogue):null;
  if(d?.brief)this.state.brief=d.brief;
  const intent=d?.intent||(spec.tools?.some(t=>t.action==='update_garment')?'revision':spec.tools||spec.patterns?'construction':'review');
  this.state.intent=intent;this.transition(intent);
  const command=d?.tools?{tools:d.tools}:d?{message:d.message}:spec;
  const mutates=command.patterns||command.tools?.some(t=>nativeTools.has(t.action)||(t.action==='plan_garment'&&turn.allowApproximate));
  const approved=turn.authorizedSpec||turn.test||this.conceptApproved||(clearGrant(text)&&!genericGo(text))||(turn.allowApproximate&&!!this.currentDraft());
  if(mutates&&(!approved||['exploration','review','clarification'].includes(intent))){
   const pinned=this.pinSpec(command);this.state.proposal={spec:pinned,ticket:clone(turn.ticket),profile_hash:this.profileHash()};this.transition('planning');
   return {message:d?.message||'Могу подготовить этот вариант. Начнём построение, когда подтвердишь план.',question:this.ask(turn,[{type:'approve_proposal',label:'Начать построение',params:{}},{type:'reply',label:'Сначала обсудим детали',params:{text:'Давай пока обсудим детали, без построения'}}])};
  }
  if(d&&!d.tools){return {message:d.message,question:d.choices?.length?this.ask(turn,d.choices.filter(label=>!/(?:сшить|автошить|собрать\s+в\s*3d)/iu.test(label)).map(label=>({type:'reply',label,params:{text:label}}))):undefined};}
  return command;
 }
 missing(turn,result){
  this.transition('clarification');const draft=this.currentDraft();
  const actions=[{type:'open_profiles',label:'Добавить мерки',params:{}}];
  if(draft)actions.push({type:'continue_draft',label:'Продолжить без деталей',params:{draft_hash:hash(draft),text:'Продолжай без этих данных'}});
  const r=result.needs_input,definitions=this.runtime.stores.profiles.snapshot().catalog,labels=require('./garment-store.cjs').labels;
  const names=ids=>(ids||[]).map(id=>definitions.find(m=>m.id===id)?.name||labels[id]||id).join(', ');
  const lines=r?.missing_profile?['Профиль мерок пока не выбран. Можем создать его или начать с приблизительного макета.']:['Комплект пока не создан.',...(r?.missing_measurements?.length?['Мне нужны мерки: '+names(r.missing_measurements)+'.']:[]),...(r?.unverified_measurements?.length?['Нужно подтвердить мерки: '+names(r.unverified_measurements)+'.']:[]),...(r?.missing_parameters?.length?['Осталось задать: '+names(r.missing_parameters)+'.']:[])];
  return {...result,message:lines.join('\n\n')+'\n\nМожно добавить данные сейчас или продолжить с допущениями. В этом случае построю приблизительный макет; личные мерки не изменятся, посадку понадобится проверить.',question:this.ask(turn,actions)};
 }
 recovery(turn){return this.ask(turn,[{type:'reply',label:'Объясни проблему',params:{text:'Объясни ошибку и что проверить вручную. Ничего не меняй в CLO'}},{type:'reply',label:'Обсудим исправление',params:{text:'Предложи план исправления, без выполнения и повторной отправки команд'}}]);}
 finish(result,operationID,verified=true){
  const run=live.get(this.store),failed=!verified||result.error||result.validation?.valid===false||result.assembly?.status==='simulation_unconfirmed';if(run&&run.operation_id===operationID){run.preview='';this.event('result','Операция',failed?'failed':'verified',failed?'Не удалось завершить действие. Проверь результат перед повтором.':'CLO передал подтверждённый результат.',result.transaction);}
  this.transition('review','tool');return run?.events||[];
 }
 decorate(messages){
  // Persisted decisions remain in dialogue state, but history must never
  // resurrect consumed buttons, including legacy embedded question objects.
  this.snapshot();
  return messages.map(m=>{const id=m.question_id||m.question?.id;if(!id)return m;const q=this.state.questions.find(q=>q.id===id);const {question,...message}=m;return q?.status==='active'?{...message,question:this.publicQuestion(q)}:message;});
 }
 context(){return {stage:this.state.stage,brief:this.state.brief,pending_proposal:!!this.state.proposal,pending_questions:this.state.questions.filter(q=>q.status==='active').map(q=>q.actions.map(a=>a.label))};}
}
// Only a top-level conversational prefix is visible. Tool JSON and reasoning
// never pass this parser; the full reply must still validate before execution.
function visiblePrefix(raw){
 if(typeof raw!=='string')return '';
 if(!/^\s*[\[{`]/.test(raw))return raw.slice(0,20000);
 const match=raw.match(/^\s*\{\s*"(?:message|dialogue)"\s*:\s*(?:\{\s*"intent"\s*:\s*"[a-z]+"\s*,\s*"message"\s*:\s*)?"/);
 if(!match)return '';let result='',start=match[0].length;
 for(let i=start;i<raw.length&&result.length<20000;i++){
  const c=raw[i];if(c==='"')break;
  if(c!=='\\'){result+=c;continue;}const escaped=raw[++i];if(escaped===undefined)break;
  if(escaped==='u'){const code=raw.slice(i+1,i+5);if(!/^[\da-f]{4}$/i.test(code))break;result+=String.fromCharCode(parseInt(code,16));i+=4;}
  else if('"\\/bfnrt'.includes(escaped))result+=JSON.parse('"\\'+escaped+'"');else break;
 }return result;
}
module.exports={DialogueManager,STAGES,LABELS,TRANSITIONS,validateDialogue,clearGrant,genericGo,visiblePrefix};
