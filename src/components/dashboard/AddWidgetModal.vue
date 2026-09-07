<script setup>
import { ref, computed, watch } from 'vue'
import Icon from '../ui/Icon.vue'
import Dropdown from '../ui/Dropdown.vue'
import ChartIcon from '../ui/ChartIcon.vue'
import WidgetBuilderModal from './WidgetBuilderModal.vue'
import { store, addTilesToDashboard, deleteLibTile, restoreLibTile, removeLibTileForever, toast } from '../../store/index.js'
import { uid } from '../../data/mock.js'
import { groupPickerTypes } from '../../data/chartTypes.js'
const props = defineProps({ d: Object, group: { type: String, default: null } })
const emit = defineEmits(['close', 'created', 'newgroup'])
function tagGroup(id) { if (props.group && id != null) { const t = props.d.tiles.find((x) => x.id === id); if (t) t.group = props.group } }

const tab = ref('chart')              // chart | predefined | user | shared
/* Archive is no longer a tab OR a header button — it is a mode of ONE tab.

   Only an item you made can be archived (canDelete is `prov === user`), so the archive
   can only ever hold Created-by-me items. Sitting in the header it was offered from
   Predefined and Shared too, where nothing can ever arrive in it. It now appears beside
   the filters on Created by me, which is the only tab whose contents can go there. */
const archive = ref(false)
const fModule = ref('')
const fType = ref('')                 // '' | kpi | chart | shortcut
const search = ref('')
const TABS = [
  { v: 'chart', label: 'Create Widget' },
  { v: 'predefined', label: 'Predefined' },
  { v: 'user', label: 'Created by me' },
  { v: 'shared', label: 'Shared with me' },
]
/* Clicking a tab while a search is open goes to that tab, which means clearing the search
   — otherwise you would land on a tab whose content the search is still overriding, and
   the click would look like it did nothing. */
function goTab(v) { search.value = ''; tab.value = v }
const TYPE_FILTERS = [{ v: '', label: 'All' }, { v: 'chart', label: 'Widget' }, { v: 'kpi', label: 'KPI' }, { v: 'shortcut', label: 'Shortcut' }]
const builder = ref(null)             // selected chart type → opens centered builder

/* ---- Chart type tab -------------------------------------------------------------
 * Grouped by what a type DOES, not by when it was added. The order is also the order
 * of commitment: Statistics and Coverage are the two convertible groups, so they come
 * first — pick either and you can still change your mind afterwards. Everything below
 * is frozen once created, which is the more considered choice.
 *
 * The group a type sits in here matches its family in data/chartTypes.js, and that
 * file decides convertibility. Don't let the two drift.
 *
 * Map Bubble is withdrawn. The renderer and its lazy India geo stay in the codebase so
 * any tile already built on it keeps drawing; it is simply no longer offered.
 */
// Every chart card. Which GROUP each falls into, and in what order, comes from
// PICKER_GROUPS in data/chartTypes.js — the builder's Chart Type row reads the same
// list, so the two can never disagree about where a type belongs.
const CHART_CARDS = [
  { id: 'line', label: 'Line', icon: 'chart-line', type: 'chart', kind: 'line' },
  { id: 'bar', label: 'Bar', icon: 'chart-bar', type: 'chart', kind: 'hbar' },
  { id: 'column', label: 'Column', icon: 'chart-bar', type: 'chart', kind: 'bar' },
  // Pie now builds a PIE. It used to build a doughnut, which meant the one kind you
  // could pick by name was the one you couldn't get.
  { id: 'pie', label: 'Pie', icon: 'chart-pie', type: 'chart', kind: 'pie' },
  { id: 'donut', label: 'Donut', icon: 'chart-donut', type: 'chart', kind: 'donut' },
  { id: 'stack', label: 'Stacked', icon: 'chart-stack', type: 'chart', kind: 'stack' },
  { id: 'grouped', label: 'Grouped', icon: 'chart-grouped', type: 'chart', kind: 'grouped' },
  { id: 'multiline', label: 'Multi-line', icon: 'chart-multiline', type: 'chart', kind: 'multiline' },
  { id: 'combo', label: 'Combo', icon: 'chart-combo', type: 'chart', kind: 'combo' },
  { id: 'gauge', label: 'Gauge', icon: 'chart-gauge', type: 'chart', kind: 'gauge' },
  { id: 'hist', label: 'Histogram', icon: 'chart-hist', type: 'chart', kind: 'hist' },
  { id: 'heatmap', label: 'Heatmap', icon: 'chart-heatmap', type: 'chart', kind: 'heatmap' },
  { id: 'funnel', label: 'Funnel', icon: 'chart-funnel', type: 'chart', kind: 'funnel' },
  // Map Bubble is withdrawn. The renderer and its lazy India geo stay in the codebase
  // so any tile already built on it keeps drawing; it is simply no longer offered.
]

/* One section per tile FAMILY, as the design file lays the gallery out: every chart kind
   under Widget, then the families that are not charts, each on its own. The previous
   Statistics / Coverage / Multi-Series / Advanced split grouped by what a chart DOES;
   this groups by what the tile IS, which is the axis the rest of the product already
   uses (the builder's family switch, the library's type pills). */
