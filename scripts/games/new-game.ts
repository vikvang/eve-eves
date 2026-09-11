import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const main = async () => {
  const slug = process.argv[2];
  if (!(slug && /^[a-z][a-z0-9-]{1,32}$/.test(slug)) || slug.startsWith("_")) {
    console.error(
      "Usage: pnpm new-game <slug>  (lowercase, digits, hyphens; no leading underscore)"
    );
    process.exit(2);
  }

  const dest = path.join(ROOT, "games", slug);
  const src = path.join(ROOT, "games", "_template");
  try {
    await mkdir(dest, { recursive: false });
  } catch {
    console.error(`games/${slug} already exists`);
    process.exit(1);
  }

  await cp(src, dest, {
    filter: (p) =>
      !(
        p.includes("node_modules") ||
        p.includes(`${path.sep}playtest${path.sep}`)
      ),
    recursive: true,
  });

  const pkgPath = path.join(dest, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as { name: string };
  pkg.name = `@games/game-${slug}`;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const statePath = path.join(dest, "src/state.ts");
  let state = await readFile(statePath, "utf8");
  state = state.replace(
    /export const SLUG = "_template"/,
    `export const SLUG = "${slug}"`
  );
  await writeFile(statePath, state);

  const vitePath = path.join(dest, "vite.config.ts");
  let vite = await readFile(vitePath, "utf8");
  vite = vite.replace(/dist\/_template/g, `dist/${slug}`);
  await writeFile(vitePath, vite);

  const htmlPath = path.join(dest, "index.html");
  let html = await readFile(htmlPath, "utf8");
  html = html.replace("Retro Template", slug);
  await writeFile(htmlPath, html);

  console.log(`Created games/${slug} from _template`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
