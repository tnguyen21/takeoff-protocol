import { useGameStore } from "./stores/game.js";
import { Lobby } from "./screens/Lobby.js";
import { Desktop } from "./screens/Desktop.js";

export function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "lobby" || phase === null) {
    return <Lobby />;
  }

  return <Desktop />;
}
