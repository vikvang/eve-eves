import { defineAgent } from "eve";
import { MODELS } from "../../lib/models.js";

/**
 * Implementation station for a retro game.
 *
 * @remarks
 * Reads the game brief, scaffolds `games/<slug>/` from `_template`, implements
 * the game, verifies with the repository's own checks, commits on
 * `factory/game-<slug>`, and pushes with `push_branch`. The push is the
 * station's only side effect and it is inert by construction: feature branches
 * only, credential brokered at the sandbox firewall. The pull request is opened
 * later by the orchestrator, after the player passes.
 */
export default defineAgent({
  description:
    "Implement a thin browser-only 2D retro game in the factory repository: " +
    "scaffold games/<slug> from _template, code scenes and entities from the game brief, " +
    "run typecheck/check/test/build, commit, and push factory/game-<slug>. Returns branch, " +
    "slug, path, files changed, verification, and known gaps. The caller passes the prompt, " +
    "slug, genre, and game-brief artifact id; on revision it also passes the branch and " +
    "playtest findings.",
  model: MODELS.implementer,
  outputSchema: {
    additionalProperties: false,
    properties: {
      branch: {
        description: "The feature branch pushed, e.g. factory/game-space-hop.",
        type: "string",
      },
      files_changed: {
        description: "Paths touched relative to the repository root.",
        items: { type: "string" },
        type: "array",
      },
      game_path: {
        description: "Path to the game app, e.g. games/space-hop.",
        type: "string",
      },
      game_slug: {
        description: "Kebab-case game slug matching games/<slug>/.",
        type: "string",
      },
      known_gaps: {
        description:
          "Anything the player or a human should scrutinize; empty when none.",
        items: { type: "string" },
        type: "array",
      },
      verification: {
        description: "Commands run and what they produced, exactly.",
        items: {
          additionalProperties: false,
          properties: {
            command: { description: "The command as run.", type: "string" },
            result: {
              description:
                "What it produced: pass/fail and the relevant output.",
              type: "string",
            },
          },
          required: ["command", "result"],
          type: "object",
        },
        type: "array",
      },
    },
    required: [
      "branch",
      "game_slug",
      "game_path",
      "files_changed",
      "verification",
      "known_gaps",
    ],
    type: "object",
  },
});
