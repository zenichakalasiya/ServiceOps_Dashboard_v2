<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '../components/ui/Icon.vue'
import WidgetCard from '../components/dashboard/WidgetCard.vue'
import TimeFilter from '../components/dashboard/TimeFilter.vue'
import AutoRefresh from '../components/dashboard/AutoRefresh.vue'
import DashboardMenu from '../components/dashboard/DashboardMenu.vue'
import AddWidgetModal from '../components/dashboard/AddWidgetModal.vue'
import WidgetBuilderModal from '../components/dashboard/WidgetBuilderModal.vue'
import PresentMode from '../components/dashboard/PresentMode.vue'
import HistoryDialog from '../components/dashboard/HistoryDialog.vue'
import ExportDialog from '../components/dashboard/ExportDialog.vue'
import ScheduleDialog from '../components/dashboard/ScheduleDialog.vue'
import TimeRangePopover, { rectOf } from '../components/dashboard/TimeRangePopover.vue'
import GroupEditDrawer from '../components/dashboard/GroupEditDrawer.vue'
import EmptyGroupArt from '../components/ui/EmptyGroupArt.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { grpHeadVars, grpStyleOf } from '../data/groups.js'
import AiSummaryCard from '../components/ai/AiSummaryCard.vue'
import AiInsightChip from '../components/ai/AiInsightChip.vue'
import AiInsightCard from '../components/ai/AiInsightCard.vue'
import AiAssistant from '../components/ai/AiAssistant.vue'
import { demoBoard } from '../data/aiDemo.js'
import { store, byId, recordView, toggleFavorite, removeTile, toast } from '../store/index.js'
import { uid, ACCESS } from '../data/mock.js'
import { windowFor, relativeFor, stampFor } from '../data/timeRanges.js'
const route = useRoute()
const router = useRouter()

const d = computed(() => byId(route.params.id))
const edit = ref(route.query.edit === '1')
const dirty = ref(false)
const showAdd = ref(false)
const showSchedule = ref(false)
const showHistory = ref(false)
const showExport = ref(false)
// the "who can see this board" popover, opened from the access pill beside the title
const accessOpen = ref(false)
const descHover = ref(false)
const presenting = ref(false)
const loadingBoard = ref(true)
const revealing = ref(false)   // brief window after load → staggered widget reveal animation
const highlightId = ref(null)
const editTile = ref(null)   // tile currently open in the builder (edit mode)
const dupTile = ref(null)    // tile being duplicated (builder opens pre-filled, saves a copy)
const fabMenu = ref(false)   // FAB slide-up: Create Dashboard / Create Widget
const gridEl = ref(null)

// ---- drag-to-reorder / drag-into-group (armed from each card's 6-dot handle) ----
const dragArmed = ref(null)      // tile id currently draggable
/* How many named recipients a RESTRICTED board has. Public and Private have no list —
 * the access level IS the whole answer — which is why the pill only appears on a
 * Restricted board at all. */
const sharedCount = computed(() => (d.value?.techAccess || []).length + (d.value?.groupAccess || []).length)
const initials = (n) => String(n).trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
// access lives in the dashboard's own settings; this opens them rather than duplicating
// the fields into a second form that could disagree with the first
function editAccess() { store.ui.cloneTarget = null; store.ui.editTarget = d.value; store.ui.createOpen = true }

const dragId = ref(null)         // tile id being dragged
const dropGroup = ref(undefined) // group id currently hovered (undefined=none, null=ungrouped)
/* Layout Lock freezes position AND size. Guarding here rather than only hiding the
 * handles means a lock cannot be defeated by a stray drag that started before it. */
const layoutLocked = computed(() => d.value?.layoutLock === true)
function armDrag(t) { if (layoutLocked.value) return; dragArmed.value = t.id; window.addEventListener('mouseup', disarmOnce, { once: true }) }
function disarmOnce() { if (dragId.value == null) dragArmed.value = null }
function onDragStart(t) { dragId.value = t.id }
function onDragEnd() { dragArmed.value = null; dragId.value = null; dropGroup.value = undefined }
function onDropTile(target) {     // dropped onto another tile → reorder + adopt its group
  const arr = d.value.tiles
  const from = arr.findIndex((x) => x.id === dragId.value)
  if (from < 0 || arr[from].id === target.id) return
  const [m] = arr.splice(from, 1)
  m.group = target.group ?? null
  arr.splice(arr.findIndex((x) => x.id === target.id), 0, m)
  d.value.updated = new Date().toISOString(); dirty.value = true
}
function onDropGroup(gid) {        // dropped onto a section → move into that group (end)
  const arr = d.value.tiles
  const from = arr.findIndex((x) => x.id === dragId.value)
  if (from < 0) return
  const [m] = arr.splice(from, 1)
  m.group = gid
  arr.push(m)
  dropGroup.value = undefined
  d.value.updated = new Date().toISOString(); dirty.value = true
}

// ---- widget groups (Grafana-style collapsible rows) + pin ----
function tilesIn(gid) {
  const ids = new Set((d.value.groups || []).map((g) => g.id))
  return d.value.tiles
    .filter((t) => ((t.group && ids.has(t.group)) ? t.group : null) === gid)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))   // pinned float to top
}
const addToGroup = ref(null)   // group id a newly-added widget should land in
// A new group is just that group, empty. Widgets already on the board stay where they are,
// ungrouped — the user decides what goes in it (drag, + in its header, or Move to group).
function addGroup() {
  if (!d.value.groups) d.value.groups = []
  const g = { id: uid('g'), name: `New group ${d.value.groups.length + 1}`, collapsed: false, dateFilter: null }
  d.value.groups.push(g)
  dirty.value = true
  return g.id
}
// "Empty Group" card in the Add-Widget flow → make a genuinely empty group, then close.
function onNewGroup() {
  addGroup()
  showAdd.value = false; addToGroup.value = null
  toast('Empty group added — use its “Add widget” button to fill it', 'success')
}

// ---- Grouping-style DEMO switcher: compare the 5 designs live ----
const GSTYLES = [
  { id: 1, n: '①', label: 'Select', desc: 'Marquee-drag or Shift-click widgets, then Create group' },
  { id: 2, n: '②', label: 'Container', desc: 'Add an empty group from the toolbar, drag widgets in' },
  { id: 3, n: '③', label: 'Inline', desc: 'Hover a row gap for a "+ New group here" inserter' },
  { id: 4, n: '④', label: 'Add menu', desc: 'Create an Empty Group from the + (FAB) menu' },
  { id: 5, n: '⑤', label: 'Hybrid', desc: 'All of the above combined (recommended)' },
  { id: 6, n: '⑥', label: 'Right-click', desc: 'B — Right-click a widget → New group / Add to group ▸' },
  { id: 7, n: '⑦', label: 'Hover icon', desc: 'E — A group chip on each widget → New group / Add to group ▸' },
  { id: 8, n: '⑧', label: 'Sections', desc: 'F — Typed section headings; drag widgets under them' },
  { id: 9, n: '⑨', label: 'Auto-group', desc: 'G — Group automatically by Type or Source' },
]
const showGroupDemo = false   // grouping-options tabs removed; the 4 methods are always on
const gs = computed(() => store.ui.groupStyle)

// ---- Legend-strategy DEMO switcher.
// Hidden: ⑥ (rank pill + 8 inline + "+N more" + click-to-disable) is now THE legend,
// not one option among several — store.ui.legendStyle defaults to 6. Flip
// showLegendDemo back to true to compare ②/④/⑥ side by side again.
// See docs/legend-and-topn-design.md
const LSTYLES = [
  { id: 2, n: '②', label: 'Top-N + Other', desc: 'Bound the set, roll the tail into an explicit “Other”, and state the truncation on the tile. Percentages still use the full total.' },
  { id: 4, n: '④', label: 'Overflow chip', desc: 'Show 8 swatches inline; “+N more” reveals the rest in place. The cheapest option that still doesn’t lie.' },
  { id: 6, n: '⑥', label: 'Merged ② + ④', desc: 'Rank pill opens the filter (Top N · Bottom N · Custom range · Coverage % · All) and the series list for it; 8 series inline, and “+N more” reveals the rest — which switches the filter to All. Click any legend entry to disable it and pull its data out of the chart.' },
]
const showLegendDemo = false
const ls = computed(() => store.ui.legendStyle)

// ---- AI-insights PLACEMENT demo (for management): the three ways the entry point can live
// on the board. Switch it live from the lavender bar; the destination is always the same
// real assistant. A = header chip + popover · B = a card in the KPI row · C = the banner.
const PLACEMENTS = [
  { id: 'A', n: 'A', label: 'Header chip', desc: 'A small “✨ N” chip in the board header → popover with the summary + the 3 actions. Near-zero vertical cost; discovery rides on a compact chip.' },
  { id: 'B', n: 'B', label: 'KPI-row card', desc: 'A wide AI card living in the KPI row (summary + 3 actions), with the metric tiles beside it. Zero extra chrome — it’s already a tile.' },
  { id: 'C', n: 'C', label: 'Banner (baseline)', desc: 'Today’s collapsible “AI insights” banner above the grid. Most discoverable; costs the most height. This is what the other two try to beat.' },
]
const ap = computed(() => store.ui.aiPlacement)


