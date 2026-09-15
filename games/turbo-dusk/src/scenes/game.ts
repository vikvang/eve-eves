import type { RetroKaplay } from "@games/kit";
import { hexToRgb, playSfx, SWEETIE16 } from "@games/kit";
import { spawnGate } from "../entities/gate.js";
import { PLAYER_Y, spawnPlayerCar } from "../entities/roadster.js";
import { spawnFuelCan, spawnTraffic } from "../entities/traffic.js";
import { burst, flashScreen, scorePop } from "../fx.js";
import { stageFor } from "../levels/stages.js";
import {
  applyFuelPickup,
  applyGate,
  applyTrafficHit,
  currentSpeed,
  ROAD_LEFT,
  ROAD_RIGHT,
  TOTAL_GATES,
} from "../rules.js";
import type { RunState } from "../state.js";

const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_LEFT_X = ROAD_LEFT + ROAD_W / 4;
const LANE_RIGHT_X = ROAD_RIGHT - ROAD_W / 4;

export type TestHooks = {
  collectFuel: () => void;
  drainFuel: () => void;
  hitTraffic: () => void;
  passGate: () => void;
};

export const registerGameScene = (
  k: RetroKaplay,
  run: RunState,
  rng: () => number
): void => {
  k.scene("game", () => {
    const stage = stageFor(run.level);
    run.state = "playing";
    run.scene = "game";
    run.paused = false;
    run.boosting = false;
    run.fuel = stage.fuelTime;
    run.speed = 120;
    run.extra.won = false;
    run.extra.stage = stage.name;

    let ending = false;
    let invuln = 0;
    let slowTimer = 0;
    let stageTime = 0;
    let gateSpawned = false;
    let trafficTimer = 0.9;
    let fuelTimer = 1.6;
    let scoreAcc = 0;
    let streakTimer = 0;

    const frozen = (): boolean => ending || run.paused;
    const relTraffic = (): number => run.speed - stage.trafficSpeed;
    const relGround = (): number => run.speed;

    // --- backdrop: roadside ground, road slab, edge stripes ---
    k.add([
      k.rect(320, 180),
      k.pos(0, 0),
      k.color(...hexToRgb(SWEETIE16[stage.ground] ?? SWEETIE16[0])),
      k.fixed(),
      k.z(0),
    ]);
    k.add([
      k.rect(ROAD_W, 180),
      k.pos(ROAD_LEFT, 0),
      k.color(...hexToRgb(SWEETIE16[15])),
      k.z(1),
    ]);
    for (const edgeX of [ROAD_LEFT - 3, ROAD_RIGHT]) {
      k.add([
        k.rect(3, 180),
        k.pos(edgeX, 0),
        k.color(...hexToRgb(SWEETIE16[stage.edge] ?? SWEETIE16[3])),
        k.z(1),
      ]);
    }

    // Scrolling lane dashes down the road center.
    const DASH_GAP = 28;
    const DASH_COUNT = 8;
    for (let i = 0; i < DASH_COUNT; i++) {
      const dash = k.add([
        k.rect(3, 12),
        k.pos(158, i * DASH_GAP - 20),
        k.color(...hexToRgb(SWEETIE16[stage.dash] ?? SWEETIE16[4])),
        k.z(2),
      ]);
      dash.onUpdate(() => {
        if (frozen()) {
          return;
        }
        dash.pos.y += relGround() * k.dt();
        if (dash.pos.y > 184) {
          dash.pos.y -= DASH_COUNT * DASH_GAP;
        }
      });
    }

    // Scrolling roadside posts for a sense of speed.
    for (const side of [ROAD_LEFT - 14, ROAD_RIGHT + 10]) {
      for (let i = 0; i < 4; i++) {
        const post = k.add([
          k.rect(4, 8),
          k.pos(side, i * 48),
          k.color(...hexToRgb(SWEETIE16[13])),
          k.z(1),
        ]);
        post.onUpdate(() => {
          if (frozen()) {
            return;
          }
          post.pos.y += relGround() * k.dt();
          if (post.pos.y > 184) {
            post.pos.y -= 4 * 48;
          }
        });
      }
    }

    const player = spawnPlayerCar(k, run, { isFrozen: frozen });

    // --- run-ending transitions ---
    const endLose = (): void => {
      if (ending) {
        return;
      }
      ending = true;
      run.extra.won = false;
      playSfx("lose");
      flashScreen(k, 2, 0.5);
      k.shake(6);
      k.wait(0.5, () => k.go("gameover"));
    };

    const endWin = (): void => {
      if (ending) {
        return;
      }
      ending = true;
      run.extra.won = true;
      playSfx("win");
      flashScreen(k, 4, 0.5);
      k.shake(3);
      k.wait(0.5, () => k.go("gameover"));
    };

    // --- gameplay events ---
    const collectFuel = (canX: number, canY: number): void => {
      if (ending) {
        return;
      }
      const result = applyFuelPickup(run.fuel, run.score);
      run.fuel = result.fuel;
      run.score = result.score;
      playSfx("pickup");
      burst(k, canX, canY, 4, 8);
      scorePop(k, canX, canY - 8, "+100", 4);
    };

    const hitTraffic = (carX: number, carY: number, force: boolean): void => {
      if (ending || (invuln > 0 && !force)) {
        return;
      }
      const result = applyTrafficHit(run.lives);
      run.lives = result.lives;
      invuln = 1.5;
      slowTimer = 0.9;
      playSfx("hit");
      k.shake(6);
      flashScreen(k, 2, 0.35);
      burst(k, carX, carY, 2, 12);
      burst(k, carX, carY, 15, 6);
      if (result.dead) {
        endLose();
      }
    };

    const passGate = (): void => {
      if (ending) {
        return;
      }
      const result = applyGate(run.checkpoint, run.score);
      run.checkpoint = result.checkpoint;
      run.score = result.score;
      k.shake(2);
      flashScreen(k, 4, 0.3);
      scorePop(k, 160, PLAYER_Y - 24, "+500", 4);
      if (result.won) {
        endWin();
        return;
      }
      playSfx("select");
      playSfx("pickup");
      ending = true;
      k.wait(0.4, () => {
        run.level = Math.min(run.level + 1, TOTAL_GATES);
        k.go("game");
      });
    };

    // --- collisions ---
    player.onCollide("traffic", (car) => {
      if (invuln > 0 || ending) {
        return;
      }
      const { x, y } = car.pos;
      car.destroy();
      hitTraffic(x, y, false);
    });

    player.onCollide("fuel", (can) => {
      if (ending) {
        return;
      }
      const { x, y } = can.pos;
      can.destroy();
      collectFuel(x, y);
    });

    // --- spawning helpers ---
    const laneX = (): number => {
      const lane = rng() < 0.5 ? LANE_LEFT_X : LANE_RIGHT_X;
      return lane + (rng() - 0.5) * 16;
    };

    // --- input: boost + pause ---
    k.onButtonPress("jump", () => {
      if (run.paused || ending) {
        return;
      }
      playSfx("shoot");
      burst(k, run.playerX, PLAYER_Y + 8, 3, 6);
    });

    const pausedLabel = k.add([
      k.text("PAUSED", { size: 12 }),
      k.pos(160, 90),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
      k.opacity(0),
      k.z(150),
    ]);

    k.onButtonPress("pause", () => {
      if (ending) {
        return;
      }
      run.paused = !run.paused;
      playSfx("select");
      flashScreen(k, 4, 0.15);
      pausedLabel.opacity = run.paused ? 1 : 0;
    });

    // --- HUD ---
    const hudLeft = k.add([
      k.text("", { size: 8 }),
      k.pos(4, 4),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
      k.z(100),
    ]);
    const hudRight = k.add([
      k.text("", { size: 8 }),
      k.pos(316, 4),
      k.anchor("topright"),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
      k.z(100),
    ]);
    const stageLabel = k.add([
      k.text(stage.name, { size: 8 }),
      k.pos(160, 170),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[13])),
      k.fixed(),
      k.opacity(1),
      k.z(100),
    ]);

    // --- main loop ---
    k.onUpdate(() => {
      hudLeft.text = `SCORE ${run.score}\nLIVES ${run.lives}`;
      hudRight.text = `FUEL ${run.fuel.toFixed(1)}\nGATE ${run.checkpoint}/${TOTAL_GATES}`;
      const lowFuel = run.fuel < 5;
      const warn = hexToRgb(SWEETIE16[lowFuel ? 2 : 4]);
      hudRight.color = k.rgb(warn[0], warn[1], warn[2]);

      if (frozen()) {
        return;
      }
      const dt = k.dt();
      stageTime += dt;
      if (invuln > 0) {
        invuln -= dt;
        player.opacity = Math.floor(invuln * 10) % 2 === 0 ? 1 : 0.35;
      } else {
        player.opacity = 1;
      }
      if (slowTimer > 0) {
        slowTimer -= dt;
      }
      if (stageTime > 2.5) {
        stageLabel.opacity = Math.max(0, stageLabel.opacity - dt * 2);
      }

      const boostHeld = k.isButtonDown("jump");
      run.boosting = boostHeld && slowTimer <= 0;
      run.speed = currentSpeed(boostHeld, slowTimer > 0);

      // Fuel drain.
      run.fuel -= dt;
      if (run.fuel <= 0) {
        run.fuel = 0;
        endLose();
        return;
      }

      // Distance score trickle; boost pays double.
      scoreAcc += dt * (run.boosting ? 20 : 10);
      while (scoreAcc >= 1) {
        run.score += 1;
        scoreAcc -= 1;
      }

      // Boost speed streaks.
      if (run.boosting) {
        streakTimer -= dt;
        if (streakTimer <= 0) {
          streakTimer = 0.06;
          const sx = ROAD_LEFT + 6 + rng() * (ROAD_W - 12);
          const streak = k.add([
            k.rect(1, 14),
            k.pos(sx, -14),
            k.color(...hexToRgb(SWEETIE16[12])),
            k.opacity(0.5),
            k.z(3),
          ]);
          streak.onUpdate(() => {
            streak.pos.y += (run.speed + 160) * k.dt();
            if (streak.pos.y > 190) {
              streak.destroy();
            }
          });
        }
      }

      // Traffic spawns.
      trafficTimer -= dt;
      if (trafficTimer <= 0) {
        trafficTimer = stage.trafficInterval * (0.7 + rng() * 0.6);
        spawnTraffic(k, laneX(), {
          isFrozen: frozen,
          relativeSpeed: relTraffic,
        });
      }

      // Fuel can spawns.
      fuelTimer -= dt;
      if (fuelTimer <= 0) {
        fuelTimer = stage.fuelInterval * (0.8 + rng() * 0.5);
        spawnFuelCan(k, laneX(), {
          isFrozen: frozen,
          relativeSpeed: relGround,
        });
      }

      // Checkpoint gate.
      if (!gateSpawned && stageTime >= stage.gateDelay) {
        gateSpawned = true;
        spawnGate(k, {
          isFrozen: frozen,
          onCross: passGate,
          relativeSpeed: relGround,
        });
      }
    });

    // --- test seam hooks for acceptance checks ---
    const hooks: TestHooks = {
      collectFuel: () => collectFuel(run.playerX, PLAYER_Y - 12),
      drainFuel: () => {
        run.fuel = 0;
        endLose();
      },
      hitTraffic: () => hitTraffic(run.playerX, PLAYER_Y - 12, true),
      passGate: () => passGate(),
    };
    (window as unknown as { __test?: TestHooks }).__test = hooks;
  });
};
