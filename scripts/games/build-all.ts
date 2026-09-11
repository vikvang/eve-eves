import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const GAMES_DIR = path.join(ROOT, "games");
const DIST = path.join(GAMES_DIR, "dist");

const listGameSlugs = async (): Promise<string[]> => {
  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  return entries
    .filter(
      (e) =>
        e.isDirectory() &&
        !e.name.startsWith("_") &&
        e.name !== "dist" &&
        existsSync(path.join(GAMES_DIR, e.name, "package.json"))
    )
    .map((e) => e.name)
    .sort();
};

const listBuildTargets = async (): Promise<string[]> => {
  const entries = await readdir(GAMES_DIR, { withFileTypes: true });
  const slugs: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name === "dist") continue;
    const pkg = path.join(GAMES_DIR, e.name, "package.json");
    const vite = path.join(GAMES_DIR, e.name, "vite.config.ts");
    if (
      existsSync(pkg) &&
      existsSync(vite) &&
      e.name !== "_site" &&
      e.name !== "_playtest" &&
      e.name !== "_kit"
    ) {
      slugs.push(e.name);
    }
  }
  return slugs.sort();
};

const main = async () => {
  await mkdir(DIST, { recursive: true });
  const targets = await listBuildTargets();
  if (targets.length === 0) {
    console.error("No buildable games found under games/");
    process.exit(1);
  }

  for (const slug of targets) {
    const gameDir = path.join(GAMES_DIR, slug);
    const outDir = path.join(DIST, slug);
    console.log(`building ${slug} -> games/dist/${slug}`);
    await build({
      base: "./",
      build: { emptyOutDir: true, outDir },
      configFile: path.join(gameDir, "vite.config.ts"),
      logLevel: "warn",
      root: gameDir,
    });
  }

  const publicSlugs = (await listGameSlugs()).length
    ? await listGameSlugs()
    : targets.filter((s) => !s.startsWith("_"));
  // Include _template in the listing so the reference game is playable from the site.
  const listed = [
    ...new Set([...publicSlugs, ...targets.filter((t) => t === "_template")]),
  ].sort();

  await build({
    base: "./",
    build: { emptyOutDir: false, outDir: DIST },
    configFile: path.join(GAMES_DIR, "_site/vite.config.ts"),
    logLevel: "warn",
    root: path.join(GAMES_DIR, "_site"),
  });

  await writeFile(
    path.join(DIST, "games.json"),
    `${JSON.stringify(listed, null, 2)}\n`,
    "utf8"
  );

  // Ensure a simple index always lists games even if site fetch fails
  const links = listed
    .map((s) => `    <li><a href="./${s}/">${s}</a></li>`)
    .join("\n");
  const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Retro Games</title>
    <style>
      body { font-family: ui-monospace, monospace; background: #1a1c2c; color: #f4f4f4; padding: 2rem; }
      a { color: #41a6f6; }
      li { margin: 0.5rem 0; }
    </style>
  </head>
  <body>
    <h1>Retro Games</h1>
    <ul>
${links}
    </ul>
  </body>
</html>
`;
  await writeFile(path.join(DIST, "index.html"), index, "utf8");
  console.log(`wrote games/dist/index.html (${listed.length} games)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
