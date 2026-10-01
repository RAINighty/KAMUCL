const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
module.exports=async function verifyMascotHeader(h){
 const {call,evaluate,main,click,nav,screenshot,wait,profile,version}=h
 const proof={version,checks:[],layouts:[],audio:{},hardwareListening:'not performed'}
 // Hosted macOS runners can enable reduced motion globally. Exercise normal
 // walking/recoil explicitly before the independent reduced-motion regression.
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
 await nav('skins')
 await evaluate(`(()=>{
  window.__mascotSoundProof={events:[],peakVoices:0,active:0,closed:0,contexts:[],audioLifecycleCalls:[],audioStateTransitions:[],recorders:[],recording:[],draws:0,glReleased:0};const proof=window.__mascotSoundProof;
  const getContext=HTMLCanvasElement.prototype.getContext,draw=WebGL2RenderingContext.prototype.drawElements;
  HTMLCanvasElement.prototype.getContext=function(type,...args){const context=getContext.call(this,type,...args);if(type==='webgl2'&&context&&!context.__mascotTracked){context.__mascotTracked=true;const originalExtension=context.getExtension.bind(context);context.getExtension=function(name){const extension=originalExtension(name);if(name==='WEBGL_lose_context'&&extension&&!extension.__mascotTracked){extension.__mascotTracked=true;const lose=extension.loseContext.bind(extension);extension.loseContext=()=>{proof.glReleased++;lose()}}return extension}}return context};
  WebGL2RenderingContext.prototype.drawElements=function(...args){if(this.__mascotTracked)proof.draws++;return draw.apply(this,args)};
  const Original=window.AudioContext,start=AudioBufferSourceNode.prototype.start,connect=AudioNode.prototype.connect,close=Original.prototype.close,resume=Original.prototype.resume,suspend=Original.prototype.suspend;window.__mascotOriginalAudioContext=Original;window.__mascotHooks={Original,start,connect,close,resume,suspend,getContext,draw};
  const audioState=context=>({context:proof.contexts.indexOf(context),state:context.state,time:context.currentTime,wallTime:performance.now(),documentHidden:document.hidden,stageHidden:document.querySelector('.mascot-stage')?.classList.contains('hidden')??null});
  window.AudioContext=new Proxy(Original,{construct(target,args){const context=new target(...args);proof.contexts.push(context);context.addEventListener('statechange',()=>proof.audioStateTransitions.push(audioState(context)));context.__mascotTap=context.createMediaStreamDestination();const recorder=new MediaRecorder(context.__mascotTap.stream,{mimeType:'audio/webm;codecs=opus'}),chunks=[];recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data)};recorder.__chunks=chunks;proof.recorders.push(recorder);recorder.start();return context}});
  Original.prototype.resume=function(){if(this.__mascotTap)proof.audioLifecycleCalls.push({method:'resume',...audioState(this),stack:new Error().stack?.slice(0,650)});return resume.call(this)};
  Original.prototype.suspend=function(){if(this.__mascotTap)proof.audioLifecycleCalls.push({method:'suspend',...audioState(this),stack:new Error().stack?.slice(0,650)});return suspend.call(this)};
  AudioNode.prototype.connect=function(destination,...rest){if(this.context.__mascotTap&&destination===this.context.destination)connect.call(this,this.context.__mascotTap);return connect.call(this,destination,...rest)};
  AudioBufferSourceNode.prototype.start=function(...args){if(this.context.__mascotTap&&this.buffer){const samples=this.buffer.getChannelData(0);let peak=0,power=0;for(const value of samples){peak=Math.max(peak,Math.abs(value));power+=value*value}proof.events.push({when:args[0]||0,time:this.context.currentTime,duration:this.buffer.duration,peak,rms:Math.sqrt(power/samples.length),rate:this.playbackRate.value});if(!proof.samples)proof.samples={sampleRate:this.buffer.sampleRate,values:Array.from(samples)};proof.active++;proof.peakVoices=Math.max(proof.peakVoices,proof.active);this.addEventListener('ended',()=>proof.active--,{once:true})}return start.apply(this,args)};
  Original.prototype.close=function(){if(this.__mascotTap)proof.closed++;return close.call(this)};
 })()`)
 const trustedClick=async selector=>{const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:r.x,y:r.y});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:r.x,y:r.y})}
 await trustedClick('[aria-label="打开七人互动彩蛋"]');await wait(850)
 assert.equal(await evaluate('document.querySelectorAll(".mascot-hit").length'),7)
 assert.equal(await evaluate('!!document.querySelector(".topbar .mascot-stage canvas")'),true)
 assert.equal(await evaluate('!!document.querySelector(".mascot-mask")'),false)
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".topbar")).height'),'72px')
 proof.motion={normal:await evaluate(`({systemReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,stageReduced:document.querySelector('.mascot-stage').classList.contains('reduced'),draws:window.__mascotSoundProof.draws})`)};assert.equal(proof.motion.normal.systemReduced,false);assert.equal(proof.motion.normal.stageReduced,false)
 const before=await evaluate("window.kamucl.invoke('mascots:state')")
 const geometry=await evaluate(`(()=>{const host=document.querySelector('.figure-strip').getBoundingClientRect(),r=[...document.querySelectorAll('.mascot-hit')].map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.hit,left:r.left,right:r.right,y:r.y+r.height/2}}).sort((a,b)=>a.left-b.left);return{left:host.left+1,right:host.right-1,y:r[0].y,ids:r.map(r=>r.id)}})()`)
 const move=async(x,y)=>call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'none',x,y})
 await move(geometry.left,geometry.y);await move(geometry.right,geometry.y);await wait(50)
 const first=await evaluate('window.__mascotSoundProof.events.length');assert.equal(first,7,'one sparse sweep must start seven real sample sources')
 assert.equal(await evaluate('document.querySelectorAll(".slap-burst").length'),7,'seven independent visual feedback nodes')
 await move(geometry.left,geometry.y);await wait(50);assert.equal(await evaluate('window.__mascotSoundProof.events.length'),14,'reverse sweep during recoil must stay responsive')
 await wait(600)
 let state=await evaluate("window.kamucl.invoke('mascots:state')")
 for(const id of geometry.ids)assert.equal(state.counts[id],(before.counts[id]||0)+2,id+' two full sweeps')
 const stationary={...state.counts};await wait(650);state=await evaluate("window.kamucl.invoke('mascots:state')");assert.deepEqual(state.counts,stationary)
 proof.checks.push('single-event seven hits, reverse sweep during recoil, simultaneous visual feedback, stationary hold')
 await evaluate('document.querySelector("[data-hit=qiqi]").focus()')
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});await wait(700)
 assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).counts.qiqi,stationary.qiqi+1)
 assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).order[0],'qiqi')
 const afterKeyboard=await evaluate("window.kamucl.invoke('mascots:state')");await wait(500);assert.deepEqual((await evaluate("window.kamucl.invoke('mascots:state')")).counts,afterKeyboard.counts)
 proof.checks.push('keyboard equivalence, delayed stable sorting, no stationary reorder counts')
 await screenshot('extension-117-mascot-header')
 for(const [w,hh,zoom] of [[960,620,1],[980,720,1.5],[1360,860,1]]){
  await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.setSize(${w},${hh});w.webContents.setZoomFactor(${zoom});w.show();w.focus();testElectron.app.focus({steal:true});return true})()`);await call('Page.bringToFront')
  let layout,stable=0,previous='',samples=[]
  for(let i=0;i<50;i++){
   await wait(80)
   const native=await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));return{isVisible:w.isVisible(),isMinimized:w.isMinimized(),focused:w.isFocused(),bounds:w.getBounds(),contentBounds:w.getContentBounds(),zoom:w.webContents.getZoomFactor(),backgroundThrottling:w.webContents.getBackgroundThrottling()}})()`)
   // All DOM rectangles and the rendered model bounds come from one evaluation;
   // never mix a stale hit-area snapshot with a later resized WebGL frame.
   layout=await evaluate(`(()=>{const host=document.querySelector('.mascot-stage'),bar=document.querySelector('.topbar').getBoundingClientRect(),stage=host.getBoundingClientRect(),stripElement=document.querySelector('.figure-strip'),strip=stripElement.getBoundingClientRect(),canvas=stripElement.querySelector('canvas'),canvasRect=canvas.getBoundingClientRect(),buttons=[...document.querySelectorAll('.mascot-hit')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{id:e.dataset.hit,x:r.x,y:r.y,width:r.width,height:r.height,leftStyle:e.style.left,topStyle:e.style.top,visible:s.visibility==='visible'&&r.width>0&&r.height>0}}),controls=[...document.querySelectorAll('.top-actions button,.top-back')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label')||e.title||e.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom}});return{viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height},documentHidden:document.hidden,visibilityState:document.visibilityState,stageHidden:host.classList.contains('hidden'),draws:window.__mascotSoundProof.draws,bar:{left:bar.left,right:bar.right,top:bar.top,bottom:bar.bottom,height:bar.height},stage:{left:stage.left,right:stage.right,top:stage.top,bottom:stage.bottom},strip:{left:strip.left,right:strip.right,top:strip.top,bottom:strip.bottom,clientWidth:stripElement.clientWidth,clientHeight:stripElement.clientHeight},canvas:{left:canvasRect.left,right:canvasRect.right,top:canvasRect.top,bottom:canvasRect.bottom,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,width:canvas.width,height:canvas.height},modelBounds:host.dataset.modelBounds?JSON.parse(host.dataset.modelBounds):null,buttons,controls}})()`)
   layout={width:w,height:hh,zoom,native,...layout};const b=layout.modelBounds
   const matched=native.isVisible&&!native.isMinimized&&!layout.stageHidden&&Math.abs(layout.viewport.width-native.contentBounds.width/native.zoom)<2&&Math.abs(layout.viewport.height-native.contentBounds.height/native.zoom)<2&&b?.models.length===7&&b.width===layout.strip.clientWidth&&b.height===layout.strip.clientHeight-12&&layout.canvas.clientWidth===b.width&&layout.canvas.clientHeight===b.height
   const signature=JSON.stringify({viewport:layout.viewport,bar:layout.bar,strip:layout.strip,canvas:layout.canvas,buttons:layout.buttons,modelBounds:b,nativeBounds:native.bounds})
   stable=matched&&signature===previous?stable+1:0;previous=signature;samples.push({sample:i,matched,stable,native,viewport:layout.viewport,documentHidden:layout.documentHidden,stageHidden:layout.stageHidden,strip:layout.strip,canvas:layout.canvas,modelBoundsSize:b?{width:b.width,height:b.height}:null,draws:layout.draws})
   fs.writeFileSync('out/mascot-header-layout-live.json',JSON.stringify({...layout,readinessSamples:samples},null,2))
   if(stable>=1)break
  }
  layout.readinessSamples=samples;await screenshot('extension-117-mascot-'+w+'-'+zoom)
  try{
   assert(stable>=1,'resize/zoom must reach a visible, stable viewport and matching rendered canvas/model bounds')
   assert([68,72].includes(layout.bar.height),'preserve the existing 68/72px responsive header height');assert.equal(layout.buttons.length,7)
   const bounds=layout.modelBounds;assert.equal(bounds.models.length,7);for(const model of bounds.models){assert(model.top>=2,model.id+' full head has at least 2px canvas margin');assert(model.bottom<=bounds.height,model.id+' full feet remain inside canvas');assert(model.left>=0&&model.right<=bounds.width,model.id+' full model stays inside canvas')}
   layout.models=bounds.models
   for(const b of layout.buttons){assert(b.visible&&b.width>=10&&b.height>=10,b.id+' visible hip button');assert(b.x>=layout.strip.left-1&&b.x+b.width<=layout.strip.right+1,b.id+' stays in single header row');assert(b.y>=layout.bar.top&&b.y+b.height<=layout.bar.bottom,b.id+' stays in header height');for(const c of layout.controls)assert(!(b.x<c.right&&b.x+b.width>c.left&&b.y<c.bottom&&b.y+b.height>c.top),b.id+' avoids window/action controls')}
  }catch(error){console.error('Mascot header layout diagnostics',JSON.stringify(layout,null,2));throw error}
  proof.layouts.push(layout)
 }
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(450)
 assert.equal(await evaluate('document.querySelector(".mascot-stage").classList.contains("reduced")'),true)
 proof.motion.reduced=await evaluate(`({systemReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,stageReduced:document.querySelector('.mascot-stage').classList.contains('reduced'),draws:window.__mascotSoundProof.draws})`);assert.equal(proof.motion.reduced.systemReduced,true)
 const reducedDraws=await evaluate('window.__mascotSoundProof.draws');await wait(200);assert.equal(await evaluate('window.__mascotSoundProof.draws'),reducedDraws,'reduced-motion idle releases the RAF loop')
 const reducedCounts=await evaluate("window.kamucl.invoke('mascots:state')");await click('[data-hit=q3]');await wait(200);assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).counts.q3,reducedCounts.counts.q3+1,'reduced motion remains interactive')
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await wait(250)
 proof.motion.restored=await evaluate(`({systemReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,stageReduced:document.querySelector('.mascot-stage').classList.contains('reduced'),draws:window.__mascotSoundProof.draws})`);assert.equal(proof.motion.restored.systemReduced,false);assert.equal(proof.motion.restored.stageReduced,false)
 const visibilitySnapshot=async()=>{
  const native=await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));return{isVisible:w.isVisible(),isMinimized:w.isMinimized(),backgroundThrottling:w.webContents.getBackgroundThrottling(),electron:process.versions.electron,platform:process.platform}})()`)
  const renderer=await evaluate(`({documentHidden:document.hidden,visibilityState:document.visibilityState,stageHidden:document.querySelector('.mascot-stage').classList.contains('hidden'),draws:window.__mascotSoundProof.draws,activeSources:window.__mascotSoundProof.active,audioStates:window.__mascotSoundProof.contexts.map(context=>context.state)})`)
  renderer.nativeVisibility=await evaluate("window.kamucl.invoke('window:visibility')");return{native,renderer}
 }
 // Page Visibility can remain "visible" under Electron/macOS CDP focus and
 // background flags. Never spoof it: verify the real native hide event through
 // the controlled IPC bridge and then inspect actual WebGL/audio work.
 proof.lifecycle={sources:{native:'BrowserWindow.isVisible/isMinimized in the main process',nativeVisibility:'controlled window:visibility IPC query and hide/show broadcast consumed by useMotion',page:'unmodified document.hidden/document.visibilityState',stage:'useMotion pageHidden || nativeHidden',rendering:'intercepted actual WebGL2 drawElements',audio:'actual owned AudioContext.state'},before:await visibilitySnapshot(),hiddenSamples:[]}
 await call('Emulation.setFocusEmulationEnabled',{enabled:false});await main(`testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html')).hide()`)
 for(let i=0;i<30;i++){await wait(50);const snapshot=await visibilitySnapshot();proof.lifecycle.hiddenSamples.push(snapshot);if(!snapshot.native.isVisible&&snapshot.renderer.stageHidden&&snapshot.renderer.audioStates.every(state=>state==='suspended'))break}
 proof.lifecycle.hidden=proof.lifecycle.hiddenSamples.at(-1);fs.writeFileSync('out/mascot-header-visibility-live.json',JSON.stringify(proof.lifecycle,null,2))
 assert.equal(proof.lifecycle.hidden.native.isVisible,false,'the main BrowserWindow is genuinely hidden');assert.equal(proof.lifecycle.hidden.renderer.nativeVisibility,false,'trusted native visibility IPC reports hidden');assert.equal(proof.lifecycle.hidden.renderer.stageHidden,true,'native hide reaches the stage lifecycle even when Page Visibility lags');assert(proof.lifecycle.hidden.renderer.audioStates.length>0&&proof.lifecycle.hidden.renderer.audioStates.every(state=>state==='suspended'),'hidden stage suspends its actual owned AudioContext')
 const hiddenDraws=proof.lifecycle.hidden.renderer.draws;await wait(220);proof.lifecycle.hiddenSettled=await visibilitySnapshot();proof.lifecycle.audioLifecycleCalls=await evaluate('window.__mascotSoundProof.audioLifecycleCalls');proof.lifecycle.audioStateTransitions=await evaluate('window.__mascotSoundProof.audioStateTransitions');fs.writeFileSync('out/mascot-header-visibility-live.json',JSON.stringify(proof.lifecycle,null,2));assert.equal(proof.lifecycle.hiddenSettled.renderer.draws,hiddenDraws,'hidden stage performs no draw calls');assert.equal(proof.lifecycle.hiddenSettled.renderer.activeSources,0,'hidden stage leaves no live sound sources');assert(proof.lifecycle.hiddenSettled.renderer.audioStates.every(state=>state==='suspended'),'hidden audio remains suspended after delayed resume or browser state changes')
 await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));w.show();w.focus()})()`);await call('Emulation.setFocusEmulationEnabled',{enabled:true});await wait(300)
 proof.lifecycle.restored=await visibilitySnapshot();fs.writeFileSync('out/mascot-header-visibility-live.json',JSON.stringify(proof.lifecycle,null,2));assert.equal(proof.lifecycle.restored.native.isVisible,true);assert.equal(proof.lifecycle.restored.renderer.nativeVisibility,true);assert.equal(proof.lifecycle.restored.renderer.stageHidden,false);assert(proof.lifecycle.restored.renderer.draws>hiddenDraws,'foreground resumes actual WebGL draws');assert(proof.lifecycle.restored.renderer.audioStates.every(state=>state==='running'),'foreground resumes the owned AudioContext')
 proof.checks.push('real native hide via controlled IPC pauses actual rendering and audio, raw Page Visibility recorded, foreground resumes, reduced-motion idle pauses and remains interactive')
 const voices=await evaluate('window.__mascotSoundProof.peakVoices');assert(voices>=7,'sources must overlap without cutting off the preceding slap')
 const events=await evaluate('window.__mascotSoundProof.events');assert(events.every(e=>e.peak>0&&e.peak<1&&e.rms>0))
 assert(events.slice(0,7).every((e,i,a)=>i===0||e.when>a[i-1].when),'one skipped-event sweep is scheduled as a short roll')
 proof.audio={sourcesStarted:events.length,maxLiveSources:voices,events,waveform:'actual AudioBufferSourceNode buffer captured',hardwareListening:'not performed'}
 const sample=await evaluate('window.__mascotSoundProof.samples'),wav=Buffer.alloc(44+sample.values.length*2)
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sample.sampleRate,24);wav.writeUInt32LE(sample.sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(sample.values.length*2,40);sample.values.forEach((v,i)=>wav.writeInt16LE(Math.round(v*32767),44+i*2));fs.writeFileSync('out/mascot-slap-117.wav',wav)
 await click('[aria-label="互动设置"]');await evaluate("(()=>{const input=document.querySelector('[aria-label=\"拍打音效音量\"]');input.value='32';input.dispatchEvent(new Event('input',{bubbles:true}))})()");await click('[aria-label="静音拍打音效"]');await wait(180)
 const soundBefore=await evaluate('window.__mascotSoundProof.events.length');await click('[data-hit=q3]');await wait(200);assert.equal(await evaluate('window.__mascotSoundProof.events.length'),soundBefore,'mute affects actual sources')
 await click('[aria-label="关闭七人互动"]');await wait(100)
 assert.equal(await evaluate('!!document.querySelector(".mascot-stage")'),false);assert.equal(await evaluate('window.__mascotSoundProof.closed'),1,'closing must release the owned AudioContext')
 assert.equal(await evaluate('window.__mascotSoundProof.glReleased'),1,'closing actually loses the owned WebGL context')
 const persisted=JSON.parse(fs.readFileSync(path.join(profile,'mascot-counts.json'),'utf8'));assert.deepEqual(persisted.sound,{muted:true,volume:.32})
 const closeCount=persisted.counts.q3
 assert.equal(await evaluate('document.activeElement.classList.contains("brand-avatar")'),true,'close restores LOGO keyboard focus')
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});await wait(700)
 const focusedId=await evaluate('document.activeElement.dataset.hit');assert(focusedId,'keyboard LOGO activation focuses the first ready Minecraft hip')
 assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).counts.q3,closeCount)
 assert.equal(await evaluate('document.querySelector(".stage-tools button").getAttribute("aria-pressed")'),'true')
 const repeatBefore=await evaluate("window.kamucl.invoke('mascots:state')");await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',autoRepeat:true});await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',autoRepeat:true});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});await wait(200);assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).counts[focusedId],repeatBefore.counts[focusedId]+1,'held keyboard Space is one slap')
 const beforeEscape=await evaluate("window.kamucl.invoke('mascots:state')")
 await click('[data-hit=q3]');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await wait(100);assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'mascot-counts.json'),'utf8')).counts.q3,beforeEscape.counts.q3+1,'Escape immediately flushes the last hit');assert.equal(await evaluate('document.activeElement.classList.contains("brand-avatar")'),true)
 proof.checks.push('sound/volume persisted, mute, close flush, reopen counts, owned audio context released')
 proof.checks.push('real keyboard LOGO activation, focus entry/restore, Space repeat suppressed, full model corner bounds')
 await main(`(()=>{globalThis.originalMascotBatch=testElectron.ipcMain._invokeHandlers.get('mascots:batch');globalThis.dropMascotAck=true;testElectron.ipcMain.removeHandler('mascots:batch');testElectron.ipcMain.handle('mascots:batch',async(event,value)=>{const result=await originalMascotBatch(event,value);if(dropMascotAck){dropMascotAck=false;throw Error('isolated fixture: committed batch acknowledgement lost')}return result});globalThis.mascotPendingTrace=[];testElectron.ipcMain.on('window:mascotPending',(_event,value)=>mascotPendingTrace.push(value))})()`)
 await trustedClick('[aria-label="打开七人互动彩蛋"]');await wait(650)
 const beforeLostAck=await evaluate("window.kamucl.invoke('mascots:state')");await click('[data-hit=q3]');await click('[aria-label="关闭七人互动"]');await wait(150)
 assert.equal(await evaluate('!!document.querySelector(".mascot-stage")'),true,'unknown save acknowledgement keeps the stage open')
 assert.equal(await main('mascotPendingTrace[mascotPendingTrace.length-1]'),true,'failed flush never falsely clears close protection')
 await wait(900);assert.equal((await evaluate("window.kamucl.invoke('mascots:state')")).counts.q3,beforeLostAck.counts.q3+1,'retry after a committed but lost response does not double count')
 await click('[aria-label="关闭七人互动"]');await wait(100);assert.equal(await evaluate('!!document.querySelector(".mascot-stage")'),false);assert.equal(await main('mascotPendingTrace[mascotPendingTrace.length-1]'),false)
 await main(`testElectron.ipcMain.removeHandler('mascots:batch');testElectron.ipcMain.handle('mascots:batch',originalMascotBatch)`)
 proof.checks.push('committed-but-lost acknowledgement retries without duplicates, failed close preserves pending protection')
 const batch={batchId:'gui-117-idempotent-proof',hits:['q3','milo']},beforeBatch=await evaluate("window.kamucl.invoke('mascots:state')")
 await evaluate(`window.kamucl.invoke('mascots:batch',${JSON.stringify(batch)})`);await evaluate(`window.kamucl.invoke('mascots:batch',${JSON.stringify(batch)})`)
 const afterBatch=await evaluate("window.kamucl.invoke('mascots:state')");assert.equal(afterBatch.counts.q3,beforeBatch.counts.q3+1)
 const rejected=await evaluate(`window.kamucl.invoke('mascots:batch',{batchId:'gui-117-idempotent-proof',hits:['qiqi']}).then(()=>false,()=>true)`);assert.equal(rejected,true)
 proof.checks.push('real main IPC retry idempotence and changed-batch rejection')
 const recording=await evaluate(`(async()=>{const proof=window.__mascotSoundProof,all=[];for(const recorder of proof.recorders){if(recorder.state!=='inactive')await new Promise(resolve=>{recorder.addEventListener('stop',resolve,{once:true});recorder.stop()});if(recorder.__chunks.length){const blob=new Blob(recorder.__chunks,{type:'audio/webm'});all.push(Array.from(new Uint8Array(await blob.arrayBuffer())))}}if(all[0]){const decoder=new window.__mascotOriginalAudioContext(),decoded=await decoder.decodeAudioData(new Uint8Array(all[0]).buffer);let peak=0,power=0;for(let c=0;c<decoded.numberOfChannels;c++)for(const value of decoded.getChannelData(c)){peak=Math.max(peak,Math.abs(value));power+=value*value}proof.output={peak,rms:Math.sqrt(power/(decoded.length*decoded.numberOfChannels)),samples:decoded.length,sampleRate:decoded.sampleRate};await decoder.close()}return all})()`)
   if(recording[0]){fs.writeFileSync('out/mascot-sweep-117.webm',Buffer.from(recording[0]));proof.audio.recording='only the stage compressor output, no microphone or system capture';proof.audio.output=await evaluate('window.__mascotSoundProof.output');assert(proof.audio.output.peak>0&&proof.audio.output.peak<.999,'actual recorded mixer output is nonzero and unclipped')}
 proof.audio.lifecycleCalls=await evaluate('window.__mascotSoundProof.audioLifecycleCalls');proof.audio.stateTransitions=await evaluate('window.__mascotSoundProof.audioStateTransitions');proof.finalState=afterBatch;fs.writeFileSync('out/mascot-header-ui-'+(process.env.KAMUCL_TEST_THEME||'black-orange')+'.json',JSON.stringify(proof,null,2));console.log('1.1.7 Minecraft header mascot GUI checks passed')
 await evaluate('(()=>{const h=window.__mascotHooks;window.AudioContext=h.Original;AudioBufferSourceNode.prototype.start=h.start;AudioNode.prototype.connect=h.connect;h.Original.prototype.close=h.close;h.Original.prototype.resume=h.resume;h.Original.prototype.suspend=h.suspend;HTMLCanvasElement.prototype.getContext=h.getContext;WebGL2RenderingContext.prototype.drawElements=h.draw})()')
 await nav('home')
 await call('Emulation.setEmulatedMedia',{features:[]})
}
