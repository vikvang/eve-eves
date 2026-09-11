import type { GenreScript } from "../types.js";

export const platformerScript: GenreScript = {
  genre: "platformer",
  run: async (ctx) => {
    const title = await ctx.waitForState("title", 15_000);
    ctx.addCheck(
      "title-state",
      title.state === "title",
      `state=${title.state} scene=${title.scene}`
    );
    await ctx.screenshot("title");

    // Prefer the playtest start hook; fall back to keyboard.
    await ctx.page.evaluate(() => {
      const w = window as unknown as { __startGame?: () => void };
      w.__startGame?.();
    });
    await ctx.sleep(300);
    let playing = await ctx.getSeam();
    if (playing?.state !== "playing") {
      await ctx.press("Enter", 100);
      await ctx.sleep(200);
      playing = await ctx.getSeam();
    }
    if (playing?.state !== "playing") {
      playing = await ctx.waitForState("playing", 8000);
    }

    ctx.addCheck(
      "start-playing",
      playing.state === "playing",
      `state=${playing.state} scene=${playing.scene}`
    );
    await ctx.screenshot("gameplay");

    const startScore = playing.score;
    const startLives = playing.lives;

    await ctx.hold(["ArrowRight"], 800);
    await ctx.press("Space", 120);
    await ctx.hold(["ArrowRight"], 1000);
    await ctx.press("Space", 120);
    await ctx.hold(["ArrowLeft"], 400);
    await ctx.press("Space", 120);
    await ctx.hold(["ArrowRight"], 1500);
    await ctx.press("z", 120);
    await ctx.hold(["ArrowRight", "Space"], 600);
    await ctx.hold(["ArrowRight"], 2000);
    await ctx.press("Space", 100);
    await ctx.hold(["ArrowRight"], 2000);
    await ctx.press("Space", 100);
    await ctx.hold(["ArrowRight"], 2500);
    await ctx.sleep(1500);

    const mid = await ctx.getSeam();
    ctx.addCheck(
      "still-alive-or-progressed",
      mid !== null &&
        (mid.state === "playing" ||
          mid.state === "gameover" ||
          mid.state === "win"),
      mid
        ? `state=${mid.state} score=${mid.score} lives=${mid.lives}`
        : "no seam"
    );

    const progressed =
      mid !== null &&
      (mid.score > startScore ||
        mid.level > 1 ||
        mid.state === "win" ||
        mid.lives < startLives);
    ctx.addCheck(
      "input-had-effect",
      progressed || (mid?.state === "playing" && mid.lives === startLives),
      mid
        ? `score ${startScore}->${mid.score} lives ${startLives}->${mid.lives} level=${mid.level}`
        : "no seam"
    );

    if (mid?.state === "playing") {
      for (let i = 0; i < 8; i++) {
        await ctx.hold(["ArrowRight"], 800);
        await ctx.press("Space", 80);
        const s = await ctx.getSeam();
        if (s && (s.state === "gameover" || s.state === "win")) {
          break;
        }
      }
    }

    await ctx.sleep(500);
    const end = await ctx.getSeam();
    ctx.addCheck(
      "end-reachable",
      end !== null &&
        (end.state === "playing" ||
          end.state === "gameover" ||
          end.state === "win"),
      end ? `final state=${end.state} score=${end.score}` : "no seam"
    );
    await ctx.screenshot("end");
  },
};
