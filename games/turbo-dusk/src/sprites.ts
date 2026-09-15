import { type PaletteMap, spriteFromGrid } from "@games/kit";

/**
 * Shared 12x14 top-down car silhouette. Recolored per palette map for the
 * player roadster and the traffic family.
 */
const CAR_GRID = [
  "....KKKK....",
  "...KHOOHK...",
  "..KKOOOOKK..",
  ".KKKOOOOKKK.",
  ".KKKOWWOKKK.",
  "..KOWWWWOK..",
  "..KOOOOOOK..",
  "..KOOOOOOK..",
  ".KKKOOOOKKK.",
  ".KKKOOOOKKK.",
  "..KOOOOOOK..",
  "..KOHOOHOK..",
  "...KOOOOK...",
  "....KKKK....",
];

const roadsterMap: PaletteMap = {
  ".": "transparent",
  H: 4,
  K: 15,
  O: 3,
  W: 11,
};

const trafficMap: PaletteMap = {
  ".": "transparent",
  H: 12,
  K: 15,
  O: 2,
  W: 13,
};

const FUEL_GRID = [
  "..KKK...",
  "..K.K...",
  ".KKKKKK.",
  ".KYYYYK.",
  ".KYKKYK.",
  ".KYYYYK.",
  ".KYYYYK.",
  ".KKKKKK.",
];

const fuelMap: PaletteMap = {
  ".": "transparent",
  K: 15,
  Y: 4,
};

const GATE_GRID = [
  "KKKKKKKKKKKKKKKK",
  "KOYYOOYYOOYYOOYK",
  "KOYYOOYYOOYYOOYK",
  "KYOOYYOOYYOOYYOK",
  "KYOOYYOOYYOOYYOK",
  "KOYYOOYYOOYYOOYK",
  "KOYYOOYYOOYYOOYK",
  "KKKKKKKKKKKKKKKK",
];

const gateMap: PaletteMap = {
  ".": "transparent",
  K: 15,
  O: 3,
  Y: 4,
};

export const loadGameSprites = (
  loadSprite: (name: string, src: string) => unknown
): void => {
  loadSprite("roadster", spriteFromGrid(CAR_GRID, roadsterMap));
  loadSprite("traffic", spriteFromGrid(CAR_GRID, trafficMap));
  loadSprite("fuelcan", spriteFromGrid(FUEL_GRID, fuelMap));
  loadSprite("gate", spriteFromGrid(GATE_GRID, gateMap));
};
