# games/

Every game this factory produces lives here, next to `agent/` at the repo root.

## Layout

```text
games/
  _kit/           shared runtime (@games/kit): createRetroGame, SWEETIE16, ZzFX sfx, installSeam, spriteFromGrid
  _template/      reference platformer copied by `pnpm new-game <slug>`
  _playtest/      headless Playwright harness + genre scripts
  _site/          landing page source for the static games site
  <slug>/         one Vite app per game
  dist/           build output (index.html + <slug>/); served by Vercel Root Directory = games
  vercel.json     Vercel project config when Root Directory is `games`
```

## Commands (from repo root)

```bash
pnpm install
pnpm build:games          # every game -> games/dist/<slug>/ + index
pnpm playtest <slug> [--genre platformer|shmup|arcade|puzzle]
pnpm new-game <slug>
pnpm test                 # vitest (kit pure logic)
pnpm typecheck
pnpm check
```

Install Playwright chromium once: `pnpm exec playwright install chromium`.

## Design defaults

- 320x180 logical, integer scale, crisp pixels, letterbox
- Sweetie-16 palette only
- 16px tiles, 8-16px sprites, ASCII tilemaps
- Sprites from `spriteFromGrid` or optional `public/sprites/*.png`
- ZzFX presets via `@games/kit` (`jump`, `hit`, `pickup`, `shoot`, `explode`, `select`, `win`, `lose`)
- Keyboard only: arrows/WASD, Z/Space, X, Enter, Esc
- Title + game-over/win required; juice on every interaction

## Test seam

Every game must expose (via `installSeam` from `@games/kit`):

```ts
window.__game = { slug, state, scene, score, lives, level, extra }
window.__ready: Promise<void>
```

Honor `window.__seed` when present. The title scene also sets `window.__startGame` for reliable playtest starts.

## Vercel (games site)

Create a second Vercel project with:

- Root Directory: `games`
- Build Command: from `games/vercel.json` (`cd .. && pnpm build:games`)
- Output Directory: `dist` (i.e. `games/dist`)

## Kaplay

Pinned to `4000.0.0-alpha.27.1` (latest 4000.x line on npm). Kaplay requires an explicit canvas element; `@games/kit` creates one. Seam refresh uses rAF because Kaplay clears scene-scoped `onUpdate` on `go()`.
