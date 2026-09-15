import type { RetroKaplay } from "@games/kit";

export type ScrollerOpts = {
  /** Current downward scroll speed relative to the player, px/s. */
  relativeSpeed: () => number;
  /** True while the game is paused or ending; movement stops. */
  isFrozen: () => boolean;
};

const DESPAWN_Y = 210;
const RECLAIM_Y = -40;

/** A traffic car that drifts down the screen as the player overtakes it. */
export const spawnTraffic = (k: RetroKaplay, x: number, opts: ScrollerOpts) => {
  const car = k.add([
    k.sprite("traffic"),
    k.pos(x, -20),
    k.area({ scale: 0.8 }),
    k.anchor("center"),
    k.z(5),
    "traffic",
  ]);

  car.onUpdate(() => {
    if (opts.isFrozen()) {
      return;
    }
    car.pos.y += opts.relativeSpeed() * k.dt();
    if (car.pos.y > DESPAWN_Y || car.pos.y < RECLAIM_Y) {
      car.destroy();
    }
  });

  return car;
};

/** A fuel can pickup rolling down the road. */
export const spawnFuelCan = (k: RetroKaplay, x: number, opts: ScrollerOpts) => {
  const can = k.add([
    k.sprite("fuelcan"),
    k.pos(x, -12),
    k.area(),
    k.anchor("center"),
    k.z(4),
    "fuel",
  ]);

  let wobble = 0;
  const baseX = x;
  can.onUpdate(() => {
    if (opts.isFrozen()) {
      return;
    }
    wobble += k.dt();
    can.pos.y += opts.relativeSpeed() * k.dt();
    can.pos.x = baseX + Math.sin(wobble * 5) * 2;
    if (can.pos.y > DESPAWN_Y) {
      can.destroy();
    }
  });

  return can;
};
