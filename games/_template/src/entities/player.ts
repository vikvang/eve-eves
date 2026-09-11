import type { RetroKaplay } from "@games/kit";
import { playSfx, TILE_SIZE } from "@games/kit";

export type PlayerOpts = {
  x: number;
  y: number;
  onDie: () => void;
};

export const spawnPlayer = (k: RetroKaplay, opts: PlayerOpts) => {
  const player = k.add([
    k.sprite("player"),
    k.pos(opts.x, opts.y),
    k.area(),
    k.body(),
    k.anchor("botleft"),
    k.opacity(1),
    "player",
  ]);

  const speed = 110;
  const jumpForce = 280;
  let invuln = 0;

  player.onUpdate(() => {
    if (invuln > 0) {
      invuln -= k.dt();
      player.opacity = Math.floor(invuln * 10) % 2 === 0 ? 1 : 0.4;
    } else {
      player.opacity = 1;
    }

    let vx = 0;
    if (k.isButtonDown("left")) {
      vx -= speed;
    }
    if (k.isButtonDown("right")) {
      vx += speed;
    }
    player.vel.x = vx;

    if (player.pos.y > 220) {
      opts.onDie();
    }
  });

  k.onButtonPress("jump", () => {
    if (player.isGrounded()) {
      player.jump(jumpForce);
      playSfx("jump");
      k.shake(1);
    }
  });

  const hurt = () => {
    if (invuln > 0) {
      return;
    }
    invuln = 1.2;
    playSfx("hit");
    k.shake(4);
    player.vel.y = -160;
    opts.onDie();
  };

  player.onCollide("enemy", (enemy, col) => {
    if (!col) {
      return;
    }
    // stomp from above
    if (col.isBottom() && player.vel.y > 0) {
      playSfx("explode");
      k.shake(2);
      enemy.destroy();
      player.vel.y = -200;
      return;
    }
    hurt();
  });

  return player;
};

export const tileToWorld = (
  tx: number,
  ty: number
): { x: number; y: number } => ({
  x: tx * TILE_SIZE,
  y: ty * TILE_SIZE + TILE_SIZE,
});
