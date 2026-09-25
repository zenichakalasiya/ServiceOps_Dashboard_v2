<script setup>
/**
 * ChartLoaderScene — MULTI-chart loaders: little scenes where two or three charts from
 * the Create Widget catalogue interact, in the product's monochrome slate, with smooth
 * (no-overshoot) motion. The single-chart loaders live in ChartLoader.vue; these are the
 * "story" set.
 *
 *   assemble — a mini dashboard assembles: KPI counts up, columns grow, donut fills, line draws
 *   chomp    — a pie chomps along a line chart, eating the points; a KPI keeps score
 *   funnel   — dots pour through a funnel chart and stack into a stacked-column chart
 *   pulse    — a combo chart (bars + line) scrolls like a monitor; a gauge reads it live
 *   heatdrop — heatmap cells ripple, then drop into histogram columns, and float back
 *   race     — three lines of a multi-line chart race to a waving flag; a KPI runs to 100%
 *
 * PLAYABLE: a tap/click squashes and bounces the whole scene ("boop") — a small reward for
 * poking it while you wait. Shades are solid mixes of --picker-ico against the surface
 * (#7186A8 — the empty-group artwork's colour), so it follows the theme.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'assemble' },
  speed: { type: Number, default: 1 },
  caption: { type: Boolean, default: true },
  size: { type: Number, default: 110 },
})
const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const LINES = {
  assemble: ['Laying out your dashboard…', 'Placing the widgets…', 'Almost there…'],
  chomp: ['Munching through the data…', 'Chomping every point…', 'Nom nom… nearly done'],
  funnel: ['Pouring in the records…', 'Filtering through…', 'Stacking the results…'],
  pulse: ['Checking the pulse…', 'Reading the vitals…', 'Steady and healthy…'],
  heatdrop: ['Warming up the heatmap…', 'Dropping into buckets…', 'Sorting it out…'],
  race: ['The lines are racing…', 'Neck and neck…', 'Crossing the finish…'],
}
const lineIdx = ref(0)
const capText = computed(() => (LINES[props.variant] || LINES.assemble)[lineIdx.value % 3])

/* ── one clock for the JS-driven bits (KPI counters, the chomper, the gauge) ── */
const t = ref(0)
let raf = null, tick = null, t0 = 0
function start() {
  stop()
  tick = setInterval(() => { lineIdx.value++ }, 2200 / props.speed)
  if (reduce) return
  t0 = performance.now()
  const loop = (now) => { t.value = ((now - t0) / 1000) * props.speed; raf = requestAnimationFrame(loop) }
  raf = requestAnimationFrame(loop)
}
function stop() { cancelAnimationFrame(raf); clearInterval(tick) }
onMounted(start)
onBeforeUnmount(stop)
watch(() => [props.speed, props.variant], start)
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

/* ── assemble: the KPI card counts up after it pops in (cycle 4s) ── */
const kpi = computed(() => Math.round(easeOut(((t.value % 4) - 0.35) / 1.1) * 248))

