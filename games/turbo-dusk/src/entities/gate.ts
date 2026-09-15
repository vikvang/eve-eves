import type { RetroKaplay } from "@games/kit";
import { hexToRgb, SWEETIE16 } from "@games/kit";
import { ROAD_LEFT, ROAD_RIGHT } from "../rules.js";
import type { ScrollerOpts } from "./traffic.js";

export type GateOpts = ScrollerOpts & {
  /** Fired once, the frame the gate banner passes the player car. */
  onCross: () => void;
};

const CROSS_Y = 150;
const GATE_W = ROAD_RIGHT - ROAD_LEFT;

/**
 * A checkpoint gate: a checkered banner spanning the road. Crossing is
 * detected by the banner scrolling past the player's y position.
 */
export const spawnGate = (k: RetroKaplay, opts: GateOpts) => {
  const gate = k.add([
    k.sprite("gate"),
    k.pos(ROAD_LEFT, -24),
    k.scale(GATE_W / 16, 1),
    k.anchor("topleft"),
    k.opacity(1),
    k.z(6),
    "gate",
  ]);

  const postLeft = k.add([
    k.rect(4, 14),
    k.pos(ROAD_LEFT - 5, -24),
    k.color(...hexToRgb(SWEETIE16[12])),
    k.z(6),
    "gatepost",
  ]);
  const postRight = k.add([
    k.rect(4, 14),
    k.pos(ROAD_RIGHT + 1, -24),
    k.color(...hexToRgb(SWEETIE16[12])),
    k.z(6),
    "gatepost",
  ]);

  let crossed = false;
  let flashT = 0;

  gate.onUpdate(() => {
    if (opts.isFrozen()) {
      return;
    }
    gate.pos.y += opts.relativeSpeed() * k.dt();
    postLeft.pos.y = gate.pos.y - 3;
    postRight.pos.y = gate.pos.y - 3;

    // Banner flashes as it approaches.
    flashT += k.dt();
    gate.opacity = Math.sin(flashT * 10) > -0.5 ? 1 : 0.55;

    if (!crossed && gate.pos.y > CROSS_Y) {
      crossed = true;
      opts.onCross();
    }
    if (gate.pos.y > 220) {
      gate.destroy();
      postLeft.destroy();
      postRight.destroy();
    }
  });

  return gate;
};
