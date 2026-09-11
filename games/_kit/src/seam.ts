export type GameStateName = "title" | "playing" | "gameover" | "win";

export type GameSeam = {
  slug: string;
  state: GameStateName;
  scene: string;
  score: number;
  lives: number;
  level: number;
  extra: Record<string, unknown>;
};

export type SeamState = GameSeam;

declare global {
  interface Window {
    __game?: GameSeam;
    __ready?: Promise<void>;
    __seed?: number;
  }
}

type KaplayLike = {
  onUpdate: (cb: () => void) => unknown;
};

/**
 * Install the playtest seam: window.__game refreshed every frame, and
 * window.__ready resolved after the caller finishes asset load + title show.
 *
 * Uses both Kaplay onUpdate and requestAnimationFrame so the seam stays live
 * across scene transitions (Kaplay scene-scoped handlers are cleared on go()).
 */
export const installSeam = (
  k: KaplayLike,
  getState: () => GameSeam
): { resolveReady: () => void; ready: Promise<void>; refresh: () => void } => {
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  const refresh = (): void => {
    window.__game = getState();
  };

  window.__ready = ready;
  refresh();

  k.onUpdate(refresh);

  let raf = 0;
  const tick = (): void => {
    refresh();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  void raf;

  return { ready, refresh, resolveReady };
};

/** Deterministic RNG when window.__seed is set before boot. */
export const createSeededRandom = (
  seed = window.__seed ?? Date.now()
): (() => number) => {
  let s = seed >>> 0;
  if (s === 0) {
    s = 1;
  }
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
};
