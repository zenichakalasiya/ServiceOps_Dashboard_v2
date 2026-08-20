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

const tab = ref('chart')              // chart | predefined | user | shared | trash
const fModule = ref('')
const fType = ref('')                 // '' | kpi | chart | shortcut
const search = ref('')
const TYPE_FILTERS = [{ v: '', label: 'All' }, { v: 'kpi', label: 'KPI' }, { v: 'chart', label: 'Widget' }, { v: 'shortcut', label: 'Shortcut' }]
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

// KPI and Shortcut join Free Text here: they are the tiles that are not charts.
const GROUPS = [
  ...groupPickerTypes(CHART_CARDS),
  { cat: 'Non-chart', types: [
    { id: 'kpi', label: 'KPI', icon: 'kpi', type: 'kpi', kind: null },
    { id: 'shortcut', label: 'Shortcut', icon: 'table', type: 'shortcut', kind: null },
    { id: 'text', label: 'Free Text', icon: 'chart-text', type: 'text', kind: null },
  ] },
]
const filteredGroups = computed(() => GROUPS.map((g) => ({
  cat: g.cat, types: g.types.filter((t) => t.label.toLowerCase().includes(search.value.toLowerCase())),
})).filter((g) => g.types.length))

// ---- Reuse tabs: listing with actions ----
const provMap = { predefined: 'predefined', user: 'user', shared: 'shared' }
const isTrash = computed(() => tab.value === 'trash')
/* "All" is every live item regardless of who made it. Because it MIXES provenances,
 * nothing downstream may key a rule off the tab — the per-item rules below read
 * `l.prov` instead, so a predefined tile is uneditable in All exactly as it is in
 * its own tab. */
