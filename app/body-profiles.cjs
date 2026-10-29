const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const constructionCatalog=require('../construction-catalog.json');
const helpRegistry=require('./measurement-help.js');
const measurementFields=require('./measurement-fields.js');
const groups={
 'Общие':`height|Рост;weight|Масса тела;age|Возраст`,
 'Шея и корпус':`neck|Обхват шеи;neck_base|Обхват основания шеи;shoulder_width|Ширина плеч;shoulder_length|Длина плеча;shoulder_slope|Наклон плеч;shoulder_height|Высота плечевой точки;front_waist_length|Длина переда до талии;back_waist_length|Длина спины до талии;chest_width|Ширина груди;back_width|Ширина спины;bust_height|Высота груди;bust_spacing|Расстояние между центрами груди;chest|Обхват груди;upper_chest|Обхват над грудью;underbust|Обхват под грудью;armhole_depth|Глубина проймы;armhole_girth|Обхват корпуса на уровне проймы;waist_level|Положение линии талии`,
 'Талия и таз':`waist|Обхват естественной талии;garment_waist_girth|Обхват тела на уровне посадки;abdomen|Обхват живота;hips|Обхват бёдер;upper_hips|Обхват верхней части бёдер;hip_height|Высота бёдер от пола;waist_floor|Высота талии от пола;seat_length|Длина сидения;seated_depth|Глубина сидения сидя;crotch_arc|Дуга сидения через промежность;waist_hip_length|Длина от талии до бёдер`,
 'Руки':`arm_length|Длина руки от плеча до запястья;neck_wrist_length|Длина от основания шеи до запястья;bent_arm_length|Длина согнутой руки;upper_arm_length|Длина руки до локтя;forearm_length|Длина предплечья;biceps|Обхват бицепса;elbow|Обхват локтя;forearm|Обхват предплечья;wrist|Обхват запястья;hand|Обхват кисти;hand_length|Длина кисти;palm_width|Ширина ладони`,
 'Ноги':`outseam|Длина ноги от талии до пола;inseam|Длина от промежности до пола;waist_knee|Длина от талии до колена;knee_floor|Высота колена от пола;thigh|Обхват верхней части бедра;thigh_level|Обхват бедра на выбранном уровне;knee|Обхват колена;below_knee|Обхват под коленом;calf|Обхват икры;ankle|Обхват щиколотки;ankle_floor|Высота щиколотки от пола;foot_length|Длина стопы;foot_width|Ширина стопы;instep|Обхват подъёма стопы`,
 'Голова':`head|Обхват головы;head_height|Высота головы;head_width|Ширина головы;head_length|Длина от лба до затылка;crown_neck|Расстояние от макушки до основания шеи`
};
let catalog=Object.entries(groups).flatMap(([category,rows])=>rows.split(';').map(row=>{
 const [id,name]=row.split('|');const unit=id==='weight'?'kg':id==='age'?'year':id==='shoulder_slope'?'deg':'mm';
 return {id,name:id==='waist_hip_length'?'Высота бёдер от талии':id==='chest_width'?'Ширина переда':name,category,unit,min:0,max:unit==='kg'?700:unit==='year'?130:unit==='deg'?90:4000,basic:helpRegistry.basicIds.includes(id),
 landmarks:[name],instruction:name.startsWith('Обхват')?'Измерьте замкнутой лентой на указанном уровне без сдавливания.':`Измерьте: ${name.toLowerCase()}. Зафиксируйте ориентиры и сторону в примечании.`,required_for:[]};
}));
const requirements={
 trousers:['waist','hips','outseam','inseam','waist_knee','seated_depth','crotch_arc','waist_hip_length'],
 tshirt:['chest','shoulder_width','back_waist_length','arm_length','biceps'],
 shirt:['neck','chest','waist','shoulder_length','back_width','front_waist_length','back_waist_length','arm_length','wrist','armhole_depth'],
 jacket:['chest','waist','hips','shoulder_width','shoulder_slope','back_width','front_waist_length','back_waist_length','arm_length','biceps','armhole_depth'],
 dress:['chest','waist','hips','front_waist_length','back_waist_length','bust_height','bust_spacing','waist_hip_length'],
 skirt:['waist','hips','waist_hip_length'],jumpsuit:['chest','waist','hips','front_waist_length','back_waist_length','outseam','inseam','crotch_arc'],
 hoodie:['chest','shoulder_width','back_waist_length','arm_length','biceps','head'],underwear:['waist','hips','crotch_arc','underbust','chest'],headwear:['head','head_height','head_width','head_length']};