const GROUPS = [
  ...groupPickerTypes(CHART_CARDS),
  { cat: 'Non-chart', types: [
    { id: 'kpi', label: 'KPI', icon: 'kpi', type: 'kpi', kind: null },
    { id: 'shortcut', label: 'Shortcut', icon: 'table', type: 'shortcut', kind: null },
    { id: 'text', label: 'Free Text', icon: 'chart-text', type: 'text', kind: null },
  ] },
]
/* GROUPS is rendered straight. There used to be a `filteredGroups` that narrowed it by the
   search box; the search is global now and surfaces matching types as a result group of
   its own, so the computed could only ever have returned all of GROUPS. */

// ---- Reuse tabs: listing with actions ----
const provMap = { predefined: 'predefined', user: 'user', shared: 'shared' }
const isTrash = computed(() => archive.value)
/* The All tab is gone: the search above the tabs already reaches every provenance, so a
 * tab that did the same thing was a second answer to a question already answered. Each
 * remaining tab is one provenance, and the per-item rules below still read `l.prov`
 * rather than the tab — search results mix all three, so a tab-keyed rule would have
 * offered Delete on a predefined tile. */
const inTab = (l) => l.prov === provMap[tab.value] && !l.trashed

/* Module counts must describe WHAT YOU WILL GET, so they are scoped to the tab and
 * the type filter you already have on. They used to count the whole library, so
 * "Request (20)" on the Created-by-me tab would open three rows — the badge and the
 * result disagreed. A module with nothing in the current tab isn't offered at all;
 * a filter that can only ever return nothing isn't a filter.
 * "All modules" carries no count: it is the absence of a filter, not a bucket. */
const moduleBase = computed(() => {
  const arr = isTrash.value ? store.library.filter((l) => l.trashed) : store.library.filter(inTab)
  return fType.value ? arr.filter((l) => l.type === fType.value) : arr
})
const moduleCount = (m) => moduleBase.value.filter((l) => l.module === m).length
const moduleOptions = computed(() => [
  { value: '', label: 'All modules' },
  ...store.modules.filter((m) => moduleCount(m) > 0).map((m) => ({ value: m, label: `${m} (${moduleCount(m)})` })),
])
// switching tab/type can retire the module you had picked — don't leave a dead filter on
watch(moduleOptions, (opts) => {
  if (fModule.value && !opts.some((o) => o.value === fModule.value)) fModule.value = ''
})
const trashCount = computed(() => store.library.filter((l) => l.trashed).length)
const list = computed(() => {
  let arr = isTrash.value ? store.library.filter((l) => l.trashed) : store.library.filter(inTab)
  if (fType.value) arr = arr.filter((l) => l.type === fType.value)
  if (fModule.value) arr = arr.filter((l) => l.module === fModule.value)
  return arr
})
// per-type counts for the current tab (before the type filter is applied)
const typeCounts = computed(() => {
  const inMod = (l) => !fModule.value || l.module === fModule.value
  const base = isTrash.value
    ? store.library.filter((l) => l.trashed && inMod(l))
    : store.library.filter((l) => inTab(l) && inMod(l))
  return { '': base.length, kpi: base.filter((l) => l.type === 'kpi').length, chart: base.filter((l) => l.type === 'chart').length, shortcut: base.filter((l) => l.type === 'shortcut').length }
})
/* ---- GLOBAL SEARCH ---------------------------------------------------------------
 * The box sits ABOVE the tab strip, and that position is the whole contract: it
 * out-scopes the tabs. Typing in it searches every provenance and every module at once
 * — including the Create Widget tab, whose chart TYPES are searchable too, so the tag
 * set on a result covers all four tabs rather than three of them.
 *
 * While it has text the per-tab filters (type pills, module) are hidden and no tab reads
 * as active. They are narrower than the search, so leaving them on screen would pose the
 * question of which one owns the result list — and the answer would have been neither.
 *
 * Results group by MODULE, because that is the axis a person searching already has in
 * mind ("something about assets"), and each row carries the tab it came from as a tag,
 * so picking a shared widget over your own stays a decision rather than an accident. */
const q = computed(() => search.value.trim().toLowerCase())
const searching = computed(() => q.value.length > 0)
const TAB_OF_PROV = { predefined: 'Predefined', user: 'Created by me', shared: 'Shared with me' }

const searchGroups = computed(() => {
  if (!searching.value) return []
  const hit = (v) => !!v && v.toLowerCase().includes(q.value)
  // description and module match too — you rarely remember what a saved widget was called
  const items = store.library.filter((l) => !l.trashed && (hit(l.title) || hit(l.desc) || hit(l.module)))
  const byModule = new Map()
  for (const l of items) { if (!byModule.has(l.module)) byModule.set(l.module, []); byModule.get(l.module).push(l) }
  // store.modules order, not Map insertion order, so the groups sit in the same sequence
  // as the module dropdown rather than in whatever order the library happens to be in
  const groups = store.modules.filter((m) => byModule.has(m)).map((m) => ({ key: m, cat: m, items: byModule.get(m) }))
  const types = GROUPS.flatMap((g) => g.types).filter((t) => hit(t.label))
  if (types.length) groups.push({ key: '__types', cat: 'Widget types', types })
  return groups
})
const searchCount = computed(() => searchGroups.value.reduce((n, g) => n + (g.items || g.types).length, 0))

/* One list of sections drives the body in BOTH modes — searching or not — so the row
   markup exists once. A second copy under a v-else is exactly how two listings start
   agreeing today and disagreeing in three commits. */
