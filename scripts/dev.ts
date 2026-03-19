const rawArgs = process.argv.slice(2);

const clientArgs: string[] = [];
const ignoredArgs: string[] = [];
for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "local") continue;
  if (!arg.startsWith("-")) {
    ignoredArgs.push(arg);
    continue;
  }

  clientArgs.push(arg);
  const next = rawArgs[i + 1];
  if (next && !next.startsWith("-")) {
    clientArgs.push(next);
    i += 1;
  }
}

if (ignoredArgs.length > 0) {
  console.warn(`[dev] Ignoring unsupported positional args: ${ignoredArgs.join(", ")}`);
}

const children = [
  Bun.spawn(["bun", "run", "--filter", "@takeoff/server", "dev"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
  Bun.spawn(["bun", "run", "--filter", "@takeoff/client", "dev", ...clientArgs], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }),
];

let shuttingDown = false;

function stopChildren(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => stopChildren("SIGINT"));
process.on("SIGTERM", () => stopChildren("SIGTERM"));

const exitCode = await Promise.race(
  children.map(async (child) => {
    const code = await child.exited;
    stopChildren("SIGTERM");
    return code;
  }),
);

process.exit(exitCode);
