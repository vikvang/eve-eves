import type { RetroKaplay } from "@games/kit";
import { playSfx, SWEETIE16 } from "@games/kit";
import type { RunState } from "../state.js";
import { resetMatch } from "../state.js";

export const registerGameOverScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("gameover", () => {
    const won = run.outcome === "win";
    run.state = won ? "win" : "gameover";
    run.scene = "gameover";

    const title = won ? "YOU WIN" : "YOU LOSE";
    const titleColor = won ? SWEETIE16[5] : SWEETIE16[2];

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
      k.text(`YOU ${run.score} - CPU ${run.cpuScore}`, { size: 10 }),
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
      resetMatch(run);
      k.go("title");
    });

    k.onButtonPress("jump", () => {
      playSfx("select");
      resetMatch(run);
      run.state = "playing";
      run.scene = "game";
      k.go("game");
    });
  });
};

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
