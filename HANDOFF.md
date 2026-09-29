# Handoff — 2026-09-29 10:43

## Read first
In the prototype's `CLAUDE.md` → **Key files**, read the rows for `data/morphIcon.js` +
`MorphIconKit.vue`, `ChartLoader.vue` and `data/groups.js`. All three were changed this
session, and their rows describe the current behaviour: the loader hand-off kit, the mono
loader in the widget, and the group date icon, range-driven data and white body.

All work is on branch `v2-main` and deploys with `git push v2 v2-main:main`
→ https://zenichakalasiya.github.io/ServiceOps_Dashboard_v2/

## What we worked on this session
- Handed the monochrome **Chart Morph** loader to developers as downloadable files.
- Trimmed `/loaders` down to that one scene.
- Reworked group date filters and made widgets actually follow a group's range.
- Swapped the widget demo loader to the mono version.
- Made group bodies white.

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
- **Group body is white** (`--gh-body: var(--surface)` in `data/groups.js`). The border
  still takes the header colour.

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
- The standalone loader SVG is a **CSS-keyframe rebuild** of the JS-timed morph. Its
  geometry is copied from `ChartLoader.vue`, so change both together.

## Gotchas & notes
- The Claude-in-Chrome tab here ran as a **hidden tab**, where timers and SVG `<img>`
  animation are throttled and looked "frozen". Verify animation in headless Playwright
  instead: a scratch script that imports `playwright` + Vite's `createServer` from the
  project folder works well.
- The long-running dev server was killed once for low memory. Use short-lived Vite servers
  inside test scripts.
- `vite:vue` warns about a `<button>` inside a `<button>` in `ModuleListing.vue`. This is
  pre-existing and unrelated.
