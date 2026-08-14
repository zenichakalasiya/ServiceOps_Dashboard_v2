<script setup>
/**
 * LayoutEntryDemo — the switcher for comparing the four ways into the global layout
 * settings. Same job as the grouping / legend / AI-entry demo bars, with one
 * difference: those live inside the board, and two of these entries are on the Manage
 * page and one is in the sidebar. So this floats at app level and follows you across
 * views — otherwise you would have to leave the entry you are judging to switch off it.
 *
 * Bottom-LEFT, because the FAB owns bottom-right.
 */
import { ref } from 'vue'
import Icon from '../ui/Icon.vue'
import { store } from '../../store/index.js'

const ENTRIES = [
  { id: 'tab', n: '1', label: 'Manage · tab', desc: 'An Appearance tab beside the listing tabs on Manage all dashboards.' },
  { id: 'toolbar', n: '2', label: 'Manage · icon', desc: 'An icon in the Manage page toolbar, beside New dashboard.' },
  { id: 'sidebar', n: '3', label: 'Sidebar icon', desc: 'An icon beside “Manage all dashboards” in the listing sidebar.' },
  { id: 'board', n: '4', label: 'Board drawer', desc: 'A control in the board header opening a live drawer over your real widgets.' },
]
const open = ref(true)
function pick(id) { store.ui.layoutEntry = id; store.ui.layoutOpen = false }
</script>

<template>
  <div class="led" :class="{ min: !open }">
    <button class="led-toggle" :title="open ? 'Hide the demo switcher' : 'Appearance entry demo'" @click="open = !open">
      <Icon name="appearance" :size="15" />
    </button>
    <template v-if="open">
      <span class="led-label">Appearance entry</span>
      <div class="led-seg">
        <button
          v-for="e in ENTRIES" :key="e.id" class="led-b" :class="{ on: store.ui.layoutEntry === e.id }"
          :title="e.desc" @click="pick(e.id)"
        ><span class="led-n">{{ e.n }}</span> {{ e.label }}</button>
      </div>
      <span class="led-desc">{{ ENTRIES.find((e) => e.id === store.ui.layoutEntry)?.desc }}</span>
    </template>
  </div>
</template>

<style scoped>
.led {
  position: fixed; left: 16px; bottom: 16px; z-index: 95;
  display: flex; align-items: center; gap: 10px; max-width: min(760px, calc(100vw - 140px));
  padding: 8px 12px; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-lg); box-shadow: var(--sh-pop);
}
.led.min { padding: 6px; gap: 0; }
.led-toggle { flex: none; width: 28px; height: 28px; display: grid; place-items: center; border: none; background: transparent; color: var(--muted); border-radius: var(--r); }
.led-toggle:hover { background: var(--surface-2); color: var(--ink); }
.led-label { flex: none; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.led-seg { display: flex; gap: 2px; padding: 2px; background: var(--surface-2); border-radius: var(--r); flex: none; }
.led-b { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border: none; background: transparent; color: var(--ink-2); border-radius: var(--r); font-size: 12px; font-weight: 500; white-space: nowrap; }
.led-b:hover { background: var(--surface); color: var(--ink); }
.led-b.on { background: var(--primary); color: #fff; }
.led-n { opacity: .7; font-variant-numeric: tabular-nums; }
.led-b.on .led-n { opacity: .85; }
.led-desc { font-size: 11px; color: var(--muted); line-height: 1.4; min-width: 0; }
</style>
