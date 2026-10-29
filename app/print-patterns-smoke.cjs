// Native PDF export, isolated renderer and physical-unit validation. No network/CLO.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const output=path.join(__dirname,'../research/print-patterns-checks');fs.mkdirSync(output,{recursive:true});const isolated=fs.mkdtempSync(path.join(__dirname,'../research/print-patterns-'));app.setPath('userData',path.join(isolated,'electron'));app.disableHardwareAcceleration();
app.on('window-all-closed',()=>{});
const rectangle=(w,h,x=0,y=0)=>[[[x,y],[x+w,y]],[[x+w,y],[x+w,y+h]],[[x+w,y+h],[x,y+h]],[[x,y+h],[x,y]]].map(([start,end])=>({start,end}));
const garment={id:'print-native-fixture',name:'Пробный комплект для проверки масштаба',version:1,pieces:[{id:'native-piece-1',role:'front',name:'Передняя деталь — проверка печати',cut_contour:rectangle(400,600,-10,-10),seam_contour:rectangle(380,580),cut_quantity:1,allowance_mm:10,grainline:[[190,100],[190,400]],notches:[{segment:1,t:.5},{segment:3,t:.5}],internal_lines:[[[50,100],[200,100]]]}]};
app.whenReady().then(async()=>{
 const passed=[],errors=[];let created=0,destroyed=0;
 class TrackedWindow extends BrowserWindow{constructor(config){super(config);created++;this.on('closed',()=>destroyed++);this.webContents.on('console-message',(_,details)=>{if(details?.level==='error')errors.push(details.message);});}}
 try{
  const printer=require('./print-patterns.cjs'),files=[];
  for(const format of ['A4','A0']){const result=await printer.exportPrint(garment,path.join(output,format),{BrowserWindow:TrackedWindow,format});assert(fs.statSync(result.paths.pdf).size>5000);assert.equal(result.scale_percent,100);assert.equal(result.sewing_ready,false);files.push(result);}
  passed.push('Настоящий скрытый Electron создал векторные PDF A4 и A0 с физическим масштабом100%, русскими подписями и отдельным контрольным листом');
  const python=require('./python-runtime.cjs').executable();
  const source=`import json, math, sys
from pypdf import PdfReader
results=[]
for pdf,fmt,expected in json.loads(sys.argv[1]):
 r=PdfReader(pdf); sizes=[]
 for page in r.pages:
  w,h=float(page.mediabox.width),float(page.mediabox.height); sizes.append([w,h])
  target=(210,297) if fmt=='A4' else (841,1189)
  assert abs(w-target[0]*72/25.4)<.5,(fmt,w)
  assert abs(h-target[1]*72/25.4)<.5,(fmt,h)
 assert len(r.pages)==expected,(len(r.pages),expected)
 text=''.join(p.extract_text() or '' for p in r.pages)
 assert 'Передняя деталь' in text,text[:500]
 assert '100' in text
 rectangles=[]
 def before(op,args,cm,tm):
  if op==b're' and len(args)==4:
   w,h=float(args[2]),float(args[3]); a,b,c,d,e,f=map(float,cm)
   rectangles.append([math.hypot(w*a,w*b),math.hypot(h*c,h*d)])
 r.pages[0].extract_text(visitor_operand_before=before)
 target=100*72/25.4
 calibration=[v for v in rectangles if abs(v[0]-target)<.5 and abs(v[1]-target)<.5]
 assert calibration,('100mm rectangle not found in vector PDF',rectangles[:20])
 results.append(dict(format=fmt,pages=len(r.pages),media_box_points=sizes[0],calibration_points=calibration[0],cyrillic_text=True))
print(json.dumps(results,ensure_ascii=False))`;
  const checked=spawnSync(python,['-c',source,JSON.stringify(files.map(f=>[f.paths.pdf,f.format,f.page_count]))],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(checked.status,0,checked.stderr||checked.stdout);const physical=JSON.parse(checked.stdout);
  passed.push('PDFReader подтвердил число страниц, физические MediaBox A4/A0, русские тексты и квадрат100×100мм в векторных координатах PDF');
  assert.equal(created,2);assert.equal(destroyed,2);assert.deepEqual(errors,[]);passed.push('Оба экспортных окна закрыты; renderer не сообщил ошибок, пользовательские окна и данные не использовались');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed,renderer_errors:errors,physical,files,computer_use:false,real_clo:false,real_gpt:false},null,2));app.exit(0);
 }catch(error){fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({error:error.stack,passed,renderer_errors:errors,created,destroyed},null,2));app.exit(1);}
});
