// A disclosed reference mannequin for a draft, never values to write into a person's profile.
const catalog=require('../construction-catalog.json');
const reference={chest:960,shoulder_width:400,chest_width:340,back_width:380,armhole_depth:240,neck_base:370,biceps:300,hips:1000,front_waist_length:440,back_waist_length:420,bust_height:260,bust_spacing:180,waist_hip_length:200,waist:800,head:570,head_height:230,head_length:190,garment_waist_girth:840,seated_depth:310,waist_knee:620};
function prepare(method,profile,parameters){
 const meta=catalog[method];if(!meta)throw Error('Неизвестная конструкция для приблизительного макета');
 const p=JSON.parse(JSON.stringify(profile)),g={...parameters},assumptions=[];p.measurements=p.measurements||{};
 for(const key of meta.required_measurements){const m=p.measurements[key];if(m?.value==null){if(!Number.isFinite(reference[key]))throw Error('Для этой конструкции пока нет приблизительной основы: '+key);p.measurements[key]={value:reference[key],unit:'mm',status:'verified',source:'estimated'};assumptions.push({kind:'measurement',key,value:reference[key],unit:'mm',reason:'Условный манекен; не персональная мерка'});}else if(m.status!=='verified'){m.status='verified';assumptions.push({kind:'measurement',key,value:m.value,unit:m.unit,reason:'Принято без повторной проверки только для этого макета'});}}
 const upper={length_mm:700,chest_ease_mm:160,hem_circumference_mm:(p.measurements.chest?.value||960)+200,sleeve_length_mm:500,cuff_circumference_mm:300};
 const lower={length_mm:1050,waist_drop_mm:20,hip_ease_mm:160,waist_ease_mm:20,knee_flat_mm:280,hem_flat_mm:240};
 const defaults={...upper,...lower};
 if(['tshirt','top','shirt','hoodie','sweatshirt','blazer','jacket'].includes(meta.category))Object.assign(defaults,upper);
 if(['coat','dress'].includes(meta.category))Object.assign(defaults,upper,{length_mm:1100,hem_circumference_mm:1500});
 if(meta.category==='skirt')Object.assign(defaults,{length_mm:650,waist_ease_mm:20,hem_circumference_mm:1700});
 if(['shorts','underwear'].includes(meta.category))defaults.length_mm=450;
 if(meta.category==='headwear')Object.assign(defaults,{height_mm:210,head_ease_mm:10});
 if(meta.category==='jumpsuit')Object.assign(defaults,{torso_length_mm:470});
 if(method==='balloon_tapered_v1')Object.assign(defaults,{length_mm:1010,hip_ease_mm:320,knee_flat_mm:360,hem_flat_mm:290});
 if(method==='workwear_zip_jacket_v1')Object.assign(defaults,{length_mm:600,sleeve_length_mm:600});
 if(method==='women_baggy_boilersuit_v1')Object.assign(defaults,{waist_drop_mm:0,hip_ease_mm:160,knee_flat_mm:270,hem_flat_mm:230,sleeve_length_mm:580});
 if(method==='tshirt_setin_engineering_v1')Object.assign(defaults,{length_mm:700,chest_ease_mm:100,hem_circumference_mm:(p.measurements.chest?.value||960)+100,sleeve_length_mm:240,cuff_circumference_mm:(p.measurements.biceps?.value||300)+40,neck_width_mm:190,front_neck_depth_mm:110,back_neck_depth_mm:30,shoulder_drop_mm:30,biceps_ease_mm:70,armhole_ease_mm:10,rib_stretch_percent:60,rib_recovery_percent:95,rib_application_extension_percent:15,body_stretch_percent:40});
 for(const key of meta.required_parameters){if(g[key]===undefined){if(!Number.isFinite(defaults[key]))throw Error('Нет безопасного значения параметра макета: '+key);g[key]=defaults[key];assumptions.push({kind:'parameter',key,value:g[key],unit:key.endsWith('_mm')?'mm':key.endsWith('_percent')?'%':'',reason:key.endsWith('_percent')?'Условные свойства материала только для макета; замените результатом пробы':'Параметр приблизительного макета'});}}
 return {profile:p,parameters:g,assumptions};
}
function piece(type,parameters={}){
 const defaults={rectangle:{width_mm:400,height_mm:600},circle:{diameter_mm:100},trapezoid:{top_mm:400,bottom_mm:600,height_mm:800},rounded_trapezoid:{top_mm:400,bottom_mm:600,height_mm:800,top_round_mm:20},shaped_panel:{width_mm:350,height_mm:800}}[type];
 if(!defaults)throw Error('Для этого типа детали нет приблизительной основы');
 if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).some(k=>!Object.hasOwn(defaults,k)))throw Error('Неизвестный параметр приблизительной детали');
 const pattern={type,...defaults,...parameters};require('./command-validation.cjs').recipes([pattern]);
 return {patterns:[pattern],approximate:true,assumptions:Object.entries(defaults).filter(([k])=>parameters[k]===undefined).map(([key,value])=>({kind:'parameter',key,value,unit:'mm',reason:'Параметр приблизительного макета'}))};
}
function prepareDesign(profile,design){
 const p=JSON.parse(JSON.stringify(profile)),assumptions=[];p.measurements=p.measurements||{};
 for(const key of design.measurements||[])if(p.measurements[key]?.value==null&&Number.isFinite(reference[key])){p.measurements[key]={value:reference[key],unit:'mm',status:'unverified',source:'estimated',note:'Условный манекен для явно разрешённого макета'};assumptions.push({kind:'measurement',key,value:reference[key],unit:'mm',reason:'Условный манекен, использован только с разрешения на приблизительный макет'});}
 return {profile:p,assumptions};
}
module.exports={prepare,piece,prepareDesign};
