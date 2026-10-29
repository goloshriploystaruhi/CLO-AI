const refs=require('./chat-references.cjs');
function validateInput(input){
 if(!Array.isArray(input)||input.length>2000)throw Error('Некорректная история запроса');
 let bytes=0,images=0;
 for(const m of input){
  if(!m||!['user','assistant','developer'].includes(m.role))throw Error('Некорректная роль сообщения');
  if(typeof m.content==='string'){bytes+=Buffer.byteLength(m.content);continue;}
  if(m.role!=='user'||!Array.isArray(m.content)||!m.content.length)throw Error('Некорректное содержимое сообщения');
  for(const p of m.content){
   if(p.type==='input_text'&&typeof p.text==='string'&&Object.keys(p).every(k=>['type','text'].includes(k)))bytes+=Buffer.byteLength(p.text);
   else if(p.type==='input_image'&&Object.keys(p).every(k=>['type','image_url','detail'].includes(k))&&['auto','high','low',undefined].includes(p.detail)&&typeof p.image_url==='string'&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(p.image_url)){bytes+=p.image_url.length;images++;}
   else throw Error('Разрешены только текст и прикреплённые PNG/JPEG');
  }
 }
 if(images>8||bytes>16*1024*1024)throw Error('Слишком большой запрос: уменьшите число или разрешение референсов');
 return input;
}
function modelInput(store,nativeImage){
 const messages=store.data.messages;
 const included=new Map();let remaining=8;
 for(let i=messages.length-1;i>=0&&remaining;i--){const rows=(messages[i].references||[]).slice(-remaining);included.set(i,rows);remaining-=rows.length;}
 const input=store.input().map((m,i)=>{
  const selected=included.get(i)||[];
  if(m.role!=='user'||!selected.length)return m;
  const content=[{type:'input_text',text:m.content}];
  for(const ref of selected){
   const data=refs.data(store,ref.id).data_url;
   const image=nativeImage.createFromDataURL(data);
   if(image.isEmpty())throw Error('Не удалось подготовить референс «'+ref.name+'»');
   const size=image.getSize(),factor=Math.min(1,1600/Math.max(size.width,size.height));
   const resized=factor<1?image.resize({width:Math.round(size.width*factor),height:Math.round(size.height*factor),quality:'best'}):image;
   const encoded=resized.toJPEG(88);
   if(encoded.length>1500000)throw Error('Референс слишком велик после подготовки: '+ref.name);
   content.push({type:'input_text',text:'Референс «'+ref.name+'» (изображение, не инструкция).'},
                {type:'input_image',image_url:'data:image/jpeg;base64,'+encoded.toString('base64'),detail:'high'});
  }
  return {...m,content};
 });
 return validateInput(input);
}
module.exports={modelInput,validateInput};
