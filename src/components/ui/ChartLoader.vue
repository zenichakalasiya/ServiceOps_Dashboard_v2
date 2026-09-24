<script setup>
/**
 * ChartLoader — widget loading states that are small CHARTS BUILDING THEMSELVES rather
 * than a spinner. The idea (borrowed from the better motion sites — Stripe, Linear,
 * Vercel): the wait should read as the chart being prepared for you, so there is
 * something to watch, not something to wait out.
 *
 * Every variant draws in the product's own chart palette (--chart-1..8, which already has
 * a dark-theme set), on one 160×100 artboard, so any of them drops into a widget body.
 * Durations scale with `speed`; captions rotate short, friendly lines that say what the
 * chart is "doing". prefers-reduced-motion swaps the motion for a gentle opacity breath.
 *
 * Variants
 *   morph     — one chart becoming the next: columns → dots + trend line → donut →
 *               loose dots gathering into a trend → blocks dropping into columns
 *   equalizer — colour bars dancing like an audio meter
 *   trend     — a line drawing itself, a glowing dot riding its tip, the area filling in
 *   orbit     — donut arcs growing in turn while the ring turns, a counter ticking up
 *   slices    — pie slices flying in, snapping together, breathing apart
 *   scatter   — loose dots that gather into a trend and draw their own line
 *   blocks    — stacked blocks dropping into columns with a little bounce
 *   gauge     — a gauge whose needle settles, with a live value
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'morph' },
  speed: { type: Number, default: 1 },
  caption: { type: Boolean, default: true },
})

const C = (i) => `var(--chart-${i})`
const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ── captions: what the chart is "doing", rotated ── */
const LINES = {
  morph: ['Stacking the columns…', 'Tracing the trend…', 'Slicing the donut…', 'Finding the pattern…', 'Filling the columns…'],
  equalizer: ['Tuning the numbers…', 'Balancing the bars…', 'Almost in rhythm…'],
  trend: ['Tracing the trend…', 'Connecting the dots…', 'Reading the curve…'],
  orbit: ['Counting every slice…', 'Rounding it up…', 'Closing the ring…'],
  slices: ['Slicing the pie…', 'Fitting the pieces…', 'Serving it up…'],
  scatter: ['Gathering the data points…', 'Finding the pattern…', 'Drawing the line…'],
  blocks: ['Stacking the blocks…', 'Filling the columns…', 'Levelling up…'],
  gauge: ['Taking a reading…', 'Settling the needle…', 'Checking the range…'],
}
const lineIdx = ref(0)
// morph's caption names the chart on screen; the others rotate through their three lines
const caption = computed(() => (props.variant === 'morph' ? LINES.morph[phase.value] : (LINES[props.variant] || LINES.morph)[lineIdx.value % 3]))

/* ── morph: a five-phase cycle driven from JS (CSS does the tweening) ──
   0 columns · 1 trend line · 2 donut · 3 find the pattern · 4 block drop */
const PHASES = 5
const phase = ref(0)
const BARS = [40, 62, 34, 70, 50]
const bx = (i) => 22 + i * 28
const TOPS = BARS.map((h, i) => [bx(i) + 8, 88 - h])
const TREND_D = TOPS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
const RING = 2 * Math.PI * 30
const SEGS = [0.3, 0.24, 0.2, 0.15, 0.11]
const segs = SEGS.reduce((acc, f, i) => {
  const off = acc.reduce((s, x) => s + x.len, 0)
  acc.push({ len: f * RING - 2, off, color: C(i + 1), i })
  return acc
}, [])

/* ── orbit + gauge: a live number ── */
const count = ref(0)
const needle = ref(-70)