// ---- AI: the Summary card is always upfront; every CTA opens the ServiceOps AI side panel.
// The AI reads the board you are ACTUALLY on. A dashboard the user just created has no
// canned story, so the engine summarises whatever it finds there (and says so when it's
// empty) rather than describing a demo board that isn't on screen.
const aiBoard = computed(() => d.value || demoBoard())
const aiRole = ref('technician')
const aiPanel = ref(null)
function openAi() { store.ui.aiPanelOpen = true }
// The card CTAs carry an explicit intent (summary / changes / analyzing / drill / explain)
// + a natural-language label, run directly rather than re-parsing the text.
function onCardAsk(intent, text) {
  store.ui.aiPanelOpen = true
  if (intent && intent !== 'open') nextTick(() => aiPanel.value?.trigger(intent, text))
}
// a widget can request an intent from anywhere; forward it into the panel
watch(() => store.ui.aiAsk, (a) => {
  if (!a) return
  store.ui.aiPanelOpen = true
  nextTick(() => { aiPanel.value?.trigger(a.intent, a.text); store.ui.aiAsk = null })
})
// The AI panel "spotlights" a widget by title while it narrates an Investigate — scroll to
// the matching tile on THIS board and flash it, so the answer points at the real widget
// instead of a table. Match by title (the demo board mirrors the live one).
watch(() => store.ui.aiHighlight, (title) => {
  if (!title) return
  const t = (d.value?.tiles || []).find((x) => x.title === title)
  store.ui.aiHighlight = null
  if (!t) return
  nextTick(() => {
    document.querySelector(`[data-tile="${t.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightId.value = t.id
    setTimeout(() => { if (highlightId.value === t.id) highlightId.value = null }, 2600)
  })
})
// Grouping is down to TWO methods: the persistent "New group" bar at the board's end,
// and the Add-New-Widget panel's Empty group. Marquee-drag and Shift-click
// select-to-group were removed: a press-and-drag on empty board space is too easy to do
// by accident, and it left dashed selection frames plus a "Create Group" bar on the
// board for something nobody meant to start. Right-click / hover-chip / sections /
// auto-group / inline row-inserters stay off. The machinery is left behind this flag.
const gUseMarquee = computed(() => false)
const gShowAddGroupBtn = computed(() => false)
const gShowInserters = computed(() => false)
const gShowRowInserters = computed(() => false)

// Detect the vertical gaps between ungrouped widget rows so an inline "+ New group here"
// inserter can appear on hover in each gap (no permanent CTA, zero upfront space).
const ugGridEl = ref(null)
const rowGaps = ref([])
function computeRowGaps() {
  rowGaps.value = []
  if (gs.value !== 3) return
  const grid = ugGridEl.value
  if (!grid) return
  const cells = [...grid.children].filter((c) => c.classList?.contains('cell'))
  if (!cells.length) return
  const rows = []
  cells.forEach((c) => {
    const top = c.offsetTop
    const row = rows.find((r) => Math.abs(r.top - top) < 8)
    if (row) row.bottom = Math.max(row.bottom, top + c.offsetHeight)
    else rows.push({ top, bottom: top + c.offsetHeight })
  })
  rows.sort((a, b) => a.top - b.top)
  const gaps = []
  for (let i = 0; i < rows.length - 1; i++) gaps.push(Math.round((rows[i].bottom + rows[i + 1].top) / 2))
  // guarantee a first-group entry point (bottom gap) when no groups exist yet
  if (!(d.value?.groups || []).length) gaps.push(Math.round(rows[rows.length - 1].bottom + 6))
  rowGaps.value = gaps
}
let ugRO
onMounted(() => {
  nextTick(computeRowGaps)
  ugRO = new ResizeObserver(() => computeRowGaps())
})
watch([gs, () => d.value?.tiles?.length, () => (d.value?.groups || []).length], () => nextTick(computeRowGaps))
watch(ugGridEl, (el) => { ugRO?.disconnect(); if (el) ugRO?.observe(el); nextTick(computeRowGaps) })
onBeforeUnmount(() => ugRO?.disconnect())
const gShowFabGroup = computed(() => false)       // sidebar Empty group covers this instead
// The "Tip: drag a box…" line was removed — marquee-select is discoverable by doing it,
// and a permanent instruction strip above the grid spends board height on something a
// user reads once. The flag stays so the toolbar's other demo hints keep their guard.
const gShowTip = computed(() => false)
const gShowEmptyGroupCta = computed(() => true)   // empty-state "or create a group"
const gRightClick = computed(() => false)
const gHoverIcon = computed(() => false)
const gSections = computed(() => false)
const gAutoBy = computed(() => false)

// ---- B & E: a per-tile group menu (New group / Add to group ▸ / Remove) ----
const tileMenu = ref({ open: false, tile: null, top: 0, left: 0 })
function openTileMenu(t, e) {
  e.preventDefault(); e.stopPropagation()
  tileMenu.value = { open: true, tile: t, top: Math.min(e.clientY, window.innerHeight - 240), left: Math.min(e.clientX, window.innerWidth - 220) }
}
function closeTileMenu() { tileMenu.value = { ...tileMenu.value, open: false } }
function onCellContext(t, e) { if (gRightClick.value) openTileMenu(t, e) }
function tileNewGroup(t) {
  if (!d.value.groups) d.value.groups = []
  const g = { id: uid('g'), name: `New group ${d.value.groups.length + 1}`, collapsed: false, dateFilter: null }
  d.value.groups.push(g); t.group = g.id
  editingGroup.value = g.id
  d.value.updated = new Date().toISOString(); dirty.value = true; closeTileMenu()
  toast(`Grouped “${t.title}”`, 'success')
}
function tileToGroup(t, gid) { t.group = gid; d.value.updated = new Date().toISOString(); dirty.value = true; closeTileMenu(); toast(`Moved “${t.title}”`, 'success') }
function tileUngroup(t) { t.group = null; d.value.updated = new Date().toISOString(); dirty.value = true; closeTileMenu() }

// ---- G: auto-group by attribute (read-only derived view) ----
const AUTO_ATTRS = {
  type: (t) => ({ kpi: 'KPIs', chart: 'Widgets', shortcut: 'Shortcuts' }[t.type] || 'Other'),
  source: (t) => ({ predefined: 'Predefined', user: 'User-defined', shared: 'Shared with me' }[t.prov || 'user']),
}
const autoBy = ref('none')
const AUTO_OPTS = [{ value: 'none', label: 'None' }, { value: 'type', label: 'Type' }, { value: 'source', label: 'Source' }]
const derivedGroups = computed(() => {
  if (!gAutoBy.value || autoBy.value === 'none') return null
  const fn = AUTO_ATTRS[autoBy.value], map = new Map()
  d.value.tiles.forEach((t) => { const k = fn(t); if (!map.has(k)) map.set(k, []); map.get(k).push(t) })
  return [...map.entries()].map(([name, tiles]) => ({ name, tiles }))
})

// ---- New group by direct MARQUEE drag (no CTA needed to start) ----
// Press-drag anywhere on the board (past a small threshold) to rubber-band a box over
// the placed widgets; on release a "Create group" CTA appears bottom-right to confirm.
const selecting = ref(false)          // marquee drag in progress
const groupPicks = ref(new Set())     // currently-boxed tile ids
const showGroupCta = ref(false)       // post-release confirm CTA
const marquee = ref({ active: false, l: 0, t: 0, w: 0, h: 0 })  // viewport coords (fixed overlay)
let mqPending = null, mqStart = null
// container-first: a labeled "Add group" makes an empty, collapsible group you fill later.
// Only that group — loose widgets are NOT gathered into a group of their own (removed
// 2026-09-24: the user found an uninvited "Helpdesk Overview" group confusing).
function insertEmptyGroup(i) {
  if (!d.value.groups) d.value.groups = []
  const g = { id: uid('g'), name: `New group ${d.value.groups.length + 1}`, collapsed: false, dateFilter: null }
  d.value.groups.splice(i, 0, g)
  d.value.updated = new Date().toISOString(); dirty.value = true
  editingGroup.value = g.id            // drop straight into rename
  return g.id
}
function addEmptyGroup() { insertEmptyGroup((d.value.groups || []).length); toast('Empty group added — drag widgets in, or use its “Add widget” button', 'success') }
function togglePick(id) {
  const s = new Set(groupPicks.value); s.has(id) ? s.delete(id) : s.add(id); groupPicks.value = s
  showGroupCta.value = groupPicks.value.size > 0
}
function boardMouseDown(e) {
  if (!gUseMarquee.value) return   // select-to-group only in styles ① and ⑤
  if (e.button !== 0) return
  if (e.target.closest('button, a, input, textarea, select, .draghandle, .note-lane, .resize, .grp-head')) return
  // Shift / Ctrl / ⌘ + click on an ungrouped tile toggles it into the selection
  const cell = e.target.closest('.cell[data-tile]')
  if ((e.shiftKey || e.ctrlKey || e.metaKey) && cell && !cell.closest('.group')) {
    togglePick(cell.getAttribute('data-tile')); e.preventDefault(); return
  }
  mqPending = { x: e.clientX, y: e.clientY }
  window.addEventListener('mousemove', mqPendingMove)
  window.addEventListener('mouseup', mqPendingUp)
}
function mqPendingMove(e) {
  if (!mqPending) return
  if (Math.abs(e.clientX - mqPending.x) < 5 && Math.abs(e.clientY - mqPending.y) < 5) return
  mqStart = mqPending; mqPending = null
  window.removeEventListener('mousemove', mqPendingMove)
  window.removeEventListener('mouseup', mqPendingUp)
  selecting.value = true; showGroupCta.value = false; groupPicks.value = new Set()
  marquee.value = { active: true, l: mqStart.x, t: mqStart.y, w: 0, h: 0 }
  window.addEventListener('mousemove', mqMove)
  window.addEventListener('mouseup', mqUp)
  mqMove(e)
}
function mqPendingUp() {
  window.removeEventListener('mousemove', mqPendingMove)
  window.removeEventListener('mouseup', mqPendingUp)
  mqPending = null
}
function mqMove(e) {
  const l = Math.min(mqStart.x, e.clientX), t = Math.min(mqStart.y, e.clientY)
  const w = Math.abs(e.clientX - mqStart.x), h = Math.abs(e.clientY - mqStart.y)
  marquee.value = { active: true, l, t, w, h }
  const box = { left: l, top: t, right: l + w, bottom: t + h }
  const s = new Set()
  gridEl.value?.querySelectorAll('.ug-wrap [data-tile]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (!(r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom)) s.add(el.getAttribute('data-tile'))
  })
  groupPicks.value = s
}
function mqUp() {
  window.removeEventListener('mousemove', mqMove)
  window.removeEventListener('mouseup', mqUp)
  selecting.value = false
  marquee.value = { ...marquee.value, active: false }
  if (groupPicks.value.size) showGroupCta.value = true
  else clearPicks()
}
function clearPicks() { groupPicks.value = new Set(); showGroupCta.value = false }
function createGroupFromPicks() {
  if (!groupPicks.value.size) { clearPicks(); return }
  if (!d.value.groups) d.value.groups = []
  const g = { id: uid('g'), name: `New group ${d.value.groups.length + 1}`, collapsed: false, dateFilter: null }
  d.value.groups.push(g)
  const n = groupPicks.value.size
  // remember each tile's previous group so the action can be undone cleanly
  const prev = d.value.tiles.filter((t) => groupPicks.value.has(t.id)).map((t) => ({ id: t.id, group: t.group ?? null }))
  prev.forEach((p) => { const t = d.value.tiles.find((x) => x.id === p.id); if (t) t.group = g.id })
  d.value.updated = new Date().toISOString(); dirty.value = true
  toast(`Grouped ${n} widget${n > 1 ? 's' : ''} — the rest stay on the dashboard`, 'success', {
    label: 'Undo',
    fn: () => {
      prev.forEach((p) => { const t = d.value.tiles.find((x) => x.id === p.id); if (t) t.group = p.group })
      d.value.groups = d.value.groups.filter((x) => x.id !== g.id)
      dirty.value = true
    },
  })
  clearPicks()
}
function addWidgetToGroup(gid) { addToGroup.value = gid; showAdd.value = true }
function ungroup(g) {
  const n = tilesIn(g.id).length
  d.value.tiles.forEach((t) => { if (t.group === g.id) t.group = null })
  d.value.groups = d.value.groups.filter((x) => x.id !== g.id)
  dirty.value = true
  toast(n ? `Ungrouped “${g.name}” — its ${n} widget${n === 1 ? '' : 's'} stay on the dashboard` : `Removed the empty group “${g.name}”`, 'success')
}

/* ── The group ⋯ menu: Edit · Clone · Ungroup · Delete ─────────────────────────────
 * Teleported and placed in viewport coords, like every other menu that sits inside a
 * card — the group's rounded body clips anything that tries to hang out of it. */
const gMenu = ref({ open: false, g: null, top: 0, left: 0 })
function openGroupMenu(g, e) {
  const r = e.currentTarget.getBoundingClientRect()
  /* Flips ABOVE the button when there is no room below. A group header near the foot of
     the viewport opened this downward, and the last item — Delete — landed off-screen. */
  const W = 188, H = 172, GAP = 6
  const top = window.innerHeight - r.bottom >= H + GAP ? r.bottom + GAP : Math.max(8, r.top - H - GAP)
  gMenu.value = { open: true, g, top, left: Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)) }
}
const closeGroupMenu = () => { gMenu.value = { ...gMenu.value, open: false } }
const editGroupTarget = ref(null)
function editGroup(g) { closeGroupMenu(); editGroupTarget.value = g }
/* A clone looks like its source — style, range and widgets are copied, not defaulted —
   and lands directly below it, so it is in view the moment it exists. The widgets are
   copies with fresh ids: a group of the SAME tiles would be one set of widgets in two
   places, and deleting either would take them from both. */
function cloneGroup(g) {
  closeGroupMenu()
  const names = new Set(d.value.groups.map((x) => x.name))
  let name = `Copy of ${g.name}`, n = 2
  while (names.has(name)) name = `Copy of ${g.name} (${n++})`
  const copy = { ...JSON.parse(JSON.stringify(g)), id: uid('g'), name, collapsed: false }
  d.value.groups.splice(d.value.groups.indexOf(g) + 1, 0, copy)
  const src = tilesIn(g.id)
  src.forEach((t) => d.value.tiles.push({ ...JSON.parse(JSON.stringify(t)), id: uid('t'), group: copy.id, seeded: false }))
  d.value.updated = new Date().toISOString(); dirty.value = true
  toast(`Cloned as “${name}” with ${src.length} widget${src.length === 1 ? '' : 's'}`, 'success')
}
function ungroupFromMenu(g) { closeGroupMenu(); ungroup(g) }
/* Delete takes the widgets WITH it — that is the difference from Ungroup, which keeps
   them. A seeded widget (shipped with a predefined board) cannot be removed, so it is
   released onto the board instead of deleted, and the toast says so rather than quietly
   doing less than asked. */
const delGroupTarget = ref(null)
function askDeleteGroup(g) { closeGroupMenu(); delGroupTarget.value = g }
function deleteGroup() {
  const g = delGroupTarget.value; delGroupTarget.value = null
  if (!g) return
  const inG = tilesIn(g.id)
  const kept = inG.filter((t) => t.seeded)
  kept.forEach((t) => { t.group = null })
  d.value.tiles = d.value.tiles.filter((t) => t.group !== g.id || t.seeded)
  d.value.groups = d.value.groups.filter((x) => x.id !== g.id)
  d.value.updated = new Date().toISOString(); dirty.value = true
  toast(kept.length
    ? `Deleted “${g.name}” — ${kept.length} predefined widget${kept.length === 1 ? '' : 's'} moved to the dashboard, the rest removed`
    : `Deleted “${g.name}” and its ${inG.length} widget${inG.length === 1 ? '' : 's'}`, 'success')
}

/* ── Sticky group headers: which one is stuck right now ─────────────────────────────
 * A header sticks 16px below the top of the scroller — the board's own side gutter, so a
 * stuck band sits in the same frame as everything else. While it is stuck the 16px above
 * it is filled with the board's white (`.grp-head.stuck::before`), otherwise the widgets
 * of that group would scroll through the gap. Only the stuck one gets the fill: at rest
 * the strip would lie over the gap between two groups. */
const STICK_GAP = 16
const stuckIds = ref(new Set())
let scroller = null
function markStuck() {
  if (!scroller) return
  const line = scroller.getBoundingClientRect().top + STICK_GAP
  const next = new Set()
  scroller.querySelectorAll('.group[data-gid]').forEach((sec) => {
    const r = sec.getBoundingClientRect()
    if (r.top < line - 0.5 && r.bottom > line) next.add(sec.dataset.gid)
  })
  const cur = stuckIds.value
  if (next.size !== cur.size || [...next].some((id) => !cur.has(id))) stuckIds.value = next
}
onMounted(() => {
  scroller = document.querySelector('.main')
  scroller?.addEventListener('scroll', markStuck, { passive: true })
  markStuck()
})
onBeforeUnmount(() => scroller?.removeEventListener('scroll', markStuck))

/* ── Group switcher (▾ beside a group's title) ───────────────────────────────────────
 * The header sticks, so the switcher is always one click away wherever you are in a long
 * board. It lists every group with its widget count and marks the one this header belongs
 * to; picking another GLIDES there — the target's header lands at the sticky line — and
 * its outline flashes once so the eye knows where it arrived. A collapsed target opens. */
const gSw = ref({ open: false, gid: null, top: 0, left: 0 })
const SW_W = 240
function openSwitcher(g, e) {
  const r = e.currentTarget.getBoundingClientRect()
  const rows = (d.value.groups || []).length
  const H = Math.min(320, 34 + rows * 34)
  const below = window.innerHeight - r.bottom >= H + 8
  gSw.value = {
    open: true, gid: g.id,
    top: below ? r.bottom + 6 : Math.max(8, r.top - H - 6),
    left: Math.max(8, Math.min(r.left + r.width / 2 - SW_W / 2, window.innerWidth - SW_W - 8)),
  }
}
const swGroups = computed(() => (d.value?.groups || []).map((g) => ({ id: g.id, name: g.name, n: tilesIn(g.id).length })))
const flashGid = ref(null)
let flashT = null
function jumpToGroup(id) {
  gSw.value = { ...gSw.value, open: false }
  const g = (d.value.groups || []).find((x) => x.id === id)
  if (!g) return
  if (g.collapsed) g.collapsed = false
  nextTick(() => {
    const sec = scroller?.querySelector(`.group[data-gid="${id}"]`)
    if (!sec || !scroller) return
    const y = scroller.scrollTop + sec.getBoundingClientRect().top - scroller.getBoundingClientRect().top - STICK_GAP
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' })
    clearTimeout(flashT); flashGid.value = null
    // flash once the glide has (about) landed, so the highlight is seen, not scrolled past
    flashT = setTimeout(() => { flashGid.value = id; flashT = setTimeout(() => { flashGid.value = null }, 1200) }, reduce ? 0 : 420)
  })
}

/* ── Reordering groups: drag a group by its header ──────────────────────────────────
 * Armed on a header mousedown that did not land on a button or the rename field, so the
 * collapse arrow, +, ⋯ and date still just click. While a GROUP
 * is in flight the section's own tile-drop highlight stays off. */
const gDragArmed = ref(null)
const dragGroupId = ref(null)
const dropBefore = ref(null)
function armGroupDrag(g) {
  gDragArmed.value = g.id
  window.addEventListener('mouseup', () => { if (!dragGroupId.value) gDragArmed.value = null }, { once: true })
}
function onGroupDragStart(g, e) {
  if (gDragArmed.value !== g.id) { e.preventDefault(); return }
  dragGroupId.value = g.id
  e.dataTransfer.effectAllowed = 'move'
}
function onGroupDragEnd() { dragGroupId.value = null; gDragArmed.value = null; dropBefore.value = null }
function onSectionDragOver(g) {
  if (dragGroupId.value) { dropBefore.value = dragGroupId.value === g.id ? null : g.id; return }
  dropGroup.value = g.id
}
function onSectionDrop(g) {
  if (!dragGroupId.value) { onDropGroup(g.id); return }
  const arr = d.value.groups
  const from = arr.findIndex((x) => x.id === dragGroupId.value)
  const to = arr.findIndex((x) => x.id === g.id)
  if (from >= 0 && to >= 0 && from !== to) {
    const [m] = arr.splice(from, 1)
    arr.splice(to, 0, m)
    d.value.updated = new Date().toISOString(); dirty.value = true
  }
  onGroupDragEnd()
}
const editingGroup = ref(null)

/* ── A group's date filter ─────────────────────────────────────────────────────────
 * Set once in the group header; every widget in that group reads it instead of the
 * dashboard's global filter. A widget that set its OWN range keeps it — the chain is
 * widget → group → dashboard, most specific wins — so turning a group filter on never
 * silently overwrites a range someone chose deliberately for one tile. WidgetCard
 * resolves that chain; this only owns the group's own value. */
const gdOpen = ref(null)      // id of the group whose picker is open
const gdRect = ref(null)
const gdGroup = computed(() => (d.value?.groups || []).find((g) => g.id === gdOpen.value) || null)
function toggleGroupDate(g, e) {
  if (gdOpen.value === g.id) { gdOpen.value = null; return }
  gdRect.value = rectOf(e.currentTarget)
  gdOpen.value = g.id
}
function pickGroupDate(range) {
  const g = gdGroup.value; if (!g) return
  g.dateFilter = range
  gdOpen.value = null; dirty.value = true
  toast(`“${g.name}” → ${range}`)
}
function clearGroupDate() {
  const g = gdGroup.value; if (!g) return
  g.dateFilter = null
  gdOpen.value = null; dirty.value = true
  toast(`“${g.name}” follows the dashboard filter`)
}
function groupDateTitle(g) {
  const n = tilesIn(g.id).length
  if (!g.dateFilter) return `Set one time range for all ${n} widget${n === 1 ? '' : 's'} in “${g.name}”`
  const { start, end } = windowFor(g.dateFilter)
  return `${stampFor(start)} → ${stampFor(end)}\nEvery widget in “${g.name}” reads this instead of the dashboard filter`
}
// how many widgets in this group opted out with a range of their own — the group note
// says so rather than claiming a reach it doesn't have
function ownDated(gid) { return tilesIn(gid).filter((t) => t.dateFilter).length }
/* The group header's Rearrange button is gone. It reset every widget in the group to
 * its default footprint and repacked them — an action whose result you could only judge
 * after it had already destroyed the layout you arranged by hand. Widgets are still
 * rearranged the direct way, by dragging them. `rearrangeTiles` is left in the store
 * (it takes a null groupId for the whole canvas) if it is ever wanted back. */
function onPin(t) { t.pinned = !t.pinned; d.value.updated = new Date().toISOString(); dirty.value = true; toast(t.pinned ? `Pinned “${t.title}”` : `Unpinned “${t.title}”`) }

/* ---- layout: the board's own value, else the GLOBAL one ----------------------
 * `dashboard.<field> ?? store.layout.<field>` — a board is "inherit" until somebody
 * deliberately overrides it in Edit Dashboard, so changing the global setting moves
 * every board that never opted out. Sizes are the guide's integer scale. */
const FONT_PX = { S: 12, M: 13, L: 15 }
// EVERY layout field resolves the same way, so "apply to this dashboard only" can write
// any of the editable ones and be honoured. cardPad and boardMargin go through here too
// even though the drawer no longer offers them: nothing writes them per-board, so they
// fall through to store.layout and stay uniform with the rest rather than being special.
const lay = (k, fallback) => d.value?.[k] ?? store.layout[fallback ?? k]
const boardVars = computed(() => ({
  '--tile-title': (FONT_PX[lay('headerFont', 'titleSize')] || 13) + 'px',
  // read by WidgetCard's .tbody
  '--tile-pad': lay('cardPad') + 'px',
}))
const gridStyle = computed(() => ({ columnGap: lay('hGap') + 'px', rowGap: lay('vGap') + 'px' }))
// the board's gutter against the app frame
const boardPad = computed(() => lay('boardMargin') + 'px')

// ---- per-tile size (default span/height) + drag-to-resize from bottom-right ----
function cellStyle(t) {
  const w = Math.min(12, Math.max(2, t.w || 3))
  const h = Math.max(1, t.h || 1)
  const base = lay('rowHeight')
  return { gridColumn: `span ${w}`, minHeight: (base + (h - 1) * 110) + 'px' }
}
let resizeCtx = null
function startResize(e, t) {
  if (layoutLocked.value) return
  const grid = gridEl.value; if (!grid) return
  const gap = 14, col = (grid.getBoundingClientRect().width - gap * 11) / 12
  resizeCtx = { t, startX: e.clientX, startY: e.clientY, w0: t.w || 3, h0: t.h || 1, col, gap }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeUp)
}
function onResizeMove(e) {
  if (!resizeCtx) return
  const { t, startX, startY, w0, h0, col, gap } = resizeCtx
  t.w = Math.min(12, Math.max(2, w0 + Math.round((e.clientX - startX) / (col + gap))))
  t.h = Math.min(4, Math.max(1, h0 + Math.round((e.clientY - startY) / 110)))
}
function onResizeUp() {
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeUp)
  if (resizeCtx) { d.value.updated = new Date().toISOString(); dirty.value = true; resizeCtx = null }
}

// derive the builder's `type` descriptor from an existing tile
/* A chart KIND is not a builder TYPE id, and conflating them was a real bug: kind
 * `bar` (a column chart) was landing on the builder's `bar` tab — which is the
 * *horizontal* bar — while `donut` and `area` matched no tab at all, so the builder
 * opened with nothing selected and a nonsense label. It went unnoticed because the
 * type tabs used to be disabled outright when editing.
 *
 * The ⋯ menu can also produce kinds the builder has no tab for (area, funnel,
 * pyramid); those fold into the nearest tab, and the tile's real kind is preserved
 * unless the user actually switches type. */
const KIND_TO_TYPE = {
  line: { id: 'line', label: 'Line' },
  area: { id: 'line', label: 'Line' },        // an area chart is a line with a fill
  hbar: { id: 'bar', label: 'Bar' },          // "Bar" = horizontal
  bar: { id: 'column', label: 'Column' },     // "Column" = vertical
  pie: { id: 'pie', label: 'Pie' },
  donut: { id: 'pie', label: 'Pie' },
  funnel: { id: 'pie', label: 'Pie' },
  pyramid: { id: 'pie', label: 'Pie' },
}
function typeForTile(t) {
  if (t.type === 'kpi') return { id: 'kpi', label: 'KPI', type: 'kpi', kind: null }
  if (t.type === 'shortcut') return { id: 'shortcut', label: 'Shortcut', type: 'shortcut', kind: null }
  // A note has no chart, so without this it fell through to the `|| 'bar'` below and
  // editing one opened the Column builder — a chart form over text content.
  if (t.type === 'text') return { id: 'text', label: 'Free Text', type: 'text', kind: null }
  const kind = t.chart?.kind || 'bar'
  const m = KIND_TO_TYPE[kind] || KIND_TO_TYPE.bar
  return { id: m.id, label: m.label, type: 'chart', kind }
}

// After a widget is created, smooth-scroll to it (it's appended last) + briefly highlight.
function onWidgetCreated(id) {
  showAdd.value = false
  nextTick(() => {
    const el = document.querySelector(`[data-tile="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightId.value = id
    setTimeout(() => { if (highlightId.value === id) highlightId.value = null }, 1800)
  })
}

// Loading + reveal + (for a brand-new empty board) auto-open Add-Widget.
// Runs on mount AND on every dashboard switch — the route component is reused across
// param changes, so onMounted alone wouldn't fire for a freshly-created board.
function loadBoard() {
  loadingBoard.value = true
  recordView(d.value)
  setTimeout(() => {
    loadingBoard.value = false
    revealing.value = true                              // widgets fade/slide in with staggered data
    setTimeout(() => (revealing.value = false), 1100)
    if (store.ui.pendingAddWidget) {                    // new empty board → slide Add-Widget in smoothly
      store.ui.pendingAddWidget = false; addToGroup.value = null
      setTimeout(() => (showAdd.value = true), 260)
    }
    focusPendingTile()
  }, 600)
}
onMounted(loadBoard)
watch(() => route.params.id, loadBoard)

/* Someone asked to be taken to a specific widget — from the "used on N dashboards"
 * badge in the Add-Widget library. The tile is matched by title+type, the same
 * identity the library uses. Run AFTER the skeleton, or we'd scroll to a widget
 * that isn't in the DOM yet. */
function focusPendingTile() {
  const f = store.ui.focusTile
  if (!f) return
  store.ui.focusTile = null
  const t = (d.value?.tiles || []).find((x) => x.title === f.title && x.type === f.type)
  if (!t) { toast(`“${f.title}” isn’t on this dashboard any more`, 'warn'); return }
  nextTick(() => {
    document.querySelector(`[data-tile="${t.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightId.value = t.id
    setTimeout(() => { if (highlightId.value === t.id) highlightId.value = null }, 2200)
  })
}
/* Jumping to a widget on the board you're ALREADY on never reloads, so the flag has
 * to be watched as well as read on load. But only act when the tile is actually here:
 * the flag is set before the route changes, so an unguarded watcher would fire while
 * still on the old board, find nothing, and clear the flag before the target board
 * ever got to consume it — which is exactly what it did. */
watch(() => store.ui.focusTile, (f) => {
  if (!f || loadingBoard.value) return
  const here = (d.value?.tiles || []).some((x) => x.title === f.title && x.type === f.type)
  if (here) focusPendingTile()
})

/* Manual refresh replays the whole entrance — skeleton, then the staggered reveal
 * with the charts drawing themselves in. An auto tick does not: it would strobe a
 * wallboard. There the spinner is the only signal, and the data updates in place. */
function onRefresh(isManual) { if (isManual) loadBoard() }

// ---- Undo / Redo (dashboard tiles + groups history) ----
const undoStack = ref([])
const redoStack = ref([])
let applyingHistory = false, lastBoardId = null
const boardSnap = () => JSON.stringify({ tiles: d.value?.tiles || [], groups: d.value?.groups || [] })
watch(boardSnap, (val, oldVal) => {
  if (applyingHistory) return
  // immediate:true → first call (setup) and any dashboard switch just (re)binds this board's history
  if (d.value?.id !== lastBoardId) { lastBoardId = d.value?.id; undoStack.value = []; redoStack.value = []; return }
  undoStack.value.push(oldVal)
  if (undoStack.value.length > 60) undoStack.value.shift()
  redoStack.value = []
}, { immediate: true })
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)
function applySnap(json) {
  const s = JSON.parse(json)
  applyingHistory = true
  d.value.tiles = s.tiles; d.value.groups = s.groups
  d.value.updated = new Date().toISOString(); dirty.value = true
  nextTick(() => { applyingHistory = false })
}
function undo() { if (!canUndo.value) return; redoStack.value.push(boardSnap()); applySnap(undoStack.value.pop()); toast('Undo') }
function redo() { if (!canRedo.value) return; undoStack.value.push(boardSnap()); applySnap(redoStack.value.pop()); toast('Redo') }
function onKey(e) {
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo() }
  else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function onRemove(t) { removeTile(d.value, t); dirty.value = true }
// Open the builder pre-filled with this tile, in edit mode (with live preview).
function onEditTile(t) { editTile.value = t }
function onTileSaved({ id, place }) {
  editTile.value = null
  toast('Widget updated', 'success')
  nextTick(() => {
    if (place) document.querySelector(`[data-tile="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightId.value = id
    setTimeout(() => { if (highlightId.value === id) highlightId.value = null }, 1500)
  })
}
// Duplicate → open the builder pre-filled with the tile so the user can reconfigure
// the copy's data, then clone it in place (inserted right after the original).
function onDuplicate(t) { dupTile.value = t }
function onTileDuplicated({ tile, afterId }) {
  const i = d.value.tiles.findIndex((x) => x.id === afterId)
  d.value.tiles.splice(i < 0 ? d.value.tiles.length : i + 1, 0, tile)
  d.value.updated = new Date().toISOString()
  dupTile.value = null
  dirty.value = true
  nextTick(() => {
    document.querySelector(`[data-tile="${tile.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightId.value = tile.id
    setTimeout(() => { if (highlightId.value === tile.id) highlightId.value = null }, 1500)
  })
  toast(`Duplicated “${tile.title}”`, 'success')
}
function saveEdit() { dirty.value = false; edit.value = false; toast('Layout saved', 'success') }
function discard() { if (dirty.value && !confirm('Discard unsaved changes?')) return; dirty.value = false; edit.value = false }
</script>

<template>
  <div v-if="d" class="board" :style="boardVars">
    <!-- Header -->
    <header class="bhead">
      <div class="bh-left">
        <!-- collapse / expand the listing sidebar, beside the title (image 1) -->
        <button class="listing-toggle" :title="store.ui.listingOpen ? 'Collapse dashboard listing' : 'Expand dashboard listing'"
          @click="store.ui.listingOpen = !store.ui.listingOpen">
          <Icon :name="store.ui.listingOpen ? 'panel-close' : 'panel-left'" :size="18" />
        </button>
        <button class="star" :class="{ on: d.favorite }" @click="toggleFavorite(d)"><Icon :name="d.favorite ? 'star-fill' : 'star'" :size="17" /></button>
        <div class="titles">
          <div class="t-row">
            <h1>{{ d.name }}</h1>
            <!-- description first, then what KIND of board this is — the same order the
                 widget info tooltip uses, so the two read the same way -->
            <!-- ONE card beside the title, holding everything the board is: its
                 description, what kind of board it is, and — on a Restricted board — who
                 it reaches. The audience used to live behind its own icon two positions
                 away, which made "what is this board" two hovers instead of one. -->
            <span class="dinfo" @mouseenter="descHover = true" @mouseleave="descHover = false">
              <Icon name="info" :size="15" />
              <transition name="fade">
                <span v-if="descHover" class="tt tt-stack dinfo-tt">
                  <span class="tt-desc">{{ d.description || 'No description has been added for this dashboard yet.' }}</span>
                  <span v-if="d.predefined || d.default" class="tt-tags">
                    <span v-if="d.predefined" class="tt-tag predefined">Predefined</span>
                    <span v-if="d.default" class="tt-tag def"><Icon name="default-home" :size="11" /> Default</span>
                  </span>
                  <!-- Restricted only: Public reaches everyone and Private reaches nobody,
                       so neither has a list worth naming. -->
                  <span v-if="d.access === 'restricted'" class="tt-acc">
                    <span class="tt-acc-h"><Icon name="users" :size="12" /> Shared with {{ sharedCount }}</span>
                    <span v-if="(d.groupAccess || []).length" class="tt-acc-row">{{ d.groupAccess.join(' · ') }}</span>
                    <span v-if="(d.techAccess || []).length" class="tt-acc-row">{{ d.techAccess.join(' · ') }}</span>
                    <span v-if="!sharedCount" class="tt-acc-row">Nobody added yet — only you can open it.</span>
                  </span>
                </span>
              </transition>
            </span>
          </div>
        </div>
      </div>
      <div class="bh-right">
        <!-- Undo/Redo are always present and disable when there is nothing to do, as the
             prototype has them. A control that appears only once it works moves every
             other button along with it, so the toolbar shifts under the pointer the
             first time you change anything. -->
        <div class="udr">
          <button class="udr-b" :disabled="!canUndo" @click="undo"><Icon name="undo" :size="17" /><span class="tt udr-tip">Undo <kbd>Ctrl + Z</kbd></span></button>
          <button class="udr-b" :disabled="!canRedo" @click="redo"><Icon name="redo" :size="17" /><span class="tt udr-tip">Redo <kbd>Ctrl + Y</kbd></span></button>
        </div>
        <TimeFilter />
        <AutoRefresh @refresh="onRefresh" />
        <!-- One button where Share and Download used to sit side by side. Both produced a
             file of this board; only the destination differed, and the split meant "email
             me a PDF" lived under Share while "save a PDF" lived under Download. -->
        <div class="pop-wrap">
          <button class="btn ico-only" :class="{ on: showExport }" @click.stop="showExport = !showExport" title="Export"><Icon name="export" :size="17" /></button>
          <ExportDialog v-if="showExport" :d="d" @close="showExport = false" />
        </div>
        <!-- A: the AI-insights chip lives in the header, immediately left of the ⋯ menu -->
        <AiInsightChip v-if="!loadingBoard && ap === 'A'" :board="aiBoard" @ask="onCardAsk" />
        <DashboardMenu :d="d" align="right" toolbar @present="presenting = true" @schedule="showSchedule = true" @history="showHistory = true" />
      </div>
    </header>

    <!-- Edit banner (unsaved-changes guard, P2·4) -->
    <transition name="fade">
      <div v-if="edit" class="editbar">
        <Icon name="edit" :size="15" /> <b>Editing</b> — drag, add or remove tiles.
        <span v-if="dirty" class="unsaved">● Unsaved changes</span>
        <div class="grow" />
        <button class="btn btn-sm" @click="discard">Discard</button>
        <button class="btn btn-sm btn-primary" @click="saveEdit"><Icon name="check" :size="14" /> Save</button>
      </div>
    </transition>

    <!-- Body -->
    <div class="bbody" :style="{ paddingLeft: boardPad, paddingRight: boardPad, paddingTop: boardPad }">
      <!-- DEMO: switch between the 5 grouping designs to compare them live (hidden — default is ① Select) -->
      <div v-if="showGroupDemo && !loadingBoard" class="gstyle-bar">
        <span class="gsb-label"><Icon name="template" :size="14" /> Grouping demo</span>
        <div class="gsb-seg">
          <button v-for="s in GSTYLES" :key="s.id" class="gsb-b" :class="{ on: gs === s.id }" :title="s.desc" @click="store.ui.groupStyle = s.id">
            <span class="gsb-n">{{ s.n }}</span> {{ s.label }}
          </button>
        </div>
        <span class="gsb-desc">{{ GSTYLES.find(s => s.id === gs)?.desc }}</span>
      </div>

      <!-- DEMO: the 5 ways to handle a high-cardinality legend. Affects "Tickets by Technician" (63 values). -->
      <div v-if="showLegendDemo && !loadingBoard" class="gstyle-bar legend-bar">
        <span class="gsb-label"><Icon name="chart-pie" :size="14" /> Legend demo <em>63-category chart</em></span>
        <div class="gsb-seg">
          <button v-for="s in LSTYLES" :key="s.id" class="gsb-b" :class="{ on: ls === s.id }" :title="s.desc" @click="store.ui.legendStyle = s.id">
            <span class="gsb-n">{{ s.n }}</span> {{ s.label }}
          </button>
        </div>
        <span class="gsb-desc">{{ LSTYLES.find(s => s.id === ls)?.desc }}</span>
      </div>

      <!-- The AI-insights entry point defaults to placement A (a compact header chip). The
           A/B/C switcher bar has been removed from the board; the destination is the same
           real assistant regardless of which placement is set. -->

      <!-- C (baseline): the collapsible "AI insights" banner, upfront above the grid. Shown
           even on an empty board — a just-created dashboard still needs the AI entry point,
           and the card says plainly there's nothing to read yet. -->
      <AiSummaryCard v-if="!loadingBoard && ap === 'C'" :board="aiBoard" @ask="onCardAsk" />

      <!-- loading skeleton (P2·9) -->
      <div v-if="loadingBoard" class="grid">
        <div v-for="n in 6" :key="n" class="card sk" :class="n <= 4 ? 'span-3' : 'span-6'"><div class="skeleton" style="height:100%" /></div>
      </div>

      <!-- empty state → template gallery (P2·9, P3·tour, ClickUp pattern) -->
      <div v-else-if="!d.tiles.length && !(d.groups && d.groups.length)" class="empty">
        <div class="empty-ill">
          <span class="ei ei-chart"><Icon name="chart-bar" :size="26" /></span>
          <span class="ei ei-kpi"><Icon name="kpi" :size="22" /></span>
          <span class="ei ei-tbl"><Icon name="table" :size="22" /></span>
        </div>
        <h3>Your dashboard is empty</h3>
        <p>Add a <b>Widget</b>, <b>KPI</b> or <b>Shortcut</b> to start visualizing your data.</p>
        <div class="empty-cta">
          <button class="btn btn-primary big-cta" @click="showAdd = true"><Icon name="plus" :size="17" /> Add Widget</button>
          <button v-if="gShowEmptyGroupCta" class="btn big-cta ghost" @click="addEmptyGroup"><Icon name="new-group" :size="16" /> or create a group</button>
        </div>
      </div>

      <!-- tiles (ungrouped + collapsible groups) — drag a box anywhere to marquee-select -->
      <div v-else class="board-groups" ref="gridEl" :class="{ selecting, revealing }" @mousedown="boardMouseDown">
        <div v-if="gShowTip || gShowAddGroupBtn || gRightClick || gHoverIcon || gAutoBy" class="bg-toolbar">
          <span v-if="gRightClick" class="bg-hint">Right-click any widget → New group / Add to group</span>
          <span v-if="gHoverIcon" class="bg-hint">Hover a widget and click its ⊞ chip → New group / Add to group</span>
          <template v-if="gAutoBy">
            <span class="bg-hint">Auto-group by</span>
            <div class="auto-seg">
              <button v-for="o in AUTO_OPTS" :key="o.value" class="auto-b" :class="{ on: autoBy === o.value }" @click="autoBy = o.value">{{ o.label }}</button>
            </div>
          </template>
          <button v-if="gShowAddGroupBtn" class="add-group" @click="addEmptyGroup"><Icon name="new-group" :size="15" /> Add group</button>
        </div>

        <!-- G: auto-grouped, read-only derived sections -->
        <template v-if="gAutoBy && derivedGroups">
          <section v-for="grp in derivedGroups" :key="grp.name" class="group as-section">
            <header class="grp-head"><Icon name="template" :size="15" class="sec-ic" /><b class="grp-name">{{ grp.name }}</b><span class="grp-count">{{ grp.tiles.length }}</span></header>
            <div class="grid" :style="gridStyle">
              <div v-for="t in grp.tiles" :key="t.id" :data-tile="t.id" class="cell" :style="cellStyle(t)">
                <WidgetCard :tile="t" :edit="edit" @remove="onRemove" @edit="onEditTile" @duplicate="onDuplicate" @pin="onPin" @armdrag="armDrag" />
              </div>
            </div>
          </section>
        </template>

        <template v-else>
        <!-- ungrouped (inline style overlays a hover "+ New group here" inserter in each row gap) -->
        <div v-if="tilesIn(null).length" class="ug-wrap">
          <div class="grid" ref="ugGridEl" :style="gridStyle" :class="{ 'drop-into': dropGroup === null }"
            @dragover.prevent="dropGroup = null" @drop="onDropGroup(null)">
            <!-- B: a wide AI card takes the first slot of the KPI row; the metric tiles flow beside it -->
            <div v-if="ap === 'B'" class="cell ai-cell">
              <AiInsightCard :board="aiBoard" @ask="onCardAsk" />
            </div>
            <div v-for="t in tilesIn(null)" :key="t.id" :data-tile="t.id" class="cell"
              :class="{ flash: highlightId === t.id, dragging: dragId === t.id, 'pick-on': groupPicks.has(t.id) }" :style="cellStyle(t)" :draggable="dragArmed === t.id && !selecting"
              @dragstart="onDragStart(t)" @dragend="onDragEnd" @dragover.prevent @drop.stop.prevent="onDropTile(t)" @contextmenu="onCellContext(t, $event)">
              <WidgetCard :tile="t" :edit="edit" @remove="onRemove" @edit="onEditTile" @duplicate="onDuplicate" @pin="onPin" @armdrag="armDrag" />
              <span v-if="!layoutLocked" class="resize" title="Drag to resize" @mousedown.stop.prevent="startResize($event, t)" />
              <button v-if="gHoverIcon" class="cell-grp-chip" title="Group this widget" @click.stop="openTileMenu(t, $event)"><Icon name="new-group" :size="13" /> Group</button>
            </div>
          </div>
          <!-- inline: hover a row gap to reveal a "+ New group here" inserter -->
          <template v-if="gShowRowInserters">
            <div v-for="(y, i) in rowGaps" :key="'rg' + i" class="row-insert" :style="{ top: y + 'px' }" @click.stop="addEmptyGroup">
              <span class="gi-line" /><span class="gi-btn"><Icon name="new-group" :size="13" /> New group here</span><span class="gi-line" />
            </div>
          </template>
        </div>

        <!-- groups (each preceded by a hover-reveal "+ New group here" inserter) -->
        <template v-for="(g, gi) in (d.groups || [])" :key="g.id">
        <div v-if="gShowInserters" class="grp-insert" @click.stop="insertEmptyGroup(gi)"><span class="gi-line" /><span class="gi-btn"><Icon name="new-group" :size="13" /> New group here</span><span class="gi-line" /></div>
        <section
          class="group"
          :class="{
            'drop-into': dropGroup === g.id && !dragGroupId, 'as-section': gSections, collapsed: g.collapsed,
            'no-pad': grpStyleOf(g).pad === false, 'g-drop-before': dropBefore === g.id, 'g-dragging': dragGroupId === g.id,
            'g-flash': flashGid === g.id,
          }"
          :style="grpHeadVars(g)" :data-gid="g.id"
          @dragover.prevent="onSectionDragOver(g)" @drop="onSectionDrop(g)"
        >
          <!-- The header is a BAND on the widget header's own colour (unless the group sets
               another), with three zones: collapse on the left, the title — centred by
               default — and the actions on the right. The title sits in its own middle
               column, so centring it means the middle of the BAND, not the middle of
               whatever space the two side clusters happen to leave.
               The header itself is the drag handle (grab cursor); a press on a control
               or the rename field never arms it. The style vars live on the section. -->
          <header
            class="grp-head" :class="{ 'gh-left-align': grpStyleOf(g).align === 'left', 'acting': gMenu.open && gMenu.g === g, stuck: stuckIds.has(g.id) }"
            :draggable="gDragArmed === g.id"
            @mousedown="!$event.target.closest('button, input') && armGroupDrag(g)"
            @dragstart="onGroupDragStart(g, $event)" @dragend="onGroupDragEnd"
          >
            <div class="gh-l">
              <button class="gh-tog" :title="g.collapsed ? 'Expand this group' : 'Collapse this group'" @click="g.collapsed = !g.collapsed">
                <Icon :name="g.collapsed ? 'chevron-right' : 'chevron-down'" :size="16" />
              </button>
            </div>
            <div class="gh-t">
              <!-- focused on mount: a new group opens straight into rename, and an input
                   that never takes focus can never blur — it sat in edit mode forever -->
              <input
                v-if="editingGroup === g.id" class="grp-name-input" v-model="g.name"
                @vue:mounted="({ el }) => { el.focus(); el.select() }"
                @blur="editingGroup = null" @keyup.enter="editingGroup = null" @keyup.esc="editingGroup = null"
              />
              <b v-else class="grp-name" title="Rename group" @click="editingGroup = g.id">{{ g.name }}</b>
              <span v-if="grpStyleOf(g).share === 'private'" class="gh-lock" title="Private group — only you can see it"><Icon name="lock" :size="12" /></span>
              <!-- the switcher: ▾ and where this group sits in the board (2/5) -->
              <button
                v-if="(d.groups || []).length > 1" class="gh-sw" :class="{ on: gSw.open && gSw.gid === g.id }"
                title="Switch to another group" @click.stop="openSwitcher(g, $event)"
              >
                <Icon name="chevron-down" :size="14" />
                <span class="gh-pos">{{ d.groups.indexOf(g) + 1 }}/{{ d.groups.length }}</span>
              </button>
            </div>
            <div class="gh-r">
              <!-- The group's own time range. Set once here, every widget in the group reads
                   it instead of the dashboard filter; a widget can still opt out with its
                   own calendar. It stays visible when SET — it reports a state — and joins
                   the hover actions when not. -->
              <!-- Only when the group's configuration SETS a range — the same rule as a
                   widget's calendar. It is set in Edit group; a click here still opens
                   the picker to change or clear it. -->
              <button
                v-if="g.dateFilter" class="gh-act gh-date on"
                @click.stop="toggleGroupDate(g, $event)" :title="groupDateTitle(g)"
              ><Icon name="calendar" :size="13" /></button>
              <button class="gh-act gh-hov" title="Add a widget to this group" @click="addWidgetToGroup(g.id)"><Icon name="plus" :size="16" /></button>
              <button class="gh-act gh-hov" title="Group actions" @click.stop="openGroupMenu(g, $event)"><Icon name="dots-v" :size="16" /></button>
            </div>
          </header>
          <!-- the one-liner: what the range above actually does to the widgets below it -->
          <div v-if="!g.collapsed" class="grp-body">
          <p v-if="g.dateFilter" class="grp-date-note">
            <Icon name="info" :size="13" />
            All {{ tilesIn(g.id).length }} widget{{ tilesIn(g.id).length === 1 ? '' : 's' }} in
            “{{ g.name }}” use <b>{{ g.dateFilter }}</b> instead of the dashboard filter<template v-if="ownDated(g.id)">, except {{ ownDated(g.id) }} on {{ ownDated(g.id) === 1 ? 'its' : 'their' }} own range</template>.
          </p>
          <div class="grid" :style="gridStyle">
            <div v-for="t in tilesIn(g.id)" :key="t.id" :data-tile="t.id" class="cell"
              :class="{ flash: highlightId === t.id, dragging: dragId === t.id }" :style="cellStyle(t)" :draggable="dragArmed === t.id"
              @dragstart="onDragStart(t)" @dragend="onDragEnd" @dragover.prevent @drop.stop.prevent="onDropTile(t)" @contextmenu="onCellContext(t, $event)">
              <!-- `group` is what lets the tile inherit this group's date filter -->
              <WidgetCard :tile="t" :edit="edit" :group="g" @remove="onRemove" @edit="onEditTile" @duplicate="onDuplicate" @pin="onPin" @armdrag="armDrag" />
              <span v-if="!layoutLocked" class="resize" title="Drag to resize" @mousedown.stop.prevent="startResize($event, t)" />
              <button v-if="gHoverIcon" class="cell-grp-chip" title="Group this widget" @click.stop="openTileMenu(t, $event)"><Icon name="new-group" :size="13" /> Group</button>
            </div>
            <!-- An empty group is a drop well that says what it is for: the product's
                 empty-state pattern (grey disc · one grey line · a secondary CTA), minus
                 the title — the group header right above already names the thing. The
                 well keeps a widget row's worth of height so a drag has a real target. -->
            <div v-if="!tilesIn(g.id).length" class="grp-empty" :style="{ minHeight: Math.round(lay('rowHeight') * 0.6) + 'px' }">
              <EmptyGroupArt class="ge-art" :width="132" />
              <p class="ge-sub">No widgets yet — drag one here, or add a widget.</p>
              <button class="btn btn-sm" @click="addWidgetToGroup(g.id)"><Icon name="plus" :size="14" /> Add widget</button>
            </div>
          </div>
          </div>
        </section>
        </template>
        <div v-if="gShowInserters && (d.groups || []).length" class="grp-insert" @click.stop="insertEmptyGroup((d.groups || []).length)"><span class="gi-line" /><span class="gi-btn"><Icon name="new-group" :size="13" /> New group here</span><span class="gi-line" /></div>
        <!-- F: a slim full-width "+ New section" bar (sections are typed headings) -->
        <button v-if="gSections" class="new-section-bar" @click="addEmptyGroup"><Icon name="new-group" :size="15" /> New section</button>
        <!-- No standing "New Group" panel at the board's end — a group is created from
             the Add Widget drawer's Empty Group card. -->
        </template>
      </div>
    </div>

    <!-- a group's ⋯ menu — Edit · Clone · Ungroup, then Delete apart, as the reference
         orders it: the destructive action sits under a rule so it is never the one your
         pointer lands on by moving down the list -->
    <teleport to="body">
      <div v-if="gMenu.open" class="backdrop" @click="closeGroupMenu" />
      <div v-if="gMenu.open" class="menu grp-menu" :style="{ top: gMenu.top + 'px', left: gMenu.left + 'px' }" @click.stop>
        <button class="menu-item" @click="editGroup(gMenu.g)"><Icon name="edit" :size="15" /> Edit group</button>
        <button class="menu-item" @click="cloneGroup(gMenu.g)"><Icon name="copy" :size="15" /> Clone group</button>
        <button class="menu-item" @click="ungroupFromMenu(gMenu.g)"><Icon name="ungroup" :size="15" /> Ungroup</button>
        <div class="menu-sep" />
        <button class="menu-item danger" @click="askDeleteGroup(gMenu.g)"><Icon name="trash" :size="15" /> Delete group</button>
      </div>
    </teleport>
    <!-- group switcher — every group with its widget count, this header's own marked -->
    <teleport to="body">
      <div v-if="gSw.open" class="backdrop" @click="gSw = { ...gSw, open: false }" />
      <transition name="pop">
        <div v-if="gSw.open" class="menu gsw-pop" :style="{ top: gSw.top + 'px', left: gSw.left + 'px', width: SW_W + 'px' }" @click.stop>
          <div class="menu-label">Jump to group</div>
          <button
            v-for="s in swGroups" :key="s.id" class="menu-item gsw-row" :class="{ cur: s.id === gSw.gid }"
            @click="s.id === gSw.gid ? (gSw = { ...gSw, open: false }) : jumpToGroup(s.id)"
          >
            <span class="gsw-dot" />
            <span class="gsw-nm">{{ s.name }}</span>
            <span class="gsw-n">{{ s.n }}</span>
          </button>
        </div>
      </transition>
    </teleport>
    <GroupEditDrawer v-if="editGroupTarget" :group="editGroupTarget" @close="editGroupTarget = null; dirty = true" />
    <ConfirmDialog
      v-if="delGroupTarget"
      title="Delete this group?"
      :target="delGroupTarget.name"
      :message="`and the ${tilesIn(delGroupTarget.id).length} widget${tilesIn(delGroupTarget.id).length === 1 ? '' : 's'} in it will be removed from this dashboard. To keep the widgets, use Ungroup instead.`"
      confirm-label="Delete group"
      @confirm="deleteGroup" @cancel="delGroupTarget = null"
    />

    <!-- per-tile group menu (B: right-click · E: hover chip) -->
    <teleport to="body">
      <div v-if="tileMenu.open" class="backdrop" @click="closeTileMenu" />
      <transition name="pop">
        <div v-if="tileMenu.open" class="menu tile-grp-menu" :style="{ top: tileMenu.top + 'px', left: tileMenu.left + 'px' }" @click.stop>
          <button class="menu-item" @click="tileNewGroup(tileMenu.tile)"><Icon name="new-group" :size="15" /> New group with this</button>
          <template v-if="(d.groups || []).length">
            <div class="menu-sep" />
            <div class="menu-label">Add to group</div>
            <button v-for="g in d.groups" :key="g.id" class="menu-item" @click="tileToGroup(tileMenu.tile, g.id)"><Icon name="folder" :size="15" /> {{ g.name }}</button>
          </template>
          <template v-if="tileMenu.tile && tileMenu.tile.group">
            <div class="menu-sep" />
            <button class="menu-item danger" @click="tileUngroup(tileMenu.tile)"><Icon name="ungroup" :size="15" /> Remove from group</button>
          </template>
        </div>
      </transition>
    </teleport>

    <!-- rubber-band selection rectangle (fixed to viewport) -->
    <teleport to="body">
      <div v-if="marquee.active" class="marquee" :style="{ left: marquee.l + 'px', top: marquee.t + 'px', width: marquee.w + 'px', height: marquee.h + 'px' }" />
    </teleport>

    <!-- post-release confirm CTA (bottom-right) → convert the selected widgets into a group -->
    <teleport to="body">
      <transition name="fabpop">
        <div v-if="showGroupCta && groupPicks.size" class="group-cta">
          <span class="gc-count">{{ groupPicks.size }} widget{{ groupPicks.size > 1 ? 's' : '' }} selected</span>
          <button class="btn btn-sm btn-primary" @click="createGroupFromPicks">Create Group</button>
          <button class="btn btn-sm" @click="clearPicks">Cancel</button>
        </div>
      </transition>
    </teleport>

    <!-- Floating Add FAB (bottom-right) → slide-up: Create Dashboard / Create Widget -->
    <div class="fab-wrap">
      <div v-if="fabMenu" class="fab-backdrop" @click="fabMenu = false" />
      <transition name="fabpop">
        <div v-if="fabMenu" class="fab-menu">
          <!-- Generate with AI — the first, primary CTA (the full conversational create flow) -->
          <!-- 2026-09-24 Figma: compact outlined pills, a small glyph inline, no coloured
               discs and no separator; AI keeps its gradient edge and violet label -->
          <button class="fab-opt ai" @click="fabMenu = false; onCardAsk('createstart', 'Generate with AI')">
            <Icon name="sparkles" :size="18" /> Generate With AI
          </button>
          <button class="fab-opt" @click="fabMenu = false; store.ui.cloneTarget = null; store.ui.editTarget = null; store.ui.createOpen = true">
            <Icon name="layout" :size="18" /> Create Dashboard
          </button>
          <button class="fab-opt" @click="fabMenu = false; addToGroup = null; showAdd = true">
            <Icon name="chart-bar" :size="18" /> Create Widget
          </button>
          <button v-if="gShowFabGroup" class="fab-opt" @click="fabMenu = false; addEmptyGroup()">
            <Icon name="new-group" :size="18" /> Empty Group
          </button>
        </div>
      </transition>
      <button class="fab" :class="{ on: fabMenu }" @click="fabMenu = !fabMenu" :title="fabMenu ? 'Close' : 'Add'" aria-label="Add">
        <Icon :name="fabMenu ? 'x' : 'plus'" :size="22" />
      </button>
    </div>

    <!-- the docked assistant panel — the shared destination every entry opens into -->
    <teleport to="body">
      <transition name="ai-slide">
        <div v-if="store.ui.aiPanelOpen" class="ai-dock">
          <AiAssistant ref="aiPanel" :board="aiBoard" :role="aiRole" :open="store.ui.aiPanelOpen"
            @update:open="store.ui.aiPanelOpen = $event" @role="aiRole = $event" />
        </div>
      </transition>
    </teleport>

    <!-- a group's time range — the same picker a widget and the topbar open -->
    <TimeRangePopover
      v-if="gdOpen && gdGroup" :value="gdGroup.dateFilter" :rect="gdRect"
      :follow-label="gdGroup.dateFilter ? 'Follow dashboard filter' : null"
      :note="`Applies to all ${tilesIn(gdGroup.id).length} widget${tilesIn(gdGroup.id).length === 1 ? '' : 's'} in “${gdGroup.name}”. A widget with its own range keeps it.`"
      @pick="pickGroupDate" @clear="clearGroupDate" @close="gdOpen = null"
    />

    <AddWidgetModal v-if="showAdd" :d="d" :group="addToGroup" @close="showAdd = false; addToGroup = null" @created="onWidgetCreated" @newgroup="onNewGroup" />
    <WidgetBuilderModal v-if="editTile" :d="d" :type="typeForTile(editTile)" :existing="editTile" @close="editTile = null" @saved="onTileSaved" />
    <!-- Duplicate: builder pre-filled with the tile; save creates a new copy in place -->
    <WidgetBuilderModal v-if="dupTile" :d="d" :type="typeForTile(dupTile)" :existing="dupTile" :duplicate="true" @close="dupTile = null" @duplicated="onTileDuplicated" />
    <ScheduleDialog v-if="showSchedule" :d="d" @close="showSchedule = false" />
    <HistoryDialog v-if="showHistory" :d="d" @close="showHistory = false" />
    <PresentMode v-if="presenting" :start-id="d.id" @close="presenting = false" />
  </div>

  <div v-else class="missing">
    <Icon name="search" :size="28" class="muted" />
    <p>Dashboard not found.</p>
    <button class="btn" @click="router.push('/dashboards')">Back to Discover</button>
  </div>
</template>

<style scoped>
.board { display: flex; flex-direction: column; min-height: 100%; }
/* 16px sides, not 24. The BODY below takes its side padding inline from the board-margin
   setting (16px by default), so a 24px header put the board title 8px left of the widgets
   it belongs to — the one edge in the view where two stacked regions did not line up. */
.bhead { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px; background: var(--surface); border-bottom: 1px solid var(--border); flex-wrap: nowrap; }
.bh-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.listing-toggle { width: 34px; height: 32px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); border-radius: 4px; display: grid; place-items: center; flex: none; }
.listing-toggle:hover { background: var(--surface-2); color: var(--ink); border-color: var(--border-strong); }
.star { width: 34px; height: 32px; border-radius: 4px; border: none; background: transparent; color: var(--muted); display: grid; place-items: center; }
.star:hover, .star.on { color: #f5a623; }
.titles { min-width: 0; }
.t-row { display: flex; align-items: center; gap: 9px; }
.t-row h1 { margin: 0; font-size: 19px; letter-spacing: -.3px; }
.acc-wrap { position: relative; }
.dinfo { position: relative; color: var(--muted-2); display: inline-grid; place-items: center; cursor: help; }
.dinfo:hover { color: var(--primary); }
.dinfo-tt { top: 26px; left: -8px; width: 260px; }
/* pills sit BELOW the description, left-aligned — mirrors WidgetCard's .tt-tag */
/* the audience, folded in below a rule so it reads as a second fact about the board
   rather than more of the description */
/* .tt-desc / .tt-tag / .tt-acc* all live in global.css. A scoped copy here is what made
   this tooltip's tags a bordered 999px pill while the widget tooltip's were 4px — scoped
   styles carry a data attribute and out-specify the global rule. Do not reintroduce one. */
/* restricted → click the icon to see technician + group access */
/* the pill now appears on every board, so it carries the access level's own colour —
   the glyph alone (globe / lock / people) is what has to say which one this is */
/* Restricted is the only access level that shows a pill, so it carries that one hue */
.restrict-ic { display: inline-grid; place-items: center; width: 28px; height: 26px; border: 1px solid var(--border-strong); background: var(--surface); border-radius: 4px; color: var(--amber); cursor: pointer; }
.restrict-ic:hover { border-color: transparent; background: var(--amber-soft); }
.restrict-pop { position: absolute; top: 34px; left: 0; z-index: 60; width: 300px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.backdrop { position: fixed; inset: 0; z-index: 55; }
.ap-h { display: flex; align-items: center; gap: 7px; font-weight: 600; font-size: 13px; }
/* the one-line answer sits directly under the heading, before the lists that back it up */
/* the recipient count, on the heading */
.ap-n { margin-left: auto; min-width: 20px; height: 18px; padding: 0 6px; display: inline-grid; place-items: center; background: var(--inset); color: var(--ink-2); border-radius: var(--r-sm); font-size: 11px; font-weight: 600; }
.ap-locked { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12px; color: var(--muted); }
.ap-none { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted); }
.ap-sec label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: var(--muted); font-weight: 600; margin-bottom: 7px; }
/* Named ROWS, not chips: a person is shown the way people are shown everywhere else in
   the product — an avatar and a full name on one line. Chips wrapped mid-name and read
   as removable filters rather than as a list of who can open the board. */
.ap-rows { display: flex; flex-direction: column; gap: 2px; max-height: 190px; overflow: auto; }
.ap-row { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: var(--r); }
.ap-row:hover { background: var(--row-hover); }
.ap-av { flex: none; width: 24px; height: 24px; display: grid; place-items: center; border-radius: var(--r); background: var(--primary); color: #fff; font-size: 10px; font-weight: 500; }
/* a group is a set, not a person — square avatar, quieter fill, a glyph instead of initials */
.ap-av.grp { background: var(--inset); color: var(--ink-2); }
.ap-nm { font-size: 13px; color: var(--ink); min-width: 0; }
.small { font-size: 12px; }
.ap-desc { margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.5; }
.ap-edit { display: flex; align-items: center; gap: 7px; justify-content: center; border: 1px solid var(--border-strong); background: var(--surface); border-radius: 4px; padding: 7px; font-weight: 500; font-size: 13px; color: var(--ink-2); }
.ap-edit:hover { background: var(--surface-2); }
.bh-right { display: flex; align-items: center; gap: 8px; flex: none; }
.titles { min-width: 0; }
.t-row h1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 360px; }
.vsep { width: 1px; height: 24px; background: var(--border); margin: 0 2px; }
/* undo / redo with instant hover tooltip */
.udr { display: inline-flex; gap: 6px; margin-right: 4px; }
.udr-b { position: relative; width: 34px; height: 32px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); border-radius: 4px; display: grid; place-items: center; }
.udr-b:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
.udr-b:disabled { color: var(--muted); opacity: .85; cursor: not-allowed; }
/* placement only — surface, padding and colour come from .tt */
.udr-tip { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); white-space: nowrap; display: none; align-items: center; gap: 6px; z-index: 60; }
.udr-b:hover .udr-tip { display: inline-flex; }
.udr-tip kbd { font-family: inherit; font-size: 11px; background: rgba(255,255,255,.16); border-radius: 4px; padding: 1px 5px; }
.btn.ico-only { width: 38px; padding: 0; justify-content: center; }
.btn.ico-only.on { background: var(--primary-soft); color: var(--primary-700); border-color: transparent; }
.pop-wrap { position: relative; }
.editbar { display: flex; align-items: center; gap: 9px; padding: 9px 24px; background: var(--primary-softer); border-bottom: 1px solid var(--primary-soft); color: var(--primary-700); font-size: 13px; }
.unsaved { color: var(--amber); font-weight: 600; font-size: 12px; }
/* the canvas is white: tiles are --surface too, so the separation comes from their
   borders and shadow rather than a tinted ground */
.bbody { flex: 1; padding: 16px 24px 28px; background: var(--surface); }
/* the board gutter is set inline from store.layout.boardMargin — see boardPad */
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; align-items: start; }
/* B placement: the AI card in the KPI row — ~3 KPI widths, height matched to a KPI tile */
.ai-cell { grid-column: span 6; min-height: 140px; }
.ai-cell :deep(.ai-card-b) { min-height: 140px; }
.cell { position: relative; border-radius: var(--r-lg); display: flex; flex-direction: column; }
/* minimal highlight on a just-added widget */
.cell.flash { animation: flash 1.8s ease-out; }
.cell.flash :deep(.tile) { border-color: var(--primary); }
@keyframes flash {
  0% { box-shadow: 0 0 0 3px var(--primary-soft), 0 0 0 1px var(--primary); }
  60% { box-shadow: 0 0 0 3px var(--primary-soft), 0 0 0 1px var(--primary); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.span-3 { grid-column: span 3; } .span-6 { grid-column: span 6; } .span-4 { grid-column: span 4; } .span-12 { grid-column: span 12; }
.cell > :deep(.tile) { flex: 1; min-height: 0; }
.sk { min-height: 140px; padding: 10px; } .sk.span-6 { min-height: 248px; }
/* drag-reorder states */
.cell.dragging { opacity: .4; }
.cell.dropzone { outline: 2px dashed var(--primary); outline-offset: 2px; border-radius: var(--r-lg); }
/* Bottom-right resize grip: a CORNER BRACKET, revealed on hover. It traces the tile's own
   corner, which is what it moves — the two diagonal strokes it replaced read as a generic
   textarea grip and said nothing about which edge you were about to drag.
   Drawn with two borders on an empty box, so it is crisp at any zoom and needs no asset;
   the rounded outer corner echoes the card's radius instead of cutting across it. Inset
   5px clears the tile's 1px border and its corner arc. The HIT area stays 16px even though
   the mark is 6: a drag target should be easier to grab than it is to see. Instant on
   hover, like the widget's other actions. */
.resize { position: absolute; right: 3px; bottom: 3px; width: 16px; height: 16px; z-index: 6; cursor: nwse-resize; opacity: 0; }
.resize::after {
  content: ''; position: absolute; right: 2px; bottom: 2px; width: 6px; height: 6px;
  /* --muted-2, the info icon's grey — the two sit in the same card and read as one set */
  border-right: 2px solid var(--muted-2); border-bottom: 2px solid var(--muted-2);
  border-bottom-right-radius: 2px;
}
.cell:hover .resize { opacity: 1; }
.resize:hover::after { border-color: var(--primary); }
/* staggered widget reveal after the loading skeleton */
/* The CARD arrives quickly and quietly; the CHART inside it is what animates. This
   used to run .5s with up to .35s of stagger — long enough that a chart's 550ms draw
   finished behind a still-invisible card, which is why the charts appeared to pop in
   fully formed. Now the cards are all present by ~.5s and the chart entrance (held
   back by ENTER_DELAY in ChartTile) plays out in full view. */
.revealing .cell { animation: cellReveal .3s cubic-bezier(.2,.8,.2,1) backwards; }
.revealing .cell:nth-child(2) { animation-delay: .04s; }
.revealing .cell:nth-child(3) { animation-delay: .08s; }
.revealing .cell:nth-child(4) { animation-delay: .12s; }
.revealing .cell:nth-child(5) { animation-delay: .16s; }
.revealing .cell:nth-child(n+6) { animation-delay: .2s; }
@keyframes cellReveal { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: none; } }
/* widget groups (collapsible rows) */
.board-groups { display: flex; flex-direction: column; gap: 16px; }
/* No outline. The ground colour already marks the group's extent, and once the tiles
   inside got their own stronger edge the container's border was a third frame stacked on
   the same content. It comes back only while something is being dragged into it, where
   the border IS the message. */
/* ── A GROUP: a bordered card with a header BAND and a body of widgets ──────────────
   Matches the reference: the band is a strip on the widget header's own colour, so the
   group and the widgets in it share one header language; the body holds the widgets on
   the group ground with one 12px gutter. `overflow: hidden` rounds the band's corners —
   everything that must escape it (the ⋯ menu, the date popover) is teleported. */
/* White body (the card surface), and an outline that follows the header colour. */
/* `overflow: clip`, NOT hidden: hidden makes the group a scroll container, and a sticky
   header then sticks inside the group (never) instead of to the page. clip still rounds
   the corners. */
.group { border: 1px solid var(--gh-line, var(--border)); border-radius: var(--r-lg); background: var(--gh-body, var(--surface)); overflow: clip; transition: box-shadow .15s, border-color .15s; }
.group.drop-into, .grid.drop-into { border: 1px solid var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); border-radius: var(--r-lg); }
.grid.drop-into { padding: 4px; }
/* reordering: a primary rule where the dragged group will land, and the source dims */
.group.g-drop-before { box-shadow: 0 -3px 0 var(--primary); }
.group.g-dragging { opacity: .5; }

/* Three columns. Centred (the default) the title owns the middle track, so it centres
   on the BAND; the side tracks are equal so the middle one really is the middle. Left-
   aligned, the title's track grows and sits straight after the collapse caret. */
.grp-head {
  display: grid; grid-template-columns: 1fr minmax(0, auto) 1fr; align-items: center; gap: 8px;
  /* 6px sides: with 28px controls in a 40px band that is 6px above them too, so the
     collapse arrow sits as far from the left edge as from the top, and ⋯ likewise right */
  min-height: 40px; padding: 0 6px; background: var(--gh-bg, var(--bg)); color: var(--gh-ink, var(--ink));
  border-bottom: 1px solid var(--gh-line, var(--border));
  cursor: grab;
  /* Sticky, as in the reference: while its group scrolls past, the header holds the top
     of the page and the widgets slide under it; when the group's end arrives the header
     leaves with it and the next group's header takes the top. A sticky element is bound
     by its parent, so the hand-off needs no script. z-index clears every layer inside a
     group (resize grip 6, row inserter 8) and stays under the FAB (40). */
  position: sticky; top: 16px; z-index: 20;
}
/* STUCK: fill the 16px above with the board's white (reaching over the group's own side
   borders, hence -1px and the 1px clip margin), and give the band a top edge of its own
   since the group's top border has scrolled away. See markStuck(). */
.grp-head.stuck::before { content: ''; position: absolute; left: -1px; right: -1px; bottom: 100%; height: 17px; background: var(--surface); pointer-events: none; }
.grp-head.stuck { box-shadow: inset 0 1px 0 var(--gh-line, var(--border)); }
.group:has(> .grp-head.stuck) { overflow-clip-margin: 1px; }
.grp-head:active { cursor: grabbing; }
.grp-head button { cursor: pointer; }
.grp-head.gh-left-align { grid-template-columns: auto minmax(0, 1fr) auto; }
.group.collapsed .grp-head { border-bottom-color: transparent; }
.gh-l, .gh-r { display: flex; align-items: center; gap: 2px; }
.gh-r { justify-content: flex-end; }
.gh-t { display: flex; align-items: center; justify-content: center; gap: 6px; min-width: 0; }
.gh-left-align .gh-t { justify-content: flex-start; }
.grp-name { font-weight: 600; font-size: var(--gh-size, 14px); line-height: 1.2; cursor: text; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.grp-name-input { font-weight: 600; font-size: 14px; border: 1px solid var(--primary); border-radius: var(--r); padding: 2px 8px; outline: none; box-shadow: 0 0 0 3px var(--primary-soft); background: var(--surface); color: var(--ink); min-width: 0; }
.gh-lock { display: inline-grid; place-items: center; opacity: .7; }

.gh-tog { width: 28px; height: 28px; border: none; background: transparent; color: inherit; opacity: .7; display: grid; place-items: center; padding: 0; border-radius: var(--r); }
.gh-tog:hover { opacity: 1; }

/* Right side: + and ⋯ appear on hover, instantly, like a widget's actions. The date icon
   exists only when a range is set, and then it is always visible — it reports a state. */
.gh-act { width: 28px; height: 28px; padding: 0; border: none; background: transparent; color: inherit; opacity: .75; display: grid; place-items: center; border-radius: var(--r); }
.gh-act:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
.gh-hov { visibility: hidden; }
.grp-head:hover .gh-hov, .grp-head.acting .gh-hov { visibility: visible; }
/* the widget's calendar chip exactly: 22px, 13px icon, a filled --df tint (WidgetCard .df-btn) */
.gh-act.gh-date { width: 22px; height: 22px; margin-right: 4px; opacity: 1; color: var(--df); background: var(--df-soft); }
.gh-act.gh-date:hover { background: var(--df-soft); color: var(--df-ink); }

/* the body — widget padding is the group's own `pad` option */
.grp-body { padding: 12px; }
.group.no-pad .grp-body { padding: 0; }
/* the one-liner under the header: what that range does to the widgets below it */
.grp-date-note { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 12px; line-height: 1.45; color: var(--df-ink); }
.grp-date-note :deep(.ico) { color: var(--df); flex: none; }
.grp-date-note b { font-weight: 600; }
/* an EMPTY group is a dashed drop well and nothing else — see the template */
.grp-empty {
  grid-column: 1 / -1; border: 1px dashed var(--border-strong); border-radius: var(--r-lg); background: var(--surface);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 16px; text-align: center;
}
/* the same 42px disc / 20px mark as WidgetEmpty, so an empty group and an empty widget
   speak one language — see WidgetEmpty.vue for why --icon-hover and not --surface-2 */
/* the empty group's illustration (EmptyGroupArt) — painted in the chart-artwork slate */
.ge-art { color: var(--picker-ico); margin-bottom: 6px; }
.ge-sub { margin: 0; font-size: 13px; line-height: 1.45; color: var(--muted); max-width: 320px; }
.grp-empty .btn { margin-top: 8px; }
.grp-menu { position: fixed; z-index: 140; min-width: 188px; }
/* the switcher trigger — quiet at rest (it inherits the band's ink), a soft chip on hover */
.gh-sw { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 6px 0 4px; border: none; border-radius: var(--r); background: transparent; color: inherit; opacity: .7; flex: none; }
.gh-sw:hover, .gh-sw.on { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
.gh-pos { font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; }
.gsw-pop { position: fixed; z-index: 140; max-height: 320px; overflow: auto; }
.gsw-row { gap: 8px; }
.gsw-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; }
.gsw-nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gsw-n { flex: none; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.gsw-row.cur { font-weight: 600; }
.gsw-row.cur .gsw-dot { background: var(--sel); }
.gsw-row.cur .gsw-n { color: var(--ink); font-weight: 600; }
/* arrival: the outline pulses once in the near-black, then settles back */
.group.g-flash { animation: gflash 1.2s ease-out; }
@keyframes gflash {
  0%   { box-shadow: 0 0 0 0 transparent; }
  20%  { box-shadow: 0 0 0 2px var(--sel), 0 0 0 6px color-mix(in srgb, var(--sel) 12%, transparent); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
@media (prefers-reduced-motion: reduce) { .group.g-flash { animation: none; box-shadow: 0 0 0 2px var(--sel); } }
/* grouping-style demo switcher */
.gstyle-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 12px; margin-bottom: 14px; background: var(--surface); border: 1px dashed var(--border-strong); border-radius: 4px; }
.legend-bar .gsb-label em { font-style: normal; font-weight: 500; color: var(--muted); font-size: 11px; margin-left: 4px; }
.gsb-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--muted); }
.gsb-seg { display: inline-flex; gap: 3px; background: var(--surface-2); padding: 3px; border-radius: 4px; border: 1px solid var(--border); }
.gsb-b { border: none; background: transparent; padding: 5px 11px; border-radius: 4px; font-size: 13px; font-weight: 500; color: var(--muted); display: inline-flex; align-items: center; gap: 5px; }
.gsb-b:hover { color: var(--ink); }
.gsb-b.on { background: var(--surface); color: var(--primary-700); box-shadow: var(--sh-sm); font-weight: 600; }
.gsb-n { font-size: 13px; }
.gsb-desc { font-size: 12px; color: var(--muted-2); margin-left: auto; }
.gsb-desc em { font-style: normal; color: var(--ai-ink); font-weight: 500; }
@media (max-width: 720px) { .gsb-desc { display: none; } }

/* ---- AI entry demo: bar tinted lavender so it reads as the AI control ---- */
.ai-bar { border-color: var(--ai-border); background: var(--ai-softer); }
.gsb-label.ai :deep(.ico), .ai-bar .gsb-label { color: var(--ai-ink); }
.gsb-label.ai :deep(.ico) {
  background: var(--ai-grad); -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.ai-bar .gsb-b.on { color: var(--ai-ink); box-shadow: 0 0 0 1px var(--ai-border), var(--sh-sm); }

/* ② toolbar icon — a compact sparkle beside ⋯ (icon-only, no "Ask AI" text) */
.ai-ico.btn.ico-only { border-color: var(--ai-border); background: var(--ai-softer); color: var(--ai); }
.ai-ico.btn.ico-only:hover { background: var(--ai-soft); border-color: var(--ai); color: var(--ai-ink); }

/* ⑥ onboarding nudge */
.ai-nudge { display: flex; align-items: center; gap: 12px; border: 1px solid var(--ai-border); border-radius: var(--r-lg); background: var(--ai-grad-soft); padding: 11px 14px; margin-bottom: 14px; }
.an-spark { flex: none; width: 32px; height: 32px; border-radius: 4px; display: grid; place-items: center; background: var(--ai-grad); color: #fff; }
.an-txt { flex: 1; font-size: 13px; color: var(--ink-2); line-height: 1.45; }
.an-txt b { color: var(--ink); }
.an-sub { display: flex; align-items: center; gap: 4px; margin-top: 3px; font-size: 12px; color: var(--muted); }
.an-sub :deep(.ico) { color: var(--ai); }
.an-try { flex: none; height: 32px; padding: 0 12px; border: none; border-radius: var(--r); background: var(--ai-grad); color: #fff; font-weight: 500; font-size: 13px; }
.an-try:hover { filter: brightness(1.06); }
.an-x { flex: none; width: 28px; height: 28px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.an-x:hover { background: var(--ai-soft); color: var(--ai-ink); }

/* docked assistant panel */
.ai-dock { position: fixed; top: var(--topbar-h); right: 0; width: 480px; max-width: 94vw; height: calc(100vh - var(--topbar-h)); z-index: 200; background: var(--surface); border-left: 1px solid var(--border); box-shadow: var(--sh-lg); }
.ai-slide-enter-active, .ai-slide-leave-active { transition: transform .22s ease, opacity .22s ease; }
.ai-slide-enter-from, .ai-slide-leave-to { transform: translateX(24px); opacity: 0; }
@media (prefers-reduced-motion: reduce) { .ai-slide-enter-active, .ai-slide-leave-active { transition: none; } }
.bg-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
/* ⑨ auto-group: segmented "Group by" control */
.auto-seg { display: inline-flex; gap: 3px; background: var(--surface-2); padding: 3px; border-radius: 4px; border: 1px solid var(--border); }
.auto-b { border: none; background: transparent; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 500; color: var(--muted); }
.auto-b.on { background: var(--surface); color: var(--primary-700); box-shadow: var(--sh-sm); font-weight: 600; }
/* ⑧ sections / ⑨ auto: render groups as borderless headings instead of boxed containers */
.group.as-section { border: none; background: transparent; padding: 0; box-shadow: none; margin-bottom: 6px; }
.group.as-section > .grp-head { border-bottom: 1.5px solid var(--border); border-radius: 0; padding: 4px 2px 8px; background: transparent; }
.group.as-section .sec-ic { color: var(--primary); }
.group.as-section > .grid { padding: 12px 0 4px; }
.new-section-bar { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 12px; padding: 9px; border: 1px dashed var(--border-strong); background: transparent; border-radius: 4px; color: var(--primary-700); font-weight: 600; font-size: 13px; }
.new-section-bar:hover { background: var(--primary-softer); border-color: var(--primary); }
/* ⑦ per-widget group chip (hover-reveal, bottom-left, out of the header actions' way) */
.cell-grp-chip { position: absolute; left: 10px; bottom: 8px; z-index: 7; display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 11px; border: 1px solid var(--primary-soft); background: var(--surface); color: var(--primary-700); border-radius: 999px; font-size: 12px; font-weight: 600; box-shadow: var(--sh-sm); opacity: 0; transition: opacity .14s; }
.cell:hover .cell-grp-chip { opacity: 1; }
.cell-grp-chip:hover { background: var(--primary-softer); border-color: var(--primary); }
/* ⑥/⑦ tile group menu */
.tile-grp-menu { position: fixed; z-index: 140; min-width: 200px; max-height: 320px; overflow: auto; }
.menu-label { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: var(--muted-2); font-weight: 600; padding: 4px 10px 2px; }
/* inline (③): hover-reveal "+ New group here" inserter in each ungrouped row gap */
.ug-wrap { position: relative; }
.row-insert { position: absolute; left: 0; right: 0; height: 16px; transform: translateY(-50%); display: flex; align-items: center; gap: 10px; cursor: pointer; opacity: 0; transition: opacity .14s; z-index: 8; }
.row-insert:hover { opacity: 1; }
.bg-hint { margin-right: auto; font-size: 12px; color: var(--muted-2); }
/* hover-reveal "+ New group here" between group sections */
.grp-insert { display: flex; align-items: center; gap: 10px; height: 14px; margin: 2px 0; cursor: pointer; opacity: 0; transition: opacity .14s; }
.grp-insert:hover { opacity: 1; }
.gi-line { flex: 1; height: 1px; background: var(--primary-soft); }
.gi-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--primary-700); background: var(--primary-softer); border: 1px solid var(--primary-soft); border-radius: 999px; padding: 2px 10px; }
.empty-cta { display: flex; gap: 10px; align-items: center; }
.big-cta.ghost { background: transparent; color: var(--primary-700); border: 1px solid var(--border-strong); }
.big-cta.ghost:hover { background: var(--primary-softer); border-color: var(--primary); }
/* marquee (rubber-band) group selection */
.board-groups.selecting { cursor: crosshair; user-select: none; }
.board-groups.selecting :deep(.tile), .board-groups.selecting .resize { pointer-events: none; }
.cell.pick-on { outline: 2px dashed var(--primary); outline-offset: 2px; box-shadow: 0 0 0 4px var(--primary-soft); border-radius: var(--r-lg); }
.marquee { position: fixed; z-index: 300; border: 1.5px dashed var(--primary); background: rgba(61,139,208,.12); border-radius: 4px; pointer-events: none; }
/* bottom-right confirm CTA */
/* Centred at the foot of the board, not tucked bottom-right. What it reports is about
   the SELECTION, which is spread across the canvas — a bar pinned to one corner reads as
   belonging to the thing in that corner (the FAB sits there) rather than to the widgets
   the user just marqueed. */
.group-cta { position: fixed; left: 50%; transform: translateX(-50%); bottom: 26px; z-index: 60; display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-lg); }
.gc-count { display: inline-flex; align-items: center; font-weight: 500; font-size: 13px; color: var(--ink); margin-right: 4px; }
.add-group { display: inline-flex; align-items: center; gap: 7px; border: none; background: transparent; border-radius: 4px; padding: 8px 12px; font-weight: 600; font-size: 13px; color: var(--primary-700); }
.add-group:hover { background: var(--primary-softer); }
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 64px 20px; text-align: center; }
/* illustration — a small cluster of the three tile types */
.empty-ill { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 10px; }
.ei { display: grid; place-items: center; border-radius: 4px; box-shadow: var(--sh-sm); }
.ei-chart { width: 64px; height: 64px; background: var(--blue-soft); color: var(--blue); }
.ei-kpi { width: 54px; height: 54px; background: var(--primary-soft); color: var(--primary); }
.ei-tbl { width: 54px; height: 54px; background: var(--green-soft); color: var(--green); }
.empty h3 { margin: 0; font-size: 18px; } .empty p { margin: 0 0 6px; color: var(--muted); }
.empty p b { color: var(--ink-2); font-weight: 600; }
.big-cta { height: 40px; padding: 0 20px; font-size: 14px; }
.missing { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 90px; color: var(--muted); }
/* The Figma's near-black square that shows + and turns to ×, enlarged 32 → 42px on
   2026-09-24; the pills above scale with it (28 → 36px, 12 → 13px type, 14 → 18px glyphs) */
.fab-wrap { position: fixed; right: 26px; bottom: 26px; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; gap: 16px; }
.fab-backdrop { position: fixed; inset: 0; z-index: -1; }
.fab { position: relative; width: 42px; height: 42px; padding: 0; border-radius: 8px; border: none; background: var(--sel); color: var(--sel-ink); display: grid; place-items: center; box-shadow: 0 4px 12px rgba(7,16,31,.22); transition: background .15s, box-shadow .15s; }
.fab:hover { background: var(--sel-hover); box-shadow: 0 6px 16px rgba(7,16,31,.28); }
/* ③/⑩ live inside this menu — tint it AI-purple and pulse so the entry is findable */
.fab.ai-hint { background: var(--ai-grad); box-shadow: 0 4px 12px rgba(139,92,246,.42); animation: fabpulse 2.2s ease-in-out infinite; }
@keyframes fabpulse { 0%, 100% { box-shadow: 0 4px 12px rgba(139,92,246,.42), 0 0 0 0 rgba(139,92,246,.35); } 50% { box-shadow: 0 4px 12px rgba(139,92,246,.42), 0 0 0 9px rgba(139,92,246,0); } }
@media (prefers-reduced-motion: reduce) { .fab.ai-hint { animation: none; } }
/* slide-up menu above the FAB */
.fab-menu { display: flex; flex-direction: column; gap: 14px; align-items: flex-end; }
.fab-opt { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 11px; border: 1px solid var(--sel); background: var(--surface); color: var(--sel); border-radius: 8px; font-weight: 500; font-size: 13px; white-space: nowrap; box-shadow: var(--sh-sm); }
.fab-opt:hover { background: var(--surface-2); }
/* Generate With AI — the gradient edge (blue→purple→pink) and the violet label */
.fab-opt.ai { padding-left: 10px; border: 1px solid transparent; background: linear-gradient(var(--surface), var(--surface)) padding-box, var(--ai-grad-line) border-box; color: #7d1dfa; }
.fab-opt.ai :deep(.ico) { color: var(--ai); opacity: .8; }
.fab-opt.ai:hover { background: linear-gradient(var(--ai-softer), var(--ai-softer)) padding-box, var(--ai-grad-line) border-box; }
[data-theme="dark"] .fab-opt.ai { color: var(--ai-ink); }
.fabpop-enter-active { transition: opacity .2s ease, transform .22s cubic-bezier(.2,.8,.2,1); }
.fabpop-leave-active { transition: opacity .14s ease, transform .14s ease; }
.fabpop-enter-from, .fabpop-leave-to { opacity: 0; transform: translateY(16px); }
@media (max-width: 1100px) { .span-3 { grid-column: span 6; } .span-6 { grid-column: span 12; } }
</style>
