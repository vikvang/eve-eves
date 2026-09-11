import { type PaletteMap, spriteFromGrid } from "@games/kit";

const solidMap: PaletteMap = {
  " ": "transparent",
  ".": "transparent",
  "#": 14,
  "=": 6,
};

const playerMap: PaletteMap = {
  " ": "transparent",
  ".": "transparent",
  "#": 10,
  o: 12,
};

const coinMap: PaletteMap = {
  ".": "transparent",
  "#": 4,
  o: 5,
};

const enemyMap: PaletteMap = {
  ".": "transparent",
  "#": 2,
  o: 3,
};

const flagMap: PaletteMap = {
  ".": "transparent",
  "#": 5,
  "|": 13,
};

export const loadGameSprites = (
  loadSprite: (name: string, src: string) => unknown
): void => {
  loadSprite(
    "player",
    spriteFromGrid(
      [
        "..####..",
        ".######.",
        ".#oo##o.",
        ".######.",
        "..####..",
        ".##..##.",
        ".##..##.",
        "........",
      ],
      playerMap
    )
  );

  loadSprite(
    "block",
    spriteFromGrid(
      [
        "################",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "################",
        "################",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "#==============#",
        "################",
      ],
      solidMap
    )
  );

  loadSprite(
    "coin",
    spriteFromGrid(
      [
        "..####..",
        ".#oooo#.",
        "#oooooo#",
        "#oo##oo#",
        "#oo##oo#",
        "#oooooo#",
        ".#oooo#.",
        "..####..",
      ],
      coinMap
    )
  );

  loadSprite(
    "enemy",
    spriteFromGrid(
      [
        "..####..",
        ".######.",
        "#o####o#",
        "########",
        ".######.",
        "#.#..#.#",
        "#......#",
        "........",
      ],
      enemyMap
    )
  );

  loadSprite(
    "flag",
    spriteFromGrid(
      [
        "|#######",
        "|#####..",
        "|###....",
        "|#......",
        "|.......",
        "|.......",
        "|.......",
        "|.......",
      ],
      flagMap
    )
  );
};
