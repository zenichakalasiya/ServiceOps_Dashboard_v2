<script setup>
/**
 * ChartIcon — the illustrated chart-type icons for the Create Widget picker.
 *
 * Geometry is verbatim from the supplied 64×64 contact sheet: same artboard, same
 * translate/scale group per icon, same three-step opacity ramp (0.2 / 0.4 / 0.6) that
 * gives each glyph its depth.
 *
 * The one change is the colour. The sheet hard-codes #516381 for every shape; the glyphs
 * now paint from --ci-1/2/3, which each TONE (below) points at real --chart-* stops — so
 * a chart icon previews the chart it builds, and both themes resolve from one set of
 * tokens. Non-chart glyphs keep the original inked ramp.
 *
 * `multiline` and `text` were not in the sheet — they are drawn here in the same idiom
 * (same frame, same ramp, same stroke weights) rather than borrowing another icon's
 * glyph, which would have made Line and Multi-line identical.
 */
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 40 },
})

/* WHICH colours a glyph paints with. Not one answer for all of them — the depth ramp
 * was doing two different jobs in the sheet, and colour has to keep them apart:
 *
 *   series  the three steps are three SERIES, so they take the three real chart stops.
 *           A pie icon then previews the pie it builds.
 *   mono    one series drawn with depth (a bar chart is not three colours). One hue at
 *           three strengths, mixed toward the surface so it works on either theme.
 *   bands   a gauge reads good → warn → bad; those are the meanings its arcs already
 *           carry, so the stops follow the meaning rather than the series order.
 *   neutral not a chart. Colouring a Free Text or a Shortcut glyph would assert a data
 *           meaning it does not have, so these keep the original inked ramp.
 *
 * Heatmap is deliberately mono: three hues would destroy the one thing a heatmap says,
 * which is that the same measure is more intense in some cells than in others. */
const TONE = {
  pie: 'series', donut: 'series', funnel: 'series', stack: 'series', grouped: 'series',
  combo: 'series', multiline: 'series', mapbubble: 'series',
  bar: 'mono', column: 'mono', line: 'mono', hist: 'mono', heatmap: 'mono',
  gauge: 'bands',
  kpi: 'neutral', shortcut: 'neutral', text: 'neutral', group: 'neutral',
}

// per-icon group transform, straight from the sheet
const T = {
  pie: 'translate(-4 -4.0) scale(1.5)',
  donut: 'translate(-4 -4.0) scale(1.5)',
  bar: 'translate(-4 -5.5) scale(1.5)',
  line: 'translate(-4 -8.5) scale(1.5)',
  multiline: 'translate(-4 -8.5) scale(1.5)',
  column: 'translate(-4 -7.0) scale(1.5)',
  gauge: 'translate(-4 -4.0) scale(1.5)',
  hist: 'translate(-4 -7.0) scale(1.5)',
  heatmap: 'translate(-4 -5.5) scale(1.5)',
  stack: 'translate(-4 -5.5) scale(1.5)',
  grouped: 'translate(-4 -5.5) scale(1.5)',
  combo: 'translate(-4 -7.0) scale(1.5)',
  funnel: 'translate(-4 -4.0) scale(1.5)',
  mapbubble: 'translate(-4 -4.0) scale(1.5)',
  kpi: 'translate(-4 -4.0) scale(1.5)',
  shortcut: 'translate(-4 -4.0) scale(1.5)',
  text: 'translate(-4 -4.0) scale(1.5)',
  group: 'translate(-4 -4.0) scale(1.5)',
}
</script>

