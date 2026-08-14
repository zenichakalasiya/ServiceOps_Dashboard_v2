<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../ui/Icon.vue'
import Dropdown from '../ui/Dropdown.vue'
import { store, createDashboard, addCategory } from '../../store/index.js'
import { ACCESS, uid } from '../../data/mock.js'
const router = useRouter()

// Clone / Edit when a source dashboard is set; otherwise Create.
const src = store.ui.cloneTarget || store.ui.editTarget
const isClone = computed(() => !!store.ui.cloneTarget)
const isEdit = computed(() => !!store.ui.editTarget)
/* Editing a PREDEFINED dashboard: its identity (name, description, visibility)
 * ships with the product and can't be changed. Cloning one is unrestricted —
 * the copy is yours — so this is scoped to edit, not clone. */
const lockedDash = computed(() => isEdit.value && !!store.ui.editTarget?.predefined)

// Clone naming: "{base} - copy N" — strip any existing "- copy N" suffix to find the
// base, then pick the lowest N not already used (so a 2nd copy becomes "- copy 2").
function cloneName(srcName) {
  const base = srcName.replace(/\s*-\s*copy\s*\d+$/i, '').trim()
  const taken = new Set(store.dashboards.map((d) => d.name.toLowerCase()))
  let n = 1
  while (taken.has(`${base} - copy ${n}`.toLowerCase())) n++
  return `${base} - copy ${n}`
}
const name = ref(store.ui.cloneTarget ? cloneName(src.name) : src ? src.name : '')
const access = ref(src?.access || 'public')
const category = ref(src?.category || '')
const description = ref(src?.description || '')
const techAccess = ref(src?.techAccess?.length ? [...src.techAccess] : [store.currentUser])
const groupAccess = ref((src?.groupAccess && src.groupAccess[0]) || '')
const defaultLanding = ref(src?.default || false)
const layoutLock = ref(src?.layoutLock === true)
const err = ref('')

/* "Default landing" is a personal preference again: turning it on makes this board the
 * one YOU land on. The "Only for me / For specific users" choice that used to follow the
 * switch is gone — re-pointing a colleague's home screen is an administrative act that
 * does not belong inside dashboard settings. */

/* Dashboard names must be unique. The board being edited is excluded by id, so it
 * can't collide with itself; archived boards still count, because restoring one
 * would then produce two dashboards with the same name. */
const nameTaken = computed(() => {
  const n = name.value.trim().toLowerCase()
  if (!n || lockedDash.value) return false
  const selfId = store.ui.editTarget?.id
  return store.dashboards.some((d) => d.id !== selfId && d.name.trim().toLowerCase() === n)
})
const canSave = computed(() => lockedDash.value || (!!name.value.trim() && !nameTaken.value))


const ACC_DESC = {
  public: 'Everyone with portal access can open this dashboard.',
  private: 'Only you can open and manage this dashboard.',
  restricted: 'Only the technicians / groups you pick below can open it.',
}
// the empty option reads as the prompt ("Select Category"), not as a category called None
const catOptions = computed(() => [{ value: '', label: 'Select Category' }, ...store.categories.map((c) => ({ value: c, label: c }))])
const groupOptions = ['Service Desk', 'Network Team', 'NOC Viewers']

// Category → Add New popover
const catAdd = ref(false)
const newCat = ref('')
function saveCat() {
  const n = addCategory(newCat.value)
  if (n) category.value = n
  newCat.value = ''; catAdd.value = false
}


function close() { store.ui.createOpen = false; store.ui.cloneTarget = null; store.ui.editTarget = null }
function submit(openAdd = false) {
  if (!lockedDash.value && !name.value.trim()) { err.value = 'Give your dashboard a name.'; return }
  if (nameTaken.value) return   // the field already says why; never save a duplicate
  const ta = access.value === 'restricted' ? techAccess.value : undefined
  const ga = access.value === 'restricted' && groupAccess.value ? [groupAccess.value] : undefined
  // ---- edit in place ----
  if (isEdit.value) {
    Object.assign(src, {
      // a predefined board keeps its identity — writing these back would blank the
      // very fields we just removed from the form
      ...(lockedDash.value ? {} : {
        name: name.value.trim(), access: access.value, description: description.value,
        ...(ta ? { techAccess: ta } : {}), ...(ga ? { groupAccess: ga } : {}),
      }),
      category: category.value,
      layoutLock: layoutLock.value,
      updated: new Date().toISOString(),
    })
    // the default landing board is a single global flag — setting one clears the rest
    if (defaultLanding.value) { store.dashboards.forEach((x) => (x.default = false)); src.default = true }
    else src.default = false
    close()
    return
  }
  // ---- create / clone ----
  const opts = {
    name: name.value, access: access.value, category: category.value, description: description.value,
    techAccess: ta, groupAccess: ga,
    makeDefault: defaultLanding.value,
    layoutLock: layoutLock.value,
  }
  if (isClone.value) opts.tiles = src.tiles.map((t) => ({ ...JSON.parse(JSON.stringify(t)), id: uid('t') }))
  const d = createDashboard(opts)
  // a brand-new (non-clone) board lands empty → auto-open the Add-Widget drawer
  if (!isClone.value) store.ui.pendingAddWidget = true
  close()
  router.push(`/dashboard/${d.id}`)
}
</script>

