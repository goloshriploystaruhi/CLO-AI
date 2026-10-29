'use strict';
// Adapted principles: tailor-dressmaker, Copyright (c) 2026 Wonsuk Choi and
// Domain Experts contributors, MIT. The vendored source and complete licence
// remain in third_party/tailor-dressmaker. No upstream code is executed.
const SOURCE=Object.freeze({repository:'https://github.com/wonsukchoi/domain-experts',commit:'9554f15f4c20bfa121d1dc85db24cf4389c5b737',path:'roles/tailor-dressmaker/SKILL.md',license:'MIT',maturity:'draft'});
const KINDS=Object.freeze(['wrinkle','pull','excess','twist','mobility']);
const REGIONS=Object.freeze(['overall','waist','hips','seat','crotch','thigh','knee','hem','chest','bust','back','shoulder','armhole','sleeve','neck','collar','elbow','wrist','abdomen','side_seam','inseam','grainline']);
const SIDES=Object.freeze(['left','right','both','center','front','back','unspecified']);
const OBS_SOURCES=Object.freeze(['user','image','simulation','measurement','unknown']);
const FABRIC_TYPES=Object.freeze(['woven','knit','stretch_woven','unknown']);
const FABRIC_SOURCES=Object.freeze(['measured','manufacturer','estimated','unknown']);
const LIMITS=Object.freeze({observations:64,edges:64,parameters:64,measurements:64,pieces:64,output_characters:40000,query:300,observation_text:600,edge_id:120,stretch_percent:300,recovery_percent:100,required_increase_mm:10000,edge_mm:1000});
const REGION_LABELS={overall:'изделие целиком',waist:'талия',hips:'бёдра',seat:'область сидения',crotch:'средний и шаговый участки',thigh:'бедро ноги',knee:'колено',hem:'низ',chest:'грудь',bust:'область груди',back:'спинка',shoulder:'плечо',armhole:'пройма',sleeve:'рукав',neck:'горловина',collar:'воротник',elbow:'локоть',wrist:'запястье',abdomen:'живот',side_seam:'боковой шов',inseam:'шаговый шов',grainline:'долевая'};
const KIND_LABELS={wrinkle:'складки',pull:'натяжение',excess:'излишек объёма',twist:'перекручивание',mobility:'ограничение движения'};
function strict(value,allowed,required=[],label='Оценка посадки'){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error(label+': ожидается обычный объект');
 for(const key of Reflect.ownKeys(value)){if(typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'))throw Error(label+': неизвестное поле или вычисляемое свойство');}
 for(const key of required)if(!Object.hasOwn(value,key)||value[key]===undefined)throw Error(label+': не указано поле '+key);
}
function text(value,max,label){if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Error(label+': неверный текст');return value.trim();}
function number(value,min,max,label){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(label+': число вне допустимого диапазона');return value;}
function enumeration(value,allowed,label){if(!allowed.includes(value))throw Error(label+': неизвестное значение');}
function validateOwnArgs(args={}){
 strict(args,['query','observations','fabric']);if(args.query!==undefined)text(args.query,LIMITS.query,'Изделие');
 if(args.observations!==undefined){if(!Array.isArray(args.observations)||args.observations.length>LIMITS.observations)throw Error('Допустимо до 64 наблюдений');
  for(const observation of args.observations){strict(observation,['kind','region','side','source','text'],['kind','region'],'Наблюдение');enumeration(observation.kind,KINDS,'Признак');enumeration(observation.region,REGIONS,'Участок');if(observation.side!==undefined)enumeration(observation.side,SIDES,'Сторона');if(observation.source!==undefined)enumeration(observation.source,OBS_SOURCES,'Источник наблюдения');if(observation.text!==undefined)text(observation.text,LIMITS.observation_text,'Описание наблюдения');}}
 if(args.fabric!==undefined){const f=args.fabric;strict(f,['type','stretch_percent','recovery_percent','source','bias_cut'],[],'Материал');if(f.type!==undefined)enumeration(f.type,FABRIC_TYPES,'Тип материала');if(f.source!==undefined)enumeration(f.source,FABRIC_SOURCES,'Источник свойств материала');if(f.stretch_percent!==undefined)number(f.stretch_percent,0,LIMITS.stretch_percent,'Растяжимость');if(f.recovery_percent!==undefined)number(f.recovery_percent,0,LIMITS.recovery_percent,'Восстановление');if(f.bias_cut!==undefined&&typeof f.bias_cut!=='boolean')throw Error('Косой крой должен быть указан явно: да или нет');}
 return true;
}
function validateAlterationArgs(args){
 strict(args,['required_increase_mm','edges'],['required_increase_mm','edges'],'Оценка переделки');number(args.required_increase_mm,0,LIMITS.required_increase_mm,'Требуемое увеличение');
 if(!Array.isArray(args.edges)||!args.edges.length||args.edges.length>LIMITS.edges)throw Error('Укажите 1–64 физических среза');const ids=new Set();
 for(const edge of args.edges){strict(edge,['id','available_mm','retain_mm'],['id','retain_mm'],'Припуск среза');const id=text(edge.id,LIMITS.edge_id,'Идентификатор среза');if(ids.has(id))throw Error('Один физический срез нельзя учитывать дважды');ids.add(id);if(edge.available_mm!==undefined)number(edge.available_mm,0,LIMITS.edge_mm,'Измеренный припуск');number(edge.retain_mm,0,LIMITS.edge_mm,'Сохраняемый припуск');}
 return true;
}
function alterationFeasibility(args){
 validateAlterationArgs(args);let known=0,unknown=false;const warnings=[];
 const edges=args.edges.map(edge=>{const available=edge.available_mm??null,releasable=available===null?null:Math.max(available-edge.retain_mm,0);if(releasable===null)unknown=true;else known+=releasable;if(available!==null&&available<edge.retain_mm)warnings.push('Срез «'+edge.id+'»: имеющийся припуск меньше требуемого остатка; проверьте обработку.');if(edge.retain_mm===0)warnings.push('Срез «'+edge.id+'»: указан нулевой остаток. Арифметическая ёмкость не подтверждает работоспособный шов и не рекомендует выпускать весь припуск; определите сохраняемый остаток для конкретной обработки.');return {id:edge.id,available_mm:available,retain_mm:edge.retain_mm,releasable_mm:releasable};});
 const arithmeticEpsilon=1e-9,difference=args.required_increase_mm-known;
 const status=unknown?'unknown':difference<=arithmeticEpsilon?'within_measured_capacity':'exceeds_measured_capacity';
 return {schema_version:1,read_only:true,unit:'mm',arithmetic_epsilon_mm:arithmeticEpsilon,arithmetic_epsilon_note:'Компенсация двоичной арифметики; это не погрешность измерения и не физический допуск переделки.',status,required_increase_mm:args.required_increase_mm,measured_release_capacity_mm:unknown?null:known,known_lower_bound_mm:known,deficit_mm:unknown?null:difference<=arithmeticEpsilon?0:difference,edges,warnings,
  message:unknown?'Возможность выпуска пока неизвестна: измерьте фактические припуски отсутствующих срезов. Заложенный в лекале припуск не заменяет измерение готовой вещи.':status==='within_measured_capacity'?'Увеличение укладывается в сумму предоставленных запасов. Это расчёт запаса ткани, а не разрешение на переделку.':'Увеличение превышает сумму предоставленных запасов ткани.',
  calculation:'Каждый срез — одна физическая сторона припуска. Суммируется max(измеренный припуск − сохраняемый остаток, 0); дополнительного удвоения нет.',
  evidence_status:'provided_physical_measurements_not_independently_verified',apply_authorized:false,fit_verified:false,sewing_ready:false,
  required_checks:['Проверить, что перечислены разные физические срезы и размеры сняты с готовой вещи.','Проверить прочность ткани, следы старой строчки, обработку и влияние переделки на соседние участки.']};
}
const LOWER=new Set(['wide_trousers_experimental_v1','jeans_loose_v1','shorts_loose_v1','boxers_loose_v1','jumpsuit_work_v1','balloon_tapered_v1','women_baggy_boilersuit_v1','trousers_utility_v1','jumpsuit_utility_v1']);
const UPPER=new Set(['tshirt_drop_v1','top_sleeveless_v1','shirt_stand_v1','hoodie_drop_v1','sweatshirt_drop_v1','jacket_unstructured_v1','jacket_stand_v1','coat_wrap_v1','dress_shift_v1','jumpsuit_work_v1','workwear_zip_jacket_v1','women_baggy_boilersuit_v1','tshirt_setin_engineering_v1','jacket_utility_v1','jumpsuit_utility_v1']);
function finite(value){return typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=1000000;}
function measurement(entry){if(!entry||typeof entry!=='object'||!finite(entry.value))return null;const factor=entry.unit==='mm'?1:entry.unit==='cm'?10:entry.unit==='in'?25.4:null;return factor&&entry.value>0?entry.value*factor:null;}
function knownRecipe(g){return g.method==='parametric_design_v1'&&g.pattern_design?.recipe==='patternmaking_skirt_v1'&&g.recipe_details?.id==='patternmaking_skirt_v1';}
function meaning(g,key){
 const recipe=knownRecipe(g),lower=LOWER.has(g.method),upper=UPPER.has(g.method),skirt=g.method==='skirt_aline_v1';
 if(key==='waist_ease_mm'&&(recipe||lower||skirt))return {label:'Прибавка к полному обхвату талии',basis:'full_circumference',scope:'whole_waist',measurement:lower?'garment_waist_girth':'waist',regions:['waist','abdomen']};
 if(key==='hip_ease_mm'&&(recipe||lower))return {label:'Прибавка к полному обхвату бёдер',basis:'full_circumference',scope:'whole_hips',measurement:'hips',regions:['hips','seat','thigh']};
 if(key==='chest_ease_mm'&&upper)return {label:'Прибавка к полному обхвату груди',basis:'full_circumference',scope:'whole_chest',measurement:'chest',regions:['chest','bust','back','armhole']};
 if(key==='biceps_ease_mm'&&['workwear_zip_jacket_v1','women_baggy_boilersuit_v1','tshirt_setin_engineering_v1'].includes(g.method))return {label:'Прибавка к обхвату плеча',basis:'full_circumference',scope:'whole_upper_arm',measurement:'biceps',regions:['sleeve','armhole','shoulder']};
 if(['hem_flat_mm','knee_flat_mm'].includes(key)&&lower)return {label:key==='hem_flat_mm'?'Половина готового обхвата низа одной штанины':'Половина готового обхвата одной штанины в колене',basis:'half_leg_circumference',scope:'both_legs',regions:[key==='hem_flat_mm'?'hem':'knee']};
 const local={front_dart_length_mm:['Длина передних вытачек','front',['waist','abdomen']],back_dart_length_mm:['Длина задних вытачек','back',['waist','back','seat']],back_center_drop_mm:['Понижение центра задней талии','back',['waist','back','seat']],front_balance_mm:['Перераспределение ширины между передом и спинкой','front_back_distribution',['waist','hips']],max_side_suppression_mm:['Распределение заужения между боком и вытачками','front_back_distribution',['waist','hips']],side_raise_mm:['Подъём боковой точки талии','front_back_distribution',['waist','side_seam']]};
 if(recipe&&local[key]){const [label,scope,regions]=local[key];return {label,basis:'local_length',scope,regions};}
 return {label:typeof g.pattern_design?.parameter_labels?.[key]==='string'?g.pattern_design.parameter_labels[key]:key,basis:'unknown',scope:'unknown',regions:[]};
}
function parameterFacts(g){return Object.entries(g.parameters||{}).slice(0,LIMITS.parameters).filter(([,value])=>finite(value)).map(([id,value])=>{const spec=meaning(g,id),affected=['front','back'].includes(spec.scope)?(Array.isArray(g.pieces)?g.pieces:[]).map(p=>p.role).filter(role=>typeof role==='string'&&(role===spec.scope||role.startsWith(spec.scope+'_'))):null;return {id,current_value:value,unit:id.endsWith('_mm')?'mm':id.endsWith('_percent')?'%':id.endsWith('_count')?'шт.':null,...spec,
 affected_piece_roles:affected,coupled_scope:spec.scope==='unknown'?null:spec.scope.startsWith('whole_')||['front_back_distribution','both_legs'].includes(spec.scope)||(affected?.length||0)>1,
 interpretation_source:spec.basis==='unknown'?'not_established':'known_method_definition',caution:spec.basis==='unknown'?'Смысл и область действия нужно сверить с формулами этой конструкции.':spec.scope.startsWith('whole_')?'Общий обхват; изменение затронет несколько деталей и не является локальной коррекцией одного участка.':spec.scope==='front_back_distribution'?'Меняет распределение сразу переда и спинки; проверить оба участка.':(affected?.length||0)>1?'Один параметр действует на несколько половинок этого участка; он не меняет одну выбранную половинку независимо.':'Проверить зависимые точки и сопряжения перед применением.'};});}
function easeFacts(g,parameters){return parameters.filter(p=>['full_circumference','half_leg_circumference'].includes(p.basis)).map(p=>{
 const body=p.measurement?measurement(g.measurement_snapshot?.[p.measurement]):null;
 const expected=p.basis==='half_leg_circumference'?2*p.current_value:body===null?null:body+p.current_value;
 let saved=null;if(knownRecipe(g)){if(p.id==='waist_ease_mm'&&finite(g.recipe_details.waist_closed_mm))saved=g.recipe_details.waist_closed_mm;if(p.id==='hip_ease_mm'&&finite(g.recipe_details.hip_circumference_mm))saved=g.recipe_details.hip_circumference_mm;}
 return {parameter:p.id,basis:p.basis,scope:p.scope,body_measurement_id:p.measurement||null,body_mm:body,body_status:p.measurement?g.measurement_snapshot?.[p.measurement]?.status||'unknown':null,current_value_mm:p.current_value,target_finished_mm:expected,saved_finished_mm:saved,saved_finished_source:saved===null?'not_available':'saved_recipe_calculation',physical_measurement_verified:false,automatic_recommendation:false};});}
function fabricFacts(input={}){return {type:input.type||'unknown',stretch_percent:input.stretch_percent??null,recovery_percent:input.recovery_percent??null,source:input.source||'unknown',bias_cut:input.bias_cut??null,independently_verified:false,negative_ease_recommended:false,
 note:'Тип ткани и заявленный процент растяжения не определяют допустимую отрицательную прибавку. Нужны проба ткани, направление нагрузки, восстановление и конструктивная методика.'};}
function causes(observation){
 if(observation.kind==='twist')return ['Направление нити при фактическом раскрое может отличаться от разметки лекала.','Возможны перекос стачивания, неравномерная посадка или растяжение срезов.','Возможны асимметрия фигуры, баланс деталей или изменение ткани после обработки.'];
 if(observation.kind==='mobility')return ['Свобода движения может ограничиваться локальным объёмом или распределением прибавок.','Возможны неверные высота проймы, направление рукава либо баланс сидения и корпуса для этой конструкции.','Ограничение может возникать из-за материала, подкладки, застёжки или технологии шва.'];
 if(observation.kind==='excess')return ['Возможен локальный избыток объёма или его неверное распределение.','Похожие признаки даёт лишняя вертикальная длина или несоответствие осанке.','Возможны положение вытачки, поведение материала или перекос при сборке.'];
 if(observation.kind==='pull')return ['Возможен недостаток объёма именно в указанном участке; общий обхват при этом может быть достаточен.','Натяжение может быть связано с вертикальным балансом или соседним участком, который тянет ткань.','Возможны неверное направление нити, застёжка или недостаточное восстановление материала.'];
 return ['Складки могут возникать из-за локального объёма, длины или положения вытачки.','Возможны нарушения баланса либо тяга со стороны соседнего участка.','Похожие складки возникают из-за направления нити, обработки и свойств материала.'];
}
function orientation(text=''){const diagonal=/диагон|diagonal/i.test(text),horizontal=/горизонт|horizontal/i.test(text),vertical=/вертик|vertical/i.test(text);const found=[diagonal&&'diagonal',horizontal&&'horizontal',vertical&&'vertical'].filter(Boolean);return found.length===1?found[0]:found.length?'mixed':'unknown';}
function hypotheses(observations,parameters){return observations.map((observation,index)=>{
 const candidates=parameters.filter(p=>(observation.region==='overall'||p.regions.includes(observation.region))&&!(observation.side==='back'&&p.scope==='front')&&!(observation.side==='front'&&p.scope==='back')).slice(0,8);
 const checks=['Уточнить направление, расположение и условия появления признака: стоя, сидя или в движении.','Сравнить перед, спинку и обе стороны; отметить участки, которые уже подходят и должны сохраниться.','Проверить разметку долевой, фактический раскрой и сборку, затем сделать локальную пробу на макете.'];
 if(observation.source==='image')checks.unshift('Фото даёт визуальный признак; без масштаба и вида с нескольких сторон оно не определяет величину правки в миллиметрах.');
 if(!candidates.length)checks.push('Для этого участка не найден параметр с подтверждённой областью действия; сначала проверить зависимости существующей схемы.');
 const local=candidates.some(p=>['front','back'].includes(p.scope)&&(!observation.side||observation.side==='unspecified'||p.scope===observation.side));
 return {observation_index:index,region:observation.region,region_label:REGION_LABELS[observation.region],side:observation.side||'unspecified',reported_kind:observation.kind,reported_kind_label:KIND_LABELS[observation.kind],reported_text:observation.text||null,source:observation.source||'unknown',orientation:orientation(observation.text),evidence_status:'reported_not_independently_verified',possible_causes:causes(observation),required_checks:checks,
 candidate_parameters:candidates.map(p=>({id:p.id,current_value:p.current_value,unit:p.unit,basis:p.basis,scope:p.scope,affected_piece_roles:p.affected_piece_roles,coupled_scope:p.coupled_scope,preserve_caution:p.caution})),locality_status:local?'local_controls_exist_effect_requires_check':'not_directly_supported',diagnosis_confirmed:false,suggested_delta_mm:null,automatic_changes:[]};});}
function excerpt(value,max=160){
 if(typeof value!=='string'||value.length<=max)return value;
 let end=max-1;if(/[\uD800-\uDBFF]/.test(value[end-1]))end--;
 return value.slice(0,end)+'…';
}
function boundedAssessment(report){
 const construction=report.construction,original=report.hypotheses;
 const coverage={complete:true,compacted:false,output_limit_characters:LIMITS.output_characters,
  observations_total:report.observations_count,observations_represented:original.length,observations_omitted:0,
  observation_texts_total:original.filter(h=>h.reported_text!==null).length,observation_texts_returned:0,observation_texts_shortened:0,observation_texts_omitted:0,
  hypothesis_groups_total:original.length,hypothesis_groups_returned:original.length,
  parameter_facts_total:construction.parameters.length,parameter_facts_returned:construction.parameters.length,parameter_facts_omitted:0,
  measurements_total:report.profile.measurements.length,measurements_returned:report.profile.measurements.length,measurements_omitted:0,
  pieces_total:construction.pieces.length,pieces_returned:construction.pieces.length,pieces_omitted:0};
 report.output_coverage=coverage;report.limits={...LIMITS};
 function update(){
  coverage.hypothesis_groups_returned=report.hypotheses.length;
  coverage.observations_represented=report.hypotheses.reduce((n,h)=>n+(h.observation_count||1),0);
  coverage.observations_omitted=coverage.observations_total-coverage.observations_represented;
  coverage.observation_texts_returned=report.hypotheses.reduce((n,h)=>n+(h.reported_text===null?0:1)+(h.additional_text_samples?.length||0),0);
  coverage.observation_texts_shortened=report.hypotheses.reduce((n,h)=>n+Number(h.reported_text_is_excerpt===true)+(h.additional_text_samples||[]).filter(t=>t.shortened).length,0);
  coverage.observation_texts_omitted=coverage.observation_texts_total-coverage.observation_texts_returned;
  for(const [name,items] of [['parameter_facts',construction.parameters],['measurements',report.profile.measurements],['pieces',construction.pieces]]){
   coverage[name+'_returned']=items.length;coverage[name+'_omitted']=coverage[name+'_total']-items.length;
  }
 }
 function fits(){update();return JSON.stringify(report).length<=39000;}
 if(fits())return report;
 coverage.complete=false;coverage.compacted=true;
 construction.parameter_scope_rules=['Полная прибавка относится ко всему обхвату, а не к одной детали.','coupled_scope=true означает совместное изменение нескольких участков; подходящие участки нужно отдельно сохранять и проверять.','Неизвестный смысл параметра не даёт основания назначать величину правки; после выбора нужна обычная строгая проверка.'];
 const groups=new Map();
 for(const h of original){
  const key=JSON.stringify([h.reported_kind,h.region,h.side,h.source,h.orientation]);
  let group=groups.get(key);
  if(!group){
   group={...h,observation_indices:[h.observation_index],observation_count:1,
    reported_text:excerpt(h.reported_text),reported_text_original_characters:h.reported_text?.length||0,
    reported_text_is_excerpt:h.reported_text!==null&&h.reported_text.length>160,additional_text_samples:[],
    candidate_parameters:h.candidate_parameters.map(({id,current_value,unit,basis,scope,coupled_scope})=>({id,current_value,unit,basis,scope,coupled_scope})),
    parameter_details_reference:'construction.parameters; сведения могли быть опущены, см. output_coverage'};
   groups.set(key,group);
  }else{
   group.observation_indices.push(h.observation_index);group.observation_count++;
   if(h.reported_text!==null&&!group.additional_text_samples.length&&h.reported_text!==original[group.observation_index].reported_text){
    group.additional_text_samples.push({observation_index:h.observation_index,text:excerpt(h.reported_text),original_characters:h.reported_text.length,shortened:h.reported_text.length>160});
   }
  }
 }
 coverage.hypothesis_groups_total=groups.size;report.hypotheses=[...groups.values()];
 report.output_warning='Это сокращённая сводка, а не полный отчёт. Повторяющиеся признаки сгруппированы; тексты могут быть выдержками. Число представленных и опущенных наблюдений и фактов указано в output_coverage. Для опущенных случаев выполните отдельную оценку меньшей группы.';
 for(const p of construction.parameters){p.label=excerpt(p.label);p.caution=excerpt(p.caution);}
 for(const m of report.profile.measurements){m.source=excerpt(m.source,120);m.status=excerpt(m.status,120);}
 for(const p of construction.pieces)p.name=excerpt(p.name);
 for(const p of construction.ease)p.body_status=excerpt(p.body_status,120);
 report.garment.name=excerpt(report.garment.name);
 if(fits())return report;
 report.hypotheses=report.hypotheses.slice(0,12);
 const candidateIds=new Set(report.hypotheses.flatMap(h=>h.candidate_parameters.map(p=>p.id)));
 construction.parameters=construction.parameters.filter(p=>candidateIds.has(p.id)).concat(construction.parameters.filter(p=>!candidateIds.has(p.id))).slice(0,24);
 const bodyIds=new Set(construction.ease.map(e=>e.body_measurement_id).filter(Boolean));
 report.profile.measurements=report.profile.measurements.filter(m=>bodyIds.has(m.id)).concat(report.profile.measurements.filter(m=>!bodyIds.has(m.id))).slice(0,16);
 construction.pieces=construction.pieces.slice(0,12);
 if(fits())return report;
 // Drop whole records only. Provenance, version, checks and uncertainty never
 // become malformed JSON or disappear behind the core agent's text cutoff.
 for(const [items,minimum] of [[report.hypotheses,1],[construction.parameters,8],[report.profile.measurements,8],[construction.pieces,4],[construction.parameters,0],[report.profile.measurements,0],[construction.pieces,0],[report.hypotheses,0]]){
  while(items.length>minimum&&!fits())items.pop();
  if(fits())return report;
 }
 // Corrupt/oversized saved labels must not turn this optional review into a
 // construction blocker. Keep a versioned minimal report with explicit gaps.
 const id=value=>typeof value==='string'&&value.length<=300?value:null;
 report.garment={id:id(report.garment.id),name:typeof report.garment.name==='string'?excerpt(report.garment.name):null,
  version:Number.isSafeInteger(report.garment.version)?report.garment.version:null,method:id(report.garment.method),recipe:id(report.garment.recipe)};
 report.profile.id=id(report.profile.id);construction.ease=[];
 report.unresolved_checks.push('Часть сохранённого контекста содержит недопустимо большие поля; оставлена минимальная сводка, подробности нужно проверить отдельно.');
 update();return report;
}
function assess(garment,args={}){
 validateOwnArgs(args);if(!garment||typeof garment!=='object'||Array.isArray(garment))throw Error('Для оценки нужно выбрать существующее изделие');
 const observations=args.observations||[],parameters=parameterFacts(garment),fabric=fabricFacts(args.fabric),snapshot=garment.measurement_snapshot||{};
 const context=garment.profile_context||{},reportedSex=context.sex??context.metadata?.sex,sex=['female','male'].includes(reportedSex)?reportedSex:'unspecified';
 const profile={id:garment.profile_id||context.id||null,sex,sex_inferred:false,source:'construction_measurement_snapshot',measurements:Object.entries(snapshot).slice(0,LIMITS.measurements).map(([id,entry])=>({id,value:finite(entry?.value)?entry.value:null,unit:typeof entry?.unit==='string'?entry.unit:null,value_mm:measurement(entry),source:typeof entry?.source==='string'?entry.source:'unknown',status:typeof entry?.status==='string'?entry.status:'unknown'}))};
 const qa=garment.qa_report||{},pairs=Array.isArray(garment.sewing_graph)?garment.sewing_graph:[],pieces=Array.isArray(garment.pieces)?garment.pieces:[];
 const versionMatches=Number.isSafeInteger(garment.version)&&garment.version>=1&&qa.garment_version===garment.version,gaps=[];
 if(!observations.length)gaps.push('Нет наблюдений примерки. Можно проверить исходные данные и план примерки, но нельзя диагностировать посадку.');
 if(!profile.measurements.length)gaps.push('В конструкции нет снимка мерок; размеры тела не подставлены.');
 if(profile.measurements.some(m=>m.value_mm===null||m.status!=='verified'))gaps.push('Часть сохранённых мерок отсутствует или не подтверждена; исходные значения и статусы сохранены.');
 if(sex==='unspecified')gaps.push('Пол в контексте конструкции не указан; он не определяется по имени или силуэту.');
 if(fabric.source==='unknown'||fabric.source==='estimated'||fabric.stretch_percent===null||fabric.recovery_percent===null)gaps.push('Свойства ткани недостаточно подтверждены: нужна проба растяжения и восстановления в рабочих направлениях.');
 if(fabric.bias_cut===true)gaps.push('Указан косой крой: отдельно проверить деформацию, отвисание и стабилизацию срезов; готовой поправки из этого признака нет.');
 if(qa.valid!==true||!versionMatches)gaps.push('Нет положительной сохранённой проверки для этой версии; перед изменением повторить обычную проверку конструкции.');
 return boundedAssessment({schema_version:1,status:'provisional',read_only:true,assessment_kind:'fit_hypotheses',source:{...SOURCE,url:SOURCE.repository+'/blob/'+SOURCE.commit+'/'+SOURCE.path},
  garment:{id:garment.id||null,name:garment.name||null,version:garment.version??null,method:garment.method||null,recipe:garment.pattern_design?.recipe||null},profile,
  construction:{parameters,ease:easeFacts(garment,parameters),seam_map:{declared_connections:pairs.length,internal_connections:pairs.filter(r=>r?.a?.internal_line!==undefined||r?.b?.internal_line!==undefined).length,source:'saved_sewing_graph',native_sewing_verified:false},
   pieces:pieces.slice(0,LIMITS.pieces).map(p=>({id:p.id||null,role:p.role||null,name:p.name||null,grain_mark_present:Array.isArray(p.grainline)&&p.grainline.length===2,grain_mark_is_native_verification:false,internal_lines_count:Array.isArray(p.internal_lines)?p.internal_lines.length:0,darts_count:Array.isArray(p.dart_details)?p.dart_details.length:0})),
   recipe_facts:knownRecipe(garment)?{id:'patternmaking_skirt_v1',waist_closed_mm:finite(garment.recipe_details.waist_closed_mm)?garment.recipe_details.waist_closed_mm:null,hip_circumference_mm:finite(garment.recipe_details.hip_circumference_mm)?garment.recipe_details.hip_circumference_mm:null,dart_count:Number.isSafeInteger(garment.recipe_details.dart_count)?garment.recipe_details.dart_count:null,source:'saved_recipe_calculation',independently_rerun:false}:null,
   material_assignment:{fabric_index:Number.isSafeInteger(garment.material?.fabric_index)?garment.material.fabric_index:null,behavior_inferred:false},
   saved_geometry_check:{valid:typeof qa.valid==='boolean'?qa.valid:null,version_matches:versionMatches,independently_rerun:false}},
  fabric,observations_count:observations.length,hypotheses:hypotheses(observations,parameters),unresolved_checks:gaps,
  next_steps:['Проверить перечисленные конкурирующие причины на макете и сохранить результаты наблюдений.','Выбрать локальную правку по подтверждённой причине, сохраняя подходящие участки; общей причиной может быть и общий недостаток прибавки.','Любую выбранную правку отдельно пересчитать, проверить строгими геометрическими и шовными проверками и только затем применять в CLO.'],
  message:'Это предварительная оценка по сохранённой конструкции и сообщённым признакам. Складка не задаёт единственный диагноз или величину изменения.',
  automatic_changes:[],apply_authorized:false,requires_preflight:true,fit_verified:false,sewing_ready:false});
}
function describe(){return {name:'Предварительная оценка посадки',read_only:true,limits:{...LIMITS},
 schema:{
  assessment:{allowed:['query','observations','fabric'],required:[],
   observations:{max_items:64,item:{required:['kind','region'],allowed:['kind','region','side','source','text'],kind:[...KINDS],region:[...REGIONS],side:[...SIDES],source:[...OBS_SOURCES],text_max:600}},
   fabric:{allowed:['type','stretch_percent','recovery_percent','source','bias_cut'],type:[...FABRIC_TYPES],source:[...FABRIC_SOURCES],stretch_percent:[0,300],recovery_percent:[0,100],bias_cut:'boolean'}},
  alteration:{required:['required_increase_mm','edges'],edges:{min_items:1,max_items:64,item:{required:['id','retain_mm'],allowed:['id','available_mm','retain_mm'],available_mm:[0,1000],retain_mm:[0,1000]}}}
 },
 rules:['Наблюдения дают гипотезы и конкурирующие причины, а не единственный диагноз или размер правки.','Используются только параметры и снимок мерок выбранного изделия; пол и размеры не угадываются.','Полный обхват и половина обхвата различаются только для явно поддержанных методик; остальные параметры имеют неизвестный смысл.','Неизвестные свойства материала не заменяются типовыми значениями.','Запас для переделки считается по фактическим физическим срезам, а не по заложенному припуску лекала.','Оценка не выполняет правки, не разрешает применение и не подтверждает готовность к пошиву.'],source:{...SOURCE}};}
module.exports={assess,describe,validateOwnArgs,validateAlterationArgs,alterationFeasibility};
