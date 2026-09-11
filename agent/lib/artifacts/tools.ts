import { defineTool } from "eve/tools";
import { z } from "zod";
import { readDocument, writeDocument } from "../blob.js";
import {
  ARTIFACT_KINDS,
  artifactId,
  artifactKey,
  MAX_ARTIFACT_LENGTH,
  MAX_ARTIFACT_TITLE_LENGTH,
} from "./config.js";

/**
 * The handoff-artifact tools.
 *
 * @remarks
 * A handoff artifact is a Markdown document one station produces and another reads, passed by id
 * so the text never travels through the orchestrator's context. The orchestrator holds both save
 * and read so it can author a game brief and open a playtest report without pasting either
 * document into the conversation. Stations that consume briefs or reports hold the reader; the
 * player may also hold the saver for a playtest-report handoff.
 *
 * Both tools are inert by construction (validated ids, no overwrite, bounded size), so they are
 * safe inside task-mode stations that cannot park on approval.
 */

/**
 * Build the tool that saves a handoff artifact.
 *
 * @returns The `save_artifact` tool definition.
 */
export const saveArtifactTool = () =>
  defineTool({
    description:
      "Save a Markdown document for another station to read, and get back an id to hand along. " +
      "Use for long supporting detail the next station needs but that does not fit your " +
      "structured output: a one-page game brief, or a playtest report with checks and notes. " +
      "After saving, report the id with a few lines on what's in it, never the document itself: " +
      "whoever needs the detail opens the id. Not for a note that fits in a sentence.",
    async execute({ kind, title, markdown }) {
      const id = artifactId(kind, title);
      const key = artifactKey(id);
      if (!key) {
        return { error: "Could not build a valid artifact id.", saved: false };
      }
      try {
        await writeDocument(key, markdown, { allowOverwrite: false });
        return { id, kind, saved: true, title };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error.message : "Failed to save artifact",
          saved: false,
        };
      }
    },
    inputSchema: z.object({
      kind: z
        .enum(ARTIFACT_KINDS)
        .describe(
          "What this document is. Travels with the id so the reader knows what it's holding."
        ),
      markdown: z
        .string()
        .min(1)
        .max(MAX_ARTIFACT_LENGTH)
        .describe(
          "The full document as Markdown. Write it for the station that will act on it: findings and their evidence, not a narrative."
        ),
      title: z
        .string()
        .min(1)
        .max(MAX_ARTIFACT_TITLE_LENGTH)
        .describe(
          "Human-readable title, e.g. 'Space hop platformer brief'. The id is derived from it."
        ),
    }),
    outputSchema: z.object({
      error: z.string().optional(),
      id: z
        .string()
        .optional()
        .describe(
          "Report this in your structured output; it is how anyone else reads the document."
        ),
      kind: z.string().optional(),
      saved: z.boolean(),
      title: z.string().optional(),
    }),
  });

/**
 * Build the tool that reads a handoff artifact back.
 *
 * @returns The `read_artifact` tool definition.
 */
export const readArtifactTool = () =>
  defineTool({
    description:
      "Read a Markdown document another station saved, by the id it handed back. Call this when " +
      "a message gives you an artifact id: the id is source material to open, never something " +
      "to quote as a citation.",
    async execute({ id }) {
      const key = artifactKey(id);
      if (!key) {
        return { found: false };
      }
      try {
        const doc = await readDocument(key);
        if (!doc.found) {
          return { found: false };
        }
        return {
          createdAt: doc.uploadedAt,
          found: true,
          id,
          markdown: doc.content,
        };
      } catch {
        return { found: false };
      }
    },
    inputSchema: z.object({
      id: z
        .string()
        .min(1)
        .max(200)
        .describe("The artifact id, exactly as it was handed to you."),
    }),
    outputSchema: z.object({
      createdAt: z
        .string()
        .optional()
        .describe(
          "When it was saved. Treat an old artifact as possibly stale."
        ),
      found: z
        .boolean()
        .describe(
          "False when no artifact exists for that id; report that rather than guessing."
        ),
      id: z.string().optional(),
      markdown: z.string().optional(),
    }),
  });
