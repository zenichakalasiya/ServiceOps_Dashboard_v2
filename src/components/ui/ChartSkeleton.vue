<script setup>
/**
 * ChartSkeleton — wireframe charts for the layout preview.
 *
 * NOT ChartIcon. That one is a 64x64 identifying glyph on a fixed artboard, drawn to be
 * recognised in a picker. This one is a small PORTRAIT of the real chart: the same
 * anatomy ECharts renders for us — value axis, gridlines, category labels, series
 * markers, legend — drawn in grey. Bare shapes were the first attempt and they read as
 * decoration; what makes a skeleton look like a chart is the chrome around the data, not
 * the data.
 *
 * Each kind mirrors what the board actually draws:
 *   line    → gridded plot, ringed point markers, legend       (ChartTile's line)
 *   bar     → gridded plot, one series, no rounded caps        (ChartTile's column)
 *   donut   → ring with the centre total, as every pie tile on the board renders
 *   funnel  → full-width tapering bands with knocked-out labels
 * Donut and funnel carry no axes or legend, because neither of those charts has any.
 *
 * ── Two mechanics worth knowing ─────────────────────────────────────────────────
 * 1. The plot SVGs take `preserveAspectRatio="none"` so they stretch to any card shape.
 *    That would stretch the strokes with them, so every stroke sets `vector-effect:
 *    non-scaling-stroke` and stays the width written here.
 * 2. A round MARKER cannot be a <circle> for the same reason — it would render as an
 *    ellipse. Each one is a zero-length path with a round cap, which the renderer draws
 *    as a disc in screen units and the distortion cannot touch.
 *
 * The ramp is ChartIcon's idiom: steps of `currentColor`, so the call site's `color`
 * drives the whole drawing and both themes work from one declaration.
 */
defineProps({
  // line | bar | donut | funnel
  kind: { type: String, required: true },
})

/* Y-axis tick labels. The last is stubbier on purpose — it is the zero, and a real axis
   ends on a one-character label. Small truths like that are most of why a skeleton reads
   as a chart rather than as grey boxes. */
const Y_TICKS = [16, 16, 16, 16, 9]
const X_TICKS_LINE = [22, 22, 22, 22, 22, 22]
const X_TICKS_BAR = [30, 30, 30, 30]

/* One series, four categories, as the reference draws it — and all four the SAME tone.
   Inking the tallest was tried; a single-series chart colours every bar alike, and the
   odd one out read as a selection. */
/* Centred in four equal slots (12.5 / 37.5 / 62.5 / 87.5), at a bar width near a third
   of the slot — the proportion the real chart draws. Wider bars read as a stacked block
   rather than a series. */
const BARS = [
  { x: 8, y: 10, h: 50 },
  { x: 33, y: 35, h: 25 },
  { x: 58, y: 24, h: 36 },
  { x: 83, y: 47, h: 13 },
]
const LINE_PTS = [[6, 38], [23.6, 26], [41.2, 30], [58.8, 16], [76.4, 20], [94, 12]]
const LINE_D = LINE_PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
const GRID_Y = [2, 16.5, 31, 45.5, 60]
</script>

<template>
  <div class="cs" aria-hidden="true">
    <!-- ── LINE and BAR: the same gridded frame, a different series ── -->
    <template v-if="kind === 'line' || kind === 'bar'">
      <div class="cs-plot">
        <div class="cs-yax">
          <span v-for="(w, i) in Y_TICKS" :key="i" class="cs-stub" :style="{ width: w + 'px' }" />
        </div>
        <svg class="cs-canvas" viewBox="0 0 100 60" preserveAspectRatio="none">
          <!-- gridlines first, so the series sits over them -->
          <path
            v-for="(y, i) in GRID_Y" :key="'g' + i" class="cs-grid"
            :d="`M0,${y} H100`" vector-effect="non-scaling-stroke"
          />
          <template v-if="kind === 'bar'">
            <rect v-for="(b, i) in BARS" :key="'b' + i" class="cs-col" :x="b.x" :y="b.y" width="9" :height="b.h" />
          </template>
          <template v-else>
            <path class="cs-series" :d="LINE_D" vector-effect="non-scaling-stroke" />
            <!-- ringed markers: a disc in the series tone, then a smaller one in the
                 card colour punched out of it -->
            <path
              v-for="(p, i) in LINE_PTS" :key="'m' + i" class="cs-mark"
              :d="`M${p[0]},${p[1]} l0.01,0`" vector-effect="non-scaling-stroke"
            />
            <path
              v-for="(p, i) in LINE_PTS" :key="'mi' + i" class="cs-mark-in"
              :d="`M${p[0]},${p[1]} l0.01,0`" vector-effect="non-scaling-stroke"
            />
          </template>
        </svg>
      </div>
      <!-- A CATEGORY axis centres each label in its slot, under the bar it names; a value
           axis runs its first and last labels to the ends of the plot, under the first
           and last point. Same row, two different alignments, and using one for both
           puts every bar label off its bar. -->
      <div class="cs-xax" :class="kind === 'bar' ? 'cat' : 'val'">
        <span
          v-for="(w, i) in (kind === 'bar' ? X_TICKS_BAR : X_TICKS_LINE)" :key="i"
          class="cs-slot"
        ><i class="cs-stub" :style="{ width: w + 'px' }" /></span>
      </div>
      <div class="cs-leg"><span class="cs-dot" /><span class="cs-stub" style="width: 30px" /></div>
    </template>

    <!-- ── DONUT: a ring with the centre total, the way every pie tile renders ── -->
    <div v-else-if="kind === 'donut'" class="cs-donut-wrap">
      <div class="cs-donut">
        <div class="cs-hole">
          <span class="cs-stub cs-total" />
          <span class="cs-stub cs-total-lbl" />
        </div>
      </div>
    </div>

    <!-- ── FUNNEL: full-width bands, each clipped so the taper is continuous ── -->
    <div v-else-if="kind === 'funnel'" class="cs-funnel">
      <span v-for="i in 4" :key="i" class="cs-fb" :class="'b' + i"><i class="cs-fb-lbl" /></span>
    </div>
  </div>
