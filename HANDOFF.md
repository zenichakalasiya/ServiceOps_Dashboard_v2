# Handoff — 2026-09-29 15:17

## Read first
In the prototype's `CLAUDE.md` → **Key files**, read the rows for `data/morphIcon.js` +
`MorphIconKit.vue`, `ChartLoader.vue` and `data/groups.js`. All three were changed this
session, and their rows describe the current behaviour: the loader hand-off kit, the mono
loader in the widget, and the group date icon, range-driven data, white body and default
border. The `WidgetCard.vue` row covers the header-as-drag-handle change. The
`data/previewArt.js` · `EmptyPreviewArt` · `PreviewStateGallery` · `NoDataArt` row covers the
empty-state illustrations and the new `/preview-states` page.

All work is on branch `v2-main` and deploys with `git push v2 v2-main:main`
→ https://zenichakalasiya.github.io/ServiceOps_Dashboard_v2/

## What we worked on this session
- Handed the monochrome **Chart Morph** loader to developers as downloadable files.
- Trimmed `/loaders` down to that one scene.
- Reworked group date filters and made widgets actually follow a group's range.
- Swapped the widget demo loader to the mono version.
- Made group bodies white and gave every group the default border.
- Made the widget header the drag handle, with a move cursor instead of a grip.
- Lined up the date picker's "Follow … filter" action with "Apply time range".
- Drew two new empty-state illustrations in the empty-group style: the builder's live
  preview before any condition is added, and "no data found" on widgets.
- Made both illustrations static, made the preview art follow the chart type (14 types),
  replaced the Empty States page with a "Preview States" page (SVG/PNG downloads), and
  removed the preview's "Live preview — updates as you configure" line.

## Completed
- **Loader hand-off kit** (`src/data/morphIcon.js`, `src/components/ui/MorphIconKit.vue`) is
  an "Icon files" panel under the Chart Morph — Monochrome card on `/loaders`. It offers:
  - an animated SVG with a 10s pure-CSS loop that works as `<img>` and follows auto light/dark;
  - a `currentColor` variant;
  - five still frames as SVG and 4× PNG;
  - the `ChartLoader.vue` source;
  - a zip of everything. A tiny store-only zip writer is included, with no dependency.
  - The `<img>` loop and the zip were verified in headless Chromium. **Deployed.**
- **`/loaders`**: every multi-chart scene except Chart Morph — Monochrome is hidden. They
  are hidden via `HIDDEN_SCENES` in `LoaderGallery.vue`, not deleted. **Deployed.**
- **Edit group drawer** (`GroupEditDrawer.vue`) keeps only Title · Header colour · Title
  size · Alignment. Date filter, Padding and Share group are removed.
- **Group header calendar icon is always shown** (`DashboardView.vue`). It is plain when
  unset and tinted `--df` when set, and it opens the same `TimeRangePopover`. This is now
  the only place a group's range is set.
- **Widgets follow the group's range** (`src/data/rangeData.js`, wired in `WidgetCard.vue`
  as `dataRange` / `viewValue` / `viewChart` / `viewRows`):
  - counts scale with the window's length;
  - each point gets a stable wobble;
  - `%` is capped at 100;
  - Shortcut rows become a stable subset.
- **Widget demo loader** ("Open Requests By Status", Helpdesk Overview (Grouped)) is now
  `<ChartLoader variant="morph" mono smooth :size="60" />`, the same as on `/loaders`.
- **Group body is white** (`--gh-body: var(--surface)` in `data/groups.js`), and every
  group's border is the default `--border` — only the header band takes the chosen colour.
- **Widget drag by header** (`WidgetCard.vue`): the hover grip is gone. The whole header
  shows `cursor: move` and arms the drag, while its buttons keep `pointer`. Locked layouts
  (`.cell.locked`) and present mode fall back to the default cursor, and the board marquee
  in `DashboardView.vue` ignores plain presses on `.thead`. **Deployed.**
- **Date picker** (`TimeRangePopover.vue`): "Follow dashboard/group filter" is full-width
  and left-aligned, with its ✕ centred under Apply's ✓ and both labels starting at the
  same x (measured). **Deployed.**