<template>
  <div class="drawer-overlay" @click.self="close">
    <div class="drawer">
      <div class="head">
        <div>
          <h3>{{ isEdit ? 'Edit Dashboard' : isClone ? 'Clone Dashboard' : 'Create Dashboard' }}</h3>
          <p v-if="isEdit || isClone" class="muted">{{ isEdit ? 'Update this dashboard’s details.' : 'Duplicate this board with its widgets, then tweak it.' }}</p>
        </div>
        <button class="x-btn" @click="close"><Icon name="x" :size="16" /></button>
      </div>

      <div class="body">
        <!-- A predefined board's identity ships with the product. These fields used to be
             REMOVED, which answered "can I change this?" by also hiding what it currently
             says — you couldn't read the board's own name from its settings. They are
             shown disabled instead: the value is legible, and the control being dead is
             what tells you it is fixed. -->
        <p v-if="lockedDash" class="pd-note">
          <Icon name="verified" :size="14" />
          <span>This is a <b>predefined dashboard</b> — its <b>Name</b>, <b>Description</b> and <b>Visibility &amp; Sharing</b> ship with the product and are shown here read-only. You can still change its Category and the widgets on it.</span>
        </p>

        <div class="sec-h">Basics</div>

        <div class="grp">
          <label class="field">Name <span v-if="!lockedDash" class="req">*</span></label>
          <input class="input" :class="{ bad: nameTaken }" v-model="name" placeholder="Name" :disabled="lockedDash" :autofocus="!lockedDash" @input="err = ''" />
          <p v-if="nameTaken" class="dup-err">
            <Icon name="alert" :size="13" />
            <span>A dashboard named “{{ name.trim() }}” already exists. <b>Dashboard names must be unique</b> — pick another.</span>
          </p>
          <div v-else-if="err" class="err">{{ err }}</div>
        </div>

        <div class="grp">
          <label class="field">Description <span v-if="!lockedDash" class="req">*</span></label>
          <textarea class="input" rows="3" v-model="description" placeholder="Description" :disabled="lockedDash" />
        </div>

        <!-- Category + Add New -->
        <div class="grp">
          <label class="field">Category</label>
          <div class="cat-row">
            <Dropdown v-model="category" :options="catOptions" placeholder="Select Category" />
            <button class="btn cat-new" @click="catAdd = !catAdd">New Category <Icon name="plus" :size="15" /></button>
            <transition name="pop">
              <div v-if="catAdd" class="cat-pop card" @click.stop>
                <label class="field">Category Name <span class="req">*</span></label>
                <input class="input" v-model="newCat" placeholder="e.g. Security" @keyup.enter="saveCat" autofocus />
                <div class="cat-pop-btns">
                  <button class="btn btn-sm" @click="catAdd = false; newCat = ''">Cancel</button>
                  <button class="btn btn-sm btn-primary" :disabled="!newCat.trim()" @click="saveCat">Save</button>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Access + one-liner -->
        <div class="sec-h">Visibility &amp; sharing</div>
        <div class="grp">
          <label class="field">Dashboard Access Level <span v-if="!lockedDash" class="req">*</span></label>
          <div class="seg" :class="{ ro: lockedDash }">
            <button v-for="(a, k) in ACCESS" :key="k" class="seg-btn" :class="{ on: access === k }" :disabled="lockedDash" @click="access = k">{{ a.label }}</button>
          </div>
          <p class="oneliner"><Icon name="info" :size="14" /> {{ ACC_DESC[access] }}</p>
        </div>

        <!-- Restricted targeting — belongs to Visibility, so it goes when Visibility does -->
        <div v-if="!lockedDash && access === 'restricted'" class="two">
          <div class="grp">
            <label class="field">Technician Access Level <span class="req">*</span></label>
            <Dropdown v-model="techAccess" :options="store.owners" :multiple="true" placeholder="Select technicians" />
          </div>
          <div class="grp">
            <label class="field">Technician Group Access Level <span class="req">*</span></label>
            <Dropdown v-model="groupAccess" :options="groupOptions" placeholder="Select" />
          </div>
        </div>

        <!-- Default landing -->
        <div class="grp toggle-grp">
          <div class="tg-text">
            <label class="field" style="margin:0">Default landing dashboard</label>
            <span class="oneliner plain">When set as default, this dashboard opens first on sign-in.</span>
          </div>
          <button class="sw" :class="{ on: defaultLanding }" @click="defaultLanding = !defaultLanding"><i /><b>{{ defaultLanding ? 'ON' : 'OFF' }}</b></button>
        </div>

        <!-- Layout Lock — freezes position AND size for everyone viewing the board -->
        <div class="grp toggle-grp">
          <div class="tg-text">
            <label class="field" style="margin:0">Layout Lock</label>
            <span class="oneliner plain">A per-dashboard lock that freezes every widget’s position and size, so viewing, presenting, or screen-sharing a board can never accidentally rearrange it.</span>
          </div>
          <button class="sw" :class="{ on: layoutLock }" @click="layoutLock = !layoutLock"><i /><b>{{ layoutLock ? 'ON' : 'OFF' }}</b></button>
        </div>

      </div>

      <div class="foot">
        <button class="btn btn-primary" :disabled="!canSave" :title="nameTaken ? 'That name is already taken — dashboard names must be unique' : ''" @click="submit(false)">
          <Icon :name="isEdit ? 'check' : isClone ? 'copy' : 'plus'" :size="16" /> {{ isEdit ? 'Save changes' : isClone ? 'Clone Dashboard' : 'Create' }}
        </button>
        <button class="btn" @click="close">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* A right-edge drawer, matching Add New Widget and every other side panel in the module.
   This was briefly a centered modal and it made Create Dashboard the only overlay in the
   product that arrived from somewhere else — a panel whose position tells you which panel
   it is, is a panel you have to re-learn. The redesigned contents are unchanged; only the
   placement went back. */
