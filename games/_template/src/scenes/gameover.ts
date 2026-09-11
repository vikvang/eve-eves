import type { RetroKaplay } from "@games/kit";
import { playSfx, SWEETIE16 } from "@games/kit";
import type { RunState } from "../state.js";

export const registerGameOverScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("gameover", () => {
    run.state = run.extra.won === true ? "win" : "gameover";
    run.scene = "gameover";

    const title = run.extra.won === true ? "YOU WIN" : "GAME OVER";
    const titleColor = run.extra.won === true ? SWEETIE16[5] : SWEETIE16[2];

    k.add([
      k.rect(320, 180),
      k.pos(0, 0),
      k.color(...hex(SWEETIE16[0])),
      k.fixed(),
    ]);

    k.add([
      k.text(title, { size: 16 }),
      k.pos(160, 56),
      k.anchor("center"),
      k.color(...hex(titleColor)),
      k.fixed(),
    ]);

    k.add([
      k.text(`SCORE ${run.score}`, { size: 10 }),
      k.pos(160, 88),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[12])),
      k.fixed(),
    ]);

    k.add([
      k.text("ENTER title  Z retry", { size: 8 }),
      k.pos(160, 130),
      k.anchor("center"),
      k.color(...hex(SWEETIE16[13])),
      k.fixed(),
    ]);

    k.onButtonPress("start", () => {
      playSfx("select");
      run.extra = {};
      k.go("title");
    });

    k.onButtonPress("jump", () => {
      playSfx("select");
      run.score = 0;
      run.lives = 3;
      run.level = 1;
      run.coins = 0;
      run.extra = {};
      k.go("game");
    });
  });
};

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
