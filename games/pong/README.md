# pong

Single-player Pong against a bounded CPU paddle. First to 5 points wins.

- W/S or Up/Down move the left paddle.
- Enter, Space, or Z start a match from the title screen.
- On the results screen, Enter returns to the title and Z retries.

Built on `@games/kit` (320x180 retro runtime, Sweetie-16 palette, ZzFX sounds)
with the standard playtest seam (`window.__game`, `window.__ready`,
`window.__startGame`, `window.__seed`).

Run locally with `pnpm --filter @games/game-pong dev`, verify with
`pnpm playtest pong --genre arcade`.
