import type { RetroKaplay } from "@games/kit";
import { playSfx, SWEETIE16 } from "@games/kit";
import type { RunState } from "../state.js";

export const registerTitleScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("title", () => {
    run.state = "title";
    run.scene = "title";
    run.paused = false;

    k.add([
      k.rect(320, 180),
      k.pos(0, 0),
      k.color(...hex(SWEETIE16[0])),
      k.fixed(),
    ]);

    k.add([
      k.text("RETRO TEMPLATE", { size: 16 }),
      k.pos(160, 48),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[12])),
      k.fixed(),
    ]);

    k.add([
      k.text("A tiny platformer", { size: 8 }),
      k.pos(160, 72),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[13])),
      k.fixed(),
    ]);

    k.add([
      k.text("Arrows/WASD move  Z/Space jump", { size: 8 }),
      k.pos(160, 108),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[14])),
      k.fixed(),
    ]);

    const prompt = k.add([
      k.text("PRESS ENTER", { size: 10 }),
      k.pos(160, 140),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[4])),
      k.fixed(),
      k.opacity(1),
    ]);

    let blink = 0;
    prompt.onUpdate(() => {
      blink += k.dt();
      prompt.opacity = Math.sin(blink * 6) > 0 ? 1 : 0.25;
    });

    let started = false;
    const start = () => {
      if (started) {
        return "already";
      }
      started = true;
      try {
        playSfx("select");
      } catch {
        // ignore audio
      }
      run.score = 0;
      run.lives = 3;
      run.level = 1;
      run.coins = 0;
      run.state = "playing";
      run.scene = "game";
      try {
        window.__game = {
          extra: { coins: run.coins, paused: run.paused, ...run.extra },
          level: run.level,
          lives: run.lives,
          scene: run.scene,
          score: run.score,
          slug: "_template",
          state: run.state,
        };
        k.go("game");
        return "went";
      } catch (err) {
        console.error("go game failed", err);
        return `err:${err instanceof Error ? err.message : String(err)}`;
      }
    };

    (window as unknown as { __startGame?: () => unknown }).__startGame = start;

    const onDomKey = (ev: KeyboardEvent) => {
      const key = ev.key.toLowerCase();
      if (key === "enter" || key === " " || key === "z") {
        ev.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onDomKey);

    k.onButtonPress("start", () => {
      start();
    });
    k.onKeyPress("enter", () => {
      start();
    });
    k.onKeyPress("space", () => {
      start();
    });
  });
};

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
