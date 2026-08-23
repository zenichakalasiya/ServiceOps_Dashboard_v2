<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import ChartTile from './ChartTile.vue'
import DataTable from './DataTable.vue'
import FreeTextTile from './FreeTextTile.vue'
import EmailWidgetModal from './EmailWidgetModal.vue'
import ScheduleDialog from './ScheduleDialog.vue'
import TableFilterBar from './TableFilterBar.vue'
import ConfirmDialog from '../ui/ConfirmDialog.vue'
import TimeRangePopover, { rectOf } from './TimeRangePopover.vue'
import { typesFor, isFrozen, frozenReason, whyDisabled } from '../../data/chartTypes.js'
import { conditionFields, matchesConds } from '../../data/filters.js'
import { windowFor, relativeFor, stampFor } from '../../data/timeRanges.js'
import { widgetBrief } from '../../data/aiEngine.js'
import { store, toast } from '../../store/index.js'
// `group` is the group object this tile sits in, or null when it is out on the canvas.
// It is what makes a group-level date filter inheritable — see the date block below.
const props = defineProps({ tile: Object, edit: Boolean, group: { type: Object, default: null } })
// Per-widget AI: HOVER the sparkle → a mini AI summary card of this widget with two
// type-specific suggestive actions; clicking one opens the ServiceOps AI panel and
// generates the contextual answer for that widget (via store.ui.aiAsk).
const aiBtn = ref(null)
const aiHover = ref(false)
const aiPos = ref({ top: 0, left: 0, flip: false })
// wide enough that "What needs attention" sits on ONE line beside "Deep dive" — at the
// old 320 it wrapped to two, and a wrapped pill next to an unwrapped one reads as broken
const CARD_W = 384
const brief = computed(() => widgetBrief(props.tile))
let aiTimer = null
function openAiHover() {
  clearTimeout(aiTimer)
  const r = aiBtn.value?.getBoundingClientRect(); if (!r) return
  const left = Math.max(8, Math.min(r.right - CARD_W, window.innerWidth - CARD_W - 8))
  const flip = r.bottom + 150 > window.innerHeight     // not enough room below → open upward
  aiPos.value = { top: flip ? r.top - 8 : r.bottom + 8, left, flip }
  aiHover.value = true
}
function closeAiHoverSoon() { clearTimeout(aiTimer); aiTimer = setTimeout(() => { aiHover.value = false }, 160) }
function keepAiHover() { clearTimeout(aiTimer) }
function runWidgetAction(a) { store.ui.aiAsk = { intent: a.intent, text: a.text }; aiHover.value = false }
/* THE TWO CTAs — identical to the board's pair (data/aiTeaser.js), scoped to this tile.
 * The title is carried in the text because the panel resolves scope from an explicit
 * title match (tileFromTitle); without it a widget deep dive would answer for the board.
 *
 * The hover card above them already says WHAT the widget shows, so neither CTA repeats
 * it: deep dive says what is happening and why, focus says what to do first.
 *
 * A Free Text tile has no data behind it, so it gets neither — an action with no answer
 * behind it is worse than no action. */
const WIDGET_CTAS = computed(() => {
  if (props.tile?.type === 'text') return []
  const title = props.tile?.title || 'this widget'
  return [
    { label: 'Deep dive', intent: 'deepdive', icon: 'insights', text: `Deep dive into ${title}` },
    { label: 'What needs attention', intent: 'focus', icon: 'auto-graph', text: `What needs attention in ${title}` },
  ]
})
// When the tile is too small to show the header AI sparkle, the same two ride inside the
// ⋯ menu with the rest — opening the ServiceOps AI panel with this widget's context.
function askWidgetAi(cta) { menu.value = false; store.ui.aiAsk = { intent: cta.intent, text: cta.text } }
const emit = defineEmits(['remove', 'edit', 'duplicate', 'armdrag', 'pin'])

// classify a table cell into a soft status/priority pill
function pillClass(v) {
  const s = String(v).toLowerCase().trim()
  if (['open', 'pending', 'to do', 'new', 'assigned'].includes(s)) return 'pill pill-blue'
  if (['in progress', 'active', 'running', 'on hold', 'watch'].includes(s)) return 'pill pill-amber'
  if (['resolved', 'closed', 'done', 'completed', 'compliant'].includes(s)) return 'pill pill-green'
  if (['expired', 'breached', 'overdue', 'failed', 'critical'].includes(s)) return 'pill pill-red'
  const m = s.match(/^p([1-4])$/)
  if (m) return 'pill pill-p' + m[1]
  return ''
}

/* ── Which clock this widget is on ────────────────────────────────────────────────
 * Three levels, most specific first:
 *   1. the widget's own `dateFilter`   — set from this calendar, or the builder's
 *                                        "Restrict Date Overrides" switch
 *   2. its GROUP's `dateFilter`        — set once in the group header, inherited by
 *                                        every widget the group holds
 *   3. the dashboard's global filter   — the default, and what "follow" returns to
 *
 * The calendar is an affordance on any widget that sits in a group (you can put it on
 * its own clock, or read the one it inherited) and stays an INDICATOR everywhere else —
 * on an ungrouped widget it appears only when that widget actually overrides, so a
 * calendar out on the canvas still means "this one is different".
 */
/* A Free Text tile is a NOTE, and a note is not a widget: it has no data, no time range,
 * no refresh, and nothing an AI could summarise. It drops the whole header band and
 * wears a paper surface instead, so what marks it out on the board is that it looks
 * hand-written rather than that a header says "Free Text". */
const isNote = computed(() => props.tile.type === 'text')

const groupRange = computed(() => props.group?.dateFilter || null)
const ownRange = computed(() => props.tile.dateFilter || null)
// what the widget actually reads. null = the dashboard's global filter.
const effRange = computed(() => ownRange.value || groupRange.value)
// 'own' | 'group' | 'none' — drives both the styling and what the tooltip can claim
const dfSource = computed(() => (ownRange.value ? 'own' : groupRange.value ? 'group' : 'none'))
// shown at all? always inside a group; only when overridden outside one
// …but never on a note, which has no query for a range to filter
const showDf = computed(() => !isNote.value && (!!props.group || !!ownRange.value))

const dfChipEl = ref(null)
const dfOpen = ref(false)
const dfRect = ref(null)

/* The icon stays a plain square and says nothing at rest. Hovering it opens an INSTANT
 * tooltip carrying the range — its name if it is a quick range ("Last 30 days"), the
 * dates themselves if it is a custom one — then the window it resolves to, then where
 * it came from if the widget inherited it.
 *
 * It used to widen on hover to slide a relative phrase in beside the glyph. That moved
 * every icon to its right at the moment the pointer arrived, so the control you were
 * about to click walked away from the cursor. A tooltip says strictly more and moves
 * nothing. */
