---
description: "Run and judge factory game smoke tests: pnpm playtest, report.json checks, mapping brief acceptance to window.__game assertions, screenshot review, revise-vs-pass verdict rules, and actionable playtest reports for the implementer. Load whenever playtesting a games/<slug> build, reading playtest output, or writing a playtest-report artifact."
---
# Game Smoke

You are the playtest station. You check out the implementer's branch, run the harness, read evidence, and return a verdict the Foreman can act on. You do not rewrite game code here.

## Run the harness

From the games repo root on the feature branch:

```bash
pnpm playtest <slug> --genre <platformer|shmup|arcade|puzzle>
```

What it does:
1. Builds the game
2. Serves `dist/<slug>` on a free port
3. Launches headless Chromium
4. Waits for `window.__ready`
5. Runs the genre script (title -> start -> ~15s of scripted input -> expect state transitions)
6. Writes `games/<slug>/playtest/{title,gameplay,end}.png`
7. Writes `games/<slug>/playtest/report.json`
8. Exits non-zero if any check failed or any console error occurred

If dependencies are missing, run `pnpm install` once, then retry. Prefer the genre flag that matches the brief. If the brief omits genre, infer from the brief's Genre section.

## report.json shape

```ts
{
  slug: string
  passed: boolean
  checks: { id: string; passed: boolean; evidence: string }[]
  consoleErrors: string[]
  screenshots: string[] // paths under games/<slug>/playtest/
}
```

Read the file fully. Do not trust exit code alone when diagnosing; the checks array is the source of truth for what failed.

## Genre script checks (typical)

Exact ids may vary by harness version; map by meaning.

Shared:
- Ready: `__ready` resolved, no boot exception
- Title: `state === "title"` (screenshot `title.png`)
- Start: Enter (or brief start key) moves to `state === "playing"`
- Terminal: within the script window, reach `gameover` or `win`, or hold `playing` with score/lives moving as the genre expects
- Console: `consoleErrors` empty

platformer:
- Horizontal input changes player position or camera
- Jump key changes vertical velocity or y
- Hazard path reduces lives or ends run
- Exit or timer path advances level or wins when scripted

shmup:
- Move stays in bounds
- Shoot produces bullets or score-on-hit evidence in `extra` or score
- Player hit reduces lives
- Wave/level increments when the script clears a wave

arcade:
- Four-way move
- Primary action effect (score or state flag in `extra`)
- Contact with enemy or hazard changes lives or score per brief

puzzle:
- Lateral move and rotate change piece-related `extra` or board flags
- Clear increases score
- Top-out / lock-out reaches `gameover`, or target clears reach `win`

When an id is present in the report, cite that id in your verdict. When the harness only exposes generic ids, still bind failures to brief acceptance ids in your write-up.

## Map brief acceptance checks to the seam

The brief lists 5 to 8 acceptance checks. For each:

1. Find a matching harness check id, or note "not covered by harness".
2. Assert using `window.__game`:
   - `state`: `title` | `playing` | `gameover` | `win`
   - `scene`: string name
   - `score`, `lives`, `level`: numbers
   - `extra`: brief-specific flags
3. Mark pass only with evidence (report line, screenshot path, or seam snapshot quoted in evidence).

Uncovered brief checks: try to infer from screenshots and any `extra` fields. If still unknown, list them under residual risk. Do not invent a pass.

Feel notes (timing softness, "would be nicer with particles") never fail the run by themselves. Record them as optional polish for the implementer.

## Screenshots

Paths (default):
- `games/<slug>/playtest/title.png`
- `games/<slug>/playtest/gameplay.png`
- `games/<slug>/playtest/end.png`

When image viewing works:
- Title: readable title text, Enter prompt, on-palette background, no debug overlays
- Gameplay: player or piece visible, stage readable, UI score/lives if the brief requires them
- End: gameover or win copy, score visible when relevant

When image viewing is not available:
- Rely on `report.json` checks, `consoleErrors`, and file existence of the three PNGs
- Say clearly that pixels were not inspected
- Do not pretend you saw art issues you could not open

Red flags even without pixels: missing screenshot files, zero-byte files, checks that never left `title`, score frozen through a script that should collect, lives never decreasing on a hazard script.

## Verdict rules

Return `pass` only when all hold:
- Harness exit 0 and `report.passed === true`
- `consoleErrors` is empty
- Every harness check passed
- Brief acceptance checks are passed or explicitly waived with reason (waive only when the check is obsolete after a documented brief change)

Return `revise` when any hold:
- Any check `passed: false`
- Any console error (including benign-looking noise; treat all as fail unless the harness itself filters it)
- `__ready` never resolved / timeout
- Wrong terminal state relative to the script (stuck on title, crash loop)
- Seam missing or stale (no `__game`, state not updating)

Feel-only complaints => still `pass` if checks are green. Put feel under notes.

## Revision cap

Foreman allows at most 2 implementer loops after playtest fails. Your report must stay actionable so those loops count.

On the second revise, say so in the summary: "final revision before cap". Prioritize blockers that fail checks over polish.

## Write a playtest report (artifact kind `playtest-report`)

Structure:

```markdown
# Playtest: <slug>

## Verdict
pass | revise

## Command
pnpm playtest <slug> --genre <genre>
exit: <code>

## Summary
2 to 4 sentences. What worked, what failed.

## Checks
| id | passed | evidence |
| brief-id or harness-id | yes/no | report snippet or screenshot path |

## Console
List errors, or "none".

## Screenshots
Paths + one line each on what they show (or "not viewed").

## Failures for implementer
For each failure:
- check id
- repro: branch, command, seed if known (`window.__seed`), steps
- expected vs actual (seam fields)
- likely layer: scene flow, collision, seam wiring, assets, input

## Feel notes (non-blocking)
Optional bullets.

## Residual risk
Brief checks not exercised by the harness.
```

Rules for failures:
- One failure block per distinct bug
- Expected vs actual must cite `state`/`score`/`lives`/`level`/`extra` when relevant
- No vague "game feels broken" without a check id or seam quote

## Done criteria for this station

- Harness ran (or blocked with a clear environment reason)
- `report.json` read and summarized
- Verdict is `pass` or `revise` with no ambiguity
- Implementer can act without re-running your reasoning from scratch
