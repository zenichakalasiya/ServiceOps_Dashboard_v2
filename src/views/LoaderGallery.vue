<script setup>
/**
 * LoaderGallery — the widget-loader candidates, side by side, each running inside a
 * widget-shaped card so it is judged where it would live. Speed and captions are
 * adjustable, so a pick is made on the real feel rather than on one frame.
 */
import { ref } from 'vue'
import ChartLoader from '../components/ui/ChartLoader.vue'

const speed = ref(1)
const captions = ref(true)
const SPEEDS = [{ v: 0.75, l: 'Calm' }, { v: 1, l: 'Normal' }, { v: 1.5, l: 'Lively' }]

const VARIANTS = [
  { id: 'morph', name: 'Chart Morph', widget: 'Open Requests by Status',
    what: 'One chart turns into the next — columns drop, their tops become a trend line, it curls into a donut, loose dots gather into a pattern, and blocks drop into columns.',
    why: 'A little story in five beats; people watch to see what it becomes next.' },
  { id: 'morph', key: 'morph-mono', mono: true, smooth: true, size: 60, name: 'Chart Morph — Monochrome', widget: 'Open Requests by Status',
    what: 'The same five-chart story in the product’s slate greys (the empty-group artwork’s colours), smaller, with softer easing — no bounce, and each chart fades out as the next arrives.',
    why: 'Calm and on-brand: it sits quietly in a busy board and never competes with the real charts around it.' },
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
</style>
