<script setup>
/**
 * RichTextEditor — the Free Text widget's text field (2026-09-30, to the user's screenshots).
 *
 * A BOTTOM bar is always there with what INSERTS something — image · link — and a "T"
 * that toggles the FORMATTING bar. That bar sits directly ABOVE the bottom bar (as the
 * reference stacks them) and also appears by itself the moment text is selected: block
 * style (Paragraph / Heading 1–3) · B I U · font size · alignment · bulleted / numbered
 * list · background colour · text colour. Its menus open UPWARD.
 * Deliberately NOT here (the user's call): table, divider, attach, emoji, undo/redo,
 * templates, knowledge, AI Assist.
 *
 * The text area is 300px tall and the corner handle (the same mark a widget's resize
 * handle wears) drags it taller.
 *
 * Built on contenteditable + execCommand, no dependency — ServiceOps ships on-prem, so an
 * editor library would be redistributed (the same reasoning as ECharts; see NoteEditor.vue
 * for the longer note). Whatever the browser emits, `sanitizeNote` allowlists it on render.
 *
 * Two rules that keep it usable:
 *  · never write innerHTML back while typing — only on an EXTERNAL change — or the caret
 *    jumps to the start on every keystroke;
 *  · toolbar buttons act on mousedown with preventDefault, so clicking one never steals the
 *    selection it is about to format. Popovers with an input (link, image) save the range
 *    and put it back before they insert.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Icon from '../ui/Icon.vue'
import ColorPanel from '../ui/ColorPanel.vue'
import { toNoteHtml, noteText, FT_COLORS, NOTE_HL } from '../../data/freeText.js'
import { toast } from '../../store/index.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Enter the text to display' },
  max: { type: Number, default: 600 },
})
const emit = defineEmits(['update:modelValue'])

const el = ref(null)
const root = ref(null)
const focused = ref(false)
const fmtOn = ref(false)          // the T toggle
const hasSel = ref(false)         // a non-empty selection inside the editor
const menu = ref(null)            // which dropdown / popover is open
const st = ref({})                // pressed states at the caret
const count = ref(0)
/* the text area's height — 300px by default (the user's "double it"), dragged taller from
   the corner handle, never shorter than the default */
const MIN_H = 300, MAX_H = 900
const bodyH = ref(MIN_H)
function startResize(e) {
  const y0 = e.clientY, h0 = bodyH.value
  const move = (ev) => { bodyH.value = Math.min(MAX_H, Math.max(MIN_H, h0 + ev.clientY - y0)) }
  const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); document.body.style.cursor = '' }
  document.body.style.cursor = 'ns-resize'
  addEventListener('mousemove', move); addEventListener('mouseup', up)
}

const BLOCKS = [
  { v: 'p', label: 'Paragraph' },
  { v: 'h1', label: 'Heading 1' },
  { v: 'h2', label: 'Heading 2' },
  { v: 'h3', label: 'Heading 3' },
]
const SIZES = [null, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]
const ALIGNS = [
  { v: 'Left', icon: 'align-left' },
  { v: 'Center', icon: 'align-center' },
  { v: 'Right', icon: 'align-right' },
  { v: 'Full', label: 'Justify', icon: 'align-justify' },
]
/* Text and background colour open ColorPanel (the user's screenshot): the named colours
   first — stored as theme tokens, so a red note stays red-for-this-theme — then Custom.
   The last colour chosen for each shows as the bar under its button. */
const COLORS = { fg: FT_COLORS, bg: NOTE_HL }
const colorSel = ref({ fg: 'Default', bg: 'Default' })
const colorBtn = ref({ fg: null, bg: null })
const barOf = (k) => { const v = colorSel.value[k], o = COLORS[k].find((x) => x.id === v); return o ? (o.css || 'var(--border-strong)') : v }

const showFmt = computed(() => fmtOn.value || hasSel.value || !!menu.value && menu.value !== 'link' && menu.value !== 'image')

/* ── the model ───────────────────────────────────────────────────────────────── */
function textLen() { return el.value ? noteText(el.value.innerHTML).replace(/\n/g, '').length : 0 }
function push() {
  if (!el.value) return
  count.value = textLen()
  emit('update:modelValue', el.value.innerHTML)
}
onMounted(() => {
  // markdown-lite from an older note becomes HTML once, on the way in
  el.value.innerHTML = toNoteHtml(props.modelValue)
  count.value = textLen()
  if (el.value.innerHTML !== props.modelValue) emit('update:modelValue', el.value.innerHTML)
  document.addEventListener('selectionchange', onSel)
  document.addEventListener('mousedown', onDocDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSel)
  document.removeEventListener('mousedown', onDocDown)
})
watch(() => props.modelValue, (v) => {
  // only an EXTERNAL change (Reset, a different widget) is written back
  if (el.value && v !== el.value.innerHTML) { el.value.innerHTML = toNoteHtml(v); count.value = textLen() }
})

