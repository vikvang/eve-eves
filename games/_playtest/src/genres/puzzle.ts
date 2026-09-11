import type { GenreScript } from "../types.js";

export const puzzleScript: GenreScript = {
  genre: "puzzle",
  run: async (ctx) => {
    const title = await ctx.waitForState("title", 15_000);
    ctx.addCheck(
      "title-state",
      title.state === "title",
      `state=${title.state}`
    );
    await ctx.screenshot("title");

    await ctx.page.evaluate(() => {
      const w = window as unknown as { __startGame?: () => void };
      w.__startGame?.();
    });
    await ctx.sleep(300);
    let playing = await ctx.getSeam();
    if (playing?.state !== "playing") {
      await ctx.press("Enter", 100);
      playing = await ctx.waitForState("playing", 8000);
    }
    ctx.addCheck(
      "start-playing",
      playing!.state === "playing",
      `state=${playing!.state}`
    );
    await ctx.screenshot("gameplay");

    for (let i = 0; i < 14; i++) {
      await ctx.press(i % 2 === 0 ? "ArrowLeft" : "ArrowRight", 80);
      await ctx.press("z", 80);
      await ctx.press("x", 80);
      await ctx.hold(["ArrowDown"], 300);
      await ctx.sleep(200);
    }

    await ctx.sleep(1000);
    const end = await ctx.getSeam();
    ctx.addCheck(
      "session-held",
      end !== null && end.state !== "title",
      end ? `state=${end.state} score=${end.score}` : "no seam"
    );
    await ctx.screenshot("end");
  },
};
