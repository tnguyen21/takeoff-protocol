import { useGameStore } from "./stores/game.js";
import { Lobby } from "./screens/Lobby.js";
import { Desktop } from "./screens/Desktop.js";
import { GMDashboard } from "./screens/GMDashboard.js";
import { Ending } from "./screens/Ending.js";

export function App() {
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