const sections = computed(() => {
  if (searching.value) return searchGroups.value
  return list.value.length ? [{ key: 'tab', cat: null, items: list.value }] : []
})

/* The row wears the artwork of the chart it actually draws, which is the point of putting
   an icon there at all: the type used to be spelled out in the meta line, and that line is
   now the description. A KPI and a Shortcut have one glyph each; a chart has thirteen, and
   an item saved before `kind` existed falls back to Column rather than to nothing. */
function libIcon(l) {
  if (l.type === 'kpi') return 'kpi'
  if (l.type === 'shortcut') return 'shortcut'
  return l.kind || 'column'
}

// ---- multi-select: add is ONLY via checkbox + footer (no per-row quick add) ----
const MAX_SEL = 10
const selected = ref(new Set())
// a library item already on this dashboard can't be added again — it shows as checked+locked
function isPlaced(l) { return props.d.tiles.some((t) => t.title === l.title && t.type === l.type) }
function isSel(l) { return selected.value.has(l.id) }
function toggleSel(l) {
  if (isPlaced(l)) return   // already on the dashboard
  const s = new Set(selected.value)
  if (s.has(l.id)) s.delete(l.id)
  else if (s.size >= MAX_SEL) { toast(`You can add up to ${MAX_SEL} at once`, 'warn'); return }
  else s.add(l.id)
  selected.value = s
}
function clearSel() { selected.value = new Set() }
function addSelected() {
  const items = store.library.filter((l) => selected.value.has(l.id))
  if (!items.length) return
  const before = props.d.tiles.length
  addTilesToDashboard(props.d, items)
  if (props.group) for (let i = before; i < props.d.tiles.length; i++) props.d.tiles[i].group = props.group
  emit('close')
}

// ---- Duplicate / Edit → open the builder (live preview); Update returns a copy to the listing ----
const libBuilder = ref(null)
function typeDesc(l) {
  if (l.type === 'kpi') return { id: 'kpi', label: 'KPI', type: 'kpi', kind: null }
  if (l.type === 'shortcut') return { id: 'shortcut', label: 'Shortcut', type: 'shortcut', kind: null }
  return { id: 'bar', label: 'Widget', type: 'chart', kind: 'bar' }
}
function openLibBuilder(l) { libBuilder.value = { type: typeDesc(l), item: l } }
function uniqueName(base) {
  const names = new Set(store.library.map((l) => l.title.toLowerCase()))
  if (!names.has(base.toLowerCase())) return base
  let n = 1
  while (names.has(`${base} copy ${n}`.toLowerCase())) n++
  return `${base} Copy ${n}`
}
function onLibrarySaved({ title, module, type, sharedAccess, desc, kind, place }) {
  // Archive is a mode, not a provenance — a copy you made while in it is yours
  const item = { id: uid('lt'), type, title: uniqueName(title), prov: provMap[tab.value] || 'user', module, favorite: false, sharedAccess: sharedAccess || 'view', desc, kind }
  store.library.unshift(item)     // shows at top of the current tab's listing
  libBuilder.value = null
  if (place) {                    // "Clone & Add Widget" → place on canvas + redirect
    addTilesToDashboard(props.d, [item])
    const newId = props.d.tiles[props.d.tiles.length - 1].id
    tagGroup(newId)
    emit('created', newId)
    emit('close')
  } else {
    toast(`Saved “${item.title}” — select it to add`, 'success')
  }
}
// "Create Widget" (no place) → save the new definition into User Defined
function onSavedToLibrary({ title, module, type, sharedAccess, desc, kind }) {
  const item = { id: uid('lt'), type, title: uniqueName(title), prov: 'user', module, favorite: false, sharedAccess: sharedAccess || 'view', desc, kind }
  store.library.unshift(item)
  builder.value = null
  tab.value = 'user'
  toast(`Saved “${item.title}” to User Defined`, 'success')
}

// ---- Delete = soft-delete to Trash · Trash tab: Restore + Delete forever (confirm) ----
const delTarget = ref(null)
function delLib(l) { deleteLibTile(l) }          // → Trash (reversible)
function restore(l) { restoreLibTile(l) }
function delForever(l) { delTarget.value = l }    // opens the confirm modal
function confirmDel() { removeLibTileForever(delTarget.value); delTarget.value = null }

/* ---- per-ITEM action rules (same for Widget / KPI / Shortcut) ----
 * Predefined: Duplicate only · Created by me: Duplicate·Edit·Delete
 * Shared: Duplicate always, Edit only if the owner granted Edit access
 * These read the item's own provenance, never the active tab. The All tab mixes all
 * three, so a tab-based rule would have offered Delete on a predefined tile. */
function canDuplicate() { return true }
function canEdit(l) {
  if (l.prov === 'user') return true
  if (l.prov === 'shared') return l.sharedAccess === 'edit' || l.sharedAccess === 'both'
  return false   // predefined → no edit
}
function canDelete(l) { return l.prov === 'user' }
function hasActions(l) { return canDuplicate(l) || canEdit(l) || canDelete(l) }

// in a mixed list the row must say where each item came from
const PROV_LABEL = { predefined: 'Predefined', user: 'Created by me', shared: 'Shared' }

const TYPE_LABEL = { kpi: 'KPI', chart: 'Widget', shortcut: 'Shortcut' }