/* ── selection + pressed states ──────────────────────────────────────────────── */
let saved = null
function inEditor(node) { return el.value && node && (node === el.value || el.value.contains(node)) }
function onSel() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !inEditor(sel.anchorNode)) return
  saved = sel.getRangeAt(0).cloneRange()
  hasSel.value = !sel.isCollapsed
  sync()
}
function restore() {
  el.value?.focus()
  if (!saved) return
  const sel = window.getSelection()
  sel.removeAllRanges(); sel.addRange(saved)
}
function sync() {
  const q = (c) => { try { return document.queryCommandState(c) } catch { return false } }
  let block = 'p'
  try { block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase() } catch { /* */ }
  const sel = window.getSelection()
  let node = sel?.anchorNode; if (node && node.nodeType === 3) node = node.parentNode
  let size = null
  for (let n = node; n && n !== el.value; n = n.parentNode) { if (n.style?.fontSize) { size = parseInt(n.style.fontSize, 10); break } }
  st.value = {
    bold: q('bold'), italic: q('italic'), underline: q('underline'),
    ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
    block: ['h1', 'h2', 'h3'].includes(block) ? block : 'p', size,
    align: q('justifyCenter') ? 'Center' : q('justifyRight') ? 'Right' : q('justifyFull') ? 'Full' : 'Left',
  }
}

/* ── commands ────────────────────────────────────────────────────────────────── */
function exec(cmd, val = null, css = false) {
  restore()
  try { document.execCommand('styleWithCSS', false, css) } catch { /* */ }
  // no value → no third argument: passing null made insertHorizontalRule write id="null"
  try { val == null ? document.execCommand(cmd, false) : document.execCommand(cmd, false, val) } catch { /* unsupported — no-op */ }
  sync(); push()
}
function setBlock(v) { exec('formatBlock', `<${v}>`); menu.value = null }
function setAlign(v) { exec('justify' + v); menu.value = null }
/* A literal (Custom) goes straight through execCommand. A NAMED colour can't — the browser
   rejects var() there — so a sentinel colour marks the selection first, and every marked
   span then gets the token instead (or loses the colour, for Default). */
const MARK = { fg: '#010203', bg: '#010204' }
const MARK_RGB = { fg: 'rgb(1, 2, 3)', bg: 'rgb(1, 2, 4)' }
function setColor(kind, v) {
  menu.value = null
  colorSel.value = { ...colorSel.value, [kind]: v }
  const cmd = kind === 'bg' ? 'hiliteColor' : 'foreColor'
  const named = COLORS[kind].find((o) => o.id === v)
  if (!named) { exec(cmd, v, true); return }
  exec(cmd, MARK[kind], true)
  const prop = kind === 'bg' ? 'backgroundColor' : 'color'
  const css = v === 'Default' ? '' : named.css
  // execCommand may still write <font color> for text colour — turn those into spans
  for (const f of [...el.value.querySelectorAll('font[color]')]) {
    if (f.getAttribute('color').toLowerCase() !== MARK.fg) continue
    const span = document.createElement('span'); span.style.color = MARK_RGB.fg
    while (f.firstChild) span.appendChild(f.firstChild)
    f.replaceWith(span)
  }
  for (const n of [...el.value.querySelectorAll('[style]')]) {
    if (n.style[prop] !== MARK_RGB[kind]) continue
    n.style[prop] = css
    if (!n.getAttribute('style') && n.tagName === 'SPAN') { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove() }
  }
  sync(); push()
}
/* execCommand's fontSize only speaks 1–7, so: mark the selection with size 7, then swap
   every marker for a span carrying the real pixel size (or unwrap it for Default). */
function setSize(px) {
  restore()
  try { document.execCommand('styleWithCSS', false, false); document.execCommand('fontSize', false, '7') } catch { /* */ }
  for (const f of [...el.value.querySelectorAll('font[size="7"]')]) {
    for (const inner of f.querySelectorAll('[style]')) inner.style.fontSize = ''
    if (px) {
      const span = document.createElement('span'); span.style.fontSize = px + 'px'
      while (f.firstChild) span.appendChild(f.firstChild)
      f.replaceWith(span)
    } else {
      while (f.firstChild) f.parentNode.insertBefore(f.firstChild, f)
      f.remove()
    }
  }
  menu.value = null
  sync(); push()
}
// one ahead of the limit: typing beyond `max` is refused, deleting always works
function onBeforeInput(e) {
  if (!e.inputType.startsWith('insert')) return
  const sel = window.getSelection()
  if (count.value >= props.max && sel?.isCollapsed) { e.preventDefault(); toast(`A note holds up to ${props.max} characters`, 'warn') }
}
// paste as plain text — pasted styling from other apps is what makes notes inconsistent
function onPaste(e) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text.slice(0, Math.max(0, props.max - count.value)))
}

