import {app,ipcMain} from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import {MASCOTS,sortMascots,type MascotState} from '../../shared/mascots'
const ids=MASCOTS.map(m=>m.id) as string[],file=()=>path.join(app.getPath('userData'),'mascot-counts.json')
function read():MascotState{try{const raw=JSON.parse(fs.readFileSync(file(),'utf8'));if(!raw||!raw.counts||!Array.isArray(raw.order))throw new Error('计数格式无效');return {counts:Object.fromEntries(ids.map(id=>[id,Number.isSafeInteger(raw.counts[id])&&raw.counts[id]>=0?raw.counts[id]:0])),order:[...new Set([...raw.order.filter((id:string)=>ids.includes(id)),...ids])] as string[]}}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {counts:{},order:[...ids]};throw new Error('互动计数记录无法读取，未覆盖原记录')}}
function write(state:MascotState){state.order=sortMascots(state);fs.mkdirSync(path.dirname(file()),{recursive:true});fs.writeFileSync(file()+'.tmp',JSON.stringify(state));fs.renameSync(file()+'.tmp',file());return state}
export function registerMascotsIpc(){ipcMain.handle('mascots:state',()=>read());ipcMain.handle('mascots:slap',(_e,id)=>{if(!ids.includes(id))throw new Error('人物标识无效');const state=read();state.counts[id]=Math.min(Number.MAX_SAFE_INTEGER,(state.counts[id]||0)+1);return write(state)});ipcMain.handle('mascots:reset',(_e,confirmed)=>{if(confirmed!==true)throw new Error('请确认重置计数');return write({counts:{},order:[...ids]})})}
