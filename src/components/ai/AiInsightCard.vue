<script setup>
/**
 * AiInsightCard — placement B of the AI-insights entry point.
 *
 * A wide card sized to sit inside the KPI row (the parent gives it its column span). It shows
 * the AI glyph, "AI insights", the attention count, a grounded one-line summary and the three
 * CTAs. Each CTA emits `ask(intent, label)` — the board opens the real assistant.
 *
 * Zero extra chrome — it's already a tile in the row. Shared teaser + CTAs with the banner and
 * the header chip (see data/aiTeaser.js).
 */
import Icon from '../ui/Icon.vue'
import { useAiTeaser, AI_TEASER_CTAS } from '../../data/aiTeaser.js'

const props = defineProps({ board: { type: Object, required: true } })
const emit = defineEmits(['ask'])

const { count, summary } = useAiTeaser(() => props.board)
const CTAS = AI_TEASER_CTAS
</script>

<template>
  <div class="ai-card-b aic card">
    <div class="acb-head">
      <span class="acb-spark"><Icon name="sparkles" :size="18" /></span>
      <span class="acb-title">AI insights</span>
      <span class="acb-meta">{{ count ? count + ' need' + (count === 1 ? 's' : '') + ' attention' : 'Within range' }}</span>
    </div>
    <p class="acb-sum">{{ summary }}</p>
    <div class="acb-acts">
      <button
        v-for="(c, i) in CTAS" :key="c.intent"
        class="ai-cta" :class="{ primary: i === 0 }" @click="emit('ask', c.intent, c.label)"
      >
        <Icon :name="c.icon" :size="13" /> <span>{{ c.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Same anatomy as the board card and the ticket detail page's AI Summary — shell, washed
   header, body, CTA row — at tile scale: 16px gutters instead of 24 because this sits in
   a KPI column, not across the board. */
/* Shell, wash and both CTA types come from `.aic` / `.ai-cta` in global.css. */
.ai-card-b {
  align-self: stretch; display: flex; flex-direction: column; text-align: left;
  padding: 12px 16px; height: 100%; overflow: hidden;
}
.acb-head { position: relative; display: flex; align-items: center; gap: 8px; }
.acb-title { font-size: 14px; font-weight: 600; color: var(--ink); }
.acb-meta { margin-left: auto; font-size: 11px; color: var(--muted-2); white-space: nowrap; }
.acb-spark { flex: none; display: grid; place-items: center; }
.acb-spark :deep(.ico) { stroke: url(#ai-grad); color: var(--ai); }
.acb-sum { position: relative; flex: 1; margin: 10px 0 12px; font-size: 13px; line-height: 1.6; color: var(--ink); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
/* both CTAs on one row, each on one line — see AiSummaryCard for why wrapping loses */
.acb-acts { position: relative; display: flex; gap: 8px; }
</style>
