<script setup>
/**
 * NoteEditor — the rich-text editor behind a Free Text (note) widget.
 *
 * Hand-rolled on `contenteditable` + `execCommand` rather than pulling in TipTap/Quill/
 * ProseMirror. ServiceOps ships ON-PREM, so every dependency is redistributed — the same
 * reasoning that put us on ECharts. A note needs bold, lists and links, not a document
 * model, and those three libraries all cost more bundle than the whole dashboard view.
 *
 * `execCommand` is formally deprecated and has no replacement; every browser still
 * implements it and will continue to, because the whole editable web runs on it. The
 * risk it carries is messy OUTPUT (browser-specific tags, inline styles from paste),
 * and that is handled at the other end: `sanitizeNote` allowlists the result, so
 * whatever the browser emits, what gets stored is the same small set of tags.
 *
 * Two-way binding on a contenteditable has one rule: never write `innerHTML` back while
 * the user is typing. Doing so collapses the selection to the start of the node and the
 * caret jumps to the top of the note on every keystroke. So the DOM is written only when
 * the incoming value differs from what the element already holds — i.e. an external
 * change — and `input` emits without writing back.
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import { sanitizeNote } from '../../data/freeText.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write a note…' },
  minHeight: { type: Number, default: 200 },
})
const emit = defineEmits(['update:modelValue'])

const el = ref(null)
const focused = ref(false)
const empty = ref(true)
// which inline marks are on at the caret — drives the toolbar's pressed state
const active = ref({})
const linkOpen = ref(false)
const linkUrl = ref('')
const linkEl = ref(null)

/* The toolbar. Grouped the way the marks group conceptually: emphasis, then block
 * shape, then lists, then the two that insert something. */
const GROUPS = [
  [
    { id: 'bold', icon: 'bold', label: 'Bold', key: 'Ctrl+B' },
    { id: 'italic', icon: 'italic', label: 'Italic', key: 'Ctrl+I' },
    { id: 'underline', icon: 'underline', label: 'Underline', key: 'Ctrl+U' },
    { id: 'strikeThrough', icon: 'strikethrough', label: 'Strikethrough' },
    { id: 'mark', icon: 'highlight', label: 'Highlight' },
  ],
  [
    { id: 'h3', icon: 'title', label: 'Heading' },
    { id: 'blockquote', icon: 'quote', label: 'Quote' },
    { id: 'code', icon: 'code', label: 'Code' },
  ],
  [
    { id: 'insertUnorderedList', icon: 'list-bullet', label: 'Bulleted list' },
    { id: 'insertOrderedList', icon: 'list-number', label: 'Numbered list' },
    { id: 'outdent', icon: 'outdent', label: 'Outdent' },
    { id: 'indent', icon: 'indent', label: 'Indent' },
  ],
  [
    { id: 'link', icon: 'link', label: 'Link' },
    { id: 'removeFormat', icon: 'clear-format', label: 'Clear formatting' },
  ],
]

function push() {
  if (!el.value) return
  empty.value = !el.value.textContent.trim() && !el.value.querySelector('li, br + br')
  emit('update:modelValue', el.value.innerHTML)
}

/** Refresh the toolbar's pressed state from wherever the caret is. */
function syncActive() {
  if (!el.value || !document.activeElement) return
  if (!el.value.contains(document.activeElement) && document.activeElement !== el.value) return
  const q = (c) => { try { return document.queryCommandState(c) } catch (e) { return false } }
  let block = ''
  try { block = (document.queryCommandValue('formatBlock') || '').toLowerCase() } catch (e) { /* not supported */ }
  active.value = {
    bold: q('bold'), italic: q('italic'), underline: q('underline'), strikeThrough: q('strikeThrough'),
    insertUnorderedList: q('insertUnorderedList'), insertOrderedList: q('insertOrderedList'),
    h3: block === 'h3', blockquote: block === 'blockquote',
    mark: !!closestTag('MARK'), code: !!closestTag('CODE'),
  }
}

