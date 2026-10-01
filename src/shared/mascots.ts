export const MASCOTS=[{id:'q3',name:'q3'},{id:'qiqi',name:'qiqi'},{id:'biyuehu',name:'碧月狐'},{id:'hongshu',name:'红叔'},{id:'kamu',name:'卡慕'},{id:'milo',name:'米洛'},{id:'muchuanbei',name:'幕川北'}] as const
export interface MascotState {counts:Record<string,number>;order:string[]}
export function sortMascots(state:MascotState):string[]{return [...state.order].sort((a,b)=>(state.counts[b]||0)-(state.counts[a]||0))}
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
