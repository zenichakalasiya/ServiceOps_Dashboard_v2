<script setup>
/**
 * EmptyBoardArt — a new dashboard with nothing on it: "add widgets to fill me" (2026-10-08).
 *
 * The same idiom as EmptyGroupArt and ChartIcon — ONE colour (`currentColor`, set by the
 * caller) at stepped opacities, plus the card surface for the widgets' faces — so it sits in
 * the family of the empty-group art and flips with the theme. Drawn here rather than taken
 * from a stock library for the same reason: a third-party vector would be redistributed with
 * the on-prem product, and its own colours break in dark mode.
 *
 * The story: a dashboard window — title bar with its toolbar — whose body is four dashed,
 * EMPTY widget slots, one marked with a "+". Three widgets are on their way in: a chart card
 * being carried down onto the highlighted slot (dashed arc + landing shadow), a KPI card and a
 * list card floating alongside — the three things "Add Widget" offers.
 *
 * STATIC — no motion (the user's call, 2026-10-08). Downloadable from /preview-states.
 */
defineProps({ width: { type: Number, default: 220 } })
</script>

<template>
  <svg class="eba" :width="width" :height="width * 0.66" viewBox="0 0 220 146" fill="none" aria-hidden="true" focusable="false">
    <!-- the dashboard window -->
    <rect x="22" y="30" width="176" height="110" rx="10" fill="currentColor" fill-opacity=".04"
      stroke="currentColor" stroke-opacity=".32" stroke-width="1.25" />
    <!-- its title bar: a name stub, a star, and the toolbar's buttons -->
    <path d="M22.6 48 H197.4" stroke="currentColor" stroke-opacity=".2" />
    <circle cx="34" cy="39" r="2.6" fill="currentColor" fill-opacity=".28" />
    <rect x="41" y="37" width="36" height="4" rx="2" fill="currentColor" fill-opacity=".42" />
    <rect x="150" y="35.5" width="16" height="7" rx="2.5" fill="currentColor" fill-opacity=".14" />
    <rect x="169" y="35.5" width="20" height="7" rx="2.5" fill="currentColor" fill-opacity=".14" />

    <!-- four empty slots; the top-right one is the target the chart card is headed for -->
    <rect x="31" y="56" width="74" height="35" rx="6" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="114" y="56" width="75" height="35" rx="6" fill="currentColor" fill-opacity=".1"
      stroke="currentColor" stroke-opacity=".5" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="31" y="98" width="74" height="34" rx="6" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <rect x="114" y="98" width="75" height="34" rx="6" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".3" stroke-width="1" stroke-dasharray="3.5 3" />
    <!-- "add here" -->
    <g class="eba-plus">
      <circle cx="68" cy="115" r="8" fill="var(--surface)" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1" />
      <path d="M68 111.2 V118.8 M64.2 115 H71.8" stroke="currentColor" stroke-opacity=".65" stroke-width="1.4" stroke-linecap="round" />
    </g>
    <!-- where the chart card will land -->
    <ellipse class="eba-shadow" cx="152" cy="80" rx="22" ry="3.2" fill="currentColor" fill-opacity=".14" />

    <!-- the motion: a dashed arc from the KPI card across to the chart card -->
    <path d="M60 16 C 82 2, 106 2, 124 12" stroke="currentColor" stroke-opacity=".34" stroke-width="1.25"
      stroke-dasharray="2.5 3" stroke-linecap="round" />
    <path d="M120.4 8.2 L 124.6 12.3 L 119.2 13.6" stroke="currentColor" stroke-opacity=".45" stroke-width="1.25"
      stroke-linecap="round" stroke-linejoin="round" />

    <!-- a KPI card, floating in from the left: a label stub and a big number -->
    <g class="eba-kpi">
      <g transform="translate(14 12) rotate(-6)">
        <rect x="0" y="0" width="40" height="30" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".62" stroke-width="1.2" />
        <rect x="5" y="5" width="16" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".42" />
        <rect x="5" y="13" width="7" height="12" rx="1.6" fill="currentColor" fill-opacity=".8" />
        <rect x="14" y="13" width="7" height="12" rx="1.6" fill="currentColor" fill-opacity=".8" />
        <rect x="25" y="19" width="9" height="3" rx="1.5" fill="currentColor" fill-opacity=".3" />
      </g>
    </g>

    <!-- the chart widget, carried down onto its slot -->
    <g class="eba-card">
      <g transform="translate(130 2) rotate(-7)">
        <rect x="0" y="0" width="50" height="38" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
        <path d="M0.6 10 H49.4" stroke="currentColor" stroke-opacity=".22" />
        <rect x="5" y="3.8" width="18" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".5" />
        <rect x="8" y="23" width="6" height="10" rx="1" fill="currentColor" fill-opacity=".8" />
        <rect x="17" y="17" width="6" height="16" rx="1" fill="currentColor" fill-opacity=".55" />
        <rect x="26" y="21" width="6" height="12" rx="1" fill="currentColor" fill-opacity=".8" />
        <rect x="35" y="14" width="6" height="19" rx="1" fill="currentColor" fill-opacity=".4" />
      </g>
    </g>

    <!-- a list (Shortcut) card, peeking in at the right -->
    <g class="eba-list">
      <g transform="translate(186 50) rotate(8)">
        <rect x="0" y="0" width="30" height="34" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".55" stroke-width="1.15" />
        <rect x="5" y="6" width="20" height="3" rx="1.5" fill="currentColor" fill-opacity=".5" />
        <rect x="5" y="13" width="20" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22" />
        <rect x="5" y="19" width="16" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22" />
        <rect x="5" y="25" width="18" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
/* STATIC — no motion (the user's call, 2026-10-08; the cards used to bob), like NoDataArt */
.eba { display: block; flex: none; overflow: visible; }
</style>
