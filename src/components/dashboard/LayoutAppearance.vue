<script setup>
/**
 * LayoutAppearance — the dashboard layout settings, as ONE component.
 *
 * Two entry points open it, and they are asking different questions:
 *   · the board's ⋯ menu → "the layout of THIS dashboard"
 *   · the Manage all dashboards toolbar → "the layout of ALL of them"
 * So each preselects its own answer rather than making you restate what you already
 * said by choosing that entry. The choice is still shown and still changeable — the
 * entry sets the default, it does not remove the decision.
 *
 * ── Where the values go ─────────────────────────────────────────────────────────
 *   'all'  → store.layout, the global default every board inherits
 *   'this' → the open dashboard's own fields, which win over the global
 *
 * ── Preview now, commit on Apply ────────────────────────────────────────────────
 * Every control still moves the REAL board as you drag it — that's why the drawer
 * has no scrim. But nothing is kept until Apply. Cancel (and the X, Escape, or a
 * click outside) restores the snapshot taken when the drawer opened, so the live
 * preview costs you nothing if you change your mind.
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../ui/Icon.vue'
import {
  store, byId, toast,
  LAYOUT_FIELD as FIELD, LAYOUT_KEYS as KEYS,
  layoutValue, setLayoutValue, commitLayoutEdit, cancelLayoutEdit,
} from '../../store/index.js'

defineProps({
  // 'drawer' narrow column (both entries today) · 'panel' full width, if ever inlined
  variant: { type: String, default: 'drawer' },
})

/* The board in context, read from the route so no entry point has to thread it down.
 * null anywhere that isn't a dashboard — which is exactly when "this one" stops being
 * a real option. */
const route = useRoute()
const dash = computed(() => (route.params.id ? byId(route.params.id) : null))

// The field map, the read/write rules and Reset all live in the store — the drawer's
// HEADER drives Reset while this panel drives the sliders, and they have to agree.

// scope lives on the store so it survives the drawer closing and reopening
const scope = computed(() => (dash.value ? store.ui.layoutScope : 'all'))
// leaving the board can't leave a board-scoped panel pointing at nothing
watch(dash, (d) => { if (!d) store.ui.layoutScope = 'all' })

const val = (k) => layoutValue(dash.value, k)
const setVal = (k, v) => setLayoutValue(dash.value, k, v)

function pickScope(next) {
  const d = dash.value
  if (!d || next === scope.value) return
  store.ui.layoutScope = next
  // back to global — drop this board's overrides so it genuinely inherits again.
  // No toast: nothing has been applied yet, and announcing a change that Cancel can
  // still take back would be claiming more than happened.
  if (next === 'all') KEYS.forEach((k) => { delete d[FIELD[k]] })
}

const SIZES = [
  { id: 'S', label: 'Small', px: 12 },
  { id: 'M', label: 'Medium', px: 13 },
  { id: 'L', label: 'Large', px: 15 },
]
/* Each slider states what it does to the BOARD, not which property it sets. "Space
 * between widgets" is checkable by looking; "column-gap" is not. */
const SLIDERS = [
  { key: 'hGap', label: 'Horizontal spacing', hint: 'Between widgets, side to side', min: 4, max: 32, step: 2 },
  { key: 'vGap', label: 'Vertical spacing', hint: 'Between rows of widgets', min: 4, max: 32, step: 2 },
  { key: 'cardPad', label: 'Widget padding', hint: 'Inside each widget, around its content', min: 6, max: 24, step: 2 },
  { key: 'rowHeight', label: 'Row height', hint: 'How tall one row of widgets is', min: 110, max: 260, step: 10 },
  { key: 'boardMargin', label: 'Board margin', hint: 'Between the widgets and the edge of the page', min: 8, max: 40, step: 4 },
]

// how many boards a GLOBAL change actually moves — the ones that haven't overridden
const inheriting = computed(() =>
  store.dashboards.filter((d) => !d.archived && KEYS.every((k) => d[FIELD[k]] == null)).length)

const titlePx = computed(() => SIZES.find((s) => s.id === val('titleSize'))?.px || 13)

