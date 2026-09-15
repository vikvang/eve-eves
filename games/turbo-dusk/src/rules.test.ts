import { describe, expect, it } from "vitest";
import {
  applyFuelPickup,
  applyGate,
  applyTrafficHit,
  BOOST_SPEED,
  CRUISE_SPEED,
  clampPlayerX,
  currentSpeed,
  FUEL_CAN_SCORE,
  FUEL_MAX,
  GATE_SCORE,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  SLOW_SPEED,
  TOTAL_GATES,
} from "./rules.js";

describe("clampPlayerX", () => {
  it("keeps the car inside the road bounds", () => {
    expect(clampPlayerX(0)).toBe(PLAYER_MIN_X);
    expect(clampPlayerX(320)).toBe(PLAYER_MAX_X);
    expect(clampPlayerX(160)).toBe(160);
  });
});

describe("applyFuelPickup", () => {
  it("adds score and fuel time", () => {
    const result = applyFuelPickup(10, 0);
    expect(result.score).toBe(FUEL_CAN_SCORE);
    expect(result.fuel).toBeGreaterThan(10);
  });

  it("caps fuel at FUEL_MAX", () => {
    const result = applyFuelPickup(FUEL_MAX, 0);
    expect(result.fuel).toBe(FUEL_MAX);
  });
});

describe("applyTrafficHit", () => {
  it("removes one life", () => {
    expect(applyTrafficHit(3)).toEqual({ dead: false, lives: 2 });
  });

  it("flags death at zero lives", () => {
    expect(applyTrafficHit(1)).toEqual({ dead: true, lives: 0 });
  });
});

describe("applyGate", () => {
  it("advances the checkpoint and awards score", () => {
    expect(applyGate(0, 0)).toEqual({
      checkpoint: 1,
      score: GATE_SCORE,
      won: false,
    });
  });

  it("wins on the final gate", () => {
    const result = applyGate(TOTAL_GATES - 1, 1000);
    expect(result.won).toBe(true);
    expect(result.checkpoint).toBe(TOTAL_GATES);
  });
});

describe("currentSpeed", () => {
  it("returns cruise speed by default", () => {
    expect(currentSpeed(false, false)).toBe(CRUISE_SPEED);
  });

  it("boost raises speed above cruise", () => {
    expect(currentSpeed(true, false)).toBe(BOOST_SPEED);
    expect(BOOST_SPEED).toBeGreaterThan(CRUISE_SPEED);
  });

  it("collision slowdown overrides boost", () => {
    expect(currentSpeed(true, true)).toBe(SLOW_SPEED);
  });
});
