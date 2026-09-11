import type { RetroKaplay } from "@games/kit";

export const spawnEnemy = (k: RetroKaplay, x: number, y: number) => {
  const enemy = k.add([
    k.sprite("enemy"),
    k.pos(x, y),
    k.area(),
    k.body(),
    k.anchor("botleft"),
    {
      dir: -1 as number,
      speed: 40,
    },
    "enemy",
  ]);

  enemy.onUpdate(() => {
    const e = enemy as typeof enemy & { dir: number; speed: number };
    e.move(e.dir * e.speed, 0);
    if (e.isGrounded() && (e.pos.x <= 0 || e.pos.x >= 320 - 8)) {
      e.dir *= -1;
    }
  });

  enemy.onCollide("solid", (_s, col) => {
    if (col?.isLeft() || col?.isRight()) {
      const e = enemy as typeof enemy & { dir: number };
      e.dir *= -1;
    }
  });

  return enemy;
};