const inTab = (l) => (tab.value === 'all' ? !l.trashed : l.prov === provMap[tab.value] && !l.trashed)

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
  if (search.value.trim()) arr = arr.filter((l) => l.title.toLowerCase().includes(search.value.trim().toLowerCase()))
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
function onLibrarySaved({ title, module, type, sharedAccess, place }) {
  // All / Trash aren't provenance buckets — a copy you made in one of them is yours
  const item = { id: uid('lt'), type, title: uniqueName(title), prov: provMap[tab.value] || 'user', module, favorite: false, sharedAccess: sharedAccess || 'view' }
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
function onSavedToLibrary({ title, module, type, sharedAccess }) {
  const item = { id: uid('lt'), type, title: uniqueName(title), prov: 'user', module, favorite: false, sharedAccess: sharedAccess || 'view' }
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
// short description shown in a left-pointing tooltip on hover of each library row
function libDesc(l) {
  const kind = l.type === 'kpi' ? 'A headline KPI number' : l.type === 'shortcut' ? 'A record list / table' : 'A chart widget'
  return `${kind} from the ${l.module} module.`
}
/* Provenance rides in the tooltip, under the description — the same shape the widget
 * and dashboard info tooltips use. On the row it was a third thing competing with the
 * type and the module for the same line. */
const tip = ref({ show: false, text: '', prov: '', top: 0, right: 0 })
function showTip(l, e) {
  const r = e.currentTarget.getBoundingClientRect()
  tip.value = { show: true, text: libDesc(l), prov: l.prov, top: r.top + r.height / 2, right: window.innerWidth - r.left + 12 }
}
function hideTip() { tip.value.show = false }
const TAB_LABEL = { all: 'All', predefined: 'Predefined', user: 'Created by me', shared: 'Shared with me', trash: 'Archive' }
const emptyMsg = computed(() => {
  const plural = fType.value ? (fType.value === 'kpi' ? 'KPIs' : TYPE_LABEL[fType.value] + 's') : 'items'
  if (isTrash.value) return `Archive is empty.`
  return `No ${plural} in ${TAB_LABEL[tab.value] || 'this tab'} yet.`
})
const emptyHelp = computed(() => {
  if (tab.value === 'trash') return 'Archived widgets, KPIs and Shortcuts land here — restore them, or delete forever.'
  if (tab.value === 'shared') return 'Widgets, KPIs and Shortcuts shared with you will appear here.'
  if (tab.value === 'user') return 'Create one from the Create Widget tab, then it appears here.'
  if (tab.value === 'all') return 'Everything in the library — predefined, yours, and shared with you — appears here.'
  return 'Predefined tiles curated by your admin will appear here.'
})
watch([tab], () => { search.value = ''; fModule.value = ''; fType.value = ''; selected.value = new Set() })
watch(fType, (v) => { if (v === 'shortcut') fModule.value = '' })   // Shortcut listing has no module filter

function onCreated(id) { tagGroup(id); emit('created', id); emit('close') }
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('close')">
    <div class="aw">
      <header class="aw-head">
        <h3>Add New Widget</h3>
        <button class="ic" @click="emit('close')"><Icon name="x" :size="18" /></button>
      </header>

      <!-- top tabs -->
      <div class="aw-tabs">
        <button class="awt" :class="{ on: tab === 'chart' }" @click="tab = 'chart'">Create Widget</button>
        <button class="awt" :class="{ on: tab === 'all' }" @click="tab = 'all'">All</button>
        <button class="awt" :class="{ on: tab === 'predefined' }" @click="tab = 'predefined'">Predefined</button>
        <button class="awt" :class="{ on: tab === 'user' }" @click="tab = 'user'">Created by me</button>
        <button class="awt" :class="{ on: tab === 'shared' }" @click="tab = 'shared'">Shared with me</button>
        <!-- "Archive" in the UI; the state key stays `trash` so nothing downstream moves -->
        <button class="awt" :class="{ on: tab === 'trash' }" @click="tab = 'trash'">Archive <span v-if="trashCount" class="awt-count">{{ trashCount }}</span></button>
      </div>

      <!-- module filter + search (reuse tabs only — the Create Widget tab has no search) -->
      <div v-if="tab !== 'chart'" class="aw-filters">
        <div class="srch"><Icon name="search" :size="15" class="muted" /><input v-model="search" placeholder="Search…" /></div>
        <div v-if="fType !== 'shortcut'" class="modsel"><Dropdown v-model="fModule" :options="moduleOptions" placeholder="All modules" /></div>
      </div>

      <!-- type filter inside a reuse tab. Section 10.1 content tabs, the same switcher the
           detail pages use for their inner sections — not pills. Two rows of pills stacked
           above each other read as two filters of equal weight; an underline row reads as
           a level below the tabs it sits under, which is what it is. -->
      <div v-if="tab !== 'chart'" class="type-tabs" role="tablist">
        <button
          v-for="t in TYPE_FILTERS" :key="t.v" class="ttab" :class="{ on: fType === t.v }"
          role="tab" :aria-selected="fType === t.v" @click="fType = t.v"
        >{{ t.label }} <span class="ttab-c">{{ typeCounts[t.v] }}</span></button>
      </div>

      <div class="aw-body">
        <!-- CHART TYPE: category card grid → opens centered builder -->
        <template v-if="tab === 'chart'">
          <section v-for="g in filteredGroups" :key="g.cat" class="cat">
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
            <div class="cat-h">Layout</div>
            <div class="cards">
              <button class="tc tc-group" @click="emit('newgroup')">
                <div class="tc-ico"><ChartIcon name="group" :size="64" /></div>
                <span class="tc-label">Empty Group</span>
              </button>
            </div>
          </section>
          <div v-if="!filteredGroups.length" class="none">No types match “{{ search }}”.</div>
        </template>

        <!-- REUSE TABS: listing with actions -->
        <template v-else>
          <div v-if="list.length" class="lst">
            <div v-for="l in list" :key="l.id" class="lrow" :class="{ sel: isSel(l), placed: isPlaced(l) }" @mouseenter="showTip(l, $event)" @mouseleave="hideTip">
              <input v-if="!isTrash" type="checkbox" class="lcb" :checked="isSel(l) || isPlaced(l)" :disabled="isPlaced(l)" @change="toggleSel(l)" />
              <span v-else class="trash-ic"><Icon name="trash" :size="15" /></span>
              <div class="lt-main">
                <div class="lt-name-row">
                  <span class="lt-name ellip">{{ l.title }}</span>
                  <!-- No placement count. What matters when you are picking a widget to
                       ADD is whether it is already on THIS board — which is what the tag
                       below says. How many other boards carry it is a governance question,
                       not one this listing has to answer. -->
                  <span v-if="isPlaced(l)" class="placed-tag"><Icon name="check" :size="11" /> On dashboard</span>
                </div>
                <div class="lt-meta">{{ TYPE_LABEL[l.type] }} · {{ l.module }}</div>
              </div>
              <!-- Trash: Restore + Delete forever · other tabs: Duplicate / Edit / Delete -->
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
          <div v-else class="none"><Icon name="inbox" :size="24" /><p class="none-t">{{ emptyMsg }}</p><span class="none-h">{{ emptyHelp }}</span></div>
        </template>
      </div>

      <!-- multi-select footer: Add (n) / Cancel -->
      <transition name="slideup">
        <footer v-if="tab !== 'chart' && selected.size" class="aw-foot">
          <span class="selinfo">{{ selected.size }} selected<span v-if="selected.size >= MAX_SEL"> · max {{ MAX_SEL }}</span></span>
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

    <!-- Row description tooltip — opens to the left of the hovered row, arrow points right -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="tip.show" class="tt lib-tip tt-stack" :style="{ top: tip.top + 'px', right: tip.right + 'px' }">
          <span class="lib-tip-desc">{{ tip.text }}</span>
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
.drawer-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.42); backdrop-filter: blur(2px); z-index: 100; display: flex; justify-content: flex-end; }
/* 640px, not 720. The Create Widget cards are a fixed 4 per row, so the panel's width
   IS the card's width — at 720 each card was 160px around a 64px icon and the artwork
   swam in it. 640 pulls the card in to ~140 with the icon untouched.
   It cannot go much lower: the tab strip (Create Widget → Archive) measures 622px, and
   the active tab is bold, so its width shifts as you switch tabs — hence the headroom.
   Below that the strip scrolls horizontally, which costs more than the cards gain. */