.drawer-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.42); backdrop-filter: blur(2px); z-index: 100; display: flex; justify-content: flex-end; }
.drawer { width: 620px; max-width: 96vw; height: 100%; background: var(--surface); box-shadow: var(--sh-lg); display: flex; flex-direction: column; overflow: hidden; animation: slideIn .22s cubic-bezier(.2,.8,.2,1); }
@keyframes slideIn { from { transform: translateX(30px); opacity: .4; } to { transform: none; opacity: 1; } }
.head { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 22px 12px; }
.head h3 { margin: 0; font-size: 18px; }
.head p { margin: 3px 0 0; font-size: 13px; }
/* close sits in its own soft square, as the design has it */
.x-btn { width: 30px; height: 30px; flex: none; border: 1px solid var(--border); background: var(--surface-2); color: var(--ink-2); border-radius: 4px; display: grid; place-items: center; }
.x-btn:hover { background: var(--border); color: var(--ink); }
.body { flex: 1; padding: 6px 22px 20px; display: flex; flex-direction: column; gap: 16px; overflow: auto; }
/* section headings — Basics / Visibility & sharing / Layout, as the design groups them.
   The first one loses its top margin so it doesn't push away from the drawer header. */
/* The .body already owns the vertical rhythm (gap: 16px). A heading carrying its own
   22px top and -2px bottom margin fought that gap, so a section title sat 38px below
   what preceded it and 14px above what followed — the spacing changed depending on
   which block you were between. It now adds ONE deliberate step (8px, so 24px above a
   heading) and nothing below, leaving the container to space everything else evenly. */
