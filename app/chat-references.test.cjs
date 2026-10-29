const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const refs=require('./chat-references.cjs'),{ConversationStore}=require('./conversation-store.cjs');
test('reference copies are conversation-scoped and only raster MIME types reach the renderer',()=>{
 const folder=testWorkspace.create('references-'),a=new ConversationStore(path.join(folder,'a.json')),b=new ConversationStore(path.join(folder,'b.json'));
 const image=path.join(folder,'референс.png'),bytes=Buffer.alloc(30);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(100,16);bytes.writeUInt32BE(200,20);fs.writeFileSync(image,bytes);
 const decoder={createFromBuffer:()=>({isEmpty:()=>false,getSize:()=>({width:100,height:200})})};
 const row=refs.add(a,image,decoder);assert.equal(row.mime,'image/png');assert.match(refs.data(a,row.id).data_url,/^data:image\/png;base64,/);
 assert.throws(()=>refs.data(b,row.id));assert.throws(()=>refs.data(a,'../private'));assert.throws(()=>refs.selected(a,[row.id,row.id]));
 const svg=path.join(folder,'vector.png');fs.writeFileSync(svg,'<svg onload="run()"/>');assert.throws(()=>refs.add(a,svg,decoder),/PNG или JPEG/);
 const huge=Buffer.from(bytes);huge.writeUInt32BE(500000,16);fs.writeFileSync(image,huge);assert.throws(()=>refs.add(a,image,decoder),/разрешение/);
});

test('failed reference registration removes its new orphan file and leaves committed references intact',()=>{const folder=testWorkspace.create('reference-rollback-'),s=new ConversationStore(path.join(folder,'chat.json')),image=path.join(folder,'input.png'),bytes=Buffer.alloc(30);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(100,16);bytes.writeUInt32BE(200,20);fs.writeFileSync(image,bytes);const decoder={createFromBuffer:()=>({isEmpty:()=>false,getSize:()=>({width:100,height:200})})};const first=refs.add(s,image,decoder),before=structuredClone(s.data),writer=require('./atomic-json.cjs'),original=writer.writeJSON;writer.writeJSON=()=>{throw Object.assign(Error('Injected failure'),{code:'EIO'});};try{assert.throws(()=>refs.add(s,image,decoder),{code:'EIO'});assert.deepEqual(s.data,before);assert.deepEqual(fs.readdirSync(path.join(folder,'references','chat')),[first.id+'.png']);}finally{writer.writeJSON=original;}});
