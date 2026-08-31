<script setup>
/**
 * ExportDialog — anchored under the Export button in the board header.
 *
 * Replaces the old Download popover *and* the "Export dashboard as a PDF" half of the
 * share popover. Exporting a board has exactly three destinations, and they differ only
 * in where the file ends up:
 *   Image        → a PNG of the board, downloaded
 *   PDF          → the same board as a PDF, downloaded
 *   Email as PDF → that same PDF, delivered instead of downloaded
 *
 * Email is a destination, not a separate feature, so it is a third segment rather than
 * a second dialog — the password option is shared by both PDF routes, and stating it
 * once is what keeps the two from drifting apart.
 */
import { ref, computed, nextTick } from 'vue'
import Icon from '../ui/Icon.vue'
import { toast } from '../../store/index.js'
const props = defineProps({ d: Object })
const emit = defineEmits(['close'])

/* Two levels, not three flat segments. The three destinations were never siblings:
 * Image and PDF both put a file on your disk, Email puts it in someone's inbox. The
 * top level is therefore WHERE it goes (Download | Export) and the format switcher
 * lives inside Download, where it is the only remaining question. It also stops the
 * longest label — "Email as PDF" — from setting the width of the whole control. */
const MODES = [
  { id: 'download', label: 'Download' },
  { id: 'export', label: 'Export' },
]
const DL_FORMATS = [
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'pdf', label: 'PDF', icon: 'file-text' },
]
const mode = ref('download')
const dlFmt = ref('pdf')
const isEmail = computed(() => mode.value === 'export')
// an image has no container to encrypt, so protection only exists on the PDF routes
const isPdf = computed(() => isEmail.value || dlFmt.value === 'pdf')

const pwd = ref(false)
const password = ref('')
const showPwd = ref(false)

/* Recipients, added one at a time: committing an address turns it into a row and brings
 * the [+] back, so an empty input never sits on screen pretending to be a required field. */
const emails = ref([])
const newEmail = ref('')
const adding = ref(false)
const emailEl = ref(null)
const emailValid = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.value.trim()))
function startEmail() { adding.value = true; nextTick(() => emailEl.value?.focus()) }
function cancelEmail() { adding.value = false; newEmail.value = '' }
function addEmail() {
  if (!emailValid.value) return
  emails.value.push(newEmail.value.trim())
  newEmail.value = ''
  adding.value = false
}
function removeEmail(i) { emails.value.splice(i, 1) }

function run() {
  // asking for protection and leaving it blank would produce an unprotected file
  if (pwd.value && isPdf.value && !password.value.trim()) { toast('Set an attachment password, or turn the protection off', 'warn'); return }
  const prot = pwd.value && isPdf.value ? ' — password protected' : ''
  if (isEmail.value) {
    if (!emails.value.length) { toast('Add at least one email address', 'warn'); return }
    toast(`“${props.d.name}” sent as PDF to ${emails.value.length} recipient${emails.value.length > 1 ? 's' : ''}${prot}`, 'success')
  } else {
    toast(`Exporting “${props.d.name}” as ${dlFmt.value === 'pdf' ? 'PDF' : 'an image'}${prot}`, 'success')
  }
  emit('close')
}
</script>