</template>

<style scoped>
/* The CALLER gives this box its height, and every shape fills it. That is not a detail:
   an SVG with a viewBox and no definite height claims its own aspect ratio as intrinsic
   height, which once made the line tile twice the height of the bar tile beside it. */
.cs {
  --sk-1: color-mix(in srgb, currentColor 58%, transparent);
  --sk-2: color-mix(in srgb, currentColor 40%, transparent);
  --sk-3: color-mix(in srgb, currentColor 26%, transparent);
  --sk-grid: color-mix(in srgb, currentColor 16%, transparent);
  min-width: 0; display: flex; flex-direction: column; gap: 7px;
  /* An inset of the drawing's own, inside the card's padding. A chart that runs to the
     edge of its card reads as CROPPED rather than placed — the donut in particular grew
     to the full height of the body and pressed on both rules. Because box-sizing is
     border-box everywhere, this shrinks the drawing and leaves the card exactly where
     the Row-height slider put it. */
  padding: 10px 12px;
}
/* A placeholder for a label. One class, every axis and the legend. */
.cs-stub { height: 5px; border-radius: 2px; background: var(--sk-3); flex: none; }

/* ── gridded plot ── */
.cs-plot { flex: 1; min-height: 0; display: flex; gap: 6px; }
/* space-between puts a tick against each gridline, which is what ties the two together */
.cs-yax { width: 16px; flex: none; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; }
.cs-canvas { flex: 1; min-width: 0; height: 100%; display: block; overflow: visible; }
.cs-grid { stroke: var(--sk-grid); stroke-width: 1; fill: none; }
.cs-col { fill: var(--sk-2); }
.cs-series { fill: none; stroke: var(--sk-1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.cs-mark { stroke: var(--sk-1); stroke-width: 7; stroke-linecap: round; }
/* the knockout, so a marker reads as a ring — the card colour, not white, or it breaks
   the moment the theme flips */
.cs-mark-in { stroke: var(--surface); stroke-width: 3.5; stroke-linecap: round; }
/* indented by the y-axis and its gap, so the labels line up under the plot instead of
   under the axis */
.cs-xax { flex: none; display: flex; padding-left: 22px; }
.cs-xax .cs-slot { display: flex; }
/* category: one equal slot per bar, label centred in it */
.cs-xax.cat .cs-slot { flex: 1; justify-content: center; }
/* value: the ends run to the edges of the plot, as a time axis does */
.cs-xax.val { justify-content: space-between; }
.cs-leg { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
.cs-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sk-2); flex: none; }

/* ── donut ── */
.cs-donut-wrap { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
/* sized off its own height so it stays round at every row height rather than becoming
   an ellipse in a wide card */
/* 84%, not the full height. The line and bar spend part of their box on an axis and a
   legend, so their plot never touches the card; the donut and funnel have no chrome to
   share with and would grow until they pressed on both rules. Holding them back is what
   makes the four tiles read as one set. */
.cs-donut {
  height: 84%; aspect-ratio: 1; border-radius: 50%; position: relative;
  background: conic-gradient(var(--sk-1) 0 142deg, var(--sk-2) 142deg 250deg, var(--sk-3) 250deg 318deg, var(--sk-2) 318deg 360deg);
}
/* the hole takes the CARD's colour, which is what makes this a ring and not a pie */
.cs-hole {
  position: absolute; inset: 27%; border-radius: 50%; background: var(--surface);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
}
.cs-total { width: 54%; height: 8px; background: var(--sk-2); }
.cs-total-lbl { width: 34%; height: 4px; }

/* ── funnel ── */
/* Full width, as the reference draws it. Each band's top edge is the previous band's
   bottom edge, so the taper is continuous rather than four loose bars. */
/* Held back from the card's edges for the same reason as the donut — and centred, so
   the taper stays symmetrical about the middle of the tile. */
.cs-funnel {
  flex: 1; min-height: 0; width: 86%; margin: 0 auto; padding: 5px 0;
  display: flex; flex-direction: column; gap: 2px;
}
.cs-fb { flex: 1; min-height: 4px; display: grid; place-items: center; }
.cs-fb.b1 { background: var(--sk-3); clip-path: polygon(0 0, 100% 0, 93.1% 100%, 6.9% 100%); }
.cs-fb.b2 { background: var(--sk-2); clip-path: polygon(6.9% 0, 93.1% 0, 86.2% 100%, 13.8% 100%); }
.cs-fb.b3 { background: var(--sk-2); clip-path: polygon(13.8% 0, 86.2% 0, 79.4% 100%, 20.6% 100%); }
.cs-fb.b4 { background: var(--sk-1); clip-path: polygon(20.6% 0, 79.4% 0, 72.5% 100%, 27.5% 100%); }
/* the value each band would print, knocked out of it in the card colour */
.cs-fb-lbl { width: 30%; max-width: 46px; height: 5px; border-radius: 2px; background: var(--surface); opacity: .75; }
</style>
