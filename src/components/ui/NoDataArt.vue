<script setup>
/**
 * NoDataArt — a widget whose query ran and matched nothing: "no data found".
 *
 * A sibling of EmptyGroupArt and EmptyPreviewArt (same idiom, same family): one colour
 * (`currentColor`, set by the caller) at stepped opacities plus the card surface, so it
 * flips with the theme and carries no third-party licence.
 *
 * The story: an empty chart frame — its gridlines and axis are there, but every column
 * is a flat stub sitting on the axis, because each one counted zero — and a magnifier
 * held over it, finding the same flat baseline inside its lens. It says "we looked,
 * and nothing matched", which is different from a fault (a red disc) or a widget that was
 * never set up.
 *
 * STATIC — no motion (the user's call, 2026-09-29; the magnifier used to sweep).
 */
defineProps({ width: { type: Number, default: 112 } })
</script>

<template>
  <svg class="nda" :width="width" :height="width * 0.64" viewBox="0 0 132 84" fill="none" aria-hidden="true" focusable="false">
    <!-- the chart frame: the axis and gridlines are ready -->
    <rect x="14" y="10" width="84" height="66" rx="7" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".38" stroke-width="1.25" stroke-dasharray="4 3" />
    <rect x="21" y="17" width="24" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22" />
    <g stroke="currentColor" stroke-opacity=".14" stroke-width="1" stroke-dasharray="2 2.5">
      <path d="M22 33 H90" /><path d="M22 45 H90" /><path d="M22 57 H90" />
    </g>
    <path d="M22 67 H90" stroke="currentColor" stroke-opacity=".32" stroke-width="1" />
    <!-- every column counted zero: flat stubs on the axis -->
    <g fill="currentColor" fill-opacity=".3">
      <rect x="27" y="64.6" width="9" height="2.4" rx="1" />
      <rect x="41" y="64.6" width="9" height="2.4" rx="1" />
      <rect x="55" y="64.6" width="9" height="2.4" rx="1" />
      <rect x="69" y="64.6" width="9" height="2.4" rx="1" />
    </g>

    <!-- the magnifier: inside the lens, the same flat baseline -->
    <g>
      <path d="M100.5 50.5 L 112 62" stroke="currentColor" stroke-opacity=".55" stroke-width="4.5" stroke-linecap="round" />
      <circle cx="90" cy="40" r="15" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.75" />
      <path d="M80 45 H100" stroke="currentColor" stroke-opacity=".3" stroke-width="1" />
      <rect x="82" y="42.6" width="6" height="2.4" rx="1" fill="currentColor" fill-opacity=".4" />
      <rect x="92" y="42.6" width="6" height="2.4" rx="1" fill="currentColor" fill-opacity=".4" />
      <!-- the lens glint -->
      <path d="M81.5 34 A 10 10 0 0 1 86 29" stroke="currentColor" stroke-opacity=".25" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </svg>
</template>

<style scoped>
.nda { display: block; flex: none; overflow: visible; }
</style>
