// Real coordinate operations in the exact signed Mac application's renderer.
// Read-only framework observations do not replace handlers or fabricate state.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto')
const ROUTES=['home','game','mods','packs','shaders','recordings','projections','keys','bridge','skins','community','servers','friends','settings','accounts']
const THEMES=['transparent','black-orange','blue-white','custom']
const LAYOUTS=[[960,620,1],[1280,900,1.25],[1440,960,1.5],[960,620,1.5]]
const ROUTE_COMPONENTS={home:'HomeView',game:'GameView',mods:'ModsView',packs:'PacksView',shaders:'ShadersView',recordings:'RecordingsView',projections:'ProjectionsView',keys:'KeysView',bridge:'BridgeView',skins:'SkinsView',community:'CommunityView',servers:'ServersView',friends:'FriendConnectView',settings:'SettingsView',accounts:'AccountsView'}
function installMacParityObserver(){
 const instances=()=>{
  const root=document.querySelector('#app')?.__vue_app__?._container?._vnode
  if(!root)throw Error('Actual mounted production VNode root unavailable')
  const seen=new WeakSet(),rows=[]
  const visit=node=>{if(!node||typeof node!=='object'||seen.has(node))return;seen.add(node);if(Array.isArray(node)){for(const child of node)visit(child);return}if(node.component){rows.push(node.component);visit(node.component.subTree)}if(Array.isArray(node.children))visit(node.children);visit(node.ssContent);visit(node.ssFallback);visit(node.suspense?.activeBranch)}
  visit(root);return rows.filter(row=>!row.isUnmounted)
 }
 const named=name=>instances().filter(row=>row.type?.__name===name)
 const one=name=>{const rows=named(name);if(rows.length!==1)throw Error('Expected one actual '+name+' instance, found '+rows.length);return rows[0]}
 const nodeForElement=(name,element)=>{
  const matches=[]
  const visit=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){for(const child of node)visit(child);return}if(node.el===element)matches.push(node);if(Array.isArray(node.children))visit(node.children);visit(node.ssContent);visit(node.ssFallback)}
  for(const row of named(name))visit(row.subTree)
  if(matches.length!==1)throw Error('Expected one actual '+name+' VNode for visible element, found '+matches.length)
  return matches[0]
 }
 const forElement=(name,element)=>{const node=nodeForElement(name,element);const rows=named(name).filter(row=>{let found=false;const visit=n=>{if(!n||typeof n!=='object')return;if(n===node)found=true;if(Array.isArray(n)){for(const c of n)visit(c);return}if(Array.isArray(n.children))visit(n.children);visit(n.ssContent);visit(n.ssFallback)};visit(row.subTree);return found});if(rows.length!==1)throw Error('Actual visible '+name+' props unavailable');return rows[0]}
 const route=name=>{
  const row=named(name).find(row=>{const el=row.subTree?.el,scope=el?.closest?.('.route-view')||el?.parentElement?.closest('.route-view');return scope?.isConnected&&!scope.classList.contains('fade-leave-active')})
  if(!row)return{component:null,componentChain:[],transition:null}
  const names=[];for(let current=row;current;current=current.parent)names.push(current.type?.__name||current.type?.name||null)
  const el=row.subTree.el,scope=el.closest?.('.route-view')||el.parentElement.closest('.route-view')
  return{component:row.type.__name,componentChain:names,transition:scope.className}
 }
 window.__macParityObserver={instances,one,route,nodeForElement,forElement,classification:'Read-only actual mounted production VNode tree and props; no DOM dev expandos, setupState or handler replacement'}
}
function readDownloadSelectionState(){
 const dialog=document.querySelector('.download-modal'),o=window.__macParityObserver
 if(!dialog)return{present:false}
 const loader=dialog.querySelector('.filter-row .select-menu-btn'),target=dialog.querySelector(':scope > .select-menu-btn'),file=dialog.querySelector('.file-row.active')
 const loaderProps=loader?o.forElement('SelectMenu',loader).props:null,targetProps=target?o.forElement('SelectMenu',target).props:null
 return{present:true,mcVersion:dialog.querySelector('input[list="mod-minecraft-versions"]')?.value,loader:loaderProps?.modelValue,loading:!!dialog.querySelector('.files-loading'),error:dialog.querySelector('.files-error')?.textContent||null,selectedFileId:file?o.nodeForElement('CommunityView',file).key:null,selectedFileName:file?.querySelector('.file-name')?.textContent,selectedFileDescription:file?.querySelector('.file-sub')?.textContent,target:{value:targetProps?.modelValue,options:targetProps?.options?.map(row=>({value:row.value,label:row.label}))||[]}}
}
function assertMatchingDownloadResponse(state,call){
 assert.equal(state.present,true);assert.equal(state.mcVersion,'1.20.1');assert.equal(state.loader,'fabric');assert.equal(state.loading,false);assert.equal(state.error,null)
 assert.equal(call?.channel,'community:files');assert(Number.isFinite(call.startedAt)&&Number.isFinite(call.completedAt)&&call.completedAt>=call.startedAt);assert(!call.error)
 assert.deepEqual(call.arguments,['modrinth','P7dR8mSH',{kind:'mod',mcVersion:'1.20.1',loader:'fabric'}])
 const selected=call.result?.find(row=>row.fileId===state.selectedFileId)
 assert(selected,'the actual selected VNode file belongs to the completed matching public response')
 assert.equal(selected.source,'modrinth');assert.equal(selected.projectId,'P7dR8mSH');assert(selected.gameVersions.includes('1.20.1')&&selected.loaders.includes('fabric'))
 assert.match(selected.sha1,/^[a-f0-9]{40}$/);assert.equal(state.selectedFileName,selected.fileName);assert(state.selectedFileDescription.includes('1.20.1'))
 return selected
}
function assertDownloadTargetSelection(state,expected){
 const label=expected.id+' · '+expected.mcVersion+' / '+expected.loader+' · '+expected.folder
 const options=state.target.options.filter(row=>row.label===label)
 assert.equal(options.length,1,'one actual compatible target option must identify the full instance and folder')
 assert(options[0].value);assert.equal(state.target.value,options[0].value,'the actual target SelectMenu props must select the intended instance')
 return options[0]
}
// Chromium may perform a microtask checkpoint between separate native event
// listeners. Bind both observations to the original Event and read only after
// its target handler has run, in the document's real bubbling phase.
function createQueueClickObserver(queue,readDataset,now){
 const events=new WeakMap()
 const before=event=>{
  if(!event.target.closest('[data-hit=kamu]'))return
  if(events.has(event))throw Error('Duplicate capture observation for original click')
  const d=readDataset(),row={actionId:queue.clicks.length+1,at:now(),trusted:event.isTrusted,beforePhase:event.eventPhase,before:Number(d.queue),expectedLimit:32,acceptedBefore:Number(d.acceptedClicks||0),rejectedBefore:Number(d.rejectedClicks||0),contacts:Number(d.contacts)}
  events.set(event,row);queue.clicks.push(row)
 }
 const after=event=>{
  const row=events.get(event);if(!row)return
  if(row.afterAt!==undefined)throw Error('Duplicate bubble observation for original click')
  const d=readDataset();row.after=Number(d.queue);row.acceptedAfter=Number(d.acceptedClicks||0);row.rejectedAfter=Number(d.rejectedClicks||0);row.afterAt=now();row.afterPhase=event.eventPhase;row.accepted=row.acceptedAfter===row.acceptedBefore+1
 }
 return{before,after}
}
function assertNavigationCoverage(rows){
 assert.equal(rows.length,THEMES.length*LAYOUTS.length*ROUTES.length)
 const keys=rows.map(row=>`${row.theme}/${row.width}/${row.height}/${row.zoom}/${row.route}`)
 assert.equal(new Set(keys).size,keys.length,'navigation evidence cannot duplicate a scene')
 for(const theme of THEMES)for(const[width,height,zoom]of LAYOUTS)for(const route of ROUTES){
  const row=rows.find(r=>r.theme===theme&&r.width===width&&r.height===height&&r.zoom===zoom&&r.route===route)
  assert(row,'missing actual navigation scene '+[theme,width,height,zoom,route].join('/'))
  assert.equal(row.selectedRoute,route);assert.equal(row.actualTheme,theme);assert.equal(row.native.focused,true)
  assert.equal(row.component,ROUTE_COMPONENTS[route],'actual component must match selected route')
  assert(row.componentChain.includes(ROUTE_COMPONENTS[route]),'original component ancestry must identify the actual page')
  assert.equal(row.native.visible,true);assert.equal(row.native.minimized,false)
  assert.equal(row.native.platform,'darwin');assert.equal(row.native.zoom,zoom)
  assert.equal(row.coordinate.hit,true);assert.equal(row.renderer.hasFocus,true);assert.equal(row.renderer.hidden,false)
  assert.equal(row.layout.horizontalOverflow,false);assert.match(row.screenshot,/^mac-parity-first-[a-z0-9-]+\.png$/)
  assert.match(row.sha256,/^[a-f0-9]{64}$/);assert(row.bytes>0)
 }
}
function assertQueueLedger(ledger,before,after){
 assert.equal(ledger.clicks.length,40,'forty original trusted click events required')
 assert(ledger.clicks.every(row=>row.trusted===true&&Number.isFinite(row.at)&&Number.isFinite(row.afterAt)))
 for(const row of ledger.clicks){
  assert.equal(row.beforePhase,1,'observe the original click before its target handler in capture phase')
  assert.equal(row.afterPhase,3,'observe the same original click after its target handler in bubble phase')
  assert(row.afterAt>=row.at,'original event observations cannot run backwards')
  assert.equal(row.expectedLimit,32);assert(Number.isInteger(row.before)&&row.before>=0&&row.before<=32)
  assert(Number.isInteger(row.after)&&row.after>=0&&row.after<=32)
  assert.equal(row.after-row.before,row.accepted?1:0,'each real synchronous input either accepts once or preserves the full queue')
  assert.equal(row.acceptedAfter-row.acceptedBefore,row.accepted?1:0)
  assert.equal(row.rejectedAfter-row.rejectedBefore,row.accepted?0:1,'actual rejection counter advances only on rejected input')
 }
 assert(ledger.clicks.slice(0,32).every(row=>row.accepted),'first 32 clicks are accepted in the original burst')
 const accepted=ledger.clicks.filter(row=>row.accepted).length,rejected=ledger.clicks.length-accepted
 assert(accepted>=32&&rejected>0,'the actual burst must exercise the maximum and overflow')
 assert.equal(Math.max(...ledger.clicks.map(row=>row.after)),32)
 assert.equal(after.contacts-before.contacts,accepted);assert.equal(after.count-before.count,accepted)
 const sources=ledger.audio.filter(row=>row.role==='palm')
 assert.equal(sources.length,accepted,'one actual palm source per accepted input')
 const contacts=ledger.contacts.filter(row=>row.contacts>before.contacts)
 assert.equal(contacts.length,accepted,'one original contact observation per accepted click')
 for(let i=0;i<contacts.length;i++){
  assert.equal(contacts[i].contacts,before.contacts+i+1)
  assert(Math.abs(sources[i].at-contacts[i].contactAt)<=50,'actual source start shares the contact timeline')
  assert(sources[i].duration>0&&sources[i].peak>0&&sources[i].peak<1,'real palm buffer has finite unclipped nonzero samples')
 }
 assert.equal(after.phase,'front');assert.equal(after.queue,0);assert.equal(after.persistedCount,after.count)
 assert.equal(ledger.busyVisible,true,'the actual overflow message must be visible')
 return{accepted,rejected,maximumQueue:32}
}
function publicAccount(account){return{id:account.id,type:account.type,username:account.username,uuid:account.uuid}}
function stableHash(value){const canonical=input=>Array.isArray(input)?input.map(canonical):input&&typeof input==='object'?Object.fromEntries(Object.keys(input).sort().map(key=>[key,canonical(input[key])])):input;return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')}
function createInstallHandlerObserver(ipc,channels){
 const p={calls:[],originals:new Map(),entries:new Map(),registration:[]}
 for(const channel of channels){
  const original=ipc._invokeHandlers.get(channel)
  if(typeof original!=='function')throw Error('Original install handler missing: '+channel)
  p.originals.set(channel,original)
  const wrapper=async function(...args){const row={index:p.calls.length,channel,startedAt:Date.now(),arguments:args.slice(1)};p.calls.push(row);try{row.result=await original.apply(this,args);row.completedAt=Date.now();return row.result}catch(error){row.error={name:error.name,message:error.message};row.completedAt=Date.now();throw error}}
  ipc.removeHandler(channel);ipc.handle(channel,wrapper)
  // Production handle registration may wrap listeners for IPC error logging.
  // Ownership belongs to the actual Map entry, not the supplied callback.
  const entry=ipc._invokeHandlers.get(channel)
  if(typeof entry!=='function')throw Error('Registered observation handler missing: '+channel)
  p.entries.set(channel,entry);p.registration.push({channel,actualEntryObserved:true,registeredEntryIsSuppliedWrapper:entry===wrapper})
 }
 return p
}
function restoreInstallHandlerObserver(ipc,p){
 const failures=[],restored=[]
 for(const[channel,original]of p.originals){
  if(ipc._invokeHandlers.get(channel)!==p.entries.get(channel)){failures.push(channel);continue}
  // Restore the exact original entry rather than registering it through the
  // production wrapper a second time. Foreign entries are never overwritten.
  ipc._invokeHandlers.set(channel,original)
  if(ipc._invokeHandlers.get(channel)!==original)throw Error('Original install handler restoration failed: '+channel)
  restored.push({channel,exactOriginalEntryRestored:true})
 }
 if(failures.length)throw Error('Install observation identity changed: '+failures.join(', '))
 return{complete:true,restored}
}
async function preserveInstallObservation(operation,restore,receipt,save){
 let value,primaryError,cleanupError,diagnosticError
 const checkpoint=()=>{try{save()}catch(error){diagnosticError??=error;(receipt.diagnosticErrors??=[]).push({name:error.name,message:error.message})}}
 try{value=await operation()}catch(error){primaryError=error;receipt.primaryError={name:error.name,message:error.message};checkpoint()}
 finally{checkpoint();try{receipt.handlerRestoration=await restore()}catch(error){cleanupError=error;receipt.cleanupError={name:error.name,message:error.message}}checkpoint()}
 if(primaryError)throw primaryError
 if(cleanupError)throw cleanupError
 if(diagnosticError)throw diagnosticError
 return value
}
async function collectAndRestoreInstallObserver(main,receipt){
 let traceError
 try{receipt.originalHandlerTrace=await main(`macParityInstallTrace.calls`)}
 catch(error){traceError=error;receipt.traceReadError={name:error.name,message:error.message}}
 let restored
 try{restored=await main(`(${restoreInstallHandlerObserver.toString()})(testElectron.ipcMain,macParityInstallTrace)`);receipt.handlerRestoration=restored}
 catch(error){receipt.restorationError={name:error.name,message:error.message};throw error}
 if(traceError)throw traceError
 return restored
}
function preservePrimaryFailure(proof,error,save){
 proof.error={name:error.name,message:error.message}
 try{save()}catch(diagnosticError){(proof.diagnosticErrors??=[]).push({stage:'primary failure receipt',name:diagnosticError.name,message:diagnosticError.message})}
 return error
}
module.exports=async function verifyMacParity(h){
 const{call,evaluate,main,wait,root,profile,games,version,phase,recordScreencast}=h
 assert.equal(process.platform,'darwin');assert(['first','restart'].includes(phase))
 const output=path.resolve(`out/mac-parity-${phase}.json`)
 assert(!fs.existsSync(output),'native phase receipt must be fresh; never replace old evidence')
 const sourceCommit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
 const native=()=>main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/renderer/index.html'));return{pid:process.pid,platform:process.platform,arch:process.arch,runtimeVersion:process.versions.electron,version:testElectron.app.getVersion(),executable:process.execPath,actualUserData:process.mainModule.require('node:fs').realpathSync.native(testElectron.app.getPath('userData')),windowId:w.id,webContentsId:w.webContents.id,bounds:w.getBounds(),contentBounds:w.getContentBounds(),zoom:w.webContents.getZoomFactor(),focused:w.isFocused(),visible:w.isVisible(),minimized:w.isMinimized(),appHidden:testElectron.app.isHidden()}})()`)
 const proof={schemaVersion:1,version,phase,sourceCommit,startedAt:new Date().toISOString(),complete:false,fullParityAcceptance:false,classification:'Actual native packaged UI and real persistence. Instance metadata is disposable synthetic data and is never launched. Real public-service downloads are separately labelled. No credential login or physical listening claim.',navigation:[],screenshots:[],operations:[],inputEvents:[],uncovered:['Microsoft authenticated login/refresh/license/game','Yggdrasil account login/refresh and server launch','physical audio listening','two-user multiplayer services','physical Intel hardware'],identity:{...(await native()),sourceCommit,profile:fs.realpathSync.native(profile)}}
 assert.equal(proof.identity.actualUserData,proof.identity.profile,'the observed native profile must equal the owned persistent profile')
 assert.equal(proof.identity.pid,h.ownedTrack.pid);assert.equal(proof.identity.arch,process.arch)
 assert.equal(proof.identity.runtimeVersion,require('../package.json').devDependencies.electron);assert.equal(proof.identity.version,version)
 assert.equal(fs.realpathSync.native(proof.identity.executable),fs.realpathSync.native(process.env.KAMUCL_GUI_APP))
 await evaluate(`(${installMacParityObserver.toString()})()`)
 const save=()=>fs.writeFileSync(output,JSON.stringify(proof,null,2))
 save()
 const until=async(label,read,accept,maximumMs=10000)=>{
  const started=performance.now(),samples=[];let value
  do{value=await read();samples.push({at:performance.now(),value});if(accept(value)){proof.operations.push({label,classification:'actual observed state',samples});save();return value}await wait(75)}while(performance.now()-started<maximumMs)
  proof.failure={label,samples};save();assert.fail(label+' did not reach its required actual state')
 }
 const coordinate=async(selector)=>{
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})`)
  const row=await until('visible coordinate '+selector,()=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return{hit:false};const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{hit:!!r.width&&!!r.height&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&!e.disabled&&!e.closest('[inert]')&&e.contains(document.elementFromPoint(x,y)),x,y,bounds:r.toJSON(),label:e.getAttribute('aria-label')||e.textContent.trim()}})()`),r=>r.hit)
  for(const[type,buttons]of[['mouseMoved',0],['mousePressed',1],['mouseReleased',0]]){
   const input={type,x:row.x,y:row.y,button:type==='mouseMoved'?'none':'left',buttons,clickCount:type==='mouseMoved'?0:1}
   proof.inputEvents.push({method:'Input.dispatchMouseEvent',parameters:input,at:performance.now()});await call('Input.dispatchMouseEvent',input)
  }
  return row
 }
 const textCoordinate=async(scope,text)=>{
  const index=await evaluate(`(()=>{const list=[...document.querySelectorAll(${JSON.stringify(scope+' button')})];return list.findIndex(e=>e.textContent.trim()===${JSON.stringify(text)})})()`)
  assert(index>=0,'missing visible business control '+text)
  const selector=await evaluate(`(()=>{const e=document.querySelectorAll(${JSON.stringify(scope+' button')})[${index}];e.dataset.macParityTarget='current';return '[data-mac-parity-target="current"]'})()`)
  try{return await coordinate(selector)}finally{await evaluate(`document.querySelector(${JSON.stringify(selector)})?.removeAttribute('data-mac-parity-target')`)}
 }
 const key=async(key,code,additional={})=>{for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key,code,...additional})}
 const type=async(selector,value)=>{
  await coordinate(selector);await key('a','KeyA',{modifiers:4,commands:['selectAll'],windowsVirtualKeyCode:65})
  await call('Input.insertText',{text:value});await key('Tab','Tab')
 }
 const route=async id=>{
  let position
  if(id==='accounts'){
   await route('home');position=await coordinate('.account-provider')
   await until('actual accounts page',()=>evaluate(`({ready:document.querySelector('.page-title')?.textContent.trim()==='账号',text:document.querySelector('.account-type-tabs')?.innerText})`),r=>r.ready)
  }else{
   if(['mods','packs','shaders','recordings','projections','bridge','servers'].includes(id)&&!await evaluate(`document.querySelector('[data-nav=resources]')?.getAttribute('aria-expanded')==='true'`))await coordinate('[data-nav=resources]')
   position=await coordinate(`[data-nav=${id}]`)
   await until('actual route '+id,()=>evaluate(`({...window.__macParityObserver.route(${JSON.stringify(ROUTE_COMPONENTS[id])}),route:document.querySelector('[data-nav][aria-current=page]')?.dataset.nav})`),r=>r.route===id&&r.component===ROUTE_COMPONENTS[id]&&!r.transition.includes('fade-enter-active')&&!r.transition.includes('fade-leave-active'))
  }
  return position
 }
 const screenshot=async name=>{
  const file=path.resolve('release/ui-refinement-black-orange',name+'.png')
  assert(!fs.existsSync(file),'new scene screenshots must not overwrite an earlier sample')
  const data=Buffer.from((await call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false})).data,'base64')
  fs.writeFileSync(file,data,{flag:'wx'});const row={screenshot:name+'.png',bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};proof.screenshots.push(row);save();return row
 }
 const accounts=()=>evaluate("window.kamucl.invoke('accounts:list')"),selected=()=>evaluate("window.kamucl.invoke('accounts:selected')"),state=()=>evaluate("window.kamucl.invoke('mascots:state')")
 const firstFile=path.resolve('out/mac-parity-first.json')
 try{
  if(phase==='restart'){
   const first=JSON.parse(fs.readFileSync(firstFile,'utf8'));assert.equal(first.complete,true)
   proof.restart={publicAccountsPersisted:false,mascotCountsPersisted:false,settingsPersisted:false,favoritePersisted:false}
   const actualAccounts=(await accounts()).map(publicAccount),actualSelected=publicAccount(await selected()),actualState=await state(),settings=await evaluate("window.kamucl.invoke('settings:get')"),favorites=await evaluate("window.kamucl.invoke('mods:favorites')")
   assert.deepEqual(actualAccounts,first.persisted.accounts);assert.deepEqual(actualSelected,first.persisted.selected)
   assert.deepEqual(actualState.counts,first.persisted.mascots.counts);assert.deepEqual(actualState.sound,first.persisted.mascots.sound)
   assert.equal(settings.theme,first.persisted.theme);assert.equal(stableHash(settings),first.persisted.settingsSHA256,'all actual settings must survive the native process restart');assert.deepEqual(favorites,first.persisted.favorites)
   Object.assign(proof.restart,{publicAccountsPersisted:true,mascotCountsPersisted:true,settingsPersisted:true,favoritePersisted:true,actualPublicAccounts:actualAccounts,actualSelectedAccount:actualSelected,actualMascotState:actualState,actualTheme:settings.theme})
   require('./verify-mac-parity.cjs').assertRestartIdentity(first.identity,{...proof.identity,...proof.restart})
   await route('accounts');await until('restart selected UI account',()=>evaluate(`({names:[...document.querySelectorAll('.account-name')].map(e=>e.textContent.trim()),selected:document.querySelector('.account-row.selected .account-name')?.textContent.trim()})`),r=>r.selected?.startsWith(first.persisted.selected.username))
   await coordinate('.account-row:not(.selected) .remove-btn')
   await until('native remove persists and retains selected account',accounts,r=>r.length===1&&r[0].id===first.persisted.selected.id)
   proof.restart.accountDeletion={actualAccounts:(await accounts()).map(publicAccount),selected:publicAccount(await selected())}
   Object.assign(proof.restart,await screenshot('mac-parity-restart-account-persistence'))
  }else{
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]})
   // No account handlers or service handlers are replaced in this module.
   assert.equal((await accounts()).length,0,'a new private profile has no player accounts')
   await route('accounts');await textCoordinate('.account-type-tabs','离线登录')
   await type('.add-input-wrap input','bad name')
   assert(await evaluate(`document.querySelector('.add-btn').disabled&&document.querySelector('.field-error').textContent.includes('3-16')`),'invalid username stays rejected in the actual form')
   for(const name of ['MacParity_A','MacParity_B']){
    await type('.add-input-wrap input',name);await coordinate('.add-btn')
    await until('native offline account '+name,accounts,list=>list.some(a=>a.username===name&&a.type==='offline'))
   }
   const ownedAccounts=await accounts();assert.equal(ownedAccounts.length,2)
   await until('both offline rows appear',()=>evaluate(`document.querySelectorAll('.account-row').length`),n=>n===2)
   await coordinate('.account-row:first-child')
   await until('coordinate account selection persisted',selected,a=>a?.id===ownedAccounts[0].id)
   proof.offlineAccounts={classification:'Actual offline UI and product IPC persistence; no authenticated-account substitute',accounts:ownedAccounts.map(publicAccount),selected:publicAccount(await selected()),storageStatus:await evaluate("window.kamucl.invoke('app:systemInfo').then(x=>x.credentialStorage)")}
   for(const account of ownedAccounts)assert(!Object.keys(account).some(key=>/token|password|secret/i.test(key)),'public accounts do not contain credentials')
   await screenshot('mac-parity-first-offline-accounts')
   for(const theme of THEMES){
    const custom={colors:{bg:'#171520',card:'#242232',accent:'#8759cd',text:'#f6f2ff',textDim:'#bcb7cc',border:'#4a455c',sidebarBg:'#201d2b',sidebarText:'#e5dff2',bannerText:'#ffffff'}}
    await evaluate(`window.kamucl.invoke('settings:set',{theme:${JSON.stringify(theme)},${theme==='custom'?'custom:'+JSON.stringify(custom):''}})`)
    await call('Page.reload')
    await until('saved real theme and mounted root '+theme,()=>evaluate(`({theme:document.documentElement.dataset.theme,ready:!!document.querySelector('[data-nav=home]')&&!!document.querySelector('#app')?.__vue_app__?._container?._vnode})`).catch(error=>({ready:false,transitionError:{name:error.name,message:error.message}})),r=>r.theme===theme&&r.ready)
    await evaluate(`(${installMacParityObserver.toString()})()`)
    for(const[width,height,zoom]of LAYOUTS){
     await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows()[0];w.setSize(${width},${height});w.webContents.setZoomFactor(${zoom})})()`)
     for(const id of ROUTES){
      const point=await route(id)
      await until('settled page transition '+id,()=>evaluate(`({rows:document.querySelectorAll('.content>.route-view').length,running:document.querySelector('.content')?.getAnimations({subtree:true}).filter(a=>a.playState==='running'&&a.effect?.target?.classList?.contains('route-view')).length})`),v=>v.rows===1&&v.running===0)
      const observed=await evaluate(`(()=>{const c=document.querySelector('.content'),s=getComputedStyle(document.querySelector('.shell'));return{...window.__macParityObserver.route(${JSON.stringify(ROUTE_COMPONENTS[id])}),selectedRoute:${JSON.stringify(id)}==='accounts'&&document.querySelector('.page-title')?.textContent.trim()==='账号'?'accounts':document.querySelector('[data-nav][aria-current=page]')?.dataset.nav,actualTheme:document.documentElement.dataset.theme,renderer:{width:innerWidth,height:innerHeight,hasFocus:document.hasFocus(),hidden:document.hidden,pixelRatio:devicePixelRatio},layout:{horizontalOverflow:c.scrollWidth>c.clientWidth+3,scrollWidth:c.scrollWidth,clientWidth:c.clientWidth,pageTitle:c.querySelector('.page-title')?.textContent.trim(),surface:s.backgroundColor,colour:s.color,blur:s.backdropFilter,checkboxes:[...c.querySelectorAll('input[type=checkbox]')].slice(0,20).map(e=>({appearance:getComputedStyle(e).appearance,checked:e.checked,mixed:e.indeterminate,disabled:e.disabled}))},renderAvailability:{skinCanvas:!!document.querySelector('.viewer3d canvas'),fallback:document.querySelector('.viewer3d-fallback')?.textContent||null}}})()`)
      const row={theme,width,height,zoom,route:id,coordinate:point,native:await native(),...observed,...await screenshot('mac-parity-first-'+theme+'-'+id+'-'+width+'-'+String(zoom).replace('.','p'))}
      proof.navigation.push(row);save()
      assert.equal(row.selectedRoute,id);assert.equal(row.actualTheme,theme);assert(!row.layout.horizontalOverflow,'actual page has horizontal overflow: '+JSON.stringify(row))
     }
    }
   }
   assertNavigationCoverage(proof.navigation)
   await main(`(()=>{const w=testElectron.BrowserWindow.getAllWindows()[0];w.setSize(1280,900);w.webContents.setZoomFactor(1)})()`)
   await evaluate("window.kamucl.invoke('settings:set',{theme:'black-orange'})");await call('Page.reload');await until('return theme and mounted root for restart',()=>evaluate(`({theme:document.documentElement.dataset.theme,ready:!!document.querySelector('[data-nav=home]')&&!!document.querySelector('#app')?.__vue_app__?._container?._vnode})`).catch(error=>({ready:false,transitionError:{name:error.name,message:error.message}})),r=>r.theme==='black-orange'&&r.ready)
   await evaluate(`(${installMacParityObserver.toString()})()`)
   await route('settings')
   proof.settingsCategories=[]
   for(const[scope,labels]of[['启动器设置',['外观','行为与登录','下载','功能与插件','关于与更新']],['游戏设置',['运行环境','游戏窗口','目录与隔离']]]){
    await textCoordinate('.settings-scopes',scope)
    for(const label of labels){await textCoordinate('.settings-categories',label);const actual=await until('actual settings category '+label,()=>evaluate(`({label:document.querySelector('.settings-categories [aria-current=page]')?.textContent.trim(),scope:document.querySelector('.settings-scopes [aria-current=page]')?.textContent.trim(),body:document.querySelector('.settings-body')?.innerText})`),r=>r.label===label&&r.scope===scope&&!!r.body);proof.settingsCategories.push({...actual,...await screenshot('mac-parity-first-settings-category-'+proof.settingsCategories.length)});save()}
   }
   await route('home')
   await evaluate("window.kamucl.invoke('mascots:sound',{muted:false,volume:.5})")
   const legacySeed={batchId:'mac-parity-history-'+crypto.randomUUID(),hits:['q3','qiqi','biyuehu','hongshu','milo','muchuanbei']};await evaluate(`window.kamucl.invoke('mascots:batch',${JSON.stringify(legacySeed)})`);proof.legacySeed={classification:'Disposable historical-data fixture via real product increment IPC, not retired characters rendered or clicked',batch:legacySeed}
   const baseline=await state();proof.mascotBaseline=baseline
   // Original sources and DOM contacts are observed, never delayed or changed.
   await evaluate(`(()=>{const p=window.__macParityQueue={clicks:[],contacts:[],audio:[],contexts:[],busyVisible:false};p.originalContext=window.AudioContext;p.originalStart=AudioBufferSourceNode.prototype.start;window.AudioContext=new Proxy(p.originalContext,{construct(t,a){const c=new t(...a);p.contexts.push(c);return c}});AudioBufferSourceNode.prototype.start=function(...args){const role=this.kamuclInitialization?.role==='silent-slap-buffer'?'initialization':'palm',values=this.buffer?.getChannelData(0);let peak=0;if(values)for(const value of values)peak=Math.max(peak,Math.abs(value));p.audio.push({at:performance.now(),audioTime:this.context.currentTime,scheduledAt:args[0]??0,role,duration:this.buffer?.duration,peak});return p.originalStart.apply(this,args)};p.clickObserver=(${createQueueClickObserver.toString()})(p,()=>document.querySelector('.mascot-stage').dataset,()=>performance.now());document.addEventListener('click',p.clickObserver.before,true);document.addEventListener('click',p.clickObserver.after,false);p.observer=new MutationObserver(()=>{const e=document.querySelector('.mascot-stage');if(e){const contacts=Number(e.dataset.contacts);if(contacts>0&&contacts!==p.contacts.at(-1)?.contacts)p.contacts.push({at:performance.now(),contacts,contactAt:Number(e.dataset.contactAt),cycleId:Number(e.dataset.cycleId)})}if(document.body.innerText.includes('拍打队列已满，请稍候'))p.busyVisible=true});p.observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-contacts','data-contact-at'],childList:true})})()`)
   try{
    await coordinate('.brand-avatar')
    const before=await until('model and feedback really ready',()=>evaluate(`(()=>{const e=document.querySelector('.mascot-stage'),b=document.querySelector('[data-hit=kamu]');return{ready:!!e&&!b.disabled&&Number(e.dataset.readyAt)>0&&e.dataset.feedbackPreparation==='decoded',phase:e?.dataset.phase,queue:Number(e?.dataset.queue),contacts:Number(e?.dataset.contacts),count:Number(b?.getAttribute('aria-label')?.match(/累计 (\\d+) 次/)?.[1]),accepted:Number(e?.dataset.acceptedClicks||0),rejected:Number(e?.dataset.rejectedClicks||0)}})()`),r=>r.ready&&r.phase==='front')
    assert.equal(before.count,baseline.counts.kamu||0,'first activation never counts')
    const position=await coordinatePosition(evaluate,'[data-hit=kamu]')
    proof.queueDispatches=[]
    assert(!fs.existsSync(path.resolve('out/mac-parity-queue-burst-black-orange')),'original queue recording directory must be new')
    let dispatchError
    const recording=await recordScreencast('mac-parity-queue-burst',async()=>{
     const pending=[]
     for(let i=0;i<40;i++)for(const[type,buttons]of[['mousePressed',1],['mouseReleased',0]]){const args={type,...position,button:'left',buttons,clickCount:1};proof.queueDispatches.push({index:proof.queueDispatches.length,at:performance.now(),args});pending.push(call('Input.dispatchMouseEvent',args))}
     try{await Promise.all(pending)}catch(error){dispatchError=error;proof.queueDispatchFailure={name:error.name,message:error.message}}
    },7000)
    proof.queueRecording=recording;save();if(dispatchError)throw dispatchError
    const after=await until('every accepted click contacts and persists then returns front',()=>evaluate(`(async()=>{const e=document.querySelector('.mascot-stage'),b=document.querySelector('[data-hit=kamu]'),saved=await window.kamucl.invoke('mascots:state');return{phase:e.dataset.phase,queue:Number(e.dataset.queue),contacts:Number(e.dataset.contacts),count:Number(b.getAttribute('aria-label').match(/累计 (\\d+) 次/)[1]),persistedCount:saved.counts.kamu}})()`),r=>r.phase==='front'&&r.queue===0&&r.persistedCount===r.count,20000)
    const ledger=await evaluate(`(()=>{const p=window.__macParityQueue;return{clicks:p.clicks,contacts:p.contacts,audio:p.audio,busyVisible:p.busyVisible}})()`)
    proof.queue={before,after,ledger,recording,classification:'Actual original trusted input queue and synchronous product acceptance/rejection counters, original contact/audio timeline. CDP wall-clock recording is retained diagnostically and is not used as formal presented-FPS evidence.'};save()
    proof.queue.result=assertQueueLedger(ledger,before,after)
    await coordinate('.menu-tool');await textCoordinate('.sound-panel','恢复 LOGO')
    await until('queue close actually releases contexts and renderer',()=>evaluate(`({stage:!!document.querySelector('.mascot-stage'),audio:window.__macParityQueue.contexts.map(c=>c.state),avatarFocused:document.activeElement===document.querySelector('.brand-avatar')})`),r=>!r.stage&&r.audio.length>0&&r.audio.every(x=>x==='closed')&&r.avatarFocused)
   }finally{await evaluate(`(()=>{const p=window.__macParityQueue;p.observer.disconnect();document.removeEventListener('click',p.clickObserver.before,true);document.removeEventListener('click',p.clickObserver.after,false);AudioBufferSourceNode.prototype.start=p.originalStart;window.AudioContext=p.originalContext})()`);save()}
   // A real project is fetched from the public service; no search/files/plan
   // handler is substituted. Only the target instance metadata is synthetic.
   proof.realService={source:'modrinth',projectId:'P7dR8mSH',classification:'Actual native UI / real public API and CDN / real prepared dependency plan and commit; synthetic MC1.20.1 Fabric target, not a game-launch claim',complete:false};save()
   const targetMetadata=path.join(games,'versions','联机验证实例','联机验证实例.json'),syntheticTarget=JSON.parse(fs.readFileSync(targetMetadata,'utf8'));syntheticTarget._loaderVersion='0.16.14';fs.writeFileSync(targetMetadata,JSON.stringify(syntheticTarget));proof.realService.syntheticTargetMetadata=syntheticTarget
   const project=await evaluate("window.kamucl.invoke('community:project','modrinth','P7dR8mSH','mod')")
   assert.equal(project.source,'modrinth');assert.equal(project.projectId,'P7dR8mSH');assert.equal(project.kind,'mod');assert(project.iconUrl?.startsWith('https://'))
   await evaluate(`window.kamucl.invoke('mods:favorite',${JSON.stringify({source:project.source,projectId:project.projectId,name:project.title,iconUrl:project.iconUrl})},true)`)
   await route('community');await coordinate('[data-ui="community:favorites"]')
   const icon=await until('real favorite icon actually decoded',()=>evaluate(`(()=>{const e=document.querySelector('[data-favorite-key="modrinth:P7dR8mSH"]'),i=e?.querySelector('.favorite-icon img');return{ready:!!i&&i.complete&&i.naturalWidth>0,width:i?.naturalWidth,height:i?.naturalHeight,url:i?.currentSrc,title:e?.innerText}})()`),r=>r.ready,20000)
   proof.realService.project=project;proof.realService.icon=icon;await screenshot('mac-parity-first-real-favorite-icon')
   await coordinate('[data-favorite-key="modrinth:P7dR8mSH"] .favorite-download')
   await until('real file dialog appears',()=>evaluate(`!!document.querySelector('.download-modal')`),v=>v)
   // Forward each original install handler exactly once. This observes real
   // prepared plans/commits without depending on production setup closures or
   // substituting network, dependency, compatibility or download responses.
   proof.realService.handlerRegistration=await main(`(()=>{globalThis.macParityInstallTrace=(${createInstallHandlerObserver.toString()})(testElectron.ipcMain,['community:files','mods:prepare','mods:commit']);return macParityInstallTrace.registration})()`)
   await preserveInstallObservation(async()=>{
   save()
   await type('.download-modal input[list="mod-minecraft-versions"]','1.20.1')
   await until('actual entered Minecraft filter',()=>evaluate(`document.querySelector('.download-modal input[list="mod-minecraft-versions"]')?.value`),value=>value==='1.20.1')
   // A real pointer focus change commits the input change. A Tab event alone
   // must not imply a new filter request or make pre-existing rows current.
   await coordinate('.download-modal .filter-row .select-menu-btn')
   await textCoordinate('.select-menu-float','Fabric')
   let matchingCall
   const filtered=await until('real compatible file response',async()=>{
    const selection=await evaluate(`(${readDownloadSelectionState.toString()})()`)
    const calls=await main(`macParityInstallTrace.calls`)
    matchingCall=calls.filter(row=>row.channel==='community:files'&&row.arguments?.[0]==='modrinth'&&row.arguments?.[1]==='P7dR8mSH'&&row.arguments?.[2]?.mcVersion==='1.20.1'&&row.arguments?.[2]?.loader==='fabric').at(-1)
    return{selection,response:matchingCall?{index:matchingCall.index,startedAt:matchingCall.startedAt,completedAt:matchingCall.completedAt,error:matchingCall.error,fileIds:matchingCall.result?.map(row=>row.fileId)}:null}
   },row=>{try{assertMatchingDownloadResponse(row.selection,matchingCall);return true}catch{return false}},30000)
   proof.realService.filterSelection=filtered;proof.realService.filteredFile=assertMatchingDownloadResponse(filtered.selection,matchingCall);proof.realService.completedFileResponse=matchingCall;save()
   const expectedTarget={id:'联机验证实例',mcVersion:'1.20.1',loader:'fabric',folder:fs.realpathSync.native(games)}
   const targetLabel=expectedTarget.id+' · '+expectedTarget.mcVersion+' / '+expectedTarget.loader+' · '+expectedTarget.folder
   await coordinate('.download-modal > .select-menu-btn')
   await textCoordinate('.select-menu-float',targetLabel)
   const selectedTarget=await until('real intended download target',()=>evaluate(`(${readDownloadSelectionState.toString()})()`),row=>{try{assertMatchingDownloadResponse(row,matchingCall);assertDownloadTargetSelection(row,expectedTarget);return true}catch{return false}})
   proof.realService.targetSelection=selectedTarget;proof.realService.targetOption=assertDownloadTargetSelection(selectedTarget,expectedTarget);save()
   await screenshot('mac-parity-first-real-file-target-selection')
   await textCoordinate('.download-modal .modal-actions','确认下载')
   const observedInput=await until('actual mounted installer input',()=>evaluate(`(()=>{const row=window.__macParityObserver.instances().find(row=>row.type?.__name==='ModInstallDialog');if(!row)return{};const p=row.props;return{file:p.input.file,target:p.target}})()`),r=>!!r.file&&!!r.target)
   proof.realService.chosen=observedInput;save()
   assert.equal(observedInput.file.fileId,proof.realService.filteredFile.fileId);assert.equal(observedInput.file.sha1,proof.realService.filteredFile.sha1);assert.equal(observedInput.target.id,expectedTarget.id);assert.equal(observedInput.target.mcVersion,expectedTarget.mcVersion);assert.equal(observedInput.target.loader,expectedTarget.loader);assert.equal(fs.realpathSync.native(observedInput.target.folder),expectedTarget.folder)
   await until('real prepared install UI',()=>evaluate(`(()=>{const e=document.querySelector('.modinstall-modal'),button=e?.querySelector('.btn-gold');return{ready:!!e&&!e.querySelector('.modal-loading')&&!!button&&!button.disabled,rows:e?[...e.querySelectorAll('.dependency-row')].map(r=>r.innerText):[],error:e?.querySelector('.modal-error')?.textContent}})()`),r=>r.ready,60000)
   const chosen=await evaluate(`(()=>{const p=window.__macParityObserver.one('ModInstallDialog').props;return{file:p.input.file,target:p.target}})()`)
   proof.realService.chosen=chosen;save()
   assert(chosen.file&&chosen.file.sha1&&chosen.file.projectId==='P7dR8mSH','actual mounted installer receives selected public file with service hash')
   assert(chosen.file.gameVersions.includes('1.20.1')&&chosen.file.loaders.includes('fabric'),'the actual selected file is compatible')
   const observedPlans=await main(`macParityInstallTrace.calls.filter(c=>c.channel==='mods:prepare'&&c.completedAt)`);proof.realService.originalHandlerTrace=await main(`macParityInstallTrace.calls`);save()
   const observedPlan=observedPlans.filter(row=>row.arguments[0].id===expectedTarget.id&&row.arguments[0].folder===chosen.target.folder&&row.arguments[1]?.file?.fileId===chosen.file.fileId);assert.equal(observedPlan.length,1,'exactly one completed original prepare for the actual selected target and public file');assert(!observedPlan[0].error)
   const plan=observedPlan[0].result
   proof.realService.plan=plan;save()
   assert(!plan.warnings.length,'real dependency plan has no compatibility warnings')
   assert.equal(plan.target.id,'联机验证实例');assert.equal(fs.realpathSync.native(plan.target.folder),fs.realpathSync.native(games));assert.deepEqual(observedPlan[0].arguments[0],{id:plan.target.id,folder:plan.target.folder})
   proof.realService.file=chosen.file;proof.realService.plan=plan;await screenshot('mac-parity-first-real-install-plan');save()
   await coordinate('.modinstall-modal .modal-actions .btn-gold')
   await until('real install completes without swallowing failure',()=>evaluate(`({done:!document.querySelector('.modinstall-modal')&&!document.querySelector('.download-modal'),error:document.querySelector('.modinstall-modal .modal-error')?.textContent})`),r=>r.done,90000)
   const installed=path.join(games,'versions','联机验证实例','mods',chosen.file.fileName),stats=fs.statSync(installed)
   const bytes=fs.readFileSync(installed),actualSHA1=crypto.createHash('sha1').update(bytes).digest('hex')
   assert.equal(actualSHA1,chosen.file.sha1);assert.equal(stats.size,chosen.file.size)
   const observedCommit=await main(`macParityInstallTrace.calls.filter(c=>c.channel==='mods:commit'&&c.completedAt)`);assert.equal(observedCommit.length,1);assert(!observedCommit[0].error);assert.deepEqual(observedCommit[0].arguments,[plan.id,true])
   proof.realService.installed={relative:path.relative(games,installed),bytes:stats.size,sha1:actualSHA1,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),declaredSHA1:chosen.file.sha1,target:plan.target};proof.realService.complete=true
   await screenshot('mac-parity-first-real-install-complete')
   },()=>collectAndRestoreInstallObserver(main,proof.realService),proof.realService,save)
   const finalSettings=await evaluate("window.kamucl.invoke('settings:get')")
   proof.persisted={accounts:(await accounts()).map(publicAccount),selected:publicAccount(await selected()),mascots:await state(),favorites:await evaluate("window.kamucl.invoke('mods:favorites')"),theme:finalSettings.theme,settingsSHA256:stableHash(finalSettings)}
   assert.equal(proof.persisted.accounts.length,2);assert.equal(proof.persisted.theme,'black-orange')
  }
  proof.complete=true;proof.finishedAt=new Date().toISOString();save()
 }catch(error){preservePrimaryFailure(proof,error,save);try{await screenshot('mac-parity-'+phase+'-failure')}catch{}throw error}
}
async function coordinatePosition(evaluate,selector){return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('actual queue hit target obscured');return{x,y}})()`)}
Object.assign(module.exports,{ROUTES,THEMES,LAYOUTS,ROUTE_COMPONENTS,assertNavigationCoverage,assertQueueLedger,publicAccount,stableHash,installMacParityObserver,readDownloadSelectionState,assertMatchingDownloadResponse,assertDownloadTargetSelection,createQueueClickObserver,createInstallHandlerObserver,restoreInstallHandlerObserver,preserveInstallObservation,collectAndRestoreInstallObserver,preservePrimaryFailure})
