const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {summary}=require('./category-engineering.cjs'),validation=require('./command-validation.cjs');
const research=require('../engineering/category-research.json'),catalog=require('../construction-catalog.json');
test('all category sources and implementation references resolve without turning research into implemented patterns',()=>{
 const sources=new Set(research.sources.map(s=>s.id));assert.equal(sources.size,research.sources.length);assert.equal(research.exhaustive,false);
 for(const f of Object.values(research.categories)){
  assert(f.source_ids.every(id=>sources.has(id)));assert(f.methods.every(id=>catalog[id]));
  for(const style of f.styles)if(style.method)assert(catalog[style.method]);else assert.equal(style.status,'not_implemented');
 }
 assert(research.sources.every(s=>s.implemented_external_pattern===false));assert(research.source_review.every(s=>/^[a-f0-9]{40}$/.test(s.git_blob_sha)));
});
test('research tool is read-only, strictly scoped and explains unimplemented styles in Russian',()=>{
 for(const category of ['trousers','jacket','jumpsuit']){
  validation.tool({action:'get_category_engineering',args:{category}});const text=summary(category);
  assert.match(text,/пока не реализовано/);assert.match(text,/Посадка и защитные свойства не подтверждены/);assert.doesNotMatch(text,/\{"/);
 }
 assert.throws(()=>validation.tool({action:'get_category_engineering',args:{category:'all',code:'run()'}}));
 assert.throws(()=>validation.tool({action:'get_category_engineering',args:{category:'jacket',path:'secret'}}));
 assert.throws(()=>summary('../../secret'));
 for(const category of ['skirt','cape','custom_garment']){validation.tool({action:'get_category_engineering',args:{category}});assert.match(summary(category),/trial_pattern_design/);}
 assert.throws(()=>validation.tool({action:'get_category_engineering',args:{category:'../../secret'}}));
});