/* The CTA names the scope it will act on, so the button restates the decision the
 * cards above it record — you never have to look back up to know what Apply does. */
const applyLabel = computed(() => (scope.value === 'all' ? 'Apply to all dashboards' : 'Apply to this dashboard'))

function apply() {
  commitLayoutEdit()
  toast(scope.value === 'all'
    ? `Layout applied to all dashboards — ${inheriting.value} updated`
    : `Layout applied to “${dash.value.name}”`)
  store.ui.layoutOpen = false
}
function cancel() {
  cancelLayoutEdit()
  store.ui.layoutOpen = false
}
</script>

<template>
  <div class="la" :class="variant">
   <!-- everything above the footer scrolls; the footer does not, so Apply is reachable
        without scrolling past five sliders and a preview first -->
   <div class="la-scroll">
    <!-- SCOPE — two option cards, the product's standard radio-card pair.
         Cards rather than a checkbox because the two outcomes are peers, not a thing
         and its negation: "this board" and "every board" are both ordinary answers, and
         each needs a sentence to be understood. A checkbox can only label one of them
         and leaves the other implied.

         Stacked, not side by side: the drawer is 380px, and two columns would give each
         description ~150px, which wraps a two-line sentence into four. -->
    <div class="lsc" role="radiogroup" aria-label="Where these settings apply">
      <label
        class="lsc-opt" :class="{ on: scope === 'this', dis: !dash }"
        :title="dash ? '' : 'Open a dashboard to set its own layout'"
      >
        <span class="lsc-txt">
          <b>This dashboard only</b>
          <em v-if="dash">Only <b>“{{ dash.name }}”</b> changes. Every other board keeps the global layout.</em>
          <em v-else>Open a dashboard to give it a layout of its own.</em>
        </span>
        <input type="radio" name="layout-scope" :checked="scope === 'this'" :disabled="!dash" @change="pickScope('this')" />
      </label>

      <label class="lsc-opt" :class="{ on: scope === 'all' }">
        <span class="lsc-txt">
          <b>Apply to all dashboards</b>
          <em>Sets your global layout. Every board that follows it changes — <b>{{ inheriting }}</b> of them.</em>
        </span>
        <input type="radio" name="layout-scope" :checked="scope === 'all'" @change="pickScope('all')" />
      </label>
    </div>

    <div class="la-body">
      <div class="la-controls">
        <div class="la-fld">
          <label>Widget title size</label>
          <div class="la-seg">
            <button v-for="s in SIZES" :key="s.id" class="la-seg-b" :class="{ on: val('titleSize') === s.id }" @click="setVal('titleSize', s.id)">
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-for="s in SLIDERS" :key="s.key" class="la-fld">
          <label>{{ s.label }} <span class="la-val">{{ val(s.key) }}px</span></label>
          <input
            class="la-rng" type="range" :min="s.min" :max="s.max" :step="s.step"
            :value="val(s.key)" @input="setVal(s.key, +$event.target.value)"
          />
          <span class="la-hint">{{ s.hint }}</span>
        </div>

      </div>

      <!-- A live preview, sized from the real values. A MODEL of the board, not a
           screenshot: four tiles is enough to show a gap, a padding and a title size
           changing together, and it stays legible at drawer width. -->
      <div class="la-preview">
        <span class="la-pv-cap">Preview</span>
        <div class="la-pv-frame" :style="{ padding: val('boardMargin') + 'px' }">
          <div class="la-pv-grid" :style="{ columnGap: val('hGap') + 'px', rowGap: val('vGap') + 'px' }">
            <div
              v-for="t in ['Open Requests', 'By Priority', 'By Status', 'My Tasks']" :key="t"
              class="la-pv-tile" :style="{ padding: val('cardPad') + 'px', minHeight: Math.round(val('rowHeight') * 0.42) + 'px' }"
            >
              <span class="la-pv-title" :style="{ fontSize: titlePx + 'px' }">{{ t }}</span>
              <span class="la-pv-bar" />
              <span class="la-pv-bar short" />
            </div>
          </div>
        </div>
      </div>
    </div>
   </div>

    <!-- FOOTER — the commit pair only. Reset moved up beside Close in the drawer
         header: it changes the draft rather than ending the session, so it is not a
         peer of Cancel/Apply, and it now matches the widget builder's header, which
         pairs the same two actions. It stays outside the scroll area so the commit
         is reachable without scrolling past five sliders and a preview. -->
    <footer class="la-foot">
      <button class="btn" @click="cancel">Cancel</button>
      <button class="btn btn-primary" @click="apply">{{ applyLabel }}</button>
    </footer>
  </div>
