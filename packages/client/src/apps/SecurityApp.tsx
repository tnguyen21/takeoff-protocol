import React from "react";
import type { AppProps } from "./types.js";

const ALERTS = [
  {
    severity: "critical",
    title: "Unusual access pattern — Research cluster",
    detail: "3 failed auth attempts + successful login from TOR exit node. Account: r.hayes@ob.internal",
    time: "11:02:14",
  },
  {
    severity: "high",
    title: "Model weight exfiltration attempt blocked",
    detail: "DLP rule triggered: large binary transfer to external S3 endpoint intercepted. Source: workstation WS-0442.",
    time: "10:48:02",
  },
  {
    severity: "medium",
    title: "Certificate mismatch — Internal API gateway",
    detail: "Cert CN does not match expected hostname on api-internal.ob.net. Possible MITM.",
    time: "10:31:17",
  },
  {
    severity: "low",
    title: "SSH brute force (automated)",
    detail: "128 failed login attempts from 192.168.44.201. Auto-blocked after threshold.",
    time: "09:55:44",
  },
  {
    severity: "info",
    title: "Scheduled maintenance window completed",
    detail: "Cluster A patched to kernel 6.8.2. All nodes online.",
    time: "09:00:00",
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: "border-red-500 bg-red-500/10",
  high: "border-orange-500 bg-orange-500/10",
  medium: "border-yellow-500 bg-yellow-500/10",
  low: "border-blue-500 bg-blue-500/10",
  info: "border-neutral-600 bg-neutral-800/50",
};

const SEV_BADGE: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-600 text-white",
  medium: "bg-yellow-600 text-black",
  low: "bg-blue-600 text-white",
  info: "bg-neutral-700 text-neutral-300",
};

export const SecurityApp = React.memo(function SecurityApp({ content }: AppProps) {
  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white text-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <div className="font-bold text-base">Security Operations Center</div>
          <div className="text-neutral-500 text-xs">OpenBrain Internal · Level 3 Access</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-500">Security Level:</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={`w-5 h-5 rounded text-center text-[10px] font-bold ${n <= 3 ? "bg-yellow-600 text-black" : "bg-neutral-700 text-neutral-500"}`}>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 border-b border-white/10 shrink-0">
        {[
          { label: "Active Alerts", value: "5", color: "text-red-400" },
          { label: "Critical", value: "1", color: "text-red-500" },
          { label: "High", value: "1", color: "text-orange-400" },
          { label: "Last Scan", value: "4m ago", color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 border-r border-white/10 last:border-r-0">
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-neutral-500 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Intel alerts from game content */}
        {content.filter((i) => i.type === "document" || i.type === "message").map((item) => (
          <div key={item.id} className={`border rounded p-3 ${SEV_COLORS.high}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${SEV_BADGE.high}`}>
                  INTEL
                </span>
                <div>
                  <div className="text-xs font-semibold text-neutral-200">{item.subject ?? item.sender ?? "Security Alert"}</div>
                  <div className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{item.body}</div>
                </div>
              </div>
              <span className="text-[10px] text-neutral-600 font-mono shrink-0">{item.timestamp}</span>
            </div>
          </div>
        ))}
        {ALERTS.map((a, i) => (
          <div key={i} className={`border rounded p-3 ${SEV_COLORS[a.severity]}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${SEV_BADGE[a.severity]}`}>
                  {a.severity}
                </span>
                <div>
                  <div className="text-xs font-semibold text-neutral-200">{a.title}</div>
                  <div className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{a.detail}</div>
                </div>
              </div>
              <span className="text-[10px] text-neutral-600 font-mono shrink-0">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
