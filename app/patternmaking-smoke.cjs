// Real recipe worker -> model/job -> hidden native PDF. No GPT, live CLO or computer use.
const {app, BrowserWindow} = require('electron');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process'), {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'reports/patternmaking-adaptation/sample');
fs.mkdirSync(output, {recursive: true});
const isolated = fs.mkdtempSync(path.join(root, 'research/patternmaking-print-'));
app.setPath('userData', path.join(isolated, 'electron'));
app.disableHardwareAcceleration();
app.on('window-all-closed', () => {});
const clone = value => JSON.parse(JSON.stringify(value));
const save = (file, value) => fs.writeFileSync(path.join(output, file), JSON.stringify(value, null, 2));
const profile = {id: 'patternmaking-smoke-person', name: 'Учебный профиль — не реальный человек', metadata: {sex: 'female'},
  measurements: Object.fromEntries(Object.entries({waist: 720, hips: 960, waist_hip_length: 200}).map(([key, value]) => [key, {value, unit: 'mm', source: 'manual', status: 'unverified', note: 'Явно заданное тестовое значение; человек не измерялся.'}]))};
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function point(segment, t) {
  if (!segment.c1) return segment.start.map((v, i) => v + (segment.end[i] - v) * t);
  const u = 1 - t;
  return [0, 1].map(i => u ** 3 * segment.start[i] + 3 * u * u * t * segment.c1[i] + 3 * u * t * t * segment.c2[i] + t ** 3 * segment.end[i]);
}
// Independent adaptive integration: do not trust precomputed recipe dimensions alone.
function length(segment) {
  if (!segment.c1) return distance(segment.start, segment.end);
  const speed = t => Math.hypot(...[0, 1].map(i => 3 * (1 - t) ** 2 * (segment.c1[i] - segment.start[i]) + 6 * (1 - t) * t * (segment.c2[i] - segment.c1[i]) + 3 * t * t * (segment.end[i] - segment.c2[i])));
  const simpson = (a, b) => (b - a) / 6 * (speed(a) + 4 * speed((a + b) / 2) + speed(b));
  const integrate = (a, b, total, tolerance, depth) => {
    const mid = (a + b) / 2, left = simpson(a, mid), right = simpson(mid, b), delta = left + right - total;
    if (!depth || Math.abs(delta) < 15 * tolerance) return left + right + delta / 15;
    return integrate(a, mid, left, tolerance / 2, depth - 1) + integrate(mid, b, right, tolerance / 2, depth - 1);
  };
  return integrate(0, 1, simpson(0, 1), 1e-8, 18);
}
function stationWidth(piece, y) {
  const xs = [];
  for (const segment of piece.seam_contour) {
    for (let i = 0; i <= 64; i++) {
      const t = i / 64, p = point(segment, t);
      if (Math.abs(p[1] - y) < 1e-7) xs.push(p[0]);
      if (!i) continue;
      const old = point(segment, (i - 1) / 64);
      if ((old[1] - y) * (p[1] - y) >= 0) continue;
      let a = (i - 1) / 64, b = t;
      for (let n = 0; n < 45; n++) { const m = (a + b) / 2; if ((point(segment, a)[1] - y) * (point(segment, m)[1] - y) <= 0) b = m; else a = m; }
      xs.push(point(segment, (a + b) / 2)[0]);
    }
  }
  assert(xs.length >= 2, 'Линия бёдер должна пересекать обе стороны полотнища');
  return Math.max(...xs) - Math.min(...xs);
}
function verify(result, expectedLength) {
  assert.equal(result.needs_input, undefined); assert.equal(result.qa_blocked, undefined);
  assert(result.qa_report?.valid, 'Настоящая проверка геометрии и сопряжений должна пройти');
  assert.equal(result.patterns?.length, 3, 'Нативный job должен содержать три детали');
  const g = result.garment, qa = result.qa_report;
  assert.deepEqual(g.pieces.map(p => p.role), ['front', 'back_left', 'back_right']);
  assert.equal(g.profile_context.sex, 'female');
  for (const [key, expected] of Object.entries({waist: 720, hips: 960, waist_hip_length: 200})) {
    assert.equal(g.measurement_snapshot[key].value, expected); assert.equal(g.measurement_snapshot[key].unit, 'mm');
    assert.equal(g.measurement_snapshot[key].status, 'unverified');
  }
  assert.equal(g.parameters.length_mm, expectedLength); assert.equal(g.parameters.waist_ease_mm, 20); assert.equal(g.parameters.hip_ease_mm, 40);
  assert.equal(g.recipe_details.id, 'patternmaking_skirt_v1'); assert.equal(g.recipe_details.front_cut_on_fold, false);
  assert(Math.abs(g.recipe_details.waist_closed_mm - 740) < 1e-6);
  assert.equal(g.recipe_details.waist_target_mm, 740); assert.equal(g.recipe_details.hip_circumference_mm, 1000);
  assert.equal(g.recipe_details.hip_level_mm, 190, 'Глубина бёдер 200 мм считается от исходной талии, бок поднят на 10 мм');
  assert.equal(g.readiness.fit_verified, false); assert.equal(g.readiness.sewing_ready, false);
  assert.equal(qa.fit_verified, false); assert.equal(qa.sewing_ready, false); assert.equal(qa.native_export.status, 'not_measured');
  assert(qa.dimension_checks.length > 6 && qa.dimension_checks.every(c => c.passed)); assert(qa.assembly.valid);
  let waist = 0, hips = 0, darts = 0;
  for (const piece of g.pieces) {
    assert.equal(piece.cut_quantity, 1); assert.equal(piece.allowance_mm, 10);
    assert(piece.seam_contour.length <= 32, 'Кривые не должны превращаться в множество швейных участков');
    for (const [name, ids] of Object.entries(piece.seams)) if (/^(?:(?:left|right)_)?waist_\d+$/.test(name)) waist += ids.reduce((sum, i) => sum + length(piece.seam_contour[i]), 0);
    hips += stationWidth(piece, g.recipe_details.hip_level_mm);
    const height = qa.dimension_checks.find(c => c.piece === piece.role && c.metric === 'height');
    assert(height && Math.abs(height.actual_mm - expectedLength) < .01);
    assert.equal(piece.internal_lines.length, piece.dart_details.length * 3);
    for (const dart of piece.dart_details) {
      const [a, b] = dart.legs.map(i => piece.internal_lines[i]), fold = piece.internal_lines[dart.fold];
      assert.equal(dart.kind, 'uncut_waist_dart'); assert.deepEqual(a[1], b[1]); assert.deepEqual(a[1], fold[1]);
      assert(Math.abs(distance(...a) - distance(...b)) < 1e-7); assert(Math.abs(distance(...a) - dart.length_mm) < 1e-7);
      assert(Math.abs(distance(...fold) - dart.length_mm) < 1e-7);
      for (const contour of [piece.seam_contour, piece.cut_contour]) assert(!contour.some(s => distance(s.start, a[1]) < .001 || distance(s.end, a[1]) < .001), 'Вершина вытачки не должна попадать в разрезаемый контур');
      assert(g.sewing_graph.some(s => s.a.piece === g.pieces.indexOf(piece) && s.b.piece === s.a.piece && s.a.internal_line === dart.legs[0] && s.b.internal_line === dart.legs[1]));
      darts++;
    }
  }
  assert(Math.abs(waist - 740) < 1e-4, 'Независимая интеграция стачиваемых участков талии должна дать 740 мм');
  assert(Math.abs(hips - 1000) < 1e-6, 'Сумма ширин полотнищ на линии бёдер должна дать 1000 мм');
  assert.equal(darts, g.recipe_details.dart_count); assert(darts > 0);
  return {length_mm: expectedLength,waist_target_mm: 740,waist_integrated_mm: waist,hip_target_mm: 1000,hip_station_mm: hips,hip_level_mm: 190,dart_count: darts,
    piece_count: g.pieces.length,seam_segments_per_piece: g.pieces.map(p => p.seam_contour.length),internal_lines_per_piece: g.pieces.map(p => p.internal_lines.length),
    assembly_links: qa.assembly.links.length,qa_valid: qa.valid,profile_sex: g.profile_context.sex};
}
app.whenReady().then(async () => {
  const passed = [], rendererErrors = []; let created = 0, destroyed = 0;
  class PrintWindow extends BrowserWindow { constructor(config) {super(config); created++; this.on('closed', () => destroyed++); this.webContents.on('console-message', (_, detail) => { if (detail?.level === 'error') rendererErrors.push(detail.message); });} }
  try {
    const {worker} = require('./pattern-design.cjs'), before = JSON.stringify(profile);
    const source = await worker({operation: 'patternmaking_recipe', id: 'patternmaking_skirt_v1', parameters: {length_mm: 600, waist_ease_mm: 20, hip_ease_mm: 40}});
    assert(source.design); const design = source.design; design.name += ' — пробный макет';
    assert.deepEqual(design.measurements, ['waist', 'hips', 'waist_hip_length']);
    const original = await worker({profile, design}), metrics = verify(original, 600);
    assert.equal(JSON.stringify(profile), before);
    passed.push('Настоящий Python построил основу по трём явно заданным меркам профиля: перед целиком и две задние половинки; пол и статус мерок сохранены');
    passed.push('Независимо измерены стачиваемая талия 740 мм и обхват на линии бёдер 1000 мм; вытачки образованы внутренними линиями, их вершины не вырезаются');
    const changedDesign = clone(design); changedDesign.parameters.length_mm = 650;
    const changed = await worker({profile, design: changedDesign, previous: original.garment}), edited = verify(changed, 650);
    assert.deepEqual(changed.garment.pieces.map(p => p.id), original.garment.pieces.map(p => p.id));
    assert.equal(changed.garment.version, original.garment.version + 1);
    assert(Math.abs(edited.waist_integrated_mm - metrics.waist_integrated_mm) < 1e-8);
    assert(Math.abs(edited.hip_station_mm - metrics.hip_station_mm) < 1e-8);
    for (let i = 0; i < 3; i++) {assert.deepEqual(changed.garment.pieces[i].internal_lines, original.garment.pieces[i].internal_lines); assert.deepEqual(changed.garment.pieces[i].dart_details, original.garment.pieces[i].dart_details);}
    passed.push('Изменение длины 600 → 650 мм пересчитало контуры с сохранением талии, бёдер, вытачек и ID деталей; выполнены обе проверки QA');
    save('profile-input.json', profile); save('design.json', design); save('model.json', original.garment); save('design-length650.json', changedDesign); save('model-length650.json', changed.garment);
    fs.writeFileSync(path.join(output, 'quality-report.md'), original.qa_markdown || ''); fs.writeFileSync(path.join(output, 'quality-report-length650.md'), changed.qa_markdown || '');
    const printer = require('./print-patterns.cjs'), printGeometry = require('./print-patterns-geometry.cjs');
    for (const p of original.garment.pieces) {
      const drawing = printGeometry.drawing(p, {prefix: p.role});
      assert.equal((drawing.match(/<polyline /g) || []).length, p.internal_lines.length, 'Каждая внутренняя линия должна печататься отдельной полилинией');
      assert.equal((drawing.match(/stroke-dasharray="1 1"/g) || []).length, p.internal_lines.length, 'Вытачки должны отличаться частым пунктиром от контура резания и линии стачивания');
      assert(drawing.includes('<path d="' + printGeometry.pathData(p.cut_contour) + '" fill="none" stroke="black" stroke-width=".4"/>'), 'PDF должен сохранять контур кроя без добавления разрезов контрольных меток');
    }
    const exported = await printer.exportPrint(original.garment, output, {BrowserWindow: PrintWindow, format: 'A0'});
    assert.equal(exported.scale_percent, 100); assert.equal(exported.part_count, 3); assert.equal(exported.page_count, 4);
    assert.equal(exported.fit_verified, false); assert.equal(exported.sewing_ready, false);
    const dependencies = path.join(__dirname, '..', '.venv');
    const python = require('./python-runtime.cjs').executable();
    const check = `import json, math, sys
from pypdf import PdfReader
r=PdfReader(sys.argv[1]); assert len(r.pages)==4
for p in r.pages:
 assert abs(float(p.mediabox.width)-841*72/25.4)<.5 and abs(float(p.mediabox.height)-1189*72/25.4)<.5
text=''.join(p.extract_text() or '' for p in r.pages)
for name in json.loads(sys.argv[2]): assert name in text, name
assert 'пробный макет' in text.lower()
rectangles=[]
def before(op,args,cm,tm):
 if op==b're' and len(args)==4:
  w,h=float(args[2]),float(args[3]);a,b,c,d,e,f=map(float,cm);rectangles.append([math.hypot(w*a,w*b),math.hypot(h*c,h*d)])
r.pages[0].extract_text(visitor_operand_before=before)
square=next((v for v in rectangles if abs(v[0]-100*72/25.4)<.5 and abs(v[1]-100*72/25.4)<.5),None)
assert square,rectangles[:20]
print(json.dumps(dict(pages=len(r.pages),media_box_points=[float(r.pages[0].mediabox.width),float(r.pages[0].mediabox.height)],calibration_mm=[v*25.4/72 for v in square],russian_labels=True)))`;
    const checked = spawnSync(python, ['-c', check, exported.paths.pdf, JSON.stringify(original.garment.pieces.map(p => p.name))], {encoding: 'utf8', windowsHide: true, timeout: 15000});
    assert.equal(checked.status, 0, checked.stderr || checked.stdout); const physical = JSON.parse(checked.stdout);
    const renderer = path.join(dependencies, 'native/poppler/Library/bin/pdftoppm.exe');
    const rendered = spawnSync(renderer, ['-png', '-r', '36', exported.paths.pdf, path.join(output, 'preview')], {encoding: 'utf8', windowsHide: true, timeout: 45000});
    assert.equal(rendered.status, 0, rendered.stderr || rendered.stdout);
    const previews = fs.readdirSync(output).filter(f => /^preview-\d+\.png$/.test(f)).sort(); assert.equal(previews.length, 4);
    passed.push('Скрытый Electron создал 4 страницы A0 1:1; pypdf проверил размеры страниц, русские подписи и векторный контрольный квадрат 100 × 100 мм; Poppler отрисовал все страницы');
    assert.equal(created, 1); assert.equal(destroyed, 1); assert.deepEqual(rendererErrors, []);
    const manifest = JSON.parse(fs.readFileSync(exported.paths.manifest, 'utf8'));
    assert.deepEqual(manifest.pieces.map(p => p.internal_line_count), original.garment.pieces.map(p => p.internal_lines.length));
    save('validation.json', {passed,base: metrics,length650: edited,pdf: physical,pdf_sha256: createHash('sha256').update(fs.readFileSync(exported.paths.pdf)).digest('hex'),
      pdf_manifest: path.basename(exported.paths.manifest),pdf_file: path.basename(exported.paths.pdf),previews,renderer_errors: rendererErrors,created,destroyed,
      visual_review: {performed: false, note: 'PNG подготовлены; ручная визуальная проверка ещё не проведена.'},
      sample_profile_is_synthetic: true,real_clo: false,live_gpt: false,computer_use: false,fit_verified: false,sewing_ready: false,native_clo_dimensions_verified: false});
    fs.writeFileSync(path.join(output, 'README.md'), '# Проверяемая основа юбки: математическая схема → PDF\n\n'
      + 'Тестовый профиль, не реальный человек: талия 720 мм, бёдра 960 мм, глубина бёдер 200 мм, женский пол. Прибавки: талия 20 мм, бёдра 40 мм. Длина 600 мм, припуск 10 мм.\n\n'
      + 'Переднее полотнище построено целиком; две задние половинки отдельные. Вытачки обозначены внутренними линиями (ноги и сгиб), их вершины отсутствуют в контуре разрезания. Стачиваемые участки талии независимо интегрированы: ' + metrics.waist_integrated_mm.toFixed(6) + ' мм. Сумма ширин полотнищ на линии бёдер: ' + metrics.hip_station_mm.toFixed(6) + ' мм.\n\n'
      + 'Вторая версия пересчитана на длину 650 мм: талия, бёдра и вытачки сохранены. Обе версии имеют положительный математический QA.\n\n'
      + 'PDF A0: контрольный лист и три листа деталей, масштаб 100%. Контрольный квадрат в PDF: ' + physical.calibration_mm.map(n => n.toFixed(6)).join(' × ') + ' мм. Перед раскроем измерьте его на физической распечатке.\n\n'
      + '**Это основа для пробного макета. Посадка не подтверждена, готовность к пошиву не заявляется.** Пояс или обтачка, обработка низа и технология установки молнии требуют разработки и проверки. Живой CLO и GPT не вызывались.\n\n'
      + '`model.json` / `model-length650.json` — реальные модели Python; `design*.json` — схемы; `validation.json` — измерения, проверки PDF и статус визуальной проверки.\n');
    app.exit(0);
  } catch (error) {
    save('validation.json', {error: error.stack,passed,renderer_errors: rendererErrors,created,destroyed,real_clo: false,live_gpt: false,computer_use: false});
    app.exit(1);
  }
});