/** The nearest ancestor of the caret with this tag, still inside the editor. */
function closestTag(tag) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  let n = sel.getRangeAt(0).startContainer
  while (n && n !== el.value) {
    if (n.nodeType === 1 && n.tagName === tag) return n
    n = n.parentNode
  }
  return null
}

function exec(cmd, val = null) {
  el.value?.focus()
  try { document.execCommand(cmd, false, val) } catch (e) { /* unsupported — no-op */ }
  syncActive()
  push()
}

/** Wrap or unwrap the selection in a tag execCommand has no command for. */
function toggleWrap(tag) {
  el.value?.focus()
  const existing = closestTag(tag)
  if (existing) {                       // already inside one → unwrap it
    const parent = existing.parentNode
    while (existing.firstChild) parent.insertBefore(existing.firstChild, existing)
    parent.removeChild(existing)
    syncActive(); push()
    return
  }
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return   // nothing selected — nothing to wrap
  const range = sel.getRangeAt(0)
  const node = document.createElement(tag.toLowerCase())
  try {
    node.appendChild(range.extractContents())
    range.insertNode(node)
    // leave the caret after the new node rather than inside it
    sel.removeAllRanges()
    const after = document.createRange()
    after.setStartAfter(node); after.collapse(true)
    sel.addRange(after)
  } catch (e) { /* selection spanned element boundaries — leave it alone */ }
  syncActive(); push()
}

function run(item) {
  if (item.id === 'link') { openLink(); return }
  if (item.id === 'mark' || item.id === 'code') { toggleWrap(item.id.toUpperCase()); return }
  if (item.id === 'h3' || item.id === 'blockquote') {
    // pressing an active block format returns it to a paragraph
    exec('formatBlock', active.value[item.id] ? '<p>' : `<${item.id}>`)
    return
  }
  exec(item.id)
}

/* ── links ──────────────────────────────────────────────────────────────────────
 * A prompt() would work but reads as a browser artefact in the middle of a product.
 * The inline field also lets an existing link be edited rather than only replaced. */
let savedRange = null
function openLink() {
  const a = closestTag('A')
  const sel = window.getSelection()
  savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null
  if (!a && (!savedRange || savedRange.collapsed)) return   // nothing to link
  linkUrl.value = a ? a.getAttribute('href') || '' : ''
  linkOpen.value = true
  requestAnimationFrame(() => linkEl.value?.focus())
}
function applyLink() {
  const url = linkUrl.value.trim()
  el.value?.focus()
  if (savedRange) {
    const sel = window.getSelection()
    sel.removeAllRanges(); sel.addRange(savedRange)
  }
  if (!url) { exec('unlink') } else {
    // a bare domain is the common typo; assume https rather than producing a dead
    // relative link the note owner won't notice until someone clicks it
    exec('createLink', /^[a-z]+:/i.test(url) ? url : `https://${url}`)
  }
  linkOpen.value = false
  savedRange = null
}
function cancelLink() { linkOpen.value = false; savedRange = null; el.value?.focus() }

/* Paste as the note's own formatting, never the source's. Browsers paste full styled
 * HTML from Word/Confluence/a web page, which is where 90% of the junk markup comes
 * from — running it through the same allowlist at the door means the editor never holds
 * anything the renderer would strip later. */
function onPaste(e) {
  const html = e.clipboardData?.getData('text/html')
  const text = e.clipboardData?.getData('text/plain')
  if (!html && !text) return
  e.preventDefault()
  const safe = html
    ? sanitizeNote(html)
    : text.split(/\n{2,}/).map((p) => `<p>${p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</p>`).join('')
  exec('insertHTML', safe)
}

// Enter inside a note should end the paragraph, not start a <div> — Chrome's default.
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink() }
}

function onSelectionChange() { syncActive() }

/* An EMPTY contenteditable puts the first line you type in a bare text node and only
 * starts wrapping once you press Enter — so a two-line note comes out as
 * `Line one<p>Line two</p>`, with the opening line in no block at all. Seeding one empty
 * paragraph means every line lives in a block from the first keystroke, which is what
 * lets the renderer, the sanitiser and the derived title all treat the content the same
 * way. `<br>` inside it is required: a `<p></p>` has zero height and the caret has
 * nowhere to sit. */
