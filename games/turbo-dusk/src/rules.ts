/**
 * Pure gameplay rules for Turbo Dusk. Kept free of Kaplay so Vitest can
 * exercise them directly.
 */

export const FUEL_START = 15;
export const FUEL_MAX = 20;
export const FUEL_CAN_BONUS = 2.5;
export const FUEL_CAN_SCORE = 100;
export const GATE_SCORE = 500;
export const TOTAL_GATES = 3;

export const CRUISE_SPEED = 120;
export const BOOST_SPEED = 210;
export const SLOW_SPEED = 60;
export const STEER_SPEED = 150;

export const ROAD_LEFT = 104;
export const ROAD_RIGHT = 216;
export const PLAYER_MIN_X = ROAD_LEFT + 8;
export const PLAYER_MAX_X = ROAD_RIGHT - 8;

export const clampPlayerX = (x: number): number =>
  Math.min(PLAYER_MAX_X, Math.max(PLAYER_MIN_X, x));

export type FuelPickupResult = { fuel: number; score: number };

export const applyFuelPickup = (
  fuel: number,
  score: number
): FuelPickupResult => ({
  fuel: Math.min(FUEL_MAX, fuel + FUEL_CAN_BONUS),
  score: score + FUEL_CAN_SCORE,
});

export type TrafficHitResult = { lives: number; dead: boolean };

export const applyTrafficHit = (lives: number): TrafficHitResult => {
  const next = lives - 1;
  return { dead: next <= 0, lives: next };
};

export type GateResult = { checkpoint: number; score: number; won: boolean };

export const applyGate = (checkpoint: number, score: number): GateResult => {
  const next = checkpoint + 1;
  return {
    checkpoint: next,
    score: score + GATE_SCORE,
    won: next >= TOTAL_GATES,
  };
};

export const currentSpeed = (boosting: boolean, slowed: boolean): number => {
  if (slowed) {
    return SLOW_SPEED;
  }
  return boosting ? BOOST_SPEED : CRUISE_SPEED;
};
