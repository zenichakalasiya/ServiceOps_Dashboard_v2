<script setup>
/**
 * IconLibrary — every icon this product ships, on one page, for developers.
 *
 * Modelled on the ticket-detail project's Icon Library so the two read as the same
 * reference: a size switcher, a search, a "how to use" note, then shelved sections of
 * click-to-copy tiles.
 *
 * It enumerates `data/icons.js` rather than listing anything itself, so an icon added
 * to the product appears here without anyone remembering to. That is the whole reason
 * the map moved out of Icon.vue.
 *
 * TWO families are catalogued, and they are not interchangeable:
 *   - the lucide set (137), drawn by `Icon.vue` from a name
 *   - the illustrated chart set (18), drawn by `ChartIcon.vue` — hand-built 64×64
 *     artwork for the widget picker, which does not exist in lucide
 * They copy differently, so each tile says which it is.
 */
import { ref, computed } from 'vue'
import Icon from '../components/ui/Icon.vue'
import ChartIcon from '../components/ui/ChartIcon.vue'
import { ICON_MAP, ICON_GROUPS } from '../data/icons.js'
import { toast } from '../store/index.js'

/* The sizes this product actually draws at, not a generic ramp: 13–14 inline with
   12–13px text, 15 inside 32px controls, 16 nav and section headers, 18 panel headers
   and close buttons. 48 is not a product size — it is here to inspect the artwork. */
const SIZES = [13, 15, 16, 18, 24, 48]
const size = ref(18)
const q = ref('')

/* The illustrated set is listed by hand because it is not in ICON_MAP — these are
   ChartIcon's own artwork, keyed by the picker's type ids. */
const CHART_ICONS = [
  'line', 'bar', 'column', 'pie', 'donut', 'stack', 'grouped', 'multiline',
  'combo', 'gauge', 'hist', 'heatmap', 'funnel', 'mapbubble', 'kpi', 'shortcut',
  'text', 'group',
]

const norm = (s) => s.toLowerCase().replace(/[-_\s]/g, '')
const hit = (name, cat) => !q.value || norm(name + cat).includes(norm(q.value))

const groups = computed(() =>
  Object.entries(ICON_GROUPS)
    .map(([cat, names]) => ({ cat, names: names.filter((n) => hit(n, cat)) }))
    .filter((g) => g.names.length),
)
const chartGroup = computed(() => CHART_ICONS.filter((n) => hit(n, 'chart illustrated')))
const shown = computed(() => groups.value.reduce((n, g) => n + g.names.length, 0) + chartGroup.value.length)
const total = Object.keys(ICON_MAP).length + CHART_ICONS.length

/* Copy the rendered SVG, not a component name: what a developer wants from a page like
   this is either the markup to paste or the name to type, and the markup is the one they
   cannot get by reading the source. Shift-click gives the name instead. */
async function copyIcon(name, el, isChart) {
  const svg = el.querySelector('svg')
  if (!svg) return
  const out = svg.outerHTML
    .replace(/\s(data-v-[a-z0-9]+)=""/g, '')
    .replace(/\sclass="[^"]*"/, '')
  try {
    await navigator.clipboard.writeText(out)
    toast(`${name} — SVG copied at ${size.value}px`, 'success')
  } catch {
    toast('Clipboard blocked by the browser', 'error')
  }
}
async function copyName(name, isChart) {
  const snippet = isChart ? `<ChartIcon name="${name}" :size="64" />` : `<Icon name="${name}" :size="${size.value}" />`
  try {
    await navigator.clipboard.writeText(snippet)
    toast(`${snippet} copied`, 'success')
  } catch {
    toast('Clipboard blocked by the browser', 'error')
  }
}
</script>