const dfTipOpen = ref(false)
const dfTipPos = ref({ top: 0, left: 0 })
const dfTip = computed(() => {
  if (!effRange.value) return { name: 'No time range set', stamps: '', from: 'Click to put this widget on its own range' }
  const { start, end } = windowFor(effRange.value)
  return {
    name: effRange.value,
    stamps: `${stampFor(start)} → ${stampFor(end)}`,
    from: dfSource.value === 'group'
      ? `Inherited from the “${props.group.name}” group`
      : 'This widget’s own range',
  }
})
const TIP_W = 260
function showDfTip() {
  const r = dfChipEl.value?.getBoundingClientRect(); if (!r) return
  dfTipPos.value = {
    top: r.bottom + 7,
    left: Math.max(8, Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - 8)),
  }
  dfTipOpen.value = true
}
// what the popover's escape row returns to: the group's range if there is one to fall
// back to, otherwise the dashboard's
const dfFollowLabel = computed(() => {
  if (!ownRange.value) return null                       // nothing of its own to clear
  return groupRange.value ? `Follow the “${props.group.name}” group filter` : 'Follow dashboard filter'
})
const dfNote = computed(() =>
  dfSource.value === 'group' && !ownRange.value
    ? `This widget currently follows the “${props.group.name}” group filter. Picking a range here puts this widget on its own clock.`
    : '')

function toggleDf() {
  if (dfOpen.value) { dfOpen.value = false; return }
  if (!dfChipEl.value) return
  dfRect.value = rectOf(dfChipEl.value)
  dfOpen.value = true
}
function pickDf(range) { props.tile.dateFilter = range; dfOpen.value = false; toast(`“${props.tile.title}” → ${range}`) }
function clearDf() {
  props.tile.dateFilter = null
  dfOpen.value = false
  toast(groupRange.value
    ? `“${props.tile.title}” follows the “${props.group.name}” group filter`
    : `“${props.tile.title}” follows the dashboard filter`)
}

const loading = ref(false)
const menu = ref(false)
const menuBtn = ref(null)
const menuEl = ref(null)
const menuPos = ref({ top: 0, left: 0 })
/* Submenus fly out away from the nearer screen edge, so they can't run off it. */
const subLeft = ref(true)

const MENU_W = 190   // .tile-menu min-width
const SUB_W = 178    // widest submenu (chart types)
const MENU_H = 260   // first-paint estimate; refined from the real rect below
const GAP = 6, EDGE = 8

/* The menu opens clear of the WIDGET, off the card's right edge — not just off
 * the button, or it still clips the corner of the chart it is acting on. When the
 * card sits too close to the right of the screen for that, it flips to the LEFT of
 * the ⋯ button instead. It used to be right-aligned *under* the button, which
 * dropped it straight on top of the chart. */
function placeMenu() {
  const r = menuBtn.value?.getBoundingClientRect()
  if (!r) return
  const card = cardEl.value?.getBoundingClientRect()
  const m = menuEl.value?.getBoundingClientRect()
  const w = m?.width || MENU_W
  const h = m?.height || MENU_H

  const rightAnchor = (card?.right ?? r.right) + GAP
  const fitsRight = rightAnchor + w + EDGE <= window.innerWidth
  const left = fitsRight ? rightAnchor : Math.max(EDGE, r.left - GAP - w)

  // top-align with the button, but never let a long menu run off the bottom
  const top = Math.max(EDGE, Math.min(r.top, window.innerHeight - h - EDGE))

  menuPos.value = { top, left }
  subLeft.value = window.innerWidth - (left + w) < SUB_W + GAP
}

function toggleMenu() {
  if (menu.value) { menu.value = false; exportOpen.value = false; typeOpen.value = false; return }
  menu.value = true
  placeMenu()               // estimate, so it never paints at 0,0
  nextTick(placeMenu)       // then correct it against the rendered size
}
const exportOpen = ref(false)
// the ⋯ menu's "AI Insights" flyout — holds the same summary card as the header sparkle
const aiSubOpen = ref(false)
/* Legend visibility is a property of the WIDGET now, set in its configuration —
 * not a transient view toggle in the ⋯ menu. Undefined means on, so existing
 * tiles keep their legend without a migration. */
const showLegend = computed(() => props.tile.legend !== false)

/* Switch the chart type in place, from the tile, without reopening the builder.
 * Only Column / Bar / Line are offered — see chartTypes.js. A predefined pie is
 * frozen, so the submenu is disabled rather than empty: a disabled item with a
 * reason answers the question, an absent one just poses it.
 * The dashboard's {tiles, groups} snapshot watcher picks it up, so Ctrl+Z reverts. */
const typeOpen = ref(false)
const chartTypes = computed(() => typesFor(props.tile))
const typeFrozen = computed(() => isFrozen(props.tile))
const typeFrozenWhy = computed(() => frozenReason(props.tile))
const disabledFor = (ct) => whyDisabled(ct, props.tile.chart)
function setKind(ct) {
  if (disabledFor(ct)) return
  if (props.tile.chart.kind === ct.id) { menu.value = false; return }
  props.tile.chart.kind = ct.id
  /* `chart.donut` overrides the kind when it is present, so a tile that was ever
   * explicitly set to a ring would stay a ring no matter which of Pie / Doughnut you
   * picked. Switching inside the part-of-whole family has to move it too, or the two
   * halves of the same fact disagree. */
  if (ct.id === 'pie' || ct.id === 'donut') props.tile.chart.donut = ct.id === 'donut'
  menu.value = false; typeOpen.value = false
  toast(`“${props.tile.title}” → ${ct.label}`)
}
/* Export has three destinations, and they are the same three the dashboard offers, so a
 * widget and the board it sits on export the same way. Image and PDF download; Email as
 * PDF sends that same PDF instead of saving it, which is why it opens a dialog. */
const EXPORTS = [
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'pdf', label: 'PDF', icon: 'file-text' },
]
// searchOpen/toggleFilter went with the tile's filter icon (#10). Full screen renders the
// bar unconditionally, so nothing toggles it any more.
const tableSearch = ref('')
/* The Shortcut filter bar is its own component (TableFilterBar): one field that both
 * searches records and builds typed conditions — Field · Operator · Value — the way the
 * Requests list does. Conditions are ANDed; an unfinished chip filters nothing. */
const tableConds = ref([])
const filterFields = computed(() => conditionFields(props.tile.columns || [], props.tile.rows || []))
// Rows are filtered HERE rather than inside DataTable: the table keeps its own search and
// sorting, and this way one matcher owns condition semantics for both the tile and the
// full-screen view.
const filteredRows = computed(() =>
  matchedRows(props.tile.rows || []))
function matchedRows(rows) {
  if (!tableConds.value.length) return rows
  return rows.filter((r) => matchesConds((key) => r[+key], tableConds.value, filterFields.value))
}
const hasTableFilters = computed(() => tableConds.value.length > 0)

// row filtering + sorting now live in DataTable (TanStack); we only own the query
const present = ref(false)
/* Who a restricted widget reaches. Normalised to arrays because the two fields don't
 * agree on shape — technicians are multi-select (an array), groups are single-select
 * (a string) — and the tooltip shouldn't have to care which. */
const asList = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [])
const techList = computed(() => asList(props.tile.techAccess))
const groupList = computed(() => asList(props.tile.groupAccess))
const audienceCount = computed(() => techList.value.length + groupList.value.length)