</template>

<style scoped>
.la { display: flex; flex-direction: column; min-width: 0; }
.la-scroll { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
/* In the drawer the panel owns the full height and does its own scrolling, so the
   footer can be a plain flex child that never moves. `min-height: 0` is what lets
   the scroll area actually shrink inside the flex column. */
.la.drawer { height: 100%; }
.la.drawer .la-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }

/* ── the scope cards ───────────────────────────────────────────────────────────── */
.lsc { display: flex; flex-direction: column; gap: 8px; }
.lsc-opt {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--r-lg);
  background: var(--surface); cursor: pointer;
  transition: border-color .15s, background .15s;
}
.lsc-opt:hover:not(.dis) { border-color: var(--border-strong); }
/* Selected is a border and a tint, not a fill: the description has to stay readable,
   and a solid brand fill would put 12px muted text on blue. */
.lsc-opt.on { border-color: var(--primary); background: var(--primary-softer); }
.lsc-opt.dis { opacity: .55; cursor: not-allowed; }

.lsc-txt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lsc-txt > b { font-size: 13px; font-weight: 600; color: var(--ink); }
.lsc-txt em { font-style: normal; font-size: 12px; line-height: 1.5; color: var(--muted); }
/* the board's name inside the sentence — emphasised without changing size */
.lsc-txt em b { font-weight: 600; color: var(--ink-2); }
.lsc-opt.on .lsc-txt em b { color: var(--primary-700); }

/* native radio: correct semantics, keyboard and a11y for free. `margin-top` lines the
   circle up with the TITLE's cap-height rather than the block's top edge. */
.lsc-opt input { flex: none; width: 16px; height: 16px; margin: 2px 0 0; accent-color: var(--primary); cursor: inherit; }

/* ── the controls ─────────────────────────────────────────────────────────────── */
.la-body { display: grid; gap: 18px; }
.la.panel .la-body { grid-template-columns: minmax(280px, 360px) 1fr; align-items: start; }
.la.drawer .la-body { grid-template-columns: 1fr; }

.la-controls { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.la-fld { display: flex; flex-direction: column; gap: 6px; }
.la-fld label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--ink); }
.la-val { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.la-hint { font-size: 11px; color: var(--muted); }

.la-seg { display: flex; gap: 2px; padding: 2px; background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--r); }
.la-seg-b { flex: 1; height: 28px; border: none; background: transparent; color: var(--ink-2); border-radius: var(--r); font-size: 12px; font-weight: 500; }
.la-seg-b:hover { background: var(--surface-2); }
.la-seg-b.on { background: var(--primary-soft); color: var(--primary); font-weight: 600; }

.la-rng { width: 100%; accent-color: var(--primary); }

/* ── the footer ───────────────────────────────────────────────────────────────── */
.la-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.la.drawer .la-foot {
  flex: none; padding: 12px 16px;
  background: var(--surface); border-top: 1px solid var(--border);
}
.la.panel .la-foot { margin-top: 18px; }
.la-foot .btn { height: 32px; }

/* ── the preview ──────────────────────────────────────────────────────────────── */
.la-pv-cap { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: 6px; }
.la-pv-frame { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-lg); }
.la-pv-grid { display: grid; grid-template-columns: 1fr 1fr; }
.la-pv-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
.la-pv-title { font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.la-pv-bar { height: 6px; border-radius: var(--r-sm); background: var(--inset); }
.la-pv-bar.short { width: 60%; }
</style>
