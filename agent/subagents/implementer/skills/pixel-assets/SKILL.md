---
description: "Author retro pixel sprites as ASCII grids mapped to Sweetie-16 via spriteFromGrid: sizes, animation frames, tile vs sprite rules, palette limits, ready-made grids (player, coin, spike, enemy, bullet, block, heart), and when a CC0 PNG pack is acceptable. Load when creating or revising game art under games/<slug>/ or shared retro-kit sprite helpers."
---
# Pixel Assets

How to make readable low-res art for factory games. Default path: ASCII grids through `spriteFromGrid`. Optional path: small CC0 PNG packs when grids are not enough.

## spriteFromGrid

retro-kit exposes `spriteFromGrid(grid, paletteMap)` which rasterizes a string grid into a data URL you pass to `loadSprite`.

```ts
const playerIdleUrl = spriteFromGrid(
  [
    "..KKKK..",
    ".KYYYYK.",
    ".KYOYYK.",
    // ...full grids live below
  ],
  { ".": -1, K: 3, Y: 10, O: 15 }, // -1 = transparent; numbers index SWEETIE16
);
k.loadSprite("player-idle", playerIdleUrl);
```

Rules:
- Every row of a grid must be the same length.
- Keys in the grid are single characters. Map them to Sweetie-16 indices (0-15) or `-1` for transparent.
- Prefer 4 or fewer non-transparent colors per sprite.
- One dark outline color (often index 3 or near-black in the palette) on the silhouette edge.
- Silhouette must read at 1x logical size; if it fails the squint test, simplify.

Check the template's real import path for `spriteFromGrid` and `SWEETIE16`; match it exactly.

## Size conventions

| Kind | Size | Notes |
|------|------|--------|
| Tile | 16x16 | Ground, brick, ladder, water face |
| Sprite small | 8x8 | Coin, bullet, particle, heart |
| Sprite medium | 16x16 | Player, enemy, block |
| Sprite wide | 16x8 or 24x8 | Projectiles, platforms sparingly |

Stay inside these. Do not ship 32x32 character sheets for v1.

## Tiles vs sprites

- Tiles: axis-aligned level cells from ASCII maps. Usually opaque, seamless edges with neighbors when they form ground.
- Sprites: entities and VFX. Transparent background (`.` -> `-1`). May animate.

Do not draw gameplay colliders larger than the visible silhouette without intent; match `area` boxes to the art.

## Animation frames

Store animations as arrays of grids (or arrays of loaded sprite names). Two frames is enough for idle/run in v1.

```ts
const runFrames = [gridRun0, gridRun1].map((g, i) => {
  const url = spriteFromGrid(g, playerMap);
  const name = `player-run-${i}`;
  k.loadSprite(name, url);
  return name;
});
// swap frame every 0.1s while moving; hold idle when still
```

Keep frame counts tiny (2-4). Same palette map across a set.

## Palette usage

Sweetie-16 only. Typical roles (adjust to the brief, still on-palette):
- Background fill: dark index from the brief
- Player fill: warm mid tone + lighter highlight + dark outline
- Hazard: hot red/orange index
- Pickup: bright yellow/gold index
- UI text: light index on dark

Max 4 colors per sprite including outline. Recycle the same outline index across assets for cohesion.

## Ready grids

Legend for all grids below (map in code):
- `.` transparent (-1)
- `K` outline / dark (e.g. 3)
- `Y` player fill (e.g. 10)
- `O` skin or alt fill (e.g. 15)
- `C` coin (e.g. 11)
- `R` hazard (e.g. 8)
- `E` enemy fill (e.g. 9)
- `W` bullet / cold (e.g. 12)
- `B` block fill (e.g. 5)
- `H` heart (e.g. 8)

Row lengths are exact. Copy carefully.

### Player idle 8x8 (frame 0)

```text
..KKKK..
.KYYYYK.
.KYOYYK.
.KYYYYK.
.KYYYYK.
..KYKYK.
..K.K.K.
..K.K.K.
```

### Player run 8x8 (frame 1)

```text
..KKKK..
.KYYYYK.
.KYOYYK.
.KYYYYK.
.KYKYKK.
.K.K..K.
.K..K...
.KK.K...
```

### Coin 8x8

```text
........
...KK...
..KCCK..
.KCCCCK.
.KCCCCK.
..KCCK..
...KK...
........
```

### Spike 8x8 (hazard tile-sized art; place on 16 tile center or pad)

```text
........
...KK...
..KRRK..
..KRRK..
.KRRRRK.
.KRRRRK.
KRRRRRRK
KKKKKKKK
```

### Enemy 8x8

```text
........
.KEEEK..
KEEEEEEK
KEKKEKEK
KEEEEEEK
.KEEEEK.
.KE..EK.
.K....K.
```

### Bullet 8x8

```text
........
........
..KK....
.KWWK...
.KWWK...
..KK....
........
........
```

### Block 16x16 (tile)

```text
KKKKKKKKKKKKKKKK
KBBBBBBBBBBBBBBK
KBKKBBKKBBKKBBBK
KBBBBBBBBBBBBBBK
KBBKKBBKKBBKKBBK
KBBBBBBBBBBBBBBK
KBKKBBKKBBKKBBBK
KBBBBBBBBBBBBBBK
KBBKKBBKKBBKKBBK
KBBBBBBBBBBBBBBK
KBKKBBKKBBKKBBBK
KBBBBBBBBBBBBBBK
KBBKKBBKKBBKKBBK
KBBBBBBBBBBBBBBK
KBBBBBBBBBBBBBBK
KKKKKKKKKKKKKKKK
```

### Heart 8x8

```text
........
.KK..KK.
KHHKKHHK
KHHHHHHK
KHHHHHHK
.KHHHHK.
..KHHK..
...KK...
```

Load each with a clear name (`player-idle`, `player-run-1`, `coin`, `spike`, `enemy`, `bullet`, `block`, `heart`). Reuse across games when the brief does not demand unique silhouettes.

## When PNG packs are acceptable

Use a vendored CC0 (or equivalent public domain) PNG pack only when:
- You need more frames than grids can honestly supply, or
- A tileset already matches Sweetie-16 (or you recolor to Sweetie-16), and
- License file is included next to the assets, and
- Files stay tiny (few KB each), 8/16 px native, no smoothing

Still prefer grids for player, coin, bullet, and UI icons. Never use copyrighted sheet rips. Never introduce colors outside Sweetie-16 without remapping.

## Checklist before shipping art

- [ ] Only Sweetie-16 indices
- [ ] Transparent background on sprites
- [ ] Outline present; silhouette readable at 320x180
- [ ] Sizes match the table
- [ ] Animations are 2 to 4 frames
- [ ] `loadSprite` names match what scenes/entities request
- [ ] No binary audio, no huge atlases
