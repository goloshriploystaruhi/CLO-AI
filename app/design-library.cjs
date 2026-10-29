const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{validateDesign}=require('./pattern-design-schema.cjs');
class DesignLibrary{
 constructor(file){this.file=file;this.data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,recipes:[]};if(this.data.version!==1||!Array.isArray(this.data.recipes))throw Error('Неизвестная версия библиотеки конструкций');}
 learn(g){if(!g.pattern_design||g.qa_report?.valid!==true)return null;const design=JSON.parse(JSON.stringify(validateDesign(g.pattern_design))),id=createHash('sha256').update(JSON.stringify(design)).digest('hex').slice(0,24),previous=this.data.recipes.find(r=>r.id===id);
 const record={id,name:design.name,category:design.category||'custom',design,validation:{geometry:true,assembly:true,fit_verified:false,sewing_ready:false},created_at:previous?.created_at||new Date().toISOString(),confirmed_at:new Date().toISOString()};
 const recipes=[...this.data.recipes.filter(r=>r.id!==id),record].slice(-100);require('./atomic-json.cjs').writeJSON(this.file,{version:1,recipes},{backup:true});this.data={version:1,recipes};return record;
 }
 list(query=''){if(typeof query!=='string')throw Error('Некорректный поиск конструкции');const q=query.toLocaleLowerCase('ru-RU');return this.data.recipes.filter(r=>(r.name+' '+r.category).toLocaleLowerCase('ru-RU').includes(q)).map(({design,...r})=>({...r,parameters:design.parameters,required_measurements:design.measurements||[]}));}
 get(id){const record=this.data.recipes.find(r=>r.id===id);if(!record)throw Error('Сохранённая конструкция не найдена');validateDesign(record.design);return JSON.parse(JSON.stringify(record));}
}
module.exports={DesignLibrary};
