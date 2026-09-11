export type Genre = "platformer" | "shmup" | "arcade" | "puzzle";

export type GameSeamSnapshot = {
  slug: string;
  state: "title" | "playing" | "gameover" | "win";
  scene: string;
  score: number;
  lives: number;
  level: number;
  extra: Record<string, unknown>;
};

export type CheckResult = {
  id: string;
  passed: boolean;
  evidence: string;
};

export type PlaytestReport = {
  slug: string;
  passed: boolean;
  checks: CheckResult[];
  consoleErrors: string[];
  screenshots: string[];
};

export type GenreScript = {
  genre: Genre;
  run: (ctx: GenreContext) => Promise<void>;
};

export type GenreContext = {
  slug: string;
  page: import("playwright").Page;
  press: (key: string, ms?: number) => Promise<void>;
  hold: (keys: string[], ms: number) => Promise<void>;
  waitForState: (
    state: GameSeamSnapshot["state"],
    timeoutMs?: number
  ) => Promise<GameSeamSnapshot>;
  getSeam: () => Promise<GameSeamSnapshot | null>;
  screenshot: (name: "title" | "gameplay" | "end") => Promise<string>;
  addCheck: (id: string, passed: boolean, evidence: string) => void;
  sleep: (ms: number) => Promise<void>;
};
