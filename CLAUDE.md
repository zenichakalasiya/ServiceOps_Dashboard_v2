**On session start:** If `HANDOFF.md` exists in this directory, read it before anything else for the latest state of the work.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A runnable **Vue 3 + Vite** prototype of the revamped **ServiceOps Dashboards** experience — the
working demo shown to management. **Front-end only: mock data, no backend, no persistence** (state
resets on every page refresh). Every action fires a toast so the behavior is observable in a demo.

This repo is **published publicly** and auto-deploys to GitHub Pages. It is the *only* part of the
larger analysis workspace that is public — the planning docs, the limitations register, and
credentials live in the parent workspace **outside this folder** and must never be copied in here.

## Deployment
Repo: https://github.com/zenichakalasiya/ServiceOps_Dashboard_v2
Live URL: https://zenichakalasiya.github.io/ServiceOps_Dashboard_v2/

**This is v2** — the restyled build (lucide icons, style-guide palette/type/radius,
Export replacing Share, Free Text as a note, group date filters).
The ORIGINAL board is still live and unchanged at
https://zenichakalasiya.github.io/ServiceOps_Dashboard/ (repo `ServiceOps_Dashboard`),
so anything already shared with management keeps working. The two are independent:
pushing here never touches the original.

## Commands

```bash
npm install
npm run dev        # http://localhost:5180 (Vite; host:true so it's reachable on the LAN)
npm run build      # → dist/
npm run preview    # serve the built bundle on :5180
npx playwright test               # e2e (chromium only, configured in playwright.config.js)
npx playwright test tests/foo.spec.js         # a single file
npx playwright test -g "some title"           # a single test by title
npx playwright test --ui                      # interactive runner
```

There is **no lint step and no unit-test suite** — don't invent one. Playwright was added for e2e
only; the app itself has no in-repo assertions.

**Driving a browser:** prefer the **Playwright MCP** (`plugin:playwright:playwright`) over
hand-written throwaway scripts — it hands back an accessibility snapshot with stable `ref=`
handles instead of CSS selectors guessed from the source, which is where ad-hoc scripts here
kept going wrong (one class matching thirteen elements, another matching two components).
No need to ask before using it here — browser verification is implied whenever this
prototype's UI changes. Use `browser_snapshot` to find and act on elements, and screenshots
only to judge how something looks. Delete the `.playwright-mcp/` folder and any named
screenshot it drops in the working directory; they are not part of the project.

**Deploy:** commit + push to `main` → GitHub Actions rebuilds → live at
`https://zenichakalasiya.github.io/ServiceOps_Dashboard_v2/`. Vite `base` is `/ServiceOps_Dashboard_v2/`,
so all asset paths assume that prefix — never hardcode a root-absolute `/foo` URL.

## Architecture — the big picture

**One reactive store is the whole backend.** `src/store/index.js` exports a single `reactive()`
`store` object (dashboards, folders, tile `library`, modules, `ui` flags, global `timeFilter` /
`autoRefresh`) plus *all* mutations as plain exported functions (`createDashboard`, `cloneDashboard`,
`archiveDashboard`, `addTilesToDashboard`, `rearrangeTiles`, …) and computed getters (`live`,
`manageable`, `archived`, `favorites`, `recents`). Components import these directly — there is no
Vuex/Pinia and no action dispatch layer. Seed data comes from `src/data/mock.js` via `seed()`, with
tile factory helpers `kpi()`, `chart()`, `shortcut()` reused both for seeding and for
runtime-created tiles.

**Routing** (`src/router/index.js`) is **hash mode** (`createWebHashHistory`) — required for GitHub
Pages. Routes: `/dashboard/:id` (a board), `/dashboards` (the Manage listing), `/archive`; `/`
redirects to the user's default board. Note the mismatch between the mock URLs here and the live
product's `/dashboard` singular route.

**Tile types**, each carrying a **provenance** tag that drives locking:
- `kpi` (headline number) · `chart` (ECharts widget) · `shortcut` (record table) · `text` (Free Text,
  no data query — stores `content`, rendered by `FreeTextTile.vue`).
- `tile.prov` ∈ `predefined | user | shared`; `tile.seeded` marks a tile shipped *with* a
  predefined board. These flags are enforced **in the store** (`removeTile`, `archiveDashboard`,
  `archiveMany` all guard and *say so* rather than silently doing less than asked), not just hidden
  in the UI.

**Chart type-switching + locking rules live in exactly one file:** `src/data/chartTypes.js`. Only
`bar`/`hbar`/`line` are interchangeable (same category-vs-value shape); pie/donut/funnel/pyramid are
part-of-whole (`slice:true`) and can't be switched into; a predefined pie/KPI/shortcut is frozen.
Both the tile ⋯ menu and the builder call `typesFor()` / `isFrozen()` / `whyDisabled()` — don't
re-derive these rules anywhere else.

