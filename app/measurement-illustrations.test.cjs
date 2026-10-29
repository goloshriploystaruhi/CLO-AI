const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const manifest=require('./assets/measurements/manifest.json'),{catalog}=require('./body-profiles.cjs'),help=require('./measurement-help.js');
function gifInfo(bytes){
 assert.equal(bytes.toString('ascii',0,6),'GIF89a');let at=13,frames=0,duration=0,loop=null;
 if(bytes[10]&128)at+=3*(2**((bytes[10]&7)+1));
 function blocks(){while(bytes[at]){at+=bytes[at]+1;assert(at<bytes.length,'Truncated GIF');}at++;}
 while(at<bytes.length){const block=bytes[at++];if(block===0x3b)break;
  if(block===0x2c){frames++;const flags=bytes[at+8];at+=9;if(flags&128)at+=3*(2**((flags&7)+1));at++;blocks();}
  else if(block===0x21){const kind=bytes[at++];if(kind===0xf9)duration+=bytes.readUInt16LE(at+2)*10;
   if(kind===0xff&&bytes.toString('ascii',at+1,at+12)==='NETSCAPE2.0'&&bytes[at+13]===1)loop=bytes.readUInt16LE(at+14);
   blocks();
  }else assert.fail('Unknown GIF block '+block);
 }
 return {width:bytes.readUInt16LE(6),height:bytes.readUInt16LE(8),frames,duration,loop};
}
test('every built-in measurement ships its own complete looping guide and static reduced-motion poster',()=>{
 assert.equal(Object.keys(manifest.measurements).length,catalog.length);
 for(const m of catalog){const record=manifest.measurements[m.id];assert(record,m.id);assert.equal(help.getHelp(m).illustration.src,record.src);
  assert.equal(record.src,'assets/measurements/'+m.id+'.gif');assert.equal(record.poster,'assets/measurements/'+m.id+'.png');assert(record.alt&&record.view&&record.region,m.id);
  const info=gifInfo(fs.readFileSync(path.join(__dirname,record.src)));assert.deepEqual([info.width,info.height],[record.width,record.height]);assert(info.frames>=(m.id==='weight'?3:12),m.id+' must animate');assert(info.duration>=2000&&info.duration<=8000,m.id+' calm loop duration');assert.equal(info.loop,0,m.id+' infinite loop');
  const png=fs.readFileSync(path.join(__dirname,record.poster));assert.equal(png.toString('ascii',1,4),'PNG');assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[record.width,record.height]);
 }
});
test('browser and Node use identical local illustration mappings; unknown custom landmarks get clarification',()=>{
 const browser={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'assets/measurements/manifest.js'),'utf8'),browser);assert.deepEqual(JSON.parse(JSON.stringify(browser.window.MeasurementIllustrations)),manifest);
 const illustration=help.getHelp({id:'custom_unknown',name:'Своя мерка',unit:'mm',instruction:'По моим ориентирам'}).illustration;
 assert.equal(illustration.src,manifest.fallback.src);assert(fs.existsSync(path.join(__dirname,illustration.src)));
 for(const r of [...Object.values(manifest.measurements),manifest.fallback]){assert.match(r.src,/^assets\/measurements\/[a-z_]+\.gif$/);assert.match(r.poster,/^assets\/measurements\/[a-z_]+\.png$/);}
});
