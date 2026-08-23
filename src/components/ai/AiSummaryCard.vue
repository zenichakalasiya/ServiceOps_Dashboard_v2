<script setup>
/**
 * AiSummaryCard — the board's "AI insights" card.
 *
 * Its UI is the ServiceOps ticket detail page's **AI Summary** card, measured off the real
 * thing rather than approximated:
 *
 *   shell      1px --border-control, --r-lg, a 3% gradient WASH (not a filled surface)
 *   header     24/12 padding · bare 18px gradient sparkle · 14px/600 title · 11px meta right
 *   body       24px gutters · 13px summary · "KEY POINTS" 11px/600 muted · dotted list
 *   CTA        32px · 0/12 · 4px · 12px/500 · ink text, in TWO types — the first action
 *              wears the 80% gradient ramp as its border over the surface, the rest a
 *              flat 12% gradient tint. The pair is the card's whole hierarchy.
 *
 * COLLAPSED it is the header row alone, so an unopened card costs the board ~46px.
 * EXPANDED it adds the summary, the key points and the CTAs — the same order the ticket
 * card uses, because a user who has read one should not have to re-learn the other.
 *
 * Everything shown is grounded: the summary and the key points are `facts()` from the
 * deterministic engine (data/aiTeaser.js). Nothing here invents a number.
 */
import { ref, computed } from 'vue'
import Icon from '../ui/Icon.vue'
import { useAiTeaser, AI_TEASER_CTAS } from '../../data/aiTeaser.js'

// hideAddWidget: the placement lab's Variant C drops "Add a new widget" (it duplicates
// the floating action button and isn't an AI action). The real dashboard leaves it on.
const props = defineProps({ board: { type: Object, required: true }, hideAddWidget: { type: Boolean, default: false } })
const emit = defineEmits(['ask'])

const open = ref(false)

const { summary, attention, count } = useAiTeaser(() => props.board)
const CTAS = computed(() => (props.hideAddWidget ? AI_TEASER_CTAS.filter((c) => c.intent !== 'suggestwidget') : AI_TEASER_CTAS))

/* The reference card's header carries a status line on the right ("New conversations have
 * been added"). Ours says what the engine actually found, so the line is a fact rather
 * than a decoration — and it is the one piece of information worth having while collapsed. */
const meta = computed(() => {
  if (!props.board?.tiles?.length) return 'No widgets yet'
  return count.value ? `${count.value} need${count.value === 1 ? 's' : ''} attention` : 'All widgets within range'
})

// three is what fits without the card becoming a list; the panel has the rest
const points = computed(() => attention.value.slice(0, 3))

function toggle() { open.value = !open.value }
</script>

<template>
  <section class="ai-card aic" :class="{ open }">
    <div
      class="ac-head" role="button" tabindex="0" :aria-expanded="open"
      @click="toggle" @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle"
    >
      <span class="ac-spark"><Icon name="sparkles" :size="18" /></span>
      <span class="ac-title">AI insights</span>
      <span class="ac-meta">{{ meta }}</span>
      <span class="ac-arrow" :title="open ? 'Collapse' : 'Expand'">
        <Icon :name="open ? 'chevron-up' : 'chevron-down'" :size="16" />
      </span>
    </div>

    <transition name="acx">
      <div v-if="open" class="ac-body">
        <p class="ac-summary">{{ summary }}</p>

        <template v-if="points.length">
          <div class="ac-kp">KEY POINTS</div>
          <ul class="ac-points">
            <li v-for="p in points" :key="p.text"><span class="ac-dot" /><span>{{ p.text }}</span></li>
          </ul>
        </template>

        <div class="ac-gen">Generated from this board’s live data</div>

        <div class="ac-ctas">
          <button
            v-for="(c, i) in CTAS" :key="c.intent"
            class="ai-cta" :class="{ primary: i === 0 }" @click="emit('ask', c.intent, c.label)"
          >
            <Icon :name="c.icon" :size="13" /><span>{{ c.label }}</span>
          </button>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
/* Shell, wash and both CTA types come from `.aic` / `.ai-cta` in global.css. Only the
   board-specific bits stay here — the margin, and the overflow the collapse needs. */
.ai-card { margin-bottom: 14px; overflow: hidden; }

.ac-head { position: relative; display: flex; align-items: center; gap: 8px; padding: 12px 24px; cursor: pointer; }
.ac-head:focus-visible { outline: 2px solid var(--ai); outline-offset: -2px; }
/* a bare gradient glyph, not a tinted square — the reference gives it no container */
.ac-spark { flex: none; display: grid; place-items: center; }
.ac-spark :deep(.ico) { stroke: url(#ai-grad); color: var(--ai); }
.ac-title { font-size: 14px; font-weight: 600; color: var(--ink); }
.ac-meta { margin-left: auto; font-size: 11px; color: var(--muted-2); white-space: nowrap; }
.ac-arrow { flex: none; width: 22px; height: 22px; display: grid; place-items: center; color: var(--muted); border-radius: var(--r); }
.ac-head:hover .ac-arrow { background: var(--surface-2); color: var(--ink); }

.ac-body { position: relative; padding: 0 24px 16px; }
.ac-summary { margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: var(--ink); max-width: 90ch; }
.ac-kp { font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 8px; }
.ac-points { list-style: none; margin: 0; padding: 0; }
.ac-points li { display: flex; gap: 8px; margin-bottom: 12px; font-size: 13px; line-height: 1.5; color: var(--ink); }
.ac-dot { flex: none; width: 4px; height: 4px; margin-top: 7px; border-radius: 50%; background: var(--ai); }
.ac-gen { font-size: 11px; color: var(--muted-2); margin-bottom: 16px; }

.ac-ctas { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

.acx-enter-active, .acx-leave-active { transition: opacity .16s ease; }
.acx-enter-from, .acx-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .acx-enter-active, .acx-leave-active { transition: none; } }
@media (max-width: 620px) { .ac-head, .ac-body { padding-left: 16px; padding-right: 16px; } }
</style>