**The 12 chart types + Free Text (PMG-ACT-01).** Beyond the four legacy kinds (Line/Bar/Column/Pie)
the builder ships eight additional chart kinds — **Stacked · Multi-line · Combo · Histogram · Funnel ·
Heatmap · Gauge · Map Bubble** — plus a **Free Text** tile family. These are *spec-driven*: a tile
stores a `chart.spec` (its per-kind config), and everything computes deterministically from a single
48-record demo dataset:
- `src/data/records.js` — the dataset (solved to reproduce **every** worked example in the reference
  *including the resolution averages*, 73/73) + the engine (`chartTwoDim`, `chartCombo`,
  `chartHistogram`, `chartHeatmap`, `chartMapBubble`, `chartFunnel`, `measurement`, `gaugeBands`) +
  `chartData(spec)`, the one dispatch every additional kind renders through. Shared vocab:
  `CONDITION_FIELD_LABELS`, `NUMERIC_FIELD_LABELS`, `AGG_FNS`, `MAP_FNS`, `valuesFor`, `SITE_COORDS`.
- `src/data/chartOptions.js` — one `opt*` ECharts-option builder per kind, the `CHART_OPT` map, and
  **`NEW_KINDS`** (the authority for "is this a spec-driven kind?"). `ChartTile` dispatches new kinds
  here; the legacy kinds stay inline in `ChartTile`.
- A **spec-driven tile carries `chart.spec`, not `chart.series`** — so `WidgetCard.tileState` returns
  `'ok'` when `chart.spec` is present (else a placed new-kind tile falsely reads "no data"), and the
  AI chart-summary recomputes `{labels,series}` from `chartData(spec)`.
- New kinds are **frozen** (`isFrozen` true via `NEW_KINDS`) — never offered a ⋯-menu type switch.
- **Map Bubble** registers a code-split India geo (`src/data/indiaMap.json`, ~35KB gzip) lazily via
  `ChartTile`'s `ensureIndiaMap()` — never in the main bundle.

**Filterability heuristic:** `src/data/filters.js` decides which columns are worth offering as
filter fields — a field whose values never repeat is a *list*, not a filter, so it's excluded.

**Rendering choices (and why):** ServiceOps ships **on-prem**, so an embedded commercial chart lib
would be redistributed and trigger OEM licensing — hence **Apache ECharts** (`vue-echarts`), with
only the components actually used registered to keep the bundle small. Tables use **TanStack Table**
(headless) so `tokens.css` keeps owning the markup instead of fighting a vendor theme.

**Styling** is plain CSS with design tokens in `src/styles/tokens.css` (full **light + dark**
themes; the topbar toggles `store.ui.theme`). No CSS framework. The typeface is **Inter**
(loaded in `index.html`, exposed as `--font`). Icons are **lucide** (`lucide-vue-next`) routed through
`src/components/ui/Icon.vue` (name → component map). The indirection is deliberate: call
sites name what an icon MEANS, so lucide's renames between majors stop in one file.

**The visual language follows a style guide** — colour, type scale, radius tiers
(controls 4px / badges 2px / surfaces 8px / containers 12px), control heights (32/36),
buttons, forms, pills, tables, cards, tabs and menus. The values live in `tokens.css` and
`global.css`; components read them through `var()`. Charts, the AI panel, the note tile,
widget/group chrome and the dark theme are outside its scope and keep their own styling.

**The AI gradient is tokenised — use the tokens, never hand-rolled gradients:**
- `--ai-grad` — the vivid identity gradient (blue → purple → pink, `0 / 24.52 / 100%`). Used
  for solid primary buttons and for **text** clipped with `background-clip: text`.
  > ⚠️ **Icons cannot use `background-clip: text`** — they are SVG strokes, not font
  > glyphs, and the clip has nothing to bite on (every AI icon rendered blank when the
  > project moved to lucide). An AI icon paints itself with `stroke: url(#ai-grad)`,
  > referencing the `<linearGradient>` declared once in `App.vue`.
- `--ai-grad-line` — the same ramp at 80% alpha, for **gradient borders** on primary CTAs
  (`linear-gradient(var(--surface),var(--surface)) padding-box, var(--ai-grad-line) border-box`
  over a `1px solid transparent` border).
- `--ai-grad-soft` — an 8%-over-white wash, for suggested items and the assistant panel’s
  own surfaces (options, picks, chips). **Not** for insight-card CTAs — those have their
  own pair, below.
- `--ai-wash` (3%) and `--ai-cta` (12%) — the insight **card** wash and its secondary CTA
  tint, both measured off the real ServiceOps ticket-detail AI Summary card.
- Follow-up pills are deliberately **monochrome** (`--surface-2`) — colour there competes with
  the answer above it.