- **Builder live-preview empty state** (`components/ui/EmptyPreviewArt.vue`, `needsCond` in
  `WidgetBuilderModal.vue`). While building a NEW manual chart or KPI with no condition,
  the preview shows the art, the title "Add a condition to preview your chart|KPI" and one
  line. The first condition added reveals the chart. Editing, duplicating and cloning
  always preview the real chart. Shortcut, Query Based and Free Text are unaffected.
- **Classic kinds get a real condition editor.** Bar, Column, Line, Pie and KPI now use
  `MeasureConditions` (it was a placeholder "Add Condition" button). Conditions are saved
  on the tile as `t.conds` (`applyConds`) and read back when editing.
- **"No data found" illustration** (`components/ui/NoDataArt.vue`) is used by every widget
  type's no-data state in `WidgetEmpty.vue`; it replaced the disc with the tile's chart
  icon. It is sized by a ResizeObserver: 112px, then 80px, then hidden on very short tiles.
  Errors and unconfigured widgets keep the disc. Verified in light and dark themes.
- **Follow-up (same session):** everything below was verified in headless Chromium.
  - Both illustrations are **static**.
  - The preview art now follows the chart type. `data/previewArt.js` is the ONE source:
    - `PREVIEW_KINDS`: 14 types, each with a two-line `desc`;
    - `previewArtMarkup(kind)`;
    - `previewSvgFile` / `previewPng`.
  - `EmptyPreviewArt` takes `kind`. The builder passes `emptyKind` and uses the matching
    title and description.
  - The `/preview-states` page (`views/PreviewStateGallery.vue`, rail "Preview States", eye
    icon) lists all 14, with Copy · SVG · PNG and a zip.
  - The `/empty-states` page (`EmptyStateGallery.vue`) and its rail item were **removed**.
  - The builder's `.pv-foot` line was removed.

## In progress
**Adding several existing board widgets to a group at once** is at the proposal stage; no
code has been written. Proposed to the user:
- **A.** A "On this dashboard" tab in the group's **+** drawer, with checkboxes and a
  "Move N widgets" action.
- **B.** A selection mode on the board (Ctrl/Shift+click) with a floating bar:
  Move to group ▾ · New group from selection · Clear.
- **C.** Multi-drag, which would come later and build on B.

Recommended: A + B. Waiting on the user's answers to:
1. Move or copy?
2. Include widgets already in other groups?
3. Order inside the group?
4. Can seeded widgets be moved?

## Next steps
1. Get the user's decisions on the four questions, then mock up A (and B) in the prototype.
2. Optionally extend `rangeData.js` to the spec-driven chart kinds (`chart.spec`: Stacked,
   Heatmap, Funnel, and so on). They do not follow a group range yet.

## Decisions made
- **Only a GROUP range re-reads widget data.** A widget's own range and the dashboard
  filter keep the seeded data, because the seeded figures were written for their own range
  (e.g. "Requests Due in the 24 Hours" on Today stays 24). The chain is still
  widget → group → dashboard.
- Padding and share are no longer editable. Existing groups keep their values, and the
  defaults are padded and public.
- Preview empty state: classic kinds get the REAL condition editor (not a placeholder
  click); only building shows it (editing shows the real chart); one no-data illustration
  for every widget type. All three were the user's picks.
- The standalone loader SVG is a **CSS-keyframe rebuild** of the JS-timed morph. Its
  geometry is copied from `ChartLoader.vue`, so change both together.

## Gotchas & notes
- The Claude-in-Chrome tab here ran as a **hidden tab**, where timers and SVG `<img>`
  animation are throttled and looked "frozen". Verify animation in headless Playwright
  instead: a scratch script that imports `playwright` + Vite's `createServer` from the
  project folder works well.
- The long-running dev server was killed once for low memory. Use short-lived Vite servers
  inside test scripts.
- **Don't use a CSS size container (`container-type: size`) for the widget empty state.** It
  matched its smallest `@container (max-height)` query on a 188px tile and hid the art.
  `WidgetEmpty` measures itself with a ResizeObserver instead.
- In test scripts, `getByText('Helpdesk Overview').first()` can time out on the sidebar.
  Clicking the leaf element whose text matches exactly, from `page.evaluate`, works.
- `vite:vue` warns about a `<button>` inside a `<button>` in `ModuleListing.vue`. This is
  pre-existing and unrelated.