let tick = null, raf = null, t0 = 0
function start() {
  stop()
  const period = 2000 / props.speed
  tick = setInterval(() => { phase.value = (phase.value + 1) % PHASES; lineIdx.value++ }, period)
  if (reduce) return
  t0 = performance.now()
  const loop = (now) => {
    const t = ((now - t0) / 1000) * props.speed
    // orbit: 0 → 100 over each 2.4s turn, then again
    count.value = Math.round(((t % 2.4) / 2.4) * 100)
    // gauge: a needle that hunts and settles — two sines, never a metronome
    needle.value = -10 + Math.sin(t * 1.3) * 48 + Math.sin(t * 3.1) * 12
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
}
function stop() { clearInterval(tick); cancelAnimationFrame(raf) }
onMounted(start)
onBeforeUnmount(stop)
watch(() => [props.speed, props.variant], start)

const gaugeVal = computed(() => Math.round(((needle.value + 90) / 180) * 100))

/* ── slices: wedge geometry, each flies in along its own mid-angle ── */
const PIE = [0.28, 0.22, 0.2, 0.17, 0.13]
const wedges = (() => {
  let a0 = -Math.PI / 2
  return PIE.map((f, i) => {
    const a1 = a0 + f * 2 * Math.PI
    const r = 34, cx = 80, cy = 50
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const [x0, y0] = p(a0), [x1, y1] = p(a1)
    const mid = (a0 + a1) / 2
    const w = { d: `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`,
      dx: (Math.cos(mid) * 26).toFixed(1) + 'px', dy: (Math.sin(mid) * 26).toFixed(1) + 'px',
      ex: (Math.cos(mid) * 4).toFixed(1) + 'px', ey: (Math.sin(mid) * 4).toFixed(1) + 'px', color: C(i + 1), i }
    a0 = a1
    return w
  })
})()

/* ── scatter: each dot has a loose home and a place on the trend ── */
const TREND = 'M14 70 C 34 62, 44 78, 62 58 S 92 64, 104 40 S 132 36, 146 20'
const DOTS = [
  [18, 30, 26, 78], [46, 82, 44, 70], [70, 20, 62, 61], [98, 70, 80, 52],
  [120, 26, 98, 44], [140, 76, 116, 35], [34, 56, 134, 27], [108, 88, 150, 18],
].map(([x1, y1, x2, y2], i) => ({ x1, y1, x2, y2, color: C((i % 7) + 1), i }))

/* ── blocks: 4 columns, falling in turn ── */
const COLS = [[18, 16, 12], [22, 14], [14, 20, 10], [12, 18, 16]]
const blocks = COLS.flatMap((col, ci) => {
  let y = 88
  return col.map((h, bi) => { y -= h + 2; return { x: 26 + ci * 30, y, h, color: C(bi + 1 + (ci % 2) * 3), d: ci * 0.12 + bi * 0.42, key: `${ci}-${bi}` } })
})
</script>

<template>
  <div class="cl" :class="[`cl-${variant}`, { still: reduce }]" :style="{ '--spd': speed }" role="status" aria-live="polite" :aria-label="caption">
    <svg class="cl-svg" viewBox="0 0 160 100" fill="none" aria-hidden="true">
      <!-- ── MORPH ── columns → dots + trend → donut -->
      <template v-if="variant === 'morph'">
        <path d="M14 88 H146" class="cl-base" />
        <rect v-for="(h, i) in BARS" :key="'mb' + i" class="mb" :class="{ down: phase !== 0 }"
          :x="bx(i)" :y="88 - h" width="16" :height="h" rx="3" :fill="C(i + 1)" :style="{ transitionDelay: (i * 60) + 'ms' }" />
        <path :d="TREND_D" class="mt" :class="{ on: phase === 1 }" pathLength="1" />
        <circle v-for="(p, i) in TOPS" :key="'md' + i" class="mdot" :class="{ on: phase === 1 }"
          :cx="p[0]" :cy="p[1]" r="3.6" :fill="C(i + 1)" :style="{ transitionDelay: (120 + i * 70) + 'ms' }" />
        <g class="mring" :class="{ on: phase === 2 }">
          <circle cx="80" cy="50" r="30" class="mring-track" />
          <circle v-for="s in segs" :key="'ms' + s.i" cx="80" cy="50" r="30" class="mseg" :stroke="s.color"
            :style="{ '--len': s.len, '--off': -s.off, '--circ': RING, transitionDelay: (s.i * 110) + 'ms' }" />
        </g>
        <!-- 3 · find the pattern: loose dots appear, drift into a trend, the line draws -->
        <g class="msc" :class="{ on: phase === 3 }">
          <path d="M26 78 L150 18" class="msc-line" pathLength="1" />
          <circle v-for="p in DOTS" :key="'mp' + p.i" r="4" :fill="p.color" class="msc-dot"
            :style="{ '--x1': p.x1 + 'px', '--y1': p.y1 + 'px', '--x2': p.x2 + 'px', '--y2': p.y2 + 'px', '--dl': (p.i * 0.04) + 's' }" />
        </g>
        <!-- 4 · block drop: blocks fall into their columns with a small bounce -->
        <g class="mbk" :class="{ on: phase === 4 }">
          <rect v-for="b in blocks" :key="'mk' + b.key" class="mbk-b" :x="b.x" :y="b.y" width="20" :height="b.h" rx="3"
            :fill="b.color" :style="{ '--dl': (b.d * 0.4) + 's' }" />
        </g>
      </template>

      <!-- ── EQUALIZER ── -->
      <template v-else-if="variant === 'equalizer'">
        <path d="M14 90 H146" class="cl-base" />
        <rect v-for="i in 7" :key="'eq' + i" class="eq" :x="16 + (i - 1) * 19" y="18" width="12" height="72" rx="4"
          :fill="C(i)" :style="{ '--d': (0.72 + ((i * 37) % 5) * 0.11) + 's', '--dl': (-i * 0.13) + 's' }" />
      </template>

      <!-- ── TREND ── line draws, dot rides the tip, area fills -->
      <template v-else-if="variant === 'trend'">
        <defs>
          <linearGradient id="clTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--chart-1)" stop-opacity=".32" />
            <stop offset="1" stop-color="var(--chart-1)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path v-for="y in [22, 44, 66, 88]" :key="'tg' + y" :d="`M14 ${y} H146`" class="cl-grid" />
        <path d="M14 70 C 34 62, 44 78, 62 58 S 92 64, 104 40 S 132 36, 146 20" class="tr-ghost" />
        <path d="M14 70 C 34 62, 44 78, 62 58 S 92 64, 104 40 S 132 36, 146 20 L146 88 L14 88 Z" class="tr-area" fill="url(#clTrendFill)" />
        <path d="M14 70 C 34 62, 44 78, 62 58 S 92 64, 104 40 S 132 36, 146 20" class="tr-line" pathLength="1" />
        <!-- the dot rides the curve with SVG's own path motion (sturdier than CSS
             offset-path on SVG), timed to the draw: reach the end at 65%, hold, fade -->
        <g v-if="!reduce">
          <circle class="tr-halo" r="9">
            <animateMotion :dur="(2.6 / speed) + 's'" repeatCount="indefinite" :path="TREND"
              keyPoints="0;1;1" keyTimes="0;0.65;1" calcMode="spline" keySplines=".45 0 .25 1;0 0 1 1" />
            <animate attributeName="opacity" :dur="(2.6 / speed) + 's'" repeatCount="indefinite" values=".22;.22;0" keyTimes="0;0.88;1" />
          </circle>
          <circle class="tr-dot" r="4">
            <animateMotion :dur="(2.6 / speed) + 's'" repeatCount="indefinite" :path="TREND"
              keyPoints="0;1;1" keyTimes="0;0.65;1" calcMode="spline" keySplines=".45 0 .25 1;0 0 1 1" />
            <animate attributeName="opacity" :dur="(2.6 / speed) + 's'" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.88;1" />
          </circle>
        </g>
      </template>

      <!-- ── ORBIT ── donut arcs grow in turn while the ring turns; a counter ticks -->
      <template v-else-if="variant === 'orbit'">
        <circle cx="80" cy="50" r="32" class="or-track" />
        <g class="or-spin">
          <circle v-for="s in segs" :key="'os' + s.i" cx="80" cy="50" r="32" class="or-seg" :stroke="s.color"
            :style="{ '--len': s.len * 32 / 30, '--off': -s.off * 32 / 30, '--circ': 2 * Math.PI * 32, '--dl': (s.i * 0.22) + 's' }" />
        </g>
        <text x="80" y="54" class="or-num">{{ count }}<tspan class="or-pct">%</tspan></text>
      </template>

      <!-- ── SLICES ── fly in, snap, breathe apart -->
      <template v-else-if="variant === 'slices'">
        <path v-for="w in wedges" :key="'sl' + w.i" :d="w.d" :fill="w.color" class="sl"
          :style="{ '--dx': w.dx, '--dy': w.dy, '--ex': w.ex, '--ey': w.ey, '--dl': (w.i * 0.14) + 's' }" />
        <circle cx="80" cy="50" r="13" class="sl-hole" />
      </template>

      <!-- ── SCATTER ── loose points gather into a trend -->
      <template v-else-if="variant === 'scatter'">
        <path v-for="y in [22, 44, 66, 88]" :key="'sg' + y" :d="`M14 ${y} H146`" class="cl-grid" />
        <path d="M26 78 L150 18" class="sc-line" pathLength="1" />
        <circle v-for="p in DOTS" :key="'sd' + p.i" r="4" :fill="p.color" class="sc-dot"
          :style="{ '--x1': p.x1 + 'px', '--y1': p.y1 + 'px', '--x2': p.x2 + 'px', '--y2': p.y2 + 'px', '--dl': (p.i * 0.05) + 's' }" />
      </template>

      <!-- ── BLOCKS ── stacked blocks drop in with a bounce -->
      <template v-else-if="variant === 'blocks'">
        <path d="M14 90 H146" class="cl-base" />
        <rect v-for="b in blocks" :key="'bk' + b.key" class="bk" :x="b.x" :y="b.y" width="20" :height="b.h" rx="3"
          :fill="b.color" :style="{ '--dl': b.d + 's' }" />
      </template>

      <!-- ── GAUGE ── a needle that hunts and settles -->
      <template v-else-if="variant === 'gauge'">
        <path d="M30 78 A50 50 0 0 1 63 30.5" class="ga-band" stroke="var(--chart-2)" />
        <path d="M66.5 29.3 A50 50 0 0 1 106 32.7" class="ga-band" stroke="var(--chart-3)" />
        <path d="M109 34.5 A50 50 0 0 1 130 78" class="ga-band" stroke="var(--chart-4)" />
        <g :style="{ transform: `rotate(${needle}deg)` }" class="ga-needle">
          <path d="M80 78 L80 36" />
        </g>
        <circle cx="80" cy="78" r="5" class="ga-hub" />
        <text x="80" y="96" class="ga-val">{{ gaugeVal }}</text>
      </template>
    </svg>
    <transition name="clcap" mode="out-in">
      <p v-if="caption" :key="caption" class="cl-cap">{{ caption }}</p>
    </transition>
  </div>
