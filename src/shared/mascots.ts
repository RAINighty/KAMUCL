export const MASCOTS=[{id:'q3',name:'q3'},{id:'qiqi',name:'qiqi'},{id:'biyuehu',name:'碧月狐'},{id:'hongshu',name:'红叔'},{id:'kamu',name:'卡慕'},{id:'milo',name:'米洛'},{id:'muchuanbei',name:'幕川北'}] as const
export interface MascotSound { muted:boolean; volume:number }
export const DEFAULT_MASCOT_SOUND:Readonly<MascotSound>={muted:false,volume:.45}
export interface MascotState {counts:Record<string,number>;order:string[];sound?:MascotSound}
export interface MascotBatch {batchId:string;hits:string[];tieOrder?:string[]}
export interface MascotHitRect {id:string;left:number;top:number;right:number;bottom:number}
export function normalizeMascotSound(value?:Partial<MascotSound>):MascotSound {
 return {muted:value?.muted===true,volume:typeof value?.volume==='number'&&Number.isFinite(value.volume)?Math.min(1,Math.max(0,value.volume)):DEFAULT_MASCOT_SOUND.volume}
}
export function addMascotHits(state:MascotState,hits:readonly string[]):MascotState {
 const next={...state,counts:{...state.counts},order:[...state.order]}
 for(const id of hits){if(!MASCOTS.some(m=>m.id===id))throw new Error('人物标识无效');next.counts[id]=Math.min(Number.MAX_SAFE_INTEGER,(next.counts[id]||0)+1)}
 next.order=sortMascots(next)
 return next
}
export function sortMascots(state:MascotState):string[]{return [...state.order].sort((a,b)=>(state.counts[b]||0)-(state.counts[a]||0))}
/** Detects every zone crossed, even when a mouse event skips multiple characters.
 * Geometry changes alone never enter a zone: each test uses actual pointer travel. */
export class MascotSweepGate {
 private previous?:{x:number;y:number};private occupied=new Set<string>()
 move(x:number,y:number,rects:readonly MascotHitRect[]):string[]{
  if(!Number.isFinite(x)||!Number.isFinite(y))return []
  const from=this.previous;this.previous={x,y}
  if(from&&from.x===x&&from.y===y)return []
  const inside=(r:MascotHitRect,px:number,py:number)=>px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom
  const hits:Array<{id:string;t:number}>=[]
  for(const r of rects){
   if(!from){if(inside(r,x,y)&&!this.occupied.has(r.id))hits.push({id:r.id,t:0});continue}
   // Rebase the occupied set to current positions after a layout/sort animation.
   // A person walking under the pointer is already occupied, never a fresh entry.
   if(inside(r,from.x,from.y))continue
   let start=0,end=1,valid=true
   for(const [a,b,low,high] of [[from.x,x,r.left,r.right],[from.y,y,r.top,r.bottom]]){
    const delta=b-a
    if(delta===0){if(a<low||a>high)valid=false;continue}
    const t0=(low-a)/delta,t1=(high-a)/delta
    start=Math.max(start,Math.min(t0,t1));end=Math.min(end,Math.max(t0,t1))
   }
   if(valid&&start<=end&&end>=0&&start<=1)hits.push({id:r.id,t:start})
  }
  this.occupied=new Set(rects.filter(r=>inside(r,x,y)).map(r=>r.id))
  return hits.sort((a,b)=>a.t-b.t).map(h=>h.id)
 }
 reset(){this.previous=undefined;this.occupied.clear()}
}
/** Retained for compatibility with the previous public hover helper. */
export class MascotHoverGate {
  private x=NaN;private y=NaN;private target=''
  move(x:number,y:number,target:string,moving:boolean):string|undefined {
    if(x===this.x&&y===this.y)return
    this.x=x;this.y=y
    const previous=this.target;this.target=target
    if(!moving&&target&&target!==previous)return target
  }
  reset(){this.target='';this.x=this.y=NaN}
}
