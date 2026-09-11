---
description: "Implement Kaplay retro games in the factory games repo: layout, pnpm new-game scaffold, createRetroGame, scenes, ASCII tilemaps, installSeam, seed RNG, ZzFX presets, common Kaplay 4000 APIs, definition of done, and pitfalls. Load whenever scaffolding or coding a game under games/<slug>/, wiring the test seam, or running typecheck/check/test/build/playtest."
---
# Retro Stack

How to build a game in the factory's games repository. Follow the brief. Copy `_template`, then replace scenes, entities, and levels. Do not invent a parallel stack.

## Repo layout

```text
games/_kit/     shared lib
  createRetroGame()     kaplay wrapper (320x180, integer scale, crisp, letterbox)
  palette.ts            SWEETIE16 + helpers
  sfx.ts                ZzFX presets
  seam.ts               installSeam(k, getState)
  spriteFromGrid()      ASCII pixel grid -> data URL sprite
games/_template/        playable reference platformer; copy source of truth
games/<slug>/
  index.html
  src/main.ts
  src/scenes/title.ts
  src/scenes/game.ts
  src/scenes/gameover.ts
  src/levels/*.ts
  src/entities/*.ts
  public/sprites/*.png  optional
  playtest/             report.json + screenshots (from harness)
games/_playtest/        harness (pnpm playtest)
games/_site/            static index of built games
games/dist/<slug>/      build output
```

Root scripts (run from repo root):
- `pnpm install`
- `pnpm new-game <slug>` copies `_template` to `games/<slug>`
- `pnpm typecheck`
- `pnpm check` / `pnpm fix`
- `pnpm test` (Vitest, pure logic)
- `pnpm build:games` (every game into `games/dist/<slug>/`, plus site index)
- `pnpm playtest <slug> [--genre platformer|shmup|arcade|puzzle]`

Node 24, pnpm workspace, TypeScript strict, Vite, Kaplay 4000.x, Biome via ultracite, Vitest, Playwright chromium. No backend, no persistence, no audio files.

## Scaffold

1. From repo root: `pnpm new-game <slug>` with the brief's kebab-case slug.
2. Open `games/<slug>/` and rewrite title copy, scenes, levels, entities to match the brief. Keep the folder shape.
3. Wire genre-specific behavior in `src/scenes/game.ts` and entities. Prefer editing template files over adding deep new trees.
4. Branch name when pushing: `factory/game-<slug>`.

## createRetroGame

Bootstrap only through `@games/kit`:

```ts
import { createRetroGame } from "@games/kit"; // import path as in _template
import { SWEETIE16 } from "@games/kit"; // match template exports

const k = createRetroGame({
  background: SWEETIE16[0], // brief background role
  // root stays 320x180 logical; scale is chosen for the window; crisp + letterbox on
});
```

Do not call `kaplay()` directly. Do not change logical size. Do not disable crisp or letterbox. Use Kaplay's built-in pixel font for text.

## main.ts and scenes

Typical `main.ts` flow:
1. Create the game with `createRetroGame`.
2. Load sprites (from `spriteFromGrid` data URLs and/or `loadSprite` paths).
3. Register scenes: `title`, `game`, `gameover` (and `win` if separate).
4. Call `installSeam(k, getState)` so the harness can read state.
5. After loads finish, `go("title")` and resolve readiness via the seam.

Scene rules:
- `title`: show name, pitch line, "Enter to start". Enter -> `go("game")` and set playing state. Play `select` SFX.
- `game`: reset run state on entry (score, lives, level, entities). Implement the core loop. Pause on Esc only if the brief asks.
- `gameover` / win: show score and retry hint. Enter returns to title or restarts per brief. Play `lose` or `win`.

Always reset mutable run state when re-entering `game`. Stale globals from a previous run cause flaky playtests.

## ASCII tilemaps

Levels live in `src/levels/*.ts` as string row arrays.

Conventions:
- Visible playfield at 320x180 is 20 tiles wide by 11 tiles tall at 16px.
- Wider or taller stages scroll with `setCamPos` following the player (Kaplay 4000; not `camPos`).
- One legend maps characters to solid, hazard, pickup, spawn, exit, empty.

Example legend (adapt per game):

| char | meaning        |
|------|----------------|
| `.`  | empty          |
| `#`  | solid block    |
| `^`  | spike / hazard  |
| `o`  | coin / pickup  |
| `P`  | player spawn   |
| `E`  | exit / flag    |
| `X`  | enemy spawn    |