const infoHover = ref(false)
const infoEl = ref(null)
const infoPos = ref({ top: 0, left: 0 })
function showInfo() {
  const r = infoEl.value?.getBoundingClientRect()
  if (r) infoPos.value = { top: r.bottom + 7, left: Math.min(r.left - 6, window.innerWidth - 256) }
  infoHover.value = true
}
// Measure the real rendered width so actions collapse as the tile is resized smaller,
// not just by column count. compact → Full screen into ⋯; tiny → Refresh + Edit + Full screen all into ⋯.
const cardEl = ref(null)
const bodyEl = ref(null)
const cardW = ref(9999)
// The chart is given the body's real height (not a fixed px band) so it tracks the
// widget size and the side legend paginates to whatever vertical space is available.
// Seed from tile.h so ECharts inits with a sane height; the observer refines it.
const chartH = ref(props.tile.h > 2 ? 340 : props.tile.h > 1 ? 168 : 120)
let ro
onMounted(() => {
  ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      if (e.target === cardEl.value) cardW.value = e.contentRect.width
      else if (e.target === bodyEl.value) { const h = Math.round(e.contentRect.height); if (h > 0) chartH.value = h }
    }
  })
  if (cardEl.value) ro.observe(cardEl.value)
  if (bodyEl.value) ro.observe(bodyEl.value)
})
onBeforeUnmount(() => ro?.disconnect())
// Below this width the two upfront controls (AI + Refresh) also fold into ⋯.
const tiny = computed(() => cardW.value < 258)
function refresh() { loading.value = true; setTimeout(() => { loading.value = false }, 750) }

// provenance: predefined tiles can't be edited or deleted (only "other" actions)
const prov = computed(() => props.tile.prov || 'user')
const PROV = {
  predefined: { label: 'Predefined' },
  user: { label: 'User-defined' },
  shared: { label: 'Shared with me' },
}
const provMeta = computed(() => PROV[prov.value] || PROV.user)
// Predefined widgets are editable (limited to Highlights + chart type in the builder)
// but can't be deleted from the dashboard.
const canEdit = computed(() => true)
/* Deletability follows WHO PUT THE TILE HERE, not who owns its definition.
 * Only a `seeded` tile — one that shipped with a predefined dashboard — is
 * undeletable. A predefined widget the user *added* to that board is theirs to
 * remove again; so is a custom one. */
const canDelete = computed(() => !props.tile.seeded)

// Empty-widget states: unconfigured vs error vs no-data vs ok (distinct copy each)
/* `tile.delta` is still carried in the data and still read by the AI engine — only the
 * on-tile ▲/▼ % badge is gone. Nothing here derives a tone from it any more. */
const tileState = computed(() => {
  if (props.tile.state === 'error') return 'error'
  if (props.tile.state === 'unconfigured') return 'unconfigured'
  if (props.tile.type === 'kpi') return (props.tile.value == null || props.tile.value === '') ? 'nodata' : 'ok'
  /* A note is never "no data in this range" — it has no range and no query. An empty one
   * is an empty note, and FreeTextTile says so in its own words. */
  if (props.tile.type === 'text') return 'ok'
  if (props.tile.type === 'chart') {
    // the additional PMG-ACT-01 kinds carry a chartSpec and compute their own data
    if (props.tile.chart?.spec) return 'ok'
    const s = props.tile.chart?.series || []
    const total = s.flatMap((x) => x.values || []).reduce((a, b) => a + b, 0)
    return (!s.length || total === 0) ? 'nodata' : 'ok'
  }
  return (props.tile.rows || []).length ? 'ok' : 'nodata'
})
const WS = {
  nodata: { icon: 'chart-bar', title: 'No data in this range', sub: 'Try a wider time filter or different conditions.' },
  error: { icon: 'alert', title: 'Couldn’t load data', sub: 'Something went wrong fetching this tile.' },
  unconfigured: { icon: 'settings', title: 'Not configured yet', sub: 'Pick a data source to start showing data.' },
}
function retry() { loading.value = true; setTimeout(() => { props.tile.state = undefined; loading.value = false }, 800) }

function exportAs(f) { menu.value = false; exportOpen.value = false; toast(`Exporting “${props.tile.title}” as ${f.id === 'pdf' ? 'PDF' : 'an image'}`) }
function duplicate() { menu.value = false; emit('duplicate', props.tile) }
// deleting a widget is destructive and one click away — confirm it by name
const confirmDel = ref(false)
const emailOpen = ref(false)      // Export ▸ Email as PDF
const scheduleOpen = ref(false)   // recurring delivery of this one widget
// a disabled schedule delivers nothing, so it does not light the badge
const activeSchedules = computed(() => (props.tile.schedules || []).filter((s) => s.enabled))
const schTitle = computed(() => {
  const n = activeSchedules.value.length
  return `${n} active schedule${n > 1 ? 's' : ''} — ${activeSchedules.value.map((s) => s.type).join(', ')}\nClick to manage`
})
// task 12: record IDs in a shortcut table are explorable → jump to their module record
const ID_MODULE = { INC: 'Requests', REC: 'Records', CNT: 'Contracts', PRB: 'Problems', CHG: 'Changes', AST: 'Assets' }
function isId(v) { return /^[A-Z]{2,4}-\d/.test(String(v).trim()) }
function exploreId(id) { const m = ID_MODULE[String(id).split('-')[0]] || 'its module'; toast(`Opening ${id} in ${m}`) }
</script>

