# eve Retro Game Factory

Meet **Foreman**, an eve factory that turns a chat prompt into a draft pull request for a thin, browser-only 2D retro game on your games monorepo (`FACTORY_REPO`).

Foreman checks feasibility, writes a one-page game brief, runs **implementer** then **player**, and opens a draft PR. You review, mark ready, and merge. Use the browser chat in `web/` for a public, same-origin frontend.

## How it works

- **Feasibility + brief.** Foreman refuses out-of-scope asks (3D, multiplayer, backends) and otherwise saves a `game-brief` artifact.
- **Implementer** scaffolds `games/<slug>/` from `_template`, implements against Kaplay + `@games/kit` (`games/_kit`), runs the repo checks, and pushes `factory/game-<slug>`.
- **Player** checks out the branch, runs `pnpm playtest <slug>`, reads report and screenshots, and returns `pass` or `revise` (max 2 revision loops).

Each station is its own agent with its own instructions, sandbox, and tools. The player sees only the pushed branch. Between runs, Foreman keeps a **factory brain**: notes about your games repository.

## How work arrives

- **Chat** on the eve channel, through the dev TUI, the public web app, or another HTTP client. This is the only intake.
- Local runs are untrusted, so GitHub writes other than draft PRs wait for your approval in the TUI.

## Web chat

`web/` is a small Next.js workspace that mounts the existing agent with `eve/next` and `withEve({ eveRoot: ".." })`. `eveRoot` names the Eve application root that contains `agent/`, so the web package can stay separate while `/eve/v1/*` is served on the same origin. The page streams Foreman's replies, shows tool and station progress, and renders approval, question, and authorization continuations as actionable cards. It stores the session cursor and event history in browser local storage so a refresh resumes the conversation.

Run the web app locally with `pnpm dev:web`. It starts Next.js and its adjacent Eve server; `pnpm dev` remains the standalone Eve TUI. For a production-equivalent build, run `pnpm build:web`, which runs `eve build` before the Next build.

## Deploy

Create one Vercel project for this repository and set its Root Directory to `web`. From the repository root, link that project with `vercel link`, then deploy both the Next app and mounted Eve service with:

```bash
pnpm deploy
```

`withEve` generates the Vercel Eve service and routes `/eve/v1/*` to it during the Next build. Do not use `eve deploy` for this layout because it deploys the agent alone without the Next host.

The chat is public: `agent/channels/eve.ts` tries Vercel OIDC and the local TUI shim first, then accepts external requests through Eve's `none()` provider. Anonymous callers receive Eve's anonymous principal and never receive the `trusted` attribute, so existing approval gates remain in effect and anonymous callers do not have per-user preferences. A public model endpoint can be abused and creates model, sandbox, and GitHub API cost exposure. Enable Vercel Deployment Protection or replace `none()` with application authentication if access should be restricted.

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
pnpm dev:web                            # public Next.js chat
```

Hand the agent a prompt like "tiny platformer, catch coins, three levels" and watch implementer then player, ending in a draft PR on `FACTORY_REPO`.

## Games site

Browser games live under `games/`. Shared kit is `@games/kit` (`games/_kit`). Playtest harness is `games/_playtest` via `pnpm playtest <slug>`. Static output is `games/dist/` (`pnpm build:games`) with `games/vercel.json` for static hosting.

## Resources

- [eve Documentation](https://eve.dev/docs/introduction)
- [Vercel Connect](https://vercel.com/docs/connect)
- [GitHub Tools eve Extension](https://github-tools.com/frameworks/eve-extension)
