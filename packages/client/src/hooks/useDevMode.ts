import { useEffect } from "react";
import type { Faction, GamePhase, Role } from "@takeoff/shared";
import { socket } from "../socket.js";
import { useGameStore } from "../stores/game.js";

/**
 * Dev-only hook for URL-driven game setup.
 * Reads URL params on mount and, if dev=1, emits dev:bootstrap to skip lobby
 * and jump directly to the specified round/phase as the given faction/role.
 *
 * URL format:
 *   ?dev=1&round=3&phase=intel&faction=openbrain&role=ob_cto&state=obCapability:80,chinaCapability:60
 *
 * Inert (no-op) when import.meta.env.DEV is false.
 */
export function useDevMode(): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") !== "1") return;

    const round = parseInt(params.get("round") ?? "1", 10);
    const phase = (params.get("phase") ?? "briefing") as GamePhase;
    const faction = params.get("faction") as Faction | null;
    const role = params.get("role") as Role | null;

    if (!faction || !role) {
      console.warn("[useDevMode] Missing faction or role param — skipping bootstrap");
      return;
    }

    // Parse state overrides: "obCapability:80,chinaCapability:60" → { obCapability: 80, ... }
    const stateParam = params.get("state") ?? "";
    const stateOverrides: Record<string, number> = {};
    if (stateParam) {
      for (const pair of stateParam.split(",")) {
        const colonIdx = pair.indexOf(":");
        if (colonIdx === -1) continue;
        const key = pair.slice(0, colonIdx).trim();
        const value = parseFloat(pair.slice(colonIdx + 1).trim());
        if (key && !isNaN(value)) {
          stateOverrides[key] = value;
        }
      }
    }

    const doBootstrap = () => {
      socket.emit(
        "dev:bootstrap",
        { faction, role, round, phase, stateOverrides },
        (res: { ok: boolean; code?: string; error?: string }) => {
          if (res.ok && res.code) {
            useGameStore.setState({
              roomCode: res.code,
              selectedFaction: faction,
              selectedRole: role,
              playerId: socket.id ?? null,
              isGM: false,
            });
            console.log(`[useDevMode] Bootstrapped: room=${res.code} faction=${faction} role=${role} round=${round} phase=${phase}`);
          } else {
            console.error("[useDevMode] Bootstrap failed:", res.error);
          }
        },
      );
    };

    if (socket.connected) {
      doBootstrap();
    } else {
      socket.connect();
      socket.once("connect", doBootstrap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
