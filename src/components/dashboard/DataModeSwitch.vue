<script setup>
/**
 * DataModeSwitch — the builder's Manual / Query Based choice (2026-09-30).
 *
 * The old control was a pair of small outlined chips. It read as a filter, not as the switch
 * that replaces everything below it (Axes, Data Configuration, Conditions ↔ the SQL box).
 * Two replacements, both the user's picks, switchable from the builder's demo pill:
 *
 *   A · cards  — two option cards, icon + title + one line saying what you'll get. The
 *                chosen card is edged in --sel with a check.
 *   D · banner — the mode as a STATE: a tinted strip naming the mode you are in and what
 *                it means for the fields below, with one action to switch.
 */
import { computed } from 'vue'
import Icon from '../ui/Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: 'manual' },   // 'manual' | 'query'
  variant: { type: String, default: 'cards' },       // 'cards' | 'banner'
  subject: { type: String, default: 'chart' },       // what is being built, for the copy
})
const emit = defineEmits(['update:modelValue'])

const MODES = computed(() => [
  { id: 'manual', icon: 'appearance', title: 'Manual', line: 'Pick fields and conditions, no SQL.',
    state: `Building this ${props.subject} from the fields and conditions below.`, tag: 'Manual mode' },
  { id: 'query', icon: 'code', title: 'Query based', line: 'Write the SQL that returns the data.',
    state: `This ${props.subject} runs the SQL you write below.`, tag: 'Query mode' },
])
const cur = computed(() => MODES.value.find((m) => m.id === props.modelValue) || MODES.value[0])
const other = computed(() => MODES.value.find((m) => m.id !== cur.value.id))
</script>

<template>
  <!-- A · option cards -->
  <div v-if="variant === 'cards'" class="dm-cards" role="radiogroup" aria-label="Data source">
    <button
      v-for="m in MODES" :key="m.id" type="button" class="dm-card" :class="{ on: m.id === cur.id }"
      role="radio" :aria-checked="m.id === cur.id" @click="emit('update:modelValue', m.id)"
    >
      <span class="dm-ic"><Icon :name="m.icon" :size="16" /></span>
      <span class="dm-txt">
        <b>{{ m.title }}</b>
        <span>{{ m.line }}</span>
      </span>
      <Icon v-if="m.id === cur.id" name="check-circle" :size="16" class="dm-check" />
    </button>
  </div>

  <!-- D · mode banner -->
  <div v-else class="dm-banner" :class="'is-' + cur.id" role="status">
    <span class="dm-ic"><Icon :name="cur.icon" :size="16" /></span>
    <span class="dm-txt">
      <em>{{ cur.tag }}</em>
      <span>{{ cur.state }}</span>
    </span>
    <button type="button" class="dm-switch" @click="emit('update:modelValue', other.id)">
      Switch to {{ other.title }} <Icon name="arrow-right" :size="14" />
    </button>
  </div>
</template>

<style scoped>
/* ── A · cards ── */
.dm-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dm-card { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 12px; min-height: 72px; text-align: left; border: 1px solid var(--border-control); border-radius: var(--r-lg); background: var(--surface); color: var(--ink); cursor: pointer; transition: border-color .15s, background .15s; }
.dm-card:hover { border-color: var(--muted-2); }
/* 1px only (user, 2026-09-30) — no second ring */
.dm-card.on { border-color: var(--sel); }
.dm-card .dm-ic { background: var(--surface-2); color: var(--muted); }
/* the chosen badge: a LIGHT tint of the near-black with the glyph in it — the solid dark
   square read too heavy (user, 2026-09-30) */
.dm-card.on .dm-ic { background: color-mix(in srgb, var(--sel) 10%, var(--surface)); color: var(--sel); }
.dm-check { position: absolute; top: 10px; right: 10px; color: var(--sel-ink); fill: var(--sel); }
.dm-txt { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-right: 18px; }
.dm-txt b { font-size: 13px; font-weight: 600; color: var(--ink); }
.dm-txt span { font-size: 12px; line-height: 1.4; color: var(--muted); }

/* shared icon badge */
.dm-ic { flex: none; width: 30px; height: 30px; border-radius: var(--r); display: grid; place-items: center; transition: background .15s, color .15s; }

/* ── D · banner ── */
.dm-banner { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--r-lg); border: 1px solid var(--border); border-left: 3px solid var(--sel); background: color-mix(in srgb, var(--primary) 5%, var(--surface)); }
.dm-banner .dm-ic { background: color-mix(in srgb, var(--sel) 10%, var(--surface)); color: var(--sel); }
.dm-banner .dm-txt { flex: 1; padding: 0; }
.dm-banner em { font-style: normal; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink); }
.dm-banner .dm-txt span { color: var(--ink-2); }
/* query mode wears a darker wash, so the two states never look alike at a glance */
.dm-banner.is-query { background: color-mix(in srgb, var(--ink) 6%, var(--surface)); }
.dm-switch { flex: none; display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px; border: 1px solid var(--border-control); border-radius: var(--r); background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.dm-switch:hover { border-color: var(--sel); }
</style>
