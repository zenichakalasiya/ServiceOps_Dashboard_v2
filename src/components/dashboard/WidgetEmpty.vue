<script setup>
/**
 * WidgetEmpty — the "nothing to draw" block inside a widget.
 *
 * Extracted so the real tile (`WidgetCard`) and the catalogue at /empty-states render
 * the SAME component rather than two copies that agree today. The copy itself lives in
 * `data/emptyStates.js`; this file owns only how it is laid out.
 *
 * The disc is 42px and the mark inside it 20px, with one grey line under it (no title). The mark is the tile's OWN chart artwork
 * for an empty period — a ghost of the thing that would be there — and a plain semantic
 * glyph for a fault or unfinished setup, which are not about the widget's shape.
 */
import Icon from '../ui/Icon.vue'
import ChartIcon from '../ui/ChartIcon.vue'

defineProps({
  // an entry from data/emptyStates.js: { art | icon, title, sub, action? }
  state: { type: Object, required: true },
  // 'nodata' | 'error' | 'unconfigured' — only used to tint the fault disc
  kind: { type: String, default: 'nodata' },
  // whether this instance may offer its action (the catalogue shows it, a locked tile may not)
  canAct: { type: Boolean, default: true },
})
defineEmits(['act'])
</script>

<template>
  <div class="we" :class="{ err: kind === 'error' }">
    <span class="we-disc">
      <!-- the tile's own chart shape for an empty period… -->
      <ChartIcon v-if="state.art" :name="state.art" :size="20" />
      <!-- …a semantic glyph for a fault or for setup that never happened -->
      <Icon v-else :name="state.icon" :size="20" />
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
/* 42px disc, 20px mark. A circle rather than the 4px rounded square this started as —
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
</style>
