import type { RetroKaplay } from "@games/kit";
import { clampPlayerX } from "../rules.js";
import type { RunState } from "../state.js";

export const PLAYER_Y = 150;

export type PlayerCarOpts = {
  isFrozen: () => boolean;
};

/**
 * The player roadster. Horizontal steering only; forward motion is implied
 * by the scrolling road.
 */
export const spawnPlayerCar = (
  k: RetroKaplay,
  run: RunState,
  opts: PlayerCarOpts
) => {
  const car = k.add([
    k.sprite("roadster"),
    k.pos(run.playerX, PLAYER_Y),
    k.area({ scale: 0.8 }),
    k.anchor("center"),
    k.opacity(1),
    k.z(10),
    "player",
  ]);

  car.onUpdate(() => {
    if (run.paused || opts.isFrozen()) {
      return;
    }
    const steer = 150;
    let dx = 0;
    if (k.isButtonDown("left")) {
      dx -= steer * k.dt();
    }
    if (k.isButtonDown("right")) {
      dx += steer * k.dt();
    }
    run.playerX = clampPlayerX(run.playerX + dx);
    car.pos.x = run.playerX;
    car.pos.y = PLAYER_Y;
  });

  return car;
};
