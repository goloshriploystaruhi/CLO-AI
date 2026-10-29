const designKeys=['version','name','category','parameters','measurements','variables','seam_allowance_mm','pieces','relations','operations','sources','notes','intended_sex','parameter_labels','material','checks','pattern_checks','recipe','assembly_groups'];
function object(value,allowed,required=[]){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Нужен объект конструкции');for(const key of Object.keys(value))if(!allowed.includes(key))throw Error('Неизвестное свойство конструкции: '+key);for(const key of required)if(value[key]===undefined)throw Error('Не указано свойство конструкции: '+key);}
function boundedJSON(value){let nodes=0;function check(v,depth){if(++nodes>14000||depth>24)throw Error('Описание конструкции слишком сложное');if(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>10000))throw Error('Размер конструкции выходит за пределы ±10000 мм');if(typeof v==='string'&&v.length>4000)throw Error('Слишком длинное описание конструкции');if(v&&typeof v==='object')for(const key of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Недопустимое свойство конструкции');check(v[key],depth+1);}}check(value,0);if(JSON.stringify(value).length>300000)throw Error('Описание конструкции слишком большое');}
function validateDesign(design){
 boundedJSON(design);object(design,designKeys,['version','name','category','parameters','measurements','pieces']);if(design.version!==1)throw Error('Неизвестная версия описания конструкции');if(typeof design.name!=='string'||!design.name.trim()||design.name.length>200)throw Error('Укажите название конструкции');
 if(design.recipe!==undefined&&design.recipe!=='patternmaking_skirt_v1')throw Error('Неизвестный проверяемый рецепт конструкции');
 if(!Array.isArray(design.pieces)||(design.recipe?design.pieces.length!==0:design.pieces.length<1||design.pieces.length>64))throw Error(design.recipe?'Детали рецепта рассчитывает движок; передайте пустой список pieces':'Допустимо от 1 до 64 деталей');
 if(design.assembly_groups!==undefined){
  const groups=design.assembly_groups,role=id=>typeof id==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(id);
  if(!Array.isArray(groups)||!groups.length||groups.length>64||groups.some(group=>!Array.isArray(group)||!group.length||group.length>64||group.some(id=>!role(id))))throw Error('Группы сборки: от 1 до 64 непустых списков ролей деталей');
  const roles=groups.flat();if(roles.length>64||new Set(roles).size!==roles.length)throw Error('Каждая деталь должна входить ровно в одну группу сборки');
  if(!design.recipe&&(roles.length!==design.pieces.length||design.pieces.some(piece=>!roles.includes(piece?.role))))throw Error('Группы сборки должны охватывать все детали комплекта без неизвестных ролей');
 }
 if(design.parameters!==undefined&&(!design.parameters||typeof design.parameters!=='object'||Array.isArray(design.parameters)||Object.values(design.parameters).some(v=>typeof v!=='number'||!Number.isFinite(v))))throw Error('Параметры конструкции должны быть конечными числами');
 if(design.measurements!==undefined&&(!Array.isArray(design.measurements)||design.measurements.length>64||new Set(design.measurements).size!==design.measurements.length||design.measurements.some(id=>typeof id!=='string'||!/^[a-z][a-z0-9_-]{0,95}$/.test(id))))throw Error('Некорректный список мерок конструкции');
 if(design.intended_sex!==undefined&&!['female','male','unspecified'].includes(design.intended_sex))throw Error('Некорректное назначение конструкции по полу');
 if(design.sources!==undefined&&(!Array.isArray(design.sources)||design.sources.length>8||design.sources.some(s=>typeof s!=='string'||!/^https:\/\//.test(s))))throw Error('Источники конструкции должны быть ссылками HTTPS');
 for(const key of ['operations','notes'])if(design[key]!==undefined&&(!Array.isArray(design[key])||design[key].length>80||design[key].some(s=>typeof s!=='string')))throw Error('Некорректные пояснения к конструкции');
 if(design.relations!==undefined){
  if(!Array.isArray(design.relations))throw Error('Связи деталей должны быть списком');
  for(const relation of design.relations){
   if(relation?.alignment===undefined)continue;
   const a=relation.alignment;
   if(!Array.isArray(a)||a.length<2||a.length>16||a.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)||a[0]!==0||a.at(-1)!==1||a.some((v,i)=>i>0&&v<=a[i-1]))throw Error('Контрольные позиции шва: 2–16 возрастающих долей от 0 до 1, включая оба конца');
  }
 }
 if(design.pattern_checks!==undefined){
  if(!Array.isArray(design.pattern_checks)||design.pattern_checks.length>64)throw Error('Допустимо до 64 конструктивных проверок');
  const ident=value=>typeof value==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(value),formula=value=>typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.trim().length>0;
  for(const check of design.pattern_checks){
   if(check?.type==='fold'){
    object(check,['type','piece','seam','tolerance_deg'],['type','piece','seam']);
    if(!ident(check.seam)||check.tolerance_deg!==undefined&&(typeof check.tolerance_deg!=='number'||!Number.isFinite(check.tolerance_deg)||check.tolerance_deg<0||check.tolerance_deg>2))throw Error('Проверка сгиба: нужен именованный участок и допуск 0–2°');
   }else if(check?.type==='within'){
    object(check,['type','piece','parent','translate','rotate_deg','mirror','tolerance_mm'],['type','piece','parent','translate']);
    if(!ident(check.parent)||!Array.isArray(check.translate)||check.translate.length!==2||!check.translate.every(formula)||check.rotate_deg!==undefined&&!formula(check.rotate_deg)||check.mirror!==undefined&&!['x','y'].includes(check.mirror)||check.tolerance_mm!==undefined&&(typeof check.tolerance_mm!=='number'||!Number.isFinite(check.tolerance_mm)||check.tolerance_mm<0||check.tolerance_mm>1))throw Error('Проверка вложенной детали: укажите основную деталь, положение и допуск 0–1 мм');
   }else throw Error('Неизвестная конструктивная проверка');
   if(!ident(check.piece))throw Error('Укажите роль детали конструктивной проверки');
  }
 }
 return design;
}
function validateTool(tool){
 if(require('./garment-patternmaking-tools.cjs').validateTool(tool))return true;
 if(require('./tailoring-tools.cjs').validateTool(tool))return true;
 const schemas={get_construction_capabilities:[],create_pattern_design:['design'],trial_pattern_design:['design','query'],revise_pattern_design:['query','parameters','design'],list_design_recipes:['query'],get_design_recipe:['id'],export_print_patterns:['query','format'],search_patternmaking_knowledge:['query','limit'],read_patternmaking_knowledge:['id'],get_patternmaking_recipe:['id','parameters']};
 if(!Object.hasOwn(schemas,tool.action))return false;
 object(tool,['action','args'],['action']);object(tool.args||{},schemas[tool.action]);const a=tool.args||{};
 if(['create_pattern_design','trial_pattern_design'].includes(tool.action)&&!a.design)throw Error('Нужно описание параметрической конструкции');
 if(a.design)validateDesign(a.design);
 if(tool.action==='search_patternmaking_knowledge'){if(typeof a.query!=='string'||!a.query.trim()||a.query.length>500)throw Error('Укажите тему поиска длиной до 500 символов');if(a.limit!==undefined&&(!Number.isInteger(a.limit)||a.limit<1||a.limit>12))throw Error('Число результатов поиска: от 1 до 12');}
 if(tool.action==='read_patternmaking_knowledge'&&(typeof a.id!=='string'||a.id.length>180||!(/^(?:(?:kb|guide):)?[a-z0-9][a-z0-9/_#-]*$/).test(a.id)||a.id.includes('..')))throw Error('Выберите идентификатор из поиска методических материалов');
 if(tool.action==='get_patternmaking_recipe'){if(a.id!=='patternmaking_skirt_v1')throw Error('Выберите проверяемый рецепт из списка возможностей');if(a.parameters!==undefined){boundedJSON(a.parameters);if(!a.parameters||typeof a.parameters!=='object'||Array.isArray(a.parameters)||Object.values(a.parameters).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('Параметры рецепта должны быть конечными числами');}}
 if(tool.action==='revise_pattern_design'){if(typeof a.query!=='string'||!a.query)throw Error('Укажите изделие для изменения');if((a.design===undefined)===(a.parameters===undefined))throw Error('Укажите новые параметры или новое описание конструкции');if(a.parameters!==undefined){boundedJSON(a.parameters);if(!a.parameters||typeof a.parameters!=='object'||Array.isArray(a.parameters)||Object.values(a.parameters).some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('Параметры должны быть конечными числами');}}
 if(a.query!==undefined&&(typeof a.query!=='string'||a.query.length>(tool.action==='search_patternmaking_knowledge'?500:300)))throw Error('Некорректный идентификатор изделия или тема поиска');if(a.id!==undefined&&(typeof a.id!=='string'||a.id.length>(tool.action==='read_patternmaking_knowledge'?180:100)))throw Error('Некорректный идентификатор методики');
 if(a.format!==undefined&&!['A4','A0'].includes(a.format))throw Error('Выберите формат A4 или A0');return true;
}
module.exports={validateDesign,validateTool};
