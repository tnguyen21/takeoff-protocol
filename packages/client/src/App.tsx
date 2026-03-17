import { useGameStore } from "./stores/game.js";
import { Lobby } from "./screens/Lobby.js";
import { Desktop } from "./screens/Desktop.js";
import { GMDashboard } from "./screens/gm/index.js";
import { Ending } from "./screens/Ending.js";
import { useDevMode } from "./hooks/useDevMode.js";

export function App() {
  useDevMode();

  const phase = useGameStore((s) => s.phase);
  const isGM = useGameStore((s) => s.isGM);

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