<template>
  <!-- `acting` holds the cluster open while a popover this header owns is up: the menu
       and the date popover are teleported, so moving the pointer into them drops :hover
       and the icons would collapse out from under the thing the user just opened. -->
  <div ref="cardEl" class="tile card" :class="{ ['span-' + (tile.w || 3)]: true, ['rows-' + (tile.h || 1)]: true, acting: menu || dfOpen || aiHover, note: isNote }">
    <!-- Standardized header: title + info (left) · refresh · fullscreen · edit · ⋯ (right).
         EVERY tile uses this. The click-to-select floating toolbar three tiles used to
         have is gone — one board should not have two different ways to reach the same
         actions, and the odd tiles out were the ones that looked broken. -->
    <header class="thead">
      <div class="left">
        <span class="draghandle" title="Drag to move" @mousedown="emit('armdrag', tile)"><Icon name="drag" :size="16" /></span>
        <span v-if="tile.pinned" class="pinbadge" title="Pinned"><Icon name="pin" :size="12" /></span>
        <span class="title ellip">{{ tile.title }}</span>
        <span ref="infoEl" class="info" @mouseenter="showInfo" @mouseleave="infoHover = false">
          <Icon name="info" :size="14" />
        </span>
        <!-- a scheduled widget says so at rest, the same way an overridden date does.
             Without it you could set a widget to mail itself weekly and never see any
             trace of that from the board. -->
        <button
          v-if="activeSchedules.length" class="sch-mark" :title="schTitle"
          @click.stop="scheduleOpen = true"
        ><Icon name="calendar2" :size="13" /></button>
      </div>
      <!-- Right side: the calendar is the ONLY thing at rest, at the far right. On hover
           the cluster grows around it on BOTH sides — AI to its left, the rest to its
           right — which is what makes the calendar appear to slide left. -->
      <div class="ractions">
        <!-- AI opens to the LEFT of the calendar -->
        <div class="lrev">
          <div class="r-in">
            <!-- a note has no data behind it, so there is nothing to summarise -->
            <button v-if="!tiny && !isNote" ref="aiBtn" class="ti ai" :class="{ on: aiHover }" @mouseenter="openAiHover" @mouseleave="closeAiHoverSoon" @click.stop="openAiHover" title="AI summary of this widget"><Icon name="sparkles" :size="15" /></button>
          </div>
        </div>
        <!-- The date control. Inside a GROUP it is always there — every widget in a group
             can be put on its own clock, and one that has not been shows the group's
             range so you can see what it is reading. Out on the canvas it stays an
             INDICATOR, appearing only on a widget that actually overrides, so a calendar
             there still means "this one is different". -->
        <button
          v-if="showDf" ref="dfChipEl" class="ti df-btn" :class="[dfSource, { on: dfOpen || dfSource !== 'none' }]"
          @click.stop="toggleDf" @mouseenter="showDfTip" @mouseleave="dfTipOpen = false"
        >
          <Icon name="calendar" :size="13" />
        </button>
        <!-- and the records filter, Refresh and ⋯ open to its RIGHT -->
        <div class="right">
          <div class="r-in">
            <!-- one control: the filter icon reveals search + column filters; closing clears them -->
            <!-- nothing to re-fetch on a note either -->
            <button v-if="!tiny && !isNote" class="ti" @click="refresh" title="Refresh"><Icon name="refresh" :size="15" :class="{ spin: loading }" /></button>
            <div class="mwrap">
              <button ref="menuBtn" class="ti" @click.stop="toggleMenu" title="More"><Icon name="dots-v" :size="15" /></button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- the date icon's instant tooltip: the range, the window it resolves to, and where
         it came from. Teleported so the card's overflow cannot clip it. -->
    <teleport to="body">
      <transition name="fade">
        <span v-if="dfTipOpen && !dfOpen" class="tt df-tt" :style="{ top: dfTipPos.top + 'px', left: dfTipPos.left + 'px' }">
          <b class="dft-name">{{ dfTip.name }}</b>
          <span v-if="dfTip.stamps" class="dft-stamps">{{ dfTip.stamps }}</span>
          <span class="dft-from">{{ dfTip.from }}</span>
        </span>
      </transition>
    </teleport>

    <!-- the shared two-pane picker, the same one the topbar and a group header open -->
    <TimeRangePopover
      v-if="dfOpen" :value="effRange" :rect="dfRect"
      :follow-label="dfFollowLabel" :note="dfNote"
      @pick="pickDf" @clear="clearDf" @close="dfOpen = false"
    />

    <!-- per-widget AI: hover mini-summary card, teleported so it overlays the board -->
    <teleport to="body">
      <transition name="wai">
        <div
          v-if="aiHover" class="wai-card aic" :class="{ up: aiPos.flip }"
          :style="{ top: aiPos.top + 'px', left: aiPos.left + 'px' }"
          @mouseenter="keepAiHover" @mouseleave="closeAiHoverSoon"
        >
          <!-- no widget name here: you're hovering that widget, so repeating it is noise -->
          <div class="wai-h"><span class="wai-spark"><Icon name="sparkles" :size="16" /></span> AI insights</div>
          <p class="wai-sum">{{ brief.summary }}</p>
          <div v-if="WIDGET_CTAS.length" class="wai-acts ai-ctas-fill">
            <button
              v-for="a in WIDGET_CTAS" :key="a.label" class="ai-cta"
              :class="{ primary: a.intent === 'deepdive' }" @click="runWidgetAction(a)"
            ><Icon :name="a.icon" :size="13" /><span>{{ a.label }}</span></button>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- info tooltip: teleported so it isn't clipped by the card's overflow -->
    <teleport to="body">
      <transition name="fade">
        <span v-if="infoHover" class="tt tt-stack info-tt" :style="{ top: infoPos.top + 'px', left: infoPos.left + 'px' }">
          <!-- description leads; provenance rides below it as a pill -->
          <span class="tt-desc">{{ tile.info || 'No description has been added for this widget yet.' }}</span>
          <span class="tt-tag" :class="prov">{{ provMeta.label }}</span>
          <!-- Restricted only, and folded below a rule so it reads as a second fact
               about the widget rather than more of the description. Public reaches
               everyone and Private reaches nobody, so neither has a list worth naming —
               the same rule the dashboard's info card follows. -->
          <span v-if="tile.access === 'restricted'" class="tt-acc">
            <span class="tt-acc-h"><Icon name="users" :size="12" /> Shared with {{ audienceCount }}</span>
            <span v-if="groupList.length" class="tt-acc-row">{{ groupList.join(' · ') }}</span>
            <span v-if="techList.length" class="tt-acc-row">{{ techList.join(' · ') }}</span>
            <span v-if="!audienceCount" class="tt-acc-row">Nobody added yet — only you can see it.</span>
          </span>
        </span>
      </transition>
    </teleport>

    <!-- ⋯ menu: teleported so it overlays the card instead of being clipped by overflow -->
    <teleport to="body">
      <div v-if="menu" class="backdrop" @click="menu = false; exportOpen = false; typeOpen = false" />
      <transition name="pop">
        <div v-if="menu" ref="menuEl" class="menu tile-menu" :class="{ 'sub-right': !subLeft }" :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }" @click.stop>
          <!-- AI first, ruled off from the rest: it is the only item that answers a
               question rather than acting on the widget. Present at every tile size —
               a small tile has no room for the header sparkle, and this is then the
               ONLY way to reach it.

               One item, not two. Hovering it flies out the SAME summary card the header
               sparkle shows — read the widget first, then choose. Listing the two CTAs
               flat in the menu made you pick an answer before seeing the question. -->
          <div
            v-if="WIDGET_CTAS.length && tiny" class="menu-item sub ai"
            @mouseenter="aiSubOpen = true; typeOpen = false; exportOpen = false" @mouseleave="aiSubOpen = false"
          >
            <span class="mi-l"><Icon name="sparkles" :size="15" /> AI Insights</span><Icon name="chevron-right" :size="14" class="mi-c" />
            <transition name="pop"><div v-if="aiSubOpen" class="submenu ai-sub">
              <!-- no widget name: you opened this from that widget's own menu -->
              <div class="wai-h"><span class="wai-spark"><Icon name="sparkles" :size="16" /></span> AI insights</div>
              <p class="wai-sum">{{ brief.summary }}</p>
              <div class="wai-acts ai-ctas-fill">
                <button
                  v-for="a in WIDGET_CTAS" :key="a.label" class="ai-cta"
                  :class="{ primary: a.intent === 'deepdive' }" @click="askWidgetAi(a)"
                ><Icon :name="a.icon" :size="13" /><span>{{ a.label }}</span></button>
              </div>
            </div></transition>
          </div>
          <div v-if="WIDGET_CTAS.length && tiny" class="menu-sep" />
          <!-- Widget actions, in the prototype order: Refresh · Edit · Chart Type ·
               Full screen · Duplicate.

               AI Insights and Refresh appear here ONLY on a tile too narrow to show them
               in its header. Listing an action in both places asks the user to notice
               that the two are the same thing; the menu is the overflow for what did not
               fit, not a second copy of what did. -->
          <button v-if="tiny" class="menu-item" @click="menu = false; refresh()"><Icon name="refresh" :size="15" /> Refresh</button>
          <button v-if="canEdit" class="menu-item" @click="menu = false; emit('edit', tile)"><Icon name="edit" :size="15" /> Edit</button>
          <!-- Chart type → submenu. Only Column / Bar / Line can be swapped for one
               another; a predefined pie is frozen, so the item is disabled with the
               reason rather than silently missing. -->
          <div
            v-if="tile.type === 'chart' && tile.chart" class="menu-item sub"
            :class="{ dis: typeFrozen }" :title="typeFrozen ? typeFrozenWhy : ''"
            @mouseenter="typeOpen = !typeFrozen; exportOpen = false" @mouseleave="typeOpen = false"
          >
            <span class="mi-l"><Icon name="chart-bar" :size="15" /> Chart type</span><Icon name="chevron-right" :size="14" class="mi-c" />
            <transition name="pop"><div v-if="typeOpen" class="submenu types">
              <button
                v-for="ct in chartTypes" :key="ct.id" class="menu-item ct"
                :class="{ on: tile.chart.kind === ct.id }"
                :disabled="!!disabledFor(ct)" :title="disabledFor(ct) || `Show as ${ct.label}`"
                @click="setKind(ct)"
              >
                <Icon :name="ct.icon" :size="16" /> {{ ct.label }}
                <Icon v-if="tile.chart.kind === ct.id" name="check" :size="14" class="ct-ck" />
              </button>
            </div></transition>
          </div>
          <button class="menu-item" @click="menu = false; present = true"><Icon name="maximize-tile" :size="15" /> Full screen</button>
          <button class="menu-item" @click="duplicate"><Icon name="copy" :size="15" /> Duplicate</button>
          <!-- divider between the widget's own actions and the export group -->
          <div class="menu-sep" />
          <!-- Export → submenu (Image / PDF / Email as PDF) -->
          <div class="menu-item sub" @mouseenter="exportOpen = true; typeOpen = false" @mouseleave="exportOpen = false">
            <span class="mi-l"><Icon name="export" :size="15" /> Export</span><Icon name="chevron-right" :size="14" class="mi-c" />
            <transition name="pop"><div v-if="exportOpen" class="submenu ex">
              <button v-for="f in EXPORTS" :key="f.id" class="menu-item" @click="exportAs(f)"><Icon :name="f.icon" :size="15" /> {{ f.label }}</button>
              <!-- Emailing is an export too — it produces the same PDF, it just leaves by
                   a different door. Ruled off because it opens a dialog rather than
                   downloading on the spot. -->
              <div class="menu-sep" />
              <button class="menu-item" @click="menu = false; exportOpen = false; emailOpen = true"><Icon name="mail" :size="15" /> Email as PDF</button>
            </div></transition>
          </div>
          <!-- Schedule is absent on a NOTE: it delivers a rendered snapshot of data on a
               cadence, and a note has no data to re-render. -->
          <button v-if="!isNote" class="menu-item" @click="menu = false; scheduleOpen = true"><Icon name="calendar2" :size="15" /> Schedule</button>
          <template v-if="canDelete">
            <div class="menu-sep" />
            <button class="menu-item danger" @click="menu = false; confirmDel = true"><Icon name="trash" :size="15" /> Delete card</button>
          </template>
        </div>
      </transition>
    </teleport>

    <!-- Body -->
    <div ref="bodyEl" class="tbody">
      <div v-if="loading" class="loading">
        <div class="skeleton" style="height:60%;width:80%" />
        <div class="skeleton" style="height:14px;width:50%;margin-top:10px" />
      </div>

      <!-- empty-widget states: unconfigured / error / no-data -->
      <div v-else-if="tileState !== 'ok'" class="wstate" :class="{ err: tileState === 'error' }">
        <span class="ws-ico"><Icon :name="WS[tileState].icon" :size="22" /></span>
        <b>{{ WS[tileState].title }}</b>
        <span class="ws-sub">{{ WS[tileState].sub }}</span>
        <button v-if="tileState === 'error'" class="btn btn-sm" @click="retry"><Icon name="refresh" :size="14" /> Retry</button>
        <button v-else-if="tileState === 'unconfigured' && canEdit" class="btn btn-sm btn-primary" @click="emit('edit', tile)"><Icon name="edit" :size="14" /> Configure</button>
      </div>

      <template v-else-if="tile.type === 'kpi'">
        <div class="kpi">
          <!-- The number alone. The ▲/▼ % against "the previous period" was withdrawn:
               the period it compared to was never stated on the tile, and an arrow whose
               baseline you cannot see is a claim the widget can't back up. The AI panel
               still reports the same movement in prose, where it can name the window. -->
          <div class="kpinum">{{ tile.value }}<span v-if="tile.unit" class="unit">{{ tile.unit }}</span></div>
        </div>
      </template>

      <template v-else-if="tile.type === 'chart'">
        <ChartTile v-if="tile.chart" :chart="tile.chart" :legend="showLegend" :data-labels="tile.dataLabels === true" :height="chartH" />
      </template>

      <template v-else-if="tile.type === 'text'">
        <FreeTextTile :content="tile.content" />
      </template>

      <template v-else>
        <div class="stbl">
          <!-- No filter bar on the board tile. A Shortcut here shows a short, scrolling
               preview of its records; filtering a preview narrows something you cannot see
               the whole of, and the bar cost two rows of the tile's height to do it. Search
               and filter both live in Full screen, where the entire record set is present
               and narrowing it means something. -->
          <!-- scrollable table container (sticky header); click a header to sort. No
               "View all" — the list scrolls in place, and Full screen shows all of it. -->
          <div class="stbl-scroll">
            <DataTable :columns="tile.columns" :rows="filteredRows" :search="tableSearch" :filtered="hasTableFilters" @clear-filters="tableConds = []">
              <template #cell="{ value }">
                <span v-if="pillClass(value)" :class="pillClass(value)">{{ value }}</span>
                <button v-else-if="isId(value)" class="id-link" @click.stop="exploreId(value)">{{ value }}</button>
                <template v-else>{{ value }}</template>
              </template>
            </DataTable>
          </div>
        </div>
      </template>
    </div>

    <!-- Email as PDF: preview + screenshot-style markup + recipients -->
    <teleport to="body">
      <EmailWidgetModal v-if="emailOpen" :tile="tile" @close="emailOpen = false" />
      <ScheduleDialog v-if="scheduleOpen" :d="tile" @close="scheduleOpen = false" />

      <ConfirmDialog
        v-if="confirmDel"
        title="Delete this widget?"
        :target="tile.title"
        message="will be removed from this dashboard. The widget stays in the library, so you can add it back."
        confirm-label="Delete widget"
        @confirm="confirmDel = false; emit('remove', tile)"
        @cancel="confirmDel = false"
      />
    </teleport>

    <!-- Present mode (single tile) -->
    <teleport to="body">
      <div v-if="present" class="overlay" @click.self="present = false">
        <div class="present">
          <div class="phead"><b>{{ tile.title }}</b><button class="btn btn-icon" @click="present = false"><Icon name="x" :size="18" /></button></div>
          <div class="pbody">
            <ChartTile v-if="tile.type === 'chart'" :chart="tile.chart" :legend="showLegend" :data-labels="tile.dataLabels === true" :height="620" />
            <div v-else-if="tile.type === 'kpi'" class="kpi big"><div class="kpinum">{{ tile.value }}<span class="unit">{{ tile.unit }}</span></div></div>
            <FreeTextTile v-else-if="tile.type === 'text'" :content="tile.content" />
            <div v-else class="stbl big">
              <!-- full screen: the same bar, always available (there is no header icon to
                   toggle it from here), and the whole record set scrolls in the dialog -->
              <TableFilterBar
                :columns="tile.columns || []" :rows="tile.rows || []"
                v-model="tableConds" v-model:search="tableSearch"
                @close="tableConds = []; tableSearch = ''"
              />
              <div class="stbl-scroll">
                <DataTable :columns="tile.columns" :rows="filteredRows" :search="tableSearch" :filtered="hasTableFilters" @clear-filters="tableConds = []">
                  <template #cell="{ value }">
                    <span v-if="pillClass(value)" :class="pillClass(value)">{{ value }}</span>
                    <button v-else-if="isId(value)" class="id-link" @click.stop="exploreId(value)">{{ value }}</button>
                    <template v-else>{{ value }}</template>
                  </template>
                </DataTable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
