<script setup>
/**
 * LoaderGallery — the widget-loader candidates, side by side, each running inside a
 * widget-shaped card so it is judged where it would live. Speed and captions are
 * adjustable, so a pick is made on the real feel rather than on one frame.
 */
import { ref } from 'vue'
import ChartLoader from '../components/ui/ChartLoader.vue'
import ChartLoaderScene from '../components/ui/ChartLoaderScene.vue'

const speed = ref(1)
const captions = ref(true)
const SPEEDS = [{ v: 0.75, l: 'Calm' }, { v: 1, l: 'Normal' }, { v: 1.5, l: 'Lively' }]

const VARIANTS = [
  { id: 'morph', name: 'Chart Morph', widget: 'Open Requests by Status',
    what: 'One chart turns into the next — columns drop, their tops become a trend line, it curls into a donut, loose dots gather into a pattern, and blocks drop into columns.',
    why: 'A little story in five beats; people watch to see what it becomes next.' },
  { id: 'trend', name: 'Live Trend', widget: 'Requests Created — Last 30 days',
    what: 'A line draws itself across the grid with a glowing dot riding its tip, and the area fills in behind it.',
    why: 'The eye follows the moving dot, the way it follows a cursor on a live ticker.' },
  { id: 'orbit', name: 'Orbit Donut', widget: 'Requests by Priority',
    what: 'Donut arcs grow one after another while the ring slowly turns, and the centre counts up to 100%.',
    why: 'The rising number gives the wait a clear sense of progress.' },
  { id: 'equalizer', name: 'Equalizer', widget: 'Requests by Team',
    what: 'Colour bars rise and fall out of step, like an audio meter.',
    why: 'Rhythmic, never quite repeating — pleasant to look at for a few seconds.' },
  { id: 'slices', name: 'Slice Assembly', widget: 'Requests by Source',
    what: 'Pie slices fly in from every side, snap together, breathe apart, and gather again.',
    why: 'The snap is satisfying — it lands like a puzzle piece.' },
  { id: 'scatter', name: 'Find the Pattern', widget: 'Resolution Time vs Priority',
    what: 'Loose dots drift into a line, and the trend draws itself through them.',
    why: '“Order from noise” — it says the data is being made sense of.' },
  { id: 'blocks', name: 'Block Drop', widget: 'Status by Priority',
    what: 'Coloured blocks drop into columns with a little bounce and stack up.',
    why: 'Playful and physical — a small reward each time a column fills.' },
  { id: 'gauge', name: 'Needle Hunt', widget: 'SLA Compliance',
    what: 'A gauge needle hunts across the bands and settles, with a live value under it.',
    why: 'Feels like an instrument taking a reading, not like waiting.' },
]

/* Multi-chart scenes — two or three Create-Widget charts interacting, monochrome slate,
   smooth motion, and tappable (a tap squashes and bounces the scene). */
const SCENES = [
  // the monochrome Chart Morph leads the section, and its continuous successor sits beside it
  { id: 'morph-mono', loader: { variant: 'morph', mono: true, smooth: true, size: 60 }, name: 'Chart Morph — Monochrome', charts: 'Column · Line · Donut · Scatter · Stacked', widget: 'Open Requests by Status',
    what: 'Five charts in turn, in slate greys, smaller, with soft easing — each chart fades out as the next arrives.' },
  { id: 'flow', loader: { variant: 'flow', mono: true, smooth: true, size: 72 }, name: 'Chart Flow — Continuous', charts: 'Column → Line → Donut → Stacked → Bar → Funnel', widget: 'Open Requests by Status',
    what: 'The same five shapes BECOME each chart: columns tip over into a line, the line curls into a donut, the slices break off and stack, the stack slides out into bars, the bars taper into a funnel, and the funnel drops back into columns — nothing ever disappears.' },
  { id: 'assemble', name: 'Dashboard Assembly', charts: 'KPI · Column · Donut · Line', widget: 'Helpdesk Overview',
    what: 'Four mini widget cards pop in one after another and fill themselves — the number counts up, columns grow, the donut closes, the line draws.' },
  { id: 'chomp', name: 'Pie Chomp', charts: 'Pie · Line · KPI', widget: 'Requests Created — Trend',
    what: 'A pie chomps its way along a line chart, eating each data point, while a little KPI keeps score.' },
  { id: 'funnel', name: 'Funnel Pour', charts: 'Funnel · Stacked', widget: 'Request Lifecycle',
    what: 'Records drip through a funnel chart and settle into the columns of a stacked chart beside it.' },
  { id: 'pulse', name: 'Pulse Monitor', charts: 'Combo · Gauge', widget: 'SLA Compliance',
    what: 'A combo chart (bars + line) scrolls like a heart-rate monitor with a live ping, and a gauge reads it as it goes.' },
  { id: 'heatdrop', name: 'Heat Drop', charts: 'Heatmap · Histogram', widget: 'Priority × Status',
    what: 'Heatmap cells ripple, then drop straight down and stack into histogram columns — and float back up.' },
  { id: 'race', name: 'Line Race', charts: 'Multi-line · KPI', widget: 'Status Trend by Team',
    what: 'Three lines race each other to a waving finish flag while a KPI counts the race to 100%.' },
]
</script>

