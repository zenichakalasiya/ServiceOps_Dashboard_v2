<script setup>
/**
 * LayoutAppearance — the dashboard layout settings, as ONE component.
 *
 * Four entry points open this (see store.ui.layoutEntry): a tab on Manage all
 * dashboards, an icon in that page's toolbar, an icon beside "Manage all dashboards"
 * in the listing sidebar, and a live drawer over the board. They differ in WHERE you
 * reach the settings, never in what the settings are.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────────
 * "Apply to all my dashboards" decides WHERE the values are written:
 *   checked   → store.layout, the global default every board inherits
 *   unchecked → the open dashboard's own fields, which win over the global
 *
 * The checkbox only exists when a dashboard is actually open. From the Manage page
 * there is no "this one" to apply to, so the panel is global by definition and says
 * so instead of offering a choice with one real option.
 *
 * Unticking SEEDS the board from whatever is currently in force, so the board does not
 * jump the moment you narrow the scope. Re-ticking DELETES the board's overrides, so
 * the box going back on genuinely returns it to the global — a checkbox that left the
 * old values behind would be a lie.
 *
 * There is no Save. Layout is a preference: the value you can see is the value in
 * force, and an unsaved slider position would be a state nobody asked for.
 */
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../ui/Icon.vue'
import { store, byId, toast } from '../../store/index.js'

const props = defineProps({
  // 'panel'  full width, for the Manage page tab
  // 'drawer' narrow column, for the board drawer and the two icon entries
  variant: { type: String, default: 'panel' },
})

/* The board in context, from the route — so no entry point has to thread it down.
 * null anywhere that isn't a dashboard, which is exactly when the scope choice
 * should disappear. */
const route = useRoute()
const dash = computed(() => (route.params.id ? byId(route.params.id) : null))

/* A global key and its per-dashboard counterpart. Only `titleSize` differs: the board
 * has carried `headerFont` since before this setting existed, and renaming a stored
 * field to tidy a map would break every board that already has one. */
const FIELD = {
  titleSize: 'headerFont', cardPad: 'cardPad', hGap: 'hGap',
  vGap: 'vGap', rowHeight: 'rowHeight', boardMargin: 'boardMargin',
}
const KEYS = Object.keys(FIELD)

const applyToAll = ref(true)
// leaving the board (or opening from Manage) can't leave a board-scoped panel behind
watch(dash, (d) => { if (!d) applyToAll.value = true })

/** What a field currently resolves to, whichever scope is in force. */
const val = (k) => (applyToAll.value ? store.layout[k] : (dash.value?.[FIELD[k]] ?? store.layout[k]))
/** Write it wherever the scope says. */
function setVal(k, v) {
  if (applyToAll.value) store.layout[k] = v
  else if (dash.value) dash.value[FIELD[k]] = v
}

function onScope(next) {
  applyToAll.value = next
  const d = dash.value
  if (!d) return
  if (next) {
    // back to global — drop this board's overrides so it actually inherits again
    KEYS.forEach((k) => { delete d[FIELD[k]] })
    toast(`“${d.name}” follows the global layout again`)
  } else {
    // narrowing scope must not move the board: seed it from what is already showing
    KEYS.forEach((k) => { if (d[FIELD[k]] == null) d[FIELD[k]] = store.layout[k] })
    toast(`Changes now apply to “${d.name}” only`)
  }
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

const DEFAULTS = { titleSize: 'M', cardPad: 12, hGap: 14, vGap: 14, rowHeight: 140, boardMargin: 16 }
const isDefault = computed(() => KEYS.every((k) => val(k) === DEFAULTS[k]))
function resetAll() {
  KEYS.forEach((k) => setVal(k, DEFAULTS[k]))
  toast(applyToAll.value ? 'Global layout reset to defaults' : `“${dash.value?.name}” reset to defaults`)
}

// how many boards a GLOBAL change actually moves — the ones that haven't overridden
const inheriting = computed(() =>
  store.dashboards.filter((d) => !d.archived && KEYS.every((k) => d[FIELD[k]] == null)).length)
const overriding = computed(() =>
  store.dashboards.filter((d) => !d.archived && KEYS.some((k) => d[FIELD[k]] != null)).length)

const titlePx = computed(() => SIZES.find((s) => s.id === val('titleSize'))?.px || 13)
</script>

<template>
  <div class="la" :class="variant">
    <!-- SCOPE. A checkbox, because the two outcomes are not equal weight: applying to
         everything is the norm and narrowing it is the exception you opt into. The line
         underneath names the board, so the consequence is legible before you commit. -->
    <label v-if="dash" class="la-scope-pick" :class="{ narrowed: !applyToAll }">
      <input type="checkbox" :checked="applyToAll" @change="onScope($event.target.checked)" />
      <span class="la-sp-txt">
        <b>Apply to all my dashboards</b>
        <em v-if="applyToAll">Every board that follows the global layout changes — {{ inheriting }} of them.</em>
        <em v-else>Only <b>“{{ dash.name }}”</b> changes. Your other boards keep the global layout.</em>
      </span>
    </label>

    <!-- no board in context (the Manage page) — global is the only thing it can mean -->
    <p v-else class="la-scope">
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

        <button class="la-reset" :disabled="isDefault" @click="resetAll">
          <Icon name="undo" :size="14" /> Reset to defaults
        </button>
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
</template>

<style scoped>
.la { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

/* the scope checkbox — a real row, not a stray tick beside a label */
.la-scope-pick { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface-2); cursor: pointer; }
.la-scope-pick input { margin: 2px 0 0; accent-color: var(--primary); flex: none; width: 16px; height: 16px; }
/* narrowed to one board is the EXCEPTION, so it is marked — otherwise a panel that
   silently edits one board looks identical to one editing them all */
.la-scope-pick.narrowed { border-color: var(--amber); background: var(--amber-soft); }
.la-sp-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.la-sp-txt b { font-size: 13px; font-weight: 600; color: var(--ink); }
.la-sp-txt em { font-style: normal; font-size: 11px; line-height: 1.45; color: var(--muted); }
.la-scope-pick.narrowed .la-sp-txt em { color: var(--amber); }
.la-scope-pick.narrowed .la-sp-txt em b { color: var(--amber); font-weight: 600; }

.la-scope { display: flex; align-items: flex-start; gap: 8px; margin: 0; padding: 10px 12px; font-size: 12px; line-height: 1.5; color: var(--primary-700); background: var(--primary-softer); border: 1px solid var(--primary-soft); border-radius: var(--r); }
.la-scope :deep(.ico) { flex: none; margin-top: 1px; }

/* Side by side when there is room (the Manage tab), stacked when there isn't (a
   drawer). The preview never collapses away — it is worth more than the controls. */
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