/* ── menus ───────────────────────────────────────────────────────────────────── */
function toggle(m) { menu.value = menu.value === m ? null : m; if (m === 'link' || m === 'image') prepInsert(m) }
// the colour panel is teleported to <body>, so it is outside root — a click in it is still ours
function onDocDown(e) { if (menu.value && root.value && !root.value.querySelector('.rte-pop')?.contains(e.target) && !e.target.closest?.('.rte-btn, .cpx')) menu.value = null }

/* link / image */
const linkUrl = ref(''), linkText = ref(''), imgUrl = ref('')
const urlEl = ref(null)
function prepInsert(m) {
  if (m === 'link') { linkText.value = saved && !saved.collapsed ? saved.toString() : ''; linkUrl.value = '' }
  if (m === 'image') imgUrl.value = ''
  nextTick(() => urlEl.value?.focus())
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const okUrl = (u) => /^(https?:|mailto:)/i.test(u.trim())
function insertLink() {
  const url = linkUrl.value.trim()
  if (!okUrl(url)) { toast('A link needs to start with https://, http:// or mailto:', 'warn'); return }
  restore()
  if (saved && !saved.collapsed) exec('createLink', url)
  else exec('insertHTML', `<a href="${esc(url)}">${esc(linkText.value.trim() || url)}</a>&nbsp;`)
  menu.value = null
}
function insertImageUrl() {
  const url = imgUrl.value.trim()
  if (!/^https?:/i.test(url)) { toast('An image link needs to start with https:// or http://', 'warn'); return }
  exec('insertImage', url); menu.value = null
}
const fileEl = ref(null)
function readImage(file) {
  if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) { toast('Use a PNG, JPG, GIF or WebP image', 'warn'); return }
  if (file.size > 1024 * 1024) { toast('Images up to 1 MB can go in a note', 'warn'); return }
  const r = new FileReader()
  r.onload = () => { exec('insertImage', r.result); menu.value = null }
  r.readAsDataURL(file)
}
function onImageFile(e) { const f = e.target.files?.[0]; if (f) readImage(f); e.target.value = '' }
const sizeLabel = computed(() => st.value.size || '')
const blockLabel = computed(() => BLOCKS.find((b) => b.v === st.value.block)?.label || 'Paragraph')
</script>

