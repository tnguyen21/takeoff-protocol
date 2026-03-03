# Takeoff Protocol

## First steps
- Read `TREE.md` at the repo root for a full file tree of the project. It is kept in sync via a pre-commit hook.

## Project structure
- Monorepo with bun workspaces: `packages/client`, `packages/server`, `packages/shared`
- Client: React + Vite + Tailwind
- Server: Hono + Socket.IO on Bun
- Shared: common types, constants, game logic

## Commands
- `bun run dev` — start all packages
- `bun run test` — run all tests
- `bun run typecheck` — typecheck all packages
- `bun run build` — build all packages

## Hooks
- Pre-commit runs `typecheck`, `test`, and regenerates `TREE.md` via husky
