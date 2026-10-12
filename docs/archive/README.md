# Archived pages

Text of pages that used to be published on cvc-lab.github.io and were taken down. Nothing in this folder is built into the site: Gatsby reads only `src/` and `static/`.

| File                                                 | Was published at                                                 | Removed    |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| [internal-links.md](internal-links.md)               | `/internal/`                                                     | 2026-10-12 |
| [dbg-systems-protocols.md](dbg-systems-protocols.md) | `/projects/dynamic-belief-games/internal/systems-protocols/`     | 2026-10-12 |
| [dbg-gym-visualization.md](dbg-gym-visualization.md) | `/projects/dynamic-belief-games/internal/dbg-gym-visualization/` | 2026-10-12 |

`internal-links.md` is kept exactly as it was published, so Prettier skips it (`.prettierignore`).

## Why they were removed

The three pages sat behind a password prompt that ran in the browser. The prompt was a convenience screen, not access control: the pages were still published as static files. The public site now has no internal pages and no password prompt, and it needs no `.env` file.

## Where the original code is

The last commit that contains the pages, the prompt and its tests is `40de5739`:

- `src/markdown/internal/internal.md`
- `src/pages/projects/dynamic-belief-games/internal/`
- `src/components/password-protect/` and `src/pages/password-protect.js`
- `tests/password-gate.test.js` and `tests/password-gate.ssr.test.js`

`git show 40de5739:<path>` prints any of the files.