.aw { width: 640px; max-width: 96vw; height: 100%; background: var(--surface); box-shadow: var(--sh-lg); display: flex; flex-direction: column; overflow: hidden; animation: slideIn .22s cubic-bezier(.2,.8,.2,1); }
@keyframes slideIn { from { transform: translateX(30px); opacity: .4; } to { transform: translateX(0); opacity: 1; } }
.aw-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 12px; }
.aw-head h3 { margin: 0; font-size: 17px; }
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
.aw-filters { display: flex; gap: 9px; padding: 14px 22px 6px; }
.srch { display: flex; align-items: center; gap: 8px; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 4px; padding: 0 11px; height: 36px; flex: 1; }
.srch input { border: none; outline: none; background: transparent; width: 100%; font-size: 13px; }
.modsel { width: 172px; flex: none; }
/* section 10.1 content tabs — underline, no fill. Every tab carries a transparent 2px
   bottom border so selection does not shift the row. */
.type-tabs { display: flex; align-items: center; gap: 10px; padding: 10px 22px 0; border-bottom: 1px solid var(--border); }
.ttab { display: inline-flex; align-items: center; gap: 7px; border: none; border-bottom: 2px solid transparent; background: transparent; padding: 0 6px 9px; color: var(--muted); font-size: 14px; font-weight: 500; white-space: nowrap; }
.ttab:hover { color: var(--ink); border-bottom-color: var(--border-strong); }
.ttab.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
/* section 7.4 count badge: rounded-sm, never a pill — and no white-on-ink to invert in dark */
.ttab-c { font-size: 11px; font-weight: 600; background: var(--surface-2); color: var(--muted); border-radius: var(--r-sm); padding: 1px 6px; }
.ttab.on .ttab-c { background: var(--primary-soft); color: var(--primary-700); }
.aw-body { flex: 1; overflow: auto; padding: 14px 22px 22px; }
.cat { margin-bottom: 18px; }
.cat-h { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted-2); font-weight: 600; margin: 6px 0 10px; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
/* §9.2 clickable / module card. Three things follow from that section:
   · it sits on --surface, not the grey --surface-2 — a card IS the surface, and a grey
     one on a white drawer reads as disabled rather than as pickable;
   · 8px, because a card is a SURFACE and only controls are 4px (§3.1) — this was the
     one clickable card in the app still wearing a control's corner;
   · hover is a primary border plus the guide's lift shadow, not a colour wash. The
     wash tinted the whole card blue and the icon lost its own contrast against it.
   The icon keeps --muted at rest and takes the primary on hover, per §5. */
