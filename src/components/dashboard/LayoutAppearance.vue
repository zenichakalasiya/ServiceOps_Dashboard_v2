<script setup>
/**
 * LayoutAppearance — the dashboard layout settings, as ONE component.
 *
 * ONE entry point: the board's ⋯ menu. The Manage-all-dashboards toolbar icon was
 * removed — that page shows no board, so the drawer opened from there previewed against
 * nothing and had to disable its own "this dashboard" option.
 *
 * It opens on "All dashboards", the broader and more common intent. Pinning a single
 * board away from the global is the deliberate second choice, not the default.
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
import Hint from '../ui/Hint.vue'
import {
  store, byId, toast,
  LAYOUT_FIELD as FIELD, LAYOUT_KEYS as KEYS,
  layoutValue, setLayoutValue, resetLayoutValues, isLayoutDefault,
  commitLayoutEdit, cancelLayoutEdit,
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
const atDefaults = computed(() => isLayoutDefault(dash.value))

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
 * between widgets" is checkable by looking; "column-gap" is not.
 *
 * Widget padding and Board margin were cut. They still exist as `store.layout.cardPad`
 * and `store.layout.boardMargin` and the board still renders from them — they are now
 * fixed product values rather than settings, so nothing on screen changed. Putting them
 * back means one line here plus their key in LAYOUT_FIELD. */
const SLIDERS = [
  { key: 'hGap', label: 'Horizontal spacing', hint: 'Between widgets, side to side', min: 4, max: 32, step: 2 },
  { key: 'vGap', label: 'Vertical spacing', hint: 'Between rows of widgets', min: 4, max: 32, step: 2 },
  { key: 'rowHeight', label: 'Row height', hint: 'How tall one row of widgets is', min: 110, max: 260, step: 10 },
]

// how many boards a GLOBAL change actually moves — the ones that haven't overridden
const inheriting = computed(() =>
  store.dashboards.filter((d) => !d.archived && KEYS.every((k) => d[FIELD[k]] == null)).length)

