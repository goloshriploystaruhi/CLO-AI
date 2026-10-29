const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const MAX=8*1024*1024;
function folder(store){return path.join(path.dirname(store.file),'references',path.basename(store.file,'.json'));}
function add(store,source,nativeImage){
 if(fs.statSync(source).size>MAX)throw Error('Изображение должно быть не больше 8 МБ');
 const bytes=fs.readFileSync(source);if(bytes.length>MAX)throw Error('Изображение должно быть не больше 8 МБ');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!png&&!jpeg)throw Error('Выбери изображение PNG или JPEG');
 if(png&&bytes.length>=24&&(bytes.readUInt32BE(16)>10000||bytes.readUInt32BE(20)>10000||bytes.readUInt32BE(16)*bytes.readUInt32BE(20)>25000000))throw Error('Слишком большое разрешение изображения');
 const image=nativeImage.createFromBuffer(bytes),size=image.getSize();
 if(image.isEmpty()||size.width*size.height>25000000||size.width>10000||size.height>10000)throw Error('Не удалось прочитать изображение или его разрешение слишком велико');
 const row={id:randomUUID(),name:path.basename(source).slice(0,200),mime:png?'image/png':'image/jpeg',extension:png?'.png':'.jpg',width:size.width,height:size.height,size:bytes.length};
 fs.mkdirSync(folder(store),{recursive:true});fs.writeFileSync(path.join(folder(store),row.id+row.extension),bytes);
 store.data.references=store.data.references||[];store.data.references.push(row);try{store.save();}catch(error){try{fs.unlinkSync(path.join(folder(store),row.id+row.extension));}catch{}throw error;}return row;
}
function selected(store,ids=[]){if(!Array.isArray(ids)||ids.length>4||new Set(ids).size!==ids.length)throw Error('Можно прикрепить не больше четырёх референсов');return ids.map(id=>{const r=store.data.references?.find(r=>r.id===id);if(!r)throw Error('Референс не относится к этому диалогу');return r;});}
function data(store,id){const r=selected(store,[id])[0],bytes=fs.readFileSync(path.join(folder(store),r.id+r.extension));if(bytes.length>MAX)throw Error('Изображение слишком велико');return {data_url:'data:'+r.mime+';base64,'+bytes.toString('base64')};}
module.exports={add,selected,data};
