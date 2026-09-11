import type { GenreScript } from "../types.js";

export const shmupScript: GenreScript = {
  genre: "shmup",
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

    for (let i = 0; i < 12; i++) {
      await ctx.hold([i % 2 === 0 ? "ArrowLeft" : "ArrowRight"], 400);
      await ctx.press("Space", 50);
      await ctx.press("z", 50);
      await ctx.hold(["ArrowUp"], 200);
      await ctx.hold(["ArrowDown"], 200);
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
