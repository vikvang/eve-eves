# @games/playtest

Headless chromium playtest harness. Invoked from the repo root:

```bash
pnpm playtest <slug> [--genre platformer|shmup|arcade|puzzle]
```

Builds the game into `games/dist/<slug>`, serves it, waits for `window.__ready`, runs the genre script, writes `games/<slug>/playtest/{title,gameplay,end}.png` and `report.json`. Exits non-zero on failed checks or console errors.
