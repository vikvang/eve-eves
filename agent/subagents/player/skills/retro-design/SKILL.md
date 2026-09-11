---
description: "Retro game design for thin Kaplay browser games: writing a one-page game brief, picking a genre template, checking feasibility and scope, and phrasing acceptance checks against the window.__game seam. Load when drafting or revising a game brief, judging whether a prompt fits a single-pass browser game, or reviewing design fidelity (palette, resolution, juice, screens)."
---
# Retro Design

Design rules for thin, browser-only 2D retro games built with Kaplay. Use this when writing a game brief, choosing a genre, checking feasibility, or judging whether a finished game still matches retro defaults.

## Feasibility first

Accept only prompts that fit a single Kaplay canvas game with no backend.

Accept when all of these hold:
- 2D only, top-down, side-view, or simple puzzle grid
- Keyboard only
- One player
- Self-contained session (score and lives in memory)
- Sweetie-16 palette and 320x180 logical resolution are enough
- One implementer pass can finish title, play, and end screens

Decline (or rewrite down to a thin slice) when the request needs:
- 3D, physics engines beyond Kaplay body/area, or large open worlds
- Multiplayer, networking, accounts, or leaderboards that persist off-device
- Server APIs, databases, file uploads, or cloud saves
- Licensed IP, real-world trademarks, or copyrighted characters/music
- Audio files, streaming media, or non-ZzFX sound packs
- Full level editors, procedural infinite content as the main feature, or content pipelines
- Accessibility modes, gamepad-only design, or mobile touch as primary input

When declining, say what is out of scope in one short paragraph and offer the closest in-scope game (same fantasy, thinner mechanics).

## Scope: one implementer pass

A shippable game is finishable in one coding pass with at most two playtest revision loops.

Keep the brief thin:
- One core verb (jump, shoot, collect, rotate-and-drop)
- Two to four short levels, waves, or boards (not a campaign)
- One enemy type or one hazard family at most, plus pickups
- Title screen, play scene, game-over or win screen only
- No meta progression, unlock trees, or settings menus beyond mute if present

If the prompt is bigger, cut content until the acceptance checks fit a ~15 second scripted smoke run plus a human glance at three screenshots.

## Retro fidelity rubric

Every game must meet all of these:

1. Logical resolution 320x180 with integer scale, crisp pixels, letterboxing. No smoothing, no non-integer stretch.
2. Sweetie-16 only. No off-palette hex colors in sprites, tiles, UI, or background.
3. Tiles 16x16. Sprites 8x8, 16x16, or 16x8. Avoid large detailed art.
4. ASCII tilemaps for level geometry when the genre uses a grid or stage.
5. Keyboard only: arrows or WASD move, Z or Space primary, X secondary, Enter start, Esc pause when pause exists.
6. Mandatory title screen and a terminal screen (game over and/or win).
7. Every meaningful interaction has at least one juice beat: SFX, screen shake, flash, particles, or short tween.
8. ZzFX presets only for audio (jump, hit, pickup, shoot, explode, select, win, lose). No audio asset files.
9. Test seam kept live: `window.__game` refreshed every frame and `window.__ready` resolved after assets load and title is shown. Honor `window.__seed` when set.

## Game brief template

Write a one-page brief (artifact kind `game-brief`) with these sections, in order. Keep each section short.

```markdown
# <Title>

## Pitch
One sentence. Fantasy + verb + stakes.

## Slug
kebab-case directory name, unique under games/.

## Genre
One of: platformer | shmup | arcade | puzzle

## Controls
List only the keys this game uses, mapped to actions.

## Core loop
3 to 6 bullets: what the player does every few seconds, how score moves, how the run ends.

## Win
Concrete condition (reach flag, clear N waves, survive timer, clear lines target).

## Lose
Concrete condition (lives hit 0, hit by bullet, board lock out, timer hits 0).

## Levels or waves
Numbered list. Each entry: layout idea, new twist, target duration in seconds.

## Palette
Background index from Sweetie-16, main accent, hazard color, UI color. Name roles, not vibes.

## Audio cues
Map game events to named ZzFX presets (jump, hit, pickup, shoot, explode, select, win, lose).

## Screens
title -> playing -> gameover | win. Note what each shows (score, lives, prompt text).

## Acceptance checks
5 to 8 checks. Each must be script-verifiable against window.__game (and screenshots when needed).
Use stable ids: `title-ready`, `start-to-playing`, `score-increases`, `life-lost-on-hit`, `reach-gameover`, `reach-win`, etc.
Phrase as: id, setup, action, expect (state / scene / score / lives / level / extra field).
```

