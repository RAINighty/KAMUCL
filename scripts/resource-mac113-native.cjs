// Native macOS measurement only. Never runs an app through Rosetta and never
// substitutes Windows private commit, JavaScript heap or RSS for footprint.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),{EventEmitter}=require('node:events')
const swiftSource=path.join(__dirname,'resource-native-mac113.swift')
const headerText=`#include <libproc.h>
#include <mach/mach.h>
#include <mach/task_info.h>
#include <sys/event.h>
#include <errno.h>
#include <stdint.h>
static const mach_msg_type_number_t RESOURCE_TASK_VM_INFO_REV1_COUNT113 = TASK_VM_INFO_REV1_COUNT;
static inline int resource_pid_rusage113(pid_t pid, struct rusage_info_v2 *buffer) { return proc_pid_rusage(pid, RUSAGE_INFO_V2, (rusage_info_t *)buffer); }
// These wrappers only register/query process lifecycle notifications. They never
// signal, attach to, suspend, or write the observed process. Preserve every raw
// kevent field, including the original non-pointer generation carried in udata.
struct resource_proc_event113 { uint64_t ident; int16_t filter; uint16_t flags; uint32_t fflags; int64_t data; uint64_t generation; int32_t call_result; int32_t system_errno; };
static inline void resource_copy_event113(struct resource_proc_event113 *out, const struct kevent *event, int result, int error) {
 out->ident=event->ident; out->filter=event->filter; out->flags=event->flags; out->fflags=event->fflags; out->data=event->data; out->generation=(uint64_t)(uintptr_t)event->udata; out->call_result=result; out->system_errno=error;
}
static inline int resource_proc_register113(int queue, pid_t pid, uint64_t generation, struct resource_proc_event113 *out) {
 struct kevent change, receipt={0}; EV_SET(&change,(uintptr_t)pid,EVFILT_PROC,EV_ADD|EV_ENABLE|EV_ONESHOT|EV_RECEIPT,NOTE_EXIT,0,(void *)(uintptr_t)generation);
 errno=0; int result=kevent(queue,&change,1,&receipt,1,NULL); int error=errno; resource_copy_event113(out,&receipt,result,error); return result;
}
static inline int resource_proc_drain113(int queue, struct resource_proc_event113 *out, int capacity) {
 struct kevent events[64]; struct timespec timeout={0,0}; if(capacity>64)capacity=64;
 errno=0; int count=kevent(queue,NULL,0,events,capacity,&timeout); int error=errno;
 if(count<0){ struct kevent empty={0}; resource_copy_event113(out,&empty,count,error); }
 else for(int i=0;i<count;i++)resource_copy_event113(out+i,events+i,count,error);
 return count;
}
`
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
function compileNative({directory=path.resolve('out/resource113/mac-native')}={}){
 assert.equal(process.platform,'darwin','Native Swift evidence requires macOS');assert.equal(process.arch,'arm64','Only native Mac ARM64 is supported')
 fs.mkdirSync(directory,{recursive:true});const header=path.join(directory,'Resource113-Bridging.h'),exe=path.join(directory,'resource-native-mac113'),receiptFile=path.join(directory,'compiler.json'),log=path.join(directory,'compiler.log');fs.writeFileSync(header,headerText)
 const receipt={at:new Date().toISOString(),platform:process.platform,arch:process.arch,swiftSourceSHA256:hash(swiftSource),headerSHA256:hash(header),complete:false,scope:'Native compiler/API qualification; no launcher memory acceptance'}
 const save=()=>fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n');save()
 try{receipt.swiftVersion=execFileSync('xcrun',['swiftc','--version'],{encoding:'utf8'}).trim();const output=execFileSync('xcrun',['swiftc','-O','-target','arm64-apple-macosx13.0','-import-objc-header',header,swiftSource,'-o',exe],{encoding:'utf8',timeout:120000});fs.writeFileSync(log,output);receipt.executableSHA256=hash(exe);receipt.complete=true;save();return{exe,directory,receipt}}
 catch(error){fs.writeFileSync(log,String(error.stdout||'')+String(error.stderr||'')+'\n'+error.stack);receipt.failure={name:error.name,message:error.message,at:new Date().toISOString()};save();throw error}
}
function runNativeReadout(exe,args,{directory,name,timeout=30000}){
 assert(/^[a-z0-9-]+$/.test(name));fs.mkdirSync(directory,{recursive:true})
 const rawFile=path.join(directory,name+'.jsonl'),stderrFile=path.join(directory,name+'.stderr.log'),receiptFile=path.join(directory,name+'.readout.json'),receipt={startedAt:new Date().toISOString(),exe,args,complete:false,scope:'Original native API qualification stdout/stderr/exit only; not product resource acceptance'}
 const save=()=>fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n');assert(!fs.existsSync(rawFile)&&!fs.existsSync(stderrFile)&&!fs.existsSync(receiptFile),'Preserve previous native qualification attempts');save();let stdout='',stderr=''
 try{stdout=execFileSync(exe,args,{encoding:'utf8',timeout,stdio:['ignore','pipe','pipe']});receipt.exit={code:0,signal:null};receipt.complete=true;return stdout}
 catch(error){stdout=String(error.stdout??'');stderr=String(error.stderr??'');receipt.exit={code:error.status??null,signal:error.signal??null};receipt.failure={name:error.name,message:error.message,at:new Date().toISOString()};throw error}
 finally{fs.writeFileSync(rawFile,stdout,{flag:'wx'});fs.writeFileSync(stderrFile,stderr,{flag:'wx'});receipt.finishedAt=new Date().toISOString();receipt.raw={file:rawFile,bytes:Buffer.byteLength(stdout),sha256:hash(rawFile)};receipt.stderr={file:stderrFile,bytes:Buffer.byteLength(stderr),sha256:hash(stderrFile)};save()}
}
function startMacSampler(onRecord,{exe,directory=path.resolve('out/resource113/mac-native'),sudo=process.env.GITHUB_ACTIONS==='true'}={}){
 assert.equal(process.platform,'darwin');assert.equal(process.arch,'arm64');assert(exe&&fs.statSync(exe).isFile(),'Compile the actual native helper first')
 const controlRoot=path.join(directory,'observer-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex'));fs.mkdirSync(controlRoot,{recursive:true})
 const owner=JSON.parse(execFileSync(exe,['--identity',String(process.pid)],{encoding:'utf8',timeout:10000}));assert.equal(owner.pid,process.pid);assert.match(owner.creationUnixUS,/^\d+$/)
 const controlFile=path.join(controlRoot,'control.json'),control={generation:0,phase:'observer-ready',seeds:[],roles:[],stop:false}
 const publish=()=>{const temp=controlFile+'.next';fs.writeFileSync(temp,JSON.stringify(control));fs.renameSync(temp,controlFile)};publish()
 const args=[controlFile,String(process.pid),owner.creationUnixUS],child=spawn(sudo?'/usr/bin/sudo':exe,sudo?['-n','--',exe,...args]:args,{stdio:['ignore','pipe','pipe']});const events=new EventEmitter();let carry='',errorText='',closed=null,settled=false
 const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Native Mac observer readiness timeout: '+errorText)),20000);child.stdout.on('data',buf=>{carry+=buf.toString();let at;while((at=carry.indexOf('\n'))>=0){const line=carry.slice(0,at).trim();carry=carry.slice(at+1);if(!line)continue;let row;try{row=JSON.parse(line)}catch(error){clearTimeout(timer);reject(Error('Invalid native observer JSON: '+line));continue}onRecord?.(row);events.emit(row.event,row);if(row.event==='ready'){settled=true;clearTimeout(timer);resolve(row)}}});child.stderr.on('data',buf=>{errorText+=buf.toString();fs.appendFileSync(path.join(controlRoot,'stderr.log'),buf)});child.once('error',error=>{clearTimeout(timer);reject(error)});child.once('close',(code,signal)=>{closed={code,signal,errorText};clearTimeout(timer);if(!settled)reject(Error('Native Mac observer early exit '+code+': '+errorText));events.emit('exit',closed)})})
 const send=value=>{if(value.op==='seed'){assert(Number.isInteger(value.pid)&&value.pid>0&&Number.isFinite(value.startedAt));control.seeds.push(value)}if(value.op==='role')control.roles.push(value);if(value.op==='mark')control.phase=value.phase;if(value.op==='stop')control.stop=true;control.generation++;publish();return true}
 return{child,ready,events,send,controlRoot,owner,async stop(){if(closed){assert.equal(closed.code,0,errorText);return closed}const done=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Owned native observer did not stop normally')),10000);child.once('close',(code,signal)=>{clearTimeout(timer);code===0?resolve({code,signal,errorText}):reject(Error('Native Mac observer exit '+code+': '+errorText))})});send({op:'stop'});return done}}
}
function percentile(values,p){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);return a.length?a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]:null}
function stats(values){const a=values.filter(Number.isFinite);return{count:a.length,median:percentile(a,.5),p95:percentile(a,.95),sampledPeak:a.length?Math.max(...a):null,min:a.length?Math.min(...a):null}}
const roleGroups=['root','helpers','javaHelpers','ownedTools','Game']
// Input is strictly the native observer's PID/creation-verified owned rows.
// Names split already-owned helpers; they never establish process ownership.
function roleGroup(row){
 if(/^Game(?:\b|-)/.test(row.role))return'Game'
 if(row.role==='native-app-main'||/^Browser(?:$| )/.test(row.role))return'root'
 if(/^java(w)?(?:\.exe)?$/i.test(row.name))return'javaHelpers'
 if(/^(?:terracotta(?:-[\w.-]+)?|voxlink(?:-[\w.-]+)?|frpc)(?:\.exe)?$/i.test(row.name)||/^(?:owned-tool|network-tool)(?:\b|-)/.test(row.role))return'ownedTools'
 if(/^KAMUCL Helper(?:\b| )/i.test(row.name)||/^(?:GPU|Tab|Renderer|Utility|Zygote|Sandbox)(?:\b| )/.test(row.role))return'helpers'
 return'ownedTools'
}
function assertConfirmedLifecycleInvalidation(error,row){
 assert.equal(error.lifecycleInvalidation,true);assert.equal(error.required,false)
 assert(['identity before counters','identity after counters'].includes(error.stage))
 assert(Number.isInteger(error.pid)&&error.pid>0);assert.equal(row.pid,error.pid)
 assert.equal(row.invalidated,true);assert.match(row.creationUnixUS,/^\d+$/)
 assert.equal(error.beforeCreationUnixUS,row.creationUnixUS)
 assert.deepEqual(row.identityInvalidation,error,'Classification must preserve the original identity/error observation')
 assert(Number.isFinite(error.collectionStartUnixMs)&&Number.isFinite(error.atUnixMs)&&error.atUnixMs>=error.collectionStartUnixMs)
 assert.equal(row.collectionStartUnixMs,error.collectionStartUnixMs)
 assert(Array.isArray(error.originalCounterErrors),'Original partial counter errors must remain available')
 assert.equal(error.existenceProbe?.signal,0,'Existence probe must never signal a process')
 const exited=error.afterIdentity===null&&error.existenceProbe.result===-1&&error.existenceProbe.errno===3
 const reused=error.afterIdentity?.pid===error.pid&&typeof error.afterIdentity.creationUnixUS==='string'&&/^\d+$/.test(error.afterIdentity.creationUnixUS)&&error.afterIdentity.creationUnixUS!==row.creationUnixUS
 const kernel=error.kernelExitEvidence!==undefined?(assertKernelExitEvidence(error.kernelExitEvidence,row,error.atUnixMs),true):false
 assert(exited||reused||kernel,'A lifecycle label cannot hide a live or unknown-identity counter failure')
 return error
}
function assertKernelExitEvidence(evidence,row,observedByUnixMs=Infinity){
 assert.equal(evidence.source,'Actual original kqueue EVFILT_PROC NOTE_EXIT notification');assert.equal(evidence.qualified,true);assert.equal(evidence.pid,row.pid)
 const r=evidence.registration,n=evidence.notification,receipt=r?.receipt,token=r?.userDataGeneration
 assert.equal(r?.qualified,true);assert.equal(r.pid,row.pid);assert.equal(r.expectedCreationUnixUS,row.creationUnixUS);assert.match(token,/^[1-9]\d*$/)
 for(const id of[r.beforeIdentity,r.afterIdentity]){assert.equal(id?.pid,row.pid);assert.equal(id.creationUnixUS,row.creationUnixUS,'Registration race cannot bind an unknown or replaced identity')}
 assert(Number.isFinite(r.registrationStartUnixMs)&&Number.isFinite(r.registrationEndUnixMs)&&r.registrationEndUnixMs>=r.registrationStartUnixMs)
 assert.equal(r.request?.filter,-5);assert.equal(r.request.flags,85);assert.equal(r.request.fflags,2147483648);assert.equal(r.request.userDataGeneration,token)
 assert.equal(receipt?.ident,row.pid);assert.equal(receipt.filter,-5);assert.equal(receipt.callResult,1);assert.equal(receipt.systemErrno,0);assert.equal(receipt.data,0);assert.equal(receipt.userDataGeneration,token);assert((receipt.flags&0x4000)!==0,'EV_RECEIPT must contain a successful original EV_ERROR receipt')
 assert(Number.isFinite(receipt.observedAtUnixMs)&&receipt.observedAtUnixMs>=r.registrationStartUnixMs&&receipt.observedAtUnixMs<=r.registrationEndUnixMs)
 assert.equal(n?.ident,row.pid);assert.equal(n.filter,-5);assert.equal(n.userDataGeneration,token);assert(Number.isInteger(n.flags)&&(n.flags&0x4000)===0);assert(Number.isInteger(n.fflags)&&(BigInt(n.fflags)&2147483648n)!==0n,'Actual kernel NOTE_EXIT is mandatory')
 assert(Number.isInteger(n.callResult)&&n.callResult>0&&n.callResult<=64);assert.equal(n.systemErrno,0);assert(Number.isSafeInteger(n.data));assert(Number.isFinite(n.observedAtUnixMs)&&n.observedAtUnixMs>=r.registrationEndUnixMs&&n.observedAtUnixMs<=observedByUnixMs,'Later notifications cannot retroactively erase an earlier sampling failure')
 return evidence
}
function assertNativeCPUUnits(row){
 if(row.cpuSource===undefined)return // Historical raw counters retain their original, unqualified unit labels.
 assert.match(row.cpuSource,/^PROC_PIDTASKINFO Mach absolute ticks converted/)
 const{numer,denom}=row.cpuTimebase??{},task=row.procTaskInfo
 assert(Number.isSafeInteger(numer)&&numer>0&&Number.isSafeInteger(denom)&&denom>0)
 assert(Number.isSafeInteger(task?.totalUserMachTicks)&&task.totalUserMachTicks>=0&&Number.isSafeInteger(task?.totalSystemMachTicks)&&task.totalSystemMachTicks>=0,'Original Mach CPU ticks must be retained')
 const convert=ticks=>BigInt(ticks)*BigInt(numer)/BigInt(denom),expected=convert(task.totalUserMachTicks)+convert(task.totalSystemMachTicks)
 assert(expected<=BigInt(Number.MAX_SAFE_INTEGER),'CPU conversion cannot silently lose integer precision')
 assert.equal(row.cpuNs,Number(expected),'Reported CPU nanoseconds must match original ticks and host timebase')
}
function summarizeMac(records){
 const phases={};for(const sample of records.filter(r=>r.event==='sample')){const phase=phases[sample.phase]??={samples:[],identities:{},counterErrors:[],optionalCounterErrors:[],lifecycleInvalidations:[],invalidatedSamples:[],cpuUnitsQualified:true};const invalidatedRows=sample.invalidatedRows??[],lifecycle=sample.lifecycleInvalidations??[]
  for(const error of lifecycle){const matches=invalidatedRows.filter(row=>row.pid===error.pid&&row.creationUnixUS===error.beforeCreationUnixUS);assert.equal(matches.length,1,'Each lifecycle observation must retain exactly one original invalidated row');assertConfirmedLifecycleInvalidation(error,matches[0])}
  for(const row of invalidatedRows){if(row.identityInvalidation?.lifecycleInvalidation===true)assert(lifecycle.some(error=>JSON.stringify(error)===JSON.stringify(row.identityInvalidation)),'Cannot omit a lifecycle observation');else assert(sample.counterErrors.some(error=>JSON.stringify(error)===JSON.stringify(row.identityInvalidation)),'An unproven identity invalidation must remain a required counter error')}
  if(invalidatedRows.length)phase.invalidatedSamples.push({atUnixMs:sample.atUnixMs,monoMs:sample.monoMs,phase:sample.phase,collectionMs:sample.collectionMs,invalidatedRows,counterErrors:sample.counterErrors,lifecycleInvalidations:lifecycle})
  phase.lifecycleInvalidations.push(...lifecycle)
  const completeFullTree=invalidatedRows.length===0&&sample.counterErrors.length===0&&sample.wholeTreeCountersComplete!==false,totals=Object.fromEntries(roleGroups.map(role=>[role,[]]));for(const row of sample.rows){if(Number.isFinite(row.cpuNs)&&row.cpuSource!==undefined)assertNativeCPUUnits(row);else phase.cpuUnitsQualified=false;const key=row.pid+':'+row.creationUnixUS;(phase.identities[key]??=[]).push(row);totals[roleGroup(row)].push(row)}
  const sum=(rows,key)=>rows.length&&rows.every(r=>Number.isFinite(r[key]))?rows.reduce((n,r)=>n+r[key],0):rows.length?null:0
  phase.samples.push({atUnixMs:sample.atUnixMs,monoMs:sample.monoMs,collectionMs:sample.collectionMs,completeFullTree,physicalFootprintBytes:completeFullTree?sum(sample.rows,'physicalFootprintBytes'):null,residentSizeBytes:completeFullTree?sum(sample.rows,'residentSizeBytes'):null,roles:Object.fromEntries(Object.entries(totals).map(([key,rows])=>[key,{processCount:rows.length,physicalFootprintBytes:completeFullTree?sum(rows,'physicalFootprintBytes'):null,residentSizeBytes:completeFullTree?sum(rows,'residentSizeBytes'):null}]))});phase.counterErrors.push(...sample.counterErrors);phase.optionalCounterErrors.push(...(sample.optionalCounterErrors||[]))
 }
 for(const phase of Object.values(phases)){const samples=phase.samples;phase.sampleCount=samples.length;phase.validFullFootprintSamples=samples.filter(s=>s.roles.root.processCount>0&&Number.isFinite(s.physicalFootprintBytes)).length;phase.physicalFootprintBytes=stats(samples.filter(s=>s.roles.root.processCount>0).map(s=>s.physicalFootprintBytes));phase.residentSizeBytes=stats(samples.filter(s=>s.roles.root.processCount>0).map(s=>s.residentSizeBytes));phase.roles={};for(const role of roleGroups){const observed=samples.some(s=>s.roles[role].processCount>0);phase.roles[role]={observed,physicalFootprintBytes:stats(samples.filter(s=>s.roles[role].processCount>0).map(s=>s.roles[role].physicalFootprintBytes)),residentSizeBytes:stats(samples.filter(s=>s.roles[role].processCount>0).map(s=>s.roles[role].residentSizeBytes)),processCount:stats(samples.map(s=>s.roles[role].processCount)),cpuMs:observed?0:null,pageFaults:observed?0:null,readBytes:observed?0:null,writeBytes:observed?0:null}}phase.cpuMs=0;phase.pageFaults=0;phase.readBytes=0;phase.writeBytes=0
  for(const[key,rows]of Object.entries(phase.identities)){const first=rows[0],last=rows.at(-1),cpuMs=Number.isFinite(last.cpuNs)&&Number.isFinite(first.cpuNs)?(last.cpuNs-first.cpuNs)/1e6:null,faults=Number.isFinite(last.pageFaultCount)&&Number.isFinite(first.pageFaultCount)?last.pageFaultCount-first.pageFaultCount:null,read=Number.isFinite(last.readBytes)&&Number.isFinite(first.readBytes)?last.readBytes-first.readBytes:null,write=Number.isFinite(last.writeBytes)&&Number.isFinite(first.writeBytes)?last.writeBytes-first.writeBytes:null,role=roleGroup(last);phase.identities[key]={pid:first.pid,name:first.name,originalRole:first.role,lastOriginalRole:last.role,creationUnixUS:first.creationUnixUS,role,first,last,cpuMs,pageFaults:faults,readBytes:read,writeBytes:write};for(const [metric,value]of[['cpuMs',cpuMs],['pageFaults',faults],['readBytes',read],['writeBytes',write]]){if(Number.isFinite(value)){if(phase[metric]!==null)phase[metric]+=value;if(phase.roles[role][metric]!==null)phase.roles[role][metric]+=value}else{phase[metric]=null;phase.roles[role][metric]=null}}}
  if(!phase.cpuUnitsQualified){phase.cpuMs=null;for(const role of roleGroups)phase.roles[role].cpuMs=null}
  phase.invalidatedSampleCount=phase.invalidatedSamples.length;phase.unobservedExitCounterTails=phase.lifecycleInvalidations.map(error=>({pid:error.pid,creationUnixUS:error.beforeCreationUnixUS,atUnixMs:error.atUnixMs,terminalCPUObserved:false,classification:'No credit for unavailable terminal CPU/fault/IO counters; only valid observed deltas are reported'}));phase.elapsedMs=samples.length>1?samples.at(-1).atUnixMs-samples[0].atUnixMs:0;phase.actualGapsMs=samples.slice(1).map((s,i)=>s.atUnixMs-samples[i].atUnixMs);phase.collectionMs=stats(samples.map(s=>s.collectionMs));phase.gpuAllocationBytes=null;phase.gpuCounterAvailability='No native process GPU allocation API used; unavailable, not inferred from RSS or footprint';phase.scope='Public proc_pid_rusage kernel ri_phys_footprint and ri_resident_size primary. task_info footprint/resident bytes are optional native cross-checks; taskport failures remain recorded. Confirmed identity exits/reuse retain original partial rows and errors; incomplete whole-tree memory is null and excluded from full samples. CPU nanoseconds require original Mach ticks and actual host timebase; historical unqualified CPU units produce null CPU milliseconds. CPU/fault/IO deltas cover valid observed intervals only, never unavailable terminal counters; short-lived/sub-sample processes and shared-memory double-counting remain limitations.';delete phase.samples
 }return phases
}
async function selfTest({directory=path.resolve('out/resource113/mac-native-self-test')}={}){
 const native=compileNative({directory}),swiftResult=runNativeReadout(native.exe,['--self-test'],{directory,name:'swift-self-test'});const swiftProof=JSON.parse(swiftResult);assert.equal(swiftProof.passed,true);assert.equal(swiftProof.cpuQualification?.passed,true,'Native Mach timebase CPU conversion must agree with original process CPU clock brackets')
 const script='const b=Buffer.alloc(32*1024*1024,17);process.send({ready:true});process.on("message",m=>{if(m==="stop"){if(b[0]!==17)process.exitCode=2;process.disconnect()}})',startedAt=Date.now(),child=spawn(process.execPath,['-e',script],{stdio:['ignore','ignore','pipe','ipc']}),other=spawn(process.execPath,['-e',script],{stdio:['ignore','ignore','pipe','ipc']});const rows=[]
 const childReady=async c=>new Promise((resolve,reject)=>{c.once('message',resolve);c.once('error',reject)});const close=c=>c.exitCode!==null?(assert.equal(c.exitCode,0),Promise.resolve()):new Promise((resolve,reject)=>{c.once('close',(code,signal)=>code===0&&signal===null?resolve():reject(Error('Self-test child exit '+code+' signal '+signal)));c.send('stop')});let sampler
 try{
  await Promise.all([childReady(child),childReady(other)])
  sampler=startMacSampler(row=>{rows.push(row);fs.appendFileSync(path.join(directory,'ownership-self-test.jsonl'),JSON.stringify(row)+'\n')},{...native,sudo:process.env.GITHUB_ACTIONS==='true'})
  await sampler.ready;sampler.send({op:'seed',pid:child.pid,startedAt,role:'owned-qualification-child'});await new Promise(r=>setTimeout(r,1600))
  const samples=rows.filter(r=>r.event==='sample'&&r.rows.length);assert(samples.length>=5);assert(samples.flatMap(s=>s.rows).every(r=>r.pid===child.pid),'Observer must exclude unrelated control child and itself')
  assert(samples.every(s=>s.rows[0].creationUnixUS===samples[0].rows[0].creationUnixUS));assert(samples.every(s=>s.rows[0].physicalFootprintBytes>0&&s.rows[0].residentSizeBytes>0))
  const creation=samples[0].rows[0].creationUnixUS,registration=rows.filter(r=>r.event==='owned-exit-registration')
  assert.equal(registration.length,1);assert.equal(registration[0].registration.pid,child.pid);assert.equal(registration[0].registration.qualified,true)
  sampler.send({op:'mark',phase:'owned-natural-exit-qualification'});await close(child);const naturalExitAwaitedAtUnixMs=Date.now(),deadline=Date.now()+10000
  const{isCompleteEmptyNativeSample}=require('./resource-sample113.cjs')
  while(Date.now()<deadline){const last=rows.filter(r=>r.event==='sample'&&r.phase==='owned-natural-exit-qualification').slice(-2);if(last.length===2&&last.every(isCompleteEmptyNativeSample)&&rows.some(r=>r.event==='owned-kernel-exit'&&r.evidence.pid===child.pid))break;await new Promise(r=>setTimeout(r,50))}
  const exitSamples=rows.filter(r=>r.event==='sample'&&r.phase==='owned-natural-exit-qualification').slice(-2)
  assert.equal(exitSamples.length,2);assert(exitSamples.every(isCompleteEmptyNativeSample),'Kernel lifecycle partial sample cannot be counted as an absent owned tree')
  const kernel=rows.filter(r=>r.event==='owned-kernel-exit'&&r.evidence.pid===child.pid);assert.equal(kernel.length,1);assertKernelExitEvidence(kernel[0].evidence,samples[0].rows[0])
  const retirements=rows.filter(r=>r.event==='owned-identity-retired');assert.equal(retirements.length,1);assert.equal(retirements[0].pid,child.pid);assert.equal(retirements[0].creationUnixUS,creation)
  const invalidated=rows.flatMap(r=>r.event==='sample'?(r.invalidatedRows??[]):[]);assert.equal(invalidated.length,1);assertConfirmedLifecycleInvalidation(invalidated[0].identityInvalidation,invalidated[0]);assert.deepEqual(invalidated[0].identityInvalidation.kernelExitEvidence,kernel[0].evidence)
  assert(rows.filter(r=>r.event==='sample').every(s=>s.counterErrors.length===0),'Unknown live identity, registration or primary counter failures cannot pass qualification');assert.equal(other.exitCode,null,'Unrelated control must remain alive throughout the empty owned tree proof')
  await sampler.stop();const stopped=rows.findLast(r=>r.event==='stopped');assert.equal(stopped.kernelExitObserverClose.closeResult,0);assert.equal(stopped.code,0)
  const exitRaw=runNativeReadout(native.exe,['--inspect-exited-owner',String(child.pid),creation],{directory,name:'owned-exit-self-test',timeout:10000}),exited=JSON.parse(exitRaw)
  assert.equal(exited.passed,true);assert.equal(exited.invalidatedRow.pid,child.pid);assert.equal(exited.invalidatedRow.creationUnixUS,creation);assert.equal(exited.errors.length,1);assertConfirmedLifecycleInvalidation(exited.errors[0],exited.invalidatedRow)
  const result={passed:true,at:new Date().toISOString(),scope:'Native Swift, native CPU-clock unit brackets and strictly owned PID/creation/kernel NOTE_EXIT/natural exit/full empty tree API qualification only; not App resource acceptance',cpuQualification:swiftProof.cpuQualification,ownedNaturalExit:{pid:child.pid,creationUnixUS:creation,code:child.exitCode,signal:child.signalCode,naturalExitAwaitedAtUnixMs,original:exited,kernelNotification:kernel[0],retirement:retirements[0],lastTwoCompleteEmptySamples:exitSamples},kernelExitObserverClose:stopped.kernelExitObserverClose,samples:samples.length,ownedPID:child.pid,excludedControlPID:other.pid,summary:summarizeMac(rows)}
  fs.writeFileSync(path.join(directory,'self-test.json'),JSON.stringify(result,null,2)+'\n');return result
 }
 finally{await Promise.all([close(child),close(other)]);if(sampler&&!rows.some(r=>r.event==='stopped'))await sampler.stop()}
}
module.exports={compileNative,runNativeReadout,startMacSampler,summarizeMac,assertConfirmedLifecycleInvalidation,assertKernelExitEvidence,assertNativeCPUUnits,roleGroup,stats,percentile,selfTest,headerText}
if(require.main===module)selfTest().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1})
