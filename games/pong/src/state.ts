import type { GameSeam, GameStateName } from "@games/kit";

export const SLUG = "pong";

/** First side (player or CPU) to reach this many points wins the match. */
export const TARGET_SCORE = 5;

export type Outcome = "none" | "win" | "lose";

export type RunState = {
  state: GameStateName;
  scene: string;
  /** Player (left paddle) points. */
  score: number;
  /** CPU (right paddle) points. */
  cpuScore: number;
  targetScore: number;
  outcome: Outcome;
  level: number;
  lives: number;
  extra: Record<string, unknown>;
};

export const createRunState = (): RunState => ({
  cpuScore: 0,
  extra: {},
  level: 1,
  lives: 1,
  outcome: "none",
  scene: "title",
  score: 0,
  state: "title",
  targetScore: TARGET_SCORE,
});

/** Clear per-match values before a new match starts. */
export const resetMatch = (run: RunState): void => {
  run.score = 0;
  run.cpuScore = 0;
  run.outcome = "none";
  run.level = 1;
  run.lives = 1;
  run.extra = {};
};

export const toSeam = (run: RunState): GameSeam => ({
  extra: {
    cpuScore: run.cpuScore,
    outcome: run.outcome,
    targetScore: run.targetScore,
    ...run.extra,
  },
  level: run.level,
  lives: run.lives,
  scene: run.scene,
  score: run.score,
  slug: SLUG,
  state: run.state,
});
