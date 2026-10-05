// QA-only read-only observer. Compile with the system libproc/mach bridging
// header created by resource-mac113-native.cjs. No process signals or VM writes.
import Foundation
import Darwin

func emit(_ value: [String: Any]) {
    do {
        let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
        FileHandle.standardOutput.write(data)
        FileHandle.standardOutput.write(Data([10]))
    } catch { fputs("observer JSON failure: \(error)\n", stderr); exit(2) }
}
func epochMs() -> Double { Date().timeIntervalSince1970 * 1000 }
func monoMs() -> Double { Double(DispatchTime.now().uptimeNanoseconds) / 1_000_000 }
struct Identity {
    let pid: Int32, ppid: Int32, creationUS: UInt64, name: String
    var creationUnixMs: Double { Double(creationUS) / 1000 }
}
func identity(_ pid: Int32) -> Identity? {
    var info = proc_bsdinfo()
    let size = Int32(MemoryLayout<proc_bsdinfo>.size)
    guard proc_pidinfo(pid, PROC_PIDTBSDINFO, 0, &info, size) == size else { return nil }
    var name = [CChar](repeating: 0, count: 128)
    let nameSize = UInt32(name.count)
    _ = proc_name(pid, &name, nameSize)
    return Identity(pid: pid, ppid: Int32(info.pbi_ppid),
                    creationUS: info.pbi_start_tvsec * 1_000_000 + info.pbi_start_tvusec,
                    name: String(cString: name))
}
func processTable() -> [Identity] {
    var capacity = max(256, Int(proc_listallpids(nil, 0)) + 256)
    while capacity <= 131_072 {
        var ids = [Int32](repeating: 0, count: capacity)
        let byteCount = Int32(ids.count * MemoryLayout<Int32>.size)
        let count = Int(proc_listallpids(&ids, byteCount))
        if count < 0 { return [] }
        if count >= capacity { capacity *= 2; continue }
        return ids.prefix(count).filter { $0 > 0 }.compactMap(identity)
    }
    return []
}
func counters(_ own: Identity, role: String) -> ([String: Any], [[String: Any]]) {
    var row: [String: Any] = ["pid": own.pid, "ppid": own.ppid, "name": own.name,
        "creationUnixMs": own.creationUnixMs, "creationUnixUS": String(own.creationUS), "role": role,
        "physicalFootprintBytes": NSNull(), "residentSizeBytes": NSNull(),
        "residentSizeMaxBytes": NSNull(), "virtualSizeBytes": NSNull(), "cpuNs": NSNull(),
        "pageFaultCount": NSNull(), "pageins": NSNull(), "readBytes": NSNull(), "writeBytes": NSNull()]
    var errors: [[String: Any]] = []
    var task = mach_port_t(MACH_PORT_NULL)
    let isSelf = own.pid == getpid()
    let portResult = isSelf ? KERN_SUCCESS : task_for_pid(mach_task_self_, own.pid, &task)
    if isSelf { task = mach_task_self_ }
    row["taskForPIDResult"] = portResult
    if portResult == KERN_SUCCESS {
        defer { if !isSelf { _ = mach_port_deallocate(mach_task_self_, task) } }
        var basic = mach_task_basic_info_data_t()
        var basicCount = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info_data_t>.size / MemoryLayout<integer_t>.size)
        let basicCapacity = Int(basicCount)
        let basicResult = withUnsafeMutablePointer(to: &basic) {
            $0.withMemoryRebound(to: integer_t.self, capacity: basicCapacity) {
                task_info(task, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &basicCount)
            }
        }
        row["machTaskBasicInfoResult"] = basicResult; row["machTaskBasicInfoCount"] = basicCount
        if basicResult == KERN_SUCCESS {
            row["machTaskBasicInfoResidentSizeBytes"] = basic.resident_size
            row["residentSizeMaxBytes"] = basic.resident_size_max
            row["virtualSizeBytes"] = basic.virtual_size
        } else { errors.append(["pid": own.pid, "stage": "MACH_TASK_BASIC_INFO", "kernResult": basicResult, "required": false]) }
        var vm = task_vm_info_data_t()
        var vmCount = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
        let vmCapacity = Int(vmCount)
        let vmResult = withUnsafeMutablePointer(to: &vm) {
            $0.withMemoryRebound(to: integer_t.self, capacity: vmCapacity) {
                task_info(task, task_flavor_t(TASK_VM_INFO), $0, &vmCount)
            }
        }
        row["taskVMInfoResult"] = vmResult; row["taskVMInfoCount"] = vmCount
        if vmResult == KERN_SUCCESS && vmCount >= RESOURCE_TASK_VM_INFO_REV1_COUNT113 {
            row["taskVMInfoPhysicalFootprintBytes"] = vm.phys_footprint
            row["taskVMInfo"] = ["residentSize": vm.resident_size, "residentSizePeak": vm.resident_size_peak,
                "internal": vm.internal, "external": vm.external, "reusable": vm.reusable,
                "compressed": vm.compressed, "compressedPeak": vm.compressed_peak,
                "physFootprint": vm.phys_footprint]
        } else { errors.append(["pid": own.pid, "stage": "TASK_VM_INFO physical footprint cross-check", "kernResult": vmResult, "returnedCount": vmCount, "required": false]) }
    } else { errors.append(["pid": own.pid, "stage": "task_for_pid", "kernResult": portResult, "required": false,
                            "error": "Optional task_info cross-check unavailable; actual proc_pid_rusage physical footprint remains primary"] ) }
    var procTask = proc_taskinfo()
    let taskSize = Int32(MemoryLayout<proc_taskinfo>.size)
    if proc_pidinfo(own.pid, PROC_PIDTASKINFO, 0, &procTask, taskSize) == taskSize {
        row["cpuNs"] = procTask.pti_total_user + procTask.pti_total_system
        row["pageFaultCount"] = Int64(procTask.pti_faults); row["pageins"] = Int64(procTask.pti_pageins)
        row["procTaskInfo"] = ["totalUserNs": procTask.pti_total_user, "totalSystemNs": procTask.pti_total_system,
            "cowFaults": procTask.pti_cow_faults, "contextSwitches": procTask.pti_csw,
            "threads": procTask.pti_threadnum, "runningThreads": procTask.pti_numrunning]
    } else { errors.append(["pid": own.pid, "stage": "PROC_PIDTASKINFO", "errno": errno]) }
    var usage = rusage_info_v2()
    let usageResult = resource_pid_rusage113(own.pid, &usage)
    row["procRusageResult"] = usageResult
    if usageResult == 0 {
        row["readBytes"] = usage.ri_diskio_bytesread; row["writeBytes"] = usage.ri_diskio_byteswritten
        // Both native APIs report the kernel physical footprint. Public libproc
        // is primary because a signed app may deny an external task port.
        // It is never replaced by RSS, JS heap, reserved virtual bytes or zero.
        row["physicalFootprintBytes"] = usage.ri_phys_footprint
        row["residentSizeBytes"] = usage.ri_resident_size
        row["physicalFootprintSource"] = "proc_pid_rusage RUSAGE_INFO_V2 ri_phys_footprint"
        row["residentSizeSource"] = "proc_pid_rusage RUSAGE_INFO_V2 ri_resident_size"
        row["procRusagePhysicalFootprintBytes"] = usage.ri_phys_footprint
        row["procRusageResidentSizeBytes"] = usage.ri_resident_size
    } else { errors.append(["pid": own.pid, "stage": "proc_pid_rusage disk IO", "errno": errno]) }
    guard let after = identity(own.pid), after.creationUS == own.creationUS else {
        return (["pid": own.pid, "creationUnixUS": String(own.creationUS), "invalidated": true],
                [["pid": own.pid, "stage": "identity after counters", "error": "Process exited or PID reused during collection; row excluded"]])
    }
    return (row, errors)
}
if CommandLine.arguments.count == 3 && CommandLine.arguments[1] == "--identity",
   let pid = Int32(CommandLine.arguments[2]), let row = identity(pid) {
    emit(["pid": row.pid, "ppid": row.ppid, "name": row.name,
          "creationUnixUS": String(row.creationUS), "creationUnixMs": row.creationUnixMs]); exit(0)
}
if CommandLine.arguments.contains("--self-test") {
    guard let own = identity(getpid()) else { emit(["event": "self-test", "passed": false, "reason": "self identity unavailable"]); exit(1) }
    let (before, beforeErrors) = counters(own, role: "native-self-test")
    let bytes = 32 * 1024 * 1024
    let allocation = UnsafeMutableRawPointer.allocate(byteCount: bytes, alignment: 4096)
    allocation.initializeMemory(as: UInt8.self, repeating: 13, count: bytes)
    let (after, afterErrors) = counters(own, role: "native-self-test")
    let requiredErrors = (beforeErrors + afterErrors).filter { $0["required"] as? Bool != false }
    let passed = requiredErrors.isEmpty && (after["physicalFootprintBytes"] as? UInt64 ?? 0) > 0 &&
        (after["residentSizeBytes"] as? UInt64 ?? 0) > 0 && identity(getpid())?.creationUS == own.creationUS
    emit(["event": "self-test", "passed": passed, "scope": "Native compiler/API and own PID identity qualification only, not launcher performance",
          "atUnixMs": epochMs(), "before": before, "after": after, "errors": beforeErrors + afterErrors,
          "touchedAllocationBytes": bytes, "firstByte": allocation.load(as: UInt8.self)])
    allocation.deallocate(); exit(passed ? 0 : 1)
}
guard CommandLine.arguments.count == 4, let ownerPID = Int32(CommandLine.arguments[2]),
      let ownerCreation = UInt64(CommandLine.arguments[3]), identity(ownerPID)?.creationUS == ownerCreation else {
    fputs("Expected control JSON, actual owner PID and native creation microseconds\n", stderr); exit(2)
}
let controlFile = CommandLine.arguments[1], started = monoMs()
var generation: Int = -1, phase = "observer-ready", seeds: [Int32: Double] = [:], roles: [Int32: String] = [:]
var known: [Int32: Identity] = [:], stopping = false
emit(["event": "ready", "observerPid": getpid(), "atUnixMs": epochMs(),
      "counter": "proc_pid_rusage ri_phys_footprint and ri_resident_size primary; optional task_info MACH_TASK_BASIC_INFO + TASK_VM_INFO cross-check; proc_pidinfo creation and cumulative CPU/faults",
      "intervalRequestedMs": 100, "writesToTarget": false, "gpuCounter": "No process GPU allocation API used; not available"])
