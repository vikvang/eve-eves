import type { RetroKaplay } from "@games/kit";
import { playSfx } from "@games/kit";
import type { RunState } from "../state.js";

export const spawnCoin = (
  k: RetroKaplay,
  x: number,
  y: number,
  run: RunState
) => {
  const coin = k.add([
    k.sprite("coin"),
    k.pos(x, y),
    k.area(),
    k.anchor("center"),
    "coin",
  ]);

  let t = 0;
  const baseY = y;
  coin.onUpdate(() => {
    t += k.dt();
    coin.pos.y = baseY + Math.sin(t * 6) * 2;
  });

  coin.onCollide("player", () => {
    run.coins += 1;
    run.score += 100;
    playSfx("pickup");
    k.add([
      k.rect(4, 4),
      k.pos(coin.pos),
      k.color(255, 205, 117),
      k.opacity(1),
      k.lifespan(0.3),
      k.move(k.vec2(0, -1), 40),
    ]);
    coin.destroy();
  });

  return coin;
};
