import React, { useState } from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { computeSecLevel, filterAlerts, toggleAlertExpand } from "./securityUtils.js";
import type { SecurityAlert } from "./securityUtils.js";

// Re-export helpers so external tests can also import from SecurityApp
export { computeSecLevel, filterAlerts, toggleAlertExpand } from "./securityUtils.js";

// ── Static Alerts ──

const STATIC_ALERTS: SecurityAlert[] = [
  {
    id: "a1",
    severity: "critical",
    title: "Unusual access pattern — Research cluster",
    detail: "3 failed auth attempts + successful login from TOR exit node. Account: r.hayes@ob.internal",
    time: "11:02:14",
    sourceIp: "185.220.101.45",
    destIp: "10.8.4.22",
    ruleId: "SOC-4021",
    mitre: "T1090 Proxy · T1078 Valid Accounts",
  },
  {
    id: "a2",
    severity: "high",
    title: "Model weight exfiltration attempt blocked",
    detail: "DLP rule triggered: large binary transfer to external S3 endpoint intercepted. Source: workstation WS-0442.",
    time: "10:48:02",
    sourceIp: "10.8.12.42",
    destIp: "52.217.33.18",
    ruleId: "DLP-0188",
    mitre: "T1567 Exfil Over Web Service",
  },
  {
    id: "a3",
    severity: "critical",
    title: "Lateral movement — research VLAN",
    detail: "SMB share enumeration followed by credential use across 4 hosts in research VLAN. Originating from compromised WS-0442.",
    time: "10:51:33",
    sourceIp: "10.8.12.42",
    destIp: "10.8.12.0/24",
    ruleId: "SOC-4109",
    mitre: "T1021 Remote Services · T1550 Use Alternate Auth",
  },
  {
    id: "a4",
    severity: "high",
    title: "Privilege escalation — training pipeline host",
    detail: "SUID binary executed as root on gpu-train-04. Process lineage: bash → sudo → python3. UID changed: 1002 → 0.",
    time: "10:22:58",
    sourceIp: "10.8.16.4",
    destIp: "—",
    ruleId: "EDR-2210",
    mitre: "T1548 Abuse Elevation Control Mechanism",
  },
  {
    id: "a5",
    severity: "high",
    title: "Insider threat indicator — bulk data download",
    detail: "User m.chen downloaded 18 GB from research fileshare outside normal hours (02:14 UTC). No prior bulk activity on record.",
    time: "02:14:08",
    sourceIp: "10.8.9.14",
    destIp: "10.8.40.3",
    ruleId: "DLP-0195",
    mitre: "T1048 Exfiltration Over Alt Protocol",
  },
  {
    id: "a6",
    severity: "medium",
    title: "Certificate mismatch — Internal API gateway",
    detail: "Cert CN does not match expected hostname on api-internal.ob.net. Possible MITM.",
    time: "10:31:17",
    sourceIp: "10.0.0.1",
    destIp: "10.0.2.15",
    ruleId: "PKI-0031",
    mitre: "T1557 Adversary-in-the-Middle",
  },
  {
    id: "a7",
    severity: "medium",
    title: "Anomalous DNS queries — C2 pattern",
    detail: "Host WS-0099 generating high-entropy subdomain queries matching DGA pattern. 213 unique subdomains in 10 min.",
    time: "10:15:22",
    sourceIp: "10.8.7.99",
    destIp: "8.8.8.8",
    ruleId: "DNS-0045",
    mitre: "T1568 Dynamic Resolution",
  },
  {
    id: "a8",
    severity: "medium",
    title: "Unexpected outbound connection — GPU cluster",
    detail: "gpu-train-07 initiated outbound connection to 198.51.100.88:4444. Not in allowlist. Connection dropped by firewall.",
    time: "11:17:03",
    sourceIp: "10.8.16.7",
    destIp: "198.51.100.88",
    ruleId: "FW-0882",
    mitre: "T1071 App Layer Protocol",
  },
  {
    id: "a9",
    severity: "low",
    title: "SSH brute force (automated)",
    detail: "128 failed login attempts from 192.168.44.201. Auto-blocked after threshold.",
    time: "09:55:44",
    sourceIp: "192.168.44.201",
    destIp: "10.8.0.5",
    ruleId: "IDS-1002",
    mitre: "T1110 Brute Force",
  },
  {
    id: "a10",
    severity: "low",
    title: "Outdated TLS version on external endpoint",
    detail: "api-ext.ob.net still accepting TLS 1.0. Flagged by vulnerability scanner run 08:30 UTC.",
    time: "08:30:11",
    sourceIp: "—",
    destIp: "203.0.113.44",
    ruleId: "VULN-3301",
    mitre: "T1040 Network Sniffing",
  },
  {
    id: "a11",
    severity: "info",
    title: "New service account created",
    detail: "SA 'svc-evals-pipeline' provisioned by admin.porter via IAM console. Principle of least privilege applied.",
    time: "07:45:00",
    sourceIp: "—",
    destIp: "—",
    ruleId: "IAM-0044",
    mitre: "—",
  },
  {
    id: "a12",
    severity: "info",
    title: "Scheduled maintenance window completed",
    detail: "Cluster A patched to kernel 6.8.2. All nodes online.",
    time: "09:00:00",
    sourceIp: "—",
    destIp: "—",
    ruleId: "MAINT-007",
    mitre: "—",
  },
];

