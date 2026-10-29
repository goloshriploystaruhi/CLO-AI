const testWorkspace = require('./test-workspace.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {SemanticStore}=require('./semantic-store.cjs');
function store(){return new SemanticStore(path.join(testWorkspace.create('semantic-test-'),'pieces.json'));}
test('identity, commit only after CLO confirmation and persistence',()=>{const s=store();const patterns=s.prepare([{type:'rectangle',name:'Перед',width_mm:200,height_mm:300}]);assert.equal(s.list().length,0);s.commit({patterns},{patterns:[{pattern_index:2,clo_pattern_id:123,semantic:{parameters:{width_mm:200}}}]});assert.equal(new SemanticStore(s.file).find('Перед').clo.pattern_id,123);});
test('hip edit preserves hem and ID, increases version',()=>{const s=store(),patterns=s.prepare([{type:'trouser_panel',name:'Передняя половинка',parameters:{hip_width_mm:250,hem_width_mm:170}}]);s.commit({patterns},{patterns:[{pattern_index:0,clo_pattern_id:12,semantic:{parameters:patterns[0].parameters}}]});const p=s.find('Передняя половинка');const edit=s.edit({query:p.id,parameter:'hip_width_mm',delta_mm:30,expected_version:1});assert.equal(edit.patterns[0].parameters.hip_width_mm,280);assert.equal(edit.patterns[0].parameters.hem_width_mm,170);assert.equal(edit.patterns[0].semantic.id,p.id);assert.equal(edit.patterns[0].semantic.version,2);assert.equal(s.find(p.id).version,1);assert.throws(()=>s.edit({query:p.id,parameter:'hip_width_mm',delta_mm:30,expected_version:2}));});
test('ambiguous names rejected; errors never commit',()=>{const s=store();for(let i=0;i<2;i++){const patterns=s.prepare([{type:'rectangle',name:'Перед'}]);s.commit({patterns},{patterns:[{pattern_index:i,semantic:{}}]});}assert.throws(()=>s.find('Перед'));const patterns=s.prepare([{type:'rectangle',name:'Ошибка'}]);s.commit({patterns},{error:'failed'});assert.equal(s.list().length,2);});

test('trapezoid offsets accept centering and either direction without changing dimensions',()=>{
 for(const type of ['trapezoid','rounded_trapezoid']){
  const s=store(),patterns=s.prepare([{type,name:'Деталь',top_mm:200,bottom_mm:300,height_mm:400,offset_mm:25}]);
  s.commit({patterns},{patterns:[{pattern_index:0,clo_pattern_id:99,semantic:{parameters:{}}}]});
  for(const value of [0,-30,30]){const result=s.edit({query:'Деталь',parameter:'offset_mm',value_mm:value});const recipe=result.patterns[0];assert.equal(recipe.offset_mm,value);assert.equal(recipe.top_mm,200);assert.equal(recipe.bottom_mm,300);assert.equal(recipe.height_mm,400);require('./command-validation.cjs').recipes([recipe],true);}
  assert.throws(()=>s.edit({query:'Деталь',parameter:'top_mm',value_mm:0}),/Некорректный размер/);
  assert.throws(()=>s.edit({query:'Деталь',parameter:'offset_mm',value_mm:-10001}),/Некорректный размер/);
  delete s.find('Деталь').recipe.offset_mm;assert.equal(s.edit({query:'Деталь',parameter:'offset_mm',delta_mm:-15}).patterns[0].offset_mm,-15);
 }
});
