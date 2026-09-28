// Native desktop-composition fixture, used only on disposable macOS CI runners.
import AppKit
import Quartz

if CommandLine.arguments.count == 2 && CommandLine.arguments[1] == "--front-pid" {
    print(NSWorkspace.shared.frontmostApplication?.processIdentifier ?? -1)
    exit(0)
}

// Targeted input for the disposable integration-test game, never the user's desktop.
if CommandLine.arguments.count == 5 && CommandLine.arguments[1] == "--click" {
    guard ProcessInfo.processInfo.environment["GITHUB_ACTIONS"] == "true",
          let pid = Int32(CommandLine.arguments[2]),
          let x = Double(CommandLine.arguments[3]), let y = Double(CommandLine.arguments[4]) else { exit(2) }
    for kind in [CGEventType.leftMouseDown, CGEventType.leftMouseUp] {
        let event = CGEvent(mouseEventSource: nil, mouseType: kind, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)!
        event.postToPid(pid)
        Thread.sleep(forTimeInterval: 0.1)
    }
    exit(0)
}

if CommandLine.arguments.count > 2 && CommandLine.arguments[1] == "--window-id" {
    let pid = Int32(CommandLine.arguments[2])!
    let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
    if let window = windows.first(where: { ($0[kCGWindowOwnerPID as String] as? Int32) == pid && ($0[kCGWindowLayer as String] as? Int) == 0 }) {
        let result: [String: Any] = ["id": window[kCGWindowNumber as String]!, "bounds": window[kCGWindowBounds as String]!, "screenWidth": NSScreen.main!.frame.width, "reducedTransparency": NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency]
        print(String(data: try! JSONSerialization.data(withJSONObject: result), encoding: .utf8)!)
        exit(0)
    }
    exit(1)
}
let control = CommandLine.arguments[1]
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let window = NSWindow(contentRect: NSScreen.main!.frame, styleMask: .borderless, backing: .buffered, defer: false)
window.isOpaque = true
window.backgroundColor = .black
window.ignoresMouseEvents = true
window.orderBack(nil)
var last = ""
let timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
    let state = (try? String(contentsOfFile: control, encoding: .utf8)) ?? "black"
    if state != last {
        let parts = state.split(separator: "|")
        window.backgroundColor = parts.first == "white" ? .white : .black
        if parts.count > 1, let target = Int(parts[1]) { window.order(.below, relativeTo: target) }
        last = state
        window.display()
    }
}
app.run()
