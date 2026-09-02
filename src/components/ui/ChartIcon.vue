<script setup>
/**
 * ChartIcon — the illustrated chart-type icons for the Create Widget picker.
 *
 * Geometry is verbatim from the supplied 64×64 contact sheet: same artboard, same
 * translate/scale group per icon, same three-step opacity ramp (0.2 / 0.4 / 0.6) that
 * gives each glyph its depth.
 *
 * The one change is the colour. The sheet hard-codes #516381 for every shape; the glyphs
 * paint from --ci-1/2/3 instead, which resolve to `currentColor` at the sheet's own
 * 1 / 0.55 / 0.3 — so the call site sets the colour and both themes work from one set
 * of values.
 *
 * `multiline` and `text` were not in the sheet — they are drawn here in the same idiom
 * (same frame, same ramp, same stroke weights) rather than borrowing another icon's
 * glyph, which would have made Line and Multi-line identical.
 */
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 40 },
})

// per-icon group transform, straight from the sheet
const T = {
  pie: 'translate(-4 -4.0) scale(1.5)',
  donut: 'translate(-4 -4.0) scale(1.5)',
  bar: 'translate(8 13)',
  /* The cartesian kinds are drawn on the reference SVGs' own 48x38 artboard and simply
     centred in the 64 box — no 1.5 scale. Redrawing them at the sheet's scale would mean
     re-deriving every coordinate, and the axis weights would stop matching the files they
     came from. */
  line: 'translate(8 13)',
  multiline: 'translate(8 13)',
  column: 'translate(8 13)',
  gauge: 'translate(-4 -4.0) scale(1.5)',
  hist: 'translate(8 13)',
  heatmap: 'translate(-4 -4.0) scale(1.5)',
  stack: 'translate(8 13)',
  grouped: 'translate(8 13)',
  combo: 'translate(8 13)',
  funnel: 'translate(-4 -4.0) scale(1.5)',
  mapbubble: 'translate(-4 -4.0) scale(1.5)',
  kpi: 'translate(-4 -4.0) scale(1.5)',
  shortcut: 'translate(-4 -4.0) scale(1.5)',
  text: 'translate(-4 -4.0) scale(1.5)',
  group: 'translate(-4 -4.0) scale(1.5)',
}
</script>

