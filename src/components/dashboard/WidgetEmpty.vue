<script setup>
/**
 * WidgetEmpty — the "nothing to draw" block inside a widget.
 *
 * Extracted so the real tile (`WidgetCard`) and the former /empty-states catalogue (removed 2026-09-29) render
 * the SAME component rather than two copies that agree today. The copy itself lives in
 * `data/emptyStates.js`; this file owns only how it is laid out.
 *
 * NO DATA (2026-09-29, user's call) draws the "no data found" illustration (NoDataArt: an
 * empty chart frame with a magnifier finding only a flat baseline) — the same one on every
 * widget type, in the empty group's slate. It replaced the disc holding the tile's own
 * chart icon. A fault or unfinished setup keeps the 42px disc with a plain semantic glyph,
 * since those are a system problem, not "we looked and nothing matched".
 *
 * On a short tile (a one-row KPI) the illustration shrinks, then steps aside for the line
 * of text. The block MEASURES itself (ResizeObserver) — a CSS size container matched its
 * smallest query on a 188px tile, so the art vanished where it had plenty of room.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import ChartIcon from '../ui/ChartIcon.vue'
import NoDataArt from '../ui/NoDataArt.vue'

defineProps({
  // an entry from data/emptyStates.js: { art | icon, title, sub, action? }
  state: { type: Object, required: true },
  // 'nodata' | 'error' | 'unconfigured' — only used to tint the fault disc
  kind: { type: String, default: 'nodata' },
  // whether this instance may offer its action (the catalogue shows it, a locked tile may not)
  canAct: { type: Boolean, default: true },
})
defineEmits(['act'])

// the art's width for the room this block has: full, smaller, or none (text only)
const el = ref(null)
const h = ref(999)
let ro = null
onMounted(() => { ro = new ResizeObserver(([e]) => { h.value = e.contentRect.height }); ro.observe(el.value) })
onBeforeUnmount(() => ro?.disconnect())
// smaller since 2026-10-09 (user): 88px on a normal tile, 64px on a short one, none below
const artW = computed(() => (h.value >= 150 ? 88 : h.value >= 108 ? 64 : 0))
</script>

<template>
  <div ref="el" class="we" :class="{ err: kind === 'error' }">
    <template v-if="kind === 'nodata'">
      <NoDataArt v-if="artW" class="we-art" :width="artW" />
    </template>
    <span v-else class="we-disc">
      <!-- the tile's own chart shape for an empty period… -->
      <ChartIcon v-if="state.art" :name="state.art" :size="24" />
      <!-- …a semantic glyph for a fault or for setup that never happened -->
      <Icon v-else :name="state.icon" :size="24" />
    </span>
    <!-- One grey line, no bold title: the widget's own header already names it. The
         title stays in data/emptyStates.js as the accessible label. -->
    <span class="we-sub" :aria-label="state.title + '. ' + state.sub">{{ state.sub }}</span>
    <button
      v-if="state.action && canAct"
      class="btn btn-sm" :class="{ 'btn-primary': state.action === 'configure' }"
      @click="$emit('act', state.action)"
    >
      <Icon :name="state.action === 'retry' ? 'refresh' : 'edit'" :size="14" />
      {{ state.action === 'retry' ? 'Retry' : 'Configure' }}
    </button>
  </div>
</template>

<style scoped>
.we {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 6px; color: var(--muted); padding: 14px;
}
/* 42px disc, 24px mark. A circle rather than the 4px rounded square this started as —
   a disc reads as a place the mark LIVES, where a small rounded rectangle inside a card
   reads as a second, smaller card. */
.we-disc {
  width: 42px; height: 42px; flex: none; border-radius: 50%; display: grid; place-items: center;
  margin-bottom: 5px;
  /* --icon-hover is the one neutral that steps far enough off the card in BOTH themes
     (#f3f4f6 on white, #2a2a35 on the dark card). Do NOT swap it for --inset or
     --surface-2 without checking dark: --inset sits 4 units off the dark card and the
     disc disappears there while looking correct in light. */
  background: var(--icon-hover);
  color: var(--picker-ico);
}
/* A fault is the one state that earns colour — it is the only one the person has to act
   on, and a red disc says so before the sentence under it is read. */
.we.err .we-disc { background: var(--red-soft); color: var(--red); }
.we-sub { font-size: 12px; max-width: 260px; line-height: 1.45; }
.we .btn { margin-top: 9px; }
/* the no-data illustration, in the empty group's slate */
.we-art { color: var(--picker-ico); margin-bottom: 4px; }
</style>
