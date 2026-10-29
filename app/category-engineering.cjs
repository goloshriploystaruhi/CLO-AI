const research=require('../engineering/category-research.json');
function summary(category){
 if(typeof category!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(category))throw Error('Укажите идентификатор категории одежды');
 const f=Object.hasOwn(research.categories,category)?research.categories[category]:null;if(!f){const methods=Object.values(require('../construction-catalog.json')).filter(m=>m.category===category);return 'Категория: '+category+'.\n'+(methods.length?'Зарегистрированные основы:\n'+methods.map(m=>'• '+m.name+' — '+m.variant+' ('+m.id+')').join('\n'):'Готовой основы с таким названием нет. Доступна разработка новой параметрической схемы через именованные точки, формулы и проверку пробного построения.')+'\nПолучите возможности движка через get_construction_capabilities; подготовьте trial_pattern_design и исправьте найденные ошибки. Посадка и технология новой конструкции требуют проверки.';}
 const sources=new Map(research.sources.map(s=>[s.id,s]));
 return f.name+' — возможности конструктора\n'+f.styles.map(s=>'• '+s.name+': '+(s.method?'экспериментальная реализация ('+s.method+')':'пока не реализовано')+(s.remaining.length?' — '+s.remaining.join('; '):'')).join('\n')+
  '\n\nДля расширения основы нужны: '+f.measurements_to_add.join('; ')+'.'+
  '\n\nИзученные источники:\n'+f.source_ids.map(id=>{const s=sources.get(id);return '• '+s.name+': '+s.url;}).join('\n')+
  '\n\n'+research.notice+'\nДругие варианты можно исследовать и разрабатывать через параметрическую схему; отсутствие готовой основы не завершает задачу.';
}
module.exports={summary};