Use `addLevel` (or the template helper) with `tileWidth`/`tileHeight` 16. Spawns instantiate entities; solids get `area` + `body({ isStatic: true })` as needed.

## installSeam obligations

```ts
installSeam(k, () => ({
  slug: "<slug>",
  state: "title" | "playing" | "gameover" | "win",
  scene: k.getSceneName?.() ?? currentSceneName,
  score,
  lives,
  level,
  extra: { /* brief-specific flags, e.g. wavesCleared */ },
}));
```

Requirements:
- `window.__game` is refreshed every frame with the object above (kit uses rAF).
- `window.__ready` is a Promise resolved after assets are loaded and the title scene is showing.
- Title scene must also set `window.__startGame` to the same start function Enter uses, so headless playtests can begin reliably.
- `state` must match the real screen: title before start, playing during the run, gameover/win on terminal screens.
- Score, lives, level are numbers the harness can assert on.
- `createRetroGame` creates an explicit canvas; do not call raw `kaplay()`.

### window.__seed

If `window.__seed` is a number when the game boots, seed all randomness from it (enemy picks, piece bags, shuffle). Deterministic playtests depend on this. If absent, use a normal random source.

## ZzFX presets

Use `@games/kit` `playSfx` / `SFX_PRESETS` helpers only. Named presets: `jump`, `hit`, `pickup`, `shoot`, `explode`, `select`, `win`, `lose`. Map brief audio cues 1:1. Never add `.mp3`/`.wav` files.

## Kaplay 4000 shapes (short)

```ts
// scene + go
k.scene("game", () => { /* ... */ });
k.go("game");

// game object
const player = k.add([
  k.sprite("player"),
  k.pos(32, 120),
  k.area(),
  k.body(),
  "player",
]);

// input
k.onKeyPress("space", () => { /* primary */ });
k.onKeyDown("left", () => { player.move(-speed, 0); });

// collisions
player.onCollide("coin", (c) => {
  k.destroy(c);
  score += 10;
  playSfx("pickup");
});

// camera + juice
k.onUpdate(() => {
  k.setCamPos(player.pos.x, 90);
});
k.shake(4);
k.wait(0.5, () => k.go("gameover"));
k.loop(1, () => { /* spawn */ });

// level
k.addLevel(rows, {
  tileWidth: 16,
  tileHeight: 16,
  tiles: {
    "#": () => [k.sprite("block"), k.area(), k.body({ isStatic: true })],
    "o": () => [k.sprite("coin"), k.area(), "coin"],
  },
});
```

Prefer `onKeyPress` for taps (jump, shoot, start) and `onKeyDown` for continuous move. Use tags (`"player"`, `"enemy"`, `"hazard"`) for collisions.

Coordinates are logical pixels in the 320x180 space, not CSS pixels and not tile indices at draw time (convert tile index * 16 when placing by grid).

## Definition of done

A game is done only when all of these are green from repo root:

1. `pnpm typecheck`
2. `pnpm check`
3. `pnpm test`
4. `pnpm build:games` (produces `games/dist/<slug>/`)
5. `pnpm playtest <slug> [--genre ...]` exit 0, `games/<slug>/playtest/report.json` has `passed: true`, no `consoleErrors`

Also required:
- Brief acceptance checks are implementable via the seam (state/score/lives/level/extra)
- Title and terminal screens exist and are reachable
- Branch pushed as `factory/game-<slug>` when this station delivers

Record exact commands and outcomes. If playtest cannot run in the environment, say so explicitly; do not claim green.

## Pitfalls

1. Starting a scene before sprites finish loading. Load first, then `go("title")`, then resolve `__ready`.
2. Mixing tile indices with pixel positions. Multiply by 16 for `pos`.
3. Allocating arrays/objects every frame in `onUpdate` (GC hitches). Reuse or keep closed-over state.
4. Forgetting to reset score/lives/level/entity lists on `game` scene re-entry.
5. Leaving `state` stuck on `"playing"` after death. Set terminal state before or as you `go("gameover")`.
6. Calling raw `kaplay()` or resizing away from 320x180.
7. Off-palette colors or smoothed scaling.
8. Silent collisions: every hazard/pickup/start needs SFX or shake/flash.
9. Ignoring `window.__seed`, making playtests flake.
10. Large refactors of `@games/kit` or the harness. Game work stays under `games/<slug>/` unless the brief requires a shared fix (then keep it minimal and note it).
