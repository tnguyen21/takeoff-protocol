import { useState, useEffect } from "react";
import { useGameStore } from "./stores/game.js";
import { Lobby } from "./screens/Lobby.js";
import { Desktop } from "./screens/Desktop.js";
import { GMDashboard } from "./screens/gm/index.js";
import { Ending } from "./screens/Ending.js";
import { useDevMode } from "./hooks/useDevMode.js";
import { PasswordGate } from "./screens/PasswordGate.js";

export function App() {
  useDevMode();

  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/check", { credentials: "include" })
      .then((r) => {
        setAuthed(r.ok);
      })
      .catch(() => setAuthed(true)); // if endpoint doesn't exist (auth disabled), allow
  }, []);

  const phase = useGameStore((s) => s.phase);
  const isGM = useGameStore((s) => s.isGM);

  if (authed === false) return <PasswordGate onSuccess={() => setAuthed(true)} />;
  if (authed === null) return null; // loading

  if (phase === "lobby" || phase === null) {
    return <Lobby />;
  }

  if (phase === "ending") {
    return <Ending />;
  }

  if (isGM) {
    return <GMDashboard />;
  }

  return <Desktop />;
}
