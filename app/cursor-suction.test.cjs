const {test}=require('node:test'),assert=require('node:assert/strict'),motion=require('./cursor-suction.js');
test('Unicode graphemes preserve Cyrillic accents, ZWJ emoji, modifiers and flags',()=>{
 const text='Ё е\u0308 👩🏽‍💻 🇷🇺 A';const groups=motion.graphemes(text);assert.equal(groups.map(g=>g.segment).join(''),text);assert(groups.some(g=>g.segment==='е\u0308'));assert(groups.some(g=>g.segment==='👩🏽‍💻'));assert(groups.some(g=>g.segment==='🇷🇺'));for(const g of groups)assert.equal(text.slice(g.index,g.index+g.segment.length),g.segment);
});
test('suction restores the gentle flight with bounded deformation and exact cursor convergence',()=>{
 const point={x:230,y:140},rects=[{left:220,top:130,width:20,height:20},{left:0,top:0,width:20,height:20}],paths=rects.map((r,i)=>motion.path(r,point,i,Math.hypot(220,130)));
 for(const p of paths){
  const first=motion.sample(p,0),last=motion.sample(p,600);
  assert.equal(first.x,0);assert.equal(first.sx,1);assert.equal(first.sy,1);assert.equal(first.w0,1);assert.equal(first.opacity,1);
  assert.equal(last.opacity,0);assert.equal(last.w0,1);assert(Math.abs(last.x-p.dx)<1e-8);assert(Math.abs(last.y-p.dy)<1e-8);
  for(let t=0;t<=600;t+=5){const value=motion.sample(p,t);assert(Object.values(value).every(Number.isFinite));assert(value.sx>0&&value.sx<=1.28&&value.sy>0&&value.sy<=1);assert(value.opacity>=0&&value.opacity<=1);assert.equal(value.rotation,undefined);
   const a=Math.pow(Math.max(0,Math.min(1,(t-p.delay)/p.duration)),2.3),pulse=Math.sin(Math.PI*a),bend=(p.seed-.5)*p.distance*.014*pulse;
   assert(Math.abs(value.x-(p.dx*a+p.uy*bend))<1e-9);assert(Math.abs(value.y-(p.dy*a-p.ux*bend))<1e-9);
  }
 }
});
test('only the cursor-facing edge gets extra pull; far edge and centre remain anchored in the warp',()=>{
 for(const point of [{x:150,y:10},{x:-150,y:10},{x:10,y:150},{x:10,y:-150},{x:150,y:150},{x:-150,y:-150}]){
  const p=motion.path({left:0,top:0,width:20,height:20},point,0,300),value=motion.sample(p,p.delay+p.duration*Math.pow(.5,1/2.3));
  const project=q=>{const x=p.ux*p.reach*q,y=p.uy*p.reach*q,w=value.wx*x+value.wy*y+value.w0;return (x*p.ux+y*p.uy)/w;};
  assert(Math.abs(project(-1)+p.reach)<1e-9);assert.equal(project(0),0);assert(project(1)>p.reach*1.27&&project(1)<p.reach*1.3);
  assert(project(.5)-p.reach*.5<project(1)-p.reach);
  for(const x of [-10,0,10])for(const y of [-10,0,10])assert(value.wx*x+value.wy*y+value.w0>=.779999);
 }
 const centred=motion.path({left:0,top:0,width:20,height:20},{x:10,y:10},0,1);assert.equal(motion.sample(centred,300).w0,1);
});
test('blank hold is 400ms and the accepted discrete typing return stays unchanged',()=>{
 assert.equal(motion.timing.hold,400);
 assert.deepEqual(motion.timeline(0,50),{phase:'take',time:0,visible:0});
 assert.deepEqual(motion.timeline(600,50),{phase:'hold',time:600,visible:0});
 assert.equal(motion.timeline(999.99,50).phase,'hold');
 assert.deepEqual(motion.timeline(1000,50),{phase:'type',time:0,visible:1});
 assert.equal(motion.timeline(1000+motion.typingDuration(50),50).phase,'done');
 assert.equal(motion.typedCount(50,-1),0);assert.equal(motion.typedCount(0,0),0);
 for(const count of [1,10,50,100,400,1600]){
  const duration=motion.typingDuration(count),counts=Array.from({length:101},(_,i)=>motion.typedCount(count,duration*i/100));
  assert.equal(counts[0],1);assert.equal(counts.at(-1),count);assert(counts.every((n,i)=>Number.isInteger(n)&&n>=1&&n<=count&&(!i||n>=counts[i-1])));
 }
});
test('typing accelerates per grapheme with text length and is capped for very long passages',()=>{
 const counts=[10,50,100,400,1600,1000000],durations=counts.map(motion.typingDuration),intervals=durations.map((d,i)=>d/counts[i]);
 assert(durations.every(d=>d>=motion.timing.typingMin&&d<=1400));assert(intervals.every((d,i)=>!i||d<intervals[i-1]));assert.equal(durations.at(-1),1400);
 assert.equal(motion.typingDuration(0),0);assert.equal(motion.timeline(1000,0).phase,'done');
});
test('click and touch use actual coordinates including zero; keyboard uses element centre',()=>{
 const el={getBoundingClientRect:()=>({left:20,top:40,width:200,height:80})};
 assert.deepEqual(motion.origin(el,{detail:1,clientX:0,clientY:100}),{x:0,y:100});assert.deepEqual(motion.origin(el,{pointerType:'touch',clientX:12,clientY:60}),{x:12,y:60});assert.deepEqual(motion.origin(el,{changedTouches:[{clientX:30,clientY:70}]}),{x:30,y:70});assert.deepEqual(motion.origin(el,{detail:0,clientX:10,clientY:10}),{x:120,y:80});
});
