// Pure parity orchestration fixtures; trusted flags here are synthetic data,
// never native GUI or real service acceptance. Uses the actual shared sampler.
const test=require('node:test'),assert=require('node:assert/strict')
const{createParityCoordinate,assertParityTrustedTarget}=require('./verify-mac-parity-ui.cjs')
const geometry=require('./qa-coordinate-geometry114.cjs')
const selector='.download-modal .filter-row .select-menu-btn',identity={pid:20,windowId:2,webContentsId:2},documentBinding={timeOrigin:100,url:'file:///owned/index.html'}
function fixture({positions=[380,262,262],absence=[true],badTarget=false,inputError,readAdvance=1,lateInput=false}={}){
 let at=0,index=0,point,records=[],reads=0;const inputs=[],timeouts=[],proof={operations:[],inputEvents:[]}
 const native={...identity,visible:true,minimized:false,focused:true,appHidden:false,zoom:1,bounds:{x:0,y:20,width:1280,height:900},contentBounds:{x:0,y:20,width:1280,height:900}}
 const expected={selector,token:'100:1',...documentBinding}
 const row=y=>({hit:true,x:815.5,y,bounds:{x:646,y:y-18.5,width:339,height:37},label:'Fabric',ancestorsVisible:true,runningAnimations:0,absent:true,renderer:{width:1280,height:900,hasFocus:true,hidden:false,pixelRatio:1,ready:'complete',...documentBinding}})
 const entry=type=>({type,isTrusted:true,at,timeOrigin:100,url:documentBinding.url,x:point.x,y:point.y,button:0,buttons:type.endsWith('down')?1:0,target:{tag:'BUTTON'},matchesSelector:!badTarget,renderer:{width:1280,height:900,hasFocus:true,hidden:false,pixelRatio:1}})
 const run=createParityCoordinate({identity,documentBinding,proof,save:()=>{},now:()=>at,wait:async ms=>{at+=ms},geometry,native:async(_identity,timeoutMs)=>{assert.deepEqual(_identity,identity);timeouts.push(timeoutMs);return native},evaluate:async(expression,timeoutMs)=>{
  timeouts.push(timeoutMs)
  if(expression.includes('scrollIntoView'))return
  if(expression.includes('const renderer=')){at+=readAdvance;reads++;const sampleIndex=index++;point=row(positions[Math.min(sampleIndex,positions.length-1)]);point.absent=absence[Math.min(sampleIndex,absence.length-1)];assert(expression.includes('.files-loading'),'real modal loading absence is required');return point}
  if(expression.includes('o.begin('))return expected.token
  if(expression.includes('.finish('))return{...expected,overflow:false,records}
  throw Error('Unexpected fixture expression')
 },call:async(method,args,timeoutMs)=>{
  assert.equal(method,'Input.dispatchMouseEvent');inputs.push(args);timeouts.push(timeoutMs)
  if(inputError&&args.type==='mousePressed')throw inputError
  if(args.type==='mousePressed')records.push(entry('pointerdown'),entry('mousedown'))
  if(args.type==='mouseReleased'){records.push(entry('pointerup'),entry('mouseup'),entry('click'));if(lateInput)at+=10001}
 }})
 return{run,proof,inputs,timeouts,get reads(){return reads},get at(){return at}}
}
test('parity samples async-moving modal geometry twice before a single native event sequence',async()=>{
 const f=fixture(),point=await f.run(selector)
 assert.equal(f.reads,3);assert.equal(point.y,262)
 assert.deepEqual(f.inputs.map(row=>row.type),['mouseMoved','mousePressed','mouseReleased'])
 assert(f.inputs.every(row=>row.y===262),'obsolete y380 cannot be dispatched')
 const operation=f.proof.operations[0];assert.equal(operation.complete,true);assert.equal(operation.samples[0].value.coordinate.y,380);assert.equal(operation.samples[1].value.coordinate.y,262);assert.equal(operation.samples[2].value.coordinate.y,262)
 assert.deepEqual(operation.absentSelectors,['.download-modal .files-loading']);assert(operation.trustedTargets.records.every(row=>row.matchesSelector&&row.isTrusted))
})
test('stable old modal bounds cannot qualify while the original file-loading state is present',async()=>{
 const f=fixture({positions:[380,380,262,262],absence:[false,false,true,true]})
 const point=await f.run(selector);assert.equal(f.reads,4);assert.equal(point.y,262)
 assert(f.inputs.every(row=>row.y===262));assert.equal(f.proof.operations[0].samples[0].value.coordinate.absent,false);assert.equal(f.proof.operations[0].samples[1].value.coordinate.absent,false)
})
test('parity rejects the original click landing on a changed target and does not retry it',async()=>{
 const f=fixture({badTarget:true})
 await assert.rejects(f.run(selector),/original native event must hit the intended target/)
 assert.equal(f.inputs.filter(row=>row.type==='mousePressed').length,1)
 assert.equal(f.proof.operations[0].complete,false);assert.equal(f.proof.operations[0].trustedTargets.records.length,5)
})
test('original input error is preserved together with the partial trusted event receipt',async()=>{
 const original=Error('actual CDP input failed'),f=fixture({inputError:original})
 await assert.rejects(f.run(selector),error=>error===original)
 assert.equal(f.inputs.filter(row=>row.type==='mousePressed').length,1);assert(!f.inputs.some(row=>row.type==='mouseReleased'))
 const operation=f.proof.operations[0];assert.deepEqual(operation.error,{name:original.name,message:original.message});assert.equal(operation.complete,false);assert.deepEqual(operation.trustedTargets.records,[]);assert(operation.trustedTargetError)
})
test('parity keeps the original ten-second budget and rejects a late observation without dispatch',async()=>{
 const f=fixture({readAdvance:10001})
 await assert.rejects(f.run(selector),/Original coordinate deadline/)
 assert.equal(f.inputs.length,0);assert.equal(f.proof.operations[0].deadline,10000)
 assert(f.proof.operations[0].samples.length>0);assert.equal(f.proof.operations[0].samples[0].value.coordinate.y,380)
})
test('provided route deadline is shared with every native and renderer call, not renewed per sample',async()=>{
 const f=fixture({positions:[262,262]})
 await assert.rejects(f.run(selector,{deadline:50}),/Original coordinate deadline/)
 assert.equal(f.inputs.length,0);assert.equal(f.proof.operations[0].deadline,50);assert(f.timeouts.every(ms=>ms<=50&&ms>0))
})
test('late native input completion cannot supply success even when all original target events were captured',async()=>{
 const f=fixture({positions:[262,262],lateInput:true})
 await assert.rejects(f.run(selector),/Original coordinate deadline elapsed during input dispatch/)
 assert.equal(f.inputs.filter(row=>row.type==='mousePressed').length,1);assert.equal(f.proof.operations[0].complete,false);assert.equal(f.proof.operations[0].trustedTargets.records.length,5)
})
test('trusted targets refuse fabricated, foreign-context, overflowed or incomplete event evidence',()=>{
 const expected={selector,token:'100:1',...documentBinding},records=['pointerdown','mousedown','pointerup','mouseup','click'].map(type=>({type,isTrusted:true,matchesSelector:true,at:5,x:815,y:262,target:{tag:'BUTTON'},...documentBinding,renderer:{hasFocus:true,hidden:false}})),valid={...expected,overflow:false,records}
 assertParityTrustedTarget(valid,expected)
 for(const mutate of[r=>r.records[0].isTrusted=false,r=>r.records[4].matchesSelector=false,r=>r.records[1].timeOrigin++,r=>r.records[1].url='file:///foreign/index.html',r=>r.overflow=true,r=>r.records.pop(),r=>r.records.push({...r.records[4]}),r=>r.records[3].renderer.hidden=true,r=>r.records[3].renderer.hasFocus=false]){const wrong=structuredClone(valid);mutate(wrong);assert.throws(()=>assertParityTrustedTarget(wrong,expected))}
})
