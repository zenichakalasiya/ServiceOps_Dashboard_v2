<script setup>
/**
 * NoDataArt — a widget whose query ran and matched nothing: "no data found".
 *
 * A sibling of EmptyGroupArt and EmptyPreviewArt (same idiom, same family): one colour
 * (`currentColor`, set by the caller) at stepped opacities plus the card surface, so it
 * flips with the theme and carries no third-party licence.
 *
 * MINIMAL (redrawn 2026-10-09, the user's call): it has to sit cleanly beside tabular
 * information — a list's headers, a table's toolbar — without competing with it. So it is
 * three things only: a dashed frame with a header stub and three faint, empty rows (it reads
 * as a chart, a list or a table alike), and a magnifier whose lens holds a single short dash —
 * "we looked, nothing matched". No gridlines, no axis, no bars. The earlier version (empty
 * chart frame, gridlines, four flat bars, a lens repeating the baseline) was busier.
 *
 * STATIC — no motion (the user's call, 2026-09-29).
 */
defineProps({ width: { type: Number, default: 88 } })
</script>

<template>
  <svg class="nda" :width="width" :height="width * 0.64" viewBox="0 0 132 84" fill="none" aria-hidden="true" focusable="false">
    <!-- the frame: a header stub and three empty rows -->
    <rect x="22" y="12" width="72" height="58" rx="7" fill="currentColor" fill-opacity=".04"
      stroke="currentColor" stroke-opacity=".32" stroke-width="1.25" stroke-dasharray="4 3" />
    <rect x="31" y="21" width="24" height="2.8" rx="1.4" fill="currentColor" fill-opacity=".3" />
    <g stroke="currentColor" stroke-opacity=".14" stroke-width="2.4" stroke-linecap="round">
      <path d="M32 34 H76" />
      <path d="M32 44 H68" />
      <path d="M32 54 H72" />
    </g>

    <!-- the magnifier: an empty lens with one short dash -->
    <path d="M98 59 L 107 68" stroke="currentColor" stroke-opacity=".5" stroke-width="4" stroke-linecap="round" />
    <circle cx="89" cy="50" r="12.5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".62" stroke-width="1.6" />
    <path d="M84 50 H94" stroke="currentColor" stroke-opacity=".38" stroke-width="1.6" stroke-linecap="round" />
    <path d="M81.6 45.2 A 8.5 8.5 0 0 1 85.4 41.5" stroke="currentColor" stroke-opacity=".22" stroke-width="1.3" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.nda { display: block; flex: none; overflow: visible; }
</style>