<template>
  <div ref="root" class="rte" :class="{ focus: focused }">
    <div class="rte-area">
      <div
        ref="el" class="rte-body note-body" contenteditable="true" role="textbox" aria-multiline="true"
        :style="{ height: bodyH + 'px' }"
        :data-ph="placeholder" @input="push" @beforeinput="onBeforeInput" @paste="onPaste"
        @focus="focused = true" @blur="focused = false" @keyup="sync" @mouseup="sync"
      />
      <!-- the widget's resize mark; drags the text area taller -->
      <span class="rte-resize" title="Drag to resize" @mousedown.prevent="startResize" />
    </div>

    <!-- the formatting bar: on when T is toggled, or whenever text is selected — right
         above the bottom bar, as the reference stacks them -->
    <div v-if="showFmt" class="rte-fmt" @mousedown.prevent>
      <div class="rte-dd">
        <button class="rte-btn rte-wide" :class="{ open: menu === 'block' }" :title="blockLabel" @mousedown.prevent="toggle('block')">
          <b class="rte-a">A</b><Icon name="pen" :size="11" /><Icon name="chevron-down" :size="13" />
        </button>
        <div v-if="menu === 'block'" class="rte-pop rte-menu">
          <button v-for="b in BLOCKS" :key="b.v" class="rte-mi" :class="['bk-' + b.v, { on: st.block === b.v }]" @mousedown.prevent="setBlock(b.v)">{{ b.label }}</button>
        </div>
      </div>
      <i class="rte-sep" />
      <button class="rte-btn" :class="{ on: st.bold }" title="Bold" @mousedown.prevent="exec('bold')"><Icon name="bold" :size="16" /></button>
      <button class="rte-btn" :class="{ on: st.italic }" title="Italic" @mousedown.prevent="exec('italic')"><Icon name="italic" :size="16" /></button>
      <button class="rte-btn" :class="{ on: st.underline }" title="Underline" @mousedown.prevent="exec('underline')"><Icon name="underline" :size="16" /></button>
      <i class="rte-sep" />
      <div class="rte-dd">
        <button class="rte-btn rte-wide" :class="{ open: menu === 'size', on: !!st.size }" title="Font size" @mousedown.prevent="toggle('size')">
          <Icon name="text-size" :size="16" /><span v-if="sizeLabel" class="rte-num">{{ sizeLabel }}</span><Icon name="chevron-down" :size="13" />
        </button>
        <div v-if="menu === 'size'" class="rte-pop rte-menu rte-scroll">
          <button v-for="s in SIZES" :key="s || 'd'" class="rte-mi" :class="{ on: (st.size || null) === s }" @mousedown.prevent="setSize(s)">{{ s || 'Default' }}</button>
        </div>
      </div>
      <i class="rte-sep" />
      <div class="rte-dd">
        <button class="rte-btn rte-wide" :class="{ open: menu === 'align' }" title="Alignment" @mousedown.prevent="toggle('align')">
          <Icon :name="ALIGNS.find((a) => a.v === st.align)?.icon || 'align-left'" :size="16" /><Icon name="chevron-down" :size="13" />
        </button>
        <div v-if="menu === 'align'" class="rte-pop rte-menu">
          <button v-for="a in ALIGNS" :key="a.v" class="rte-mi rte-mi-ic" :class="{ on: st.align === a.v }" @mousedown.prevent="setAlign(a.v)">
            <Icon :name="a.icon" :size="15" /> {{ a.label || a.v }}
          </button>
        </div>
      </div>
      <i class="rte-sep" />
      <button class="rte-btn" :class="{ on: st.ul }" title="Bulleted list" @mousedown.prevent="exec('insertUnorderedList')"><Icon name="list-bullet" :size="16" /></button>
      <button class="rte-btn" :class="{ on: st.ol }" title="Numbered list" @mousedown.prevent="exec('insertOrderedList')"><Icon name="list-number" :size="16" /></button>
      <i class="rte-sep" />
      <button
        :ref="(e) => (colorBtn.bg = e)" class="rte-btn rte-col" :class="{ open: menu === 'bg' }" title="Background colour"
        @mousedown.prevent="toggle('bg')"
      ><Icon name="highlight" :size="16" /><i class="rte-bar" :style="{ background: barOf('bg') }" /></button>
      <button
        :ref="(e) => (colorBtn.fg = e)" class="rte-btn rte-col" :class="{ open: menu === 'fg' }" title="Text colour"
        @mousedown.prevent="toggle('fg')"
      ><Icon name="text-color" :size="16" /><i class="rte-bar" :style="{ background: barOf('fg') }" /></button>
      <ColorPanel
        v-if="menu === 'fg' || menu === 'bg'" :key="menu" :model-value="colorSel[menu]" :options="COLORS[menu]"
        :anchor="colorBtn[menu]" @pick="(v) => setColor(menu, v)" @close="menu = null"
      />
    </div>


    <!-- always there: what inserts something, and the T that shows the formatting bar -->
    <div class="rte-foot">
      <div class="rte-dd">
        <button class="rte-btn" :class="{ open: menu === 'image' }" title="Insert image" @mousedown.prevent="toggle('image')"><Icon name="image" :size="16" /></button>
        <div v-if="menu === 'image'" class="rte-pop rte-ins">
          <label class="rte-lbl">Image link</label>
          <input ref="urlEl" v-model="imgUrl" class="input" placeholder="https://…" @keyup.enter="insertImageUrl" />
          <div class="rte-ins-row">
            <button class="btn btn-sm" @click="fileEl.click()"><Icon name="download" :size="13" /> Upload</button>
            <span class="grow" />
            <button class="btn btn-sm" @click="menu = null">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="!imgUrl.trim()" @click="insertImageUrl">Insert</button>
          </div>
        </div>
      </div>
      <div class="rte-dd">
        <button class="rte-btn" :class="{ open: menu === 'link' }" title="Insert link" @mousedown.prevent="toggle('link')"><Icon name="link" :size="16" /></button>
        <div v-if="menu === 'link'" class="rte-pop rte-ins">
          <label class="rte-lbl">Text</label>
          <input v-model="linkText" class="input" placeholder="What the link says" />
          <label class="rte-lbl">Link</label>
          <input ref="urlEl" v-model="linkUrl" class="input" placeholder="https://…" @keyup.enter="insertLink" />
          <div class="rte-ins-row">
            <span class="grow" />
            <button class="btn btn-sm" @click="menu = null">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="!linkUrl.trim()" @click="insertLink">Insert</button>
          </div>
        </div>
      </div>
      <button class="rte-btn" :class="{ on: fmtOn }" :title="fmtOn ? 'Hide formatting' : 'Show formatting'" @mousedown.prevent="fmtOn = !fmtOn"><Icon name="text-type" :size="16" /></button>
      <span class="grow" />
      <span class="rte-count" :class="{ full: count >= max }">{{ count }} / {{ max }}</span>
      <input ref="fileEl" type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden @change="onImageFile" />
    </div>
  </div>
