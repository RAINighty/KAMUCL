const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const runTrace=require('../scripts/native-compositor-trace-119.cjs')
const runModule=require('../scripts/verify-kamu-native-trace-119.cjs')
function fixture(t,fail={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kamu-native-trace-test-'))
 t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert(path.basename(dir).startsWith('kamu-native-trace-test-'));fs.rmSync(dir,{recursive:true,force:true})})
 const calls=[];let listener,marker
 const transport={subscribe(fn){listener=fn;return()=>calls.push('unsubscribe')},close(){calls.push('close')},async call(method){calls.push(method);if(method==='Tracing.start'&&fail.start)throw Error('another trace active');if(method==='Tracing.end'){if(!fail.noComplete)listener('Tracing.tracingComplete',{stream:'owned-stream'});if(fail.end)throw Error('end ack lost')}if(method==='IO.read'){if(fail.read)throw Error('stream read failed');return{eof:true,data:JSON.stringify({traceEvents:[{name:marker.name,cat:'blink.user_timing',ph:'R',pid:1,tid:2,ts:100000},{name:'Paint',cat:'devtools.timeline',ph:'X',pid:1,tid:2,ts:110000,dur:5000,args:{data:{clip:[0,0,48,72],url:'https://secret.invalid',value:'typed secret'}}}]})}}return{}}}
 const nativeWindow={id:1,isDestroyed:()=>false,isVisible:()=>true,isMinimized:()=>false,isFocused:()=>true,getBounds:()=>({x:0,y:0,width:1280,height:900}),webContents:{id:2,getURL:()=> 'file:///app/out/renderer/index.html',getBackgroundThrottling:()=>{calls.push('read-background-throttling');return true}}}
 const electron={BrowserWindow:{getAllWindows:()=>[nativeWindow]},app:{isHidden:()=>false}}
 const h={version:'1.1.9',main:async code=>code==='process.platform'?'darwin':new Function('testElectron','return '+code)(electron),evaluate:async code=>{if(code.startsWith('performance.clearMarks')){calls.push('clear-marker');return}if(code.startsWith('({now:'))return{now:50,timeOrigin:1000,hidden:false,focused:true};const name=JSON.parse(code.match(/performance\.mark\(("[^"]+")\)/)[1]);marker={name,startTime:50,timeOrigin:1000};return marker}}
 return{h,transport,calls,base:path.join(dir,'diagnostic'),options:{enabled:true,separateRun:true,transport,outputBase:path.join(dir,'diagnostic'),completionTimeoutMs:5}}
}
test('tracing remains opt-in and refuses normal acceptance registration',async()=>{
 let invoked=false;const result=await runTrace({},async()=>{invoked=true},{enabled:false});assert.equal(result.enabled,false);assert.equal(invoked,false)
 await assert.rejects(runTrace({},async()=>{}, {enabled:true}),/separate diagnostic/)
})
test('original action failure survives while tracing ends, drains and closes its stream',async t=>{
 const f=fixture(t),original=Error('actual click failed');await assert.rejects(runTrace(f.h,async()=>{throw original},f.options),e=>e===original)
 for(const action of ['Tracing.end','IO.read','IO.close','clear-marker','unsubscribe','close'])assert(f.calls.includes(action),action)
 const proof=JSON.parse(fs.readFileSync(f.base+'.json'));assert.equal(proof.complete,false);assert.equal(proof.cleanup.drained,true)
 const events=fs.readFileSync(f.base+'-events.json','utf8');assert(!events.includes('secret'));assert(events.includes('clip'));assert.equal(proof.clock.valid,true)
})
test('IO read failure still closes the returned handle and disconnects',async t=>{
 const f=fixture(t,{read:true});await assert.rejects(runTrace(f.h,async()=>{},f.options),/stream read failed/)
 assert(f.calls.includes('IO.close'));assert(f.calls.includes('close'));const p=JSON.parse(fs.readFileSync(f.base+'.json'));assert.equal(p.complete,false);assert.equal(p.cleanup.streamClosed,true)
})
test('end acknowledgement failure still drains a received completion; missing completion is bounded',async t=>{
 const f=fixture(t,{end:true});await assert.rejects(runTrace(f.h,async()=>{},f.options),/end ack lost/);assert(f.calls.includes('IO.read'));assert(f.calls.includes('IO.close'));assert(f.calls.includes('close'))
 const g=fixture(t,{noComplete:true});await assert.rejects(runTrace(g.h,async()=>{},g.options),/tracingComplete timed out/);assert(g.calls.includes('close'));assert(!g.calls.includes('IO.read'))
})
test('rejected start never ends an unowned active tracing session',async t=>{
 const f=fixture(t,{start:true});let action=false;await assert.rejects(runTrace(f.h,async()=>{action=true},f.options),/another trace active/)
 assert.equal(action,false);assert(!f.calls.includes('Tracing.end'));assert(f.calls.includes('close'))
})
test('privacy removes arbitrary marks and strings; missing trace clock stays unknown',()=>{
 const events=runTrace.redactEvents([{name:'Paint typed private text',cat:'blink.user_timing',ph:'R',ts:10},{name:'Paint',cat:'devtools.timeline',ph:'X',ts:20,dur:60000,pid:1,tid:2,args:{value:'password',data:{url:'private',clip:[1,2,3,4],nodeId:5}}}], 'owned-marker')
 assert.equal(events.length,1);assert.deepEqual(events[0].args,{data:{clip:[1,2,3,4],nodeId:5}})
 const summary=runTrace.summarize(events,{name:'owned-marker',timeOrigin:0,startTime:0});assert.equal(summary.clock.valid,false);assert.equal(summary.longEvents[0].performanceStartMs,null);assert.equal(summary.longEvents[0].durationMs,60)
})
test('native-trace registration selects a separate Darwin cold diagnostic and preserves capture parameters',async()=>{
 const calls=[],proofs=[],recording={fps:18,frames:[{timestamp:1},{timestamp:1.1}]},h={version:'1.1.9',main:async()=> 'darwin',evaluate:async()=>({samples:[]}),recordScreencast:async(name,action,duration)=>{calls.push({name,duration});await action();return recording}}
 const result=await runModule(h,{trace:async(same,action,options)=>{assert.equal(same,h);assert.deepEqual(options,{enabled:true,separateRun:true});return action({observe:async label=>calls.push(label)})},motion:async ctx=>{assert.equal(ctx.motionDiagnosticInvocation,'native-trace');await ctx.nativeTraceObserve('ready');return ctx.recordScreencast('original-name',async()=>{calls.push('action')},250)},writeProof:(name,value)=>proofs.push({name,value})})
 assert.equal(result,recording);assert.deepEqual(calls,['ready',{name:'original-name',duration:250},'action']);assert.equal(proofs.length,1)
 let invoked=false;await assert.rejects(runModule({...h,main:async()=> 'win32'},{trace:async()=>{invoked=true}}),/Darwin/);assert.equal(invoked,false)
})
test('native-trace registration flushes failed action frames and retains the original failure',async()=>{
 const original=Error('trusted action failed'),calls=[],proofs=[],h={version:'1.1.9',main:async()=> 'darwin',evaluate:async()=>({samples:[{at:1}]}),recordScreencast:async(name,action,duration)=>{await action();calls.push('flushed');return{frames:[{timestamp:1}],duration}}}
 await assert.rejects(runModule(h,{trace:async(same,action)=>action({observe:async()=>{}}),motion:async ctx=>ctx.recordScreencast('failed',async()=>{throw original},250),writeProof:(name,value)=>proofs.push({name,value})}),e=>e===original)
 assert.deepEqual(calls,['flushed']);assert.equal(proofs.length,2);assert.equal(proofs[0].value.recording.duration,250);assert.equal(proofs[1].value.samples[0].at,1)
})