<template>
  <div class="il">
    <header class="il-head">
      <div>
        <h1>Icon Library</h1>
        <p class="il-sub">
          Every icon used across the dashboards module ·
          <b>{{ total }}</b> total<span v-if="q"> · {{ shown }} matching</span>
        </p>
      </div>
      <div class="seg">
        <button
          v-for="s in SIZES" :key="s" class="seg-b" :class="{ on: size === s }"
          @click="size = s"
        >{{ s }}px</button>
      </div>
    </header>

    <div class="il-search">
      <Icon name="search" :size="15" class="muted" />
      <input v-model="q" placeholder="Search icons by name or category…" />
      <button v-if="q" class="il-clear" title="Clear" @click="q = ''"><Icon name="x" :size="14" /></button>
    </div>

    <section class="il-how">
      <div class="il-how-h">How to use</div>
      <p>
        Icons are <b>lucide</b> (<code>lucide-vue-next</code>), drawn through
        <code>&lt;Icon name="…" /&gt;</code>. Call sites name what an icon <b>means</b>, not which
        glyph draws it, so the whole set can be swapped in <code>data/icons.js</code> alone.
        The <b>Widget artwork</b> set is different: hand-built 64×64 illustrations in
        <code>ChartIcon.vue</code> for the widget picker, with no lucide equivalent.
      </p>
      <p>
        <b>Click</b> a tile to copy its SVG at the selected size.
        <b>Shift-click</b> to copy the component tag instead.
        Product sizes: <b>13–14px</b> inline with text, <b>15px</b> inside 32px controls,
        <b>16px</b> nav and section headers, <b>18px</b> panel headers and close buttons.
      </p>
    </section>

    <section v-if="chartGroup.length" class="il-sec">
      <div class="il-sec-h">Widget artwork <span>— illustrated, ChartIcon.vue · {{ chartGroup.length }}</span></div>
      <div class="il-grid">
        <button
          v-for="n in chartGroup" :key="'c-' + n" class="il-tile"
          :title="`${n} — click to copy SVG, shift-click for the tag`"
          @click="$event.shiftKey ? copyName(n, true) : copyIcon(n, $event.currentTarget, true)"
        >
          <span class="il-ico chart"><ChartIcon :name="n" :size="Math.max(size, 40)" /></span>
          <span class="il-name">{{ n }}</span>
        </button>
      </div>
    </section>

    <section v-for="g in groups" :key="g.cat" class="il-sec">
      <div class="il-sec-h">{{ g.cat }} <span>— {{ g.names.length }}</span></div>
      <div class="il-grid">
        <button
          v-for="n in g.names" :key="n" class="il-tile"
          :title="`${n} — click to copy SVG, shift-click for the tag`"
          @click="$event.shiftKey ? copyName(n, false) : copyIcon(n, $event.currentTarget, false)"
        >
          <span class="il-ico"><Icon :name="n" :size="size" /></span>
          <span class="il-name">{{ n }}</span>
        </button>
      </div>
    </section>

    <p v-if="!shown" class="il-none">No icon matches “{{ q }}”.</p>
  </div>
</template>

<style scoped>
.il { padding: 20px 24px 48px; max-width: 1500px; }
.il-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
.il-head h1 { margin: 0; font-size: 20px; font-weight: 700; color: var(--ink); }
.il-sub { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
.il-sub b { color: var(--ink); font-weight: 600; }

.il-search { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--r); margin-bottom: 14px; }
.il-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--ink); }
.il-clear { border: none; background: transparent; color: var(--muted); display: grid; place-items: center; padding: 2px; border-radius: var(--r); }
.il-clear:hover { background: var(--surface-2); color: var(--ink); }

.il-how { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 14px 16px; margin-bottom: 26px; }
.il-how-h { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
.il-how p { margin: 0 0 6px; font-size: 12.5px; line-height: 1.6; color: var(--ink-2); max-width: 110ch; }
.il-how p:last-child { margin-bottom: 0; }
.il-how code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 1px 5px; }

.il-sec { margin-bottom: 30px; }
.il-sec-h { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.il-sec-h span { font-weight: 400; color: var(--muted); }

/* auto-fill rather than a fixed column count: the page is read at whatever width the
   window happens to be, and a fixed 13 columns either overflowed or left a gutter */
.il-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 10px; }
.il-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  min-height: 88px; padding: 12px 8px;
  background: var(--surface); border: 1px solid var(--picker-tile-border); border-radius: var(--r-lg);
  color: var(--ink-2); cursor: pointer; transition: border-color .15s, box-shadow .15s;
}
.il-tile:hover { border-color: var(--muted-2); box-shadow: var(--sh-sm); }
.il-tile:active { box-shadow: none; }
/* a fixed 48px well so the tiles do not resize as the size switcher moves — the grid
   should stay still and only the glyph inside it change */
.il-ico { height: 48px; display: grid; place-items: center; }
.il-ico.chart { color: var(--picker-ico); }
.il-name { font-size: 11px; line-height: 1.3; color: var(--muted); text-align: center; word-break: break-word; }
.il-tile:hover .il-name { color: var(--ink); }
.il-none { color: var(--muted); font-size: 13px; padding: 30px 0; }
</style>