<template>
  <div class="pv-back" @click="emit('close')" />
  <div class="pv card" @click.stop>
    <header class="pv-head"><span class="pv-title">Export dashboard</span></header>

    <!-- §10.1 content tabs: underline, transparent 2px border when inactive so nothing
         shifts on selection. The same tab pattern the detail pages use. -->
    <div class="ctabs" role="tablist">
      <button
        v-for="m in MODES" :key="m.id" class="ctab" :class="{ on: mode === m.id }"
        role="tab" :aria-selected="mode === m.id" @click="mode = m.id"
      >{{ m.label }}</button>
    </div>

    <!-- Download: the only question left is which file -->
    <template v-if="!isEmail">
      <div class="seg">
        <button
          v-for="f in DL_FORMATS" :key="f.id" class="seg-b" :class="{ on: dlFmt === f.id }"
          @click="dlFmt = f.id"
        ><Icon :name="f.icon" :size="15" /> {{ f.label }}</button>
      </div>
    </template>

    <!-- Export: one destination, named in full so the tab label can stay short -->
    <template v-if="isEmail">
      <div class="sec-h">Export (Email as a PDF)</div>
      <label class="fl">Add Email <i>*</i></label>
      <div class="emails">
        <div v-for="(e, i) in emails" :key="i" class="erow">
          <span class="eaddr">{{ e }}</span>
          <button class="ex" title="Remove" @click="removeEmail(i)"><Icon name="x" :size="13" /></button>
        </div>
        <div v-if="adding" class="erow">
          <input ref="emailEl" class="input" v-model="newEmail" placeholder="name@company.com" @keyup.enter="addEmail" @keyup.esc="cancelEmail" />
          <button class="ex" title="Cancel" @click="cancelEmail"><Icon name="x" :size="13" /></button>
        </div>
        <button v-else class="add-btn" title="Add an email address" @click="startEmail"><Icon name="plus" :size="16" /></button>
      </div>
    </template>

    <label v-if="isPdf" class="tgl-row">
      <span class="tgl-txt">
        <b>Password Protected</b>
        <em>The PDF is encrypted, and anyone opening it needs this password.</em>
      </span>
      <button class="tgl" :class="{ on: pwd }" role="switch" :aria-checked="pwd" @click.prevent="pwd = !pwd"><i /></button>
    </label>

    <template v-if="pwd && isPdf">
      <label class="fl">Attachment Password <i>*</i></label>
      <div class="pw">
        <input class="input" :type="showPwd ? 'text' : 'password'" v-model="password" placeholder="Password" />
        <button class="eye" :title="showPwd ? 'Hide' : 'Show'" @click="showPwd = !showPwd"><Icon name="eye" :size="15" /></button>
      </div>
    </template>

    <footer class="pv-foot">
      <button class="btn" @click="emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="run">
        <Icon :name="isEmail ? 'mail' : 'download'" :size="15" /> {{ isEmail ? 'Send PDF' : 'Export' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.pv-back { position: fixed; inset: 0; z-index: 55; }
/* anchored directly under the Export button, right-aligned to it */
/* 420, not 380: at 380 the recipient rows and the password field crowded their own
   labels, and the footer's two buttons sat tight against the edges. */
.pv { position: absolute; top: 44px; right: 0; z-index: 60; width: 420px; padding: 14px 16px 12px; }
.pv-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pv-title { font-weight: 700; font-size: 15px; color: var(--ink); }

/* §10.1 content tabs (underline) — the detail-page pattern */
.ctabs { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); margin: 12px 0 14px; }
.ctab { border: none; border-bottom: 2px solid transparent; background: transparent; padding: 0 8px 10px; font-size: 14px; font-weight: 500; color: var(--muted); }
.ctab:hover { color: var(--ink); border-bottom-color: var(--border-strong); }
.ctab.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }

/* the format switcher inside Download — §10.2 segmented toggle */
.seg-b:not(.on):hover { color: var(--ink); }

/* the destination, spelled out where the short tab label could not */
.sec-h { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 12px; }

.fl { display: block; font-size: 12px; font-weight: 500; color: var(--ink-2); margin: 14px 0 6px; }
.fl i { color: var(--red); font-style: normal; }

/* one address per row, with the [+] as the only affordance when nothing is being typed */
.emails { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.erow { display: flex; align-items: center; gap: 6px; width: 100%; }
.erow .input { flex: 1; min-width: 0; }
.eaddr { flex: 1; min-width: 0; height: 36px; display: flex; align-items: center; padding: 0 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface-2); font-size: 13px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ex { flex: none; width: 28px; height: 28px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.ex:hover { background: var(--surface-2); color: var(--red); }
.add-btn { flex: none; width: 34px; height: 32px; border: 1px solid var(--border-strong); background: var(--surface); color: var(--primary-700); border-radius: 4px; display: grid; place-items: center; }
.add-btn:hover { background: var(--primary-soft); border-color: var(--primary); }

.tgl-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 14px; cursor: pointer; }
.tgl-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
/* same row, same reason — see WidgetBuilderModal. The two copies of this pattern have
   already drifted apart on weight (600 here, 500 there); they are at least not going to
   disagree about whether the label looks switched off. */
.tgl-txt b { font-size: 13px; font-weight: 600; color: var(--ink); }
.tgl-txt em { font-style: normal; font-size: 12px; color: var(--muted); line-height: 1.45; }
.tgl { flex: none; width: 38px; height: 22px; padding: 0; border: none; border-radius: 999px; background: var(--border-strong); position: relative; transition: background .15s; }
.tgl i { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: var(--sh-sm); transition: transform .15s; }
.tgl.on { background: var(--primary); }
.tgl.on i { transform: translateX(16px); }

.pw { position: relative; }
.pw .input { width: 100%; padding-right: 38px; }
.eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border: none; background: transparent; color: var(--muted); border-radius: 4px; display: grid; place-items: center; }
.eye:hover { background: var(--surface-2); color: var(--ink); }

.pv-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); }
</style>
