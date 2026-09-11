# eve Retro Game Factory

Meet **Foreman**, an eve factory that turns a chat prompt into a draft pull request for a thin, browser-only 2D retro game on your games monorepo (`FACTORY_REPO`).

Foreman checks feasibility, writes a one-page game brief, runs **implementer** then **player**, and opens a draft PR. You review, mark ready, and merge.

## How it works

- **Feasibility + brief.** Foreman refuses out-of-scope asks (3D, multiplayer, backends) and otherwise saves a `game-brief` artifact.
- **Implementer** scaffolds `games/<slug>/` from `_template`, implements against Kaplay + `@games/kit` (`games/_kit`), runs the repo checks, and pushes `factory/game-<slug>`.
- **Player** checks out the branch, runs `pnpm playtest <slug>`, reads report and screenshots, and returns `pass` or `revise` (max 2 revision loops).

Each station is its own agent with its own instructions, sandbox, and tools. The player sees only the pushed branch. Between runs, Foreman keeps a **factory brain**: notes about your games repository.

## How work arrives

- **Chat** on the eve channel (dev TUI or HTTP clients). This is the only intake.
- Local runs are untrusted, so GitHub writes other than draft PRs wait for your approval in the TUI.

## Configure

See `.env.example`:

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `FACTORY_REPO` | Yes | — | This monorepo as `owner/repo` (e.g. `vikvang/eve-eves`); GitHub App must have access |
| `FACTORY_SETUP_COMMAND` | No | — | e.g. `pnpm install && pnpm exec playwright install chromium` so station sandboxes can playtest |
| `FACTORY_BRANCH_PREFIX` | No | `factory/` | Prefix for `factory/game-<slug>` branches |
| `FACTORY_BOT_NAME` | No | App slug | Commit identity |
| `GITHUB_CONNECTOR` | Yes | — | Vercel Connect GitHub connector UID |

## Local development

```bash
pnpm install
pnpm exec playwright install chromium   # needed for pnpm playtest
vercel link && vercel env pull          # Connect + OIDC for sandboxes/PRs
pnpm validate                           # lint, typecheck, eve info
pnpm test && pnpm build:games && pnpm playtest _template
pnpm dev                                # Foreman TUI
```

Hand the agent a prompt like "tiny platformer, catch coins, three levels" and watch implementer then player, ending in a draft PR on `FACTORY_REPO`.

## Games site

Browser games live under `games/`. Shared kit is `@games/kit` (`games/_kit`). Playtest harness is `games/_playtest` via `pnpm playtest <slug>`. Static output is `games/dist/` (`pnpm build:games`) with `games/vercel.json` for static hosting.

## Resources

- [eve Documentation](https://eve.dev/docs/introduction)
- [Vercel Connect](https://vercel.com/docs/connect)
- [GitHub Tools eve Extension](https://github-tools.com/frameworks/eve-extension)
