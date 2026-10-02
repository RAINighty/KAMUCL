// Real coordinate interaction in the isolated Electron harness; no production account request.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp')
module.exports=async({call,evaluate,main,nav,wait,root,screenshot,version})=>{
  const theme=process.env.KAMUCL_TEST_THEME||'black-orange', proof={version,theme,complete:false,layouts:[],occlusions:[],nativeBusy:false,queuedCancellation:false,uploadBusy:false},output=path.join(root,'skin-editor-118.png')
  const persist=()=>fs.writeFileSync('out/skin-editor-ui-'+theme+'.json',JSON.stringify({...proof,recordedAt:new Date().toISOString()},null,2))
  const until=async(label,expression,onWaiting)=>{let state;for(let i=0;i<80;i++){state=await evaluate(expression);if(state&&((typeof state==='object'&&'ready'in state)?state.ready:true))return state;if(onWaiting)await onWaiting(state);await wait(80)}proof.failure={label,state};persist();console.error('Skin readiness diagnostics',JSON.stringify(proof.failure));await screenshot('skin-failure-'+label.replace(/[^a-z0-9]/gi,'-').slice(0,75));throw Error(label+' was not ready: '+JSON.stringify(state))}
  const key=async(value,modifiers=0)=>{for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key:value,code:value==='Escape'?'Escape':value==='Tab'?'Tab':value,modifiers,windowsVirtualKeyCode:value==='Escape'?27:value==='Tab'?9:undefined});await wait(80)}
  const clickText=async(scope,text)=>{
    const selector=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(scope+' button')})].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('Missing skin button: '+${JSON.stringify(text)});e.dataset.skinCoordinate='target';return '[data-skin-coordinate="target"]'})()`)
    await coordinateClick(selector);await evaluate(`document.querySelector('[data-skin-coordinate="target"]')?.removeAttribute('data-skin-coordinate')`)
  }
  const coordinateClick=async selector=>{
    await until('visible click '+selector,`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return{ready:false,exists:false,innerWidth,innerHeight};if(!e.closest('[inert]'))e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y),signature=JSON.stringify([r.left,r.top,r.right,r.bottom,innerWidth,innerHeight]),stable=window.__skin118ClickSignature===signature;window.__skin118ClickSignature=signature;const toast=hit?.closest('.toast'),close=toast?.querySelector('.toast-close'),c=close?.getBoundingClientRect();return{ready:stable&&!e.disabled&&!e.closest('[inert]')&&r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(hit),exists:true,disabled:!!e.disabled,inert:!!e.closest('[inert]'),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},innerWidth,innerHeight,viewport:{width:visualViewport?.width,height:visualViewport?.height,scale:visualViewport?.scale},hit:hit?{tag:hit.tagName,classes:hit.className,aria:hit.getAttribute('aria-label'),text:hit.textContent?.trim().slice(0,120)}:null,toast:toast?.textContent?.trim(),dismiss:close&&c&&!close.disabled&&c.left>=0&&c.top>=0&&c.right<=innerWidth&&c.bottom<=innerHeight&&close.contains(document.elementFromPoint(c.left+c.width/2,c.top+c.height/2))?{x:c.left+c.width/2,y:c.top+c.height/2}:null}})()`,async state=>{
      // Dismiss an actually covering notification through its real visible close button.
      if(!state?.dismiss)return
      proof.occlusions.push({selector,...state});persist();await screenshot('skin-notification-occlusion-'+proof.occlusions.length)
      // A notification can expire while capturing its evidence. Its former
      // close coordinates may now belong to the editor entry underneath.
      const fresh=await evaluate(`(()=>{const toast=[...document.querySelectorAll('.toast')].find(e=>e.textContent.trim()===${JSON.stringify(state.toast)}),close=toast?.querySelector('.toast-close'),r=close?.getBoundingClientRect();return close&&r&&!close.disabled&&r.width>0&&r.height>0&&close.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))?{x:r.left+r.width/2,y:r.top+r.height/2}:null})()`)
      proof.occlusions.at(-1).freshDismiss=fresh;persist()
      if(!fresh)return
      for(const [type,buttons]of [['mouseMoved',0],['mousePressed',1],['mouseReleased',0]])await call('Input.dispatchMouseEvent',{type,...fresh,button:type==='mouseMoved'?'none':'left',buttons,clickCount:type==='mouseMoved'?0:1})
      await wait(250)
    })
    const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`)
    for(const [type,buttons]of [['mouseMoved',0],['mousePressed',1],['mouseReleased',0]])await call('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'?'none':'left',buttons,clickCount:type==='mouseMoved'?0:1})
    await wait(90)
  }
  const open=async()=>{await coordinateClick('.skin-editor-entry');await until('editor mounted',`!!document.querySelector('.skin-editor canvas')`);await wait(350)}
  const pose=async text=>{await clickText('.view-tools',text);await evaluate(`document.querySelector('.editor-model').scrollTop=0`);await wait(750)}
  const gesture=async(button='left',modifiers=0)=>{
    await evaluate(`document.activeElement?.blur();document.querySelector('.editor-model').scrollTop=0`)
    const r=await evaluate(`(()=>{const r=document.querySelector('.skin-editor canvas').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`),buttons=button==='middle'?4:1
    const start={x:r.x+r.w*.49,y:r.y+r.h*.19},end={x:r.x+r.w*(button==='middle'||modifiers ? .61 : .53),y:r.y+r.h*.22}
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...start,button:'none',buttons:0})
    await call('Input.dispatchMouseEvent',{type:'mousePressed',...start,button,buttons,modifiers,clickCount:1})
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...end,button:'none',buttons,modifiers})
    await call('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button,buttons:0,modifiers,clickCount:1});await wait(750)
  }
  const png=async()=>{await clickText('.editor-footer','保存 PNG…');await until('save finished',`document.querySelector('.skin-editor')&&!document.querySelector('.skin-editor .editor-content').inert`);assert(fs.existsSync(output));const bytes=await sharp(output).ensureAlpha().raw().toBuffer();return crypto.createHash('sha256').update(bytes).digest('hex')}
  const canvasShot=async()=>{
    // macOS may return a black WebGL surface for CDP's clipped capture. Capture
    // the actual visible compositor frame and crop its pixels using the live
    // visual viewport, rather than assuming a CSS-pixel/DPI ratio of one.
    const measure=()=>evaluate(`(()=>{const c=document.querySelector('.skin-editor canvas'),r=c.getBoundingClientRect(),v=visualViewport;return{bounds:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:v?.width||innerWidth,height:v?.height||innerHeight,offsetLeft:v?.offsetLeft||0,offsetTop:v?.offsetTop||0,devicePixelRatio}}})()`)
    for(let attempt=0;attempt<8;attempt++){
      await evaluate(`document.querySelector('.skin-editor canvas').scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})`);await wait(80)
      const before=await measure(),b=before.bounds,v=before.viewport
      if(!(b.width>0&&b.height>0&&b.x>=v.offsetLeft&&b.y>=v.offsetTop&&b.x+b.width<=v.offsetLeft+v.width&&b.y+b.height<=v.offsetTop+v.height))continue
      const frame=Buffer.from((await call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64'),after=await measure()
      if(JSON.stringify(before)!==JSON.stringify(after))continue
      const meta=await sharp(frame).metadata(),scaleX=meta.width/v.width,scaleY=meta.height/v.height
      const left=Math.max(0,Math.floor((b.x-v.offsetLeft)*scaleX)),top=Math.max(0,Math.floor((b.y-v.offsetTop)*scaleY)),right=Math.min(meta.width,Math.ceil((b.x+b.width-v.offsetLeft)*scaleX)),bottom=Math.min(meta.height,Math.ceil((b.y+b.height-v.offsetTop)*scaleY)),crop={left,top,width:right-left,height:bottom-top}
      assert(crop.width>0&&crop.height>0,'visible skin canvas crop must contain real pixels')
      ;(proof.canvasCaptures??=[]).push({source:'full visible compositor frame cropped with sharp',...before,frame:{width:meta.width,height:meta.height},scale:{x:scaleX,y:scaleY},crop});persist()
      return crypto.createHash('sha256').update(await sharp(frame).extract(crop).ensureAlpha().raw().toBuffer()).digest('hex')
    }
    assert.fail('skin canvas never reached a fully visible stable viewport for compositor capture')
  }
  const makeDirty=async()=>{await evaluate(`(()=>{const e=document.querySelector('.palette-hex');e.value=e.value==='#1177ee'?'#ee7733':'#1177ee';e.dispatchEvent(new Event('input',{bubbles:true}))})()`);await pose('正面');await gesture();assert(await evaluate(`document.querySelector('.editor-header p').textContent.includes('有未保存更改')`),'native-close fixture must actually be dirty')}
  const cancelConfirm=async()=>{await key('Escape');assert(!await evaluate(`!!document.querySelector('.skin-close-dialog')`));assert(await evaluate(`document.activeElement?.getAttribute('aria-label')==='关闭绘制皮肤'`),'close cancellation restores X focus')}
  const visibleError=async(scope,text)=>{
    const state=await until('visible operation error',`(()=>{const e=document.querySelector(${JSON.stringify(scope+' .editor-operation-error')}),r=e?.getBoundingClientRect(),hit=r&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{ready:!!e&&e.textContent.includes(${JSON.stringify(text)})&&r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight&&e.contains(hit),text:e?.textContent,rect:r&&{left:r.left,top:r.top,right:r.right,bottom:r.bottom},hit:hit?.className}})()`)
    ;(proof.visibleErrors??=[]).push({scope,...state});await screenshot('skin-operation-error-'+proof.visibleErrors.length)
  }
  const discardEditor=async()=>{await coordinateClick('[aria-label="关闭绘制皮肤"]');await until('close confirmation',`!!document.querySelector('.skin-close-dialog')`);await clickText('.skin-close-dialog','放弃更改');await until('editor removed',`!document.querySelector('.skin-editor')`)}
  await main(`globalThis.skin118OriginalDialog=testElectron.dialog.showSaveDialog;globalThis.skin118SaveMode='normal';testElectron.dialog.showSaveDialog=async()=>{if(skin118SaveMode==='delay')return await new Promise(r=>globalThis.skin118ResumeSave=r);if(skin118SaveMode==='error')throw Error('验证保存拒绝');return skin118SaveMode==='cancel'?{canceled:true}:{canceled:false,filePath:${JSON.stringify(output)}}}`)
  try{
    await nav('skins')
    const layouts=process.env.KAMUCL_SKIN_COMPACT_PROBE?[[960,620,1.5]]:[[960,620,1],[1280,900,1.25],[1440,960,1.5],[1440,684,1.5],[960,620,1.5]]
    for(const [width,height,zoom] of layouts){
      await main(`testElectron.BrowserWindow.getAllWindows()[0].setSize(${width},${height});testElectron.BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(${zoom})`);await wait(250);await screenshot('skin-page-'+width+'-'+zoom+(height===684?'-compact':''));await open();await pose('正面');await evaluate(`document.querySelector('.editor-content').scrollTop=0;document.querySelector('.editor-model').scrollTop=0`);await wait(80);await screenshot('skin-editor-'+width+'-'+zoom+(height===684?'-compact':''))
      const previewHeight=await evaluate(`document.querySelector('.skin-editor canvas').getBoundingClientRect().height`);assert(previewHeight>=120,'skin canvas must remain large enough to draw: '+previewHeight);
      const partControls=await evaluate(`(()=>{const scope=document.querySelector('.editor-model').getBoundingClientRect();return [...document.querySelectorAll('.part-tools button')].map(e=>{const r=e.getBoundingClientRect();return{name:e.textContent.trim(),visible:r.width>0&&r.height>0&&r.left>=scope.left&&r.right<=scope.right&&r.top>=scope.top&&r.bottom<=scope.bottom&&r.bottom<=innerHeight}})})()`);assert.equal(partControls.length,6);assert(partControls.every(p=>p.visible),'all six part controls must be visible without preview scrolling: '+JSON.stringify(partControls));
      if(await evaluate(`innerWidth<=700`)){
        const fixed=()=>evaluate(`(()=>{const x=document.querySelector('.editor-close').getBoundingClientRect(),f=document.querySelector('.editor-footer').getBoundingClientRect();return{x:x.top,footer:f.top,bottom:f.bottom}})()`),beforeFixed=await fixed()
        await coordinateClick('.palette-hex')
        for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:process.platform==='darwin'?4:2})
        await call('Input.insertText',{text:'#1177ee'});await key('Tab')
        await until('small-window actual colour input',`document.querySelector('[aria-label="RGB R"]').value==='17'&&document.querySelector('.palette-hex').value==='#1177ee'`)
        assert.deepEqual(await fixed(),beforeFixed,'header and footer remain fixed while scrolling to colour tools')
        assert(await evaluate(`document.querySelector('.editor-header p').textContent.includes('已保存')`),'real colour input does not edit skin pixels')
        await screenshot('skin-small-tools-'+width+'-'+zoom)
        await evaluate(`document.querySelector('.editor-content').scrollTop=0;document.querySelector('.editor-model').scrollTop=0`);await wait(80)
        ;(proof.smallTools??=[]).push({width,height,zoom,actualCoordinateInput:true,colour:'#1177ee',fixed:beforeFixed,returnedToModel:true})
      }
      const baseline=await png(),before=await canvasShot();await gesture('middle');assert.notEqual(await canvasShot(),before,'middle drag changes actual model rendering');assert.equal(await png(),baseline,'middle rotation preserves all exported RGBA pixels')
      assert(await evaluate(`[...document.querySelectorAll('.editor-footer-history button')].every(b=>b.disabled)`),'rotation has no undo record')
      const middle=await canvasShot();await gesture('left',1);assert.notEqual(await canvasShot(),middle,'Alt-left rotates rendered model');assert.equal(await png(),baseline)
      await pose('正面');await gesture();const painted=await png();assert.notEqual(painted,baseline,'left stroke changes actual PNG pixels')
      await clickText('.editor-footer','撤销');assert.equal(await png(),baseline,'one undo removes the full stroke');await clickText('.editor-footer','重做');assert.equal(await png(),painted)
      await pose('背面');await pose('俯视');await pose('仰视');assert.equal(await png(),painted,'quick views preserve pixels')
      await clickText('.part-tools','头部');assert.equal(await evaluate(`[...document.querySelectorAll('.part-tools button')].find(b=>b.textContent.trim()==='头部').getAttribute('aria-pressed')`),'false');await clickText('.control-heading','全部显示');assert.equal(await png(),painted,'part visibility preserves pixels')
      await makeDirty();await coordinateClick('[aria-label="关闭绘制皮肤"]');await until('visible dirty confirmation',`!!document.querySelector('.skin-close-dialog')`)
      const layout=await evaluate(`(()=>{const d=document.querySelector('.skin-close-dialog'),r=d.getBoundingClientRect(),x=document.querySelector('.editor-close').getBoundingClientRect(),f=document.querySelector('.editor-footer').getBoundingClientRect();return{innerWidth,innerHeight,confirm:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},x:{top:x.top,right:x.right,bottom:x.bottom},footer:{top:f.top,bottom:f.bottom},focus:document.activeElement.textContent.trim(),role:d.getAttribute('role')}})()`)
      assert(layout.confirm.top>=0&&layout.confirm.bottom<=layout.innerHeight&&layout.confirm.right<=layout.innerWidth);assert(layout.x.top>=0&&layout.x.bottom<=layout.innerHeight);assert(layout.footer.bottom<=layout.innerHeight);assert.equal(layout.role,'alertdialog');assert.equal(layout.focus,'继续绘制')
      for(let i=0;i<6;i++){await key('Tab');assert(await evaluate(`document.querySelector('.skin-close-dialog').contains(document.activeElement)`),'Tab stays inside confirmation')}
      await screenshot('skin-close-'+width+'-'+zoom+(height===684?'-compact':''));await cancelConfirm()
      await coordinateClick('[aria-label="关闭绘制皮肤"]');await main(`skin118SaveMode='cancel'`);await clickText('.skin-close-dialog','保存并退出');assert(await evaluate(`!!document.querySelector('.skin-close-dialog')`),'cancelled save keeps document open');await cancelConfirm()
      if(width===960){await coordinateClick('[aria-label="关闭绘制皮肤"]');await main(`skin118SaveMode='error'`);await clickText('.skin-close-dialog','保存并退出');assert(await evaluate(`!!document.querySelector('.skin-close-dialog')`));await visibleError('.skin-close-dialog','验证保存拒绝');await cancelConfirm()}
      await main(`skin118SaveMode='normal'`);await discardEditor();assert(await evaluate(`document.activeElement?.classList.contains('skin-editor-entry')`),'editor restores page opener focus')
      proof.layouts.push({width,height,zoom,...layout,middleRotate:true,altRotate:true,rgbaPreserved:true,oneUndoStroke:true,partControls,previewHeight});persist()
    }
    // Suppress only the final acknowledged destroy/quit IPC in this throwaway process.
    await main(`globalThis.skin118CloseListeners=testElectron.ipcMain.listeners('window:close');globalThis.skin118QuitListeners=testElectron.ipcMain.listeners('window:skinEditorQuit');globalThis.skin118WindowRequests=0;globalThis.skin118QuitRequests=0;testElectron.ipcMain.removeAllListeners('window:close');testElectron.ipcMain.removeAllListeners('window:skinEditorQuit');testElectron.ipcMain.on('window:close',()=>skin118WindowRequests++);testElectron.ipcMain.on('window:skinEditorQuit',()=>skin118QuitRequests++);testElectron.BrowserWindow.getAllWindows()[0].setSize(960,620);testElectron.BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1)`);await wait(250)
    await open();await main(`skin118SaveMode='delay';skin118ResumeSave=undefined`);await clickText('.editor-footer','保存 PNG…');assert(await main(`!!skin118ResumeSave`));await main(`testElectron.BrowserWindow.getAllWindows()[0].close()`);await until('queued clean busy native close',`document.querySelector('.editor-operation-status').textContent.includes('关闭请求')`)
    await main(`skin118ResumeSave({canceled:true})`);await until('clean busy close acknowledged',`!document.querySelector('.skin-editor')`);assert.equal(await main(`skin118WindowRequests`),1);assert.equal(await main(`testElectron.BrowserWindow.getAllWindows().length`),1);proof.nativeBusy=true
    await open();await pose('正面');await gesture();await coordinateClick('[aria-label="关闭绘制皮肤"]');await main(`skin118ResumeSave=undefined`);await clickText('.skin-close-dialog','保存并退出');assert(await main(`!!skin118ResumeSave`));await key('Escape');await main(`skin118ResumeSave({canceled:false,filePath:${JSON.stringify(output)}})`);await until('cancelled intent save finished',`!!document.querySelector('.skin-editor')&&!document.querySelector('.editor-content').inert`);assert(!await evaluate(`!!document.querySelector('.skin-close-dialog')`),'Escape during save-close cancels the exit intent');proof.queuedCancellation=true
    await main(`skin118SaveMode='normal'`);await makeDirty();await main(`testElectron.app.quit()`);await until('actual native quit guarded',`!!document.querySelector('.skin-close-dialog')`);await cancelConfirm();await discardEditor();assert.equal(await main(`skin118QuitRequests`),0,'cancelled quit is not reused by editor X')
    await open();await pose('正面');await gesture();await main(`testElectron.app.quit()`);await until('native quit confirmation',`!!document.querySelector('.skin-close-dialog')`);await clickText('.skin-close-dialog','放弃更改');await until('quit acknowledgement',`!document.querySelector('.skin-editor')`);assert.equal(await main(`skin118QuitRequests`),1)
    await main(`globalThis.skin118UploadHandler=testElectron.ipcMain._invokeHandlers.get('skin:editorUpload');testElectron.ipcMain.removeHandler('skin:editorUpload');testElectron.ipcMain.handle('skin:editorUpload',()=>new Promise((resolve,reject)=>globalThis.skin118RejectUpload=reject))`)
    await open();await pose('正面');await gesture();await clickText('.editor-footer','上传到当前账号');await clickText('.skin-upload-dialog','确认上传');assert(await main(`!!skin118RejectUpload`));await main(`testElectron.BrowserWindow.getAllWindows()[0].close()`);await until('upload busy queued close',`document.querySelector('.editor-operation-status').textContent.includes('关闭请求')`);await main(`skin118RejectUpload(Error('验证上传中断'))`);await until('failed upload resumes dirty close',`!!document.querySelector('.skin-close-dialog')`);await visibleError('.skin-close-dialog','验证上传中断');await cancelConfirm();await visibleError('.editor-footer','验证上传中断');await evaluate(`(()=>{const e=document.querySelector('.palette-hex');e.value='#d88c58';e.dispatchEvent(new Event('input',{bubbles:true}))})()`);await discardEditor();assert.equal(await main(`skin118WindowRequests`),1);proof.uploadBusy=true
    proof.complete=true;persist();console.log('PASS 1.1.8 actual skin gestures, visible/focused close, native busy/quit and cancellation')
  }finally{
    await main(`testElectron.dialog.showSaveDialog=skin118OriginalDialog;if(globalThis.skin118CloseListeners){testElectron.ipcMain.removeAllListeners('window:close');for(const fn of skin118CloseListeners)testElectron.ipcMain.on('window:close',fn);testElectron.ipcMain.removeAllListeners('window:skinEditorQuit');for(const fn of skin118QuitListeners)testElectron.ipcMain.on('window:skinEditorQuit',fn)}if(globalThis.skin118UploadHandler){testElectron.ipcMain.removeHandler('skin:editorUpload');testElectron.ipcMain.handle('skin:editorUpload',skin118UploadHandler)}testElectron.BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1);testElectron.BrowserWindow.getAllWindows()[0].setSize(1280,900)`)
    persist()
  }
}
