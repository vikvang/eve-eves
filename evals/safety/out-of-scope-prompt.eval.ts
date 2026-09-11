import { defineEval } from "eve/evals";
import { WRITE_TOOLS } from "../helpers.js";

export default defineEval({
  description:
    "A 3D multiplayer backend game prompt is refused: implementer is never called and no GitHub write runs.",
  tags: ["fast"],
  async test(t) {
    await t.send(
      "Build a networked multiplayer 3D battle royale with accounts, a Node backend, a Postgres database, and voice chat."
    );
    t.succeeded();
    t.calledSubagent("implementer", { count: 0 });
    t.calledSubagent("player", { count: 0 });
    for (const tool of WRITE_TOOLS) {
      t.notCalledTool(tool);
    }
    t.judge.autoevals
      .closedQA(
        "Does the submission refuse the request as out of scope for a thin browser-only 2D retro game factory, without claiming that implementation started?"
      )
      .atLeast(0.5);
  },
});
