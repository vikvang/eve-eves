import kaplay, { type KAPLAYCtx, type KAPLAYOpt } from "kaplay";
import { SWEETIE16 } from "./palette.js";

export const LOGICAL_WIDTH = 320;
export const LOGICAL_HEIGHT = 180;
export const TILE_SIZE = 16;

export type CreateRetroGameOpts = {
  /** Canvas parent; defaults to document body. */
  root?: HTMLElement;
  /** Background Sweetie-16 index or hex. Default 0 (dark). */
  background?: string | number;
  /** Extra Kaplay options merged last. */
  kaplay?: Partial<KAPLAYOpt>;
  /** Stretch to fill (letterboxed). Default true. */
  letterbox?: boolean;
  /** Crisp pixel scaling. Default true. */
  crisp?: boolean;
};

const integerScale = (maxW: number, maxH: number): number => {
  const sx = Math.floor(maxW / LOGICAL_WIDTH);
  const sy = Math.floor(maxH / LOGICAL_HEIGHT);
  return Math.max(1, Math.min(sx, sy));
};

/**
 * Boot Kaplay locked to 320x180 logical resolution with integer scale,
 * crisp pixels, Sweetie-16 background, and letterboxing.
 */
export const createRetroGame = (opts: CreateRetroGameOpts = {}): KAPLAYCtx => {
  let bgHex: string = SWEETIE16[0];
  if (typeof opts.background === "number") {
    const idx = Math.max(0, Math.min(15, Math.floor(opts.background)));
    bgHex = SWEETIE16[idx] ?? SWEETIE16[0];
  } else if (typeof opts.background === "string") {
    bgHex = opts.background;
  }

  const parent = opts.root ?? document.body;
  const maxW = window.innerWidth || LOGICAL_WIDTH;
  const maxH = window.innerHeight || LOGICAL_HEIGHT;
  const scale = integerScale(maxW, maxH);

  // Kaplay 4000 requires an explicit canvas element for initApp.
  const canvas = document.createElement("canvas");
  canvas.width = LOGICAL_WIDTH;
  canvas.height = LOGICAL_HEIGHT;
  canvas.style.display = "block";
  canvas.style.imageRendering = "pixelated";
  parent.appendChild(canvas);

  const k = kaplay({
    background: hexToRgbArray(bgHex),
    buttons: {
      action: { keyboard: ["x"] },
      down: { keyboard: ["down", "s"] },
      jump: { keyboard: ["z", "space"] },
      left: { keyboard: ["left", "a"] },
      pause: { keyboard: ["escape"] },
      right: { keyboard: ["right", "d"] },
      start: { keyboard: ["enter"] },
      up: { keyboard: ["up", "w"] },
    },
    canvas,
    crisp: opts.crisp ?? true,
    global: false,
    height: LOGICAL_HEIGHT,
    letterbox: opts.letterbox ?? true,
    root: parent,
    scale,
    touchToMouse: false,
    width: LOGICAL_WIDTH,
    ...opts.kaplay,
  });

  return k;
};

const hexToRgbArray = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

export type RetroKaplay = KAPLAYCtx;