<template>
  <div class="lg">
    <header class="lg-head">
      <div>
        <h1>Chart Loaders</h1>
        <p class="lg-sub">Widget loading states that build a small chart instead of spinning — so the wait reads as the chart being prepared, not as waiting. Colours come from the chart palette and follow the theme.</p>
      </div>
      <div class="lg-ctrls">
        <div class="lg-ctrl">
          <span class="lg-l">Speed</span>
          <div class="seg">
            <button v-for="s in SPEEDS" :key="s.v" class="seg-b" :class="{ on: speed === s.v }" @click="speed = s.v">{{ s.l }}</button>
          </div>
        </div>
        <div class="lg-ctrl">
          <span class="lg-l">Captions</span>
          <div class="seg">
            <button class="seg-b" :class="{ on: captions }" @click="captions = true">On</button>
            <button class="seg-b" :class="{ on: !captions }" @click="captions = false">Off</button>
          </div>
        </div>
      </div>
    </header>

    <div class="lg-grid">
      <article v-for="v in VARIANTS" :key="v.key || v.id" class="lg-item">
        <!-- a widget-shaped card: header band + body, as on the board -->
        <div class="lg-tile">
          <div class="lg-thead">
            <span class="lg-title">{{ v.widget }}</span>
            <span class="lg-chip">Loading</span>
          </div>
          <div class="lg-body">
            <ChartLoader :variant="v.id" :speed="speed" :caption="captions" :mono="!!v.mono" :smooth="!!v.smooth" :size="v.size || 76" />
          </div>
        </div>
        <div class="lg-meta">
          <b>{{ v.name }}</b>
          <p>{{ v.what }}</p>
          <p class="lg-why">{{ v.why }}</p>
        </div>
      </article>
    </div>

    <!-- ── Multi-chart scenes ── -->
    <header class="lg-sec">
      <h2>Multi-chart scenes <span class="lg-tag">Monochrome</span></h2>
      <p class="lg-sub">Two or three charts from the Create Widget catalogue interacting in one small scene, in the product’s slate greys, with smooth motion. <b>Tap any of them</b> — they bounce.</p>
    </header>
    <div class="lg-grid">
      <article v-for="s in SCENES" :key="s.id" class="lg-item">
        <div class="lg-tile">
          <div class="lg-thead">
            <span class="lg-title">{{ s.widget }}</span>
            <span class="lg-chip">Loading</span>
          </div>
          <div class="lg-body">
            <ChartLoader v-if="s.loader" :variant="s.loader.variant" :mono="s.loader.mono" :smooth="s.loader.smooth" :size="s.loader.size" :speed="speed" :caption="captions" />
            <ChartLoaderScene v-else :variant="s.id" :speed="speed" :caption="captions" />
          </div>
        </div>
        <div class="lg-meta">
          <b>{{ s.name }} <span class="lg-charts">{{ s.charts }}</span></b>
          <p>{{ s.what }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.lg { padding: 20px 24px 48px; background: var(--surface); min-height: 100%; }
.lg-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
.lg-head h1 { margin: 0 0 4px; font-size: 18px; font-weight: 600; color: var(--ink); }
.lg-sub { margin: 0; max-width: 640px; font-size: 13px; line-height: 1.5; color: var(--muted); }
.lg-ctrls { display: flex; gap: 20px; flex-wrap: wrap; }
.lg-ctrl { display: flex; flex-direction: column; gap: 4px; }
.lg-l { font-size: 12px; color: var(--label); }
.lg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.lg-item { display: flex; flex-direction: column; gap: 10px; }
.lg-tile { border: 1px solid var(--tile-border); border-radius: var(--r-lg); background: var(--surface); overflow: hidden; display: flex; flex-direction: column; }
.lg-thead { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 37px; padding: 0 12px; background: var(--bg); }
.lg-title { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lg-chip { flex: none; font-size: 10px; font-weight: 600; letter-spacing: .03em; color: var(--muted); background: var(--seg-track); border-radius: var(--r-sm); padding: 2px 6px; }
.lg-body { height: 210px; display: flex; }
.lg-meta b { display: block; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
.lg-meta p { margin: 0; font-size: 12px; line-height: 1.5; color: var(--ink-2); }
.lg-meta .lg-why { margin-top: 4px; color: var(--muted); }
.lg-sec { margin: 32px 0 16px; }
.lg-sec h2 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 8px; }
.lg-tag { font-size: 10px; font-weight: 600; letter-spacing: .03em; color: var(--picker-ico); background: color-mix(in srgb, var(--picker-ico) 12%, var(--surface)); border-radius: var(--r-sm); padding: 2px 6px; }
.lg-charts { font-size: 11px; font-weight: 500; color: var(--muted); margin-left: 6px; }
</style>
