<script>
/** Snapshot an element's box as a PLAIN object — the only shape the `rect` prop accepts.
 *  See the prop's comment for why a live DOMRect must never be handed to a ref. */
export function rectOf(el) {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height }
}
</script>

<script setup>
/**
 * TimeRangePopover — the two-pane date picker, in one place.
 *
 * Absolute From/To on the left, searchable quick ranges on the right. It is the SAME
 * popover the topbar's global Time Filter shows; a widget's own override and a group's
 * override open it too, so a range can never exist in one picker and not another, or
 * resolve to a different window depending on where it was chosen. `QUICK` and
 * `windowFor()` come from data/timeRanges.js, which stays the single source.
 *
 * This used to be copy-pasted markup: TimeFilter had it, WidgetCard had its own `df-pop`
 * clone, and the group-level filter would have made three. The escape row at the bottom
 * ("Follow dashboard filter" / "Follow group filter") is the only part that differs by
 * caller, so it comes in as a label rather than being branched on in here.
 *
 * Teleported to <body> and positioned in viewport coordinates, because every one of its
 * anchors sits inside something with `overflow: hidden`.
 */
import { ref, computed, onMounted } from 'vue'
import Icon from '../ui/Icon.vue'
import { QUICK } from '../../data/timeRanges.js'

const props = defineProps({
  // the range currently in force, so the matching quick row can be ticked
  value: { type: String, default: null },
  /* The trigger's position, as a PLAIN {top,left,bottom,right} — never a live DOMRect.
   * A DOMRect handed to a ref gets wrapped in a reactive Proxy, and its properties are
   * prototype getters that require a real DOMRect as `this`; read back through the proxy
   * they are an illegal invocation. Callers pass `rectOf(el)` below. */
  rect: { type: Object, required: true },
  // the way back out of an override; omitted (null) when there is nothing to fall back to
  followLabel: { type: String, default: null },
  // one line explaining what this range applies to, shown above the panes
  note: { type: String, default: '' },
})
const emit = defineEmits(['pick', 'clear', 'close'])

const W = 496
const pos = computed(() => ({
  top: props.rect.bottom + 6,
  left: Math.max(8, Math.min(props.rect.left, window.innerWidth - W - 8)),
}))

const search = ref('')
const quick = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? QUICK.filter((x) => x.label.toLowerCase().includes(q)) : QUICK
})

const from = ref('')
const to = ref('')
const fromEl = ref(null)
const toEl = ref(null)
const err = ref('')
function openPicker(el) { try { el?.showPicker?.() } catch (e) { el?.focus() } }
function applyAbs() {
  if (!from.value || !to.value) { err.value = 'Pick both a From and a To date'; return }
  if (new Date(from.value) > new Date(to.value)) { err.value = 'From has to come before To'; return }
  const fmt = (s) => { const [Y, M, D] = s.split('T')[0].split('-'); return `${D}/${M}/${Y.slice(2)}` }
  emit('pick', `${fmt(from.value)} – ${fmt(to.value)}`)
}
const searchEl = ref(null)
onMounted(() => searchEl.value?.focus())
</script>

<template>
  <teleport to="body">
    <div class="backdrop" @click="emit('close')" />
    <transition name="pop" appear>
      <div class="trp" :style="{ top: pos.top + 'px', left: pos.left + 'px' }" @click.stop>
        <p v-if="note" class="trp-note">{{ note }}</p>
        <div class="trp-panes">
          <div class="abs">
            <div class="lbl">Absolute time range</div>
            <div class="field-block">
              <label>From</label>
              <div class="dt">
                <input ref="fromEl" class="input" type="datetime-local" v-model="from" @change="err = ''" />
                <button class="cal" @click="openPicker(fromEl)" title="Pick date"><Icon name="calendar" :size="15" /></button>
              </div>
            </div>
            <div class="field-block">
              <label>To</label>
              <div class="dt">
                <input ref="toEl" class="input" type="datetime-local" v-model="to" @change="err = ''" />
                <button class="cal" @click="openPicker(toEl)" title="Pick date"><Icon name="calendar" :size="15" /></button>
              </div>
            </div>
            <!-- the reason a click did nothing, next to the fields that caused it, rather
                 than in a toast at the other end of the screen -->
            <p v-if="err" class="trp-err"><Icon name="alert" :size="13" /> {{ err }}</p>
            <button class="btn btn-primary apply" @click="applyAbs"><Icon name="check" :size="15" /> Apply time range</button>
            <button v-if="followLabel" class="follow" @click="emit('clear')"><Icon name="x" :size="13" /> {{ followLabel }}</button>
          </div>
          <div class="quick">
            <div class="qsearch"><Icon name="search" :size="14" class="muted" /><input ref="searchEl" v-model="search" placeholder="Search quick ranges" /></div>
            <div class="qlist">
              <button v-for="q in quick" :key="q.k" class="qitem" :class="{ on: value === q.label }" @click="emit('pick', q.label)">
                {{ q.label }} <Icon v-if="value === q.label" name="check" :size="14" />
              </button>
              <div v-if="!quick.length" class="qnone">No matching ranges</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 160; }
.trp {
  position: fixed; z-index: 161; width: 496px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  box-shadow: var(--sh-pop); overflow: hidden;
}
/* what this range will apply to, stated before the controls that set it */
.trp-note { margin: 0; padding: 10px 14px; font-size: 12px; line-height: 1.45; color: var(--df-ink); background: var(--df-soft); border-bottom: 1px solid var(--df-line); }
.trp-panes { display: grid; grid-template-columns: 264px 232px; }
.abs { padding: 16px; border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.lbl { font-weight: 600; font-size: 13px; margin-bottom: 12px; }
.field-block { display: flex; flex-direction: column; margin-bottom: 12px; }
.field-block label { font-size: 12px; font-weight: 500; color: var(--ink-2); margin-bottom: 5px; }
.dt { position: relative; }
.dt .input { height: 36px; font-size: 13px; padding-right: 36px; width: 100%; }
.dt .input::-webkit-calendar-picker-indicator { opacity: 0; }
.cal { position: absolute; right: 4px; top: 4px; width: 28px; height: 28px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.cal:hover { background: var(--surface-2); color: var(--ink); }
.trp-err { display: flex; align-items: center; gap: 6px; margin: -4px 0 10px; font-size: 12px; color: var(--red); }
.apply { width: 100%; margin-top: 4px; }
.follow { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 8px; padding: 7px; border: none; background: transparent; color: var(--muted); border-radius: 4px; font-size: 12px; }
.follow:hover { background: var(--surface-2); color: var(--ink); }
.quick { padding: 12px 10px; display: flex; flex-direction: column; min-height: 0; }
.qsearch { display: flex; align-items: center; gap: 7px; border: 1px solid var(--border-strong); border-radius: 4px; padding: 0 9px; height: 36px; margin-bottom: 8px; }
.qsearch input { border: none; outline: none; background: transparent; width: 100%; font-size: 13px; }
.qlist { display: flex; flex-direction: column; gap: 1px; overflow: auto; max-height: 300px; }
.qitem { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: none; background: transparent; border-radius: 4px; font-size: 13px; color: var(--ink-2); text-align: left; }
.qitem:hover { background: var(--surface-2); }
.qitem.on { background: var(--primary-soft); color: var(--primary-700); font-weight: 600; }
.qnone { padding: 14px 10px; color: var(--muted-2); font-size: 12px; }
</style>