/* Fill the grid cell (which sizes the footprint via min-height) so the body — and a
   fill-height chart inside it — get a real height to distribute. Without this the tile
   collapses to its header once the chart stops carrying a fixed pixel height. */
/* §9.1 — a widget tile IS a content card, so it takes the surface radius, not the
   control one. */
.tile { display: flex; flex-direction: column; overflow: hidden; min-height: 130px; flex: 1; border-radius: var(--r-lg); }

/* ── A note ────────────────────────────────────────────────────────────────────────
   The one tile with no header. Everything a widget header carries — a title, a data
   source, a refresh, a time range — is something a note does not have, so the band was
   a frame around an empty statement. What is left is the writing on a warm surface,
   which is the whole affordance: you can tell at a glance which tiles a person wrote
   and which ones the system computed, with nothing having to say so.

   The actions do not disappear, they just stop occupying a permanent band: the header
   is overlaid on the note's top-right and fades in on hover, the way it works in every
   notes app. */
/* the overlaid header is absolute, so the card has to be its containing block */
.tile.note { position: relative; background: var(--note-bg); border-color: var(--note-line); }
.tile.note .thead {
  position: absolute; top: 0; right: 0; left: auto; width: auto; height: auto; z-index: 3;
  background: transparent; padding: 6px 6px 0 0;
  opacity: 0; transition: opacity .15s ease; pointer-events: none;
}
.tile.note:hover .thead, .tile.note.acting .thead { opacity: 1; }
.tile.note .thead .ractions, .tile.note .thead .draghandle { pointer-events: auto; }
/* no title, no info, no provenance: a note is read, not identified */
.tile.note .title, .tile.note .info { display: none; }
/* BOTH controls sit top-right, together. The grip used to live top-left, which is
   exactly where the first line of writing starts — so either it covered the first
   character or the body had to reserve 30px of blank paper above the text to get out of
   its way. Moving it beside the ⋯ frees the whole left edge, so the note can have the
   same 12px margin on every side and the writing starts where the card does. */
