# _kit

Shared runtime for every game in this repo. Not a playable game.

Planned modules:

- `createRetroGame` Kaplay init at 320x180, integer scale, crisp pixels, letterbox
- `palette.ts` Sweetie-16
- `sfx.ts` ZzFX presets
- `seam.ts` `installSeam` for `window.__game` / `window.__ready`
- `sprite.ts` `spriteFromGrid` so games ship no binary assets
