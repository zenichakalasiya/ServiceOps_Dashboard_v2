<script setup>
/**
 * Icon — the one icon component. `<Icon name="…" :size="…" />`, unchanged API.
 *
 * Backed by **lucide-vue-next** (UI-STYLE-GUIDE §5: "one family, no mixing"). It used to
 * render Material Symbols ligatures from a webfont; the names below are the same product
 * vocabulary mapped onto lucide components instead, so no call site had to change.
 *
 * Why the indirection is worth keeping rather than importing lucide directly at each
 * call site:
 *   - the ~140 call sites name what the icon MEANS ('predefined-monitor', 'chart-hbar'),
 *     not which glyph draws it, so swapping the library again touches one file;
 *   - lucide's own names churn between majors (BarChart3 → ChartColumn), and that churn
 *     stops here;
 *   - the guide's stroke/size defaults get applied once.
 *
 * Named imports keep this tree-shakeable — only the icons listed there ship, not all 5847.
 *
 * The name→component map itself lives in `data/icons.js`, because the Icon Library page
 * (/icons) has to enumerate it and a component cannot export a binding out of
 * <script setup>. Copying the list into that page would have guaranteed the two drifted
 * apart the first time anyone added an icon.
 *
 * §5 sizes: 15 inside 32px controls · 16 nav/section · 18 panel headers and close buttons
 * · 13–14 inline with 12–13px text. Default colour is inherited (`currentColor`), so the
 * call site's `color` still drives it exactly as it did with the font.
 */
import { computed } from 'vue'
import { ICON_MAP, FILLED } from '../../data/icons.js'

const props = defineProps({
  name: String,
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 2 },
})


const cmp = computed(() => ICON_MAP[props.name] || null)
const px = computed(() => (typeof props.size === 'number' ? props.size : parseFloat(props.size) || 18))
/* Lucide's own default is 2. The guide's icons read lighter than that at 13–15px, where
 * a 2px stroke on a 13px glyph closes up the counters, so small sizes step down. */
const stroke = computed(() => (px.value <= 14 ? 1.75 : 2))
</script>

<template>
  <component
    :is="cmp" v-if="cmp" class="ico"
    :size="px" :stroke-width="stroke"
    :fill="FILLED.has(name) ? 'currentColor' : 'none'"
    aria-hidden="true"
  />
</template>

<style scoped>
/* `flex: none` so an icon decorating a label never compresses when the label wraps
   (§5). `display: block` kills the inline baseline gap that pushed icons ~3px low
   inside flex rows. */
.ico { display: block; flex: none; }
</style>
