<script setup>
/**
 * LayoutAppearance — the global dashboard layout settings, as ONE component.
 *
 * Four different entry points open this (see store.ui.layoutEntry): a tab on Manage
 * all dashboards, an icon in that page's toolbar, an icon beside "Manage all
 * dashboards" in the listing sidebar, and a live drawer over the board itself. They
 * differ in WHERE you reach the settings, never in what the settings are — so this is
 * a single component with a `variant`, not four copies that drift apart.
 *
 * Everything writes straight to `store.layout` with no Save step. Layout is a
 * preference, not a form: the value you can see is the value that is in force, and an
 * unsaved slider position would be a fifth state nobody asked for. `Reset to defaults`
 * is the undo.
 */
import { computed } from 'vue'
import Icon from '../ui/Icon.vue'
import { store, toast } from '../../store/index.js'

const props = defineProps({
  // 'panel'  full width, for the Manage page tab
  // 'drawer' narrow column, for the board drawer and the two icon entries
  variant: { type: String, default: 'panel' },
})

const L = store.layout

/* S / M / L rather than a pixel slider: a title size is a choice between three
 * legible steps, and letting someone land on 11.5px would only produce a board that
 * looks subtly broken. The values are the guide's integer scale. */
const SIZES = [
  { id: 'S', label: 'Small', px: 12 },
  { id: 'M', label: 'Medium', px: 13 },
  { id: 'L', label: 'Large', px: 15 },
]

/* Each slider states what it does to the BOARD, not what property it sets. "Space
 * between widgets" is checkable by looking; "column-gap" is not. */
const SLIDERS = [
  { key: 'hGap', label: 'Horizontal spacing', hint: 'Between widgets, side to side', min: 4, max: 32, step: 2 },
  { key: 'vGap', label: 'Vertical spacing', hint: 'Between rows of widgets', min: 4, max: 32, step: 2 },
  { key: 'cardPad', label: 'Widget padding', hint: 'Inside each widget, around its content', min: 6, max: 24, step: 2 },
  { key: 'rowHeight', label: 'Row height', hint: 'How tall one row of widgets is', min: 110, max: 260, step: 10 },
  { key: 'boardMargin', label: 'Board margin', hint: 'Between the widgets and the edge of the page', min: 8, max: 40, step: 4 },
]

const DEFAULTS = { titleSize: 'M', cardPad: 12, hGap: 14, vGap: 14, rowHeight: 140, boardMargin: 16 }
const isDefault = computed(() => Object.keys(DEFAULTS).every((k) => L[k] === DEFAULTS[k]))
function resetAll() { Object.assign(store.layout, DEFAULTS); toast('Layout reset to defaults') }

// how many boards this actually moves — the ones that haven't overridden the field
const inheriting = computed(() =>
  store.dashboards.filter((d) => !d.archived && d.hGap == null && d.vGap == null && d.rowHeight == null).length)
const overriding = computed(() =>
  store.dashboards.filter((d) => !d.archived && (d.hGap != null || d.vGap != null || d.rowHeight != null)).length)

const titlePx = computed(() => SIZES.find((s) => s.id === L.titleSize)?.px || 13)
</script>

<template>
  <div class="la" :class="variant">
    <!-- The scope line is the whole reason this reads as a GLOBAL setting rather than
         one more per-board form. It names a number, because "all dashboards" is a claim
         the user can check and a count is what makes it checkable. -->
    <p class="la-scope">
      <Icon name="info" :size="14" />
      <span>
        Applies to <b>all {{ inheriting }} dashboards</b> that follow the global layout.
        <template v-if="overriding">{{ overriding }} board{{ overriding > 1 ? 's have' : ' has' }} its own layout and won’t change.</template>
      </span>
    </p>

    <div class="la-body">
      <div class="la-controls">
        <div class="la-fld">
          <label>Widget title size</label>
          <div class="la-seg">
            <button v-for="s in SIZES" :key="s.id" class="la-seg-b" :class="{ on: L.titleSize === s.id }" @click="L.titleSize = s.id">
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-for="s in SLIDERS" :key="s.key" class="la-fld">
          <label>{{ s.label }} <span class="la-val">{{ L[s.key] }}px</span></label>
          <input class="la-rng" type="range" :min="s.min" :max="s.max" :step="s.step" v-model.number="L[s.key]" />
          <span class="la-hint">{{ s.hint }}</span>
        </div>

        <button class="la-reset" :disabled="isDefault" @click="resetAll">
          <Icon name="undo" :size="14" /> Reset to defaults
        </button>
      </div>

      <!-- A live preview, sized from the real values. It is a MODEL of the board, not a
           screenshot of it: four tiles is enough to show a gap, a padding and a title
           size changing together, and it stays legible at drawer width. -->
      <div class="la-preview">
        <span class="la-pv-cap">Preview</span>
        <div class="la-pv-frame" :style="{ padding: L.boardMargin + 'px' }">
          <div class="la-pv-grid" :style="{ columnGap: L.hGap + 'px', rowGap: L.vGap + 'px' }">
            <div
              v-for="t in ['Open Requests', 'By Priority', 'By Status', 'My Tasks']" :key="t"
              class="la-pv-tile" :style="{ padding: L.cardPad + 'px', minHeight: Math.round(L.rowHeight * 0.42) + 'px' }"
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
</template>

<style scoped>
.la { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.la-scope { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 10px 12px; font-size: 12px; line-height: 1.5; color: var(--primary-700); background: var(--primary-softer); border: 1px solid var(--primary-soft); border-radius: var(--r); }
.la-scope :deep(.ico) { flex: none; margin-top: 1px; }

/* Side by side when there is room (the Manage tab), stacked when there isn't (a
   drawer). The preview is worth more than the controls when space is short, so it
   never collapses away — it just moves under them. */
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

.la-reset { display: inline-flex; align-items: center; justify-content: center; gap: 6px; align-self: flex-start; height: 32px; padding: 0 12px; border: 1px solid var(--border-control); background: var(--surface); color: var(--ink-2); border-radius: var(--r); font-size: 13px; font-weight: 500; }
.la-reset:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
.la-reset:disabled { opacity: .45; cursor: not-allowed; }

/* the preview */
.la-pv-cap { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: 6px; }
.la-pv-frame { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-lg); }
.la-pv-grid { display: grid; grid-template-columns: 1fr 1fr; }
.la-pv-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
.la-pv-title { font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.la-pv-bar { height: 6px; border-radius: var(--r-sm); background: var(--inset); }
.la-pv-bar.short { width: 60%; }
</style>