const EMPTY_DOC = '<p><br></p>'

onMounted(() => {
  try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch (e) { /* Safari */ }
  if (el.value) {
    el.value.innerHTML = props.modelValue || EMPTY_DOC
    empty.value = !el.value.textContent.trim()
  }
  document.addEventListener('selectionchange', onSelectionChange)
})
onBeforeUnmount(() => document.removeEventListener('selectionchange', onSelectionChange))

// external changes only — see the header note on why this is guarded
watch(() => props.modelValue, (v) => {
  if (!el.value || el.value.innerHTML === (v || '')) return
  el.value.innerHTML = v || ''
  empty.value = !el.value.textContent.trim()
})
</script>

<template>
  <div class="ne" :class="{ focused }">
    <div class="ne-bar">
      <template v-for="(g, gi) in GROUPS" :key="gi">
        <span v-if="gi" class="ne-sep" />
        <button
          v-for="it in g" :key="it.id" type="button" class="ne-b" :class="{ on: active[it.id] }"
          :title="it.key ? `${it.label} · ${it.key}` : it.label" :aria-label="it.label" :aria-pressed="!!active[it.id]"
          @mousedown.prevent @click="run(it)"
        ><Icon :name="it.icon" :size="16" /></button>
      </template>
    </div>

    <!-- the link field, inline rather than a prompt() -->
    <div v-if="linkOpen" class="ne-link">
      <Icon name="link" :size="14" class="nel-ic" />
      <input ref="linkEl" v-model="linkUrl" class="input" placeholder="https://…  (leave blank to remove)"
        @keyup.enter="applyLink" @keyup.esc="cancelLink" />
      <button class="btn btn-sm btn-primary" @click="applyLink">Apply</button>
      <button class="btn btn-sm" @click="cancelLink">Cancel</button>
    </div>

    <div class="ne-wrap" :style="{ minHeight: minHeight + 'px' }">
      <div
        ref="el" class="ne-in note-body" contenteditable="true" role="textbox" aria-multiline="true"
        :aria-label="placeholder"
        @input="push" @paste="onPaste" @keydown="onKeydown"
        @focus="focused = true" @blur="focused = false"
        @keyup="syncActive" @mouseup="syncActive"
      />
      <p v-if="empty" class="ne-ph">{{ placeholder }}</p>
    </div>
  </div>
</template>

<style scoped>
.ne { border: 1px solid var(--border-strong); border-radius: 4px; background: var(--surface); overflow: hidden; transition: border-color .15s, box-shadow .15s; }
.ne.focused { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

/* 26px buttons and tight separators so all twelve marks fit on ONE row in the builder's
   right-hand panel. At 28px with 5px separator margins the last button wrapped to a
   second row on its own, which read as a broken toolbar rather than a full one. */
.ne-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 1px; padding: 5px 6px; background: var(--bg); border-bottom: 1px solid var(--border); }
.ne-b { width: 26px; height: 26px; border: none; background: transparent; color: var(--ink-2); border-radius: 4px; display: grid; place-items: center; flex: none; }
.ne-b:hover { background: var(--surface-2); color: var(--ink); }
/* a pressed mark is filled, not tinted — at this size a soft tint reads as hover */
.ne-b.on { background: var(--primary-soft); color: var(--primary-700); }
.ne-sep { width: 1px; height: 16px; background: var(--border); margin: 0 3px; flex: none; }

.ne-link { display: flex; align-items: center; gap: 7px; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--primary-softer); }
.ne-link .input { flex: 1; height: 30px; font-size: 13px; }
.nel-ic { color: var(--muted); flex: none; }

.ne-wrap { position: relative; }
.ne-in { padding: 12px 14px; outline: none; min-height: inherit; }
/* the placeholder is a sibling, not ::before — a ::before inside a contenteditable
   becomes selectable content in Firefox and can end up inside the stored HTML */
.ne-ph { position: absolute; top: 12px; left: 14px; margin: 0; color: var(--placeholder); pointer-events: none; font-size: 13px; }
</style>
