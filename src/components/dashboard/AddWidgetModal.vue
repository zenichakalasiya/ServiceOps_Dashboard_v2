<script setup>
import { ref, computed, watch } from 'vue'
import Icon from '../ui/Icon.vue'
import Dropdown from '../ui/Dropdown.vue'
import ChartIcon from '../ui/ChartIcon.vue'
import WidgetBuilderModal from './WidgetBuilderModal.vue'
import { store, addTilesToDashboard, removeLibTileForever, toast } from '../../store/index.js'
import { uid } from '../../data/mock.js'
import { groupPickerTypes } from '../../data/chartTypes.js'
const props = defineProps({ d: Object, group: { type: String, default: null } })
const emit = defineEmits(['close', 'created', 'newgroup'])
function tagGroup(id) { if (props.group && id != null) { const t = props.d.tiles.find((x) => x.id === id); if (t) t.group = props.group } }

const tab = ref('chart')              // chart | predefined | user | shared
/* There is no Archive. It was a header button, then a mode of the Created-by-me tab, and
   now it is gone — which means Delete has to be a REAL delete, not a soft one. A
   soft-delete with nowhere to see the result is worse than either: the item leaves the
   list, the copy says "moved to Trash", and there is no Trash. So `deleteLibTile` /
   `restoreLibTile` are no longer imported and Delete opens the confirm that was already
   here for "delete forever". Destructive, named, and confirmed — the pattern the rest of
   the app already uses (components/ui/ConfirmDialog.vue). */
// The search box sits under the tab strip and only on the three reuse tabs — Create Widget
// has nothing to search (it's a fixed grid of chart types). It filters the ACTIVE tab only,
// same as the type pills and module dropdown beside it, so all three read as one filter row.
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
/* GROUPS is rendered straight — Create Widget has no search box, so there is nothing to
   narrow it by. */

// ---- Reuse tabs: listing with actions ----
const provMap = { predefined: 'predefined', user: 'user', shared: 'shared' }
/* The All tab is gone — each remaining tab is one provenance, and the per-item rules below
 * still read `l.prov` rather than the tab, since a tab-keyed rule would offer Delete on a
 * predefined tile the moment a predefined item ever showed up outside its own tab. */
const inTab = (l) => l.prov === provMap[tab.value] && !l.trashed

/* Search is scoped to the active tab, same as the type pills and module dropdown —
 * description and module match too, since you rarely remember what a saved widget was
 * called. All three read as one filter row, so they all apply together. */
const q = computed(() => search.value.trim().toLowerCase())
const searching = computed(() => q.value.length > 0)
function hitText(v) { return !!v && v.toLowerCase().includes(q.value) }
function hitSearch(l) { return !searching.value || hitText(l.title) || hitText(l.desc) || hitText(l.module) }

/* Module counts must describe WHAT YOU WILL GET, so they are scoped to the tab, the type
 * filter and the search text you already have on. They used to count the whole library, so
 * "Request (20)" on the Created-by-me tab would open three rows — the badge and the
 * result disagreed. A module with nothing in the current tab isn't offered at all;
 * a filter that can only ever return nothing isn't a filter.
 * "All modules" carries no count: it is the absence of a filter, not a bucket. */
