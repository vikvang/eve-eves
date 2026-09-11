import { defineEval } from "eve/evals";
import { calledInOrder } from "../helpers.js";

export default defineEval({
  description:
    "An in-scope single-player retro game prompt runs implementer then player in order.",
  tags: ["fast"],
  async test(t) {
    await t.send(
      "Make a tiny single-player platformer called moss-hop: 320x180, Sweetie-16, jump on mushrooms, three short levels, title and game-over screens, keyboard only."
    );
    t.succeeded();
    t.calledSubagent("implementer");
    t.calledSubagent("player");
    t.eventsSatisfy("implementer is delegated to before the player", (events) =>
      calledInOrder(events, ["implementer", "player"])
    );
  },
});
