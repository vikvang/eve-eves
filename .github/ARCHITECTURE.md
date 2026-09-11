# ARCHITECTURE.md

A map of how this agent is put together, for humans and AI agents working in the repo. Keep it current as the codebase evolves.

## Project identification

- **Name:** eve Retro Game Factory
- **Maintainer:** Vercel Labs (Ben Sabic) / Warp game-factory fork
- **License:** MIT
- **Last updated:** 2026-09-10

## Overview

This is a retro game factory built on the [eve](https://eve.dev) agent framework: the root agent is an orchestrator that takes a single chat prompt describing a thin, browser-only 2D retro game and moves it through two stations, each a declared subagent with its own instructions, sandbox, and tool surface: **implementer** (scaffolds and codes the game in its own checkout, runs the games repo checks, pushes `factory/game-<slug>`), and **player** (independent playtest on the pushed branch via `pnpm playtest`, different model vendor, up to 2 revision cycles). The finished product is a draft pull request on `FACTORY_REPO`. People stay in the loop where judgment lives: marking a PR ready stops the session to request approval, merging isn't in the tool surface at all. Chat sessions are attended and untrusted by default, so reversible GitHub writes and factory-brain updates park on approval cards in chat; draft PRs run without a card. The agent runs on Vercel, the same way locally (`eve dev`) and in production (`eve deploy`).

eve discovers every capability from the filesystem under `agent/`. There is no central registry or wiring file: a tool's name is its filename, a subagent's name is its directory, an extension's namespace is its filename.

## Project structure

```text
agent/
  agent.ts                  # model configuration (defineAgent): compaction + session token budget
  instructions.ts           # defineInstructions: Foreman prompt, injects FACTORY_REPO
  channels/
    eve.ts                  # only intake: inbound route auth; localDevUser shim (user principal, not trusted)
  extensions/
    github.ts               # @github-tools/eve-extension: draft PRs and reads; tools as github__<name>
  sandbox.ts                # root sandbox (Vercel Sandbox)
  subagents/
    implementer/            # agent.ts (outputSchema) + instructions.md + sandbox.ts + tools + skills
    player/                 # agent.ts (outputSchema) + instructions.md + sandbox.ts + playtest tools + skills
  tools/
    agent.ts                # disableTool(): block built-in agent self-delegation
    get_user_preferences.ts
    save_user_preferences.ts
    clear_user_preferences.ts
    read_factory_brain.ts
    update_factory_brain.ts
    read_artifact.ts
    save_artifact.ts        # root authors game-brief artifacts
    glob.ts / grep.ts
  lib/
    constants.ts            # requireEnv + FACTORY_REPO/factoryRepo + FACTORY_BRANCH_PREFIX
    trust.ts                # AUTONOMOUS_PRINCIPAL, isTrusted, stamp helpers (chat does not stamp trusted)
    blob.ts / user-preferences.ts / factory-brain.ts
    artifacts/              # config.ts (kinds: game-brief | playtest-report) + tools.ts
    models.ts               # MODELS.orchestrator | implementer | player
    github/                 # credentials, approval, git-remote, repo-sandbox, bot-name, diagnostics
  skills/
    writing-quality/
    retro-design/           # placeholder filled by another builder
evals/                      # routing/, safety/, pipeline/, helpers.ts, evals.config.ts
```

## Core components

| Component | Lives in | eve primitive | Responsibility |
| --- | --- | --- | --- |
| Orchestrator | `agent/agent.ts` + `instructions.ts` | Agent | Feasibility check, game brief, implementer → player loop (max 2 revises), draft PR; never writes game code itself |
| Route auth | `agent/channels/eve.ts` | Channel | Only intake; localDevUser + vercelOidc; attended chat, untrusted so approvals park |
| GitHub tools | `agent/extensions/github.ts` | Extension | `github__*` reads, triage writes, PR authoring; draft PR ungated; ship parks |
| Trust authority | `agent/lib/trust.ts` | Library | Trusted / autonomous / schedule predicates for approval policies |
| implementer | `agent/subagents/implementer/` | Subagent | Scaffold, implement, verify, push `factory/game-<slug>` |
| player | `agent/subagents/player/` | Subagent | Checkout branch, `pnpm playtest`, view screenshots, pass/revise |
| User preferences | `agent/tools/*_user_preferences.ts` | Tools | Per-user Blob prefs |
| Factory brain | `agent/tools/*_factory_brain.ts` | Tools | Shared repo notes; writes gated by factoryBrainPolicy |
| Handoff artifacts | `agent/lib/artifacts/` | Tools | `game-brief` and `playtest-report` Markdown by id |
| Skills | root + station `skills/` | Skill | retro-design, writing-quality; implementer retro-stack/pixel-assets; player game-smoke/retro-design |
| Evals | `evals/` | Evals | routing (new-game order), safety (out-of-scope, injection, ship gate), pipeline opt-in |

Channels are I/O boundaries. Tools run in the app runtime; station git and playtest tools run inside the station sandbox. Every station runs in **task mode** (`outputSchema`), so it cannot request approvals.

## Data flow

1. **Chat prompt:** a person sends a game idea on the eve channel. Foreman reads preferences and the factory brain, loads retro-design / writing-quality as needed, and runs a feasibility check.
2. **Out of scope:** 3D, multiplayer, backend, etc. Foreman refuses, offers a smaller alternative, and does not call stations.
3. **In scope:** Foreman writes a one-page brief, saves it as artifact kind `game-brief`, delegates to implementer with the id, then to player with branch + slug.
4. **Revision:** player `revise` loops back to implementer at most twice, then player again.
5. **Deliver:** on player `pass`, Foreman opens a draft PR with brief summary, playtest checks, screenshot paths, and preview placeholder.

## Data stores

- **GitHub** (external): games monorepo; extension tools + sandbox git with firewall-brokered tokens.
- **Vercel Blob**: user preferences, factory brain, handoff artifacts.
- **Vercel Sandbox**: root + implementer + player clones of `FACTORY_REPO`.

No application database. No Linear integration.

## External integrations

| Integration | Purpose | Method |
| --- | --- | --- |
| GitHub | Draft PRs, reads, optional triage | `@github-tools/eve-extension` + Connect (`GITHUB_CONNECTOR`); station git via firewall tokens |
| Vercel Blob | Prefs, brain, artifacts | `@vercel/blob`, OIDC |
| Vercel AI Gateway | Models | Gateway ids in `agent/lib/models.ts` |
| Vercel Sandbox | Isolated checkouts + playtest | `vercel()` backend via `repo-sandbox.ts` |

## Deployment & infrastructure

- **Platform:** Vercel. Deploy with `eve deploy`.
- **Connectors:** GitHub Connect only (no Linear). App needs contents/issues/pull requests on `FACTORY_REPO`.
- **Environment:** `GITHUB_CONNECTOR`, `FACTORY_REPO` (required), optional `FACTORY_SETUP_COMMAND`, `FACTORY_BRANCH_PREFIX`, `FACTORY_BOT_NAME`.
- **Local development:** `pnpm dev`; chat is untrusted so GitHub writes wait for approval in the TUI.

## Security considerations

- **Trust at dispatch.** Eve chat does not stamp `trusted`; sessions are attended so approval cards park on chat. Draft PRs are ungated; ship actions always park; autonomous principal is unused without label intake but kept for policy compatibility.
- **Stations hold no approvable tools.** `push_branch` and playtest tools are inert by construction (validated branch/slug, feature branches only).
- **Git credentials never enter a sandbox.** Literal `REMOTE_URL` + `brokerPolicy`.
- **Artifact-id containment** and **factory-brain** keying unchanged from the software-factory template.
- **No framework browser/computer-use tool.** Player relies on the games repo `pnpm playtest` harness (Playwright) inside the sandbox; screenshots use `readBinaryFile` + `toModelOutput` image content parts.

## Development & testing

- `pnpm dev`, `pnpm typecheck`, `pnpm check` / `pnpm fix`, `npx eve info`, `pnpm validate`.
- Evals: `pnpm eval --tag fast`; `pnpm eval pipeline/full-pipeline` pushes a real branch.

## Glossary

- **Station:** declared subagent under `agent/subagents/<id>/` (implementer, player).
- **Task mode:** child with `outputSchema`; structured output, no parking.
- **Game brief / playtest report:** handoff artifact kinds under `artifacts/`.
- **Test seam:** `window.__game` / `window.__ready` / `window.__seed` installed by games repo `installSeam`.

## Games monorepo

This repository is also the games target (`FACTORY_REPO` typically points at itself). Layout:

- `games/_kit` publishes `@games/kit` (`createRetroGame`, Sweetie-16, `playSfx`, `installSeam`, `spriteFromGrid`, seeded RNG).
- `games/_template` is the playable scaffold copied by `pnpm new-game <slug>`.
- `games/_playtest` is the Playwright harness behind `pnpm playtest <slug>`.
- `games/_site` + `pnpm build:games` produce static output under `games/dist/`; `games/vercel.json` serves it.
- Title scenes expose `window.__startGame` for headless starts; screenshots land in `games/<slug>/playtest/`.