</template>

<style scoped>
.cl { --spd: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 100%; min-height: 0; padding: 10px; }
/* SMALL on purpose (2026-09-24): a loader sits quietly in the widget body, it does not
   fill it — 140px wide at most, with a smaller caption under it */
.cl-svg { width: 100%; max-width: 140px; height: auto; max-height: calc(100% - 24px); overflow: visible; display: block; }
.cl-cap { margin: 0; font-size: 11px; font-weight: 500; color: var(--muted); letter-spacing: .01em; }
.clcap-enter-active, .clcap-leave-active { transition: opacity .3s ease, transform .3s ease; }
.clcap-enter-from { opacity: 0; transform: translateY(4px); }
.clcap-leave-to { opacity: 0; transform: translateY(-4px); }

.cl-base { stroke: var(--border-strong); stroke-width: 1; }
.cl-grid { stroke: var(--border); stroke-width: 1; stroke-dasharray: 2 3; }

/* ── morph ── */
.mb { transform-box: fill-box; transform-origin: 50% 100%; transition: transform calc(.55s / var(--spd)) cubic-bezier(.34, 1.4, .64, 1), opacity calc(.4s / var(--spd)); }
.mb.down { transform: scaleY(0); opacity: 0; transition-timing-function: cubic-bezier(.5, 0, .75, 0); }
.mt { stroke: var(--ink-2); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset calc(.8s / var(--spd)) ease .25s, opacity .25s; }
.mt.on { stroke-dashoffset: 0; opacity: .55; }
.mdot { transform-box: fill-box; transform-origin: center; transform: scale(0); transition: transform calc(.45s / var(--spd)) cubic-bezier(.34, 1.6, .64, 1); }
.mdot.on { transform: scale(1); }
.mring { transform-origin: 80px 50px; transform: rotate(-90deg) scale(.6); opacity: 0; transition: transform calc(.7s / var(--spd)) cubic-bezier(.34, 1.3, .64, 1), opacity calc(.3s / var(--spd)); }
.mring.on { transform: rotate(-90deg) scale(1); opacity: 1; }
.mring-track { stroke: var(--border); stroke-width: 12; }
.mseg { stroke-width: 12; stroke-dasharray: 0 var(--circ); stroke-dashoffset: var(--off); transition: stroke-dasharray calc(.6s / var(--spd)) ease-out; }
.mring.on .mseg { stroke-dasharray: var(--len) var(--circ); }
/* 3 · find the pattern — the dots pop in where they lie, then gather onto the trend */
.msc-dot { opacity: 0; transform: translate(var(--x1), var(--y1)) scale(0); }
.msc.on .msc-dot { animation: mscGather calc(2s / var(--spd)) cubic-bezier(.65, 0, .35, 1) var(--dl) both; }
@keyframes mscGather {
  0% { transform: translate(var(--x1), var(--y1)) scale(0); opacity: 0; }
  16% { transform: translate(var(--x1), var(--y1)) scale(1); opacity: 1; }
  62%, 100% { transform: translate(var(--x2), var(--y2)) scale(1); opacity: 1; }
}
.msc-line { stroke: var(--ink-2); stroke-width: 1.75; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }
.msc.on .msc-line { animation: mscLine calc(2s / var(--spd)) ease both; }
@keyframes mscLine { 0%, 58% { stroke-dashoffset: 1; opacity: .5; } 88%, 100% { stroke-dashoffset: 0; opacity: .5; } }
/* 4 · block drop — each block falls in turn and settles with a bounce */
.mbk-b { transform-box: fill-box; opacity: 0; }
.mbk.on .mbk-b { animation: mbkIn calc(.7s / var(--spd)) cubic-bezier(.34, 1.5, .64, 1) calc(var(--dl) / var(--spd)) both; }
@keyframes mbkIn { 0% { transform: translateY(-46px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

/* ── equalizer ── */
.eq { transform-box: fill-box; transform-origin: 50% 100%; animation: eq calc(var(--d) / var(--spd)) ease-in-out var(--dl) infinite alternate; }
@keyframes eq { 0% { transform: scaleY(.18); } 60% { transform: scaleY(.95); } 100% { transform: scaleY(.42); } }

/* ── trend ── */
.tr-ghost { stroke: var(--border-strong); stroke-width: 1.5; stroke-dasharray: 3 4; }
.tr-line { stroke: var(--chart-1); stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: trDraw calc(2.6s / var(--spd)) cubic-bezier(.45, 0, .25, 1) infinite; }
.tr-area { opacity: 0; animation: trArea calc(2.6s / var(--spd)) ease infinite; }
.tr-dot { fill: var(--chart-1); stroke: var(--surface); stroke-width: 2; }
.tr-halo { fill: var(--chart-1); }
@keyframes trDraw { 0% { stroke-dashoffset: 1; opacity: 1; } 65% { stroke-dashoffset: 0; opacity: 1; } 88% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
@keyframes trArea { 0%, 45% { opacity: 0; } 70%, 88% { opacity: 1; } 100% { opacity: 0; } }

/* ── orbit ── */
.or-track { stroke: var(--border); stroke-width: 11; }
.or-spin { transform-origin: 80px 50px; animation: orSpin calc(6s / var(--spd)) linear infinite; }
.or-seg { stroke-width: 11; stroke-linecap: round; stroke-dasharray: 0 var(--circ); stroke-dashoffset: var(--off); animation: orGrow calc(2.4s / var(--spd)) cubic-bezier(.34, 1.2, .64, 1) var(--dl) infinite; }
@keyframes orSpin { to { transform: rotate(360deg); } }
@keyframes orGrow { 0% { stroke-dasharray: 0 var(--circ); } 45%, 80% { stroke-dasharray: var(--len) var(--circ); } 100% { stroke-dasharray: 0 var(--circ); } }
.or-num { fill: var(--ink); font-size: 17px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }
.or-pct { font-size: 10px; font-weight: 600; fill: var(--muted); }

/* ── slices ── */
.sl { transform-box: view-box; transform-origin: 80px 50px; animation: slFly calc(2.8s / var(--spd)) cubic-bezier(.34, 1.35, .64, 1) var(--dl) infinite; }
.sl-hole { fill: var(--surface); }
@keyframes slFly {
  0% { transform: translate(var(--dx), var(--dy)) scale(.6); opacity: 0; }
  30% { transform: translate(0, 0) scale(1); opacity: 1; }
  62% { transform: translate(0, 0) scale(1); opacity: 1; }
  74% { transform: translate(var(--ex), var(--ey)) scale(1); opacity: 1; }
  86% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(.6); opacity: 0; }
}

/* ── scatter ── */
.sc-dot { animation: scMove calc(3s / var(--spd)) cubic-bezier(.65, 0, .35, 1) var(--dl) infinite; }
.sc-line { stroke: var(--ink-2); stroke-width: 1.75; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: .5; animation: scLine calc(3s / var(--spd)) ease infinite; }
@keyframes scMove {
  0%, 12% { transform: translate(var(--x1), var(--y1)); }
  45%, 78% { transform: translate(var(--x2), var(--y2)); }
  100% { transform: translate(var(--x1), var(--y1)); }
}
@keyframes scLine { 0%, 45% { stroke-dashoffset: 1; opacity: .5; } 68%, 80% { stroke-dashoffset: 0; opacity: .5; } 100% { stroke-dashoffset: 0; opacity: 0; } }

/* ── blocks ── */
.bk { transform-box: fill-box; opacity: 0; animation: bkDrop calc(3.2s / var(--spd)) linear infinite; animation-delay: calc(var(--dl) / var(--spd)); }
@keyframes bkDrop {
  0% { transform: translateY(-70px); opacity: 0; animation-timing-function: cubic-bezier(.55, 0, 1, .45); }
  14% { transform: translateY(0); opacity: 1; animation-timing-function: cubic-bezier(0, .55, .45, 1); }
  18% { transform: translateY(-5px); }
  22% { transform: translateY(0); }
  70% { transform: translateY(0); opacity: 1; }
  82%, 100% { transform: translateY(0); opacity: 0; }
}

/* ── gauge ── */
.ga-band { stroke-width: 9; stroke-linecap: round; }
.ga-needle { transform-origin: 80px 78px; }
.ga-needle path { stroke: var(--ink); stroke-width: 3; stroke-linecap: round; }
.ga-hub { fill: var(--ink); }
.ga-val { fill: var(--ink); font-size: 13px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }

/* reduced motion: no travel — the finished chart breathes */
.cl.still * { animation: none !important; transition: none !important; }
.cl.still .cl-svg { animation: clBreath 2.4s ease-in-out infinite !important; }
.cl.still .mb { transform: none; opacity: 1; }
.cl.still .tr-line, .cl.still .sc-line { stroke-dashoffset: 0; }
.cl.still .tr-area, .cl.still .bk, .cl.still .sl { opacity: 1; transform: none; }
.cl.still .or-seg { stroke-dasharray: var(--len) var(--circ); }
@keyframes clBreath { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
</style>