**The AI insights card has exactly ONE definition — `.aic` / `.ai-cta` in `global.css`.**
Four components render that card (the board `AiSummaryCard`, the KPI-row `AiInsightCard`,
the header popover `AiInsightChip`, and the widget hover card in `WidgetCard`), and every
previous attempt to keep them in step by copying the rules into each scoped block drifted
inside a single session — five spellings of one button, three of them a different radius.
Add `class="aic"` to the shell and `class="ai-cta"` to each action; never restate the
border, the wash, the height or the tint locally. A scoped `.foo-cta` out-specifies the
global rule, so a local copy does not merely duplicate it, it silently wins.

The card carries **two CTA types, and the order is the hierarchy**: the FIRST action is
`.primary` (the 80% ramp as a gradient border over the surface), every other is secondary
(the flat 12% tint). Both are 32px so their labels share a baseline. Hover changes the
**label** colour and adds `--sh-sm` — never the background, because the tint IS the
resting state and re-tinting on hover reads as "selected".

**Popovers/menus** that a card's `overflow:hidden` would clip are **teleported to `<body>`** and
positioned in viewport coordinates — follow that pattern for any new floating UI.

> Note: `README.md`'s "Stack" section is **stale** — it describes hand-rolled SVG charts with "zero
> chart dependency." The app has since moved to ECharts + TanStack (see `package.json`). Trust this
> file over the README on the rendering stack.

## Key files