<template>
  <svg class="cico" :width="size" :height="size" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
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
      <!-- Horizontal bars off a value axis. Bars alone floated; the axis is what says which
           edge they are measured from, and it is the line the reference set draws too. -->
      <!-- Horizontal bars off a value axis. NOT segmented: the reference for this slot is a
           STACKED horizontal bar, but our Bar chart plots one series, and drawing segments
           would promise a stack it never renders. Stacked below keeps the segments. -->
      <template v-else-if="name === 'bar'">
        <path d="M5 4V34" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="7" y="7" width="32" height="7" rx="1.2" fill="var(--ci-1)" />
        <rect x="7" y="17" width="22" height="7" rx="1.2" fill="var(--ci-2)" />
        <rect x="7" y="27" width="14" height="7" rx="1.2" fill="var(--ci-3)" />
      </template>

      <!-- Line -->
      <!-- A line ON ITS AXIS. The reference set draws the baseline for every cartesian kind,
           which is what stops Line, Area and Multi-line reading as loose squiggles. -->
      <!-- One series on its axis. -->
      <template v-else-if="name === 'line'">
        <path d="M5 4V33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9 27L18 18L26 22L34 11L41 16" fill="none" stroke="var(--ci-1)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Multi-line — three series, no area fill, so it never reads as Line -->
      <!-- Two series, the second dropped to --ci-3 so the pair reads as two lines rather
           than as one line crossing itself. -->
      <template v-else-if="name === 'multiline'">
        <path d="M5 4V33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9 24L17 14L25 18L33 8L41 13" fill="none" stroke="var(--ci-1)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9 30L17 25L25 28L33 21L41 25" fill="none" stroke="var(--ci-3)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </template>

      <!-- Column -->
      <!-- Vertical bars on a baseline — Bar turned ninety degrees, same three steps. -->
      <template v-else-if="name === 'column'">
        <path d="M5 33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="9" y="12" width="8" height="19" rx="1.2" fill="var(--ci-1)" />
        <rect x="20" y="19" width="8" height="12" rx="1.2" fill="var(--ci-2)" />
        <rect x="31" y="8" width="8" height="23" rx="1.2" fill="var(--ci-3)" />
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
      <!-- Five columns that TOUCH, in one colour. Both matter: a histogram is one series
           over continuous bins, so gaps would make it a Column chart and a colour ramp
           would make it look like several series. -->
      <template v-else-if="name === 'hist'">
        <path d="M5 33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="7" y="23" width="7" height="8" fill="var(--ci-1)" />
        <rect x="14.5" y="15" width="7" height="16" fill="var(--ci-1)" />
        <rect x="22" y="19" width="7" height="12" fill="var(--ci-1)" />
        <rect x="29.5" y="8" width="7" height="23" fill="var(--ci-1)" />
        <rect x="37" y="13" width="7" height="18" fill="var(--ci-1)" />
      </template>

      <!-- Heatmap -->
      <!-- A honeycomb, per the supplied reference.

           NOTE, deliberately: our Heat Map renders a rectangular MATRIX (Team x Priority,
           colour-scaled per cell), not a tilemap of hexes. This icon and that chart
           therefore disagree. It was chosen with that known and accepted; if a real tilemap
           kind ever ships, this artwork belongs to it and Heat Map should take its grid
           back. The old grid glyph is in git if it is wanted. -->
      <!-- A single hexagon holding its readings. The eight-hex honeycomb that was here
           briefly came from a Highcharts TILEMAP, which is a different chart from the one
           we draw; one hexagon reads as "a measured cell" without claiming a layout. -->
      <template v-else-if="name === 'heatmap'">
        <path d="M24 11 35 17.5 35 30.5 24 37 13 30.5 13 17.5Z" fill="var(--ci-3)" stroke="var(--ci-1)" stroke-width="2" stroke-linejoin="round" />
        <rect x="18.5" y="20.5" width="11" height="2.6" rx="1.3" fill="var(--ci-1)" />
        <rect x="18.5" y="25.5" width="11" height="2.6" rx="1.3" fill="var(--ci-1)" />
      </template>

      <!-- Stacked -->
      <!-- Vertical bars, each SEGMENTED, standing on a baseline. The segments are the whole
           point of a stack, so they keep the three-step ramp; the baseline is what separates
           it from Grouped, whose bars stand side by side rather than piled. -->
      <!-- Three columns, each SEGMENTED bottom-to-top 0.8 / 0.6 / 0.4, as the reference
           stacks them. Only the TOP segment is rounded — the joins inside a stack are
           butted, which is what makes it read as one column rather than three tiles. -->
      <template v-else-if="name === 'stack'">
        <path d="M5 33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="9" y="25" width="8" height="7" fill="var(--ci-1)" />
        <rect x="9" y="18" width="8" height="7" fill="var(--ci-2)" />
        <path d="M9 13.2A1.2 1.2 0 0 1 10.2 12H15.8A1.2 1.2 0 0 1 17 13.2V18H9Z" fill="var(--ci-3)" />
        <rect x="20" y="27" width="8" height="5" fill="var(--ci-1)" />
        <rect x="20" y="20" width="8" height="7" fill="var(--ci-2)" />
        <path d="M20 16.2A1.2 1.2 0 0 1 21.2 15H26.8A1.2 1.2 0 0 1 28 16.2V20H20Z" fill="var(--ci-3)" />
        <rect x="31" y="24" width="8" height="8" fill="var(--ci-1)" />
        <rect x="31" y="16" width="8" height="8" fill="var(--ci-2)" />
        <path d="M31 11.2A1.2 1.2 0 0 1 32.2 10H37.8A1.2 1.2 0 0 1 39 11.2V16H31Z" fill="var(--ci-3)" />
      </template>

      <!-- Combo -->
      <!-- Bars AND a line, which is the whole definition of a combo. The bars drop to
           --ci-3 so the line reads on top of them instead of fighting for the same weight. -->
      <template v-else-if="name === 'combo'">
        <path d="M5 33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="8" y="21" width="8" height="10" rx="1.2" fill="var(--ci-3)" />
        <rect x="20" y="16" width="8" height="15" rx="1.2" fill="var(--ci-3)" />
        <rect x="32" y="11" width="8" height="20" rx="1.2" fill="var(--ci-3)" />
        <path d="M8 25L18 19L28 12L42 6" fill="none" stroke="var(--ci-1)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
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
      <!-- The headline number and its label. The trend arrow that used to sit beside it is
           gone: a KPI tile renders the number ONLY — no delta, no percentage — so the arrow
           advertised a reading the tile never shows. The number also grows to fill the width
           the arrow was taking, which is what a KPI actually looks like. -->
      <!-- A NUMBER, because that is the whole tile: a KPI is a count of something. The
           abstract block that stood here said "a wide thing on a card", which is also what
           a title bar looks like. Digits cannot be read as anything else. Monospace so the
           three glyphs sit on an even rhythm at any size. -->
      <template v-else-if="name === 'kpi'">
        <rect x="7" y="12" width="34" height="24" rx="3" fill="var(--ci-3)" />
        <text
          x="24" y="29.5" text-anchor="middle" fill="var(--ci-1)"
          font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          font-size="15" font-weight="700" letter-spacing="-0.5"
        >123</text>
      </template>

      <!-- Shortcut -->
      <!-- Column heads over a RULED 3x2 grid. The old glyph was a solid header band with
           six loose blocks under it, which read as a toolbar over tiles rather than as a
           table. Ruling the cells is what makes it a table; the heads say which edge is
           the top. The rules are --surface, not #fff, so they stay the card colour when
           the card is dark. -->
      <template v-else-if="name === 'shortcut'">
        <rect x="7.5" y="12.5" width="33" height="23" rx="2.5" fill="var(--ci-3)" />
        <rect x="10" y="15" width="8" height="3" rx="1" fill="var(--ci-1)" />
        <rect x="20" y="15" width="8" height="3" rx="1" fill="var(--ci-1)" />
        <rect x="30" y="15" width="8" height="3" rx="1" fill="var(--ci-1)" />
        <path d="M7.5 20.5H40.5M7.5 28H40.5M18.7 20.5V35.5M29.3 20.5V35.5" stroke="var(--surface)" stroke-width="1.6" />
        <rect x="10" y="23" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="21.2" y="23" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="31.8" y="23" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="10" y="30.5" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="21.2" y="30.5" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="31.8" y="30.5" width="6" height="2.4" rx="1.2" fill="var(--ci-2)" />
      </template>

      <!-- Free Text — the sheet had no text glyph; same card frame as KPI/Shortcut -->
      <!-- A serif T on the note it writes. Lines-on-a-card was the old glyph and it was
           indistinguishable from Shortcut at 24px — both were a card with horizontal bars.
           A letterform cannot be confused with a table. The note stays under it because
           every other tile icon in this set sits on a ground, and the tile IS a note. -->
      <template v-else-if="name === 'text'">
        <rect x="8" y="11" width="32" height="26" rx="3" fill="var(--ci-3)" />
        <path d="M14 16H34V21.5H31.6V18.4H25.4V31.6H28.2V34H19.8V31.6H22.6V18.4H16.4V21.5H14Z" fill="var(--ci-1)" />
      </template>

      <!-- Empty group -->
      <!-- Grouped — the one type the supplied contact sheet had no artwork for, drawn
           to its rules: same 8→40 span and baseline as Stacked, same 0.4/0.6 ramp, but
           the pairs stand SIDE BY SIDE instead of piling up. That contrast is the whole
           job of the icon — next to Stacked it has to be the difference you notice. -->
      <!-- TWO PAIRS, not four evenly spaced bars. The gap between the pairs is the entire
           difference from Column, and the reference spaces them the same way. -->
      <template v-else-if="name === 'grouped'">
        <path d="M5 33H43" fill="none" stroke="var(--ci-axis)" stroke-width="1.6" stroke-linecap="round" />
        <rect x="8" y="11" width="7" height="20" rx="1.2" fill="var(--ci-1)" />
        <rect x="16" y="18" width="7" height="13" rx="1.2" fill="var(--ci-3)" />
        <rect x="27" y="7" width="7" height="24" rx="1.2" fill="var(--ci-1)" />
        <rect x="35" y="15" width="7" height="16" rx="1.2" fill="var(--ci-3)" />
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
/* --ci-1..3 are the sheet's three depth steps, strongest first, and they are MONOCHROME:
   currentColor at 1 / 0.55 / 0.3, so the caller's colour drives all three.

   The sheet's own ramp was 0.6 / 0.4 / 0.2, which was tuned for a TINTED card. Against a
   white one the whole glyph washed out — the strongest step never got past a mid grey, so
   a Column and a Histogram were hard to tell apart at a glance. Taking the top step to
   full currentColor puts the contrast back into the shape, and the two lower steps still
   carry the depth the sheet drew.

   These were briefly painted from the --chart-* stops, per-kind. The design file draws
   every glyph in one inked ramp, so that is what they are again. It reads better in the
   gallery too: seventeen tiles each carrying three hues turned a grid you scan by SHAPE
   into one you have to scan past colour to read, and the colour was not carrying any
   meaning — a pie icon is a pie whatever it is tinted.

   color-mix toward transparent rather than opacity on each path, so the ramp is one
   declaration per step instead of an attribute on all 97 shapes. */
/* The RAMP, taken from the ServiceOps chart-type icons themselves. Those SVGs carry TWO
   variables, not one: --chart-line-type-icon paints the axis at full strength, and
   --chart-type-icon paints the data at 0.8 / 0.6 / 0.4. That split is the whole reason the
   real icons read as charts — the axis is the frame and the data sits inside it — and it is
   exactly what our single 1 / 0.55 / 0.3 ramp was missing. Same four values here, all
   driven off currentColor so one token still sets the whole icon. */
.cico {
  --ci-axis: currentColor;
  --ci-1: color-mix(in srgb, currentColor 80%, transparent);
  --ci-2: color-mix(in srgb, currentColor 60%, transparent);
  --ci-3: color-mix(in srgb, currentColor 40%, transparent);
}
.cico { display: block; flex: none; }
</style>
