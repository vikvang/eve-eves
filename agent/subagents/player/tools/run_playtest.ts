import { defineTool } from "eve/tools";
import { z } from "zod";
import { REPO_DIR } from "../../../lib/github/git-remote.js";

/**
 * Characters allowed in a game slug interpolated into a shell command.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const GENRES = ["platformer", "shmup", "arcade", "puzzle"] as const;

/**
 * Runs the repository playtest harness for one game slug inside the sandbox.
 *
 * @remarks
 * The slug is validated before interpolation. The harness owns browser launch
 * (Playwright chromium); this station has no separate computer-use or port
 * exposure tool. Report parsing is left to `read_playtest_report` so a partial
 * run still returns raw stdout/stderr here.
 */
export default defineTool({
  description: `Run \`pnpm playtest <slug>\` in ${REPO_DIR} for a game under games/<slug>. Optionally pass a genre flag the harness understands. Returns exit code, stdout, stderr, and whether report.json was found. Call checkout_branch first.`,
  async execute(input, ctx) {
    if (!SLUG_PATTERN.test(input.slug)) {
      return {
        error: `"${input.slug}" is not a valid game slug (lowercase letters, digits, hyphens).`,
        exitCode: null,
        reportFound: false,
        stderr: "",
        stdout: "",
        success: false as const,
      };
    }
    const genreFlag =
      input.genre === undefined ? "" : ` --genre ${input.genre}`;
    const sandbox = await ctx.getSandbox();
    const result = await sandbox.run({
      command: `cd ${REPO_DIR} && pnpm playtest '${input.slug}'${genreFlag}`,
    });
    const reportPath = `${REPO_DIR}/games/${input.slug}/playtest/report.json`;
    let reportFound = false;
    try {
      const reportText = await sandbox.readTextFile({ path: reportPath });
      reportFound = reportText !== null && String(reportText).length > 0;
    } catch {
      reportFound = false;
    }
    const exitCode =
      typeof result.exitCode === "number" ? result.exitCode : null;
    return {
      exitCode,
      reportFound,
      reportPath: reportFound
        ? `games/${input.slug}/playtest/report.json`
        : undefined,
      stderr: String(result.stderr ?? "").slice(0, 20_000),
      stdout: String(result.stdout ?? "").slice(0, 20_000),
      success: exitCode === 0,
    };
  },
  inputSchema: z.object({
    genre: z
      .enum(GENRES)
      .optional()
      .describe("Optional genre script for the harness."),
    slug: z
      .string()
      .min(1)
      .max(64)
      .describe("Game slug under games/<slug>/, e.g. space-hop."),
  }),
});
