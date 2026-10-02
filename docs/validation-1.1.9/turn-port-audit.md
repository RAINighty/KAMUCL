# 本地 TURN 测试端口分配审计

记录时间：2026-10-02 19:54（Asia/Hong_Kong）。这次仅修改测试夹具的双协议端口预留顺序，未修改 TURN 或 VoxLink 生产实现。

动作呈现修复后的全量回归为643/644，失败发生在 TURN 测试设置阶段：UDP bind 返回 EACCES，地址127.0.0.1、端口56548。没有进入 ROLE_CONFLICT、UDP blackhole 或 TCP fallback 的产品验证段落。原始结果保留为失败，耗时83358.7187 ms。

本机 Windows 的 UDP 排除列表包含56516–56615，56548在其中。TCP和UDP的端口排除不同；夹具原先让TCP自动选择端口，再绑定UDP同号端口，即使TCP成功也不代表UDP允许。原失败没有保存各次候选端口，不推断全部重试的具体序列。

修改后先让UDP以port0申请允许的端口，再预留TCP同号端口；继续保留双协议失败重试、原3次UDP握手/1次TCP握手以及碎片响应、取消和释放断言。没有修改系统端口排除，没有占用或结束其他进程。定向复验8/8，原始耗时5978.9645 ms。最终全量结果另见本版本发行报告。

原始证据：out/test-119-presentation-queue.log、out/udp-exclusions-119-1952.log、out/test-119-turn-udp-first.log。交接材料保留前两项历史失败及排除列表；实际联网联机验证不由此本地夹具替代。
