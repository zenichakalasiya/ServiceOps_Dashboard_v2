<script setup>
/**
 * GroupEditDrawer — a group's properties, one per row.
 *
 * Edits apply to the group LIVE, so the header on the board changes as you choose — the
 * drawer is narrow and the board beside it is the preview. Nothing is final until Save:
 * the X, Cancel, Escape and a click on the scrim all put back the snapshot taken when the
 * drawer opened. Reset returns every field to its default but, like the Layout drawer's
 * Reset, is itself part of the draft — Cancel undoes it too.
 *
 * Every control is one the rest of the product already uses (our input, ColorPicker,
 * Dropdown and pill rows), so a group is configured the way a widget is.
 */
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import Dropdown from '../ui/Dropdown.vue'
import ColorPicker from '../ui/ColorPicker.vue'
import Hint from '../ui/Hint.vue'
import { GRP_BGS, GRP_SIZES, GRP_DEFAULTS, grpStyleOf } from '../../data/groups.js'
import { QUICK } from '../../data/timeRanges.js'
import { toast } from '../../store/index.js'

const props = defineProps({ group: { type: Object, required: true } })
const emit = defineEmits(['close'])

// the group carries its style on `style`; give an older group one to write into
if (!props.group.style) props.group.style = { ...GRP_DEFAULTS }
else Object.assign(props.group.style, grpStyleOf(props.group))
const st = props.group.style

const snap = { name: props.group.name, style: { ...st }, dateFilter: props.group.dateFilter ?? null }
const SIZE_OPTS = GRP_SIZES.map((s) => ({ value: s.id, label: s.id }))
/* The group's date filter is CONFIGURATION, as a widget's is: set here, and only then
   does the header show its calendar. '' = follow the dashboard filter. The QUICK list
   is the one every picker reads; a custom range set from the header's picker is kept
   as an option so opening the drawer never silently drops it. */
const DATE_OPTS = computed(() => {
  const opts = [{ value: '', label: 'Dashboard filter' }, ...QUICK.map((q) => ({ value: q.label, label: q.label }))]
  const cur = props.group.dateFilter
  if (cur && !opts.some((o) => o.value === cur)) opts.push({ value: cur, label: cur })
  return opts
})
const dateModel = computed({
  get: () => props.group.dateFilter || '',
  set: (v) => { props.group.dateFilter = v || null },
})
const ALIGN = [
  { v: 'left', icon: 'align-left', tip: 'Align title left' },
  { v: 'center', icon: 'align-center', tip: 'Centre the title' },
]
const ui = reactive({ nameErr: '' })

function reset() { Object.assign(st, GRP_DEFAULTS); props.group.dateFilter = null }
function cancel() {
  props.group.name = snap.name
  props.group.dateFilter = snap.dateFilter
  Object.assign(st, snap.style)
  emit('close')
}
function save() {
  const n = (props.group.name || '').trim()
  if (!n) { ui.nameErr = 'A group needs a title'; return }
  props.group.name = n
  toast(`Group “${n}” saved`, 'success')
  emit('close')
}
const onKey = (e) => { if (e.key === 'Escape') cancel() }
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <teleport to="body">
    <div class="ge-overlay" @click.self="cancel">
      <aside class="ge" role="dialog" aria-label="Edit group">
        <header class="ge-head">
          <h3>Edit group</h3>
          <button class="dlg-x" title="Close" @click="cancel"><Icon name="x" :size="18" /></button>
        </header>

        <div class="ge-body">
          <div class="fld">
            <label>Group title <i class="req">*</i></label>
            <input
              v-model="group.name" class="ge-in" :class="{ err: ui.nameErr }" maxlength="60"
              placeholder="Name this group" @input="ui.nameErr = ''" @keyup.enter="save"
            />
            <p v-if="ui.nameErr" class="ge-err">{{ ui.nameErr }}</p>
          </div>

          <div class="fld">
            <label>Date filter <Hint text="Every widget in this group reads this range instead of the dashboard filter — unless a widget set its own. When set, a calendar appears on the group header." /></label>
            <Dropdown v-model="dateModel" :options="DATE_OPTS" />
          </div>

          <div class="fld">
            <label>Header colour</label>
            <ColorPicker v-model="st.bg" :options="GRP_BGS" />
          </div>

          <div class="fld">
            <label>Title size</label>
            <Dropdown v-model="st.size" :options="SIZE_OPTS" />
          </div>

          <div class="fld">
            <label>Alignment</label>
            <div class="seg">
              <button
                v-for="a in ALIGN" :key="a.v" class="seg-b ge-ic" :class="{ on: st.align === a.v }"
                :title="a.tip" @click="st.align = a.v"
              ><Icon :name="a.icon" :size="15" /></button>
            </div>
          </div>

          <div class="fld">
            <label>Padding</label>
            <div class="seg">
              <button class="seg-b" :class="{ on: st.pad !== false }" @click="st.pad = true">On</button>
              <button class="seg-b" :class="{ on: st.pad === false }" @click="st.pad = false">None</button>
            </div>
          </div>

          <div class="fld">
            <label>Share group <Hint text="Public groups are visible to everyone who can see this dashboard. A private group is visible only to you." /></label>
            <div class="seg">
              <button class="seg-b" :class="{ on: st.share !== 'private' }" @click="st.share = 'public'"><Icon name="globe" :size="14" /> Public</button>
              <button class="seg-b" :class="{ on: st.share === 'private' }" @click="st.share = 'private'"><Icon name="lock" :size="14" /> Private</button>
            </div>
          </div>
        </div>

        <footer class="ge-foot">
          <button class="ge-reset" @click="reset"><Icon name="reset" :size="14" /> Reset</button>
          <span class="grow" />
          <button class="btn" @click="cancel">Cancel</button>
          <button class="btn btn-primary" @click="save">Save</button>
        </footer>
      </aside>
    </div>
  </teleport>
</template>

<style scoped>
/* A light scrim, not the heavy one a modal uses — the group being edited has to stay
   readable behind it, because it is the preview. */
.ge-overlay { position: fixed; inset: 0; z-index: 110; background: rgba(20,21,38,.18); display: flex; justify-content: flex-end; }
.ge { width: 400px; max-width: 94vw; height: 100%; background: var(--surface); box-shadow: var(--sh-lg); display: flex; flex-direction: column; animation: geIn .2s cubic-bezier(.2,.8,.2,1); }
@keyframes geIn { from { transform: translateX(24px); opacity: .5; } to { transform: none; opacity: 1; } }
.ge-head { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); }
.ge-head h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--ink); }
/* one field per row, 16px apart */
.ge-body { flex: 1; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.fld { display: flex; flex-direction: column; gap: 6px; margin: 0; }
.fld > label { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--ink-2); }
.req { color: var(--red); font-style: normal; }
.ge-in { height: 36px; padding: 0 12px; border: 1px solid var(--border-strong); border-radius: var(--r); background: var(--surface); color: var(--ink); font-size: 13px; outline: none; }
.ge-in:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.ge-in.err { border-color: var(--red); }
.ge-err { margin: 0; font-size: 12px; color: var(--red); }
.seg { align-self: flex-start; }
.seg-b.ge-ic { width: 32px; height: 32px; padding: 0; display: grid; place-items: center; }
.seg-b :deep(.ico) { display: inline-block; vertical-align: -2px; margin-right: 2px; }
.ge-foot { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--border); }
.ge-reset { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 8px; border: none; background: transparent; color: var(--muted); border-radius: var(--r); font-size: 13px; }
.ge-reset:hover { color: var(--ink); background: var(--surface-2); }
.grow { flex: 1; }
</style>