<template>
  <svg class="cico" :class="TONE[name] || 'series'" :width="size" :height="size" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <g :transform="T[name] || T.pie">
      <!-- Pie -->
      <template v-if="name === 'pie'">
        <path d="M24 24L19.983 36.365A13 13 0 0 1 24 11Z" fill="var(--ci-3)" />
        <path d="M24 24L36.365 28.017A13 13 0 0 1 19.983 36.365Z" fill="var(--ci-2)" />
        <path d="M24 24L24 11A13 13 0 0 1 36.365 28.017Z" transform="translate(1.3 -0.95)" fill="var(--ci-1)" />
      </template>

      <!-- Donut -->
      <template v-else-if="name === 'donut'">
        <path d="M24.563 13.265A10.75 10.75 0 0 1 30.765 32.354" fill="none" stroke="var(--ci-1)" stroke-width="6.5" />
        <path d="M29.854 33.016A10.75 10.75 0 0 1 13.265 24.563" fill="none" stroke="var(--ci-2)" stroke-width="6.5" />
        <path d="M13.265 23.437A10.75 10.75 0 0 1 23.437 13.265" fill="none" stroke="var(--ci-3)" stroke-width="6.5" />
      </template>

      <!-- Bar -->
      <template v-else-if="name === 'bar'">
        <rect x="8" y="12" width="30" height="6" rx="1.5" fill="var(--ci-1)" />
        <rect x="8" y="22" width="21" height="6" rx="1.5" fill="var(--ci-2)" />
        <rect x="8" y="32" width="13" height="6" rx="1.5" fill="var(--ci-3)" />
      </template>

      <!-- Line -->
      <template v-else-if="name === 'line'">
        <path d="M8 33L15 26L22 29L29 18L36 22L40 14V40H8Z" fill="var(--ci-3)" />
        <path d="M8 37L15 34L22 35.5L29 31L36 32L40 28" fill="none" stroke="var(--ci-2)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8 33L15 26L22 29L29 18L36 22L40 14" fill="none" stroke="var(--ci-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Multi-line — three series, no area fill, so it never reads as Line -->
      <template v-else-if="name === 'multiline'">
        <path d="M8 38L15 35L22 37L29 32L36 34L40 30" fill="none" stroke="var(--ci-3)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8 32L15 27L22 30L29 23L36 26L40 21" fill="none" stroke="var(--ci-2)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8 26L15 19L22 23L29 14L36 18L40 12" fill="none" stroke="var(--ci-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Column -->
      <template v-else-if="name === 'column'">
        <rect x="9" y="28" width="6" height="12" rx="1" fill="var(--ci-3)" />
        <rect x="17" y="18" width="6" height="22" rx="1" fill="var(--ci-2)" />
        <rect x="25" y="24" width="6" height="16" rx="1" fill="var(--ci-2)" />
        <rect x="33" y="12" width="6" height="28" rx="1" fill="var(--ci-1)" />
      </template>

      <!-- Gauge -->
      <template v-else-if="name === 'gauge'">
        <path d="M10 31A14 14 0 0 1 17 18.876" fill="none" stroke="var(--ci-3)" stroke-width="5.5" />
        <path d="M17 18.876A14 14 0 0 1 31 18.876" fill="none" stroke="var(--ci-2)" stroke-width="5.5" />
        <path d="M31 18.876A14 14 0 0 1 38 31" fill="none" stroke="var(--ci-1)" stroke-width="5.5" />
        <path d="M24 31L18.836 21.29" fill="none" stroke="var(--ci-1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="24" cy="31" r="2.5" fill="var(--ci-1)" />
      </template>

      <!-- Histogram -->
      <template v-else-if="name === 'hist'">
        <rect x="8" y="35" width="3.4" height="5" rx="0.75" fill="var(--ci-3)" />
        <rect x="12" y="30" width="3.4" height="10" rx="0.75" fill="var(--ci-3)" />
        <rect x="16" y="23" width="3.4" height="17" rx="0.75" fill="var(--ci-2)" />
        <rect x="20" y="15" width="3.4" height="25" rx="0.75" fill="var(--ci-1)" />
        <rect x="24" y="12" width="3.4" height="28" rx="0.75" fill="var(--ci-1)" />
        <rect x="28" y="19" width="3.4" height="21" rx="0.75" fill="var(--ci-2)" />
        <rect x="32" y="27" width="3.4" height="13" rx="0.75" fill="var(--ci-2)" />
        <rect x="36" y="33" width="3.4" height="7" rx="0.75" fill="var(--ci-3)" />
      </template>

      <!-- Heatmap -->
      <template v-else-if="name === 'heatmap'">
        <rect x="8.75" y="9.75" width="6.5" height="6.5" rx="1" fill="var(--ci-3)" />
        <rect x="16.75" y="9.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="24.75" y="9.75" width="6.5" height="6.5" rx="1" fill="var(--ci-1)" />
        <rect x="32.75" y="9.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="8.75" y="17.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="16.75" y="17.75" width="6.5" height="6.5" rx="1" fill="var(--ci-1)" />
        <rect x="24.75" y="17.75" width="6.5" height="6.5" rx="1" fill="var(--ci-1)" />
        <rect x="32.75" y="17.75" width="6.5" height="6.5" rx="1" fill="var(--ci-3)" />
        <rect x="8.75" y="25.75" width="6.5" height="6.5" rx="1" fill="var(--ci-1)" />
        <rect x="16.75" y="25.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="24.75" y="25.75" width="6.5" height="6.5" rx="1" fill="var(--ci-3)" />
        <rect x="32.75" y="25.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="8.75" y="33.75" width="6.5" height="6.5" rx="1" fill="var(--ci-3)" />
        <rect x="16.75" y="33.75" width="6.5" height="6.5" rx="1" fill="var(--ci-3)" />
        <rect x="24.75" y="33.75" width="6.5" height="6.5" rx="1" fill="var(--ci-2)" />
        <rect x="32.75" y="33.75" width="6.5" height="6.5" rx="1" fill="var(--ci-1)" />
      </template>

      <!-- Stacked -->
      <template v-else-if="name === 'stack'">
        <rect x="8" y="30" width="8" height="10" fill="var(--ci-1)" />
        <rect x="8" y="22" width="8" height="8" fill="var(--ci-2)" />
        <path d="M8 17.5A1.5 1.5 0 0 1 9.5 16H14.5A1.5 1.5 0 0 1 16 17.5V22H8Z" fill="var(--ci-3)" />
        <rect x="20" y="27" width="8" height="13" fill="var(--ci-1)" />
        <rect x="20" y="17" width="8" height="10" fill="var(--ci-2)" />
        <path d="M20 11.5A1.5 1.5 0 0 1 21.5 10H26.5A1.5 1.5 0 0 1 28 11.5V17H20Z" fill="var(--ci-3)" />
        <rect x="32" y="32" width="8" height="8" fill="var(--ci-1)" />
        <rect x="32" y="25" width="8" height="7" fill="var(--ci-2)" />
        <path d="M32 21.5A1.5 1.5 0 0 1 33.5 20H38.5A1.5 1.5 0 0 1 40 21.5V25H32Z" fill="var(--ci-3)" />
      </template>

      <!-- Combo -->
      <template v-else-if="name === 'combo'">
        <rect x="9" y="26" width="6" height="14" rx="1" fill="var(--ci-3)" />
        <rect x="17" y="20" width="6" height="20" rx="1" fill="var(--ci-2)" />
        <rect x="25" y="25" width="6" height="15" rx="1" fill="var(--ci-3)" />
        <rect x="33" y="17" width="6" height="23" rx="1" fill="var(--ci-2)" />
        <path d="M12 23L20 16L28 20L36 12" fill="none" stroke="var(--ci-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Funnel -->
      <template v-else-if="name === 'funnel'">
        <path d="M8 10H40L36.143 19H11.857Z" fill="var(--ci-3)" />
        <path d="M12.5 20.5H35.5L32.286 28H15.714Z" fill="var(--ci-2)" />
        <path d="M16.357 29.5H31.643L28 38H20Z" fill="var(--ci-1)" />
      </template>

      <!-- Map Bubble -->
      <template v-else-if="name === 'mapbubble'">
        <path d="M8 15L18.5 11.5V32.5L8 36Z" fill="var(--ci-3)" />
        <path d="M18.5 11.5L29.5 15V36L18.5 32.5Z" fill="var(--ci-2)" />
        <path d="M29.5 15L40 11.5V32.5L29.5 36Z" fill="var(--ci-3)" />
        <circle cx="27" cy="21" r="4.5" fill="var(--ci-1)" />
        <circle cx="14.5" cy="24" r="3.2" fill="var(--ci-2)" />
        <circle cx="35" cy="27" r="2.2" fill="var(--ci-2)" />
      </template>

      <!-- KPI -->
      <template v-else-if="name === 'kpi'">
        <rect x="7" y="12" width="34" height="24" rx="3" fill="var(--ci-3)" />
        <rect x="12" y="18" width="15" height="8" rx="1.5" fill="var(--ci-1)" />
        <rect x="12" y="29" width="10" height="2.5" rx="1.25" fill="var(--ci-2)" />
        <path d="M30 26L34 20.5L38 26" fill="none" stroke="var(--ci-1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Shortcut -->
      <template v-else-if="name === 'shortcut'">
        <rect x="7" y="12" width="34" height="24" rx="3" fill="var(--ci-3)" />
        <path d="M7 15A3 3 0 0 1 10 12H38A3 3 0 0 1 41 15V19H7Z" fill="var(--ci-1)" />
        <rect x="10" y="22" width="8" height="5" rx="1" fill="var(--ci-1)" />
        <rect x="20" y="22" width="8" height="5" rx="1" fill="var(--ci-2)" />
        <rect x="30" y="22" width="8" height="5" rx="1" fill="var(--ci-2)" />
        <rect x="10" y="29.5" width="8" height="5" rx="1" fill="var(--ci-2)" />
        <rect x="20" y="29.5" width="8" height="5" rx="1" fill="var(--ci-2)" />
        <rect x="30" y="29.5" width="8" height="5" rx="1" fill="var(--ci-2)" />
      </template>

      <!-- Free Text — the sheet had no text glyph; same card frame as KPI/Shortcut -->
      <template v-else-if="name === 'text'">
        <rect x="7" y="12" width="34" height="24" rx="3" fill="var(--ci-3)" />
        <rect x="12" y="18" width="24" height="3" rx="1.5" fill="var(--ci-1)" />
        <rect x="12" y="24" width="20" height="2.5" rx="1.25" fill="var(--ci-2)" />
        <rect x="12" y="29" width="14" height="2.5" rx="1.25" fill="var(--ci-2)" />
      </template>

      <!-- Empty group -->
      <!-- Grouped — the one type the supplied contact sheet had no artwork for, drawn
           to its rules: same 8→40 span and baseline as Stacked, same 0.4/0.6 ramp, but
           the pairs stand SIDE BY SIDE instead of piling up. That contrast is the whole
           job of the icon — next to Stacked it has to be the difference you notice. -->
      <template v-else-if="name === 'grouped'">
        <rect x="8" y="22" width="4.5" height="18" fill="var(--ci-2)" />
        <rect x="13.5" y="16" width="4.5" height="24" fill="var(--ci-1)" />
        <rect x="19" y="14" width="4.5" height="26" fill="var(--ci-2)" />
        <rect x="24.5" y="20" width="4.5" height="20" fill="var(--ci-1)" />
        <rect x="30" y="26" width="4.5" height="14" fill="var(--ci-2)" />
        <rect x="35.5" y="29" width="4.5" height="11" fill="var(--ci-1)" />
      </template>

      <template v-else-if="name === 'group'">
        <path d="M10 13H20.5L24 17H38A2 2 0 0 1 40 19V34A2 2 0 0 1 38 36H10A2 2 0 0 1 8 34V15A2 2 0 0 1 10 13Z" fill="var(--ci-3)" />
        <path d="M8 21H40V34A2 2 0 0 1 38 36H10A2 2 0 0 1 8 34Z" fill="var(--ci-2)" />
        <rect x="22.75" y="24" width="2.5" height="9" rx="1.25" fill="var(--ci-1)" />
        <rect x="19.5" y="27.25" width="9" height="2.5" rx="1.25" fill="var(--ci-1)" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
/* --ci-1..3 are the three depth steps, strongest first. Every stop is a --chart-* token,
   so the icons inherit the lifted dark palette for free instead of needing a second
   hard-coded set. color-mix toward --surface (not toward transparent) keeps the tints
   opaque, which matters on the picker card where a translucent glyph would pick up the
   hover fill behind it. */
.cico.series { --ci-1: var(--chart-1); --ci-2: var(--chart-2); --ci-3: var(--chart-3); }
.cico.mono {
  --ci-1: var(--chart-1);
  --ci-2: color-mix(in srgb, var(--chart-1) 58%, var(--surface));
  --ci-3: color-mix(in srgb, var(--chart-1) 30%, var(--surface));
}
.cico.bands { --ci-1: var(--chart-2); --ci-2: var(--chart-3); --ci-3: var(--chart-4); }
/* unchanged from the sheet: the inked ramp at the original 0.6 / 0.4 / 0.2 */
.cico.neutral {
  --ci-1: color-mix(in srgb, currentColor 60%, transparent);
  --ci-2: color-mix(in srgb, currentColor 40%, transparent);
  --ci-3: color-mix(in srgb, currentColor 20%, transparent);
}
.cico { display: block; flex: none; }
</style>
