# Documentation Workflow

Use this workflow when editing `radio-sim` docs.

## Local Preview

From `radio-sim/`:

```bash
python3 -m pip install mkdocs mkdocs-material pymdown-extensions
python3 -m mkdocs serve
```

Preview at <http://127.0.0.1:8000>.

From repo root (equivalent):

```bash
python3 -m mkdocs serve -f radio-sim/mkdocs.yml
```

Use the `-f radio-sim/mkdocs.yml` form if you are in the repo root and want the simulator docs site.

## Build Static Site

```bash
python3 -m mkdocs build
```

Output is written to `site/`.

## Adding or Updating a Page

1. Create or edit a file under `docs/`.
2. Update `mkdocs.yml` `nav:` entries.
3. Prefer relative links between docs pages.
4. Keep command snippets runnable from the stated working directory.

## Visual Diagrams

Mermaid is enabled for docs pages via:

- `pymdownx.superfences` custom `mermaid` fence in `mkdocs.yml`
- `docs/javascripts/mermaid-init.js`

Use fenced blocks:

```text
```mermaid
flowchart TD
  A --> B
```
```

## Math and Status Marking

Math is enabled with Markdown math syntax:

- inline math: `$...$`
- display math: `$$...$$`

When documenting target functionality that is not yet implemented, use:

```html
<span class="status-planned">planned text</span>
```

Use normal body text for behavior that is implemented in code today.

## Quality Checklist

- `mkdocs build` succeeds.
- No stale absolute machine-specific paths.
- README links and docs links point to existing files.
- Behavior claims align with current implementation (`crates/radio-sim-core` + `crates/radio-sim-py`).

## Scope Rules

- Keep docs behavior-level accurate; do not claim firmware-identical behavior.
- Document unsupported knobs and known caveats explicitly.
- For experimental claims, include reproducible command + output artifact path.
