// End-to-end proof: real mathematical worker -> validated model -> native PDF.
// Synthetic test profile only. No GPT calls, live CLO, real person or computer use.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),output=path.join(root,'reports/professional-construction-engine/sample');fs.mkdirSync(output,{recursive:true});
const isolated=fs.mkdtempSync(path.join(root,'research/pattern-print-'));app.setPath('userData',path.join(isolated,'electron'));app.disableHardwareAcceleration();app.on('window-all-closed',()=>{});
const profile={id:'sample-person-not-a-real-user',name:'Учебный профиль для проверки, не реальный человек',metadata:{sex:'female'},measurements:{waist:{value:72,unit:'cm',source:'manual',status:'unverified',note:'Тестовое число 72 см задано в сценарии. Фактическое измерение человека не проводилось.'}}};
const design={version:1,name:'Юбка-солнце - пробный макет из двух полотнищ',category:'skirt',intended_sex:'female',parameters:{length_mm:600,waist_ease_mm:20},parameter_labels:{length_mm:'Длина от талии до низа',waist_ease_mm:'Прибавка по полному обхвату талии'},measurements:['waist'],variables:{waist_radius:'(m_waist+p_waist_ease_mm)/(2*pi)'},seam_allowance_mm:10,
 pieces:['front','back'].map(role=>({role,name:role==='front'?'Переднее полотнище юбки-солнце':'Заднее полотнище юбки-солнце',primitive:{type:'annular_sector',inner_radius:'waist_radius',width:'p_length_mm',angle_deg:180},cut_quantity:1})),
 relations:['radial_start','radial_end'].map(seam=>({a:{piece:'front',seam},b:{piece:'back',seam},direction:'reverse',type:'Боковой шов пробного макета',ease_mm:0,tolerance_mm:.1})),
 checks:['front','back'].flatMap(piece=>[{piece,metric:'seam_length',seam:'waist',expected:'(m_waist+p_waist_ease_mm)/2',tolerance_mm:.2},{piece,metric:'seam_length',seam:'radial_start',expected:'p_length_mm',tolerance_mm:.01},{piece,metric:'seam_length',seam:'radial_end',expected:'p_length_mm',tolerance_mm:.01}]),
 notes:['Пробный математический образец. Это не готовый производственный комплект и не подтверждение посадки.','Представлены два полотнища; пояс, обтачка, застёжка и конкретная обработка низа требуют отдельного технологического решения.','Равномерный припуск 10 мм не заменяет выбор обработки верхнего и нижнего срезов.','Линии сопряжений проверяются математически. Швы в CLO автоматически не создаются.'],
 operations:['Определить способ обработки талии и конструкцию застёжки. Не стачивать оба боковых шва полностью без решения вопроса надевания изделия.','Подготовить и собрать пробный макет; проверить посадку, длину, баланс и растяжение косых участков.','После проверки макета отдельно разработать пояс или обтачку, застёжку и обработку низа.']};
