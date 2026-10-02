const test=require('node:test'),assert=require('node:assert/strict')
const {createNativeSession,withRestoration}=require('../scripts/verify-kamu-native-compositor-119.cjs')
function fixture(){
 const calls=[],w={id:7,webContents:{id:11,getURL:()=> 'file:///Applications/KAMUCL.app/Contents/Resources/app.asar/out/renderer/index.html',isDestroyed:()=>false},isDestroyed:()=>false,isFocused:()=>true,isVisible:()=>true,isMinimized:()=>false,getBounds:()=>({x:0,y:0,width:1280,height:900}),getBackgroundColor:()=> '#00000000',getOpacity:()=>1,setVibrancy:value=>calls.push(value)}
 const electron={BrowserWindow:{getAllWindows:()=>[w]},screen:{getDisplayMatching:()=>({id:1,size:{width:1920,height:1080},scaleFactor:1,displayFrequency:60})}}
 return{calls,w,electron}
}
test('native compositor guards the exact window identity and rejects ambiguity',()=>{
 const f=fixture();assert.throws(()=>createNativeSession(f.electron,'win32'),/Darwin/)
 const session=createNativeSession(f.electron,'darwin');session.set(null)
 f.w.webContents={...f.w.webContents,id:12};assert.throws(()=>session.restore(),/target changed/);assert.deepEqual(f.calls,[null])
 const g=fixture();g.electron.BrowserWindow.getAllWindows=()=>[g.w,{...g.w,id:8}];assert.throws(()=>createNativeSession(g.electron,'darwin'),/exactly one/);assert.deepEqual(g.calls,[])
})
test('a failed B recording still restores sidebar and renderer hooks without passing the failure',async()=>{
 const f=fixture(),session=createNativeSession(f.electron,'darwin');let restored=false
 await assert.rejects(withRestoration(async()=>{session.set('sidebar');session.set(null);throw Error('capture lost')},()=>session.restore(),()=>{restored=true}),/capture lost/)
 assert.deepEqual(f.calls,['sidebar',null,'sidebar']);assert.equal(restored,true);assert.equal(session.snapshot().appliedMaterial,'sidebar')
})
test('a destroyed native target does not prevent renderer cleanup or suppress either failure',async()=>{
 const f=fixture(),session=createNativeSession(f.electron,'darwin');let restored=false
 await assert.rejects(withRestoration(async()=>{session.set(null);f.w.isDestroyed=()=>true;throw Error('window disappeared')},()=>session.restore(),()=>{restored=true}),error=>error instanceof AggregateError&&error.errors.length===2&&error.errors[0].message==='window disappeared'&&/target changed/.test(error.errors[1].message))
 assert.equal(restored,true);assert.deepEqual(f.calls,[null])
})
