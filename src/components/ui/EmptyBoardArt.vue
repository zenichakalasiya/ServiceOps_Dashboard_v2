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
 * The story (redrawn 2026-10-09, user's call — the first version had widgets FLYING around the
 * board, which read as decoration, not as "fill this board"): everything happens INSIDE the
 * dashboard. A dashboard window — title bar and toolbar — whose body is a 2×2 grid of dashed
 * widget slots. Two widgets are being SET DOWN into their slots: a bar chart into the top-right
 * slot and a pie chart into the bottom-left one, each lifted a few px with a slight tilt over a
 * highlighted slot and a landing shadow, a small drop arrow beside the first. The other two
 * slots are still empty; one carries a "+".
 *
 * STATIC — no motion (the user's call, 2026-10-08). Downloadable from /preview-states.
 */
defineProps({ width: { type: Number, default: 220 } })
</script>

<template>
  <svg class="eba" :width="width" :height="width * 0.66" viewBox="0 0 220 146" fill="none" aria-hidden="true" focusable="false">
    <!-- the dashboard window -->
    <rect x="12" y="8" width="196" height="132" rx="10" fill="currentColor" fill-opacity=".04"
      stroke="currentColor" stroke-opacity=".34" stroke-width="1.25" />
    <!-- its title bar: a star, a name stub, and the toolbar's buttons -->
    <path d="M12.6 27 H207.4" stroke="currentColor" stroke-opacity=".2" />
    <circle cx="24" cy="17.5" r="2.6" fill="currentColor" fill-opacity=".28" />
    <rect x="31" y="15.5" width="38" height="4" rx="2" fill="currentColor" fill-opacity=".42" />
    <rect x="160" y="14" width="16" height="7" rx="2.5" fill="currentColor" fill-opacity=".14" />
    <rect x="179" y="14" width="20" height="7" rx="2.5" fill="currentColor" fill-opacity=".14" />

    <!-- the 2×2 grid of slots: two still empty (one with a "+"), two being filled -->
    <rect x="22" y="36" width="84" height="44" rx="6" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="114" y="36" width="84" height="44" rx="6" fill="currentColor" fill-opacity=".1"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="22" y="88" width="84" height="44" rx="6" fill="currentColor" fill-opacity=".1"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="114" y="88" width="84" height="44" rx="6" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <!-- "add here" -->
    <circle cx="64" cy="58" r="8" fill="var(--surface)" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1" />
    <path d="M64 54.2 V61.8 M60.2 58 H67.8" stroke="currentColor" stroke-opacity=".65" stroke-width="1.4" stroke-linecap="round" />

    <!-- landing shadows: where each widget is being set down -->
    <ellipse cx="156" cy="76" rx="30" ry="3" fill="currentColor" fill-opacity=".14" />
    <ellipse cx="64" cy="128" rx="30" ry="3" fill="currentColor" fill-opacity=".14" />

    <!-- the drop cue beside the bar widget -->
    <path d="M203 34 V46" stroke="currentColor" stroke-opacity=".34" stroke-width="1.25" stroke-dasharray="2.5 2.5" stroke-linecap="round" />
    <path d="M200 43.5 L 203 47 L 206 43.5" stroke="currentColor" stroke-opacity=".45" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />

    <!-- a BAR CHART widget, lifted just above its slot, being set down -->
    <g transform="translate(119 30) rotate(-3 37 19)">
      <rect x="0" y="0" width="74" height="38" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
      <path d="M0.6 10 H73.4" stroke="currentColor" stroke-opacity=".22" />
      <rect x="6" y="3.8" width="22" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".5" />
      <path d="M8 33.4 H66" stroke="currentColor" stroke-opacity=".22" />
      <rect x="11" y="24" width="7" height="9" rx="1" fill="currentColor" fill-opacity=".8" />
      <rect x="22" y="17" width="7" height="16" rx="1" fill="currentColor" fill-opacity=".55" />
      <rect x="33" y="21" width="7" height="12" rx="1" fill="currentColor" fill-opacity=".8" />
      <rect x="44" y="14" width="7" height="19" rx="1" fill="currentColor" fill-opacity=".4" />
      <rect x="55" y="19" width="7" height="14" rx="1" fill="currentColor" fill-opacity=".65" />
    </g>

    <!-- a PIE CHART widget, lifted just above its slot, being set down -->
    <g transform="translate(27 82) rotate(2.5 37 19)">
      <rect x="0" y="0" width="74" height="38" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
      <path d="M0.6 10 H73.4" stroke="currentColor" stroke-opacity=".22" />
      <rect x="6" y="3.8" width="20" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".5" />
      <!-- the pie: three slices -->
      <circle cx="19" cy="24" r="10" fill="currentColor" fill-opacity=".22" />
      <path d="M19 24 L19 14 A10 10 0 0 1 28.5 27.1 Z" fill="currentColor" fill-opacity=".8" />
      <path d="M19 24 L28.5 27.1 A10 10 0 0 1 12.1 31.2 Z" fill="currentColor" fill-opacity=".5" />
      <!-- its legend -->
      <circle cx="38" cy="17.6" r="1.7" fill="currentColor" fill-opacity=".8" />
      <rect x="42" y="16.4" width="22" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
      <circle cx="38" cy="24" r="1.7" fill="currentColor" fill-opacity=".5" />
      <rect x="42" y="22.8" width="17" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
      <circle cx="38" cy="30.4" r="1.7" fill="currentColor" fill-opacity=".22" />
      <rect x="42" y="29.2" width="19" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".3" />
    </g>
  </svg>
</template>

<style scoped>
/* STATIC — no motion */
.eba { display: block; flex: none; overflow: visible; }
</style>
