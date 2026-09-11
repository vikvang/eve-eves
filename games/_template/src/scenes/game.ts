import type { RetroKaplay } from "@games/kit";
import { playSfx, SWEETIE16, TILE_SIZE } from "@games/kit";
import { spawnCoin } from "../entities/coin.js";
import { spawnEnemy } from "../entities/enemy.js";
import { spawnPlayer, tileToWorld } from "../entities/player.js";
import { LEVEL_1 } from "../levels/level1.js";
import { LEVEL_2 } from "../levels/level2.js";
import type { RunState } from "../state.js";

const LEVELS: string[][] = [LEVEL_1.map(String), LEVEL_2.map(String)];

export const registerGameScene = (k: RetroKaplay, run: RunState): void => {
  k.scene("game", () => {
    try {
      run.state = "playing";
      run.scene = "game";
      run.paused = false;
      run.extra.won = false;

      k.setGravity(900);

      const map =
        LEVELS[Math.max(0, Math.min(run.level - 1, LEVELS.length - 1))] ??
        LEVEL_1.map(String);
      let playerSpawn = { x: 16, y: 144 };
      let flagPos: { x: number; y: number } | null = null;

      // build tiles
      for (let ty = 0; ty < map.length; ty++) {
        const row = map[ty] ?? "";
        for (let tx = 0; tx < row.length; tx++) {
          const ch = row[tx] ?? ".";
          const { x, y } = tileToWorld(tx, ty);
          if (ch === "=") {
            k.add([
              k.sprite("block"),
              k.pos(tx * TILE_SIZE, ty * TILE_SIZE),
              k.area(),
              k.body({ isStatic: true }),
              k.anchor("topleft"),
              "solid",
            ]);
          } else if (ch === "C") {
            spawnCoin(k, x + 8, y - 8, run);
          } else if (ch === "E") {
            spawnEnemy(k, x, y);
          } else if (ch === "P") {
            playerSpawn = { x, y };
          } else if (ch === "F") {
            flagPos = { x, y };
            k.add([
              k.sprite("flag"),
              k.pos(x, y),
              k.area(),
              k.anchor("botleft"),
              "flag",
            ]);
          }
        }
      }

      // level 1 has no flag; clearing coins + reaching right edge advances
      if (!flagPos && run.level === 1) {
        k.add([k.rect(8, 32), k.pos(312, 112), k.area(), k.opacity(0), "exit"]);
      }

      let dying = false;

      const die = () => {
        if (dying) {
          return;
        }
        dying = true;
        run.lives -= 1;
        playSfx("lose");
        k.shake(6);
        k.wait(0.6, () => {
          if (run.lives <= 0) {
            run.extra.won = false;
            k.go("gameover");
          } else {
            k.go("game");
          }
        });
      };

      const player = spawnPlayer(k, {
        onDie: die,
        x: playerSpawn.x,
        y: playerSpawn.y,
      });

      player.onCollide("flag", () => {
        winLevel();
      });

      player.onCollide("exit", () => {
        winLevel();
      });

      const winLevel = () => {
        if (dying) {
          return;
        }
        dying = true;
        playSfx("win");
        k.shake(3);
        run.score += 500;
        k.wait(0.5, () => {
          if (run.level >= LEVELS.length) {
            run.extra.won = true;
            run.state = "win";
            k.go("gameover");
          } else {
            run.level += 1;
            dying = false;
            k.go("game");
          }
        });
      };

      // HUD
      const scoreLabel = k.add([
        k.text("", { size: 8 }),
        k.pos(4, 4),
        k.color(...hex(SWEETIE16[12])),
        k.fixed(),
        k.z(100),
      ]);
      const livesLabel = k.add([
        k.text("", { size: 8 }),
        k.pos(4, 14),
        k.color(...hex(SWEETIE16[4])),
        k.fixed(),
        k.z(100),
      ]);

      scoreLabel.onUpdate(() => {
        scoreLabel.text = `SCORE ${run.score}  LV ${run.level}`;
        livesLabel.text = `LIVES ${run.lives}  COINS ${run.coins}`;
      });

      k.onButtonPress("pause", () => {
        run.paused = !run.paused;
        if (run.paused) {
          k.debug.paused = true;
        } else {
          k.debug.paused = false;
        }
      });

      k.onUpdate(() => {
        k.setCamPos(k.vec2(160, 90));
      });
    } catch (err) {
      console.error("game scene failed", err);
      throw err;
    }
  });
};

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