</template>

<style scoped>
.rte { position: relative; display: flex; flex-direction: column; border: 1px solid var(--border-control); border-radius: var(--r); background: var(--surface); transition: border-color .15s; }
.rte.focus { border-color: var(--primary); }
.rte-area { position: relative; }
.rte-body { overflow: auto; padding: 10px 12px 18px; outline: none; font-size: 13px; color: var(--ink); }
/* the same corner mark as a widget's resize handle (DashboardView .resize), shown on hover */
.rte-resize { position: absolute; right: 3px; bottom: 3px; width: 16px; height: 16px; cursor: ns-resize; opacity: 0; transition: opacity .15s; }
.rte-resize::after { content: ''; position: absolute; right: 2px; bottom: 2px; width: 6px; height: 6px; border-right: 2px solid var(--muted-2); border-bottom: 2px solid var(--muted-2); border-bottom-right-radius: 2px; }
.rte:hover .rte-resize, .rte.focus .rte-resize { opacity: 1; }
.rte-resize:hover::after { border-color: var(--primary); }
.rte-body:empty::before { content: attr(data-ph); color: var(--placeholder, var(--muted-2)); pointer-events: none; }
/* one row: the bar has to fit the 480px builder sidebar without wrapping */
.rte-fmt { display: flex; align-items: center; flex-wrap: nowrap; gap: 1px; padding: 5px 6px; border-top: 1px solid var(--border); background: var(--surface-2); }
.rte-foot { display: flex; align-items: center; gap: 2px; padding: 5px 8px; border-top: 1px solid var(--border); }
.rte-btn { position: relative; flex: none; height: 28px; min-width: 26px; padding: 0 4px; display: inline-flex; align-items: center; justify-content: center; gap: 2px; border: none; border-radius: var(--r); background: transparent; color: var(--ink-2); cursor: pointer; }
.rte-btn:hover, .rte-btn.open { background: var(--border); color: var(--ink); }
.rte-btn.on { background: var(--primary-soft); color: var(--primary-700); }
.rte-a { font-size: 14px; font-weight: 700; line-height: 1; }
.rte-num { font-size: 12px; font-weight: 500; }
.rte-sep { flex: none; width: 1px; height: 16px; background: var(--border-strong); margin: 0 3px; }
/* the two colour buttons carry the last-used colour as a bar under the glyph */
.rte-col { flex-direction: column; gap: 1px; padding-top: 3px; }
.rte-bar { width: 16px; height: 3px; border-radius: 1px; }
.rte-dd { position: relative; }
.rte-pop { position: absolute; z-index: 40; background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--r-lg); box-shadow: var(--sh-pop); }
/* both bars sit at the bottom, so every menu opens UPWARD */
.rte-fmt .rte-pop { bottom: calc(100% + 6px); left: 0; }
.rte-foot .rte-pop { bottom: calc(100% + 6px); left: 0; }
.rte-menu { min-width: 150px; padding: 4px; display: flex; flex-direction: column; }
.rte-scroll { min-width: 110px; max-height: 240px; overflow: auto; }
.rte-mi { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 12px; border: none; border-radius: 6px; background: transparent; color: var(--ink); font-size: 13px; text-align: left; cursor: pointer; }
.rte-mi:hover, .rte-mi.on { background: var(--row-hover, var(--surface-2)); }
.rte-mi-ic :deep(.ico) { color: var(--muted); }
/* the block menu shows each style at its own size */
.rte-mi.bk-h1 { font-size: 20px; font-weight: 600; }
.rte-mi.bk-h2 { font-size: 17px; font-weight: 600; }
.rte-mi.bk-h3 { font-size: 15px; font-weight: 600; }
.rte-ins { width: 280px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.rte-lbl { font-size: 12px; color: var(--ink-2); }
.rte-ins .input { height: 30px; font-size: 12px; }
.rte-ins-row { display: flex; gap: 6px; margin-top: 4px; }
.rte-count { font-size: 12px; color: var(--muted); }
.rte-count.full { color: var(--red); }
.grow { flex: 1; }
</style>