const moduleBase = computed(() => {
  let arr = store.library.filter(inTab).filter(hitSearch)
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
const list = computed(() => {
  let arr = store.library.filter(inTab).filter(hitSearch)
  if (fType.value) arr = arr.filter((l) => l.type === fType.value)
  if (fModule.value) arr = arr.filter((l) => l.module === fModule.value)
  return arr
})
// per-type counts for the current tab (before the type filter is applied)
const typeCounts = computed(() => {
  const inMod = (l) => !fModule.value || l.module === fModule.value
  const base = store.library.filter((l) => inTab(l) && inMod(l)).filter(hitSearch)
  return { '': base.length, kpi: base.filter((l) => l.type === 'kpi').length, chart: base.filter((l) => l.type === 'chart').length, shortcut: base.filter((l) => l.type === 'shortcut').length }
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

// ---- quick add: one click places the tile at the end of the board, drawer stays open ----
// a library item already on this dashboard can't be added again — its add icon is
// replaced by a static "already added" mark instead
function isPlaced(l) { return props.d.tiles.some((t) => t.title === l.title && t.type === l.type) }
function quickAdd(l) {
  if (isPlaced(l)) return
  const before = props.d.tiles.length
  addTilesToDashboard(props.d, [l])
  if (props.group) for (let i = before; i < props.d.tiles.length; i++) props.d.tiles[i].group = props.group
  toast(`Added “${l.title}” to the dashboard`, 'success')
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

// ---- Delete removes the definition from the library, behind a confirm ----
const delTarget = ref(null)
function delLib(l) { delTarget.value = l }
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

const TYPE_LABEL = { kpi: 'KPI', chart: 'Widget', shortcut: 'Shortcut' }

/* The placement count and its "Placed on" popover were removed from this listing.
 * `libUsage` still exists in the store for anywhere that wants the impact view. */
/* There is NO hover tooltip on a row. It carried the type and the provenance, and neither
   turned out to need it: the type is drawn as the row's artwork, and the provenance is the
   tab you are standing in. A tooltip whose content is already on the page costs a hover to
   learn nothing. */
const TAB_LABEL = { predefined: 'Predefined', user: 'Created by me', shared: 'Shared with me' }
const emptyMsg = computed(() => {
  const plural = fType.value ? (fType.value === 'kpi' ? 'KPIs' : TYPE_LABEL[fType.value] + 's') : 'items'
  return `No ${plural} in ${TAB_LABEL[tab.value] || 'this tab'} yet.`
})
const emptyHelp = computed(() => {
  if (tab.value === 'shared') return 'Widgets, KPIs and Shortcuts shared with you will appear here.'
  if (tab.value === 'user') return 'Create one from the Create Widget tab, then it appears here.'
  return 'Predefined tiles curated by your admin will appear here.'
})
watch([tab], () => { search.value = ''; fModule.value = ''; fType.value = '' })
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

      <!-- top tabs. No All, no Archive. -->
      <div class="aw-tabs">
        <button v-for="t in TABS" :key="t.v" class="awt" :class="{ on: tab === t.v }" @click="goTab(t.v)">{{ t.label }}</button>
      </div>

      <!-- Search sits under the tabs and only on the three reuse tabs — Create Widget is a
           fixed grid of chart types, nothing to search. It filters the ACTIVE tab only, same
           scope as the type pills and module dropdown right below it. -->
      <div v-if="tab !== 'chart'" class="aw-search">
        <div class="srch">
          <Icon name="search" :size="15" class="muted" />
          <input v-model="search" placeholder="Search widgets, KPIs and Shortcuts…" />
          <button v-if="searching" class="srch-x" title="Clear search" @click="search = ''"><Icon name="x" :size="14" /></button>
        </div>
      </div>

      <!-- Per-tab filters: type pills and module. -->
      <div v-if="tab !== 'chart'" class="type-tabs" role="tablist">
        <button
          v-for="t in TYPE_FILTERS" :key="t.v" class="ttab" :class="{ on: fType === t.v }"
          role="tab" :aria-selected="fType === t.v" @click="fType = t.v"
        >{{ t.label }} <span class="ttab-c">{{ typeCounts[t.v] }}</span></button>
        <span class="tt-sp" />
        <div v-if="fType !== 'shortcut'" class="modsel"><Dropdown v-model="fModule" :options="moduleOptions" placeholder="All modules" /></div>
      </div>

      <div class="aw-body">
        <!-- CHART TYPE: category card grid → opens centered builder -->
        <template v-if="tab === 'chart'">
          <section v-for="g in GROUPS" :key="g.cat" class="cat">
            <div class="cat-h">{{ g.cat }}</div>
            <div class="cards">
              <!-- illustrated icons, not Material glyphs: at 40px a chart type is a
                   picture of the chart, and the three-step opacity ramp is what makes
                   Bar / Column / Stacked / Histogram tell themselves apart. No rot90 —
                   Bar has its own horizontal artwork now. -->
              <button v-for="t in g.types" :key="t.id" class="tc" @click="builder = t">
                <div class="tc-ico"><ChartIcon :name="t.id" :size="64" /></div>
                <span class="tc-label">{{ t.label }}</span>
              </button>
            </div>
          </section>
          <!-- Empty Group is the last option (charts come first) -->
          <section class="cat">
            <div class="cat-h">Empty group</div>
            <div class="cards">
              <button class="tc tc-group" @click="emit('newgroup')">
                <div class="tc-ico"><ChartIcon name="group" :size="64" /></div>
                <span class="tc-label">Empty Group</span>
              </button>
            </div>
          </section>
        </template>

        <!-- THE LISTING — the active tab, filtered by type pill / module / search. -->
        <template v-else-if="list.length">
          <div v-if="searching" class="res-h">{{ list.length }} {{ list.length === 1 ? 'result' : 'results' }} for “{{ search.trim() }}”</div>
          <div class="lst">
            <!-- Each row is a static card — clicking it does nothing on its own. The
                 actions (add / duplicate / edit / delete) live in `.lt-acts` and appear
                 on hover, Add first from the left since it's the one action this list
                 exists for. A row already on the dashboard swaps that whole group for a
                 static "already added" mark instead of a click target. -->
            <div v-for="l in list" :key="l.id" class="lrow" :class="{ placed: isPlaced(l) }">
              <!-- the artwork of the chart this row actually draws. It replaces the words
                   "Widget" / "KPI" / "Shortcut", which used to open the meta line and now
                   have nowhere to sit — a picture of the thing reads faster than its name
                   anyway, and the name is still on hover for when it doesn't. -->
              <span class="lt-ico"><ChartIcon :name="libIcon(l)" :size="34" /></span>
              <div class="lt-main">
                <div class="lt-name-row">
                  <span class="lt-name ellip">{{ l.title }}</span>
                  <span class="row-tag mod">{{ l.module }}</span>
                </div>
                <!-- Falls back to the type and module for an item saved without a
                     description — an empty second line would collapse the row to a
                     different height than its neighbours, for no gain. -->
                <div class="lt-desc ellip">{{ l.desc || (TYPE_LABEL[l.type] + ' · ' + l.module) }}</div>
              </div>
              <!-- Add / Duplicate / Edit / Delete. Outlined glyphs, as everywhere else in
                   the app — what carries the weight is the button's FILL, not the glyph.
                   See .la. Add is first from the left and reads primary, since it's the
                   one action this whole list exists for. -->
              <div class="lt-acts" :class="{ always: isPlaced(l) }">
                <span v-if="isPlaced(l)" class="la-added" title="Already on this dashboard"><Icon name="check" :size="14" /></span>
                <template v-else>
                  <button class="la la-add" title="Add to dashboard" @click="quickAdd(l)"><Icon name="plus" :size="15" /></button>
                  <button v-if="canDuplicate(l)" class="la" title="Duplicate" @click="openLibBuilder(l)"><Icon name="copy" :size="15" /></button>
                  <button v-if="canEdit(l)" class="la" title="Edit" @click="openLibBuilder(l)"><Icon name="edit" :size="15" /></button>
                  <button v-if="canDelete(l)" class="la del" title="Delete" @click="delLib(l)"><Icon name="trash" :size="15" /></button>
                </template>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="searching" class="none"><Icon name="search" :size="24" /><p class="none-t">Nothing matches “{{ search.trim() }}” in {{ TAB_LABEL[tab] }}.</p><span class="none-h">Try a shorter word, or clear the type / module filter.</span></div>
        <div v-else class="none"><Icon name="inbox" :size="24" /><p class="none-t">{{ emptyMsg }}</p><span class="none-h">{{ emptyHelp }}</span></div>
      </div>

      <footer class="dlg-foot">
        <span />
        <div class="fbtns"><button class="btn" @click="emit('close')">Cancel</button></div>
      </footer>
    </div>

    <!-- Centered builder — create from Chart type -->
    <WidgetBuilderModal v-if="builder" :d="d" :type="builder" @close="builder = null" @created="onCreated" @savedToLibrary="onSavedToLibrary" />
    <!-- Centered builder — duplicate/edit a library tile (Update returns a copy to the listing) -->
    <WidgetBuilderModal v-if="libBuilder" :d="d" :type="libBuilder.type" :libItem="libBuilder.item" @close="libBuilder = null" @librarySaved="onLibrarySaved" />

    <!-- The "Placed on" popover lived here. It hung off the usage badge, which was its
         only trigger, so it went when the count did rather than staying as unreachable
         code. If the impact view is wanted back it needs a trigger of its own. -->

    <!-- Delete confirmation -->
    <teleport to="body">
      <div v-if="delTarget" class="cf-overlay" @click.self="delTarget = null">
        <div class="cf">
          <div class="cf-ico"><Icon name="trash" :size="22" /></div>
          <h4>Delete “{{ delTarget.title }}”?</h4>
          <p>This removes the definition from the library for everyone. Copies already placed on a dashboard keep working. This can’t be undone.</p>
          <div class="cf-btns">
            <button class="btn" @click="delTarget = null">Cancel</button>
            <button class="btn cf-del" @click="confirmDel"><Icon name="trash" :size="15" /> Delete</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.hd-a { display: flex; align-items: center; gap: 8px; }
.drawer-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.42); backdrop-filter: blur(2px); z-index: 100; display: flex; justify-content: flex-end; }
/* 640px, not 720. The Create Widget cards are a fixed 4 per row, so the panel's width
   IS the card's width — at 720 each card was 160px around a 64px icon and the artwork
   swam in it. 640 pulls the card in to ~140 with the icon untouched.
   It cannot go much lower: the tab strip (Create Widget → Archive) measures 622px, and
   the active tab is bold, so its width shifts as you switch tabs — hence the headroom.
   Below that the strip scrolls horizontally, which costs more than the cards gain. */
/* WHITE, with the boxes tinted — the reverse of how this started. A tinted panel carrying
   white cards makes the panel the figure and the cards the holes in it; on white, each box
   is an object sitting on a page. The drawer is also the biggest surface on screen when it
   is open, so it is the one that should be the quietest. */
.aw { width: 640px; max-width: 96vw; height: 100%; background: var(--surface); box-shadow: var(--sh-lg); display: flex; flex-direction: column; overflow: hidden; animation: slideIn .22s cubic-bezier(.2,.8,.2,1); }
@keyframes slideIn { from { transform: translateX(30px); opacity: .4; } to { transform: translateX(0); opacity: 1; } }
.ic { width: 34px; height: 32px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.ic:hover { background: var(--surface-2); color: var(--ink); }
/* five labels are wider than the drawer, so the strip scrolls sideways rather than
   clipping the last tab — same treatment as the dashboard listing's tabs */
/* 16px, on every side of the drawer. .dlg-head and .dlg-foot are the shared dialog chrome
   and carry 22px of their own, so they are overridden here rather than in global.css —
   every other dialog in the app still wants the wider inset.

   Only the values that ARE an edge take 16. The 8px under the header and the 12px under the
   search are gaps BETWEEN bands, not insets; moving them with the edge would have closed the
   bands up instead of widening the margin. */
.aw .dlg-head { padding: 16px 16px 8px; }
.aw .dlg-foot { padding: 16px; }
.aw-tabs { display: flex; gap: 4px; padding: 0 16px; border-bottom: 1px solid var(--border); overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
.aw-tabs::-webkit-scrollbar { display: none; }
.awt { flex: none; }
.awt { display: inline-flex; align-items: center; gap: 5px; border: none; background: transparent; padding: 10px 4px; margin-right: 14px; font-weight: 500; font-size: 13px; color: var(--muted); border-bottom: 2px solid transparent; }
.awt:hover { color: var(--ink); }
.awt.on { color: var(--primary-700); border-bottom-color: var(--primary); }
.awt-count { font-size: 11px; font-weight: 700; background: var(--red-soft); color: var(--red); border-radius: 999px; padding: 0 6px; }
/* More air above the search box than below it: it needs to read as its own band under
   the tab strip's border, while the type pills right below already carry their own
   12px top padding — stacking two generous gaps there would double the space the two
   controls need to read as adjacent, not separate. */
.aw-search { padding: 18px 16px 4px; }
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
.type-tabs { display: flex; align-items: center; gap: 7px; padding: 12px 16px 0; }
.tt-sp { flex: 1; }
/* Measured off the frame: 30px tall, 6px/8px padding, 4px gap, 12px/500 label, and a
   6px radius. 6 is off our 2/4/8/12 radius scale — the design file asks for it here and
   the ask was fidelity to the file, so it is stated as a literal rather than dressed up
   as a token it is not. */
.ttab { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 6px 8px; border: 1px solid var(--border-control); background: var(--surface); color: var(--muted); border-radius: 6px; font-size: 12px; font-weight: 500; white-space: nowrap; transition: color .15s, border-color .15s; }
.ttab:hover { color: var(--ink); border-color: var(--muted-2); }
.ttab.on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-700); font-weight: 600; }
/* section 7.4 count badge: rounded-sm, never a pill — and no white-on-ink to invert in dark */
/* The count rides inside the pill and INVERTS on the active one — that inversion is
   what makes the chosen filter readable without colouring the whole pill.
   On an inactive pill the number stays --ink even though its label is muted: the label
   says which filter, the number is data, and greying the data too made the row look
   disabled in the frame comparison. */
.ttab-c { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; background: var(--surface-2); color: var(--ink); border-radius: var(--r-pill); padding: 1px 4px; }
.ttab.on .ttab-c { background: var(--primary); color: #fff; padding: 2px 3px; }
.aw-body { flex: 1; overflow: auto; padding: 16px; }
.cat { margin-bottom: 18px; }
.cat-h { font-size: 13px; color: var(--muted); font-weight: 500; margin: 6px 0 10px; }
/* fixed-width cards (see .tc) — as many per row as the drawer fits, no stretching */
.cards { display: grid; grid-template-columns: repeat(auto-fill, 114px); gap: 12px; }
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
/* No resting outline — the fill alone makes the tile. It keeps a TRANSPARENT 1px border
   rather than none, so the hover edge costs no reflow: dropping the border outright would
   have every tile in the grid shift 1px as the cursor crossed it.

   0.625rem, the same corner the listing cards take. Both are the picker's "a thing you can
   choose", and they are the only two shapes in the module wearing it.

   Hover is the primary edge now, not --muted-2 — the same edge the listing cards answer
   with, since blue is the module's one accent. */
/* 2026-09-24: the artwork is 64px (was 88) and the CARD shrinks with it, keeping the same
   frame around the icon — 25px each side, ~10px above and below the icon+label stack — so
   114×109 where it was 138×133. */
.tc { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 114px; padding: 10px 6px; min-height: 109px; border: 1px solid transparent; background: var(--picker-tile-fill); border-radius: 0.625rem; color: var(--picker-ico); transition: border-color .15s, box-shadow .15s; }
.tc:hover { border-color: var(--primary); box-shadow: var(--sh-sm); }
/* Empty Group KEEPS its edge. It is the one tile whose border is not decoration — a dashed
   outline around nothing is what "empty" looks like, and it is the only tile here that adds
   a container rather than a widget. */
.tc-group { border-style: dashed; border-color: var(--border-strong); }
.tc-ico { width: 64px; height: 64px; display: grid; place-items: center; }
/* the label is READ, so it holds the primary ink while the icon stays quiet beside it */
/* the LABEL stays --ink: it is text and has to stay readable, while the artwork beside
   it is decoration and can sit back at --picker-ico */
.tc-label { font-size: 13px; font-weight: 500; color: var(--ink); }

.res-h { font-size: 13px; color: var(--muted); margin: 0 0 12px; }
.lst { display: flex; flex-direction: column; gap: 12px; }
/* A row is two lines now (title + description), so it is a card-sized object rather than
   a line of text — hence the white surface and the hairline, matching the type cards on
   the Create Widget tab. */
/* WHITE and outlined, on the white drawer — the edge is what makes it a card here, not a
   fill. The chart-type tiles keep their tint, and the difference is deliberate: a tile is
   133px of mostly-artwork and needs a ground to sit the drawing on, while a row is 62px of
   mostly-text, where a tint behind the text is just less contrast. */
/* 0.625rem = 10px, stated as the literal it is. Our radius scale is 2/4/8/12 and this is
   none of them, so it gets no token — a var() named after a tier it does not belong to is
   how an off-scale value quietly becomes the scale. Same treatment as the 6px on .ttab. */
.lrow { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 0.625rem; background: var(--surface); border: 1px solid var(--picker-tile-border); transition: border-color .15s, box-shadow .15s, background .15s; }
/* the artwork block. 34px inside a 40px well: the icons are drawn on a 64 artboard with
   their own margins, so a tight well would crop the visual weight rather than the box. */
.lt-ico { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: var(--r); background: var(--picker-tile-fill); color: var(--picker-ico); }
/* A row already on the board is an ORDINARY card, same fill, same edge — its only tell is
   the static green "already added" mark that replaces the action icons. */
.lrow.placed { cursor: default; }
.lt-main { flex: 1; min-width: 0; }
.lt-name-row { display: flex; align-items: center; gap: 7px; } .lt-name { font-weight: 600; font-size: 13px; }
/* The tag sits BESIDE the title now, not at the right edge of the column. Beside it, it reads
   as a property OF the title — proximity is what binds them; right-aligned it read as a
   separate column the row happened to also have. The cost is the ragged right edge that the
   alignment was buying, and that is the trade, made deliberately.

   min-width: 0 is what lets a long title shrink and ellipsis instead of shoving the tag off
   the right — a nowrap span's min-content width is its whole text. */
.lt-name { flex: 0 1 auto; min-width: 0; }
/* the description, one line and clipped. It is context, not content — a wrapping
   description would make rows of different heights out of a list you scan by rhythm. */
.lt-desc { font-size: 12px; color: var(--muted); margin-top: 1px; line-height: 1.45; }
.row-tag { flex: none; font-size: 11px; font-weight: 500; border-radius: var(--r-sm); padding: 1px 6px; white-space: nowrap; }
/* A minimal chip: the badge radius (--r-sm, 2px per the guide), the quiet fill, no border. */
.row-tag.mod { background: var(--surface-2); color: var(--muted); border-radius: var(--r-sm); }
/* the row tooltip and its arrow were deleted here — see the note by TYPE_LABEL */
/* surface, padding and colour come from .tt now — only the placement is local */

/* Hover actions (Duplicate / Edit / Delete) — each in its own outlined box rather than a
   bare glyph, so on a tinted hovered row they still read as three separate buttons. Delete
   is red at rest, not only on its own hover: it is the one action here you cannot undo. */
/* focus-within as well as hover: these are the only actions on the row, and reaching them
   by keyboard should not require a mouse to be somewhere. */
/* A FIXED gutter, four buttons wide (Add + Duplicate + Edit + Delete), whether or not this
   row has all four. The action count is per-provenance — Predefined offers Add + Duplicate
   only, your own offers all four — so a gutter that sized itself to its contents put the
   tag column in a different place on every row. The column only reads as a column if it is
   one. Rows with fewer actions right-align into it. */
.lt-acts { display: flex; align-items: center; justify-content: flex-end; gap: 6px; width: 130px; flex: none; opacity: 0; transition: opacity .12s; }
.lrow:hover .lt-acts, .lrow:focus-within .lt-acts { opacity: 1; }
.lt-acts.always { opacity: 1; }
/* FILLED, not outlined — the box is solid and the glyph inside it stays a stroke. An
   outlined box around an outlined glyph is two outlines competing to be the button, which
   is what these were; filling the box settles it, and the glyph goes back to matching every
   other icon in the app. The fill is --surface: the row it sits on is tinted now, so white
   is the step that reads as a raised control on it.

   Delete is red at REST, not only on its own hover. It is the one action here you cannot
   undo, and a colour that appears only once you are already pointing at it is a warning
   that arrives after the decision.

   --surface-2, not --surface: the row went back to white, so the button has to be the darker
   step to read as a control on it. */
.la { width: 28px; height: 28px; border: none; background: var(--surface-2); color: var(--ink-2); border-radius: var(--r); display: grid; place-items: center; transition: background .12s, color .12s; }
.la:hover { color: var(--primary-700); background: var(--primary-softer); }
.la.del { color: var(--red); }
.la.del:hover { color: var(--red); background: var(--red-soft); }
/* Add is the one action this whole list exists for, so it reads primary at rest rather
   than only on hover like Duplicate/Edit — and it sits first, leftmost of the group. */
.la-add { color: var(--primary-700); background: var(--primary-softer); }
.la-add:hover { background: var(--primary-soft); }
/* The "already added" mark replaces the whole action group for a placed row. It is static
   (no button, no hover state) and stays visible via `.lt-acts.always` — the old ticked
   checkbox's job, now done without a checkbox. */
.la-added { width: 28px; height: 28px; background: var(--green-soft); color: var(--green); border-radius: var(--r); display: grid; place-items: center; }
/* delete confirmation modal */
.cf-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.5); backdrop-filter: blur(2px); z-index: 130; display: grid; place-items: center; padding: 24px; }
.cf { width: min(400px, 92vw); background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--sh-lg); padding: 24px; text-align: center; }
.cf-ico { width: 48px; height: 48px; border-radius: 50%; background: var(--red-soft); color: var(--red); display: grid; place-items: center; margin: 0 auto 14px; }
.cf h4 { margin: 0 0 6px; font-size: 16px; }
.cf p { margin: 0 0 18px; font-size: 13px; color: var(--muted); line-height: 1.5; }
.cf-btns { display: flex; justify-content: center; gap: 10px; }
.cf-del { background: var(--red); border-color: var(--red); color: #fff; }
.cf-del:hover { background: #c73f34; border-color: #c73f34; }
.fbtns { display: flex; gap: 10px; }
.none { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--muted-2); padding: 54px 20px; text-align: center; }
.none-t { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.none-h { font-size: 13px; color: var(--muted); max-width: 300px; }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