.sec-h { font-size: 14px; font-weight: 600; color: var(--ink); margin: 8px 0 0; }
.sec-h:first-of-type { margin-top: 2px; }
.grp { display: flex; flex-direction: column; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.req { color: var(--red); }
.err { color: var(--red); font-size: 12px; margin-top: 5px; }
/* Duplicate name reads as a WARNING, not an error — amber, not red. */
.dup-err { display: flex; align-items: flex-start; gap: 7px; margin: 6px 0 0; padding: 8px 10px; font-size: 12px; line-height: 1.45; color: var(--amber); background: var(--amber-soft); border-radius: 4px; }
.dup-err :deep(.ico) { flex: none; margin-top: 1px; }
.dup-err b { font-weight: 600; color: var(--amber); }
.input.bad { border-color: var(--amber); }
.sec-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
/* the predefined info note is the first thing in the panel; it should not also carry
   the heading step on top of the container gap */
.pd-note + .sec-h { margin-top: 0; }
/* one segmented control on a soft track, active segment filled solid — the same control
   the Manage tabs use, so "which of these three is in force" reads identically everywhere */
.seg { display: inline-flex; gap: 2px; padding: 4px; background: var(--surface-2); border-radius: 4px; align-self: flex-start; }
.seg-btn { display: flex; align-items: center; justify-content: center; height: 32px; padding: 0 22px; border-radius: 4px; border: none; background: transparent; color: var(--ink-2); font-weight: 500; font-size: 13px; }
.seg-btn:hover { color: var(--ink); }
.seg-btn.on { background: var(--ink); color: #fff; font-weight: 600; box-shadow: var(--sh-sm); }
/* Read-only (a predefined board's identity). The value STAYS legible — the point is to
   show what the board is, not to grey it into unreadability — so only the affordance is
   removed: no hover, no pointer, and a quieter fill on the selected segment. */
.seg.ro { opacity: 1; }
.seg.ro .seg-btn { cursor: default; color: var(--muted); }
.seg.ro .seg-btn:hover { color: var(--muted); }
.seg.ro .seg-btn.on { background: var(--border-strong); color: var(--ink); box-shadow: none; }
.input:disabled, textarea.input:disabled {
  background: var(--surface-2); color: var(--ink-2); cursor: default;
  border-color: var(--border); -webkit-text-fill-color: var(--ink-2); opacity: 1;
}
/* the access one-liner sits in its own soft box, not as loose grey text under the control */
.oneliner { display: flex; align-items: center; gap: 8px; margin: 10px 0 0; padding: 9px 11px; background: var(--surface-2); border-radius: 4px; font-size: 13px; color: var(--ink-2); }
.oneliner :deep(.ico) { color: var(--muted); flex: none; }
/* predefined-dashboard note — same treatment as the predefined-widget line in the builder */
.pd-note { display: flex; align-items: flex-start; gap: 8px; margin: 0; font-size: 13px; line-height: 1.5; color: var(--primary-700); background: var(--primary-softer); border: 1px solid var(--primary-soft); border-radius: 4px; padding: 10px 12px; }
.pd-note :deep(.ico) { flex: none; margin-top: 1px; }
/* `.plain` is the toggle's own description — loose grey text, no box, since it explains a
   switch rather than reporting the consequence of a choice */
.oneliner.plain { display: block; margin: 3px 0 0; padding: 0; background: none; border-radius: 0; font-size: 12px; line-height: 1.5; color: var(--muted); }
/* category + add new */
.cat-row { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start; }
.cat-new { height: 36px; white-space: nowrap; color: var(--primary-700); border-color: var(--border-strong); }
.cat-new:hover { background: var(--primary-softer); border-color: transparent; }
.cat-pop { position: absolute; top: 46px; right: 0; z-index: 30; width: 280px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.cat-pop-btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
/* default landing toggle */
.toggle-grp { flex-direction: row; align-items: center; justify-content: space-between; gap: 14px; }
/* the toggle rows are section-level settings, so their titles read at section weight
   rather than field-label size */
.toggle-grp .field { font-size: 14px; font-weight: 600; color: var(--ink); }
.tg-text { display: flex; flex-direction: column; }
/* an ON/OFF pill, not a bare switch: at a glance a plain track tells you there are two
   states but not which one you are looking at, and these two toggles both change what
   other people see. The word removes the guess. */
.sw { width: 58px; height: 24px; border-radius: 999px; border: 1px solid var(--border-strong); background: var(--surface-2); position: relative; transition: background .15s, border-color .15s; flex: none; }
.sw i { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--muted-2); transition: left .15s, background .15s; box-shadow: var(--sh-sm); }
.sw b { position: absolute; top: 0; right: 8px; line-height: 22px; font-size: 10px; font-weight: 700; letter-spacing: .4px; color: var(--muted); transition: color .15s; }
.sw.on { background: var(--green-soft); border-color: color-mix(in srgb, var(--green) 40%, transparent); }
.sw.on i { left: 38px; background: var(--green); }
.sw.on b { right: auto; left: 9px; color: var(--green); }
/* layout controls */
/* live preview */
/* ---- Default landing scope: who does this become the home screen for? ---- */

.foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid var(--border); background: var(--surface); }
/* the primary is the design's near-black, not the product blue — inside a modal whose
   only other blue is the access segment, a blue CTA competed with it */
.foot .btn-primary { background: var(--ink); border-color: var(--ink); }
.foot .btn-primary:hover:not(:disabled) { background: #26313f; border-color: #26313f; }
</style>
