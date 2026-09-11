# _playtest

Headless Playwright harness. Invoked as `pnpm playtest <slug>`.

Builds the game, serves it, drives keyboard input against `window.__game`, writes:

- `games/<slug>/playtest/title.png`
- `games/<slug>/playtest/gameplay.png`
- `games/<slug>/playtest/end.png`
- `games/<slug>/playtest/report.json`