.tc { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 12px; border: 1px solid var(--border); background: var(--surface); border-radius: var(--r-lg); color: var(--muted); transition: border-color .15s, box-shadow .15s, transform .1s, color .15s; }
.tc:hover { border-color: var(--primary); color: var(--primary); box-shadow: var(--sh); transform: translateY(-2px); }
.tc-group { border-style: dashed; border-color: var(--border-strong); }
.tc-ico { width: 64px; height: 64px; display: grid; place-items: center; }
/* the label is READ, so it holds the primary ink while the icon stays quiet beside it */
.tc-label { font-size: 13px; font-weight: 500; color: var(--ink); }
.tc:hover .tc-label { color: var(--primary); }
.lst { display: flex; flex-direction: column; gap: 2px; }
.lrow { display: flex; align-items: center; gap: 12px; padding: 10px 10px; border-radius: 4px; }
.lrow:hover { background: var(--surface-2); }
.lrow.sel { background: var(--primary-softer); }
.lrow.placed { opacity: .72; }
.lrow.placed .lcb { cursor: not-allowed; }
.placed-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: var(--green); background: var(--green-soft); padding: 1px 7px 1px 5px; border-radius: 999px; flex: none; }
.lcb { width: 16px; height: 16px; accent-color: var(--primary); flex: none; cursor: pointer; margin: 0; }
.lt-main { flex: 1; min-width: 0; }
.lt-name-row { display: flex; align-items: center; gap: 7px; } .lt-name { font-weight: 500; font-size: 13px; }
.lt-meta { position: relative; font-size: 12px; color: var(--muted); margin-top: 2px; }
/* left-pointing description tooltip (teleported, fixed to viewport) */
/* surface, padding and colour come from .tt now — only the placement is local */
.lib-tip { position: fixed; z-index: 200; transform: translateY(-50%); width: 232px; pointer-events: none; text-align: left; }
.lib-tip-desc { display: block; color: rgba(255,255,255,.88); }
/* provenance as a tag under the description — mirrors WidgetCard's .tt-tag */
.tt-tag.predefined { background: rgba(139,92,246,.3); border-color: rgba(139,92,246,.55); color: #ded3ff; }
.tt-tag.shared { background: rgba(76,177,254,.26); border-color: rgba(76,177,254,.5); color: #cfe8ff; }
.tt-tag.user { background: rgba(31,157,99,.3); border-color: rgba(31,157,99,.55); color: #b9edd3; }
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
.aw-foot { display: flex; align-items: center; justify-content: space-between; padding: 12px 22px; border-top: 1px solid var(--border); background: var(--surface-2); flex: none; }
.selinfo { font-size: 13px; font-weight: 500; color: var(--muted); }
.fbtns { display: flex; gap: 10px; }
.slideup-enter-active, .slideup-leave-active { transition: transform .2s ease, opacity .2s ease; }
.slideup-enter-from, .slideup-leave-to { transform: translateY(100%); opacity: 0; }
.none { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--muted-2); padding: 54px 20px; text-align: center; }
.none-t { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.none-h { font-size: 13px; color: var(--muted); max-width: 300px; }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
