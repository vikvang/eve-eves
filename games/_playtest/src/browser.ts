import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { type Browser, chromium, type LaunchOptions } from "playwright";

const resolveFromHere = createRequire(import.meta.url);

// Playwright's "browser binary not downloaded" failure mentions the missing
// executable path and tells the user to run `playwright install`.
const MISSING_EXECUTABLE =
  /executable doesn't exist|please run the following command|playwright install/i;

// Distinct failure: the binary exists but host shared libraries are absent.
const MISSING_HOST_DEPS =
  /host system is missing dependencies|error while loading shared libraries/i;

// `playwright/cli.js` is not in the package exports map, so resolve the
// exported package.json and address the CLI file next to it by path. This
// always runs the CLI of the exact playwright version the harness links
// against, so downloaded browser revisions match `chromium.launch()`.
const playwrightCli = (): string =>
  path.join(
    path.dirname(resolveFromHere.resolve("playwright/package.json")),
    "cli.js"
  );

const runPlaywrightCli = (args: string[], hint: string): void => {
  const result = spawnSync(process.execPath, [playwrightCli(), ...args], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `\`playwright ${args.join(" ")}\` failed (exit ${String(result.status ?? result.signal)}). ${hint}`
    );
  }
};

/**
 * Download the chromium + chromium-headless-shell revisions pinned by the
 * installed `playwright` package.
 */
export const installChromium = (): void => {
  runPlaywrightCli(
    ["install", "chromium"],
    "Run `pnpm exec playwright install chromium` manually and retry."
  );
};

/**
 * Install the OS packages chromium needs (apt/dnf via Playwright; it invokes
 * sudo itself when not running as root).
 */
export const installChromiumHostDeps = (): void => {
  runPlaywrightCli(
    ["install-deps", "chromium"],
    "Run `sudo pnpm exec playwright install-deps chromium` manually and retry."
  );
};

type LaunchAttempt = { browser?: Browser; error?: unknown };

const attemptLaunch = async (
  options: LaunchOptions
): Promise<LaunchAttempt> => {
  try {
    return { browser: await chromium.launch(options) };
  } catch (error) {
    return { error };
  }
};

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Launch headless chromium, self-healing the two common fresh-sandbox
 * failures so `pnpm playtest <slug>` works after a plain `pnpm install`:
 * a missing browser download and missing host shared libraries.
 */
export const launchChromium = async (
  options: LaunchOptions = { headless: true }
): Promise<Browser> => {
  const first = await attemptLaunch(options);
  if (first.browser) {
    return first.browser;
  }
  const firstMessage = messageOf(first.error);
  if (MISSING_EXECUTABLE.test(firstMessage)) {
    console.error(
      "playtest: Playwright chromium missing; downloading it now (one-time)..."
    );
    installChromium();
  } else if (!MISSING_HOST_DEPS.test(firstMessage)) {
    throw first.error;
  }

  const second = await attemptLaunch(options);
  if (second.browser) {
    return second.browser;
  }
  const secondMessage = messageOf(second.error);
  if (!MISSING_HOST_DEPS.test(secondMessage)) {
    throw second.error;
  }
  console.error(
    "playtest: chromium host libraries missing; running `playwright install-deps chromium` (apt/dnf, sudo when not root)..."
  );
  installChromiumHostDeps();

  const third = await attemptLaunch(options);
  if (third.browser) {
    return third.browser;
  }
  throw new Error(
    "Chromium still fails to launch after installing browsers and host dependencies. " +
      "Fix the environment manually: `pnpm exec playwright install chromium` then " +
      `\`sudo pnpm exec playwright install-deps chromium\`. Last error: ${messageOf(third.error)}`,
    { cause: third.error }
  );
};
