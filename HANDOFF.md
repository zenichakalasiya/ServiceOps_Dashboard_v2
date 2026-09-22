# Handoff — 2026-09-22 23:30

## Read first
See **CLAUDE.md → Key files** rows for `AddWidgetModal.vue` and `WidgetCard.vue` —
both were reworked this session and their table entries now describe the current
behavior (the old entries were stale).

## What we worked on this session
Three related, incrementally-requested changes to the widget-adding flow and the
empty-widget state, each verified live before moving on:

1. **Add-widget drawer**: replaced the checkbox multi-select with a per-row hover
   "Add" action, and moved the search box from above the tab strip to below it
   (scoped to the active tab).
2. **Widget empty state**: made the "no data" state type-aware — it now draws the
   tile's own chart-shape illustration instead of one generic icon for every widget.
3. **Search box padding**: more top padding, less bottom padding, to match a
   reference screenshot.
4. **Made the empty state permanently visible on the demo board** — see below.

## Completed (pushed live — `v2-main` → `v2` remote's `main`)
- **`components/dashboard/AddWidgetModal.vue`**
  - Removed the checkbox / multi-select flow entirely (`selected`, `MAX_SEL`,
    `isSel`, `toggleSel`, `clearSel`, `addSelected`, and the "N selected" footer are
    gone).
  - Each library row now shows hover-only actions — **Add (leftmost, primary-tinted)
    · Duplicate · Edit · Delete** — via a new `quickAdd(l)` function. Add places the
    tile at the **end** of the dashboard and **keeps the drawer open** (explicit
    user choice) so several widgets can be added in a row; the row then swaps to a
    static green "already added" checkmark (`.la-added`) instead of a click target.
  - Search box moved from **above** the tab strip to **below** it, and only renders
    on the three reuse tabs (Predefined / Created by me / Shared with me) — Create
    Widget has nothing to search. Scope changed too: it now filters **only the
    active tab** (same scope as the type pills / module dropdown beside it),
    explicit user choice, rather than the old cross-tab/cross-module search that
    grouped results by module with a source-tab tag.
  - Removed the now-dead grouped-search machinery (`searchGroups`, `searchCount`,
    `sections`, `TAB_OF_PROV`) and the CSS that went with the checkbox/selection
    state (`.lcb`, `.lrow.sel`, `.lrow.pick`, `.lsec*`, `.row-tag.src`, the
    multi-select footer transition).
  - `.lt-acts` gutter widened from 3 buttons (96px) to 4 (130px) to fit Add.
  - `.aw-search` padding changed from `8px 16px 12px` to `18px 16px 4px` (more air
    above the box, tight below it) to match a reference screenshot.
- **`components/dashboard/WidgetCard.vue`**
  - Imported `ChartIcon` (the same illustrated artwork the Add-widget picker uses).
  - New `emptyIconName` computed + `EMPTY_KIND_ICON` map (`{hbar:'bar', bar:
    'column'}`) — translates a tile's renderer-style `chart.kind` into ChartIcon's
    picker-style naming (see the naming note already in `data/chartTypes.js`).
  - The `nodata` empty state now renders `<ChartIcon :name="emptyIconName" />` in a
    60px soft rounded well (`--picker-tile-fill` / `--picker-ico` tokens, new
    `.ws-ico-shape` class) instead of the old flat grey box with a generic
    `chart-bar` icon. `error` / `unconfigured` states were left on their plain
    semantic glyph (alert / settings) since those are a system problem, not the
    widget's shape.
- **`data/mock.js`**
  - **`Open Requests By Technician`** (the `hbar` chart on the default "Helpdesk
    Overview" board) now seeds with `values: []` — **deliberately and permanently
    empty**, per explicit user request, so the empty-widget state has a visible,
    always-on example on the board shown to management. Commented in-place ("do
    not fix by putting values back") so a future session doesn't "repair" it.

## In progress
Nothing mid-flight.

## Next steps
- Flagged but not fixed: on the narrowest KPI tiles (`w: 2`, ~140px), the nodata
  title "No data in this range" can wrap to several lines. Pre-existing text-sizing
  constraint, not introduced by this session — worth a look if it comes up again.
- Optional: confirm the pie/donut nodata icon mapping visually too (only `hbar`→bar
  and a KPI were screenshotted; pie/donut/line pass through their kind unchanged,
  which should be correct by the same logic, but wasn't independently eyeballed).
- If a second/third empty-state example is ever wanted (e.g. a KPI or a Shortcut,
  not just the one `hbar` chart), the pattern is the same: seed with no data
  (`value: null` for a KPI, `rows: []` for a shortcut, `series: [{...values: []}]`
  for a chart) and leave an in-place comment saying it's deliberate.

## Decisions made
- **Add stays open after adding** (not close-on-add) — explicit user choice, so
  several widgets can be added back-to-back without reopening the drawer.
- **Search is scoped to the active tab**, not global across all three reuse tabs —
  explicit user choice, matching the screenshot layout (search sits with the other
  per-tab filters, not above the tab switcher).
- **Only `nodata` gets the type-aware chart icon**; `error`/`unconfigured` keep the
  generic alert/settings glyph, because those describe a system problem rather than
  "this chart has no data to draw" — the tile's shape isn't the relevant fact there.
- **The empty-state demo widget is now PERMANENT, not a temporary screenshot aid.**
  Earlier in the session it was verified by temporarily emptying data and
  reverting, specifically to avoid leaving a real widget broken on the board shown
  to management without asking first. The user then explicitly asked to keep it
  empty going forward and push it — so `Open Requests By Technician` on Helpdesk
  Overview is now intentionally, permanently seeded with no data.

## Gotchas & notes
- **Icon-name mismatch between the renderer and the picker is real and easy to
  trip on.** `tile.chart.kind` uses the renderer's naming (`hbar` = horizontal,
  `bar` = vertical/Column), but `ChartIcon`'s `name` prop uses the picker's naming
  (`bar` = horizontal, `column` = vertical) — see the note already in
  `data/chartTypes.js` around `PICKER_GROUPS`. Passing a raw `chart.kind` straight
  into `ChartIcon` without the `EMPTY_KIND_ICON` swap silently renders a blank icon
  for `hbar` and the wrong (horizontal) icon for `bar`/Column. `AddWidgetModal`'s
  own `libIcon()` doesn't need this swap because library items store `kind` as the
  **picker id** already (`WidgetBuilderModal` emits `kind: curType.value.id` when
  saving to the library) — only live dashboard tiles use the renderer kind.
- **`ChartIcon.vue` has no fallback branch** — an unmapped `name` renders an empty
  `<g>` (no visible icon, no error). If a new chart kind is ever added, its
  `ChartIcon` name must be added there or nodata tiles of that kind will go blank.
- **`Open Requests By Technician` on Helpdesk Overview is intentionally empty —
  this is not a bug.** If anyone reports "a widget is broken" on that board, check
  here before touching `mock.js`.
- Dev server on this machine defaults to port 5180 (`http://localhost:5180/ServiceOps_Dashboard_v2/`)
  and falls back to 5181/5182 if occupied — check the actual `npm run dev` output
  rather than assuming 5180 when driving it with Playwright.
