<script setup>
/**
 * AiInsightChip — placement A of the AI-insights entry point.
 *
 * A small gradient-bordered chip (sparkle + attention count) that sits in the board header,
 * left of the ⋯ menu. Clicking it opens a popover: a grounded one-line dashboard summary and
 * the three CTAs. Each CTA emits `ask(intent, label)` — the board opens the real assistant.
 *
 * Near-zero vertical cost; the chip survives a zero-insight board (it stays, just no count).
 * Shared teaser + CTAs with the banner and the KPI-row card (see data/aiTeaser.js).
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import { useAiTeaser, AI_TEASER_CTAS } from '../../data/aiTeaser.js'

const props = defineProps({ board: { type: Object, required: true } })
const emit = defineEmits(['ask'])

const { count, summary } = useAiTeaser(() => props.board)
const open = ref(false)
/* Both actions, in the order the reference card uses them: the first is the primary
 * (gradient border), the rest are secondary (tint). This popover used to offer only
 * "what needs attention" on the argument that a topbar icon has no room to land a deep
 * dive — but the deep dive lands in the side panel either way, and being the one AI
 * surface in the product with a different action set cost more than the row saved. */
const CTAS = AI_TEASER_CTAS.filter((c) => c.intent === 'focus' || c.intent === 'deepdive')

function pick(c) { open.value = false; emit('ask', c.intent, c.label) }
function onKey(e) { if (e.key === 'Escape' && open.value) open.value = false }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="chip-wrap">
    <button class="ai-chip" :class="{ on: open }" :aria-expanded="open" title="AI insights" @click.stop="open = !open">
      <!-- icon only, matching a widget's own AI sparkle. The label and the count were
           two labels for one button in a row of icon-only actions; the count in
           particular promised a number that nothing downstream ever refers to again. -->
      <Icon name="sparkles" :size="17" />
    </button>
    <div v-if="open" class="pop-backdrop" @click="open = false" />
    <transition name="pop">
      <div v-if="open" class="ai-pop aic" @click.stop>
        <div class="ai-pop-h"><span class="ai-pop-spark"><Icon name="sparkles" :size="16" /></span> AI insights</div>
        <p class="ai-pop-sum">{{ summary }}</p>
        <div class="ai-pop-acts">
          <button
            v-for="(c, i) in CTAS" :key="c.intent"
            class="ai-cta" :class="{ primary: i === 0 }" @click="pick(c)"
          >
            <Icon :name="c.icon" :size="13" /><span>{{ c.label }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.chip-wrap { position: relative; }
/* AI-accented pill: gradient-border over white, gradient glyph, count badge */
/* Sized and cornered like every other action in the board header (.btn — 36px tall,
   --r radius). It was a 30px pill, which made the one AI control in the row both shorter
   than its neighbours and a different shape; the gradient border is enough to mark it out
   without also breaking the row's geometry. */
.ai-chip {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  width: 36px; height: 36px; padding: 0;
  border: 1.5px solid transparent; border-radius: var(--r);
  background: linear-gradient(var(--surface), var(--surface)) padding-box, var(--ai-grad-line) border-box;
}
.ai-chip :deep(.ico) { stroke: url(#ai-grad); color: var(--ai); }
/* the button names itself, as the design does — an icon plus a bare number said what
   there was but never what it was */
.ai-chip-l { font-size: 13px; font-weight: 600; color: var(--ai-ink); white-space: nowrap; }
/* the count still rides along: it is the one thing the label cannot carry */
.ai-chip-n { min-width: 17px; height: 17px; padding: 0 5px; display: grid; place-items: center; border-radius: 999px; background: var(--ai-soft); font-size: 11px; font-weight: 700; color: var(--ai-ink); font-variant-numeric: tabular-nums; }
.ai-chip:hover, .ai-chip.on { background: linear-gradient(var(--ai-soft), var(--ai-soft)) padding-box, var(--ai-grad-line) border-box; }
.pop-backdrop { position: fixed; inset: 0; z-index: 40; }
/* Shell, wash and both CTA types come from `.aic` / `.ai-cta` in global.css —
   the same card the ticket detail page shows. Only placement is local. */
.ai-pop { position: absolute; top: 38px; right: 0; z-index: 50; width: 340px; box-shadow: var(--sh-pop); padding: 12px 16px 16px; }
.ai-pop-h { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
/* a bare gradient glyph, no tinted container — the reference gives it none */
.ai-pop-spark { flex: none; display: grid; place-items: center; }
.ai-pop-spark :deep(.ico) { stroke: url(#ai-grad); color: var(--ai); }
.ai-pop-sum { margin: 0; font-size: 13px; line-height: 1.6; color: var(--ink); }
.ai-pop-acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.pop-enter-active, .pop-leave-active { transition: opacity .14s ease, transform .14s ease; transform-origin: top right; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.96); }
</style>
