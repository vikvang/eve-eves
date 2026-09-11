import { defineAgent } from "eve";
import { MODELS } from "../../lib/models.js";

/**
 * Playtest station: independent smoke and feel check on a pushed game branch.
 *
 * @remarks
 * Runs on a different model vendor than the implementer on purpose. Checks out
 * the branch, runs `pnpm playtest <slug>`, reads report.json and screenshots,
 * and returns pass or revise. Never modifies game code.
 */
export default defineAgent({
  description:
    "Playtest a pushed factory game branch: checkout the branch, run pnpm playtest <slug>, " +
    "read the report and screenshots, and return pass or revise with checks, console errors, " +
    "feel notes, and screenshot paths. Never modifies code. The caller passes the slug, " +
    "branch, genre, game-brief artifact id, and implementer summary.",
  model: MODELS.player,
  outputSchema: {
    additionalProperties: false,
    properties: {
      checks: {
        description: "Individual playtest checks with evidence.",
        items: {
          additionalProperties: false,
          properties: {
            evidence: {
              description: "What showed the check passing or failing.",
              type: "string",
            },
            id: {
              description: "Check id from the harness or your review.",
              type: "string",
            },
            passed: { type: "boolean" },
          },
          required: ["id", "passed", "evidence"],
          type: "object",
        },
        type: "array",
      },
      console_errors: {
        description: "Browser console errors from the playtest run.",
        items: { type: "string" },
        type: "array",
      },
      feel_notes: {
        description: "Short notes on juice, controls, pacing, and clarity.",
        items: { type: "string" },
        type: "array",
      },
      screenshots: {
        description:
          "Paths to playtest screenshots under games/<slug>/playtest/.",
        items: { type: "string" },
        type: "array",
      },
      summary: {
        description: "One paragraph: the verdict and what drove it.",
        type: "string",
      },
      verdict: {
        enum: ["pass", "revise"],
        type: "string",
      },
    },
    required: [
      "verdict",
      "checks",
      "console_errors",
      "feel_notes",
      "screenshots",
      "summary",
    ],
    type: "object",
  },
});