// ── Severity styling ──

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

const SEV_LABEL: Record<string, string> = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
  info: "INFO",
};

const FILTER_PILLS = ["CRIT", "HIGH", "MED", "LOW", "INFO"];

// ── Component ──

export const SecurityApp = React.memo(function SecurityApp({ content }: AppProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stateView = useGameStore((s) => s.stateView);
  const selectedFaction = useGameStore((s) => s.selectedFaction);

  const secLevel = computeSecLevel(stateView, selectedFaction);

  // Dynamic critical alert when weight theft progress is visible and above threshold
  const theftField = stateView?.chinaWeightTheftProgress;
  const showTheftAlert = theftField?.accuracy !== "hidden" && (theftField?.value ?? 0) > 50;

  const dynamicAlerts: SecurityAlert[] = showTheftAlert
    ? [
        {
          id: "dyn-theft",
          severity: "critical",
          title: "Anomalous data egress patterns detected on research subnet",
          detail: `Sustained high-volume outbound transfer from research cluster to unclassified external endpoints. Estimated artifact size: ${Math.round((theftField?.value ?? 50) * 0.8)} GB. Possible model weight exfiltration in progress. Immediate investigation required.`,
          time: "LIVE",
          sourceIp: "10.8.16.0/20",
          destIp: "UNKNOWN EXTERNAL",
          ruleId: "DLP-0201",
          mitre: "T1537 Transfer Data to Cloud Account",
        },
      ]
    : [];

  const allAlerts = [...dynamicAlerts, ...STATIC_ALERTS];
  const visibleAlerts = filterAlerts(allAlerts, activeFilter);

  const critCount = allAlerts.filter((a) => a.severity === "critical").length;
  const highCount = allAlerts.filter((a) => a.severity === "high").length;

  const orgName =
    selectedFaction === "prometheus"
      ? "Prometheus Internal"
      : selectedFaction === "china"
        ? "CDZ Internal"
        : "OpenBrain Internal";

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white text-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <div className="font-bold text-base">Security Operations Center</div>
          <div className="text-neutral-500 text-xs">{orgName} · Level 3 Access</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-neutral-500">Security Level:</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= secLevel;
              const colorClass = active
                ? n >= 4
                  ? "bg-red-600 text-white"
                  : n === 3
                    ? "bg-yellow-600 text-black"
                    : "bg-green-700 text-white"
                : "bg-neutral-700 text-neutral-500";
              return (
                <div
                  key={n}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${colorClass}`}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 border-b border-white/10 shrink-0">
        {[
          { label: "Active Alerts", value: String(allAlerts.length), color: "text-red-400" },
          { label: "Critical", value: String(critCount), color: "text-red-500" },
          { label: "High", value: String(highCount), color: "text-orange-400" },
          { label: "Last Scan", value: "2m ago", color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 border-r border-white/10 last:border-r-0">
            <div className={`text-xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-neutral-500 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Severity filter pills */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-white/10 shrink-0 flex-wrap">
        <button
          onClick={() => setActiveFilter(null)}
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide transition-colors ${
            activeFilter === null ? "bg-white text-black" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          ALL
        </button>
        {FILTER_PILLS.map((f) => {
          const isActive = activeFilter === f;
          const sev = f === "CRIT" ? "critical" : f === "HIGH" ? "high" : f === "MED" ? "medium" : f === "LOW" ? "low" : "info";
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(isActive ? null : f)}
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide transition-colors ${
                isActive ? SEV_BADGE[sev] : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Intel alerts from game content */}
        {content
          .filter((i) => i.type === "document" || i.type === "message")
          .map((item) => (
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

        {/* Security alerts */}
        {visibleAlerts.map((a) => {
          const isExpanded = expandedId === a.id;
          const isCritical = a.severity === "critical";
          return (
            <div
              key={a.id}
              className={`border rounded overflow-hidden cursor-pointer relative ${SEV_COLORS[a.severity]}`}
              onClick={() => setExpandedId(toggleAlertExpand(expandedId, a.id))}
            >
              {/* Pulsing left border accent for critical alerts */}
              {isCritical && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse rounded-l" />}
              <div className={`p-3 ${isCritical ? "pl-4" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${SEV_BADGE[a.severity]}`}>
                      {SEV_LABEL[a.severity]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-200">{a.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{a.detail}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-neutral-600 font-mono tabular-nums">{a.time}</span>
                    <span className="text-neutral-500 text-[10px]">{isExpanded ? "▲" : "▶"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-[10px]">
                      <span className="text-neutral-500">Source IP: </span>
                      <span className="font-mono text-neutral-300">{a.sourceIp}</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-neutral-500">Dest IP: </span>
                      <span className="font-mono text-neutral-300">{a.destIp}</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-neutral-500">Rule ID: </span>
                      <span className="font-mono text-neutral-300">{a.ruleId}</span>
                    </div>
                    <div className="col-span-2 text-[10px]">
                      <span className="text-neutral-500">MITRE ATT&amp;CK: </span>
                      <span className="font-mono text-cyan-400">{a.mitre}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {visibleAlerts.length === 0 && (
          <div className="text-neutral-600 text-xs text-center py-8">No alerts matching filter</div>
        )}
      </div>
    </div>
  );
});
