#!/usr/bin/env node
/**
 * Turbo Dusk acceptance playtest.
 *
 * Exercises the brief's named seam checks (steer-changes-position,
 * boost-activates, fuel-raises-score, traffic-costs-life, reach-gameover,
 * reach-win) via `window.__game` and the `window.__test` hooks, then captures
 * a real terminal-state screenshot as playtest/end.png (the win screen).
 *
 * Run from the repo root after `pnpm build:games`:
 *
 *   node games/turbo-dusk/playtest/acceptance.mjs
 *
 * Writes playtest/acceptance.json and exits non-zero on any failed check.
 */
import { createReadStream, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const distDir = path.join(root, "games", "dist", "turbo-dusk");

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
};

const serveStatic = async (dir) => {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
    const rel = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.normalize(path.join(dir, rel));
    if (!(filePath.startsWith(dir) && existsSync(filePath))) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type":
        MIME[path.extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") {
    throw new Error("failed to bind acceptance server");
  }
  return {
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
    port: addr.port,
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  if (!existsSync(distDir)) {
    throw new Error(
      "games/dist/turbo-dusk missing; run pnpm build:games first"
    );
  }
  const server = await serveStatic(distDir);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { height: 540, width: 960 } });

  const checks = [];
  const consoleErrors = [];
  const addCheck = (id, passed, evidence) => {
    checks.push({ evidence, id, passed });
    console.log(`${passed ? "PASS" : "FAIL"} ${id}: ${evidence}`);
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  await page.addInitScript(() => {
    window.__seed = 42;
  });
  await page.goto(`http://127.0.0.1:${server.port}/`, {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });

  await page.waitForFunction(() => Boolean(window.__ready && window.__game), {
    timeout: 20_000,
  });
  await page.evaluate(async () => {
    await window.__ready;
  });
  await page.locator("canvas").first().click({ force: true });

  const getSeam = () =>
    page.evaluate(() =>
      window.__game ? structuredClone(window.__game) : null
    );

  const waitFor = async (predicate, label, timeoutMs = 8000) => {
    const start = Date.now();
    let seam = null;
    while (Date.now() - start < timeoutMs) {
      seam = await getSeam();
      if (seam && predicate(seam)) {
        return seam;
      }
      await sleep(80);
    }
    throw new Error(
      `timeout waiting for ${label}; last=${JSON.stringify(seam)}`
    );
  };

  // Synthetic key events dispatched like the shared harness does, so the
  // headless page never depends on OS focus.
  const keyEvent = (type, key, code, keyCode) =>
    page.evaluate(
      ([t, k, c, kc]) => {
        const ev = new KeyboardEvent(t, {
          bubbles: true,
          cancelable: true,
          code: c,
          key: k,
          keyCode: kc,
          which: kc,
        });
        window.dispatchEvent(ev);
        document.dispatchEvent(ev);
        document.querySelector("canvas")?.dispatchEvent(ev);
      },
      [type, key, code, keyCode]
    );

  const hold = async (key, code, keyCode, ms) => {
    await keyEvent("keydown", key, code, keyCode);
    await sleep(ms);
    await keyEvent("keyup", key, code, keyCode);
  };

  const callHook = (name) =>
    page.evaluate((hook) => {
      window.__test?.[hook]?.();
    }, name);

  // title-ready
  const title = await getSeam();
  addCheck("title-ready", title?.state === "title", `state=${title?.state}`);

  // start-to-playing
  await page.evaluate(() => {
    window.__startGame?.();
  });
  const playing = await waitFor((s) => s.state === "playing", "playing");
  addCheck(
    "start-to-playing",
    playing.state === "playing" &&
      playing.lives === 3 &&
      playing.extra.checkpoint === 0,
    `state=${playing.state} lives=${playing.lives} checkpoint=${playing.extra.checkpoint}`
  );

  // steer-changes-position
  const beforeSteer = await getSeam();
  await hold("ArrowLeft", "ArrowLeft", 37, 450);
  const afterSteer = await getSeam();
  const x0 = beforeSteer?.extra.playerX;
  const x1 = afterSteer?.extra.playerX;
  addCheck(
    "steer-changes-position",
    typeof x1 === "number" &&
      typeof x0 === "number" &&
      x1 < x0 &&
      x1 >= 112 &&
      x1 <= 208,
    `playerX ${x0} -> ${x1} (road bounds 112..208)`
  );
  await hold("ArrowRight", "ArrowRight", 39, 300);

  // boost-activates
  await keyEvent("keydown", " ", "Space", 32);
  await sleep(200);
  const boosting = await getSeam();
  await keyEvent("keyup", " ", "Space", 32);
  addCheck(
    "boost-activates",
    boosting?.extra.boosting === true && Number(boosting?.extra.speed) > 120,
    `boosting=${boosting?.extra.boosting} speed=${boosting?.extra.speed} (cruise 120)`
  );
  await sleep(150);

  // fuel-raises-score
  const beforeFuel = await getSeam();
  await callHook("collectFuel");
  await sleep(150);
  const afterFuel = await getSeam();
  const fuelUp =
    Number(afterFuel?.extra.fuel) > Number(beforeFuel?.extra.fuel) ||
    Number(afterFuel?.extra.fuel) === 20;
  // The can pays +100; the passive distance trickle (10/s) may add a couple
  // more points between the two seam reads, so assert at least +100.
  addCheck(
    "fuel-raises-score",
    (afterFuel?.score ?? 0) >= (beforeFuel?.score ?? 0) + 100 && fuelUp,
    `score ${beforeFuel?.score} -> ${afterFuel?.score} (can pays +100), fuel ${beforeFuel?.extra.fuel} -> ${afterFuel?.extra.fuel}`
  );

  // traffic-costs-life
  const beforeHit = await getSeam();
  await callHook("hitTraffic");
  await sleep(200);
  const afterHit = await getSeam();
  addCheck(
    "traffic-costs-life",
    afterHit?.lives === (beforeHit?.lives ?? 0) - 1,
    `lives ${beforeHit?.lives} -> ${afterHit?.lives}`
  );

  // reach-gameover (drain fuel)
  await callHook("drainFuel");
  const over = await waitFor((s) => s.state === "gameover", "gameover");
  addCheck(
    "reach-gameover",
    over.state === "gameover",
    `state=${over.state} after drainFuel`
  );

  // reach-win: retry (Z on game-over), then pass all three gates.
  await hold("z", "KeyZ", 90, 80);
  await waitFor((s) => s.state === "playing" && s.lives === 3, "retry playing");
  for (let gate = 1; gate <= 3; gate++) {
    await callHook("passGate");
    await waitFor(
      (s) => Number(s.extra.checkpoint) >= gate,
      `checkpoint ${gate}`
    );
    // Let the stage transition (0.4s) or win transition (0.5s) settle.
    await sleep(900);
  }
  const win = await waitFor((s) => s.state === "win", "win");
  addCheck(
    "reach-win",
    win.state === "win" && win.extra.checkpoint === 3,
    `state=${win.state} checkpoint=${win.extra.checkpoint}`
  );

  // Real terminal-state end screenshot: the win screen.
  await sleep(400);
  await page.screenshot({ path: path.join(here, "end.png") });
  console.log("wrote playtest/end.png (win screen)");

  addCheck(
    "no-console-errors",
    consoleErrors.length === 0,
    consoleErrors.length === 0 ? "clean" : consoleErrors.join(" | ")
  );

  const passed = checks.every((c) => c.passed);
  await writeFile(
    path.join(here, "acceptance.json"),
    `${JSON.stringify({ checks, consoleErrors, passed, slug: "turbo-dusk" }, null, 2)}\n`
  );

  await browser.close();
  await server.close();
  console.log(passed ? "acceptance: PASS" : "acceptance: FAIL");
  process.exit(passed ? 0 : 1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
