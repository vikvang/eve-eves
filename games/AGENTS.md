# AGENTS.md (games/)

Guidance for agents working on factory-produced games.

## Kit

Import shared helpers from `@games/kit` (lives in `games/_kit`).

## Adding a game

1. `pnpm new-game <slug>` from the repo root
2. Implement scenes/levels/entities under `games/<slug>/`
3. `pnpm typecheck && pnpm check && pnpm test && pnpm build:games`
4. `pnpm playtest <slug> --genre <genre>` must pass with zero console errors

## Design defaults

320x180, Sweetie-16, 16px tiles, ZzFX only, keyboard only, title + game-over/win, juice on interactions, honor `__seed`, expose `__game` / `__ready` via `installSeam`.
