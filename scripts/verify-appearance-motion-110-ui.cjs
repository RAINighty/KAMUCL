// Exact built product in a disposable profile. Service fixtures are labeled below.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
module.exports=async({call,evaluate,main,nav,wait,screenshot,recordScreencast,version,profile,ws})=>{
 const proof={version,theme:process.env.KAMUCL_TEST_THEME,service:'Favorite artwork metadata fixtures; UI, settings storage, image rendering and WebGL are the actual product',checks:[],samples:[]}
 const save=()=>fs.writeFileSync(`out/appearance-motion-${proof.theme}-110.json`,JSON.stringify(proof,null,2))
 const ready=async(expr,label)=>{let result;for(let i=0;i<100;i++){result=await evaluate(expr);if(result)return result;await wait(100)}throw Error(label+' timed out')}
 const coordinateClick=async(selector)=>{
   // Wait for native disclosure/resize geometry, then verify the actual hit at
   // the coordinates being dispatched (not just existence of a DOM input).
   await wait(280)
   await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center'})`);await wait(280)
   const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable target');const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);if(hit!==e&&!e.contains(hit))throw Error('Coordinate hit blocked: '+JSON.stringify({x,y,width:innerWidth,height:innerHeight,hit:hit?.className,tag:hit?.tagName}));return{x,y}})()`)
   for(const type of ['mouseMoved','mousePressed','mouseReleased'])await call('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'?'none':'left',buttons:type==='mousePressed'?1:0,clickCount:type==='mouseMoved'?0:1})
 }
 try{
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
  const pose=()=>evaluate("(()=>{const e=document.querySelector('.viewer3d');return {state:e?.dataset.animationState,...JSON.parse(e?.dataset.pose||'{}'),hidden:document.hidden}})()")
  await nav('home');await ready("document.querySelector('.viewer3d')?.dataset.animationState==='walk'",'walking')
  const a=await pose();await wait(400);const b=await pose();assert(b.seconds>a.seconds);assert.notEqual(a.arm,b.arm);proof.samples.push({normal:[a,b]})
  // Starve only rAF delivery in this QA renderer, retaining timers. It verifies
  // actual draw/pose progress, then restores the unmodified browser scheduler.
  await evaluate("window.__realRaf=requestAnimationFrame;window.__realCancel=cancelAnimationFrame;window.requestAnimationFrame=()=>987654;window.cancelAnimationFrame=()=>{};true")
  await wait(300);const stalledA=await pose();await wait(400);const stalledB=await pose();assert(stalledB.seconds>stalledA.seconds);assert(stalledB.fallbacks>stalledA.fallbacks);assert.notEqual(stalledA.arm,stalledB.arm)
  await evaluate("window.requestAnimationFrame=window.__realRaf;window.cancelAnimationFrame=window.__realCancel;true")
  proof.samples.push({rafStarvation:[stalledA,stalledB]});proof.checks.push('real WebGL walk changes limbs; one-shot watchdog advances actual pose when rAF is starved')
  await coordinateClick('.brand-avatar')
  await ready("document.querySelector('.mascot-stage.ready') && !document.querySelector('.mascot-hit').disabled",'actual mascot ready')
  await ready("document.querySelector('.viewer3d')?.dataset.animationState==='walk'",'idle logo must not pause skin')
  const logoIdle=await pose();await wait(300);assert((await pose()).seconds>logoIdle.seconds)
  await coordinateClick('.mascot-hit')
  await ready("document.querySelector('.viewer3d')?.dataset.animationState==='paused'",'action temporarily yields')
  assert.equal(Math.abs((await pose()).arm),0)
  await ready("document.querySelector('.viewer3d')?.dataset.animationState==='walk'",'action ends and skin resumes')
  await coordinateClick('[aria-label="卡慕互动设置"]');await evaluate("[...document.querySelectorAll('.sound-panel button')].find(e=>e.textContent==='恢复 LOGO').click()")
  await ready("!document.querySelector('.mascot-stage')",'mascot close')
  proof.checks.push('opened idle mascot keeps skin walking; one actual click temporarily yields neutral pose and resumes after action')
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await ready("document.querySelector('.viewer3d')?.dataset.animationState==='paused'",'system reduced pose')
  const reduced=await pose();assert.equal(Math.abs(reduced.arm),0);assert.equal(Math.abs(reduced.leg),0);await wait(400);assert.equal((await pose()).seconds,reduced.seconds)
  await nav('settings');assert(await evaluate("document.body.innerText.includes('当前系统已关闭动画')"))
  await screenshot('110-system-reduced-explanation')
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await nav('home')
  await ready("document.querySelector('.viewer3d')?.dataset.animationState==='walk'",'resumed walk')
  await call('Emulation.setFocusEmulationEnabled',{enabled:false})
  await main('testElectron.BrowserWindow.getAllWindows()[0].minimize()');await ready("window.kamucl.invoke('window:visibility').then(visible=>!visible)",'native minimize visibility')
  const hidden=await pose();await wait(450);assert.equal((await pose()).seconds,hidden.seconds)
  await main('testElectron.BrowserWindow.getAllWindows()[0].restore();testElectron.BrowserWindow.getAllWindows()[0].focus()')
  await ready("window.kamucl.invoke('window:visibility')",'native restore');const restoreA=await pose();await wait(400);assert((await pose()).seconds>restoreA.seconds)
  proof.checks.push('OS reduced mode neutral stance, correct settings explanation, no hidden animation, restore resumes')
  const recording=await recordScreencast('skin-walk-110',async()=>{},1400);proof.recording=recording;save()
  // The true OS/native splash preference is checked separately without changing system settings.
  const shell=await evaluate("({surface:getComputedStyle(document.documentElement).getPropertyValue('--shell-surface'),sidebar:getComputedStyle(document.documentElement).getPropertyValue('--bg-2')})")
  if(proof.theme==='transparent'){assert(shell.surface.includes('30%'));assert(shell.sidebar.includes('26%'))}
  proof.shell=shell
  const wallpaper=path.join(profile,'appearance','backgrounds','qa-wallpaper.png')
  fs.mkdirSync(path.dirname(wallpaper),{recursive:true})
  await require('sharp')(Buffer.from('<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="#c43a9a"/><circle cx="400" cy="300" r="240" fill="#2d8bb0"/></svg>')).png().toFile(wallpaper)
  await evaluate(`window.kamucl.invoke('settings:set',{background:{mode:'image',image:${JSON.stringify(wallpaper)},opacity:.7,blur:12,fit:'crop'}})`)
  await call('Page.reload');await wait(2000)
  proof.background=await evaluate("({style:document.querySelector('.app-bg')?.getAttribute('style')})")
  assert(proof.background.style?.includes('qa-wallpaper.png'),'validated managed wallpaper is actually present')
  await screenshot('110-wallpaper-glass-home')
  await nav('settings');await evaluate("document.querySelector('[data-section=thumbnail]').open=true")
  await coordinateClick('[aria-label="随机播放启动卡图片"]')
  const thumbnail=await evaluate("window.kamucl.invoke('settings:get').then(s=>s.launchThumbnail)");assert.equal(thumbnail.randomPlayback,true)
  const order=thumbnail.order;assert(order.length>=7)
  await screenshot('110-random-playback-controls');await nav('home')
  await evaluate("window.kamucl.invoke('settings:set',{launchThumbnail:{intervalSeconds:1}})");await call('Page.reload');await wait(2000)
  const paths=[];for(let i=0;i<9;i++){const src=await evaluate("document.querySelector('.hero-image.active')?.getAttribute('src')");assert(src,'actual active carousel image');paths.push(src);await wait(1050)}
  assert(new Set(paths).size>=3,'enabled random carousel actually changes pictures')
  proof.carouselObserved=paths
  assert.equal((await evaluate("window.kamucl.invoke('settings:get').then(s=>s.launchThumbnail.randomPlayback)")),true)
  assert.deepEqual((await evaluate("window.kamucl.invoke('settings:get').then(s=>s.launchThumbnail.order)")),order)
  proof.checks.push('trusted coordinate random-playback toggle persists across reload without changing saved ordering')
  // Actual favorite storage; old record backfill uses a service fixture. Serve
  // Intercept only the fixture artwork URL: actual Chromium image decode,
  // no live CDN availability is implied by this fixture verification.
  const iconUrl='https://artwork.example.test/fixture.png'
  const artwork=fs.readFileSync(wallpaper).toString('base64')
  const intercept=async e=>{const msg=JSON.parse(e.data);if(msg.method==='Fetch.requestPaused')await call('Fetch.fulfillRequest',{requestId:msg.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'}],body:artwork})}
  ws.addEventListener('message',intercept);await call('Fetch.enable',{patterns:[{urlPattern:iconUrl}]})
  await main(`(()=>{const fs=process.mainModule.require('fs'),p=process.mainModule.require('path');fs.writeFileSync(p.join(testElectron.app.getPath('userData'),'mod-favorites.json'),JSON.stringify([{key:'modrinth:old',source:'modrinth',projectId:'old',name:'Old favorite',added:1},{key:'curseforge:123',source:'curseforge',projectId:'123',name:'New favorite',iconUrl:${JSON.stringify(iconUrl)},added:2}]));testElectron.ipcMain.removeHandler('community:project');testElectron.ipcMain.handle('community:project',(_e,source,projectId)=>({kind:'mod',source,projectId,title:'Artwork fixture',iconUrl:${JSON.stringify(iconUrl)},categories:[]}));return true})()`)
  await nav('community');await evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.includes('已收藏 MOD')).click()")
  await ready("document.querySelectorAll('.favorite-icon img').length===2",'favorite artwork')
  await ready("[...document.querySelectorAll('.favorite-icon img')].every(e=>e.complete&&e.naturalWidth>0)",'fixture images decoded')
  assert.equal(await evaluate("document.querySelectorAll('.favorite-monogram').length"),0)
  await screenshot('110-favorite-project-icons');proof.checks.push('new and old favorites show decoded MOD artwork, never initials')
  await call('Fetch.disable');ws.removeEventListener('message',intercept)
  proof.layout=[]
  for(const [width,height,zoom] of [[960,620,1],[1280,900,1.25]]){
    await main(`testElectron.BrowserWindow.getAllWindows()[0].setSize(${width},${height});testElectron.BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(${zoom})`)
    await nav('settings');await evaluate("document.querySelector('[data-section=thumbnail]').open=true")
    await coordinateClick('[aria-label="随机播放启动卡图片"]')
    await ready("window.kamucl.invoke('settings:get').then(s=>s.launchThumbnail.randomPlayback===false)",'coordinate toggle off')
    for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key:' ',code:'Space',windowsVirtualKeyCode:32})
    await ready("window.kamucl.invoke('settings:get').then(s=>s.launchThumbnail.randomPlayback===true)",'keyboard checkbox toggle on')
    const layout=await evaluate("(()=>{const e=document.querySelector('[aria-label=\"随机播放启动卡图片\"]'),r=e.getBoundingClientRect();return{width:innerWidth,height:innerHeight,left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()")
    assert(layout.left>=0&&layout.right<=layout.width&&layout.top>=0&&layout.bottom<=layout.height)
    proof.layout.push({width,height,zoom,...layout});await screenshot(`110-random-keyboard-${width}-${zoom}`)
  }
  proof.checks.push('minimum window and 125% zoom: real coordinate checkbox and native Space toggle retain state and remain visible')
  proof.complete=true;save();console.log('PASS 1.1.10 appearance/motion '+proof.theme)
 }catch(error){proof.complete=false;proof.error=String(error);save();throw error}
}