const save=(name,value)=>fs.writeFileSync(path.join(output,name),JSON.stringify(value,null,2));
app.whenReady().then(async()=>{
 const passed=[],errors=[];let created=0,destroyed=0;
 class PrintWindow extends BrowserWindow{constructor(config){super(config);created++;this.on('closed',()=>destroyed++);this.webContents.on('console-message',(_,detail)=>{if(detail?.level==='error')errors.push(detail.message);});}}
 try{
  const initial=JSON.stringify(profile),result=await require('./pattern-design.cjs').worker({profile,design});
  assert.equal(result.needs_input,undefined);assert.equal(result.qa_blocked,undefined);assert(result.qa_report?.valid,'The new parametric worker must pass its actual geometry/assembly checks');
  const model=result.garment,qa=result.qa_report;assert(model);assert.equal(model.method,'parametric_design_v1');assert.equal(model.category,'skirt');assert.equal(model.pieces.length,2);assert.equal(model.sewing_graph.length,2);assert.equal(model.profile_context.sex,'female');
  assert.equal(model.measurement_snapshot.waist.value,720);assert.equal(model.measurement_snapshot.waist.unit,'mm');assert.equal(model.measurement_snapshot.waist.status,'unverified');assert.equal(model.parameters.length_mm,600);assert.equal(model.parameters.waist_ease_mm,20);assert.equal(JSON.stringify(profile),initial);
  assert.equal(model.readiness.fit_verified,false);assert.equal(model.readiness.sewing_ready,false);assert.equal(qa.fit_verified,false);assert.equal(qa.sewing_ready,false);assert.equal(qa.native_export.status,'not_measured');
  assert(qa.dimension_checks.every(c=>c.passed));const waistChecks=qa.dimension_checks.filter(c=>c.seam==='waist'),waistActual=waistChecks.reduce((sum,c)=>sum+c.actual_mm,0),waistExpected=720+20;
  assert.equal(waistChecks.length,2);assert(Math.abs(waistActual-waistExpected)<.2,'Both half-waists must add up to the measured waist plus ease');
  const sideChecks=qa.dimension_checks.filter(c=>c.seam?.startsWith('radial_'));assert.equal(sideChecks.length,4);for(const c of sideChecks)assert(Math.abs(c.actual_mm-600)<.01);
  assert(qa.assembly.valid);assert.equal(qa.assembly.links.length,2);for(const seam of qa.assembly.links){assert(seam.passed);assert(Math.abs(seam.residual_mm)<.01);assert.equal(seam.ease_mm,0);for(const end of seam.ends)assert(Math.abs(end.length_mm-600)<.01);}
  for(const piece of model.pieces){assert.equal(piece.allowance_mm,10);assert.equal(piece.cut_quantity,1);assert.equal(piece.seam_contour.length,6);assert.equal(piece.seam_contour.filter(s=>s.c1).length,4);assert(piece.grainline?.length===2);assert(piece.notches.length>=2);}
  passed.push('Настоящий parametric_design.py построил два полотнища по тестовой талии 72 см, прибавке 2 см и радиальной длине 60 см; исходный профиль и статус мерки сохранены');
  passed.push('Проверены замкнутые контуры, припуски 10 мм, 4 кривых Безье на полотнище, две пары боковых швов и четыре боковые длины 600 мм');
  save('profile-input.json',profile);save('design.json',design);save('model.json',model);fs.writeFileSync(path.join(output,'quality-report.md'),result.qa_markdown||'');
  const exported=await require('./print-patterns.cjs').exportPrint(model,output,{BrowserWindow:PrintWindow,format:'A0'});assert.equal(exported.scale_percent,100);assert.equal(exported.part_count,2);assert.equal(exported.page_count,5,'The two oversized half-circle panels must be tiled, never shrunk to one A0 page');assert.equal(exported.fit_verified,false);assert.equal(exported.sewing_ready,false);
  const python=require('./python-runtime.cjs').executable(),check=`import json, math, sys
from pypdf import PdfReader
r=PdfReader(sys.argv[1]); expected=int(sys.argv[2]); assert len(r.pages)==expected
sizes=[]
for page in r.pages:
 w,h=float(page.mediabox.width),float(page.mediabox.height); sizes.append([w,h])
 assert abs(w-841*72/25.4)<.5 and abs(h-1189*72/25.4)<.5
text=''.join(p.extract_text() or '' for p in r.pages)
assert 'Переднее полотнище юбки-солнце' in text and 'Заднее полотнище юбки-солнце' in text
assert 'пробный макет' in text.lower()
rectangles=[]
def before(op,args,cm,tm):
 if op==b're' and len(args)==4:
  w,h=float(args[2]),float(args[3]);a,b,c,d,e,f=map(float,cm);rectangles.append([math.hypot(w*a,w*b),math.hypot(h*c,h*d)])
r.pages[0].extract_text(visitor_operand_before=before)
calibration=[v for v in rectangles if abs(v[0]-100*72/25.4)<.5 and abs(v[1]-100*72/25.4)<.5]
assert calibration,rectangles[:20]
print(json.dumps(dict(pages=len(r.pages),media_box_points=sizes[0],calibration_points=calibration[0],calibration_mm=[v*25.4/72 for v in calibration[0]],russian_labels=True)))`;
  const verified=spawnSync(python,['-c',check,exported.paths.pdf,String(exported.page_count)],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(verified.status,0,verified.stderr||verified.stdout);const pdf=JSON.parse(verified.stdout);
  passed.push('Скрытый Electron создал PDF A0 1:1; pypdf подтвердил 5 страниц A0, русские подписи и контрольный квадрат 100 × 100 мм по векторным координатам');
  assert.equal(created,1);assert.equal(destroyed,1);assert.deepEqual(errors,[]);
  const metrics={waist_body_mm:720,waist_ease_mm:20,waist_target_mm:waistExpected,waist_actual_mm:waistActual,waist_residual_mm:waistActual-waistExpected,length_target_mm:600,side_lengths_mm:sideChecks.map(c=>c.actual_mm),side_seam_residuals_mm:qa.assembly.links.map(s=>s.residual_mm),waist_radius_formula:'(720+20)/(2*pi)',waist_radius_mm:waistExpected/(2*Math.PI),seam_allowance_mm:10,piece_count:model.pieces.length,seam_segments_per_piece:model.pieces.map(p=>p.seam_contour.length),bezier_segments_per_piece:model.pieces.map(p=>p.seam_contour.filter(s=>s.c1).length),profile_sex:model.profile_context.sex,qa_valid:qa.valid};
  const report={passed,renderer_errors:errors,model:metrics,pdf,pdf_sha256:createHash('sha256').update(fs.readFileSync(exported.paths.pdf)).digest('hex'),files:{pdf:path.basename(exported.paths.pdf),manifest:path.basename(exported.paths.manifest),model:'model.json',design:'design.json',profile:'profile-input.json',qa:'quality-report.md'},sample_profile_is_synthetic:true,real_clo:false,live_gpt:false,computer_use:false,fit_verified:false,sewing_ready:false,native_clo_dimensions_verified:false};save('validation.json',report);
  fs.writeFileSync(path.join(output,'README.md'),'# Сквозной образец: юбка-солнце\n\nПроверены математическое построение и печатный PDF. Живой CLO и реальные мерки человека не использовались.\n\nДемонстрационные исходные данные: талия 72 см, прибавка 2 см по полному обхвату, длина 60 см, явно заданный женский пол профиля. Радиус талии вычислен как (720 + 20) / (2π) = '+metrics.waist_radius_mm.toFixed(6)+' мм. Сумма длин двух линий талии: '+waistActual.toFixed(6)+' мм, цель 740 мм. Каждая боковая длина 600 мм, невязки сопряжений: '+metrics.side_seam_residuals_mm.map(v=>v.toFixed(6)).join(', ')+' мм. Припуск 10 мм.\n\nPDF A0 в масштабе 100% содержит 5 листов: контрольный лист и по 2 листа на каждое крупное полотнище. Масштабирование для подгонки под лист не применяется. Контрольный квадрат в файле: '+pdf.calibration_mm.map(v=>v.toFixed(6)).join(' × ')+' мм. Перед раскроем проверьте квадрат на фактической распечатке.\n\n**Это пробный макет, а не готовое к пошиву изделие.** Здесь только два полотнища. Пояс или обтачка, застёжка, технология обработки талии и низа, свойства материала и посадка требуют отдельной разработки и проверки. Нативные швы и размеры в CLO не проверены.\n\n`design.json` содержит безопасную воспроизводимую схему; `model.json` - результат настоящего Python-движка с геометрией и QA; `validation.json` - проверенные размеры модели и PDF; рядом находятся PDF и его manifest.\n');
  app.exit(0);
 }catch(error){save('validation.json',{error:error.stack,passed,renderer_errors:errors,sample_profile_is_synthetic:true,real_clo:false,live_gpt:false,computer_use:false,created,destroyed});app.exit(1);}
});