while !stopping {
    if identity(ownerPID)?.creationUS != ownerCreation { stopping = true; break }
    if monoMs() - started > 900_000 { emit(["event": "observer-error", "error": "Per-session observer time limit exceeded"]); exit(3) }
    do {
        let data = try Data(contentsOf: URL(fileURLWithPath: controlFile))
        if let command = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let nextGeneration = command["generation"] as? Int, nextGeneration != generation {
            generation = nextGeneration; phase = command["phase"] as? String ?? phase
            for seed in command["seeds"] as? [[String: Any]] ?? [] {
                if let pid = seed["pid"] as? Int32, let date = seed["startedAt"] as? Double { seeds[pid] = date; roles[pid] = seed["role"] as? String }
            }
            for role in command["roles"] as? [[String: Any]] ?? [] {
                if let pid = role["pid"] as? Int32 { roles[pid] = role["role"] as? String }
            }
            stopping = command["stop"] as? Bool ?? false
        }
    } catch { emit(["event": "control-error", "atUnixMs": epochMs(), "error": String(describing: error)]) }
    if stopping { break }
    let sampleStart = monoMs(), table = processTable()
    var observed: [Int32: Identity] = [:], errors: [[String: Any]] = []
    for row in table {
        if let old = known[row.pid] {
            if old.creationUS == row.creationUS { observed[row.pid] = row }
            else { errors.append(["pid": row.pid, "stage": "identity", "error": "Known PID reused; refusing to rebind", "oldCreationUS": String(old.creationUS), "newCreationUS": String(row.creationUS)]) }
        } else if let launch = seeds[row.pid] {
            if row.creationUnixMs >= launch - 2 && row.creationUnixMs <= epochMs() {
                known[row.pid] = row; observed[row.pid] = row
            } else { errors.append(["pid": row.pid, "stage": "seed identity", "error": "Seed predates this owned launch", "creationUnixMs": row.creationUnixMs, "launchUnixMs": launch]) }
        }
    }
    var changed = true
    while changed {
        changed = false
        for row in table where observed[row.pid] == nil && known[row.pid] == nil {
            if let parent = observed[row.ppid], row.creationUS >= parent.creationUS {
                known[row.pid] = row; observed[row.pid] = row; changed = true
            }
        }
    }
    var rows: [[String: Any]] = []
    for row in observed.values.sorted(by: { $0.pid < $1.pid }) {
        // Java version probes are helpers. Only an explicitly observed actual
        // Game launch may receive a Game role; the executable name is not proof.
        let (result, failures) = counters(row, role: roles[row.pid] ?? "unclassified-owned-descendant")
        errors += failures; if result["invalidated"] as? Bool != true { rows.append(result) }
    }
    emit(["event": "sample", "atUnixMs": epochMs(), "monoMs": monoMs() - started,
          "phase": phase, "collectionMs": monoMs() - sampleStart, "rows": rows,
          "counterErrors": errors.filter { $0["required"] as? Bool != false },
          "optionalCounterErrors": errors.filter { $0["required"] as? Bool == false }])
    usleep(100_000)
}
let identities = known.values.sorted(by: { $0.pid < $1.pid }).map {
    ["pid": $0.pid, "ppid": $0.ppid, "name": $0.name, "creationUnixUS": String($0.creationUS), "creationUnixMs": $0.creationUnixMs] as [String: Any]
}
emit(["event": "stopped", "observerPid": getpid(), "atUnixMs": epochMs(), "ownedIdentities": identities])