/* The placement count and its "Placed on" popover were removed from this listing.
 * `libUsage` still exists in the store for anywhere that wants the impact view. */
/* The tooltip carries only what the ROW cannot: the type in words, and where the item came
   from. It used to open with a description as well — a generated one, back when the row had
   none to show — and that sentence went when the row grew a real description under the
   title. Repeating on hover what is already on screen is not redundancy that costs nothing:
   it trains people to hover rows that have nothing more to give.

   The type is here because the icon carries it on the row, and an icon is a fast answer
   rather than a certain one — "is this a KPI or a Widget" has to be answerable in words
   somewhere. Provenance is here because nothing on the row says it while you are browsing a
   single tab, and it decides which actions the row offers. */
const tip = ref({ show: false, type: '', prov: '', top: 0, right: 0 })
function showTip(l, e) {
  const r = e.currentTarget.getBoundingClientRect()
  tip.value = { show: true, type: l.type, prov: l.prov, top: r.top + r.height / 2, right: window.innerWidth - r.left + 12 }
}
function hideTip() { tip.value.show = false }
const TAB_LABEL = { predefined: 'Predefined', user: 'Created by me', shared: 'Shared with me' }
const emptyMsg = computed(() => {
  const plural = fType.value ? (fType.value === 'kpi' ? 'KPIs' : TYPE_LABEL[fType.value] + 's') : 'items'
  if (isTrash.value) return `Archive is empty.`
  return `No ${plural} in ${TAB_LABEL[tab.value] || 'this tab'} yet.`
})
const emptyHelp = computed(() => {
  if (isTrash.value) return 'Archived widgets, KPIs and Shortcuts land here — restore them, or delete forever.'
  if (tab.value === 'shared') return 'Widgets, KPIs and Shortcuts shared with you will appear here.'
  if (tab.value === 'user') return 'Create one from the Create Widget tab, then it appears here.'
  return 'Predefined tiles curated by your admin will appear here.'
})
watch([tab], () => { search.value = ''; fModule.value = ''; fType.value = ''; archive.value = false; selected.value = new Set() })
watch(fType, (v) => { if (v === 'shortcut') fModule.value = '' })   // Shortcut listing has no module filter

