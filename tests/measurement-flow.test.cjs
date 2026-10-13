const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/app-harness.cjs');
const close=(a,b,eps=1e-8)=>assert(Math.abs(a-b)<eps,`${a} != ${b}`);
function steady(h,x=0,y=0,z=10,count=25,dt=100){for(let i=0;i<count;i++){h.advance(dt);h.motion(x,y,z);}}
function click(h,id){assert(h.nodes.has(id),`missing ${id}`);h.nodes.get(id).click();}

test('measurement actions expose average beside Hold and compact the active phone layout',()=>{
 const h=createHarness();for(const id of ['quickPrecisionButton','autoCaptureButton','cancelCaptureButton','referenceResetButton','referenceLabel'])assert(h.nodes.has(id),id);
 h.motion(0,0,10);assert.equal(h.document.documentElement.dataset.measuring,'true');
 assert.match(h.html,/html\[data-measuring="true"\] \.page-intro/);
 click(h,'quickPrecisionButton');assert(h.state.precision);
});
test('Surface uses true plane inclination for diagonal tilt',()=>{
 const h=createHarness();h.motion(.5,.5,Math.SQRT1_2);close(h.state.current.main,45);close(h.state.current.slope,100);
});
test('reference separation is geometric and preserves existing stored component angles',()=>{
 const h=createHarness({stored:{zero:{flatX:60,flatY:0,edge:0}}});h.motion(-Math.sqrt(3)/2,0,.5);close(h.state.current.main,120);assert.equal(h.state.current.slope,null);
});
test('a high diagonal stored reference and matching surface are exactly zero',()=>{
 const h=createHarness({stored:{zero:{flatX:30,flatY:30,edge:0}}});h.motion(.5,.5,Math.SQRT1_2);close(h.state.current.main,0);close(h.state.current.slope,0);
});
test('invalid corrected geometry and invalid stored reference cannot show level',()=>{
 for(const stored of [{calibration:{biasX:-70,biasY:-70}},{zero:{flatX:70,flatY:70,edge:0}}]){
 const h=createHarness({stored});h.motion(0,0,10);assert.equal(h.state.current.valid,false);assert.equal(h.text('mainReading'),'—');assert.equal(h.nodes.get('sensorStage').classList.contains('is-level'),false);assert.equal(h.nodes.get('autoCaptureButton').disabled,true);
 }
});
test('vertical slope is unavailable consistently in live and averaged readings',()=>{
 const h=createHarness();h.motion(1,0,0);h.preference('slope');assert.equal(h.state.current.slope,null);assert.equal(h.text('mainReading'),'—');
 click(h,'precisionButton');steady(h,1,0,0);assert.equal(h.state.locked,true);assert.equal(h.state.lockedReading.slope,null);assert.equal(h.text('mainReading'),'—');
});
test('average combines vectors instead of averaging magnitudes or axis angles',()=>{
 const h=createHarness();h.motion(.5,.5,Math.SQRT1_2);click(h,'precisionButton');steady(h,.5,.5,Math.SQRT1_2);close(h.state.lockedReading.main,45);close(h.state.lockedReading.slope,100);
});
test('reference label and nearby reset operate only on the active mode',()=>{
 const h=createHarness({stored:{zero:{flatX:0,flatY:0,edge:0,edgeRoll:3}}});h.motion(0,0,10);assert.equal(h.text('referenceLabel'),'Absolute level');assert.equal(h.nodes.get('referenceResetButton').hidden,true);
 click(h,'edgeModeButton');assert.equal(h.text('referenceLabel'),'Relative to saved angle');click(h,'referenceResetButton');assert.equal(h.state.zero.edge,0);
});
test('relative match never claims absolute level and reset preserves the other mode',()=>{
 const h=createHarness({stored:{zero:{flatX:10,flatY:0,edge:0,edgeRoll:3}}});steady(h,Math.sin(Math.PI/18),0,Math.cos(Math.PI/18));assert.equal(h.text('stageStatusText'),'Matches reference');
 click(h,'referenceResetButton');assert.equal(h.state.zero.flatX,0);assert.equal(h.state.zero.edgeRoll,3);assert.equal(h.text('referenceLabel'),'Absolute level');
});
test('mode change cancels averaging and removes a held result from the previous mode',()=>{
 const h=createHarness();h.motion(1,0,10);click(h,'precisionButton');steady(h,1,0,10,5);click(h,'edgeModeButton');assert.equal(h.state.precision,null);h.advance(3000);assert.equal(h.state.locked,false);
 click(h,'holdButton');click(h,'flatModeButton');assert.equal(h.state.locked,false);
});
test('Set zero recalculates immediately and cancels an active capture',()=>{
 const h=createHarness();h.motion(1,0,10);click(h,'precisionButton');click(h,'zeroButton');assert.equal(h.state.precision,null);close(h.state.current.main,0);assert.equal(h.text('mainReading'),'0.0');
});
test('auto capture waits for placement and a fresh stable duration, then freezes once',()=>{
 const h=createHarness();h.motion(1,0,10);click(h,'autoCaptureButton');steady(h,1,0,10,12);assert.equal(h.state.locked,false);steady(h,1,0,10,12);assert.equal(h.state.locked,true);assert.equal(h.state.autoCapture,null);const held=JSON.stringify(h.state.lockedReading);steady(h,3,0,10);assert.equal(JSON.stringify(h.state.lockedReading),held);
});
test('a burst of samples does not replace the auto capture minimum duration',()=>{
 const h=createHarness();h.motion(0,0,10);click(h,'autoCaptureButton');h.advance(1100);for(let i=0;i<50;i++)h.motion(0,0,10);assert.equal(h.state.locked,false);
});
test('auto capture does not capture stale samples and times out',()=>{
 const h=createHarness();h.motion(0,0,10);click(h,'autoCaptureButton');h.advance(16000);assert.equal(h.state.locked,false);assert.equal(h.state.autoCapture,null);assert.match(h.text('toast'),/could not get a stable reading/i);
});
test('auto capture rejects movement and supports explicit cancel and mode-change cancel',()=>{
 const h=createHarness();h.motion(0,0,10);click(h,'autoCaptureButton');for(let i=0;i<60;i++){h.advance(100);h.motion(i%2?1:-1,0,10);}assert.equal(h.state.locked,false);click(h,'cancelCaptureButton');assert.equal(h.state.autoCapture,null);
 click(h,'autoCaptureButton');click(h,'edgeModeButton');assert.equal(h.state.autoCapture,null);
});
test('hidden-page transition cancels collection instead of holding an old value',()=>{
 const h=createHarness();h.motion(0,0,10);click(h,'autoCaptureButton');h.document.visibilityState='hidden';h.document.dispatch('visibilitychange');assert.equal(h.state.autoCapture,null);assert.equal(h.state.locked,false);
});
function roll(h,angle){h.state.filteredGravity=null;h.motion(Math.sin(angle*Math.PI/180),Math.cos(angle*Math.PI/180),0);}
test('legacy ambiguous Edge offsets reset visibly without losing Surface/calibration',()=>{
 const h=createHarness({stored:{zero:{flatX:10,flatY:-2,edge:3},calibration:{biasX:1,biasY:-1,updatedAt:'2026-10-01'}}});assert.equal(h.state.zero.edge,0);assert.equal(h.state.zero.flatX,10);assert.equal(h.state.calibration.biasX,1);assert.match(h.text('toast'),/old Edge zero reference was reset/);
});
test('Edge zero retains the contact line across nearest-axis changes and wrapping',()=>{
 const h=createHarness({stored:{mode:'edge'}});roll(h,30);click(h,'zeroButton');roll(h,60);close(h.state.current.main,30);roll(h,210);close(h.state.current.main,0);roll(h,120);close(h.state.current.main,90);assert.equal(h.state.current.slope,null);
 const reloaded=createHarness({stored:h.stored()});roll(reloaded,60);close(reloaded.state.current.main,30);
});
test('Edge average uses undirected circular geometry across a fold',()=>{
 const h=createHarness({stored:{mode:'edge'}});roll(h,135);click(h,'precisionButton');for(let i=0;i<40;i++){h.advance(40);roll(h,i%2?134.9:135.1);}h.advance(400);close(h.state.lockedReading.main,45);close(h.state.lockedReading.slope,100);
});
test('varying-vector average differs from averaging Surface component angles',()=>{
 const h=createHarness();h.motion(0,0,1);click(h,'precisionButton');for(let i=0;i<40;i++){h.advance(40);h.state.filteredGravity=null;h.motion(i%2?Math.sqrt(3)/2:0,i%2?0:Math.sqrt(3)/2,.5);}h.advance(400);close(h.state.lockedReading.main,50.76847951640775);close(h.state.lockedReading.slope,122.4744871391589);
});
test('two-point calibration keeps additive component-angle bias units',async()=>{
 const h=createHarness();h.motion(0,0,1);click(h,'calibrateButton');click(h,'captureCal1');
 function sampleAngles(x,y){const gx=Math.sin(x*Math.PI/180),gy=Math.sin(y*Math.PI/180);h.state.filteredGravity=null;h.motion(gx,gy,Math.sqrt(1-gx*gx-gy*gy));}
 for(let i=0;i<12;i++){h.advance(100);sampleAngles(7,-4);}await Promise.resolve();click(h,'captureCal2');for(let i=0;i<12;i++){h.advance(100);sampleAngles(-3,2);}await Promise.resolve();close(h.state.calibration.biasX,2);close(h.state.calibration.biasY,-1);sampleAngles(7,-4);close(h.state.current.x,5);close(h.state.current.y,-3);
});
test('resetting calibration also clears references expressed in the old calibration',async()=>{
 const h=createHarness({stored:{zero:{flatX:10,flatY:0,edge:0,edgeRoll:5},calibration:{biasX:1,biasY:0,updatedAt:'2026-10-01'}}});h.motion(0,0,1);click(h,'resetCalibrationButton');click(h,'confirmOk');await Promise.resolve();assert.equal(h.state.zero.flatX,0);assert.equal(h.state.zero.edgeRoll,undefined);
});
test('Edge stability stays stable while readings cross a nearest-axis fold',()=>{
 const h=createHarness({stored:{mode:'edge'}});for(let i=0;i<30;i++){h.advance(100);roll(h,i%2?134.99:135.01);}assert.equal(h.text('stabilityDisplay'),'Stable');
});
test('calibration rejects face-down samples instead of saving them',async()=>{
 const h=createHarness();h.motion(0,0,1);click(h,'calibrateButton');click(h,'captureCal1');for(let i=0;i<12;i++){h.advance(100);h.state.filteredGravity=null;h.motion(0,0,-1);}await Promise.resolve();assert.equal(h.state.calFirst,null);assert.equal(h.nodes.get('captureCal2').disabled,true);
});
test('closing calibration interrupts a pending capture and cannot later save',async()=>{
 const h=createHarness();h.motion(0,0,1);click(h,'calibrateButton');click(h,'captureCal1');h.nodes.get('calibrationDialog').close();steady(h);await Promise.resolve();assert.equal(h.state.calibrationCapture,null);assert.equal(h.state.calFirst,null);assert.equal(h.state.calibration.updatedAt,null);
});
test('diagonal exact vertical has no giant finite slope in live and averaged readings',()=>{
 for(const [x,y] of [[1,1],[1,3],[.5,.5]]){
  const h=createHarness();h.motion(x,y,0);close(h.state.current.main,90);assert.equal(h.state.current.slope,null);click(h,'precisionButton');steady(h,x,y,0);close(h.state.lockedReading.main,90);assert.equal(h.state.lockedReading.slope,null);
  click(h,'zeroButton');close(h.state.current.main,0);assert.equal(h.state.current.slope,0);
 }
});
test('old calibration completion cannot close a newly reopened capture',async()=>{
 const h=createHarness();h.motion(0,0,1);click(h,'calibrateButton');click(h,'captureCal1');steady(h,0,0,1,12);await Promise.resolve();click(h,'captureCal2');steady(h,0,0,1,12);await Promise.resolve();
 h.nodes.get('calibrationDialog').close();click(h,'calibrateButton');click(h,'captureCal1');h.advance(500);assert.equal(h.nodes.get('calibrationDialog').open,true);assert(h.state.calibrationCapture);
});
