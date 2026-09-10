import { defineTool } from "eve/tools";
import { z } from "zod";
import { REPO_DIR } from "../../../lib/github/git-remote.js";

/**
 * Characters allowed in a game slug interpolated into a path.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface PlaytestCheck {
  evidence?: string;
  id?: string;
  passed?: boolean;
}

interface PlaytestReport {
  checks?: PlaytestCheck[];
  consoleErrors?: string[];
  passed?: boolean;
  screenshots?: string[];
  slug?: string;
}

/**
 * Reads `games/<slug>/playtest/report.json` from the sandbox checkout.
 */
export default defineTool({
  description:
    "Read the playtest harness report at games/<slug>/playtest/report.json after run_playtest. Returns the parsed JSON fields the player needs for its verdict.",
  async execute(input, ctx) {
    if (!SLUG_PATTERN.test(input.slug)) {
      return {
        error: `"${input.slug}" is not a valid game slug.`,
        found: false as const,
      };
    }
    const path = `${REPO_DIR}/games/${input.slug}/playtest/report.json`;
    const sandbox = await ctx.getSandbox();
    try {
      const text = await sandbox.readTextFile({ path });
      if (text === null) {
        return { error: "Playtest report not found.", found: false as const };
      }
      const raw = typeof text === "string" ? text : String(text);
      const report = JSON.parse(raw) as PlaytestReport;
      return {
        checks: Array.isArray(report.checks)
          ? report.checks.map((check) => ({
              evidence: String(check.evidence ?? ""),
              id: String(check.id ?? "unknown"),
              passed: Boolean(check.passed),
            }))
          : [],
        consoleErrors: Array.isArray(report.consoleErrors)
          ? report.consoleErrors.map((entry) => String(entry))
          : [],
        found: true as const,
        passed: Boolean(report.passed),
        path: `games/${input.slug}/playtest/report.json`,
        screenshots: Array.isArray(report.screenshots)
          ? report.screenshots.map((entry) => String(entry))
          : [],
        slug: String(report.slug ?? input.slug),
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to read playtest report",
        found: false as const,
      };
    }
  },
  inputSchema: z.object({
    slug: z.string().min(1).max(64).describe("Game slug under games/<slug>/."),
  }),
});
