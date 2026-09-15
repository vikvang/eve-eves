/** Per-stage tuning. Stage index = run.level - 1. */
export type StageConfig = {
  name: string;
  /** Sweetie-16 index for the roadside ground fill. */
  ground: number;
  /** Sweetie-16 index for the road edge stripes. */
  edge: number;
  /** Sweetie-16 index for the lane dashes. */
  dash: number;
  /** Sweetie-16 index for roadside scrub (bushes, rocks). */
  scrub: number;
  /** Fuel timer granted at the start of the stage, in seconds. */
  fuelTime: number;
  /** Seconds of driving before the checkpoint gate appears. */
  gateDelay: number;
  /** Base seconds between traffic spawns. */
  trafficInterval: number;
  /** Traffic forward speed; relative approach = player speed - this. */
  trafficSpeed: number;
  /** Base seconds between fuel can spawns. */
  fuelInterval: number;
};

export const STAGES: StageConfig[] = [
  {
    dash: 4,
    edge: 3,
    fuelInterval: 3,
    fuelTime: 15,
    gateDelay: 10,
    ground: 1,
    name: "SUNSET STRAIGHT",
    scrub: 6,
    trafficInterval: 1.7,
    trafficSpeed: 55,
  },
  {
    dash: 4,
    edge: 2,
    fuelInterval: 3.2,
    fuelTime: 15,
    gateDelay: 10,
    ground: 3,
    name: "DESERT BEND",
    scrub: 15,
    trafficInterval: 1.3,
    trafficSpeed: 65,
  },
  {
    dash: 13,
    edge: 3,
    fuelInterval: 3.4,
    fuelTime: 15,
    gateDelay: 10,
    ground: 0,
    name: "NIGHT APPROACH",
    scrub: 14,
    trafficInterval: 1,
    trafficSpeed: 80,
  },
];

export const stageFor = (level: number): StageConfig => {
  const idx = Math.max(0, Math.min(level - 1, STAGES.length - 1));
  return STAGES[idx] ?? STAGES[0];
};
