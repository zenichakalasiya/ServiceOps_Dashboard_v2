<script setup>
/**
 * EmptyStateGallery — every empty state this product can show, on one page.
 *
 * A reference screen, not a product screen — the same role the Icon Library plays, and
 * it sits beside it in the rail for that reason. Two audiences: design, checking the
 * wording and the disc read at a glance across all of them; developers, seeing which
 * state a kind resolves to without seeding a board to get there.
 *
 * It enumerates `data/emptyStates.js` and renders the real `WidgetEmpty`, so a kind
 * added to the table appears here on its own and the page can never show wording the
 * product does not. Nothing on this page is a mock-up of the state — it IS the state.
 */
import { computed } from 'vue'
import Icon from '../components/ui/Icon.vue'
import WidgetEmpty from '../components/dashboard/WidgetEmpty.vue'
import { CHART_TYPES } from '../data/chartTypes.js'
import { EMPTY_BY_KIND, EMPTY_BY_TYPE, EMPTY_BY_STATE } from '../data/emptyStates.js'
import { toast } from '../store/index.js'

/* Driven off CHART_TYPES, so the order and the labels are the product's own — the
   catalogue cannot list a kind the builder doesn't offer, or name one differently. */
const charts = computed(() =>
  CHART_TYPES
    .filter((t) => EMPTY_BY_KIND[t.id])
    .map((t) => ({ key: t.id, label: t.label, note: `chart.kind “${t.id}”`, state: EMPTY_BY_KIND[t.id] })),
)

const nonCharts = [
  { key: 'kpi', label: 'KPI', note: 'tile.type “kpi”', state: EMPTY_BY_TYPE.kpi },
  { key: 'shortcut', label: 'Shortcut', note: 'tile.type “shortcut”', state: EMPTY_BY_TYPE.shortcut },
]

const faults = [
  { key: 'error', label: 'Failed to load', note: 'tile.state “error”', state: EMPTY_BY_STATE.error },
  { key: 'unconfigured', label: 'Not set up', note: 'tile.state “unconfigured”', state: EMPTY_BY_STATE.unconfigured },
]

const total = computed(() => charts.value.length + nonCharts.length + faults.length)

// the catalogue's buttons are real buttons; they just have no widget to act on
function demoAct(a) {
  toast(a === 'retry' ? 'Retry — on a real widget this refetches the tile' : 'Configure — on a real widget this opens the builder')
}
</script>

