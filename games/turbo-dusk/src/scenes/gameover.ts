import type { RetroKaplay } from "@games/kit";
import { hexToRgb, playSfx, SWEETIE16 } from "@games/kit";
import { TOTAL_GATES } from "../rules.js";
import type { RunState } from "../state.js";
import { resetForNewRun } from "../state.js";

export const registerGameOverScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("gameover", () => {
    const won = run.extra.won === true;
    run.state = won ? "win" : "gameover";
    run.scene = "gameover";
    run.paused = false;

    const title = won ? "CHECKERED SKY" : "OUT OF ROAD";
    const titleColor = won ? SWEETIE16[4] : SWEETIE16[2];

    k.add([
      k.rect(320, 180),
      k.pos(0, 0),
      k.color(...hexToRgb(SWEETIE16[won ? 1 : 0])),
      k.fixed(),
    ]);

    k.add([
      k.text(title, { size: 16 }),
      k.pos(160, 48),
      k.anchor("center"),
      k.color(...hexToRgb(titleColor)),
      k.fixed(),
    ]);

    k.add([
      k.text(won ? "You beat the dusk!" : "The dusk caught you.", {
        size: 8,
      }),
      k.pos(160, 70),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[13])),
      k.fixed(),
    ]);

    k.add([
      k.text(`SCORE ${run.score}`, { size: 10 }),
      k.pos(160, 94),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[12])),
      k.fixed(),
    ]);

    k.add([
      k.text(`GATES ${run.checkpoint}/${TOTAL_GATES}`, { size: 8 }),
      k.pos(160, 110),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[4])),
      k.fixed(),
    ]);

    k.add([
      k.text("ENTER title   Z retry", { size: 8 }),
      k.pos(160, 140),
      k.anchor("center"),
      k.color(...hexToRgb(SWEETIE16[13])),
      k.fixed(),
    ]);

    k.onButtonPress("start", () => {
      playSfx("select");
      k.go("title");
    });

    k.onButtonPress("jump", () => {
      playSfx("select");
      resetForNewRun(run);
      run.state = "playing";
      run.scene = "game";
      k.go("game");
    });
  });
};
