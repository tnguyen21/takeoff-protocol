import { PHASE_LABELS } from "./shared.js";

interface HeaderProps {
  roomCode: string | null;
  round: number;
  phase: string | null;
  connectedCount: number;
  totalPlayers: number;
}

export function Header({ roomCode, round, phase, connectedCount, totalPlayers }: HeaderProps) {
  return (
    <div className="flex items-center gap-6 py-3 px-6 bg-white/[0.03] border-b border-white/[0.08] shrink-0">
      {/* GM badge */}
      <div className="py-[3px] px-2.5 rounded-md bg-red-500/15 border border-red-500/40 text-red-400 text-[11px] font-bold tracking-widest uppercase">
        GM
      </div>

      {/* Room code */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs">Room</span>
        <span className="font-mono text-lg font-bold tracking-[0.15em] text-text-primary">
          {roomCode ?? "—"}
        </span>
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Round + Phase */}
      <div className="flex items-center gap-3">
        <span className="text-text-secondary text-[13px]">
          Round <strong className="text-text-primary">{round === 0 ? "Tutorial" : round}</strong>
        </span>
        <span className="py-0.5 px-2.5 rounded-[20px] bg-accent-bg border border-accent-border text-accent-light text-xs font-semibold">
          {PHASE_LABELS[phase ?? ""] ?? phase ?? "—"}
        </span>
        {round === 0 && (
          <span className="py-0.5 px-2.5 rounded-[20px] bg-yellow-500/15 border border-yellow-500/40 text-amber-400 text-[11px] font-bold tracking-[0.08em] uppercase">
            TUTORIAL MODE
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: connectedCount > 0 ? "var(--color-status-success)" : "var(--color-text-muted)" }}
        />
        <span className="text-text-secondary text-xs">
          {connectedCount} / {totalPlayers} connected
        </span>
      </div>
    </div>
  );
}