const labels={trousers:'Брюки / джинсы / шорты',tshirt:'Футболка / майка / топ',shirt:'Рубашка / блузка',jacket:'Куртка / пальто / жакет',dress:'Платье',skirt:'Юбка',jumpsuit:'Комбинезон',hoodie:'Худи / свитшот',underwear:'Нижнее бельё',headwear:'Головной убор'};
for(const m of catalog)m.required_for=Object.entries(requirements).filter(([,ids])=>ids.includes(m.id)).map(([id])=>'planning:'+id);
catalog=measurementFields.annotate(catalog,{basicIds:helpRegistry.basicIds,methods:constructionCatalog,planning:requirements});
const clone=x=>JSON.parse(JSON.stringify(x)),now=()=>new Date().toISOString();
function text(v,max=300){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Некорректный текст');return v.trim();}
class BodyProfiles{
 constructor(file){this.file=file;const exists=fs.existsSync(file);this.data=exists?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,schema_version:2,profiles:[],active:null,custom:[]};if(this.data.version!==1)throw Error('Неизвестная версия профилей');this._committed=clone(this.data);
  if(this.data.schema_version!=null&&![1,2].includes(this.data.schema_version))throw Error('Эта версия профилей создана более новым CLO AI. Исходный файл не изменён');
  if(this.data.schema_version!==2){const backup=file+'.pre-universal-v1.json';if(exists&&!fs.existsSync(backup))fs.copyFileSync(file,backup);for(const p of this.data.profiles){p.profile_type='person';for(const m of Object.values(p.measurements||{})){if(m.source==null){m.source='import';m.migration_source_unknown=true;}if(m.status==null)m.status='unverified';}}this.data.schema_version=2;this.data.migrated_at=now();this.save();}
 }
 save(){try{require('./atomic-json.cjs').writeJSON(this.file,this.data,{backup:true});this._committed=clone(this.data);}catch(error){this.data=clone(this._committed);throw error;}}
 definitions(){return [...catalog,...(this.data.custom||[])].map(m=>({...m,help:helpRegistry.getHelp(m)}));}
 profile(id=this.data.active){const p=this.data.profiles.find(p=>p.id===id);if(!p)throw Error('Выберите профиль');return p;}
 snapshot(){return clone({profiles:this.data.profiles,active:this.data.active,catalog:this.definitions(),methods:[...Object.values(constructionCatalog).filter(m=>m.id!=='wide_trousers_experimental_v1').map(m=>({id:'garment:'+m.id,name:m.name+' — экспериментальная конструкция'})),{id:'garment:wide_trousers_experimental_v1',name:'Широкие брюки — экспериментальный комплект'},{id:'experimental:quarter_trouser',name:'Экспериментальная четвертная панель брюк'},...Object.entries(labels).map(([id,name])=>({id:'planning:'+id,name:name+' · предварительный список'}))]});}
 create({name='Новый профиль',description='',units='cm',metadata={}}){require('./profile-context.cjs').validate(metadata);if(!['mm','cm','in'].includes(units))throw Error('Выберите миллиметры, сантиметры или дюймы');const p={id:randomUUID(),profile_type:'person',name:text(name),description:String(description).slice(0,2000),units,metadata:clone(metadata),measurements:{},history:[],created_at:now(),updated_at:now()};this.data.profiles.push(p);this.data.active=p.id;this.save();return clone(p);}
 update({id,measurement,value,unit,source='manual',status='unverified',note=''}){
 const p=this.profile(id),defs=this.definitions(),def=defs.find(m=>m.id===measurement);if(!def)throw Error('Неизвестная мерка');
 if(!['manual','import','calculated','estimated'].includes(source)||!['unverified','verified','disputed'].includes(status))throw Error('Некорректный источник или статус');
 let canonical=null;
 if(value!==null){if(typeof value!=='number'||!Number.isFinite(value))throw Error('Введите число, например 96,5');const factor=def.unit==='mm'?{mm:1,cm:10,in:25.4}[unit]:unit===def.unit?1:undefined;if(!factor)throw Error('Единицы не подходят к этой мерке. Проверьте выбор рядом с полем');canonical=value*factor;if(!Number.isFinite(canonical)||canonical<0||(canonical===0&&!['age','shoulder_slope'].includes(def.id)))throw Error('Мерка должна быть больше нуля. Если она неизвестна, оставьте поле пустым');}
 const before=clone(p.measurements[measurement]||null),next={value:canonical,unit:def.unit,source,status,updated_at:now(),note:String(note).slice(0,1000)};p.measurements[measurement]=next;
 for(const m of defs)if(p.measurements[m.id])p.measurements[m.id].warnings=helpRegistry.warnings(m,p.measurements[m.id].value,p.measurements).map(s=>defs.reduce((r,d)=>r.replaceAll('«'+d.id+'»','«'+d.name+'»'),s));
 p.history.push({measurement,before,after:clone(next),at:now()});p.updated_at=now();this.save();return clone(next);
 }
 _required(method){if(method.startsWith('garment:')&&constructionCatalog[method.slice(8)]){const m=constructionCatalog[method.slice(8)];return {method,construction_supported:true,note:'Экспериментальный вариант: '+(m.variant||m.name)+'. Посадка и производство не проверены.',required:m.required_measurements,recommended:m.recommended_measurements||['height'],garment_parameters_separate:true};}if(method==='garment:wide_trousers_experimental_v1')return {method,construction_supported:true,note:'Экспериментальный комплект; дополнительно нужны параметры изделия. Посадка не проверена.',required:['garment_waist_girth','hips','waist_hip_length','seated_depth','waist_knee'],recommended:['height','outseam','inseam','thigh'],garment_parameters_separate:true};if(method==='experimental:quarter_trouser')return {method,construction_supported:true,note:'Экспериментальная четвертная панель; посадка не проверена. Требуются отдельные параметры изделия.',required:['waist','hips','waist_hip_length','seated_depth','waist_knee'],recommended:['height'],garment_parameters_separate:true};if(!method.startsWith('planning:')||!requirements[method.slice(9)])throw Error('Выберите известный список требований');return {method,construction_supported:false,note:'Предварительный список, не методика построения. Полнота мерок не означает готовность конструкции.',required:requirements[method.slice(9)],recommended:['height'],garment_parameters_separate:true};}
 required(method,id=this.data.active){
 const result=this._required(method);
 // Only broad planning checklists are adapted. A registered constructor keeps
 // its exact anatomical requirements, including a sex-specific construction.
 if(!method.startsWith('planning:'))return result;
 const sex=this.data.profiles.find(p=>p.id===id)?.metadata?.sex,defs=this.definitions();
 return {...result,required:result.required.filter(key=>measurementFields.applies(defs.find(d=>d.id===key)||{},sex))};
 }
 validate({id,method}){const p=this.profile(id),r=this.required(method,p.id);return {...r,missing:r.required.filter(k=>p.measurements[k]?.value==null),unverified:r.required.filter(k=>p.measurements[k]?.value!=null&&p.measurements[k].status!=='verified'),filled:r.required.filter(k=>p.measurements[k]?.value!=null)};}
 tool(action,args={}){
 if(action==='add_profile_note'){const p=this.profile(args.id),note=text(args.text,5000);p.notes=p.notes||[];p.notes.push({text:note,at:now(),status:'needs_clarification'});p.updated_at=now();this.save();return clone(p);}
 if(action==='update_profile_metadata'){const p=this.profile(args.id);require('./profile-context.cjs').validate(args.metadata);const allowed=['sex','size_grid','posture','asymmetry','fit_preference','abdomen_shape','buttocks_shape'],updates={};for(const key of Object.keys(args.metadata||{})){if(!allowed.includes(key))throw Error('Неизвестное свойство');updates[key]=String(args.metadata[key]).slice(0,1000);}p.metadata={...p.metadata,...updates};p.updated_at=now();this.save();return clone(p);}
 if(action==='build_trouser_from_profile'){
 const p=this.profile(args.id),v=this.validate({id:p.id,method:'experimental:quarter_trouser'});if(v.missing.length)throw Error('Не хватает мерок: '+v.missing.map(id=>this.definitions().find(m=>m.id===id).name).join(', '));
 if(v.unverified.length)throw Error('Подтвердите мерки в редакторе профиля перед построением');
 const g=args.garment||{};for(const key of ['length_mm','knee_width_mm','hem_width_mm','crotch_extension_mm','hip_ease_mm','waist_ease_mm'])if(typeof g[key]!=='number'||!Number.isFinite(g[key]))throw Error('Укажите параметр изделия: '+key);
 const m=id=>p.measurements[id].value;
 return {patterns:[{type:'trouser_panel',parameters:{length_mm:g.length_mm,knee_width_mm:g.knee_width_mm,hem_width_mm:g.hem_width_mm,crotch_extension_mm:g.crotch_extension_mm,hip_ease_mm:g.hip_ease_mm,waist_ease_mm:g.waist_ease_mm,hip_width_mm:m('hips')/4,waist_width_mm:m('waist')/4,hip_y_mm:m('waist_hip_length'),rise_mm:m('seated_depth'),knee_y_mm:m('waist_knee')}}],body_snapshot:clone(p),method:'experimental:quarter_trouser'};
 }
 if(action==='list_body_profiles')return this.snapshot();
 if(action==='get_body_profile')return clone(this.profile(args.id));
 if(action==='create_body_profile')return this.create(args);
 if(action==='update_body_measurement')return this.update(args);
 if(action==='select_active_body_profile'){this.profile(args.id);this.data.active=args.id;this.save();return clone(this.profile());}
 if(action==='duplicate_body_profile'){const original=clone(this.profile(args.id)),at=now(),stored={...original,id:randomUUID(),name:text(args.name||original.name+' — копия'),created_at:at,updated_at:at,history:[{at,duplicated_from:original.id}]};this.data.profiles.push(stored);this.data.active=stored.id;this.save();return clone(stored);}
 if(action==='delete_body_profile'){const target=this.profile(args.id).id;this.data.profiles=this.data.profiles.filter(p=>p.id!==target);if(this.data.active===target)this.data.active=null;this.save();return {deleted:true};}
 if(action==='rename_body_profile'){const p=this.profile(args.id),name=text(args.name),description=args.description!==undefined?String(args.description).slice(0,2000):undefined;if(args.units&&!['cm','mm','in'].includes(args.units))throw Error('Неизвестные единицы');p.name=name;if(description!==undefined)p.description=description;if(args.units)p.units=args.units;p.updated_at=now();this.save();return clone(p);}
 if(action==='add_custom_measurement'){const id='custom_'+randomUUID();this.data.custom.push({id,name:text(args.name),category:'Дополнительные',instruction:text(args.instruction),landmarks:[text(args.landmarks)],unit:'mm',min:0,max:10000,required_for:[]});this.save();return {id};}
 if(action==='get_required_measurements')return this.required(args.method);
 if(action==='validate_body_profile')return this.validate(args);
 throw Error('Неизвестный инструмент профилей');
 }
}
module.exports={BodyProfiles,catalog};
