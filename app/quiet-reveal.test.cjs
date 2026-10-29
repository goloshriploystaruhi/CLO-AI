const {test}=require('node:test'),assert=require('node:assert/strict'),{defaults:t,delay}=require('./quiet-reveal.js');
test('Quiet Reveal has bounded monotone timings and no long-form cascade',()=>{
 assert(t.exit>=90&&t.exit<=100);assert(t.overlap>=60&&t.overlap<=70);assert(t.enter>=190&&t.enter<=210);
 const delays=Array.from({length:1000},(_,i)=>delay(i));assert.equal(delays[0],65);assert.equal(delays[1]-delays[0],15);assert(Math.max(...delays)-delays[0]<=60);assert.equal(Math.max(...delays)+t.enter,280);assert(delays.every(d=>d+t.enter<=t.total));assert.equal(delay(999,t,false),65);
 assert.equal(t.exitY,-4);assert.equal(t.enterY,5);assert.match(t.easeOut,/cubic-bezier/);assert.match(t.easeIn,/cubic-bezier/);
});