const titlePx = computed(() => SIZES.find((s) => s.id === val('titleSize'))?.px || 13)
// the slider works in stop indexes; the stored value stays 'S' | 'M' | 'L'
const sizeIdx = computed(() => Math.max(0, SIZES.findIndex((s) => s.id === val('titleSize'))))

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
    <!-- SCOPE — heading, segmented control, one-liner. The same three-part shape as
         Create Dashboard's "Visibility & sharing", using the same values, because this
         asks the same kind of question: one either/or whose consequence needs a sentence.

         The description belongs BELOW the control, not inside each option: only the
         selected scope's consequence matters, and printing both at once asked you to
         read the one you didn't pick. -->
    <div class="la-scope">
      <div class="sec-h">Apply to</div>
      <div class="seg" role="radiogroup" aria-label="Where these settings apply">
        <!-- "All dashboards" leads and is the default. It is the broader, more common
             intent — most layout tuning is meant to stick everywhere — and putting the
             narrower option second means the destructive-ish choice (pinning ONE board
             away from the global) is the deliberate one. -->
        <button
          class="seg-btn" :class="{ on: scope === 'all' }"
          role="radio" :aria-checked="scope === 'all'" @click="pickScope('all')"
        >All dashboards</button>
        <button
          class="seg-btn" :class="{ on: scope === 'this' }" :disabled="!dash"
          :title="dash ? '' : 'Open a dashboard to give it a layout of its own'"
          role="radio" :aria-checked="scope === 'this'" @click="pickScope('this')"
        >This dashboard only</button>
      </div>
      <p class="oneliner">
        <Icon name="info" :size="14" />
        <span v-if="scope === 'this'">Only <b>“{{ dash.name }}”</b> changes. Every other board keeps the global layout.</span>
        <span v-else-if="dash">Sets your global layout. Every board that follows it changes — <b>{{ inheriting }}</b> of them.</span>
        <span v-else>Sets your global layout — <b>{{ inheriting }}</b> boards follow it. Open a dashboard to give that one a layout of its own.</span>
      </p>
    </div>

    <div class="la-body">
      <!-- Two per row. Six fields stacked made the panel a column of sliders you had to
           scroll to compare; paired, the whole layout is one screenful. -->
      <div class="la-controls">
        <!-- A slider, like the other three. It was a segmented control, which made the
             one field that isn't a number look like a different kind of setting.
             S/M/L is a scale — small to large in order — so a track reads it correctly;
             the marks under it say what the three stops are before you drag. -->
        <div class="la-fld">
          <label>Widget title size <Hint text="The size of every widget's title on the board" /></label>
          <div class="la-rng-row">
            <input
              class="la-rng" type="range" min="0" max="2" step="1"
              :value="sizeIdx" @input="setVal('titleSize', SIZES[+$event.target.value].id)"
            />
          </div>
          <div class="la-scale"><span v-for="s in SIZES" :key="s.id">{{ s.id }}</span></div>
        </div>

        <!-- What each slider does to the board now rides the label's info icon, the
             product's standard place for it. A one-liner under all six fields cost a
             line of prose per field to answer a question you have once. -->
        <div v-for="s in SLIDERS" :key="s.key" class="la-fld">
          <label>{{ s.label }} <Hint :text="s.hint" /></label>
          <div class="la-rng-row">
            <input
              class="la-rng" type="range" :min="s.min" :max="s.max" :step="s.step"
              :value="val(s.key)" @input="setVal(s.key, +$event.target.value)"
            />
            <span class="la-val box">{{ val(s.key) }}</span>
          </div>
        </div>
      </div>

      <!-- A live preview, sized from the real values. A MODEL of the board, not a
           screenshot: four tiles is enough to show a gap, a padding and a title size
           changing together, and it stays legible at drawer width. -->
      <div class="la-preview">
        <span class="la-pv-cap">Live preview</span>
        <!-- margin and padding come straight from store.layout: they are no longer
             scoped settings, so routing them through val() would imply a board could
             override them -->
        <div class="la-pv-frame" :style="{ padding: store.layout.boardMargin + 'px' }">
          <div class="la-pv-grid" :style="{ columnGap: val('hGap') + 'px', rowGap: val('vGap') + 'px' }">
            <div
              v-for="t in ['Open Requests', 'By Priority', 'By Status', 'My Tasks']" :key="t"
              class="la-pv-tile" :style="{ padding: store.layout.cardPad + 'px', minHeight: Math.round(val('rowHeight') * 0.42) + 'px' }"
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

    <!-- FOOTER — Reset at the left edge, the commit pair at the right. It is still a
         different KIND of action from those two: it changes the draft rather than
         ending the session, and it stays part of the draft, so Cancel undoes a Reset
         too. The gap between them is what says so. Outside the scroll area, so the
         commit is reachable without scrolling past the fields and the preview. -->
    <footer class="la-foot">
      <button class="la-ghost" :disabled="atDefaults" title="Put every value back to its default" @click="resetLayoutValues(dash)">
        <Icon name="reset" :size="14" /> Reset
      </button>
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
/* 22px gutters, matching the Create Dashboard drawer this one now sits beside in width */
.la.drawer .la-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 22px 20px; }

/* ── the scope block ──────────────────────────────────────────────────────────── */
/* Values copied from CreateDashboardPanel's Visibility & sharing rather than
   approximated — scoped CSS can't share them, so the numbers have to match by hand
   for the two panels to read as one product. */
.la-scope { display: flex; flex-direction: column; }
.sec-h { font-size: 14px; font-weight: 600; color: var(--ink); margin: 0 0 8px; }

.seg { display: inline-flex; gap: 2px; padding: 4px; background: var(--surface-2); border-radius: 4px; align-self: flex-start; }
.seg-btn { display: flex; align-items: center; justify-content: center; height: 32px; padding: 0 22px; border-radius: 4px; border: none; background: transparent; color: var(--ink-2); font-weight: 500; font-size: 13px; }
/* `:not(.on)` is load-bearing, not tidiness. Hover has to be excluded from the active
   segment explicitly: `:hover:not(:disabled)` is (0,3,0) and outranks `.seg-btn.on` at
   (0,2,0), so it repainted the white label near-black on the near-black fill. Naming
   `.on` here settles it by specificity rather than by source order. */