/* ── chomp: a pie travelling along a line of points, eating them (cycle 3.4s) ── */
const CH_XS = [34, 52, 70, 88, 106, 124, 142]
const chY = (x) => 56 + Math.sin(((x - 34) / 18) * 0.9) * 9
const CH_PTS = CH_XS.map((x) => [x, chY(x)])
const CH_LINE = CH_PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1].toFixed(1)}`).join(' ')
const chP = computed(() => (t.value % 3.4) / 3.4)
const chX = computed(() => 16 + Math.min(1, chP.value / 0.72) * 138)
const chVisible = computed(() => chP.value < 0.8)
const eaten = computed(() => CH_XS.map((x) => chP.value < 0.9 && chX.value > x - 3))
const eatenN = computed(() => eaten.value.filter(Boolean).length)
const chMouth = computed(() => 4 + 32 * Math.abs(Math.sin(t.value * 11)))
const chPie = computed(() => {
  const x = chX.value, y = chY(x), r = 11, a = (chMouth.value * Math.PI) / 180
  return `M${x.toFixed(1)},${y.toFixed(1)} L${(x + r * Math.cos(a)).toFixed(1)},${(y - r * Math.sin(a)).toFixed(1)} A${r},${r} 0 1 0 ${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)} Z`
})
const chEye = computed(() => [chX.value + 1, chY(chX.value) - 5.5])

/* ── pulse: the combo scrolls in CSS; the gauge reads a wandering value ── */
const PU_BARS = [18, 30, 22, 40, 26, 34, 16, 28]
const puTops = [...PU_BARS, ...PU_BARS].map((h, i) => [12 + i * 12 + 4, 84 - h])
const PU_LINE = puTops.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
const gv = computed(() => Math.min(0.97, Math.max(0.08, 0.55 + 0.25 * Math.sin(t.value * 1.6) + 0.08 * Math.sin(t.value * 4.1))))
const GA_HALF = Math.PI * 20
const gAngle = computed(() => -90 + gv.value * 180)

/* ── heatdrop: which cells exist, and how far each falls to stack into its column ── */
const HD_PRESENT = [[1, 3], [0, 1, 2, 3], [0, 2, 3], [2], [0, 1, 3]]   // rows kept per column (top→bottom)
const hdCells = HD_PRESENT.flatMap((rows, c) => {
  const kept = [...rows].sort((a, b) => b - a)                        // bottom-most first
  return kept.map((r, k) => {
    const x = 39 + c * 17, y = 14 + r * 13
    const ty = 88 - 10 - k * 11
    return { key: `${c}-${r}`, x, y, dy: ty - y, shade: ((c + r) % 5) + 1, dl: (c + r) * 0.07 }
  })
})

/* ── race: three lines, three easings, one finish flag; a KPI runs to 100% ── */
const RACE = [
  { d: 'M10 78 C 40 70, 60 40, 90 46 S 124 26, 140 22', shade: 1, ease: [0.5, 0, 0.3, 1] },
  { d: 'M10 82 C 36 80, 64 60, 92 62 S 122 44, 140 40', shade: 3, ease: [0.2, 0.6, 0.4, 1] },
  { d: 'M10 86 C 44 84, 70 76, 96 74 S 124 62, 140 58', shade: 2, ease: [0.7, 0, 0.2, 1] },
]
const racePct = computed(() => Math.round(Math.min(1, ((t.value % 3.4) / 3.4) / 0.7) * 100))

/* ── playable: a tap squashes and bounces the scene ── */
const boop = ref(false)
let boopT = null
function poke() {
  boop.value = false
  requestAnimationFrame(() => { boop.value = true })
  clearTimeout(boopT); boopT = setTimeout(() => { boop.value = false }, 650)
}
</script>

<template>
  <div class="cs" :class="[`cs-${variant}`, { still: reduce }]" :style="{ '--spd': speed, '--cs-w': size + 'px' }"
    role="status" aria-live="polite" :aria-label="capText">
    <svg class="cs-svg" :class="{ boop }" viewBox="0 0 160 100" fill="none" aria-hidden="true" @click="poke">
      <!-- ── ASSEMBLE: KPI · column · donut · line, four cards filling in turn ── -->
      <template v-if="variant === 'assemble'">
        <g class="as-card" style="--dl: 0s">
          <rect x="6" y="6" width="72" height="40" rx="6" class="card" />
          <text x="42" y="31" class="as-kpi">{{ kpi }}</text>
          <rect x="30" y="35" width="24" height="3" rx="1.5" fill="var(--m4)" />
        </g>
        <g class="as-card" style="--dl: .3s">
          <rect x="82" y="6" width="72" height="40" rx="6" class="card" />
          <path d="M88 40 H148" class="axis" />
          <rect v-for="(b, i) in [[92, 14, 'var(--m2)'], [106, 22, 'var(--m1)'], [120, 10, 'var(--m3)'], [134, 26, 'var(--m2)']]" :key="'ab' + i"
            class="as-bar" :x="b[0]" :y="40 - b[1]" width="8" :height="b[1]" rx="1.5" :fill="b[2]" :style="{ '--dl2': (0.3 + 0.18 + i * 0.08) + 's' }" />
        </g>
        <g class="as-card" style="--dl: .6s">
          <rect x="6" y="54" width="72" height="40" rx="6" class="card" />
          <circle cx="42" cy="74" r="11" class="as-track" />
          <circle cx="42" cy="74" r="11" class="as-arc" stroke="var(--m1)" style="--len: 48; --off: 0" />
          <circle cx="42" cy="74" r="11" class="as-arc" stroke="var(--m3)" style="--len: 19; --off: -50" />
        </g>
        <g class="as-card" style="--dl: .9s">
          <rect x="82" y="54" width="72" height="40" rx="6" class="card" />
          <path d="M88 88 H148" class="axis" />
          <path d="M90 84 L102 76 L114 80 L126 68 L138 72 L148 62" class="as-line" pathLength="1" />
        </g>
      </template>

      <!-- ── CHOMP: a pie eats its way along a line chart ── -->
      <template v-else-if="variant === 'chomp'">
        <path d="M14 90 H150" class="axis" />
        <path :d="CH_LINE" class="ch-line" />
        <circle v-for="(p, i) in CH_PTS" :key="'cp' + i" :cx="p[0]" :cy="p[1]" r="3.2" fill="var(--m2)"
          class="ch-dot" :class="{ gone: eaten[i] }" />
        <g class="ch-pie" :class="{ hide: !chVisible }">
          <path :d="chPie" fill="var(--m1)" />
          <circle :cx="chEye[0]" :cy="chEye[1]" r="1.4" fill="var(--surface)" />
        </g>
        <!-- the score, as a tiny KPI -->
        <g class="ch-kpi">
          <rect x="112" y="8" width="40" height="18" rx="5" class="card" />
          <text x="132" y="21" class="ch-score">×{{ eatenN }}</text>
        </g>
      </template>

      <!-- ── FUNNEL: dots pour through a funnel and stack into columns ── -->
      <template v-else-if="variant === 'funnel'">
        <polygon points="18,30 78,30 70,44 26,44" fill="var(--m4)" />
        <polygon points="27,46 69,46 62,58 34,58" fill="var(--m3)" />
        <polygon points="35,60 61,60 56,70 40,70" fill="var(--m2)" />
        <circle v-for="i in 6" :key="'fd' + i" r="2.6" fill="var(--m1)" class="fu-drop"
          :style="{ '--x0': (22 + i * 8) + 'px', '--xc': (100 + ((i - 1) % 3) * 18 + 6) + 'px', '--dl': ((i - 1) * 0.5) + 's' }" />
        <path d="M94 86 H154" class="axis" />
        <template v-for="(col, ci) in [[8, 10, 7], [12, 6, 9], [6, 9, 11]]" :key="'fc' + ci">
          <rect v-for="(h, si) in col" :key="'fs' + ci + si" class="fu-seg" :x="100 + ci * 18" width="12" rx="1.5"
            :y="86 - col.slice(0, si + 1).reduce((a, b) => a + b + 1, 0)" :height="h"
            :fill="['var(--m1)', 'var(--m3)', 'var(--m2)'][si]" :style="{ '--dl': (0.5 + si * 0.9 + ci * 0.25) + 's' }" />
        </template>
      </template>

      <!-- ── PULSE: a scrolling combo chart + a live gauge ── -->
      <template v-else-if="variant === 'pulse'">
        <defs><clipPath id="csPuClip"><rect x="8" y="18" width="96" height="68" /></clipPath></defs>
        <path d="M8 84 H104" class="axis" />
        <g clip-path="url(#csPuClip)">
          <g class="pu-track">
            <rect v-for="(h, i) in [...PU_BARS, ...PU_BARS]" :key="'pb' + i" :x="12 + i * 12" :y="84 - h" width="8" :height="h" rx="1.5" fill="var(--m4)" />
            <path :d="PU_LINE" class="pu-line" />
          </g>
        </g>
        <circle cx="104" cy="44" r="2.6" fill="var(--m1)" />
        <circle cx="104" cy="44" r="2.6" class="pu-ping" />
        <!-- gauge -->
        <path d="M112 70 A20 20 0 0 1 152 70" class="ga-track" />
        <path d="M112 70 A20 20 0 0 1 152 70" class="ga-val" :style="{ strokeDasharray: `${(gv * GA_HALF).toFixed(1)} ${GA_HALF.toFixed(1)}` }" />
        <g :style="{ transform: `rotate(${gAngle}deg)`, transformOrigin: '132px 70px' }"><path d="M132 70 V54" class="ga-needle" /></g>
        <circle cx="132" cy="70" r="2.6" fill="var(--m1)" />
        <text x="132" y="86" class="ga-num">{{ Math.round(gv * 100) }}</text>
      </template>

      <!-- ── HEATDROP: heatmap ripples, then falls into a histogram ── -->
      <template v-else-if="variant === 'heatdrop'">
        <path d="M34 88 H126" class="axis hd-axis" />
        <rect v-for="c in hdCells" :key="'hc' + c.key" :x="c.x" :y="c.y" width="14" height="10" rx="2"
          :fill="`var(--m${c.shade})`" class="hd-cell" :style="{ '--dy': c.dy + 'px', '--dl': c.dl + 's' }" />
      </template>

      <!-- ── RACE: three lines race to the flag; a KPI runs to 100% ── -->
      <template v-else-if="variant === 'race'">
        <path d="M10 90 H146" class="axis" />
        <path v-for="(r, i) in RACE" :key="'rl' + i" :d="r.d" class="ra-line" pathLength="1"
          :stroke="`var(--m${r.shade})`" :style="{ animationTimingFunction: `cubic-bezier(${r.ease.join(',')})` }" />
        <g v-if="!reduce">
          <circle v-for="(r, i) in RACE" :key="'rd' + i" r="3" :fill="`var(--m${r.shade})`" stroke="var(--surface)" stroke-width="1.2">
            <animateMotion :dur="(3.4 / speed) + 's'" repeatCount="indefinite" :path="r.d"
              keyPoints="0;1;1" keyTimes="0;0.7;1" calcMode="spline" :keySplines="`${r.ease.join(' ')};0 0 1 1`" />
          </circle>
        </g>
        <!-- finish flag -->
        <path d="M148 14 V42" class="ra-pole" />
        <path d="M148 15 L160 19 L148 23 Z" fill="var(--m2)" class="ra-flag" />
        <g>
          <rect x="8" y="8" width="38" height="18" rx="5" class="card" />
          <text x="27" y="21" class="ra-kpi">{{ racePct }}%</text>
        </g>
      </template>
    </svg>
    <transition name="cscap" mode="out-in">
      <p v-if="caption" :key="capText" class="cs-cap">{{ capText }}</p>
    </transition>
  </div>
</template>

<style scoped>
.cs {
  --spd: 1;
  /* the slate ramp: solid shades of --picker-ico against the card surface */
  --m1: color-mix(in srgb, var(--picker-ico) 90%, var(--surface));
  --m2: color-mix(in srgb, var(--picker-ico) 66%, var(--surface));
  --m3: color-mix(in srgb, var(--picker-ico) 46%, var(--surface));
  --m4: color-mix(in srgb, var(--picker-ico) 30%, var(--surface));
  --m5: color-mix(in srgb, var(--picker-ico) 15%, var(--surface));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  width: 100%; height: 100%; min-height: 0; padding: 8px;
}
.cs-svg { width: 100%; max-width: var(--cs-w, 110px); height: auto; overflow: visible; display: block; cursor: pointer; }
.cs-cap { margin: 0; font-size: 11px; font-weight: 500; color: var(--muted); }
.cscap-enter-active, .cscap-leave-active { transition: opacity .16s ease, transform .16s ease; }
.cscap-enter-from { opacity: 0; transform: translateY(3px); }
.cscap-leave-to { opacity: 0; transform: translateY(-3px); }

.card { fill: var(--surface); stroke: var(--m5); stroke-width: 1; vector-effect: non-scaling-stroke; }
.axis { stroke: var(--m3); stroke-width: 1; vector-effect: non-scaling-stroke; }

/* playable: squash, stretch, settle */
.cs-svg.boop { animation: csBoop .6s cubic-bezier(.4, 0, .2, 1); transform-origin: 50% 90%; }
@keyframes csBoop { 0% { transform: scale(1); } 25% { transform: scale(1.1, .88); } 50% { transform: scale(.95, 1.07); } 75% { transform: scale(1.02, .98); } 100% { transform: scale(1); } }

/* ── assemble (cycle 4s) ── */
.as-card { transform-box: fill-box; transform-origin: center; opacity: 0; animation: asCard calc(4s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(var(--dl) / var(--spd)) infinite; }
@keyframes asCard { 0% { opacity: 0; transform: scale(.9); } 9%, 84% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(.96); } }
.as-kpi { fill: var(--m1); font-size: 15px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }
.as-bar { transform-box: fill-box; transform-origin: 50% 100%; animation: asGrow calc(4s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(var(--dl2) / var(--spd)) infinite; }
@keyframes asGrow { 0% { transform: scaleY(0); } 14%, 80% { transform: scaleY(1); } 92%, 100% { transform: scaleY(0); } }
.as-track { stroke: var(--m5); stroke-width: 6; }
.as-arc { stroke-width: 6; stroke-dashoffset: var(--off); stroke-dasharray: 0 70; transform: rotate(-90deg); transform-origin: 42px 74px;
  animation: asArc calc(4s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(.75s / var(--spd)) infinite; }
@keyframes asArc { 0% { stroke-dasharray: 0 70; } 18%, 78% { stroke-dasharray: var(--len) 70; } 90%, 100% { stroke-dasharray: 0 70; } }
.as-line { stroke: var(--m1); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1;
  animation: asLine calc(4s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(1.05s / var(--spd)) infinite; }
@keyframes asLine { 0% { stroke-dashoffset: 1; } 22%, 76% { stroke-dashoffset: 0; } 88%, 100% { stroke-dashoffset: 1; } }

/* ── chomp ── */
.ch-line { stroke: var(--m5); stroke-width: 1.5; stroke-dasharray: 2 2.5; vector-effect: non-scaling-stroke; }
.ch-dot { transform-box: fill-box; transform-origin: center; transition: transform .18s cubic-bezier(.4, 0, .2, 1), opacity .18s; }
.ch-dot.gone { transform: scale(0); opacity: 0; }
.ch-pie { transition: opacity .25s ease; }
.ch-pie.hide { opacity: 0; }
.ch-score { fill: var(--m1); font-size: 10px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }

/* ── funnel (cycle 3.2s for drops, 4.2s for the stacks) ── */
.fu-drop { opacity: 0; animation: fuDrop calc(3s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(var(--dl) / var(--spd)) infinite; }
@keyframes fuDrop {
  0% { transform: translate(var(--x0), 8px); opacity: 0; }
  10% { opacity: 1; }
  42% { transform: translate(48px, 72px); opacity: 1; }
  68% { transform: translate(var(--xc), 78px); opacity: 1; }
  78%, 100% { transform: translate(var(--xc), 80px); opacity: 0; }
}
.fu-seg { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0);
  animation: fuSeg calc(4.2s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(var(--dl) / var(--spd)) infinite; }
@keyframes fuSeg { 0% { transform: scaleY(0); opacity: 1; } 10%, 70% { transform: scaleY(1); opacity: 1; } 85%, 100% { transform: scaleY(1); opacity: 0; } }

/* ── pulse ── */
.pu-track { animation: puScroll calc(3.2s / var(--spd)) linear infinite; }
@keyframes puScroll { from { transform: translateX(0); } to { transform: translateX(-96px); } }
.pu-line { stroke: var(--m1); stroke-width: 1.6; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.pu-ping { fill: none; stroke: var(--m2); stroke-width: 1; transform-box: fill-box; transform-origin: center; animation: puPing calc(1.2s / var(--spd)) cubic-bezier(.4, 0, .2, 1) infinite; }
@keyframes puPing { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(3); opacity: 0; } }
.ga-track { stroke: var(--m5); stroke-width: 6; stroke-linecap: round; }
.ga-val { stroke: var(--m2); stroke-width: 6; stroke-linecap: round; transition: stroke-dasharray .12s linear; }
.ga-needle { stroke: var(--m1); stroke-width: 2; stroke-linecap: round; }
.ga-num { fill: var(--m1); font-size: 9px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }

/* ── heatdrop (cycle 4s) ── */
.hd-cell { animation: hdCell calc(4s / var(--spd)) cubic-bezier(.4, 0, .2, 1) calc(var(--dl) / var(--spd)) infinite; }
@keyframes hdCell {
  0% { transform: translateY(0); opacity: .35; }
  12% { opacity: 1; }
  24% { opacity: .55; }
  36% { transform: translateY(0); opacity: 1; animation-timing-function: cubic-bezier(.55, 0, .75, .25); }
  56% { transform: translateY(var(--dy)); }
  60% { transform: translateY(calc(var(--dy) - 1.5px)); }
  64%, 84% { transform: translateY(var(--dy)); opacity: 1; }
  100% { transform: translateY(0); opacity: .35; }
}
.hd-axis { opacity: 0; animation: hdAxis calc(4s / var(--spd)) ease infinite; }
@keyframes hdAxis { 0%, 42% { opacity: 0; } 56%, 84% { opacity: 1; } 96%, 100% { opacity: 0; } }

/* ── race (cycle 3.4s) ── */
.ra-line { stroke-width: 2; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: raLine calc(3.4s / var(--spd)) linear infinite; }
/* each line's easing is set inline (its own cubic-bezier), so the three race differently
   while the leading dots' SMIL keySplines use the same curves and stay on their tips */
@keyframes raLine { 0% { stroke-dashoffset: 1; opacity: 1; } 70% { stroke-dashoffset: 0; } 88% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
.ra-pole { stroke: var(--m2); stroke-width: 1.5; stroke-linecap: round; }
.ra-flag { transform-box: fill-box; transform-origin: 0% 50%; animation: raFlag calc(.9s / var(--spd)) ease-in-out infinite alternate; }
@keyframes raFlag { from { transform: skewY(-8deg) scaleX(.9); } to { transform: skewY(6deg) scaleX(1.05); } }
.ra-kpi { fill: var(--m1); font-size: 10px; font-weight: 700; text-anchor: middle; font-variant-numeric: tabular-nums; }

/* reduced motion: the finished scene, breathing */
.cs.still * { animation: none !important; transition: none !important; }
.cs.still .cs-svg { animation: csBreath 2.4s ease-in-out infinite !important; }
.cs.still .as-card, .cs.still .fu-seg { opacity: 1; transform: none; }
.cs.still .as-bar { transform: none; }
.cs.still .as-line, .cs.still .ra-line { stroke-dashoffset: 0; }
.cs.still .as-arc { stroke-dasharray: var(--len) 70; }
@keyframes csBreath { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
</style>