| File | Role |
|---|---|
| `store/index.js` | The single source of state + every mutation and getter. |
| `data/mock.js` | Seed data + `kpi`/`chart`/`shortcut` tile factories. |
| `data/chartTypes.js` | **Authoritative** chart type-switch / freeze rules (imports `NEW_KINDS`). |
| `data/records.js` | The 48-record demo dataset + engine + `chartData(spec)` for the additional kinds. |
| `data/chartOptions.js` | One ECharts `opt*` builder per additional kind + `CHART_OPT` + `NEW_KINDS`. |
| `data/freeText.js` | Parser for the Free Text tile (`# `/`- `/paragraph, `[label](url)`). |
| `data/indiaMap.json` | Simplified India geo for Map Bubble — code-split, lazy-registered. |
| `components/dashboard/MeasureConditions.vue` | The shared `field is value` (ANDed) conditions editor. |
| `components/dashboard/FreeTextTile.vue` | Renders a Free Text tile's parsed content. |
| `data/filters.js` | Which columns qualify as filter fields. |
| `views/DashboardView.vue` | The board: grid, grouping, undo/redo, skeleton + reveal, rearrange. |
| `views/ManageDashboards.vue` | The "All Dashboards" data grid — sort, filter, bulk actions. |
| `components/dashboard/ChartTile.vue` | ECharts wrapper — kinds, semantic colors, legend + rank-window, per-type entrance animation. |
| `components/dashboard/DataTable.vue` | TanStack table for Shortcut tiles — sort, search, per-column filters. |
| `components/dashboard/TableFilterBar.vue` | The Requests-style filter bar: pick a field in the search box → `Field Operator Value` chip → operator popover. Chips AND across fields. |
| `components/dashboard/DataModeSwitch.vue` | The builder's **Data source** (Manual / Query based), 2026-09-30 — replaced the two small chips, which did not read as the switch that swaps everything below. Two designs, both the user's picks, flipped from a dashed **Demo · switch UI** pill above it (`store.ui.modeUi`: `cards` | `banner` | `pill`): **A** two option cards (icon + title + one line, chosen edged `--sel` at 1px only, no ring, with a check; the icon badge is a LIGHT 10% `--sel` tint with a near-black glyph in both designs, never a solid dark square; the section it ends has 18px bottom padding, not 24, so the first field below reads as part of the chosen mode; its "Data source" title is 16px/700 (`.dm-title`), 2px and 200 weight above a normal section title) · **D** a mode banner (`MANUAL MODE` / `QUERY MODE`, what it means for the fields below, one "Switch to …" action; query wears a darker wash). · **Black pill** a full-width near-black pill track (Manual | Query based) with the chosen mode's one line under it — the ONE dark control in the sidebar, because the builder sidebar's other `.seg` tracks are **white-minimal** (white chip + hairline shadow on the grey track, scoped `.config :deep(.seg-b.on)` in WidgetBuilderModal; the rest of the app keeps the black `.seg`). Drop the demo pill once one is chosen. |
| `components/dashboard/WidgetBuilderModal.vue` | Create/edit a tile. **Chart Type shows ONE category at a time** (2026-09-29): a `.seg.fill` track of the four `PICKER_GROUPS` categories, opened on the current type's category, with only that category's tiles below. A tab only browses (`kindCatPick`); a tile picks (no dot on the current type's category — removed at the user's ask). **Sidebar type & spacing (2026-09-29, user):** section titles `--cfg-title` (#07101F light) at 500, field labels and control text `--cfg-text` (#1D2A3E light), the grey one-line descriptions (hints, toggle notes, access note) `--cfg-sub` (#516381 light) — all three have dark values; title → first field 8px, field → field 16px, every main section 24px bottom padding (Chart Type included), Manual / Query 32px below the chart tiles; a one-line description sits **2px** under whatever it describes, title OR field (one rule: `.config :not(.sec-h):not(.hint):has(+ .hint)`); `+ Add Condition` (MeasureConditions `.mc-add`) has the outlined near-black `+ Add Highlights` look; the header Reset and the preview Refresh carry an INSTANT tooltip via the global `[data-itip]` utility in global.css (no native title — it waits ~1s and would double up); a `.grid2` pair is one row (its fields drop their margin). No empty-condition line anywhere (`MeasureConditions` hides it when `emptyText` is blank). **The Highlights section was removed**; a predefined widget's only editable thing is now its Chart Type switch. |
| `components/dashboard/AddWidgetModal.vue` | The widget picker drawer. Tabs Create Widget · Predefined · Created by me · Shared with me (no All, no Archive — Delete is a confirmed hard delete); the search box sits **below the tabs** and only on the three reuse tabs, scoped to the active tab (same scope as the type pills / module dropdown beside it) — Create Widget has nothing to search. Rows are two-line cards: artwork · title + module chip · description, no checkboxes — each row's hover actions are **Add (leftmost) · Duplicate · Edit · Delete**; Add places the tile at the end of the board and leaves the drawer open (repeat for more), swapping to a static "already added" mark. Library items carry `desc` + `kind`. |
| `components/dashboard/WidgetCard.vue` | The tile shell — header actions, ⋯ menu, per-widget AI hover card, **the whole header band is the drag handle** (no grip glyph since 2026-09-29: `cursor: move` over the header, its buttons keep `pointer`; a press on a non-control arms the drag; locked layout and present mode fall back to the default cursor; the board marquee ignores plain presses on `.thead`), and the **empty-widget states** (`tileState`: unconfigured / error / nodata). The nodata state draws the tile's own `ChartIcon` shape (bar/pie/KPI/shortcut/…) in a soft tinted well rather than one generic icon for every widget — `EMPTY_KIND_ICON` maps the renderer's `hbar`/`bar` kind naming onto ChartIcon's picker-style `bar`/`column` naming. Error/unconfigured keep the plain semantic glyph (alert/settings) since those are a system problem, not the widget's shape. |
| `components/ui/FilterMenu.vue` | Shared two-level filter: OR within a field, AND across fields. |
| `components/ai/AiAssistant.vue` | The whole AI side panel — composer, thread, creation flows. |
| `components/ai/AiSummaryCard.vue` | The upfront AI Summary banner + its 3 CTAs. |
| `views/AiPlacementLab.vue` | Internal `/ai-placement` lab comparing 3 entry placements (header chip · KPI-row card · banner). All three open the **real `AiAssistant` overlay** — each CTA fires its own intent (`analyzing` / `widgets` / `suggestwidget`). `AiInsightsPanel.vue` (the old mock push-panel) is no longer referenced. |
| `data/aiEngine.js` | **Deterministic, no-LLM** engine: facts, anomalies, explanations, briefings. |
| `data/aiAssistant.js` | Intent routing, tile/fact resolution, and `resolveWidget` (description → configured widget). |
| `data/freeText.js` | Note content: allowlist sanitiser, markdown-lite upgrade, derived title. |
| `components/ui/ColorPicker.vue` | Named palette + a custom HSV picker (hue/alpha/hex/RGBA). Teleported to `<body>` and flipped above the field when there is no room below. |
| `components/dashboard/FormattingHelp.vue` | **Unreferenced since 2026-09-30** — the Free Text field is now a rich-text editor (`RichTextEditor.vue`), so the markdown help modal has nothing to explain. |
| `components/dashboard/NoteEditor.vue` | The OLD note editor — **unreferenced**; superseded by `RichTextEditor.vue` (the builder's Free Text field). |
| `components/dashboard/RichTextEditor.vue` | The Free Text rich-text editor — see "Free Text is a NOTE" below. Its Text colour / Background colour buttons open `ColorPanel`. A **Layout** strip along its top (two cards, Default · Header — the old `FT_PRESETS`, moved into the editor as `v-model:layout`) writes `cfg.ft` + the tile width: Header = 24px, centred, vertically middle, transparent, full row (12); Default = 16px top-left, 4 wide. The text area takes the chosen look and is 400px tall (drag to 900). |
| `components/ui/ColorPanel.vue` | The editor's colour picker (2026-09-30, to the user's screenshot): named list Default · Gray · Green · Blue · Yellow · Orange · Red, a rule, Custom — beside an HSV square, hue + opacity rails, Hex (no #) · R · G · B · A, Cancel / Apply. Teleported, opens above its button. Named colours are stored as THEME TOKENS (`var(--red)`, highlight = `color-mix(in srgb, var(--red) N%, transparent)` from `NOTE_HL` in `data/freeText.js`) so a note follows light/dark; the browser rejects `var()` in execCommand, so `setColor` marks the selection with a sentinel colour and swaps the token in. Default removes the colour. `sanitizeNote`'s `COLOR_RE` allows exactly those tokens. Colour maths shared with `ColorPicker` in `data/color.js`. |
| `components/dashboard/TimeRangePopover.vue` | The two-pane date picker for **per-widget and per-group** overrides. NOT the topbar — `TimeFilter.vue` has its own copy of the markup and does not import this. Change one and check the other. |
| `components/dashboard/CreateDashboardPanel.vue` | The Create / Edit / Clone Dashboard drawer. **Spaced to the Figma frame "Create dashboard — Full form" (`pgE39fu3jbYtHGWus4NAWk`, node `362:12919`), matched text-to-text by pixel measurement (2026-09-29):** 12px side padding, a 50px header over a 1px rule, 12px footer with 30px buttons, 30px controls (64px textarea), section title 18px under the header rule, label→control 2px, field→field 12px, field→section 20px, a 276×36 access switch, a content-hugging access note, toggles aligned to their title. All of it is SCOPED to `.drawer` via `--cd-*` vars — `.dlg-head` / `.dlg-foot` are shared by every dialog. |
| `components/dashboard/ExportDialog.vue` | Board Export — Image / PDF / Email as PDF. |
| `components/ui/Hint.vue` | Info icon beside a field label, carrying what was once a one-liner. |
| `components/ui/ChartLoader.vue` | Widget-loader candidates that build a small chart instead of spinning: `morph · flow · trend · orbit · equalizer · slices · scatter · blocks · gauge` (morph cycles five charts: columns → trend → donut → pattern → blocks), one 160×100 artboard drawn ≤76px wide, an x-axis line on axis charts only (none under pie/donut), `--chart-*` palette, `speed` + rotating `caption`, reduced-motion → a gentle breath. Props `mono` (slate `--picker-ico` in solid shades), `smooth` (no overshoot, charts fade out as the next arrives), `size` (max px). **`flow`** is the continuous morph over the SAME five charts as `morph` (user's call — don't swap them): 15 pieces (5 data slices × 3 parts), each ONE 16-point polygon (two 8-point edges), so any chart interpolates point-by-point into any other. Transitions, chosen by the user: column tips into line · line curls into donut · slices shatter into scatter dots, trend draws through · dots drop and square off into stacked blocks · blocks merge back into columns. 2s a chart (1.3s morph, staggered easeInOutCubic); fills re-shade by CSS transition; a flag that arrives (axis, line points, trend) fades in only as the pieces land. Keep every new shape on the same 16-point topology or the morph tears. The mono Chart Morph (60px) and Chart Flow (72px) lead the Multi-chart scenes section. Shown at `/loaders` (`views/LoaderGallery.vue`, rail icon under Preview States). WidgetCard plays the **mono** `morph` loader (`mono smooth :size="60"`, the same one as on /loaders — not the colourful original) for a tile with `loaderDemo: true` (10s — one full five-chart loop — on mount and on every Refresh) — seeded on "Open Requests By Status" in Helpdesk Overview (Grouped) only. |
| `components/ui/ChartLoaderScene.vue` | MULTI-chart loader scenes, monochrome slate (`--m1..5` = `--picker-ico` mixed into `--surface`), smooth motion, tap → "boop" bounce: `assemble` (KPI·Column·Donut·Line) · `chomp` (Pie·Line·KPI) · `funnel` (Funnel·Stacked) · `pulse` (Combo·Gauge) · `heatdrop` (Heatmap·Histogram) · `race` (Multi-line·KPI). Second section of `/loaders`. |
| `data/previewArt.js` · `components/ui/EmptyPreviewArt.vue` · `views/PreviewStateGallery.vue` · `components/ui/NoDataArt.vue` | Empty-state art in the `EmptyGroupArt` idiom (one `currentColor` at stepped opacities + the card surface, painted `--picker-ico`), **all static** (no motion — user's call 2026-09-29). **`data/previewArt.js` is the one source** for the builder's live-preview empty state: `PREVIEW_KINDS` (14 types — Line · Bar · Column · Pie · Donut · Stacked · Grouped · Multi-line · Combo · Histogram · Funnel · Heatmap · Gauge · KPI, each with a label, noun and a two-line `desc`), `previewTitle()`, `previewArtMarkup(kind)` (fixed scene: dashed preview frame + Conditions panel + arc; only the ghost chart in the frame changes — dashed outline + 6% wash, CENTRED at (44, 53) via each ghost's measured bounding box in `BOX` — re-measure with getBBox if you redraw one), `previewSvgFile()` (hex-resolved) and `previewPng()` (4×). `EmptyPreviewArt` renders it for `kind` in `WidgetBuilderModal` while BUILDING a manual chart/KPI with no condition (`needsCond`, `emptyKind`); editing/duplicating/cloning previews the real chart. **`/preview-states`** (rail: "Preview States", eye icon) shows all 14 with Copy · SVG · PNG and a zip of everything. The classic kinds use the real `MeasureConditions` editor (`t.conds`). The builder's "Live preview — updates as you configure" footer line was removed. **NoDataArt** = every widget's no-data state (`WidgetEmpty`, kind `nodata`), sized by a ResizeObserver (112 → 80 → hidden) — a CSS size container matched its smallest query on a 188px tile. **The `/empty-states` gallery (`EmptyStateGallery.vue`) was removed 2026-09-29**; `data/emptyStates.js` still holds the widget empty-state copy. |
| `data/morphIcon.js` + `components/ui/MorphIconKit.vue` | The mono Chart Morph as **developer hand-off files**, in an "Icon files" panel under its card on `/loaders`: a self-contained animated SVG (pure CSS keyframes, 10s loop — works as `<img>`; auto light/dark; reduced-motion shows the columns), a `currentColor` variant, the five charts as still SVG + 4× PNG, the `ChartLoader.vue` source (`?raw`), and all of it as one zip (a tiny store-only zip writer, no dependency). Geometry is **copied** from ChartLoader's morph — change one, change the other. |
| `data/groups.js` | A group's look: header colour, title size, alignment (default **centre**), padding, share. **Edit group has only Title · Header colour · Title size · Alignment** (2026-09-28): padding and share keep their defaults (padded, public) and are no longer editable; the **date filter is set only from the calendar icon that is ALWAYS on the group header** (plain when unset, `--df` tint when set). A group range re-reads the data of every widget in it that has no range of its own — `data/rangeData.js` (counts scale with the window's length, a stable per-point wobble, % capped at 100, Shortcut rows a stable subset); a widget's own range and the dashboard filter show the seeded data. Spec-driven chart kinds (`chart.spec`) are not re-read. `grpHeadVars(g)` is the one resolver. The Default header colour is `--grp-head` (#ecf1f9), and the group BODY is plain white `--surface` (`--gh-body`; the 5% header-colour tint was removed 2026-09-29) and the group OUTLINE is always the default `--border` (`--gh-line`) — only the header band takes the chosen colour (2026-09-29). |
| `components/dashboard/GroupEditDrawer.vue` | Edit group: one field per row, applied live, and Cancel/Esc restores the snapshot. The group header's right side holds date · + · ⋯ (Edit / Clone / Ungroup / Delete, the menu flips up near the viewport bottom). An empty group is a dashed well. **Creating a group adds only that group** — widgets already on the board stay ungrouped above the groups (an auto-wrap into a board-named group was tried and removed). The header is the drag handle and is **`position: sticky`**, so it holds the top while its group scrolls and hands off to the next. That needs `.group { overflow: clip }`: `hidden` would make the group a scroll container and kill the stick. The board toolbar (`.bhead`) is sticky too, and a group header sticks 16px UNDER it (`--bar-h`, measured by a ResizeObserver); `markStuck()` flags the stuck one; while stuck its band is repainted as a rounded layer (`::after`) over a white backing (`::before`) so the top corners stay round and the gap above stays white. ⚠️ `.board` must be `flex: none`: `.main` is a flex column and a shrinkable board got squeezed to viewport height, which un-stuck the toolbar. **Group navigation is board-level — the toolbar's "Groups ▾"** (where Undo/Redo were; those keep Ctrl+Z / Ctrl+Y). Sections = "Ungrouped widgets" (if any) + every group; the button just reads "Groups"; the section under the sticky line (scroll-spy, `spySection`) is marked inside the list, which jumps (`jumpToGroup`: glide + `.g-flash` pulse), the footer has ONE toggle — Collapse all while every group is open, else Expand all, Alt+↓/↑ step, G opens it (type-to-filter over 6 sections). After a jump the picked section stays "current" until the user scrolls by hand. The last section per board is remembered in localStorage (`sod:lastSection:<id>`) and restored on open — saved only after that board's restore ran, or the fresh top-of-board position would overwrite it. A widget's ⋯ has **Move to another group** — a hover submenu shaped like Export (groups + widget counts, current one marked), offered only when there is somewhere else to go. |

## The AI assistant (`components/ai/AiAssistant.vue`)

**Grounded, no LLM.** `data/aiEngine.js` computes *every* number deterministically (z-score
anomalies, breach counts, deltas, chart breakdowns). Nothing is invented, so the panel degrades
cleanly with no model attached — a language model would only rephrase.

**The composer** has no inline form fields. There is one input at the bottom; everything types
there:
- The `+` button (or typing `/`) opens a compact **command palette** — icon + name only.
- Picking a command drops it in as a **chip**, swaps the placeholder to that command's, and
  opens its suggestions. Those suggestions **fade out the moment the user types their own
  prompt**. The palette and the suggestion list share **one** transitioned element so they stay
  mutually exclusive (two sibling `<transition>`s raced and could hang).
- An `awaiting` ref routes the next submitted message into a live creation step, and the
  placeholder speaks for that step.

**Every answer thinks, then streams.** `runThinking()` steps through grounded reasoning lines
(pending → spinner → check), then `streamText()` reveals prose word-by-word and `revealItems()`
staggers lists. All of it honours `prefers-reduced-motion` (skips straight to the result).

**Creation is intent-led, and it BUILDS before it administrates.** Describe what a dashboard is
*for*; the AI drafts a widget plan and **names it if you didn't**. Approving the draft creates the
board immediately (with defaults) and moves to filling it — a small palette shows the vocabulary
(Column · Bar · Line · Doughnut · KPI · Shortcut; tap one to hint a form), then you describe
widgets in the composer. **"That's everything"** navigates the canvas to the new board with the
panel still open and recaps what was built. Only *then* come the two things it can't infer —
category, then visibility — applied to the existing board.

**One message can build many widgets.** `splitWidgetRequests` splits on newlines, semicolons,
bullets and numbered markers always; commas and "and" **only** when a count was stated, because a
bare "and" is usually part of one phrase ("SLA breaches and overdue work"), not a list boundary.
Each widget is placed in sequence, labelled "n of m", with the add/finish pills only after the
last one.

**Form precedence is `item wording → batch preamble → palette hint → inferred`** (`formFor()`).
This matters because the splitter *strips the preamble* — so "add 4 KPIs: a; b; c; d" states the
form once, in the very text that gets removed. `explicitForm()` is read from the whole message and
carried across the batch; anything an item names itself still wins.

**`resolveWidget` (in `data/aiAssistant.js`) is what makes the output match the prompt.** It reads
the module, the conditions, the grouping dimension (with that dimension's *real* labels), the time
window and the form, then generates data shaped like the dimension — a priority split descends, a
month series trends, a team split is uneven — seeded from the text so the same sentence always
builds the same widget. Anything it genuinely can't infer comes back in `spec.missing`; the flow
**pauses and asks** (grouping is the usual one) rather than guessing, then resumes the queue.

**The panel reads the board you're actually on** (`aiBoard` in `DashboardView.vue` is a computed
over the live dashboard, not a fixed demo board). A newly created or empty board is summarised
honestly — "no widgets yet" — rather than borrowing another board's story.

**KPI values come from the condition, not a constant.** `KPI_SHAPE` in `data/aiAssistant.js` gives
overdue / SLA-breaching / unassigned / urgent / open / resolved their own plausible range, delta
direction and status, seeded from the text. Without this, four counters built in one batch all
read the same number.

**Two CTAs, board level and tile level.** Both the dashboard AI Insight card and every widget AI
insight card expose exactly **Deep dive** and **What needs attention** — nothing else.
`deepDiveBoard` / `deepDiveTile` / `focusBoard` / `focusTile` in `data/aiEngine.js` produce them, and
`chartShape()` normalises all 12 chart kinds into the shape those functions read (a spec-driven tile
has no `chart.series` to hand over). **Gauge tone comes from the band's colour, not its index** —
our bands are fractions with `higherIsBetter` already applied, so index-0-is-healthy would invert
every higher-is-better meter.

**Numbered next steps** appear only after a task that leaves a real decision (dashboard created,
widget added). Contextual **follow-ups** appear only on answers that invite a next question
(`FOLLOWUP_KINDS`). **Rate / copy** (`hasFeedback`) sit under every finished answer but never under
a question card or anything still awaiting input. Don't stack all three on one block.

## Sharing, Export, notes and dates

**There is no Share action.** Not on a dashboard, not on a widget. A board's audience IS
its access level (Public / Private / Restricted + technician/group targeting); the pill
beside the board title opens a read-only **"Shared with"** list. **Export** — in the board
header and in every widget's ⋯ — offers exactly **Image · PDF · Email as PDF**.

**Free Text is a NOTE, not a widget.** No header band, no title, no data, no time range,
no AI summary; the ⋯ floats on hover. Notes are not named — the title is derived from the
first line.

**The builder's Free Text field is a RICH-TEXT EDITOR** (`RichTextEditor.vue`, 2026-09-30,
built to the user's screenshots) and it is the ONLY Free Text configuration — the markdown
box, Formatting help, Preset and every presentation setting (font size, alignment,
vertical alignment, padding, font colour, background) were removed. The text area is
**300px** tall and a corner handle (the widgets' resize mark) drags it taller (300–900px).
Under it, the **formatting bar** — shown on **T** or any text selection, sitting directly
ABOVE the bottom bar with its menus opening upward: block style (Paragraph / Heading 1–3) ·
B I U · font size (Default, 8–72) · alignment (Left / Center / Right / Justify) ·
bulleted / numbered list · background colour · text colour (the 8×7 palette). Then the
**bottom bar**, always there: image · link · **T** · the character count. **Not** in it, by
the user's call: table, divider, attach, emoji, undo/redo, templates, knowledge, AI Assist. contenteditable +
execCommand, no dependency (on-prem). Toolbar buttons act on `mousedown.prevent` so they
never steal the selection; the link/image popovers save and restore the range. Paste is
plain text; the 600-character limit is enforced on input. An uploaded image is embedded
(PNG/JPG/GIF/WebP, ≤ 1 MB, as a data URL). Older notes stored as markdown are converted to HTML when
opened.

`toNoteHtml()` still takes HTML or markdown and **allowlist-sanitises** it (it goes out via
`v-html`). The allowlist now also keeps what the editor sets — H1–H4, HR, and a SPAN only as
a carrier for `font-size` (8–72px), `color` / `background-color` (hex or rgb only), plus
`text-align` on blocks; `<font color>` / `align=` are converted. Image `src` may be
http(s) or a `data:image/(png|jpeg|gif|webp)` URL — never SVG (it can carry script).

A note placed before this still carries `tile.ft` (resolved by `ftStyle()`); new notes get
the defaults, since the builder no longer offers those settings.

⚠️ `.note-body` headings size in **`em`, not px**: the widget sets its own base font size,
and pinned pixel headings rendered a `##` heading *smaller* than 16px body text.

**Dates resolve widget → group → dashboard**, most specific wins. A group header carries
its own date filter and every widget in it inherits that range unless the widget set its
own. All three pickers are the same component (`TimeRangePopover.vue`) reading the same
`data/timeRanges.js`, so a range cannot exist in one picker and not another.

## Locking rules (predefined content)

`data/chartTypes.js` and the store guards are authoritative — don't re-implement these:
- A **predefined dashboard**: can gain widgets and change category/layout, but not its Name,
  Description, or Visibility, and can't be archived/deleted.
- A **seeded tile** (`tile.seeded`) can't be removed. A predefined widget the *user* added can.
- A predefined **Bar/Column/Line** widget may switch among those three (Highlights editable only);
  a predefined **Pie/KPI/Shortcut** is fully frozen.
- Anything not predefined is fully editable.

## Gotchas that bite repeatedly

- A `<td>` set to `display:flex` **leaves the table layout** — it stops matching the row height and
  its `border-bottom` misaligns, breaking the row rule. Put flex on an **inner wrapper**, never the
  cell.
- Percentages on a truncated ("Top 10 of 63") chart must use the **pre-truncation denominator** —
  reporting "% of the shown 10" is a correctness bug, not polish.
- **Never `resize()` an ECharts instance on mount.** A resize re-lays-out the series and snaps a
  running entrance animation to its end state — the chart looks static with nothing in the build or
  DOM to explain why.
- **Verify UI changes in a real browser** — see the Playwright MCP note under Commands.
  Several bugs here (a self-deleting chip, a card-clipped popover, a broken row rule) were
  invisible to DOM inspection and to the build.
- **Two sibling `<transition>` elements toggled in the same tick can race** — both mount at once
  and a leave animation hangs with `enter-from` still applied, so the node never unmounts. If two
  popovers are mutually exclusive, render them through **one** transitioned element.
- **Legend click-to-toggle is universal.** `legendClickable` in `ChartTile.vue` is `true` for
  every chart; the `hidden`/`plotted` machinery already handles side (pie/donut) and bottom
  (cartesian) legends. Don't re-gate it by cardinality.
- **`tileFromText` must prefer the LONGEST title match.** With a plain `.find()`, "Open Requests
  By Priority" resolved to the *"Open Requests"* KPI and silently explained the wrong widget.
- **A fact passed to the drill needs a real `tileId`** — without it there's no widget to
  spotlight and the block renders empty.
- **Watch for CSS class collisions in `AiAssistant.vue`** — it's one large scoped stylesheet. A new
  `.fb` (feedback button) silently inherited the existing `.fb` (summary fact body, `flex: 1`) and
  stretched each icon to 147px. Grep the file for a class name before introducing it.
- **The batch preamble is stripped before items are resolved** — any instruction stated once for
  the whole message ("4 KPIs", "as shortcuts") must be captured from the *original* text, not from
  the split fragments.

## Handoff

Latest session state is in [HANDOFF.md](HANDOFF.md) — read it first.
