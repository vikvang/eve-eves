# games

Every game this factory produces lives here, next to `agent/` at the repo root.

## Layout

- `_kit/` shared retro runtime: Kaplay wrapper (320x180, crisp pixels, Sweetie-16), ZzFX, ASCII sprite rasterizer, playtest seam (`window.__game`, `window.__ready`).
- `_template/` reference platformer. `pnpm new-game <slug>` copies this into `games/<slug>/`.
- `_playtest/` headless Playwright harness. Writes screenshots and `report.json` under `games/<slug>/playtest/`.
- `<slug>/` one Vite + TypeScript Kaplay app per produced game.

Produced games follow `_template`:

```
games/<slug>/
  index.html
  src/main.ts
  src/scenes/{title,game,gameover}.ts
  src/levels/
  src/entities/
  playtest/          # written by the harness, not authored
```

Stack: Vite, TypeScript, Kaplay. Browser only, no persistence, no audio files.

These folders are reserved. Do not put a produced game in `_kit`, `_template`, or `_playtest`.
