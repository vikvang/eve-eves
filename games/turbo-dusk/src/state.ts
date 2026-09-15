import type { GameSeam, GameStateName } from "@games/kit";

export const SLUG = "turbo-dusk";

export type RunState = {
  state: GameStateName;
  scene: string;
  score: number;
  lives: number;
  level: number;
  checkpoint: number;
  fuel: number;
  playerX: number;
  speed: number;
  boosting: boolean;
  paused: boolean;
  extra: Record<string, unknown>;
};

export const createRunState = (): RunState => ({
  boosting: false,
  checkpoint: 0,
  extra: {},
  fuel: 15,
  level: 1,
  lives: 3,
  paused: false,
  playerX: 160,
  scene: "title",
  score: 0,
  speed: 0,
  state: "title",
});

export const resetForNewRun = (run: RunState): void => {
  run.boosting = false;
  run.checkpoint = 0;
  run.extra = {};
  run.fuel = 15;
  run.level = 1;
  run.lives = 3;
  run.paused = false;
  run.playerX = 160;
  run.score = 0;
  run.speed = 0;
};

export const toSeam = (run: RunState): GameSeam => ({
  extra: {
    boosting: run.boosting,
    checkpoint: run.checkpoint,
    fuel: run.fuel,
    paused: run.paused,
    playerX: run.playerX,
    speed: run.speed,
    ...run.extra,
  },
  level: run.level,
  lives: run.lives,
  scene: run.scene,
  score: run.score,
  slug: SLUG,
  state: run.state,
});
