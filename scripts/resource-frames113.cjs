// Original renderer callback clocks, including the entire observation window.
// These describe callback delivery, never GPU presents or video capture FPS.
const assert=require('node:assert/strict')
const percentile=(a,p)=>{const v=[...a].sort((x,y)=>x-y);return v[Math.min(v.length-1,Math.ceil(v.length*p)-1)]}
function frameStats(operation){
 const {frames,rendererWindow}=operation;assert(rendererWindow&&Number.isFinite(rendererWindow.start)&&Number.isFinite(rendererWindow.end)&&rendererWindow.end>rendererWindow.start,'Original renderer window clocks required')
 const elapsedMs=rendererWindow.end-rendererWindow.start,frameClocks=frames.map(f=>f.now),deliveries=frames.map(f=>f.deliveredAt)
 assert(frameClocks.every(Number.isFinite));assert(frameClocks.slice(1).every((t,i)=>t>frameClocks[i]),'Original frame timestamps cannot be duplicated or inserted')
 assert(deliveries.every(Number.isFinite),'Each original callback requires its actual delivery clock');assert(deliveries.every(t=>t>=rendererWindow.start&&t<=rendererWindow.end));assert(deliveries.slice(1).every((t,i)=>t>deliveries[i]),'Original delivery timestamps cannot be duplicated or inserted')
 assert(Number.isFinite(rendererWindow.timeOrigin)&&Number.isFinite(rendererWindow.endTimeOrigin)&&rendererWindow.timeOrigin===rendererWindow.endTimeOrigin,'Actual original document time origin must remain unchanged across the full observation window')
 // A rAF argument is the beginning of its frame, and can precede registration
 // within that same frame. Retain it exactly; the actual callback-delivery clock
 // bounds the full observation window without deleting that legitimate frame.
 const frameClockGapsMs=frameClocks.slice(1).map((t,i)=>t-frameClocks[i]),gaps=deliveries.length?[deliveries[0]-rendererWindow.start,...deliveries.slice(1).map((t,i)=>t-deliveries[i]),rendererWindow.end-deliveries.at(-1)]:[elapsedMs]
 return{elapsedMs,originalCallbacks:deliveries.length,callbackRatePerSecond:deliveries.length*1000/elapsedMs,initialGapMs:gaps[0],tailGapMs:gaps.at(-1),gapP95Ms:percentile(gaps,.95),gapMaxMs:Math.max(...gaps),crossClockOffsetsMs:frameClocks.map((t,i)=>t-deliveries[i]),frameClockGapsMs,frameClockGapP95Ms:frameClockGapsMs.length?percentile(frameClockGapsMs,.95):null,frameClockGapMaxMs:frameClockGapsMs.length?Math.max(...frameClockGapsMs):null,preRegistrationFrameClocks:frameClocks.filter(t=>t<rendererWindow.start).length,classification:'Actual original callback delivery over the full performance.now observation window, with unchanged rAF frame clocks separately retained; not GPU present/capture FPS',gaps}
}
module.exports={frameStats}
