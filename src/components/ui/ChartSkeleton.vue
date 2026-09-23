<script setup>
/**
 * ChartSkeleton — wireframe chart shapes for the layout preview.
 *
 * NOT ChartIcon. That one is a 64x64 identifying glyph on a fixed artboard, drawn to be
 * recognised in a picker; this one is a shape that has to FILL a preview card and keep
 * filling it as the Row-height slider moves. A square icon centred in a wide, short card
 * would sit as a small island in the middle and show nothing about the layout.
 *
 * So these are built from CSS box/gradient/clip-path rather than a fixed viewBox — each
 * one stretches on both axes on its own terms (the pie stays circular off its height, the
 * bars and funnel divide the width, the line stretches and keeps its stroke weight). Only
 * the line needs SVG, and it takes `preserveAspectRatio="none"` plus a non-scaling stroke
 * so the distortion lands on the path and not on its thickness.
 *
 * The ramp is ChartIcon's idiom: steps of `currentColor`, so the call site's `color` sets
 * the whole drawing and both themes work from one declaration.
 */
defineProps({
  // pie | bar | line | funnel
  kind: { type: String, required: true },
})

/* Percentages of the plot height, not values — a skeleton has no data. The tallest is
   inked a step darker, the way ChartIcon's histogram inks its modal bin: it gives the
   row a focal point so six identical grey stubs read as a chart. */
const BARS = [46, 72, 34, 88, 58, 76]
const TALLEST = BARS.indexOf(Math.max(...BARS))
</script>

<template>
  <div class="cs" aria-hidden="true">
    <!-- PIE — a conic gradient on a circle sized off its own height, so it stays round
         at every row height instead of squashing into an ellipse. -->
    <div v-if="kind === 'pie'" class="cs-pie" />

    <!-- BAR — the columns divide the width, so they widen with the card rather than
         leaving it half empty. -->
    <div v-else-if="kind === 'bar'" class="cs-bars">
      <span
        v-for="(h, i) in BARS" :key="i"
        class="cs-bar" :class="{ ink: i === TALLEST }" :style="{ height: h + '%' }"
      />
    </div>

    <!-- LINE — stretched on both axes (`preserveAspectRatio="none"`). The stroke would
         stretch with it, so it is pinned with `vector-effect` and stays 2px however
         short the card gets. -->
    <svg v-else-if="kind === 'line'" class="cs-line" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path class="cs-area" d="M2,29 L21,18 L40,24 L59,9 L78,15 L98,5 L98,40 L2,40 Z" />
      <path
        class="cs-stroke" d="M2,29 L21,18 L40,24 L59,9 L78,15 L98,5"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!-- FUNNEL — three bands, each clipped to a trapezoid whose top edge is the band
         above's bottom edge, so the taper is continuous rather than three loose bars. -->
    <div v-else-if="kind === 'funnel'" class="cs-funnel">
      <span class="cs-fb b1" />
      <span class="cs-fb b2" />
      <span class="cs-fb b3" />
    </div>
  </div>
</template>

<style scoped>
/* One ramp, all four shapes, driven by the caller's `color` — see the header note. */
/* The CALLER gives this box its height, and every shape fills it. That is not a detail:
   an SVG with a viewBox and no definite height claims its own aspect ratio as intrinsic
   height (a 100x40 viewBox at 238px wide asked for 95px), so the line tile grew to 146px
   while the bar and funnel tiles sat at 75px — one row of the preview twice the other.
   Sizing from outside is what keeps the four tiles identical. */
.cs {
  --sk-1: color-mix(in srgb, currentColor 62%, transparent);
  --sk-2: color-mix(in srgb, currentColor 42%, transparent);
  --sk-3: color-mix(in srgb, currentColor 24%, transparent);
  --sk-rule: color-mix(in srgb, currentColor 28%, transparent);
  min-width: 0;
  display: flex;
}
.cs-pie {
  height: 100%; aspect-ratio: 1; margin: 0 auto; border-radius: 50%;
  background: conic-gradient(var(--sk-1) 0 150deg, var(--sk-2) 150deg 270deg, var(--sk-3) 270deg 360deg);
}
/* The baseline is what stops the columns reading as loose blocks — the same reason
   ChartIcon draws an axis under every cartesian kind. */
.cs-bars { flex: 1; display: flex; align-items: flex-end; gap: 7%; border-bottom: 1px solid var(--sk-rule); }
.cs-bar { flex: 1; min-height: 2px; border-radius: 2px 2px 0 0; background: var(--sk-2); }
.cs-bar.ink { background: var(--sk-1); }
.cs-line { flex: 1; width: 100%; height: 100%; display: block; }
.cs-area { fill: var(--sk-3); }
.cs-stroke { fill: none; stroke: var(--sk-1); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
/* Light at the mouth, dark at the spout — the ramp ChartIcon's funnel runs.
   It is CENTRED and capped, not stretched across the card like the bars and the line: a
   full-width taper over a short card flattens into a chevron, and the thing that makes a
   funnel legible is the angle of its sides. */
.cs-funnel { flex: 1; max-width: 58%; margin: 0 auto; display: flex; flex-direction: column; gap: 3px; }
.cs-fb { flex: 1; min-height: 3px; }
.cs-fb.b1 { background: var(--sk-3); clip-path: polygon(0 0, 100% 0, 86% 100%, 14% 100%); }
.cs-fb.b2 { background: var(--sk-2); clip-path: polygon(14% 0, 86% 0, 72% 100%, 28% 100%); }
.cs-fb.b3 { background: var(--sk-1); clip-path: polygon(28% 0, 72% 0, 58% 100%, 42% 100%); }
</style>
