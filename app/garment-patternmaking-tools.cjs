'use strict';
const path=require('node:path');
const actions=new Set(['search_garment_patternmaking','read_garment_patternmaking','read_pattern_work_order','save_pattern_work_order','check_pattern_work_order']);
const contextActions=new Set(['save_pattern_work_order']);
const {isDeepStrictEqual}=require('node:util');
const immutable=['brief','required_roles','finished_checks','preserve_parameters'];
const specificationKeys=['name','brief','required_roles','preserve_parameters','finished_checks','assumptions','fabric','closure'];
const normalText=value=>value.normalize('NFC').replace(/\s+/gu,' ').trim();
function changeQuote(context,quote){
 const text=context.turn?.current_user_text;
 // Verify the human source, not an imperative verb allowlist. A substring can
 // omit a negation or turn a historical example into a new instruction.
 if(typeof quote!=='string'||quote.length<4||quote.length>20000||typeof text!=='string'||text.length>20000)return null;
 const current=normalText(text);if(normalText(quote)!==current)return null;
 if(/(?:ничего\s+не\s+(?:меняй|изменяй|делай|создавай|строй)|не\s+(?:строй|создавай|делай|применяй|пересматривай|ослабляй)|не\s+(?:меняй|изменяй)\s+(?:ничего|задание|требования|поручение)|без\s+изменений|пока\s+только\s+обсуд|давай\s+обсудим)/iu.test(current))return null;
 if(/^(?:(?:пожалуйста|только|пока|просто)[,\s]+)*(?:объясни|поясни|расскажи|проверь|проанализируй|оцени|сравни|покажи|опиши|обсуди|обсудим|почему|зачем|как|что)(?:\s|[.!?:,]|$)/iu.test(current))return null;
 return current;
}
const specification=order=>Object.fromEntries(Object.entries(order).filter(([key])=>specificationKeys.includes(key)));
function revisionEvidence(previous,next,quote){
 if(!quote)return null;
 return {previous_order_id:previous?.id||null,previous_revision:previous?.revision||null,order_id:next.id,user_message_sha256:require('node:crypto').createHash('sha256').update(quote).digest('hex'),source:'current_user_message'};
}
function revisionNote(previous,quote){const digest=require('node:crypto').createHash('sha256').update(quote).digest('hex'),prefix='Изменение требований по текущему поручению'+(previous?' ('+previous.id+', версия '+previous.revision+')':'')+': «',excerpt=quote.slice(0,Math.max(0,600-prefix.length-digest.length-16));return prefix+excerpt+(excerpt.length<quote.length?'…':'')+'» [SHA256:'+digest+']';}
function transition(previous,next,quote){
 if(!previous||previous.id===next.id)return null;
 const checks=new Map(next.finished_checks.map(c=>[c.id,c]));
 const weak=previous.required_roles.some(r=>!next.required_roles.includes(r))||previous.preserve_parameters.some(r=>!next.preserve_parameters.includes(r))||previous.finished_checks.some(c=>{const n=checks.get(c.id);return !n||n.tolerance_mm>c.tolerance_mm||n.role!==c.role||n.kind!==c.kind||!isDeepStrictEqual(n.segments,c.segments)||n.seam!==c.seam||(n.contour||'seam')!==(c.contour||'seam');});
 const changedTargets=previous.finished_checks.some(c=>checks.get(c.id)?.target_mm!==c.target_mm);
 if(weak&&!quote)return 'Новое задание ослабляет обязательные детали, допуски или сохраняемые параметры. Для этого нужна полная цитата актуального поручения; прежнее задание сохранено.';
 if(changedTargets&&!quote)return 'Целевые размеры сохранённого задания изменились. Укажи точную цитату текущего поручения на эту правку.';return null;
}
function object(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Нужен объект параметров');for(const key of Reflect.ownKeys(value))if(typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'))throw Error('Неизвестное или вычисляемое поле задания');}
function label(value,max){return typeof value==='string'&&!!value.trim()&&value.length<=max&&!/[\x00-\x1f]/.test(value);}
function validateTool(tool){
 if(!tool||typeof tool!=='object')return false;const action=Object.getOwnPropertyDescriptor(tool,'action');if(action&&!Object.hasOwn(action,'value'))throw Error('Вычисляемое имя инструмента запрещено');if(!actions.has(action?.value))return false;object(tool,['action','args']);const a=tool.args||{};
 if(tool.action==='save_pattern_work_order'){object(a,['query','brief_change_quote','id','expected_revision','name','brief','required_roles','preserve_parameters','finished_checks','assumptions','fabric','closure']);const {query,brief_change_quote,...spec}=a;if(query!==undefined&&!label(query,300))throw Error('Укажите существующее изделие для задания на правку');if(brief_change_quote!==undefined&&(typeof brief_change_quote!=='string'||!brief_change_quote.trim()||brief_change_quote.length<4||brief_change_quote.length>20000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(brief_change_quote)))throw Error('Укажите полное текущее поручение на изменение требований');require('./pattern-work-order.cjs').validateSaveArgs(spec);return true;}
 object(a,{search_garment_patternmaking:['query','limit'],read_garment_patternmaking:['id'],read_pattern_work_order:['id'],check_pattern_work_order:['id','query']}[tool.action]);
 if(tool.action==='search_garment_patternmaking'){if(!label(a.query,500))throw Error('Укажите тему поиска длиной до 500 символов');if(a.limit!==undefined&&(!Number.isInteger(a.limit)||a.limit<1||a.limit>12))throw Error('Число результатов: от 1 до 12');}
 if(tool.action==='read_garment_patternmaking'&&(!label(a.id,120)||!/^garmentcad:[a-z0-9-]+$/.test(a.id)))throw Error('Выберите карточку из поиска по процессу конструирования');
 if(['read_pattern_work_order','check_pattern_work_order'].includes(tool.action)&&a.id!==undefined&&!/^[a-zA-Z0-9_-]{1,120}$/.test(a.id))throw Error('Некорректный идентификатор задания');
 if(tool.action==='check_pattern_work_order'&&!label(a.query,300))throw Error('Укажите изделие для проверки задания');return true;
}
function orders(context){const project_id=context.turn?.ticket?.project_id||context.runtime?.state?.project_id;if(!project_id)throw Error('Для задания нужен текущий проект CLO');return new(require('./pattern-work-order.cjs').PatternWorkOrders)(path.join(path.dirname(context.stores.garments.file),'pattern-work-orders.json'),{project_id});}
function catalog(){const schema=require('./pattern-work-order.cjs').describe();Object.assign(schema.save_schema.properties,{query:{type:'string',minLength:1,maxLength:300},brief_change_quote:{type:'string',minLength:4,maxLength:20000,description:'Полное актуальное сообщение пользователя; допустима нормализация пробелов. Исторический текст и отдельные фрагменты не разрешают пересмотр требований.'}});schema.revision_behavior='With a verified current-user quote, changing immutable requirements with id+expected_revision creates a new order and preserves the original. A quote records the brief revision only; it does not authorize native geometry execution.';const {cards,documents,...knowledge}=require('./garmentcad-knowledge.cjs').catalog();return {knowledge:{...knowledge,card_details_omitted:true,read_tools:['search_garment_patternmaking','read_garment_patternmaking']},work_order:{tools:[...actions],schema,clo_changed:false,fit_verified:false,sewing_ready:false}};}
async function read(tool,context){validateTool(tool);const a=tool.args||{};
 if(tool.action==='search_garment_patternmaking')return {...require('./garmentcad-knowledge.cjs').search(a.query,{limit:a.limit}),action:tool.action};
 if(tool.action==='read_garment_patternmaking')return require('./garmentcad-knowledge.cjs').read(a.id);
 const store=orders(context);
 if(tool.action==='read_pattern_work_order'){if(!require('node:fs').existsSync(store.file))return {available:false,message:'Задание ещё не сохранено. Для нового изделия укажи его требования.',clo_changed:false};return store.read(a);}
 if(tool.action==='save_pattern_work_order'){
  const {query,brief_change_quote,...input}=a,quote=changeQuote(context,brief_change_quote);
  if(brief_change_quote&&!quote)throw Error('Цитата не соответствует полному текущему поручению пользователя на изменение');
  const referenced=input.id?store.read({id:input.id}).order:null;
  if(referenced&&input.expected_revision!==referenced.revision)throw Error('Задание изменилось. Прочитайте текущую версию перед сохранением');
  const garmentQuery=query||referenced?.binding?.garment_id,g=garmentQuery?(context.runtime?.assertGarment?context.runtime.assertGarment(garmentQuery):context.stores.garments.find(garmentQuery)):null;
  if(referenced?.binding&&g&&referenced.binding.garment_id!==g.id)throw Error('Задание связано с другим изделием');
  const active=store.active();
  const previous=g?store.forGarment(g.id):referenced||(!active?.binding?active:null);
  let spec={...input},next=referenced?{...referenced,...spec}:{required_roles:[],finished_checks:[],preserve_parameters:[],...spec};
  const issue=transition(previous,next,quote);if(issue)throw Error(issue);
  const fork=referenced&&immutable.some(key=>input[key]!==undefined&&!isDeepStrictEqual(input[key],referenced[key]));
  if(fork){if(!quote)throw Error('Для пересмотра сохранённых требований нужна полная цитата актуального поручения; прежнее задание сохранено.');spec={...specification(referenced),...input};delete spec.id;delete spec.expected_revision;}
  if(quote){const notes=[...(spec.assumptions??referenced?.assumptions??[])];if(notes.length<32)notes.push(revisionNote(previous,quote));spec.assumptions=notes;}
  let result=store.save(spec);if(g)result=store.bind({id:result.order.id,garment:g,native_confirmed:true});
  if(context.turn){context.turn.work_order_id=result.order.id;context.turn.work_order_quote=quote;}
  const revision=revisionEvidence(previous,result.order,quote);
  return {...result,...(revision?{revision,previous_order_id:revision.previous_order_id,requirements_revised:!!previous&&previous.id!==result.order.id}:{}),context_saved:true,clo_changed:false,profile_changed:false};}
 const g=context.runtime?.assertGarment?context.runtime.assertGarment(a.query):context.stores.garments.find(a.query);return store.assess({id:a.id,garment:g});
}
function guard(context,garment){
 const file=path.join(path.dirname(context.stores.garments.file),'pattern-work-orders.json');if(!require('node:fs').existsSync(file))return null;
 const store=orders(context),active=store.active(),order=context.turn?.work_order_id?store.read({id:context.turn.work_order_id}).order:store.forGarment(garment.id)||(!active?.binding?active:null);if(!order)return null;
 const previous=store.forGarment(garment.id),foreign=order.binding&&order.binding.garment_id!==garment.id,issue=foreign?'Задание связано с другим изделием. Используйте требования изменяемого изделия.':transition(previous,order,changeQuote(context,context.turn?.work_order_quote));
 if(issue)return {valid:false,allows_construction:false,provisional:true,order_id:order.id,work_order_id:order.id,clo_changed:false,fit_verified:false,sewing_ready:false,message:issue};
 const report=store.assess({id:order.id,garment});
 // A qualitative brief without numerical finished criteria remains provisional;
 // it need not force the user to invent irrelevant dimensions to start a toile.
 const provisionalOnly=!order.finished_checks.length&&!report.missing_roles.length&&report.preserved_parameters.every(p=>p.status==='passed');
 return {...report,allows_construction:report.valid||provisionalOnly,work_order_id:order.id,message:report.valid?'Задание проверено по математической модели. Посадка не подтверждена.':provisionalOnly?'Обязательные детали сохранены. Численные критерии готового изделия не заданы; построение остаётся предварительным, соответствие размерам задания не подтверждено.':'Конструкция не выполняет сохранённое задание. Проверьте отсутствующие роли, размеры и сохраняемые параметры; не ослабляйте требования ради успешного отчёта.'};
}
function current(context){const file=path.join(path.dirname(context.stores.garments.file),'pattern-work-orders.json');if(!require('node:fs').existsSync(file))return null;return orders(context).read();}
function bind(context,job,result){if(!job.work_order_id||!job.garment||result.error||!result.patterns?.length)return null;const g=context.stores.garments.find(job.garment.id);return orders(context).bind({id:job.work_order_id,garment:g,native_confirmed:true});}
const instructions='Adapted garment-patternmaking workflow (CLO AI tools only): search_garment_patternmaking {query,limit?}, read_garment_patternmaking {id}, read_pattern_work_order {id?}, save_pattern_work_order {name,brief,required_roles:[stable role IDs],preserve_parameters?:[existing parameter keys],finished_checks?:[{id,role,kind:width|height|segment_length|seam_length|perimeter,target_mm,tolerance_mm,segments?,seam?,contour?:seam|cut}],assumptions?:[text],fabric?,closure?,id?,expected_revision?}, check_pattern_work_order {query,id?}. Inspect exact work-order schema through get_construction_capabilities before saving. Start from current project and explicit garment brief, not a compulsory universal checklist. Before substantial new drafting save a concise work order containing the actual requested piece roles (including closure/facing/lining/waistband/pockets when requested), known finished measurement criteria, source and provisional assumptions. Read a bound work order before editing/resuming. A failed source search is not a final refusal; research a suitable method and trial a construction. Metadata saves do not authorize geometry execution. Preserve required roles even if currently unbound: never rebuild requirements from whatever pieces were produced. Never weaken targets/tolerances to turn a failed check green. For a genuine changed brief create an explicitly revised order and explain the difference; do not treat a model-authored change as user approval. Keep source version and actual method choices; do not reuse another task body, arbitrary curve coordinates or universal ease. Body vs garment measurements, full/half/quarter circumference, wearing level, material/closure and measurement datum must be distinguished; unknown body dimensions remain unknown. Use only relevant cards/schema to keep the research short. Work-order width/height are WHOLE PIECE bounding dimensions, not a body circumference or anatomical level width. Partial seams use curve arc lengths and named zones, not endpoint chords. Contracts and mathematical checks are provisional evidence; native binding does not verify every criterion in CLO or physical fit. After revisions rerun checks, old evidence is stale. A simulation shell/cutout must not silently replace production darts/folds/facings; disclose unavailable construction. Primary-size physical feedback precedes claims of size-range approval. Keep existing current-project CLO bridge, mm convention, strict mathematical recipes, trial/preflight, manual sewing maps and real PDF exports; do not call upstream Valentina/GarmentCode SDKs, patch native files, invent automatic sewing, trust image inference as human sign-off or claim ready-to-sew from QA alone.';
module.exports={actions,contextActions,validateTool,catalog,read,orders,guard,bind,current,instructions:instructions+' For an existing garment, save_pattern_work_order can include query to bind current confirmed geometry as the baseline for preserve_parameters. Removing required roles, loosening tolerances, removing protected parameters or changing targets requires brief_change_quote containing the COMPLETE CURRENT user message (up to20000 characters; whitespace normalization allowed), not a substring or historical consent. Natural requests to make one item rather than a pair are valid brief revisions; do not demand a formal phrase such as revise the work order. With a verified current quote, id+expected_revision and changed immutable requirements automatically create a new order; old requirements stay available and the response returns previous_order_id and the new order.id. Never invent a quote. A revision quote only records a metadata change and does not authorize native execution: the current conversation approval and geometry preflight still apply. Unknown numerical criteria may remain provisional; explicit failed or unmeasurable criteria and missing required roles cannot be called passed.'};