.tile.note .left { position: static; }
.tile.note .draghandle { position: static; transform: none; opacity: 1; }
.tile.note .thead { gap: 4px; }
/* the controls float over the paper, so they need a surface behind them — the note's
   own, not the white every other tile's header sits on */
.tile.note .mwrap .ti, .tile.note .draghandle { width: 24px; height: 24px; display: grid; place-items: center; background: var(--note-bg); border: 1px solid var(--note-line); border-radius: var(--r); }
.tile.note .mwrap .ti:hover, .tile.note .draghandle:hover { background: var(--surface-2); }
.tile.note .tbody { padding: 12px; }
/* the title + action row sits in its own slight-neutral band, with room to breathe */
/* --bg (#F6F9FC) at 37px tall — shorter than the old 46px, and lighter than the solid
   --surface-2 band that competed with the chart under it. */
/* No rule under the header. The band's own background already separates it from the
   body, so the line was a second divider drawing the same boundary. */
.thead { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 8px 4px 12px; background: var(--bg); }
.left { position: relative; display: flex; align-items: center; gap: 6px; min-width: 0; }
/* 6-dot drag handle — OUT OF FLOW, drawn on top of the title's first characters, so the
   title never moves between rest and hover. The title is masked from under the grip
   instead of being clipped by it: a hard cut swallows the first letter whole, the
   gradient reads as the text passing behind the handle. */
/* The grip sits ON TOP of the title, so it needs its own ground or the letters show
   through the gaps between the six dots and the two read as one smudge. The fill is
   the header band's own colour, and it runs the full width of the glyph — the title's
   fade then starts where the grip ENDS, not underneath it. */
.draghandle { position: absolute; left: 0; top: 50%; transform: translateY(-50%); z-index: 2; width: 20px; height: 20px; display: inline-grid; place-items: center; background: var(--bg); border-radius: var(--r-sm); color: var(--muted); cursor: grab; opacity: 0; transition: opacity .16s ease; }
.draghandle:active { cursor: grabbing; }
.tile:hover .draghandle, .tile.acting .draghandle { opacity: 1; }
/* fully hidden for the grip's 20px, THEN a 10px ramp — so no glyph ever overlaps a
   half-faded letter. It used to clear only 4px, which left the title at ~30% opacity
   directly behind the dots. */
