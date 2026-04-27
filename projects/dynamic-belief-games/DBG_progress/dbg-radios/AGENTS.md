# AGENTS.md

## File Convention
`AGENTS.md` is the single source of truth for agent instructions.

- Codex reads `AGENTS.md` directly.
- Claude should use `CLAUDE.md` as a symlink to `AGENTS.md`.

Setup command:
```bash
ln -s AGENTS.md CLAUDE.md
```

## Repo Objective
This repo develops and evaluates local PIN (Predictive Intelligent Network) control overlays for radio emulation, with emphasis on:

- CSMA/CA-style local control for Silvus-like behavior.
- TDMA/TSM-style barrage behavior alignment and constraints within `radio-sim`.
- measurable improvements in packet delivery ratio (PDR) and latency over scenario life.

## Session Start Checklist
At the start of each session:

1. Verify `CLAUDE.md` is a symlink to `AGENTS.md` (if both exist).
2. Read `OBJECTIVES.md` before coding.
3. Ask which runtime to use (conda/venv/system).
4. Ask what the focus is for today.

## Working Style
- Prefer minimal, targeted changes over broad refactors.
- Follow existing repo patterns.
- Keep communication concise and explicit.
- Maintain a visible task list for multi-step work.
- Keep one task in progress at a time.

## Coding Conventions
- Use ASCII unless file already requires Unicode.
- Use stdlib-first solutions unless dependencies are clearly justified.
- Use comments only for non-obvious logic.
- Keep math and notation consistent across docs/code.

## Safety Rules
- Never modify files outside this repo without explicit permission.
- If requirements are ambiguous and materially affect design, ask before proceeding.
- Do not run destructive git commands unless explicitly requested.

## Testing and Validation
- Suggest relevant tests for each change.
- Ask before running long test suites.
- If tests are not run, say so explicitly.
- For experimental claims (e.g., PDR/latency gains), provide reproducible artifacts (script + data + figure/report).

## Git Rules
- Do not commit unless asked.
- Use concise, factual commit messages.
- Do not mention AI assistants in commit messages.
