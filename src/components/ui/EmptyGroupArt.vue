<script setup>
/**
 * EmptyGroupArt — the empty group's illustration: "drop a widget here".
 *
 * Drawn here rather than taken from a stock library: the prototype is a public repo and
 * the product ships on-prem, so a third-party vector would be redistributed under its
 * licence, and a stock file brings its own colours, which break in dark mode.
 *
 * Same idiom as ChartIcon — one colour (`currentColor`, set by the caller) at stepped
 * opacities, plus the card surface for the widget's face — so it sits in the same family
 * as the chart artwork and flips with the theme.
 *
 * The story, left to right: a dashed drop zone with two empty slots; a widget card, tilted
 * as if carried, hovering over the right-hand slot, which is picked out as the target; a
 * soft shadow under the card where it will land; a dashed arc behind it for the motion.
 */
defineProps({ width: { type: Number, default: 132 } })
</script>

<template>
  <svg class="ega" :width="width" :height="width * 0.64" viewBox="0 0 132 84" fill="none" aria-hidden="true" focusable="false">
    <!-- the drop zone -->
    <rect x="8" y="36" width="116" height="44" rx="8" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".38" stroke-width="1.25" stroke-dasharray="4 3" />
    <!-- an empty slot, and the TARGET slot the card is headed for -->
    <rect x="16" y="44" width="46" height="28" rx="5" fill="currentColor" fill-opacity=".08" />
    <rect x="70" y="44" width="46" height="28" rx="5" fill="currentColor" fill-opacity=".12"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3 2.5" />
    <!-- where it will land -->
    <ellipse class="ega-shadow" cx="93" cy="58" rx="17" ry="3" fill="currentColor" fill-opacity=".14" />

    <!-- the motion: a dashed arc coming in from the left -->
    <path d="M30 18 C 44 6, 60 6, 70 14" stroke="currentColor" stroke-opacity=".35" stroke-width="1.25"
      stroke-dasharray="2.5 3" stroke-linecap="round" />
    <path d="M67 10.5 L 71 14.4 L 66 16" stroke="currentColor" stroke-opacity=".45" stroke-width="1.25"
      stroke-linecap="round" stroke-linejoin="round" />

    <!-- the widget, carried: a card with a title stub and a small column chart -->
    <g class="ega-card">
      <g transform="translate(74 4) rotate(-8)">
        <rect x="0" y="0" width="42" height="32" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
        <path d="M0.6 9 H41.4" stroke="currentColor" stroke-opacity=".22" />
        <rect x="5" y="3.4" width="15" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".5" />
        <rect x="7" y="19" width="5" height="9" rx="1" fill="currentColor" fill-opacity=".8" />
        <rect x="15" y="14" width="5" height="14" rx="1" fill="currentColor" fill-opacity=".55" />
        <rect x="23" y="17" width="5" height="11" rx="1" fill="currentColor" fill-opacity=".8" />
        <rect x="31" y="11" width="5" height="17" rx="1" fill="currentColor" fill-opacity=".4" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.ega { display: block; flex: none; overflow: visible; }
/* a slow bob: the card is being carried, not sitting — its shadow tightens as it dips */
.ega-card { animation: egaBob 2.8s ease-in-out infinite; transform-box: fill-box; }
.ega-shadow { animation: egaShadow 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes egaBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
@keyframes egaShadow { 0%, 100% { transform: scaleX(1); opacity: 1; } 50% { transform: scaleX(.85); opacity: 1.25; } }
@media (prefers-reduced-motion: reduce) { .ega-card, .ega-shadow { animation: none; } }
</style>
