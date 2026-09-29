<script setup>
/**
 * EmptyPreviewArt — the widget builder's live preview before any condition is set:
 * "add a condition, and the chart draws here".
 *
 * A sibling of EmptyGroupArt (same idiom, same family): one colour (`currentColor`, set
 * by the caller) at stepped opacities, plus the card surface for the panel's face, so it
 * flips with the theme and needs no licence. Drawn here for the same reasons as that one.
 *
 * The story, right to left — the way the builder reads: the CONDITIONS panel (the builder's
 * right sidebar) holds two `field is value` rows and a dashed "+ Add" chip; a dashed arc
 * carries them into the preview frame on the left, where the chart waits as dashed ghost
 * columns on an empty axis — drawn in outline only, because nothing has been counted yet.
 */
defineProps({ width: { type: Number, default: 180 } })
</script>

<template>
  <svg class="epa" :width="width" :height="width * 0.64" viewBox="0 0 132 84" fill="none" aria-hidden="true" focusable="false">
    <!-- the preview frame, waiting -->
    <rect x="4" y="18" width="80" height="62" rx="7" fill="currentColor" fill-opacity=".05"
      stroke="currentColor" stroke-opacity=".38" stroke-width="1.25" stroke-dasharray="4 3" />
    <!-- its title stub -->
    <rect x="11" y="25" width="22" height="2.6" rx="1.3" fill="currentColor" fill-opacity=".22" />
    <!-- the axis, and the chart as ghost columns: outlines only, nothing counted yet -->
    <path d="M12 71 H76" stroke="currentColor" stroke-opacity=".3" stroke-width="1" />
    <g class="epa-ghost" stroke="currentColor" stroke-opacity=".42" stroke-width="1" stroke-dasharray="2.5 2" fill="currentColor" fill-opacity=".06">
      <rect x="17" y="53" width="9" height="18" rx="1.5" />
      <rect x="31" y="43" width="9" height="28" rx="1.5" />
      <rect x="45" y="57" width="9" height="14" rx="1.5" />
      <rect x="59" y="37" width="9" height="34" rx="1.5" />
    </g>

    <!-- the conditions, travelling from the panel into the chart -->
    <path d="M94 50 C 88 60, 80 60, 72 53" stroke="currentColor" stroke-opacity=".35" stroke-width="1.25"
      stroke-dasharray="2.5 3" stroke-linecap="round" />
    <path d="M75.6 51.2 L 71.6 52.8 L 73.4 56.8" stroke="currentColor" stroke-opacity=".45" stroke-width="1.25"
      stroke-linecap="round" stroke-linejoin="round" />

    <!-- the CONDITIONS panel: a funnel + title, two `field is value` rows, a "+ Add" chip -->
    <g class="epa-card">
      <rect x="88" y="4" width="40" height="44" rx="5" fill="var(--surface)" stroke="currentColor" stroke-opacity=".7" stroke-width="1.25" />
      <path d="M92.5 9 H99.5 L 97 12.2 V 14.6 L 95 15.4 V 12.2 Z" fill="currentColor" fill-opacity=".55" />
      <rect x="102" y="10.2" width="15" height="2.4" rx="1.2" fill="currentColor" fill-opacity=".5" />
      <path d="M88.6 19 H127.4" stroke="currentColor" stroke-opacity=".18" />
      <!-- field · is · value -->
      <rect x="92" y="22.5" width="13" height="5" rx="1.5" fill="currentColor" fill-opacity=".45" />
      <rect x="107" y="24.3" width="3" height="1.4" rx=".7" fill="currentColor" fill-opacity=".3" />
      <rect x="112" y="22.5" width="12" height="5" rx="1.5" fill="currentColor" fill-opacity=".2" />
      <rect x="92" y="30.5" width="10" height="5" rx="1.5" fill="currentColor" fill-opacity=".45" />
      <rect x="104" y="32.3" width="3" height="1.4" rx=".7" fill="currentColor" fill-opacity=".3" />
      <rect x="109" y="30.5" width="15" height="5" rx="1.5" fill="currentColor" fill-opacity=".2" />
      <!-- "+ Add condition", the thing to do -->
      <g class="epa-add">
        <rect x="92" y="38.8" width="21" height="6" rx="2" stroke="currentColor" stroke-opacity=".55" stroke-width=".9" stroke-dasharray="2 1.6" />
        <path d="M95.2 41.8 H98.8 M97 40 V43.6" stroke="currentColor" stroke-opacity=".75" stroke-width="1" stroke-linecap="round" />
        <rect x="100.6" y="41.1" width="9.4" height="1.5" rx=".75" fill="currentColor" fill-opacity=".45" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.epa { display: block; flex: none; overflow: visible; }
/* the panel bobs like the carried card on the empty group; the "+ Add" chip breathes —
   it is the one thing to do; the ghost columns shimmer, waiting for data */
.epa-card { animation: epaBob 2.8s ease-in-out infinite; transform-box: fill-box; }
.epa-add { animation: epaPulse 1.8s ease-in-out infinite; }
.epa-ghost { animation: epaWait 2.4s ease-in-out infinite; }
@keyframes epaBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
@keyframes epaPulse { 0%, 100% { opacity: .7; } 50% { opacity: 1; } }
@keyframes epaWait { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .epa-card, .epa-add, .epa-ghost { animation: none; } }
</style>
