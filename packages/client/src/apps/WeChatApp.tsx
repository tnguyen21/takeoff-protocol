import React from "react";
import type { AppProps } from "./types.js";

const CONVERSATIONS = [
  { name: "研究团队", preview: "李博士：数据已上传至服务器", time: "10:58", unread: 3 },
  { name: "Dr. Zhang Wei", preview: "明天的会议推迟到下午三点", time: "10:32", unread: 0 },
  { name: "项目Alpha", preview: "[文件] 技术报告_v3.pdf", time: "09:15", unread: 0 },
  { name: "Chen Fang", preview: "好的，我明白了", time: "昨天", unread: 0 },
  { name: "国家AI办公室", preview: "请于周五前提交进展报告", time: "昨天", unread: 1 },
];

const MESSAGES = [
  { sent: false, text: "李博士，最新的基准测试结果已经出来了", time: "10:45" },
  { sent: false, text: "性能超出预期 — 建议立即上报", time: "10:46" },
  { sent: true, text: "收到。与美方差距如何？", time: "10:50" },
  { sent: false, text: "约差6个月，但我们的加速度更快", time: "10:52" },
  { sent: true, text: "好。先不要对外分享这个数据", time: "10:54" },
  { sent: false, text: "数据已上传至服务器", time: "10:58" },
];

export const WeChatApp = React.memo(function WeChatApp(_: AppProps) {
  return (
    <div className="flex h-full bg-[#1e1e1e] text-white text-sm">
      {/* Icon strip */}
      <div className="w-12 bg-[#191919] flex flex-col items-center py-3 gap-5 shrink-0 border-r border-white/10">
        {["💬", "👥", "🔍", "⚙️"].map((icon, i) => (
          <button key={i} className={`text-lg ${i === 0 ? "opacity-100" : "opacity-40"}`}>{icon}</button>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 flex flex-col shrink-0">
        <div className="p-2 border-b border-white/10">
          <div className="bg-[#2a2a2a] rounded px-2 py-1 text-neutral-500 text-xs">搜索</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {CONVERSATIONS.map((c) => (
            <div
              key={c.name}
              className={`flex items-start gap-2 px-3 py-2.5 border-b border-white/5 cursor-pointer hover:bg-white/5 ${c.name === "研究团队" ? "bg-white/10" : ""}`}
            >
              <div className="w-8 h-8 rounded bg-green-700 flex items-center justify-center text-xs font-bold shrink-0 relative">
                {c.name[0]}
                {c.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center text-[9px]">
                    {c.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <span className="text-xs font-medium truncate">{c.name}</span>
                  <span className="text-[10px] text-neutral-500">{c.time}</span>
                </div>
                <p className="text-[10px] text-neutral-500 truncate">{c.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
          <span className="font-semibold text-sm">研究团队</span>
          <span className="text-neutral-500 text-xs ml-2">3 members</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#1a1a1a]">
          {MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.sent ? "justify-end" : "justify-start"}`}>
              {!m.sent && (
                <div className="w-7 h-7 rounded bg-green-700 flex items-center justify-center text-xs font-bold shrink-0 mr-2 self-end">
                  李
                </div>
              )}
              <div
                className={`max-w-[65%] rounded px-3 py-2 text-xs leading-relaxed relative ${
                  m.sent
                    ? "bg-[#26b26c] text-white"
                    : "bg-[#2a2a2a] text-neutral-200"
                }`}
              >
                <p>{m.text}</p>
                <p className="text-[10px] mt-1 opacity-60 text-right">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/10 shrink-0">
          <div className="bg-[#2a2a2a] rounded px-3 py-2 text-neutral-500 text-xs border border-white/10">
            输入消息...
          </div>
        </div>
      </div>
    </div>
  );
});
