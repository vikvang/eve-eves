import type { GameSeam, GameStateName } from "@games/kit";

export const SLUG = "_template";

export type RunState = {
  state: GameStateName;
  scene: string;
  score: number;
  lives: number;
  level: number;
  coins: number;
  paused: boolean;
  extra: Record<string, unknown>;
};

export const createRunState = (): RunState => ({
  coins: 0,
  extra: {},
  level: 1,
  lives: 3,
  paused: false,
  scene: "title",
  score: 0,
  state: "title",
});

export const toSeam = (run: RunState): GameSeam => ({
  extra: {
    coins: run.coins,
    paused: run.paused,
    ...run.extra,
  },
  level: run.level,
  lives: run.lives,
  scene: run.scene,
  score: run.score,
  slug: SLUG,
  state: run.state,
});
