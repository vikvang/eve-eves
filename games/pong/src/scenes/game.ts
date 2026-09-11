import type { RetroKaplay } from "@games/kit";
import { playSfx, SWEETIE16 } from "@games/kit";
import type { RunState } from "../state.js";

const COURT_W = 320;
const COURT_H = 180;
const WALL = 6;
const PADDLE_W = 4;
const PADDLE_H = 28;
const PLAYER_X = 12;
const CPU_X = COURT_W - 12 - PADDLE_W;
const BALL_SIZE = 5;
const PLAYER_SPEED = 150;
const CPU_SPEED = 92;
const CPU_DEADZONE = 4;
const BALL_SPEED = 130;
const BALL_MAX_SPEED = 260;
const SERVE_DELAY = 0.8;

type Rng = () => number;

export const registerGameScene = (
  k: RetroKaplay,
  run: RunState,
  rng: Rng
): void => {
  k.scene("game", () => {
    run.state = "playing";
    run.scene = "game";

    drawCourt(k);

    const player = k.add([
      k.rect(PADDLE_W, PADDLE_H),
      k.pos(PLAYER_X, (COURT_H - PADDLE_H) / 2),
      k.color(...hex(SWEETIE16[10])),
    ]);

    const cpu = k.add([
      k.rect(PADDLE_W, PADDLE_H),
      k.pos(CPU_X, (COURT_H - PADDLE_H) / 2),
      k.color(...hex(SWEETIE16[2])),
    ]);

    const ball = k.add([
      k.rect(BALL_SIZE, BALL_SIZE),
      k.pos((COURT_W - BALL_SIZE) / 2, (COURT_H - BALL_SIZE) / 2),
      k.color(...hex(SWEETIE16[12])),
    ]);

    const playerHud = k.add([
      k.text("YOU 0", { size: 10 }),
      k.pos(96, 16),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[10])),
      k.fixed(),
    ]);

    const cpuHud = k.add([
      k.text("CPU 0", { size: 10 }),
      k.pos(224, 16),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[2])),
      k.fixed(),
    ]);

    let vx = 0;
    let vy = 0;
    let serving = true;
    let ended = false;

    const serve = (towardPlayer: boolean) => {
      ball.pos.x = (COURT_W - BALL_SIZE) / 2;
      ball.pos.y = (COURT_H - BALL_SIZE) / 2;
      vx = 0;
      vy = 0;
      serving = true;
      k.wait(SERVE_DELAY, () => {
        // Seeded angle keeps serves deterministic under window.__seed.
        const angle = (rng() - 0.5) * 1.1;
        vx = (towardPlayer ? -1 : 1) * BALL_SPEED;
        vy = BALL_SPEED * angle;
        serving = false;
      });
    };

    const bouncePaddle = (paddleY: number) => {
      const speed = Math.min(Math.hypot(vx, vy) * 1.06, BALL_MAX_SPEED);
      const paddleCenter = paddleY + PADDLE_H / 2;
      const ballCenter = ball.pos.y + BALL_SIZE / 2;
      const offset = clamp((ballCenter - paddleCenter) / (PADDLE_H / 2), -1, 1);
      const direction = vx < 0 ? 1 : -1;
      vx = direction * speed * 0.85;
      vy = speed * offset * 0.7;
      playSfx("hit");
    };

    const finish = (won: boolean) => {
      if (ended) {
        return;
      }
      ended = true;
      run.outcome = won ? "win" : "lose";
      playSfx(won ? "win" : "lose");
      k.wait(0.6, () => {
        k.go("gameover");
      });
    };

    const score = (playerScored: boolean) => {
      if (serving || ended) {
        return;
      }
      serving = true;
      vx = 0;
      vy = 0;
      if (playerScored) {
        run.score += 1;
        playSfx("pickup");
      } else {
        run.cpuScore += 1;
        playSfx("explode");
        k.shake(4);
      }
      if (run.score >= run.targetScore) {
        finish(true);
        return;
      }
      if (run.cpuScore >= run.targetScore) {
        finish(false);
        return;
      }
      // Serve toward the side that just conceded.
      serve(!playerScored);
    };

    const movePlayer = (dt: number) => {
      let dy = 0;
      if (k.isButtonDown("up")) {
        dy -= PLAYER_SPEED * dt;
      }
      if (k.isButtonDown("down")) {
        dy += PLAYER_SPEED * dt;
      }
      player.pos.y = clamp(player.pos.y + dy, WALL, COURT_H - WALL - PADDLE_H);
    };

    const moveCpu = (dt: number) => {
      const target = ball.pos.y + BALL_SIZE / 2 - PADDLE_H / 2;
      const diff = target - cpu.pos.y;
      if (Math.abs(diff) > CPU_DEADZONE) {
        const step = clamp(diff, -CPU_SPEED * dt, CPU_SPEED * dt);
        cpu.pos.y = clamp(cpu.pos.y + step, WALL, COURT_H - WALL - PADDLE_H);
      }
    };

    const moveBall = (dt: number) => {
      ball.pos.x += vx * dt;
      ball.pos.y += vy * dt;

      // Top/bottom walls.
      if (ball.pos.y <= WALL && vy < 0) {
        ball.pos.y = WALL;
        vy = -vy;
        playSfx("hit");
      } else if (ball.pos.y >= COURT_H - WALL - BALL_SIZE && vy > 0) {
        ball.pos.y = COURT_H - WALL - BALL_SIZE;
        vy = -vy;
        playSfx("hit");
      }

      // Direction-aware paddle collisions.
      if (
        vx < 0 &&
        ball.pos.x <= PLAYER_X + PADDLE_W &&
        ball.pos.x + BALL_SIZE >= PLAYER_X &&
        overlapsY(ball.pos.y, player.pos.y)
      ) {
        ball.pos.x = PLAYER_X + PADDLE_W;
        bouncePaddle(player.pos.y);
      } else if (
        vx > 0 &&
        ball.pos.x + BALL_SIZE >= CPU_X &&
        ball.pos.x <= CPU_X + PADDLE_W &&
        overlapsY(ball.pos.y, cpu.pos.y)
      ) {
        ball.pos.x = CPU_X - BALL_SIZE;
        bouncePaddle(cpu.pos.y);
      }

      // Goals (one score per serve; score() guards re-entry).
      if (ball.pos.x + BALL_SIZE < -4) {
        score(false);
      } else if (ball.pos.x > COURT_W + 4) {
        score(true);
      }
    };

    serve(rng() < 0.5);

    k.onUpdate(() => {
      const dt = k.dt();
      movePlayer(dt);
      if (!(serving || ended)) {
        moveCpu(dt);
      }
      moveBall(dt);
      playerHud.text = `YOU ${run.score}`;
      cpuHud.text = `CPU ${run.cpuScore}`;
    });
  });
};

const drawCourt = (k: RetroKaplay): void => {
  k.add([
    k.rect(COURT_W, COURT_H),
    k.pos(0, 0),
    k.color(...hex(SWEETIE16[0])),
    k.fixed(),
  ]);
  k.add([
    k.rect(COURT_W, WALL),
    k.pos(0, 0),
    k.color(...hex(SWEETIE16[15])),
    k.fixed(),
  ]);
  k.add([
    k.rect(COURT_W, WALL),
    k.pos(0, COURT_H - WALL),
    k.color(...hex(SWEETIE16[15])),
    k.fixed(),
  ]);
  for (let y = WALL + 4; y < COURT_H - WALL; y += 14) {
    k.add([
      k.rect(2, 8),
      k.pos(COURT_W / 2 - 1, y),
      k.color(...hex(SWEETIE16[14])),
      k.fixed(),
    ]);
  }
};

const overlapsY = (ballY: number, paddleY: number): boolean =>
  ballY + BALL_SIZE >= paddleY && ballY <= paddleY + PADDLE_H;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