function onCreated(id) { tagGroup(id); emit('created', id); emit('close') }
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('close')">
    <div class="aw">
      <header class="dlg-head">
        <h3>Add new widget</h3>
        <div class="hd-a">
          <button class="dlg-x" @click="emit('close')"><Icon name="x" :size="18" /></button>
        </div>
      </header>

      <!-- GLOBAL search — above the tabs, and that is the contract. A control placed over
           a switcher is read as governing it, so this one has to actually do that: it
           searches every tab and every module at once, and the tabs go quiet while it has
           text. Sitting under the tabs, as it did, it could only ever have meant "within
           this tab" — which is the search we already had. -->
      <div class="aw-search">
        <div class="srch">
          <Icon name="search" :size="15" class="muted" />
          <input v-model="search" placeholder="Search widgets, KPIs and Shortcuts…" />
          <button v-if="searching" class="srch-x" title="Clear search" @click="search = ''"><Icon name="x" :size="14" /></button>
        </div>
      </div>

      <!-- top tabs. No All: the search above already reaches every provenance, so the tab
           that did the same was a second answer to the same question. While searching NO tab
           reads as active — the results are not any one tab's — and clicking one returns you
           to it by clearing the search. -->
      <div class="aw-tabs">
        <button v-for="t in TABS" :key="t.v" class="awt" :class="{ on: !searching && tab === t.v }" @click="goTab(t.v)">{{ t.label }}</button>
      </div>

      <!-- Per-tab filters: type pills, module, and Archive. All three are hidden while the
           global search has text — they are narrower than it is, so leaving them on screen
           would pose the question of which control owns the result list. -->
      <div v-if="tab !== 'chart' && !searching" class="type-tabs" role="tablist">
        <button
          v-for="t in TYPE_FILTERS" :key="t.v" class="ttab" :class="{ on: fType === t.v }"
          role="tab" :aria-selected="fType === t.v" @click="fType = t.v"
        >{{ t.label }} <span class="ttab-c">{{ typeCounts[t.v] }}</span></button>
        <span class="tt-sp" />
        <!-- Archive lives HERE, on Created by me, because only an item you made can ever
             reach it — canDelete is `prov === user`. In the header it was offered from
             Predefined and Shared as well, where it can only ever open empty. -->
        <button
          v-if="tab === 'user'" class="ttab arc" :class="{ on: isTrash }"
          @click="archive = !archive"
        ><Icon name="archive" :size="14" /> Archive <span v-if="trashCount" class="ttab-c">{{ trashCount }}</span></button>
        <div v-if="fType !== 'shortcut' && !isTrash" class="modsel"><Dropdown v-model="fModule" :options="moduleOptions" placeholder="All modules" /></div>
      </div>

      <div class="aw-body">
        <!-- SEARCH RESULTS — grouped by module, because "something about assets" is the
             shape the question arrives in. Each row carries the tab it came from, so
             reaching for a shared widget instead of your own stays a decision. -->
        <template v-if="searching">
          <div class="res-h">{{ searchCount }} {{ searchCount === 1 ? 'result' : 'results' }} for “{{ search.trim() }}”</div>
        </template>

        <!-- CHART TYPE: category card grid → opens centered builder -->
        <template v-if="tab === 'chart' && !searching">
          <section v-for="g in GROUPS" :key="g.cat" class="cat">
            <div class="cat-h">{{ g.cat }}</div>
            <div class="cards">
              <!-- illustrated icons, not Material glyphs: at 40px a chart type is a
                   picture of the chart, and the three-step opacity ramp is what makes
                   Bar / Column / Stacked / Histogram tell themselves apart. No rot90 —
                   Bar has its own horizontal artwork now. -->
              <button v-for="t in g.types" :key="t.id" class="tc" @click="builder = t">
                <div class="tc-ico"><ChartIcon :name="t.id" :size="88" /></div>
                <span class="tc-label">{{ t.label }}</span>
              </button>
            </div>
          </section>
          <!-- Empty Group is the last option (charts come first) -->
          <section class="cat">
            <div class="cat-h">Empty group</div>
            <div class="cards">
              <button class="tc tc-group" @click="emit('newgroup')">
                <div class="tc-ico"><ChartIcon name="group" :size="88" /></div>
                <span class="tc-label">Empty Group</span>
              </button>
            </div>
          </section>
        </template>

        <!-- THE LISTING — one loop, both modes. Not searching, `sections` is a single
             untitled group holding the current tab; searching, it is one group per module
             plus the matching chart types. A second copy of this row under a v-else is
             exactly how two listings start out agreeing and stop three commits later. -->
        <template v-else-if="sections.length">
          <section v-for="g in sections" :key="g.key" class="lsec">
            <div v-if="g.cat" class="lsec-h">{{ g.cat }}<span class="lsec-n">{{ (g.items || g.types).length }}</span></div>

            <!-- a matching chart TYPE is a Create Widget result: same card, same click -->
            <div v-if="g.types" class="cards">
              <button v-for="t in g.types" :key="t.id" class="tc" @click="builder = t">
                <div class="tc-ico"><ChartIcon :name="t.id" :size="88" /></div>
                <span class="tc-label">{{ t.label }}</span>
                <span class="row-tag src">Create Widget</span>
              </button>
            </div>

            <div v-else class="lst">
              <div v-for="l in g.items" :key="l.id" class="lrow" :class="{ sel: isSel(l), placed: isPlaced(l) }" @mouseenter="showTip(l, $event)" @mouseleave="hideTip">
                <input v-if="!isTrash" type="checkbox" class="lcb" :checked="isSel(l) || isPlaced(l)" :disabled="isPlaced(l)" @change="toggleSel(l)" />
                <span v-else class="trash-ic"><Icon name="trash" :size="15" /></span>
                <!-- the artwork of the chart this row actually draws. It replaces the words
                     "Widget" / "KPI" / "Shortcut", which used to open the meta line and now
                     have nowhere to sit — a picture of the thing reads faster than its name
                     anyway, and the name is still on hover for when it doesn't. -->
                <span class="lt-ico"><ChartIcon :name="libIcon(l)" :size="34" /></span>
                <div class="lt-main">
                  <div class="lt-name-row">
                    <span class="lt-name ellip">{{ l.title }}</span>
                    <!-- Searching, the tag is the TAB the result came from — the thing you
                         can no longer read off the page, since the results span all of them.
                         Not searching, the tab is on screen and the module is not, so it is
                         the module. Never both: in a module-grouped result list the module is
                         already the heading three lines up. -->
                    <span class="row-tag" :class="searching ? 'src' : 'mod'">{{ searching ? TAB_OF_PROV[l.prov] : l.module }}</span>
                    <span v-if="isPlaced(l)" class="placed-tag"><Icon name="check" :size="11" /> On dashboard</span>
                  </div>
                  <!-- Falls back to the type and module for an item saved without a
                       description — an empty second line would collapse the row to a
                       different height than its neighbours, for no gain. -->
                  <div class="lt-desc ellip">{{ l.desc || (TYPE_LABEL[l.type] + ' · ' + l.module) }}</div>
                </div>
                <!-- Archive: Restore + Delete forever · otherwise Duplicate / Edit / Delete -->
                <div v-if="isTrash" class="lt-acts always">
                  <button class="la" title="Restore" @click="restore(l)"><Icon name="restore" :size="15" /></button>
                  <button class="la del" title="Delete forever" @click="delForever(l)"><Icon name="trash" :size="15" /></button>
                </div>
                <div v-else-if="hasActions(l) && !isPlaced(l)" class="lt-acts">
                  <button v-if="canDuplicate(l)" class="la" title="Duplicate" @click="openLibBuilder(l)"><Icon name="copy" :size="15" /></button>
                  <button v-if="canEdit(l)" class="la" title="Edit" @click="openLibBuilder(l)"><Icon name="edit" :size="15" /></button>
                  <button v-if="canDelete(l)" class="la del" title="Delete" @click="delLib(l)"><Icon name="trash" :size="15" /></button>
                </div>
              </div>
            </div>
          </section>
        </template>
        <div v-else-if="searching" class="none"><Icon name="search" :size="24" /><p class="none-t">Nothing matches “{{ search.trim() }}”.</p><span class="none-h">The search covers every tab and every module — try a shorter word, or a module name.</span></div>
        <div v-else class="none"><Icon name="inbox" :size="24" /><p class="none-t">{{ emptyMsg }}</p><span class="none-h">{{ emptyHelp }}</span></div>
      </div>

      <!-- multi-select footer: Add (n) / Cancel -->
      <transition name="slideup">
        <footer v-if="tab === 'chart' && !searching && !selected.size" class="dlg-foot">
          <span />
          <div class="fbtns"><button class="btn" @click="emit('close')">Cancel</button></div>
        </footer>
        <footer v-else-if="selected.size" class="dlg-foot">
          <span class="selinfo spread">{{ selected.size }} selected<span v-if="selected.size >= MAX_SEL"> · max {{ MAX_SEL }}</span></span>
          <div class="fbtns">
            <button class="btn" @click="clearSel">Cancel</button>
            <button class="btn btn-primary" @click="addSelected"><Icon name="plus" :size="15" /> Add</button>
          </div>
        </footer>
      </transition>
    </div>

    <!-- Centered builder — create from Chart type -->
    <WidgetBuilderModal v-if="builder" :d="d" :type="builder" @close="builder = null" @created="onCreated" @savedToLibrary="onSavedToLibrary" />
    <!-- Centered builder — duplicate/edit a library tile (Update returns a copy to the listing) -->
    <WidgetBuilderModal v-if="libBuilder" :d="d" :type="libBuilder.type" :libItem="libBuilder.item" @close="libBuilder = null" @librarySaved="onLibrarySaved" />

    <!-- The "Placed on" popover lived here. It hung off the usage badge, which was its
         only trigger, so it went when the count did rather than staying as unreachable
         code. If the impact view is wanted back it needs a trigger of its own — the row
         already uses hover for its description tooltip, so the two would collide. -->

    <!-- Row tooltip — the type and the provenance, opening to the left of the hovered row -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="tip.show" class="tt lib-tip" :style="{ top: tip.top + 'px', right: tip.right + 'px' }">
          <span v-if="tip.type" class="tt-tag">{{ TYPE_LABEL[tip.type] }}</span>
          <span v-if="tip.prov" class="tt-tag" :class="tip.prov">{{ PROV_LABEL[tip.prov] || tip.prov }}</span>
          <span class="lib-tip-arrow" />
        </div>
      </transition>
    </teleport>

    <!-- Delete confirmation -->
    <teleport to="body">
      <div v-if="delTarget" class="cf-overlay" @click.self="delTarget = null">
        <div class="cf">
          <div class="cf-ico"><Icon name="trash" :size="22" /></div>
          <h4>Delete “{{ delTarget.title }}” forever?</h4>
          <p>This permanently removes it from the library. This action can’t be undone.</p>
          <div class="cf-btns">
            <button class="btn" @click="delTarget = null">Cancel</button>
            <button class="btn cf-del" @click="confirmDel"><Icon name="trash" :size="15" /> Delete forever</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.hd-a { display: flex; align-items: center; gap: 8px; }
