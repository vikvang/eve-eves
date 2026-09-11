import { defineEval } from "eve/evals";
import { calledInOrder, STATIONS } from "../helpers.js";

export default defineEval({
  description:
    "A small in-scope game prompt runs the whole line: implementer then player fire in order and the final report names the branch or draft pull request. Opt-in: this pushes a real branch to FACTORY_REPO, so run it deliberately against a scratch repository (pnpm eval pipeline/full-pipeline).",
  tags: ["slow", "needs-connect", "pipeline"],
  async test(t) {
    await t.send(
      "Make a tiny single-player arcade game called dot-catch: move a paddle with arrows, catch falling dots, score points, title and game-over screens, Sweetie-16, keyboard only. Run the full pipeline and deliver the result."
    );
    t.succeeded();
    for (const station of STATIONS) {
      t.calledSubagent(station);
    }
    t.eventsSatisfy("stations ran in pipeline order", (events) =>
      calledInOrder(events, [...STATIONS])
    );
    t.judge.autoevals
      .closedQA(
        "Does the submission report completed work and point at a concrete deliverable, naming a branch or a draft pull request (a link or an identifier), with a playtest verdict?"
      )
      .atLeast(0.5);
  },
  timeoutMs: 1_800_000,
});
