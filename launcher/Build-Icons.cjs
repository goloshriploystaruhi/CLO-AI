// Build-time rasterization of the supplied SVG; no runtime UI dependency.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const sharp=require('sharp');
(async()=>{
 const assets=path.join(__dirname,'../app/assets'),source=fs.readFileSync(path.join(assets,'clo-ai-logo.svg'));
 const sizes=[16,24,32,48,64,128,256],frames=[];
 for(const size of sizes){
  const padding=Math.max(1,Math.round(size*.07));
  const png=await sharp(source,{density:600}).resize(size-padding*2,size-padding*2,{fit:'inside'}).extend({top:padding,bottom:padding,left:padding,right:padding,background:{r:0,g:0,b:0,alpha:0}}).resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  frames.push(png);if(size===256)fs.writeFileSync(path.join(assets,'clo-ai-icon.png'),png);
 }
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
 for(let i=0;i<sizes.length;i++){const at=6+i*16;header[at]=header[at+1]=sizes[i]===256?0:sizes[i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(frames[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=frames[i].length;}
 fs.writeFileSync(path.join(assets,'clo-ai.ico'),Buffer.concat([header,...frames]));
 console.log('Готовы PNG 256 px и ICO 16–256 px из пользовательского SVG.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