/* the archive toggle reads as ON the way every chosen thing in this module does */
.dlg-x.on { background: var(--ink); color: var(--surface); }
.drawer-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.42); backdrop-filter: blur(2px); z-index: 100; display: flex; justify-content: flex-end; }
/* 640px, not 720. The Create Widget cards are a fixed 4 per row, so the panel's width
   IS the card's width — at 720 each card was 160px around a 64px icon and the artwork
   swam in it. 640 pulls the card in to ~140 with the icon untouched.
   It cannot go much lower: the tab strip (Create Widget → Archive) measures 622px, and
   the active tab is bold, so its width shifts as you switch tabs — hence the headroom.
   Below that the strip scrolls horizontally, which costs more than the cards gain. */
.aw { width: 640px; max-width: 96vw; height: 100%; background: var(--picker-bg); box-shadow: var(--sh-lg); display: flex; flex-direction: column; overflow: hidden; animation: slideIn .22s cubic-bezier(.2,.8,.2,1); }
@keyframes slideIn { from { transform: translateX(30px); opacity: .4; } to { transform: translateX(0); opacity: 1; } }
.ic { width: 34px; height: 32px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.ic:hover { background: var(--surface-2); color: var(--ink); }
/* five labels are wider than the drawer, so the strip scrolls sideways rather than
   clipping the last tab — same treatment as the dashboard listing's tabs */
.aw-tabs { display: flex; gap: 4px; padding: 0 22px; border-bottom: 1px solid var(--border); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
.aw-tabs::-webkit-scrollbar { display: none; }
.awt { flex: none; }
.awt { display: inline-flex; align-items: center; gap: 5px; border: none; background: transparent; padding: 10px 4px; margin-right: 14px; font-weight: 500; font-size: 13px; color: var(--muted); border-bottom: 2px solid transparent; }
.awt:hover { color: var(--ink); }
.awt.on { color: var(--primary-700); border-bottom-color: var(--primary); }
.awt-count { font-size: 11px; font-weight: 700; background: var(--red-soft); color: var(--red); border-radius: 999px; padding: 0 6px; }
/* the search sits ABOVE the tab strip and spans the drawer — a control that governs the
   tabs cannot be narrower than they are, or it reads as one more filter beside them */
.aw-search { padding: 12px 22px 14px; }
.srch-x { width: 20px; height: 20px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; flex: none; }
.srch-x:hover { background: var(--surface-2); color: var(--ink); }
.srch { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--r); padding: 0 11px; height: 36px; flex: 1; }
.srch input { border: none; outline: none; background: transparent; width: 100%; font-size: 13px; }
.modsel { width: 148px; flex: none; }
/* section 10.1 content tabs — underline, no fill. Every tab carries a transparent 2px
   bottom border so selection does not shift the row. */
/* PILLS, as the reference draws them — not the underline row this was.

   These are a FILTER over one list, not a second level of navigation. The tab strip
   above already switches what you are looking at; a second underline row directly
   under it read as two navigations of equal weight stacked on each other, and you
   had to work out which one owned the content. A pill sits ON the list it filters. */
.type-tabs { display: flex; align-items: center; gap: 7px; padding: 12px 22px 2px; }
.tt-sp { flex: 1; }
/* Measured off the frame: 30px tall, 6px/8px padding, 4px gap, 12px/500 label, and a
   6px radius. 6 is off our 2/4/8/12 radius scale — the design file asks for it here and
   the ask was fidelity to the file, so it is stated as a literal rather than dressed up
   as a token it is not. */
.ttab { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 6px 8px; border: 1px solid var(--border-control); background: var(--surface); color: var(--muted); border-radius: 6px; font-size: 12px; font-weight: 500; white-space: nowrap; transition: color .15s, border-color .15s; }
.ttab:hover { color: var(--ink); border-color: var(--muted-2); }
.ttab.on { border-color: var(--ink); color: var(--ink); font-weight: 600; }
/* Archive shares the pill shape with the type filters but is not one of them — those
   narrow the list, this leaves it for a different list entirely. The gap before it, the
   icon, and the FILLED active state (the type filters only outline) are what say so.

   Both selectors below carry three classes on purpose. `.arc.on` ties with `.ttab.on`
   on specificity and loses on source order, which is how this first shipped: --ink text
   on an --ink fill, a solid black pill with an invisible label inside it. */
.ttab.arc { gap: 5px; }
.ttab.arc.on { background: var(--ink); border-color: var(--ink); color: var(--surface); }
.ttab.arc.on .ttab-c { background: var(--surface); color: var(--ink); }
/* section 7.4 count badge: rounded-sm, never a pill — and no white-on-ink to invert in dark */
/* The count rides inside the pill and INVERTS on the active one — that inversion is
   what makes the chosen filter readable without colouring the whole pill.
   On an inactive pill the number stays --ink even though its label is muted: the label
   says which filter, the number is data, and greying the data too made the row look
   disabled in the frame comparison. */
.ttab-c { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; background: var(--surface-2); color: var(--ink); border-radius: var(--r-pill); padding: 1px 4px; }
.ttab.on .ttab-c { background: var(--ink); color: var(--surface); padding: 2px 3px; }
.aw-body { flex: 1; overflow: auto; padding: 14px 22px 22px; }
.cat { margin-bottom: 18px; }
.cat-h { font-size: 13px; color: var(--muted); font-weight: 500; margin: 6px 0 10px; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
/* §9.2 clickable / module card. Three things follow from that section:
   · it sits on --surface, not the grey --surface-2 — a card IS the surface, and a grey
     one on a white drawer reads as disabled rather than as pickable;
   · 8px, because a card is a SURFACE and only controls are 4px (§3.1) — this was the
     one clickable card in the app still wearing a control's corner;
   · hover is a primary border plus the guide's lift shadow, not a colour wash. The
     wash tinted the whole card blue and the icon lost its own contrast against it.
   The icon keeps --muted at rest and takes the primary on hover, per §5. */
/* White card, hairline border, on the sunken ground. The fill and the ground were the
   other way round — a tinted card on a near-white panel — which gave the grid very little
   separation, since the two surfaces were four steps apart. A white card against
   #f6f9fc is the ordinary card-on-ground relationship and the tiles read as objects.

   --picker-ico drives the artwork: the icon ramp resolves from currentColor, so one
   token sets all three depth steps of every glyph. */
/* The CARD keeps its size and the artwork grows inside it: 64 -> 88px in a block that was
   and stays 138x133. The room comes from the vertical padding, 20 -> 10 — an icon this size
   needs less framing, not more, and the card was mostly padding before. min-height pins the
   height so a one-line and a two-line label still produce identical tiles. */
.tc { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 10px 12px; min-height: 133px; border: 1px solid var(--picker-tile-border); background: var(--surface); border-radius: var(--r-lg); color: var(--picker-ico); transition: border-color .15s, box-shadow .15s; }
.tc:hover { border-color: var(--muted-2); box-shadow: var(--sh-sm); }
.tc-group { border-style: dashed; border-color: var(--border-strong); }
.tc-ico { width: 88px; height: 88px; display: grid; place-items: center; }
/* the label is READ, so it holds the primary ink while the icon stays quiet beside it */
/* the LABEL stays --ink: it is text and has to stay readable, while the artwork beside
   it is decoration and can sit back at --picker-ico */
.tc-label { font-size: 13px; font-weight: 500; color: var(--ink); }

/* search-result section headings — the module, and how many it holds */
.lsec + .lsec { margin-top: 16px; }
.lsec-h { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; letter-spacing: .02em; text-transform: uppercase; color: var(--muted); margin: 2px 0 8px; }
.lsec-n { font-size: 10px; font-weight: 600; background: var(--surface-2); color: var(--ink); border-radius: var(--r-pill); padding: 1px 6px; letter-spacing: 0; }
.res-h { font-size: 13px; color: var(--muted); margin: 0 0 12px; }
.lst { display: flex; flex-direction: column; gap: 2px; }
/* A row is two lines now (title + description), so it is a card-sized object rather than
   a line of text — hence the white surface and the hairline, matching the type cards on
   the Create Widget tab. gap drops 12 -> 10 because the icon between the checkbox and the
   title adds a third column to the row. */
.lrow { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--picker-tile-border); }
.lst { gap: 6px; }
/* the artwork block. 34px inside a 40px well: the icons are drawn on a 64 artboard with
   their own margins, so a tight well would crop the visual weight rather than the box. */
.lt-ico { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: var(--r); background: var(--picker-bg); color: var(--picker-ico); }
.lrow:hover { border-color: var(--muted-2); box-shadow: var(--sh-sm); }
.lrow.sel { background: var(--primary-softer); border-color: var(--primary); }
.lrow.sel .lt-ico { background: var(--surface); }
.lrow.placed { opacity: .72; }
.lrow.placed .lcb { cursor: not-allowed; }
.placed-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: var(--green); background: var(--green-soft); padding: 1px 7px 1px 5px; border-radius: 999px; flex: none; }
.lcb { width: 16px; height: 16px; accent-color: var(--primary); flex: none; cursor: pointer; margin: 0; }
.lt-main { flex: 1; min-width: 0; }
.lt-name-row { display: flex; align-items: center; gap: 7px; } .lt-name { font-weight: 600; font-size: 13px; }
/* the description, one line and clipped. It is context, not content — a wrapping
   description would make rows of different heights out of a list you scan by rhythm. */