.tile:hover .title, .tile.acting .title { -webkit-mask-image: linear-gradient(90deg, transparent 0, transparent 21px, #000 31px); mask-image: linear-gradient(90deg, transparent 0, transparent 21px, #000 31px); }
.pinbadge { display: inline-grid; place-items: center; color: var(--primary); flex: none; transform: rotate(35deg); }
.title { font-weight: 600; font-size: var(--tile-title, 13.5px); }

/* info-icon tooltip: the DESCRIPTION leads, provenance sits under it as a left-aligned pill */
/* .tt-tag lives in global.css — one tag definition for every tooltip in the product.
   A scoped copy here would out-specify it and silently reintroduce the pill. */
/* the schedule badge is always on — it reports a fact, it is not a hover action */
.sch-mark { flex: none; width: 20px; height: 20px; border: none; background: transparent; color: var(--green); border-radius: 4px; display: grid; place-items: center; }
.sch-mark:hover { background: var(--green-soft); }
.info { position: relative; color: var(--muted-2); display: inline-grid; place-items: center; cursor: help; opacity: 0; transition: opacity .14s; }
.tile:hover .info, .tile.acting .info { opacity: 1; }
.info:hover { color: var(--primary); }
.info-tt { position: fixed; z-index: 200; width: 240px; }
/* the audience, folded in below a rule — mirrors the dashboard info card's .dinfo-acc.
   `width: 100%` because it is a flex child of an `align-items: flex-start` column, and
   without it the rule would only span the text. */
/* the right cluster: a persistent date control, then the hover-revealed actions.
   At rest the action cluster takes NO width, so the calendar sits at the far right of
   the header. On hover the cluster opens to its natural width and the calendar slides
   left into place — one continuous motion rather than three icons popping in around a
   stationary one. Order after the calendar: AI · (records filter) · Refresh · ⋯ */
.ractions { display: flex; align-items: center; gap: 2px; flex: none; }
/* grid 0fr→1fr is what makes an AUTO width animatable at all: max-width would have to
   ease toward a guessed number and would land with a snap once it passed the real one. */
.right, .lrev { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns .24s cubic-bezier(.2,.7,.3,1), opacity .16s ease; }
.r-in { display: flex; align-items: center; gap: 1px; min-width: 0; overflow: hidden; }
.tile:hover .right, .tile.searching .right, .tile.acting .right,
.tile:hover .lrev, .tile.searching .lrev, .tile.acting .lrev { grid-template-columns: 1fr; opacity: 1; }
/* The per-widget time range, deliberately SMALLER than the actions around it (22px to
   their 28px). It is the one control that sits in the header at rest, and it reports a
   state rather than doing something — sizing it down lets it stay legible without
   competing with the title for the eye.
   The header's height is unaffected: that comes from the 28px action buttons, which are
   present at rest and only collapse their WIDTH on hover-out. */
.ti.df-btn { width: 22px; height: 22px; }
.ti.df-btn :deep(.ico) { color: var(--df); flex: none; }
.ti.df-btn.on { background: var(--df-soft); color: var(--df-ink); }
.ti.df-btn.on :deep(.ico) { color: var(--df); }
/* Three states, and the difference between them has to be legible at a glance:
   .own    — this widget set its own range: filled, the strongest of the three
   .group  — it is reading the group's range: outlined, present but clearly borrowed
   .none   — nothing set yet: a plain grey action like Refresh beside it, because an
             indigo icon on a widget with no override would claim one it doesn't have */
.ti.df-btn.own { background: var(--df-soft); color: var(--df-ink); }
.ti.df-btn.group { background: transparent; color: var(--df-ink); box-shadow: inset 0 0 0 1px var(--df-line); }
.ti.df-btn.group:hover { background: var(--df-soft); }
.ti.df-btn.none { color: var(--muted); }
.ti.df-btn.none :deep(.ico) { color: var(--muted); }
.ti.df-btn.none:hover { background: var(--surface); color: var(--ink); }
.ti.df-btn.none:hover :deep(.ico) { color: var(--ink); }
/* the date icon's tooltip — range name, resolved window, then its source */
.df-tt { position: fixed; z-index: 200; width: 260px; display: flex; flex-direction: column; gap: 4px; }
.dft-name { color: #fff; font-weight: 600; }
.dft-stamps { color: rgba(255,255,255,.9); font-variant-numeric: tabular-nums; }
.dft-from { color: #b9bcd6; font-size: 11px; }

@media (prefers-reduced-motion: reduce) {
  .right, .lrev { transition: none; }
}
.ti { width: 28px; height: 28px; border-radius: 4px; border: none; background: transparent; color: var(--muted); display: grid; place-items: center; }
/* hover uses the card surface (white) so it reads against the neutral header band */
.ti:hover { background: var(--surface); color: var(--ink); }
.ti.on { background: var(--primary-soft); color: var(--primary-700); }
/* the AI sparkle carries its soft wash the whole time it is on screen — in the design it
   is the one filled control in the cluster, which is how it reads as the different kind
   of action (it answers, the others act) rather than one more icon in a row */
.ti.ai { color: var(--ai); background: var(--ai-softer); }
.ti.ai:hover, .ti.ai.on { background: var(--ai-soft); color: var(--ai-ink); }
/* per-widget hover mini-summary card */
/* Shell, wash and both CTA types come from `.aic` / `.ai-cta` in global.css —
   the same card the ticket detail page shows. Only geometry stays here. */
.wai-card { position: fixed; z-index: 260; width: 384px; max-width: 92vw; padding: 16px; box-shadow: var(--sh-lg); }
.wai-card.up { transform: translateY(-100%); }
.wai-h { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink); }
.wai-h .ellip { color: var(--ai-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wai-spark { flex: none; display: grid; place-items: center; }
.wai-spark :deep(.ico) { stroke: url(#ai-grad); color: var(--ai); }
.wai-sum { margin: 10px 0 16px; font-size: 13px; line-height: 1.6; color: var(--ink); }
/* two actions, side by side */
.wai-acts { display: flex; flex-wrap: wrap; gap: 8px; }
/* same rounded-pill treatment as the AI Summary card's CTAs */
/* 32/12/4px/500 — the product button, like every other AI CTA. Was 34px and a 999px
   pill, which made the two most-used AI actions the one control on the board that did
   not look like a button. */
/* Deep dive leads — it is the one that opens the conversation; the other is a shortcut
   to the ranked list, which the thread can also reach on its own. */
.wai-enter-active, .wai-leave-active { transition: opacity .14s ease; }
.wai-enter-from, .wai-leave-to { opacity: 0; }
.spin { animation: sp 0.75s linear infinite; } @keyframes sp { to { transform: rotate(360deg); } }
.mwrap { position: relative; }
.backdrop { position: fixed; inset: 0; z-index: 130; }
/* teleported menu — fixed to viewport, above the card so it is never clipped */
.tile-menu { position: fixed; z-index: 140; min-width: 190px; }
/* AI action, when it has collapsed into the ⋯ menu on a small tile */
.menu-item.ai { color: var(--ai-ink); }
.menu-item.ai :deep(.ico) { color: var(--ai); }
.menu-item.ai:hover { background: var(--ai-softer); }
/* the chevron is chrome, not AI — keep it the same muted grey as the other submenus,
   or the row reads as two separate accents */
.menu-item.ai .mi-c :deep(.ico), .menu-item.ai .mi-c { color: var(--muted); }
/* the AI flyout is a CARD, not a list of rows — it carries the same summary + two CTAs
   as the header sparkle's hover card, so it borrows that card's internals verbatim */
.submenu.ai-sub { width: 384px; min-width: 384px; padding: 12px 13px; border-color: var(--ai-border); }
.menu-item.sub { justify-content: space-between; position: relative; }
.mi-l { display: flex; align-items: center; gap: 10px; }
.mi-c { color: var(--muted); }
.submenu { position: absolute; top: -7px; right: 100%; min-width: 124px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-pop); padding: 6px; }
/* near the left edge there is no room to fly out leftwards — go right instead */
.tile-menu.sub-right .submenu { right: auto; left: 100%; }
/* chart-type submenu: 8 items, current one checked, incompatible ones greyed */
.submenu.types { min-width: 178px; top: -80px; }
/* wide enough for "Email as PDF" on ONE line. At the generic 124px it wrapped, and a
   wrapped row is double-height — the item looked like a different kind of thing. */
.submenu.ex { min-width: 180px; }
.submenu.ex .menu-item { white-space: nowrap; }
.ct { justify-content: flex-start; gap: 10px; }
.ct .ct-ck { margin-left: auto; color: var(--primary); }
.ct.on { color: var(--primary-700); font-weight: 600; }
.ct:disabled { opacity: .4; cursor: not-allowed; }
.ct:disabled:hover { background: transparent; }
/* frozen: a predefined pie/KPI/shortcut can't be recast at all */
.menu-item.sub.dis { opacity: .4; cursor: not-allowed; }
.menu-item.sub.dis:hover { background: transparent; }
/* --tile-pad is set on the board from the GLOBAL layout setting, so widget padding
   is one preference rather than a number repeated in every tile. */
.tbody { flex: 1; padding: var(--tile-pad, 12px); display: flex; flex-direction: column; min-height: 0; }
.loading { flex: 1; display: flex; flex-direction: column; justify-content: center; }
/* empty-widget states */
.wstate { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 5px; color: var(--muted); padding: 14px; }
.wstate b { color: var(--ink-2); font-size: 13px; font-weight: 600; }
.ws-sub { font-size: 12px; max-width: 230px; line-height: 1.45; }
.ws-ico { width: 44px; height: 44px; border-radius: 4px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); margin-bottom: 3px; }
.wstate.err .ws-ico { background: var(--red-soft); color: var(--red); }
.wstate .btn { margin-top: 9px; }
/* full-area hover: the whole numeric region (below the title) fills on hover,
   with generous padding so the highlight surrounds the number on every side */
/* No hover fill behind the number. Hovering a KPI does nothing — the fill implied a
   click target that was never there, and it moved the one figure the tile exists to
   show onto a second background for no reason. */
.kpi { display: flex; flex-direction: column; justify-content: center; align-items: center; flex: 1; text-align: center; padding: 18px 16px; }
.kpinum { font-size: 46px; font-weight: 500; letter-spacing: -1px; line-height: 1; }
.kpinum .unit { font-size: 20px; font-weight: 600; color: var(--muted); margin-left: 3px; }
.stbl { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.stbl-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
/* the whole bar is ONE field: chips and the picker live inside the box, so it reads as a
   single control the way the design draws it */
.stbl-bar .sbox { flex: 1; min-width: 0; gap: 6px; padding-right: 3px; }
.stbl-bar .sbox input { flex: 1; min-width: 60px; }
/* the field picker, tucked inside the field at the right */
.stbl-bar .ti-fm :deep(.fm-btn) { width: 26px; height: 26px; border: none; background: transparent; }
.stbl-bar .ti-fm :deep(.fm-btn:hover) { background: var(--surface-2); }
/* an active filter, as the design states it: Field is Value */
.fchip { display: inline-flex; align-items: center; gap: 4px; flex: none; max-width: 190px; height: 22px; padding: 0 4px 0 8px; border-radius: 4px; background: var(--surface-2); border: 1px solid var(--border); font-size: 12px; color: var(--ink-2); white-space: nowrap; }
.fchip b { font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; }
.fchip em { font-style: normal; color: var(--muted); }
.fchip button { flex: none; width: 15px; height: 15px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.fchip button:hover { background: var(--border); color: var(--ink); }
.sbox { display: flex; align-items: center; gap: 7px; width: 100%; height: 30px; border: 1px solid var(--border-strong); border-radius: 4px; padding: 0 8px; background: var(--surface); }
.sbox:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.sbox input { border: none; outline: none; background: transparent; width: 100%; font-size: 13px; }
.sx { border: none; background: transparent; color: var(--muted); cursor: pointer; display: grid; place-items: center; padding: 0; }
.sx:hover { color: var(--ink); }
.stbl-scroll { flex: 1; overflow: auto; min-height: 0; max-height: 200px; }
/* filter row eats a row's worth of height — give it back so rows stay visible */
.stbl-scroll:has(.fltr) { max-height: 236px; }
/* table/th/td/.nodata chrome lives in DataTable.vue — scoped CSS cannot reach
   a child component's internals. Only the root <table> is styleable from here. */
table { font-size: 13px; }
/* soft status / priority pills in shortcut tables */
/* §7.3 status badge — 2px, NOT a pill. The square-ish corner is what separates a
   state badge from a control; rounded-full here would read as a clickable chip. */
.pill { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border-radius: var(--r-sm); font-size: 11px; font-weight: 500; white-space: nowrap; }
.pill-blue { background: var(--blue-soft); color: var(--blue); }
.pill-amber { background: var(--amber-soft); color: var(--amber); }
.pill-green { background: var(--green-soft); color: var(--green); }
.pill-red { background: var(--red-soft); color: var(--red); }
.pill-p1 { background: var(--red-soft); color: var(--red); }
.pill-p2 { background: var(--amber-soft); color: var(--amber); }
.pill-p3 { background: var(--blue-soft); color: var(--blue); }
.pill-p4 { background: var(--surface-2); color: var(--muted); }
.viewall { display: inline-flex; align-items: center; gap: 3px; margin-top: 6px; color: var(--primary-700); font-weight: 600; font-size: 12px; cursor: pointer; }
/* explorable record ID (task 12) */
.id-link { border: none; background: transparent; color: var(--primary-700); font: inherit; font-weight: 600; padding: 0; cursor: pointer; }
.id-link:hover { text-decoration: underline; }
/* same footprint as the builder (live preview + configuration), so full screen and
   editing a widget frame the content identically — including the 16px gutter, since
   the shared .overlay uses 24px and the two would otherwise land a few px apart. */
.overlay { padding: 16px; }
.present { background: var(--surface); border-radius: var(--r-xl); width: 100%; height: 100%; display: flex; flex-direction: column; box-shadow: var(--sh-lg); overflow: hidden; }
.phead { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid var(--border); font-size: 16px; flex: none; }
.pbody { padding: 32px 40px; flex: 1; min-height: 62vh; display: grid; place-items: center; overflow: auto; }
.pbody > * { width: 100%; }
.kpi.big { padding: 0; } .kpi.big .kpinum { font-size: 150px; } .kpi.big .kpinum .unit { font-size: 48px; }
.stbl.big { align-self: stretch; width: 100%; } .stbl.big table { font-size: 15px; }
/* full screen: the record list scrolls within the dialog (sticky header) instead of
   a "View all" jump; taller than the tile so more rows show at once. */
.stbl.big .stbl-scroll { max-height: 72vh; }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