.seg-btn:not(.on):not(:disabled):hover { color: var(--ink); }
/* colour marks WHICH option is in force — a soft tint would read as "hovered".
   The label is `--surface`, NOT #fff: `--ink` is near-black in light but near-WHITE
   in dark (#ececf3), so a hardcoded white label vanished on it — 1.18:1. `--surface`
   inverts with the fill, and in light it resolves to #ffffff, exactly as before. */
.seg-btn.on { background: var(--ink); color: var(--surface); font-weight: 600; box-shadow: var(--sh-sm); }
.seg-btn:disabled { color: var(--muted-2); cursor: not-allowed; }

/* `align-items: flex-start` not center: the sentence wraps to two lines at this width,
   and a vertically-centred icon would float in the middle of the paragraph */
.oneliner { display: flex; align-items: flex-start; gap: 8px; margin: 10px 0 0; padding: 9px 11px; background: var(--surface-2); border-radius: 4px; font-size: 13px; line-height: 1.5; color: var(--ink-2); }
.oneliner :deep(.ico) { color: var(--muted); flex: none; margin-top: 2px; }
.oneliner b { font-weight: 600; color: var(--ink); }

/* ── the controls ─────────────────────────────────────────────────────────────── */
.la-body { display: grid; gap: 18px; }
.la.panel .la-body { grid-template-columns: minmax(280px, 360px) 1fr; align-items: start; }
.la.drawer .la-body { grid-template-columns: 1fr; }

/* two per row; `align-items: start` so a wrapped label can't stretch its neighbour */
.la-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 18px; align-items: start; min-width: 0; }
.la-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.la-fld label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--ink); }

/* the value sits beside the track, not up in the label: at half width the label row is
   short and a right-floated number drifted away from the control it belonged to */
.la-rng-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
/* a FIXED width, not min-width: "14" and "140" in different chips gave their sliders
   different lengths, and two tracks in the same column stopping at different points
   reads as a mistake. 46px holds three digits. */
/* A bordered box, as the reference draws it, not a filled chip — beside a track this
   value is the track's CURRENT reading and the outline says it is a field you could
   type into next, which is where this is heading. A grey fill made it look disabled. */
.la-val {
  flex: none; width: 46px; height: 30px;
  display: inline-grid; place-items: center;
  background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--r);
  font-size: 12px; font-weight: 500; color: var(--ink); font-variant-numeric: tabular-nums;
}

/* `margin: 0` overrides Chrome's UA 2px on range inputs — it made every track start
   2px inside its column, and put the S/L marks 2px off the track they label. */
.la-rng { flex: 1; min-width: 0; margin: 0; accent-color: var(--primary); }

/* the S · M · L stops. `margin-right` is the chip's 46px plus the row's 10px gap, so
   the marks sit under the TRACK rather than under the track-plus-chip — the first and
   last land on the thumb's actual end positions. */
.la-scale { display: flex; justify-content: space-between; margin: 2px 56px 0 0; font-size: 11px; color: var(--muted); }

/* ── the footer ───────────────────────────────────────────────────────────────── */
.la-foot { display: flex; align-items: center; gap: 8px; }
/* Reset holds the left edge; `margin-right: auto` on it is what pushes the commit
   pair right, so the gap between them carries the "different kind of action" */
.la-ghost {
  display: inline-flex; align-items: center; gap: 6px; margin-right: auto;
  height: 32px; padding: 0 10px; border: none; background: transparent;
  color: var(--ink-2); border-radius: var(--r); font-size: 13px; font-weight: 500;
}
.la-ghost:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
.la-ghost:disabled { opacity: .4; cursor: not-allowed; }
.la.drawer .la-foot {
  flex: none; padding: 12px 22px;
  background: var(--surface); border-top: 1px solid var(--border);
}
.la.panel .la-foot { margin-top: 18px; }
.la-foot .btn { height: 32px; }

/* ── the preview ──────────────────────────────────────────────────────────────── */
.la-pv-cap { display: block; font-size: 12px; font-weight: 500; color: var(--muted); margin-bottom: 8px; }
.la-pv-frame { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-lg); }
.la-pv-grid { display: grid; grid-template-columns: 1fr 1fr; }
.la-pv-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
.la-pv-title { font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.la-pv-bar { height: 6px; border-radius: var(--r-sm); background: var(--inset); }
.la-pv-bar.short { width: 60%; }
</style>
