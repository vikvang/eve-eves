import type { RetroKaplay } from "@games/kit";
import { hexToRgb, SWEETIE16 } from "@games/kit";

/** Scatter a handful of tiny square particles from a point. */
export const burst = (
  k: RetroKaplay,
  x: number,
  y: number,
  paletteIndex: number,
  count: number
): void => {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
    const speed = 40 + Math.random() * 70;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const p = k.add([
      k.rect(2, 2),
      k.pos(x, y),
      k.color(...hexToRgb(SWEETIE16[paletteIndex] ?? SWEETIE16[12])),
      k.opacity(1),
      k.z(50),
    ]);
    let life = 0.35 + Math.random() * 0.2;
    p.onUpdate(() => {
      const dt = k.dt();
      life -= dt;
      p.pos.x += vx * dt;
      p.pos.y += vy * dt;
      p.opacity = Math.max(0, life * 3);
      if (life <= 0) {
        p.destroy();
      }
    });
  }
};

/** Brief full-screen tint that fades out; classic hit/win flash. */
export const flashScreen = (
  k: RetroKaplay,
  paletteIndex: number,
  strength = 0.5
): void => {
  const overlay = k.add([
    k.rect(320, 180),
    k.pos(0, 0),
    k.color(...hexToRgb(SWEETIE16[paletteIndex] ?? SWEETIE16[12])),
    k.opacity(strength),
    k.fixed(),
    k.z(200),
  ]);
  overlay.onUpdate(() => {
    overlay.opacity -= k.dt() * 2.5;
    if (overlay.opacity <= 0) {
      overlay.destroy();
    }
  });
};

/** Small rising score text, e.g. "+100". */
export const scorePop = (
  k: RetroKaplay,
  x: number,
  y: number,
  label: string,
  paletteIndex: number
): void => {
  const pop = k.add([
    k.text(label, { size: 8 }),
    k.pos(x, y),
    k.anchor("center"),
    k.color(...hexToRgb(SWEETIE16[paletteIndex] ?? SWEETIE16[12])),
    k.opacity(1),
    k.z(60),
  ]);
  let life = 0.6;
  pop.onUpdate(() => {
    const dt = k.dt();
    life -= dt;
    pop.pos.y -= 24 * dt;
    pop.opacity = Math.max(0, life * 2);
    if (life <= 0) {
      pop.destroy();
    }
  });
};
