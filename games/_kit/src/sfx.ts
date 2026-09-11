import { type ZzfxParams, zzfx } from "./vendor/zzfx.js";

export type SfxName =
  | "jump"
  | "hit"
  | "pickup"
  | "shoot"
  | "explode"
  | "select"
  | "win"
  | "lose";

/** Named ZzFX presets tuned for short retro juice. */
export const SFX_PRESETS: Record<SfxName, ZzfxParams> = {
  explode: [1.5, 0.2, 80, 0.01, 0.1, 0.4, 4, 1.2, , , , , , 3],
  hit: [1.2, 0.1, 180, 0.01, 0, 0.15, 4, 1.2, , , , , , 2],
  jump: [1, 0.05, 400, 0.01, 0.02, 0.15, 1, 1.5, , , 200, 0.05],
  lose: [1.2, 0.1, 150, 0.02, 0.1, 0.4, 3, 1.5, -2],
  pickup: [1, 0.05, 600, 0.01, 0.05, 0.1, 1, 1.5, , , 100, 0.05],
  select: [0.6, 0.02, 440, 0.01, 0.02, 0.05, 0, 1.2],
  shoot: [0.8, 0.05, 500, 0.01, 0, 0.1, 1, 1.8, -4],
  win: [1, 0.05, 523, 0.02, 0.1, 0.3, 1, 1.5, , 0.1, 200, 0.1, 0.15],
};

let muted = false;

export const setMuted = (value: boolean): void => {
  muted = value;
};

export const isMuted = (): boolean => muted;

export const playSfx = (name: SfxName): void => {
  if (muted) {
    return;
  }
  try {
    zzfx(...SFX_PRESETS[name]);
  } catch {
    // Audio may be blocked until a user gesture; ignore.
  }
};
