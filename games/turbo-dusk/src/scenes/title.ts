import type { RetroKaplay } from "@games/kit";
import { hexToRgb, playSfx, SWEETIE16 } from "@games/kit";
import { flashScreen } from "../fx.js";
import type { RunState } from "../state.js";
import { resetForNewRun, toSeam } from "../state.js";

export const registerTitleScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("title", () => {
    run.state = "title";
    run.scene = "title";
    run.paused = false;

    k.add([
      k.rect(320, 180),
      k.pos(0, 0),
      k.color(...hexToRgb(SWEETIE16[1])),
      k.fixed(),
    ]);

    // Sunset horizon bands.
    k.add([
      k.rect(320, 26),
      k.pos(0, 128),
      k.color(...hexToRgb(SWEETIE16[3])),
      k.fixed(),
    ]);
    k.add([
      k.rect(320, 26),
      k.pos(0, 154),
      k.color(...hexToRgb(SWEETIE16[15])),
      k.fixed(),
    ]);

    k.add([
      k.text("TURBO DUSK", { size: 16 }),
      k.pos(160, 40),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[3])),
      k.fixed(),
    ]);

    k.add([
      k.text("Three gates. One tank. Beat the dark.", { size: 8 }),
      k.pos(160, 62),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
    ]);

    const car = k.add([
      k.sprite("roadster"),
      k.pos(160, 96),
      k.anchor("center"),
      k.fixed(),
    ]);
    let sway = 0;
    car.onUpdate(() => {
      sway += k.dt();
      car.pos.x = 160 + Math.sin(sway * 2) * 6;
    });

    k.add([
      k.text("Arrows/WASD steer   Z/Space boost   Esc pause", { size: 8 }),
      k.pos(160, 122),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[13])),
      k.fixed(),
    ]);

    const prompt = k.add([
      k.text("PRESS ENTER", { size: 10 }),
      k.pos(160, 144),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
      k.opacity(1),
    ]);

    let blink = 0;
    prompt.onUpdate(() => {
      blink += k.dt();
      prompt.opacity = Math.sin(blink * 6) > 0 ? 1 : 0.25;
    });

    let started = false;
    const start = (): void => {
      if (started) {
        return;
      }
      started = true;
      playSfx("select");
      flashScreen(k, 4, 0.25);
      resetForNewRun(run);
      run.state = "playing";
      run.scene = "game";
      window.__game = toSeam(run);
      k.go("game");
    };

    (window as unknown as { __startGame?: () => void }).__startGame = start;

    const onDomKey = (ev: KeyboardEvent): void => {
      const key = ev.key.toLowerCase();
      if (key === "enter" || key === " " || key === "z") {
        ev.preventDefault();
        start();
        window.removeEventListener("keydown", onDomKey);
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
