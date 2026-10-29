const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
function permitsDraft(text){
 if(/^\s*(?:пожалуйста[,\s]+)?(?:пока\s+)?не\s+(?:делай|сделай|создавай|создай|строй|построй|начинай|продолжай|придумывай|придумай|подбирай|подбери|предполагай|предположи)(?:\s|$)/iu.test(text||''))return false;
 if(typeof text!=='string'||text.length>20000||/(?:не\s+(?:продолжай|используй|подставляй|бери|разрешаю|допускаю)|не\s+(?:делай|создавай|строй|построй|начинай)[\s\S]{0,100}(?:пробн|приблиз|примерн|допущ|без\s+(?:этих\s+)?(?:данных|мерок|них))|без\s+допущений|никаких\s+допущений|не\s+(?:надо|нужно)\s+(?:продолжать|делать\s+пробн|использовать\s+(?:примерн|типов)|примерн))/iu.test(text))return false;
 const command='(?:продолжай|делай|сделай|создай|построй|строй|работай|начинай|начни|разработай|выбери)';
 return new RegExp(command+'[\\s\\S]{0,100}без\\s+(?:этих\\s+)?(?:данных|деталей|мерок|измерений|уточнений|параметров|них)','iu').test(text)||
  new RegExp(command+'[\\s\\S]{0,100}(?:с\\s+(?:явными\\s+|раскрытыми\\s+)?допущениями|на\\s+(?:любой|произвольный)\\s+размер|(?:пробн(?:ый|ую|ое)|приблизительн(?:ый|ую|ое))\\s+(?:вариант|макет|конструкц|построен))','iu').test(text)||
  new RegExp(command+'[\\s\\S]{0,140}(?:если[\\s\\S]{0,35}(?:неудач|неидеальн)|(?:получится|получатся)[\\s\\S]{0,25}(?:неудач|неидеальн))[\\s\\S]{0,80}(?:ничего\\s+страшного|можно\\s+ошиб|допускаю\\s+ошиб)','iu').test(text)||
  /(?:на\s+(?:тво[её]|сво[её])\s+усмотрение|(?:возьми|бери|используй|подставь|допускаю|разрешаю|придумай|подбери|предположи)[\s\S]{0,55}(?:примерн|типов|стандартн|условн|ориентировочн|допущени)|не\s+хватает[\s\S]{0,35}(?:продолжай|делай))/iu.test(text);
}
class ConversationStore{
 constructor(file){this.file=file;this.data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,messages:[]};if(this.data.version!==1||!Array.isArray(this.data.messages))throw Error('Не удалось прочитать историю чата');this._committed=JSON.parse(JSON.stringify(this.data));}
 save(){try{require('./atomic-json.cjs').writeJSON(this.file,this.data,{backup:true});this._committed=JSON.parse(JSON.stringify(this.data));}catch(error){require('./atomic-json.cjs').restore(this.data,this._committed);throw error;}}
 add(role,text,extra={}){if(!['user','assistant'].includes(role)||typeof text!=='string')throw Error('Некорректное сообщение чата');const m={id:randomUUID(),role,text,at:new Date().toISOString(),...extra};this.data.messages.push(m);this.save();return m;}
 input(){return this.data.messages.map(m=>({role:m.role,content:m.text+(m.references?.length?'\nРеференсы этого сообщения (изображения передаются отдельно, если включены в текущий контекст): '+JSON.stringify(m.references.map(r=>({name:r.name,width:r.width,height:r.height}))):'')+(m.context?'\nКонтекст операции: '+require('./research-trace.cjs').context(m.context):'')}));}
 list(){return this.data.messages.map(({context,...m})=>m);}
 outcome(id,text,kind='assistant',extra={}){if(this.data.messages.some(m=>m.event===id))return;return this.add('assistant',text,{kind,event:id,...extra});}
}
module.exports={ConversationStore,permitsDraft};
