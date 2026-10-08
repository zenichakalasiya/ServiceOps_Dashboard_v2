# Handoff — 2026-10-08 14:58

## Read first

(This file is mirrored in `serviceops-dashboard-revamp/HANDOFF.md`. "The prototype CLAUDE.md"
below means `serviceops-dashboard-revamp/CLAUDE.md`.)

- The prototype CLAUDE.md → **"Iris — the second AI assistant"**. It explains the transplant
  architecture: generated `iris-core.js` / `iris.css`, and `host.js` as the only seam. Read it
  before touching anything under `src/iris/`.
- Its Key-files rows for **`DataModeSwitch.vue`**, **`RichTextEditor.vue`**, **`ColorPanel.vue`**
  and **`ChartLoader.vue`** (the `flow` variant). All four changed this stretch.
- `iris-build/README.md` (workspace root, NOT published): how Iris is regenerated.

All work is on branch `v2-main` and deploys with `git push v2 v2-main:main`
→ https://zenichakalasiya.github.io/ServiceOps_Dashboard_v2/

## What we worked on this session

1. **Iris.** A second AI assistant: the reference project's AI chat panel
   (kisu1311.github.io/dashboard-enhancement-ai-chat), replicated "same to same" but answering
   about ServiceOps data. It opens from a new sparkle tile at the top of the left rail.
2. A run of builder-sidebar and Free Text refinements.
3. A continuous chart loader.

## Completed

- **Iris phase 1** (`src/iris/`, deployed). The reference's own script, CSS and markup run
  inside our app.
  - **Matches the reference:** every measured element of the empty state matches it in
    position, size, font, weight, colour and radius, in light and dark.
  - **Answers from the board:** summarise, rank, attention, what changed and single-metric
    questions all use our real board data.
  - **Builds for real:**
    - Build widget (agentic) → Accept → a real tile on the board, with Undo.
    - Clarify flow (4 questions) → preview → Accept.
    - New dashboard: plan → approve → a real board, with Undo.
  - **Chrome:** history (dropdown and full list), rename/delete, the ⋯ menu, full screen,
    float drag (compacts), 8-way resize, dock-to-edge, @-mentions, suggestions, Auto, Stop,
    the out-of-scope answer and the Escape ladder.
  - **Fixes after review:** the dot-matrix "thinking" animation (it was frozen) and the rail
    tile (it showed a black square behind the star). Both now match the reference frame for
    frame.
- **The topbar Ask AI still opens the old `AiAssistant`.** Iris was added beside it as a new
  option, by the user's choice.
- **Chart Flow loader** (`ChartLoader.vue` `flow`): the same five charts as Chart Morph, each
  built out of the last.
- **Free Text editor:**
  - a colour picker (`ColorPanel.vue`) with Default · named colours · Custom, stored as theme
    tokens;
  - Default / Header layout cards inside the editor;
  - a 400px text area.
  - Also fixed: a Header note never spanned the row, and placed notes didn't fill their tile.
- **Builder "Data source"** (Manual / Query based): three demo designs (A cards, D banner,
  Black pill), switched from a dashed demo pill (`store.ui.modeUi`). The sidebar's segmented
  tracks became white-minimal.

## In progress

**New sidebar tabs from Figma, BLOCKED on access.** The user asked to implement the tabs in
Figma frame `pgE39fu3jbYtHGWus4NAWk` node `799-19166` ("Dashboard Widget Preview UI"):
- in the **builder configuration sidebar only**, replacing its segmented tracks
  (`WidgetBuilderModal.vue`, `.config` scope);
- and to **hide the three Data source demo designs** (`DataModeSwitch.vue` + the `.dm-demo`
  pill).

Nothing has been coded yet. Both Figma cloud connections answered "no edit access to this
file", and the Figma desktop connection timed out (the file was not open). Options offered to
the user: open the file in Figma desktop with the node selected, grant edit access, or paste
a screenshot.

The working reading of the request, still to be confirmed by the user:
- Manual / Query based stays, in the new tab style.
- The "Demo · switch UI" bar goes.

## Next steps

1. Get the Figma frame (desktop open / access / screenshot). Then implement the tabs in the
   builder sidebar, and replace the Data source demo with the same tabs.
2. **Iris phase 2:** make the widgets Iris builds match our real chart kinds and the Add
   Widget library (`IRIS.addWidget` in `src/iris/host.js`), then refine the remaining flows.
3. Optionally extend `rangeData.js` to spec-driven chart kinds (carried over from 09-29).
4. Carried over: "add several existing widgets to a group at once" is still at proposal stage
   (options A drawer tab / B selection mode). Waiting on the user's four questions.

## Decisions made

- **Iris is a transplant, not a rewrite.** The reference panel is ~5,400 lines of plain JS plus
  ~800 CSS rules. Rewriting it by eye would drift, so its own code runs as a classic script
  (its markup uses inline `onclick=`), with ObserveOps copy and host calls swapped in by
  exact-string edits.
- **Iris's tokens are re-homed** from `:root` onto the panel's roots, because their names
  (`--border`, `--ink`, `--sel`…) would overwrite ours. The values were read off the live
  reference.
- **User choices:**
  - Iris uses the same flows with ServiceOps data.
  - Iris keeps the same name and mark.
  - Iris is a new option, not a replacement.
  - It is delivered in phases.
- **Same as the reference, on purpose:**
  - the chat title follows the latest question until you rename it;
  - the `.aiq` query pills split per word while an answer types in.

## Gotchas & notes

- **Iris files are GENERATED.** `iris-core.js` and `iris.css` are built by
  `iris-build/build-core.js` / `build-css.js` (workspace root, not published). Change those,
  then rebuild. The build needs `iris-build/ref/`, a clone of the reference repo:
  `git clone --depth 1 https://github.com/kisu1311/dashboard-enhancement-ai-chat.git ref`.
  Delete it afterwards.
- **The CSS extractor must catch classes the reference builds in JS.** For example the
  dot-matrix's `aidpb`, which is defined in an object literal. Missing those is what froze the
  loader.
- **`#sbAI` (the rail tile) must NOT carry the full Iris token set.** It leaked `--ink` and
  `--sidebar` into our rail's hover. It gets only `--ai-2` / `--ai-soft`.
- **`.aisprk .aitrail` needs `fill:none`.** Without it the trail circle (r=29, bigger than the
  star) paints a black square.
- **`mountIris()` guards on `window.__irisMounted`, not a module variable.** A Vite hot reload
  re-runs `host.js`, and injecting the classic script twice throws "Identifier … has already
  been declared".
- **The reference's Escape ladder closes the whole panel** when a header menu is open. Tests
  that press Escape to dismiss a menu will close the chat.
- **Dev server:** port 5180 is often taken by another session, so it falls back to 5181.
