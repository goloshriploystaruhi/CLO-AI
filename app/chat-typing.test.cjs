const {test}=require('node:test'),assert=require('node:assert/strict'),{prefix}=require('./chat-typing.js');
test('stream checkpoints keep only the already revealed common prefix, including corrected and absent previews',()=>{
 assert.equal(prefix('Передняя половинка: 300 мм.',null),0);
 assert.equal(prefix('Передняя половинка: 300 мм.',{text:'Передняя половинка: 300 мм.',cut:7}),7);
 assert.equal(prefix('Передняя половинка: 300 мм.',{text:'Передняя половинка: 300 мм.',cut:10000}),'Передняя половинка: 300 мм.'.length);
 assert.equal(prefix('Другая деталь',{text:'Передняя половинка',cut:15}),0);
 assert.equal(prefix('Перед: 300 мм.',{text:'Перед: 200 мм.',cut:12}),7);
 assert.equal(prefix('Ё 👩🏽‍💻 готово',{text:'Ё 👩🏽‍💻',cut:'Ё 👩🏽‍💻'.length}),'Ё 👩🏽‍💻'.length);
});
