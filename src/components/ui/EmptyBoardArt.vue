<script setup>
/**
 * EmptyBoardArt — a new dashboard with nothing on it: "add widgets to fill me".
 *
 * The same idiom as EmptyGroupArt and ChartIcon — ONE colour (`currentColor`, set by the
 * caller) at stepped opacities, plus the card surface for the widgets' faces — so it sits in
 * the family of the empty-group art and flips with the theme. Drawn here rather than taken
 * from a stock library: a third-party vector would be redistributed with the on-prem product,
 * and its own colours break in dark mode.
 *
 * The story (third pass, 2026-10-09 — the user's call: widgets with CURVED ARROWS that go
 * INTO the empty dashboard, the way the empty-group art carries its card in):
 *   · an empty dashboard window — title bar and toolbar — with a 2×2 grid of dashed slots;
 *   · a bar-chart widget outside, top-left, and a pie-chart widget outside, top-right, each
 *     tilted as if picked up;
 *   · from each widget a dashed CURVED arrow sweeps down into its own highlighted slot;
 *   · the other two slots stay empty, one marked "+".
 * (v1 floated widgets around the board with no arrow into it; v2 set them down inside it —
 * neither read as "these go in there".)
 *
 * STATIC — no motion (the user's call, 2026-10-08). Downloadable from /preview-states.
 */
defineProps({ width: { type: Number, default: 220 } })
</script>

<template>
  <svg class="eba" :width="width" :height="width * 0.66" viewBox="0 0 220 146" fill="none" aria-hidden="true" focusable="false">
    <!-- the empty dashboard window -->
    <rect x="40" y="46" width="150" height="96" rx="9" fill="currentColor" fill-opacity=".04"
      stroke="currentColor" stroke-opacity=".34" stroke-width="1.25" />
    <!-- its title bar: a star, a name stub, and the toolbar's buttons -->
    <path d="M40.6 60 H189.4" stroke="currentColor" stroke-opacity=".2" />
    <circle cx="49" cy="53" r="2.2" fill="currentColor" fill-opacity=".28" />
    <rect x="55" y="51.3" width="30" height="3.4" rx="1.7" fill="currentColor" fill-opacity=".42" />
    <rect x="152" y="50" width="14" height="6" rx="2.2" fill="currentColor" fill-opacity=".14" />
    <rect x="169" y="50" width="14" height="6" rx="2.2" fill="currentColor" fill-opacity=".14" />

    <!-- the 2×2 grid of slots: two TARGETS (where the arrows land), one "+", one plain -->
    <rect x="48" y="67" width="64" height="31" rx="5" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="118" y="67" width="64" height="31" rx="5" fill="currentColor" fill-opacity=".1"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="48" y="104" width="64" height="31" rx="5" fill="currentColor" fill-opacity=".1"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="118" y="104" width="64" height="31" rx="5" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <!-- "add here" -->
    <circle cx="80" cy="82.5" r="7" fill="var(--surface)" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1" />
    <path d="M80 79.2 V85.8 M76.7 82.5 H83.3" stroke="currentColor" stroke-opacity=".65" stroke-width="1.3" stroke-linecap="round" />

    <!-- the CURVED ARROWS — each widget's path into its slot -->
    <!-- bar widget → bottom-left slot: sweeps down past the window's edge and in -->
    <path d="M26 46 C 22 78, 34 104, 66 115" stroke="currentColor" stroke-opacity=".38" stroke-width="1.3"
      stroke-dasharray="2.6 3" stroke-linecap="round" />
    <path d="M61.2 110.8 L 67 115.3 L 60.4 117.9" stroke="currentColor" stroke-opacity=".5" stroke-width="1.3"
      stroke-linecap="round" stroke-linejoin="round" />
    <!-- pie widget → top-right slot: curls down and back in -->
    <path d="M195 46 C 201 66, 190 81, 166 82.5" stroke="currentColor" stroke-opacity=".38" stroke-width="1.3"
      stroke-dasharray="2.6 3" stroke-linecap="round" />
    <path d="M170.6 78.4 L 165.6 82.6 L 170.8 86.4" stroke="currentColor" stroke-opacity=".5" stroke-width="1.3"
      stroke-linecap="round" stroke-linejoin="round" />

    <!-- a BAR CHART widget, picked up, outside the board (top-left) -->
    <g transform="translate(4 8) rotate(-6 28 18)">
      <rect x="0" y="0" width="56" height="36" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
      <path d="M0.6 9.5 H55.4" stroke="currentColor" stroke-opacity=".22" />
      <rect x="5" y="3.6" width="18" height="2.5" rx="1.25" fill="currentColor" fill-opacity=".5" />
      <path d="M6 31.4 H50" stroke="currentColor" stroke-opacity=".22" />
      <rect x="9" y="22" width="6" height="9" rx="1" fill="currentColor" fill-opacity=".8" />
      <rect x="18" y="16" width="6" height="15" rx="1" fill="currentColor" fill-opacity=".55" />
      <rect x="27" y="19" width="6" height="12" rx="1" fill="currentColor" fill-opacity=".8" />
      <rect x="36" y="13" width="6" height="18" rx="1" fill="currentColor" fill-opacity=".4" />
    </g>

    <!-- a PIE CHART widget, picked up, outside the board (top-right) -->
    <g transform="translate(160 6) rotate(6 28 18)">
      <rect x="0" y="0" width="56" height="36" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
      <path d="M0.6 9.5 H55.4" stroke="currentColor" stroke-opacity=".22" />
      <rect x="5" y="3.6" width="16" height="2.5" rx="1.25" fill="currentColor" fill-opacity=".5" />
      <circle cx="16" cy="22.5" r="9" fill="currentColor" fill-opacity=".22" />
      <path d="M16 22.5 L16 13.5 A9 9 0 0 1 24.6 25.3 Z" fill="currentColor" fill-opacity=".8" />
      <path d="M16 22.5 L24.6 25.3 A9 9 0 0 1 10.1 29.3 Z" fill="currentColor" fill-opacity=".5" />
      <circle cx="32" cy="17" r="1.6" fill="currentColor" fill-opacity=".8" />
      <rect x="35.5" y="15.8" width="15" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
      <circle cx="32" cy="22.5" r="1.6" fill="currentColor" fill-opacity=".5" />
      <rect x="35.5" y="21.3" width="11" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
      <circle cx="32" cy="28" r="1.6" fill="currentColor" fill-opacity=".22" />
      <rect x="35.5" y="26.8" width="13" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
    </g>
  </svg>
</template>

<style scoped>
/* STATIC — no motion */
.eba { display: block; flex: none; overflow: visible; }
</style>
