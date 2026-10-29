const {test}=require('node:test'),assert=require('node:assert/strict'),format=require('./ui-format.js');
test('visible operation status uses real known phases and never tool data, raw descriptions or preview text',()=>{
 assert.equal(format.operationStatus([{action:'tool',status:'completed',description:'Получены данные инструмента.'}]),null);
 const status=format.operationStatus([{action:'validation',status:'running',description:'Проверка actual result'}, {action:'trial',status:'completed',description:'Получены данные инструмента.'}]);
 assert.equal(status.text,'Проверяю лекала…');assert.equal(status.state,'pending');
 assert.equal(format.operationStatus([{action:'request',status:'running',description:'{"tools":["private"]}'}]).text,'Анализирую запрос…');
 assert.equal(format.operationStatus([{action:'construction',status:'completed'}]).state,'pending');
 assert.equal(format.operationStatus([{action:'result',status:'verified',description:'Готово'}]),null);
});
test('chat does not mark missing confirmation or validation failures successful',()=>{
 assert.equal(format.resultSummary({},{}).kind,'error');
 assert.equal(format.resultSummary({validation:{valid:false,errors:[{piece:'Перед',section:'Бок',message:'Разные длины'}]}},{}).kind,'error');
 assert.match(format.resultSummary({validation:{valid:true}},{}).text,/Посадка.*не подтверждены/);
 assert.equal(format.resultSummary({error:'Сбой'},{}).kind,'error');
});
test('confirmed garment reports manual sewing and never production readiness',()=>{
 const r=format.resultSummary({patterns:[{},{}],backup:'backup.zprj'},{garment:{name:'Футболка'},replace_targets:[{}]});
 assert.equal(r.kind,'success');assert.match(r.text,/Обновлено деталей: 2/);assert.match(r.text,/вручную/);assert.doesNotMatch(r.text,/готово к пошиву/i);
});
test('confirmed construction exposes the same PDF link and learning warning immediately as saved history',()=>{
 const message='[Открыть PDF](clo-artifact://12345678-1234-1234-1234-123456789012)',r=format.resultSummary({patterns:[{}],print_export:{print_preparation:'created',message},learning_warning:'Библиотека не сохранена.'},{garment:{name:'Накидка'}});assert.match(r.text,/clo-artifact:/);assert.match(r.text,/Библиотека/);assert.equal(r.kind,'success');
 const failed=format.resultSummary({patterns:[{}],print_warning:'Недостаточно места.'},{garment:{name:'Накидка'}});assert.match(failed.text,/PDF не подготовлен/);assert.equal(failed.kind,'success');
});
test('JSON tool responses are projected into readable lists without geometry payloads',()=>{
 const s=format.readable(JSON.stringify([{name:'Перед',version:2,geometry:{parameters:{width_mm:300},contour:[{huge:'payload'}]}}]));
 assert.match(s,/Перед/);assert.match(s,/Ширина: 300 мм/);assert.doesNotMatch(s,/payload|contour|\{/);
 assert.match(format.readable({profiles:[],active:null}),/Профилей пока нет/);
 assert.equal(format.parameter('private_key','secret'),null);
});
test('connection errors explain network and reauthentication in Russian',()=>{
 assert.match(format.errorText({code:'network_error',message:'Could not reach ChatGPT. Check your connection and try again.'}),/Не удалось связаться с ChatGPT/);
 assert.match(format.errorText({code:'identity_verification_unavailable'}),/не удалено/);
 assert.match(format.errorText({code:'invalid_refresh_token'}),/повторно войти/);
 assert.doesNotMatch(format.errorText({code:'network_error'}),/API.ключ|cookies/i);
});
test('selective update reports actual replacements, reused pieces and verified properties',()=>{
 const r=format.resultSummary({patterns:[{preserved_properties:{status:'verified'}},{preserved_properties:{status:'unavailable'}},{update:'reused'}],update_summary:{replaced:2,reused:1}},{garment:{name:'Футболка'},replace_targets:[{},{},{}]});
 assert.equal(r.kind,'success');assert.match(r.text,/Заменено деталей: 2/);assert.match(r.text,/Сохранено без пересоздания: 1/);
 assert.match(r.text,/подтверждён CLO: 1/);assert.match(r.text,/Швы заменённых деталей/);assert.doesNotMatch(r.text,/Обновлено деталей: 3/);
});

function changeFixture(){
 const pieces=[{id:'front',name:'Перед'},{id:'back',name:'Спинка'},{id:'sleeve',name:'Рукав'}];
 return {pieces,sewing_graph:[{id:'shoulder',a:{piece:0,segments:[0]},b:{piece:1,segments:[0]}},{id:'cap',a:{piece:0,segments:[1,2]},b:{piece:2,segments:[0,1]}},{id:'underarm',a:{piece:2,segments:[2]},b:{piece:2,segments:[4]}}]};
}
test('change warning names affected pairs once, including the reused side of a connection',()=>{
 const garment=changeFixture(),impact=format.changeImpact(garment,garment.pieces,['replaced','replaced','reused']);
 assert.deepEqual(impact.replaced.map(p=>p.id),['front','back']);assert.deepEqual(impact.connections.map(c=>c.id),['shoulder','cap']);
 const question=format.replacementQuestion({update_preview:{replaced:2,reused:1,impact}});
 assert.match(question,/Перед.*Спинка/);assert.match(question,/Перед · участки конструкции 2, 3 ↔ Рукав/);assert.match(question,/Другие швы, добавленные вручную/);
 assert.doesNotMatch(question,/сшиты|швы сохранены/i);
});
test('unchanged native pieces and removed pieces are distinguished without inventing seam preservation',()=>{
 const garment=changeFixture(),unchanged=format.changeImpact(garment,garment.pieces,['reused','reused','reused']);
 assert.equal(unchanged.connections.length,0);assert.doesNotMatch(format.replacementQuestion({update_preview:{replaced:0,reused:3,impact:unchanged}}),/восстановить вручную/);
 const removed=format.changeImpact({...garment,pieces:garment.pieces.slice(0,2),sewing_graph:[garment.sewing_graph[0]]},garment.pieces,['reused','reused']);
 assert.deepEqual(removed.removed,[{id:'sleeve',name:'Рукав'}]);assert.match(format.impactText(removed),/Удаляемые детали: Рукав/);assert.match(format.impactText(removed),/удаляемых деталей/);
});
test('result uses actual native updates rather than the preview and rejects missing statuses',()=>{
 const garment=changeFixture(),job={garment,previous_pieces:garment.pieces,replace_targets:[{},{},{}],update_preview:{impact:{connections:[{label:'Неподтверждённая пара'}]}}};
 const result={update_summary:{replaced:1,reused:2},patterns:[{update:'replaced'},{update:'reused'},{update:'reused'}]};
 const text=format.resultSummary(result,job).text;
 assert.match(text,/Соединения по карте для ручного сшивания: 2/);assert.doesNotMatch(text,/Неподтверждённая/);
 assert.equal(format.changeImpact(garment,garment.pieces,['replaced',undefined,'reused']),null);
 assert.doesNotMatch(format.resultSummary({...result,patterns:[{},{},{}]},job).text,/Соединения по карте/);
});
test('large impact lists are bounded in the confirmation and complete in the result text',()=>{
 const garment=changeFixture();garment.sewing_graph=Array.from({length:20},(_,i)=>({...garment.sewing_graph[0],id:String(i)}));
 const impact=format.changeImpact(garment,garment.pieces,['replaced','reused','reused']);
 assert.equal((format.replacementQuestion({update_preview:{replaced:1,reused:2,impact}}).match(/•/g)||[]).length,6);
 assert.equal((format.impactText(impact).match(/•/g)||[]).length,20);
});