<template>
  <div class="es">
    <header class="es-head">
      <div>
        <h1>Empty states</h1>
        <p class="es-sub">
          Every state a widget can show when it has nothing to draw — {{ total }} of them.
          Each one below is the real component, not a mock-up, so the wording here is the
          wording the product ships.
        </p>
      </div>
    </header>

    <!-- The spec, stated once. A reference page that shows the states but not their
         measurements sends the reader to the source anyway. -->
    <section class="es-spec">
      <div class="es-spec-h"><Icon name="info" :size="15" /> The anatomy</div>
      <ul>
        <li><b>Disc</b> — 56 × 56, a full circle, on <code>--icon-hover</code>.</li>
        <li><b>Mark</b> — 24 × 24. The tile's own chart artwork for an empty period; a plain glyph for a fault.</li>
        <li><b>Title</b> — names the absence in that chart's terms, so an empty tile does not read as a broken one.</li>
        <li><b>Line below</b> — one next step the person can take from here, and only one.</li>
      </ul>
    </section>

    <!-- CHARTS -->
    <section class="es-sec">
      <div class="es-sec-h">
        Widgets — no data in the period <span>— {{ charts.length }} chart types</span>
      </div>
      <div class="es-grid">
        <article v-for="c in charts" :key="c.key" class="es-tile card">
          <div class="es-tile-h">
            <span class="es-tile-t">{{ c.label }}</span>
            <code class="es-tile-k">{{ c.note }}</code>
          </div>
          <div class="es-tile-b"><WidgetEmpty :state="c.state" /></div>
        </article>
      </div>
    </section>

    <!-- KPI + SHORTCUT -->
    <section class="es-sec">
      <div class="es-sec-h">KPIs and Shortcuts <span>— the tiles that are not charts</span></div>
      <div class="es-grid">
        <article v-for="c in nonCharts" :key="c.key" class="es-tile card">
          <div class="es-tile-h">
            <span class="es-tile-t">{{ c.label }}</span>
            <code class="es-tile-k">{{ c.note }}</code>
          </div>
          <div class="es-tile-b"><WidgetEmpty :state="c.state" /></div>
        </article>
      </div>
    </section>

    <!-- FAULTS -->
    <section class="es-sec">
      <div class="es-sec-h">
        Not an empty period <span>— a fault and an unfinished setup, which carry an action</span>
      </div>
      <div class="es-grid">
        <article v-for="c in faults" :key="c.key" class="es-tile card">
          <div class="es-tile-h">
            <span class="es-tile-t">{{ c.label }}</span>
            <code class="es-tile-k">{{ c.note }}</code>
          </div>
          <div class="es-tile-b">
            <WidgetEmpty :state="c.state" :kind="c.key" @act="demoAct" />
          </div>
        </article>
      </div>
    </section>

    <!-- The copy, as a table. The cards show how each one LOOKS; this shows them as a
         set, which is the only way to catch two kinds that ended up saying the same
         thing, or one remedy that drifted out of line with the rest. -->
    <section class="es-sec">
      <div class="es-sec-h">The wording, side by side <span>— data/emptyStates.js</span></div>
      <div class="es-table-wrap">
        <table class="es-table">
          <thead>
            <tr><th>Widget</th><th>Line shown</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in [...charts, ...nonCharts, ...faults]" :key="'r-' + c.key">
              <td class="es-td-k">{{ c.label }}</td>
              <td>{{ c.state.sub }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.es { padding: 24px 28px 48px; max-width: 1180px; }
.es-head { margin-bottom: 20px; }
.es-head h1 { margin: 0 0 6px; font-size: 20px; font-weight: 600; color: var(--ink); }
.es-sub { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.55; max-width: 720px; }

.es-spec { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 14px 16px; margin-bottom: 26px; }
.es-spec-h { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
.es-spec ul { margin: 0; padding-left: 18px; }
.es-spec li { font-size: 12.5px; color: var(--muted); line-height: 1.75; }
.es-spec b { color: var(--ink-2); font-weight: 600; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.5px; }

.es-sec { margin-bottom: 30px; }
.es-sec-h { font-size: 12px; font-weight: 600; letter-spacing: .02em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 12px; }
.es-sec-h span { font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--muted); }

/* auto-fill, so the catalogue reflows to the window instead of pinning a column count
   that only looks right at one width */
.es-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 16px; }
/* Each cell is a real widget card — same border, same radius, same grey header band — so
   the state is judged in the frame it actually ships in, not floating on the page. */
.es-tile { display: flex; flex-direction: column; overflow: hidden; min-height: 212px; }
.es-tile-h { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 8px 12px; background: var(--bg); border-bottom: 1px solid var(--border); }
.es-tile-t { font-size: 13px; font-weight: 600; color: var(--ink); }
.es-tile-k { color: var(--muted-2); white-space: nowrap; }
.es-tile-b { flex: 1; display: flex; padding: 12px; min-height: 0; }

.es-table-wrap { border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; background: var(--surface); }
.es-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.es-table th { text-align: left; font-weight: 600; color: var(--ink-2); background: var(--bg); padding: 9px 14px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.es-table td { padding: 9px 14px; border-bottom: 1px solid var(--border-hairline); color: var(--muted); vertical-align: top; line-height: 1.5; }
.es-table tr:last-child td { border-bottom: none; }
.es-td-k { color: var(--ink-2); font-weight: 600; white-space: nowrap; }
.es-td-t { color: var(--ink); }
</style>
