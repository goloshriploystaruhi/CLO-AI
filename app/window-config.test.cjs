const {test}=require('node:test'),assert=require('node:assert/strict');
const config=require('./window-config.cjs');
test('main window stays above ordinary windows while retaining move, minimize and close',()=>{
 assert.equal(config.alwaysOnTop,true);
 assert.equal(config.movable,true);assert.equal(config.minimizable,true);assert.equal(config.closable,true);
 assert.equal(config.resizable,false);assert.equal(config.maximizable,false);assert.equal(config.fullscreenable,false);
 assert.equal(config.width,600);assert.equal(config.height,600);assert(Object.isFrozen(config));
});