.lt-desc { font-size: 12px; color: var(--muted); margin-top: 1px; line-height: 1.45; }
/* One tag class, two meanings (module while browsing, source tab while searching), because
   they never appear together — a row shows whichever fact the page is not already showing. */
.row-tag { flex: none; font-size: 11px; font-weight: 500; border-radius: var(--r); padding: 1px 6px; white-space: nowrap; }
.row-tag.mod { background: var(--surface-2); color: var(--muted); }
.row-tag.src { background: var(--primary-softer); color: var(--primary-700); }
/* on a type card the source tag is a caption under the label, not a chip beside it */
.tc .row-tag { margin-top: -2px; }
/* left-pointing tooltip (teleported, fixed to viewport) */
/* surface, padding and colour come from .tt now — only the placement is local */
/* No fixed width any more. 232px was sized for a sentence; holding two short tags it left
   most of the box empty, which reads as a tooltip that failed to load rather than one that
   is simply short. It shrinks to its contents now, so the two tags sit on one line. */
.lib-tip { position: fixed; z-index: 200; transform: translateY(-50%); display: flex; align-items: center; gap: 5px; pointer-events: none; white-space: nowrap; }
/* provenance as a tag under the description — mirrors WidgetCard's .tt-tag */
.lib-tip-arrow { position: absolute; left: 100%; top: 50%; transform: translateY(-50%); border: 6px solid transparent; border-left-color: #030213; }
/* Hover actions (Duplicate / Edit / Delete) — each in its own outlined box rather than a
   bare glyph, so on a tinted hovered row they still read as three separate buttons. Delete
   is red at rest, not only on its own hover: it is the one action here you cannot undo. */
.lt-acts { display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity .12s; }
.lrow:hover .lt-acts { opacity: 1; }
.lt-acts.always { opacity: 1; }
.trash-ic { width: 16px; display: inline-grid; place-items: center; color: var(--muted-2); flex: none; }
.la { width: 28px; height: 28px; border: 1px solid var(--border-strong); background: var(--surface); color: var(--ink-2); border-radius: 4px; display: grid; place-items: center; }
.la:hover { border-color: var(--primary); color: var(--primary-700); background: var(--primary-softer); }
.la.del { color: var(--red); }
.la.del:hover { color: var(--red); border-color: var(--red); background: var(--red-soft); }
/* delete confirmation modal */
.cf-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.5); backdrop-filter: blur(2px); z-index: 130; display: grid; place-items: center; padding: 24px; }
.cf { width: min(400px, 92vw); background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--sh-lg); padding: 24px; text-align: center; }
.cf-ico { width: 48px; height: 48px; border-radius: 50%; background: var(--red-soft); color: var(--red); display: grid; place-items: center; margin: 0 auto 14px; }
.cf h4 { margin: 0 0 6px; font-size: 16px; }
.cf p { margin: 0 0 18px; font-size: 13px; color: var(--muted); line-height: 1.5; }
.cf-btns { display: flex; justify-content: center; gap: 10px; }
.cf-del { background: var(--red); border-color: var(--red); color: #fff; }
.cf-del:hover { background: #c73f34; border-color: #c73f34; }
/* multi-select footer */
.selinfo { font-size: 13px; font-weight: 500; color: var(--muted); }
.fbtns { display: flex; gap: 10px; }
.slideup-enter-active, .slideup-leave-active { transition: transform .2s ease, opacity .2s ease; }
.slideup-enter-from, .slideup-leave-to { transform: translateY(100%); opacity: 0; }
.none { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--muted-2); padding: 54px 20px; text-align: center; }
.none-t { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.none-h { font-size: 13px; color: var(--muted); max-width: 300px; }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