Acceptance check style (good):
- `title-ready`: after load, `state === "title"` and `__ready` resolved
- `start-to-playing`: press Enter on title, `state === "playing"` and `scene` is the play scene
- `score-on-pickup`: collect a coin (or scripted collidable), `score` increases by the brief's amount
- `life-on-hazard`: touch spike/enemy with 1 life, `lives` becomes 0 and `state` becomes `gameover`
- `win-on-goal`: reach exit with lives > 0, `state === "win"`

Avoid checks that need subjective taste ("feels snappy") or unscriptable timing ("around the middle of level 2").

## Genre templates

Pick exactly one. Defaults below are the baseline; the brief may narrow them, not expand past one-pass scope.

### platformer

- View: side-on. Gravity on. Camera may follow on wider maps.
- Controls: left/right move, Z/Space jump, Enter start, Esc pause optional.
- Loop: run and jump across solid tiles, avoid hazards, collect optional pickups, reach the exit.
- Difficulty ramp: level 1 teaches jump gaps; level 2 adds moving or denser spikes; level 3 tightens timing or adds one enemy patrol.
- Default acceptance: title-ready, start-to-playing, player-moves-on-input, jump-changes-y, hazard-reduces-lives-or-ends, exit-wins-or-advances-level, gameover-on-zero-lives.

### shmup (vertical)

- View: top-down, player near bottom, threats move downward (or toward player).
- Controls: four-way move, Z/Space shoot, Enter start.
- Loop: weave through bullets or enemies, shoot targets, survive waves, rack score.
- Difficulty ramp: wave 1 sparse; wave 2 denser patterns; wave 3 adds a tougher pack or faster shots. Cap at three waves for v1.
- Default acceptance: title-ready, start-to-playing, move-clamped-in-bounds, shoot-spawns-bullet-or-raises-score-on-hit, hit-player-loses-life, clear-wave-increments-level, gameover-on-zero-lives, optional win-after-final-wave.

### arcade (top-down)

- View: top-down arena. No gravity. Colliders for walls and actors.
- Controls: four-way move, Z/Space primary (dash, tag, stun, or eat), Enter start.
- Loop: move in an arena, chase or avoid AI, collect items, score until timer or lives end.
- Difficulty ramp: more chasers, faster enemy speed, or fewer safe pickups across short rounds.
- Default acceptance: title-ready, start-to-playing, four-way-move, primary-action-effect, pickup-or-tag-raises-score, enemy-contact-loses-life-or-score, terminal-state-on-lose-condition.

### puzzle (falling-block)

- View: well or board grid, falling piece, locked solid cells.
- Controls: left/right move piece, up/X rotate, down soft drop, Z/Space hard drop optional, Enter start.
- Loop: spawn piece, rotate and place, clear lines or groups, survive until lock-out or hit clear target.
- Difficulty ramp: gravity step-up every N clears, or smaller reaction window. One mode only for v1 (line clear or simple match).
- Default acceptance: title-ready, start-to-playing, piece-moves-laterally, rotate-changes-shape, clear-raises-score, lock-out-or-top-out-to-gameover, optional win-at-target-score-or-lines.

## Juice checklist

Before calling design done, confirm:
- Start on title plays `select` or equivalent feedback
- Primary action plays a preset (jump/shoot/pickup)
- Damage plays `hit` plus shake or flash
- Defeat plays `explode` or `lose`
- Win plays `win`
- Score pickup plays `pickup`
- No silent failures on death, clear, or menu confirm

## Brief quality bar

Ship the brief only when:
- Genre is one of the four templates
- Win and lose are mutually reachable
- Acceptance checks are 5 to 8, seam-testable, and cover title, play start, at least one score or life change, and a terminal state
- Nothing in the brief requires declined capabilities
- A competent implementer can build it from `_template` without inventing a second mode
