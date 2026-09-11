import { defineTool, toolOutput, toolOutputPart } from "eve/tools";
import { z } from "zod";
import { REPO_DIR } from "../../../lib/github/git-remote.js";

/**
 * Paths must stay under the repo playtest tree: games/<slug>/playtest/*.png
 */
const PLAYTEST_PNG =
  /^games\/[a-z0-9]+(?:-[a-z0-9]+)*\/playtest\/[A-Za-z0-9._-]+\.png$/;

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/**
 * Reads a playtest PNG from the sandbox and hands the pixels to the model.
 *
 * @remarks
 * Sandbox `readBinaryFile` returns raw bytes; eve tool outputs must cross a
 * durable JSON boundary, so the file is base64-encoded and returned via
 * `toModelOutput` content parts (`toolOutputPart.file`). There is no framework
 * browser or computer-use tool; screenshots come from the games repo harness.
 */
export default defineTool({
  description:
    "Read a playtest screenshot PNG under games/<slug>/playtest/ and show it to yourself. Pass a path like games/space-hop/playtest/title.png (repo-relative).",
  async execute(input, ctx) {
    if (!PLAYTEST_PNG.test(input.path)) {
      return {
        error:
          "Path must match games/<slug>/playtest/<file>.png with a safe slug and filename.",
        ok: false as const,
        path: input.path,
      };
    }
    const sandbox = await ctx.getSandbox();
    const absolute = `${REPO_DIR}/${input.path}`;
    try {
      const bytes = await sandbox.readBinaryFile({ path: absolute });
      if (bytes === null) {
        return {
          error: "Screenshot file not found.",
          ok: false as const,
          path: input.path,
        };
      }
      const buffer = Buffer.from(bytes);
      if (buffer.byteLength === 0) {
        return {
          error: "Screenshot file is empty.",
          ok: false as const,
          path: input.path,
          sizeBytes: 0,
        };
      }
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        return {
          error: `Screenshot is ${buffer.byteLength} bytes; max ${MAX_IMAGE_BYTES} for model image parts.`,
          ok: false as const,
          path: input.path,
          sizeBytes: buffer.byteLength,
        };
      }
      return {
        ok: true as const,
        path: input.path,
        screenshotBase64: buffer.toString("base64"),
        sizeBytes: buffer.byteLength,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to read screenshot",
        ok: false as const,
        path: input.path,
      };
    }
  },
  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .max(200)
      .describe(
        "Repo-relative screenshot path, e.g. games/space-hop/playtest/gameplay.png"
      ),
  }),
  toModelOutput(output) {
    if (!output.ok || typeof output.screenshotBase64 !== "string") {
      const size =
        typeof output.sizeBytes === "number" ? ` size=${output.sizeBytes}` : "";
      return toolOutput.text(
        `Could not view ${output.path}:${size} ${output.error ?? "unknown error"}`
      );
    }
    return toolOutput.content([
      toolOutputPart.text(
        `Screenshot ${output.path} (${output.sizeBytes} bytes):`
      ),
      toolOutputPart.file(output.screenshotBase64, {
        mediaType: "image/png",
      }),
    ]);
  },
});
