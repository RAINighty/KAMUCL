// Sends Cocoa window actions only to the JVM owned by this launcher's GameSession.
// GLFW's applicationShouldTerminate turns a normal quit into window-close requests.
import AppKit
import Quartz

guard CommandLine.arguments.count == 4,
      let pid = Int32(CommandLine.arguments[2]), pid > 1,
      let timeout = Double(CommandLine.arguments[3]) else { exit(2) }
let action = CommandLine.arguments[1]
let deadline = Date().addingTimeInterval(timeout / 1000)
repeat {
    guard let game = NSRunningApplication(processIdentifier: pid), !game.isTerminated else { exit(0) }
    let windows = CGWindowListCopyWindowInfo([.optionAll, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
    let hasWindow = windows.contains { ($0[kCGWindowOwnerPID as String] as? Int32) == pid && ($0[kCGWindowLayer as String] as? Int) == 0 }
    if hasWindow {
        if action == "close" {
            if game.terminate() { exit(0) } // Never forceTerminate, kill or an accessibility keystroke.
        } else if action == "focus" {
            _ = game.unhide()
            _ = game.activate(options: [.activateIgnoringOtherApps, .activateAllWindows])
            if game.isActive { exit(0) }
        } else { exit(2) }
    }
    RunLoop.current.run(until: Date().addingTimeInterval(0.1))
} while Date() < deadline
fputs("Minecraft 窗口操作未响应；请在游戏内保存并退出，不会自动强杀。\n", stderr)
exit(1)
