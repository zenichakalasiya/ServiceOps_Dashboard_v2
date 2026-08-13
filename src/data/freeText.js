/**
 * freeText.js — the content layer for the Free Text tile, which is now a NOTE.
 *
 * A note stores rich HTML (written in NoteEditor.vue) rather than the markdown-lite it
 * used to store. Two things follow from that, and both live here so no component has to
 * know about either:
 *
 *   1. HTML from a contenteditable is UNTRUSTED. Anything pasted in carries whatever
 *      markup it came from — styles, scripts, event handlers, tracking pixels. It is
 *      rendered with v-html, so it goes through `sanitizeNote` first, which is an
 *      ALLOWLIST: unknown tags are unwrapped, unknown attributes dropped, and the only
 *      surviving URL schemes are http/https/mailto. A blocklist would be wrong here —
 *      the set of dangerous markup is open-ended and the set of note formatting is not.
 *
 *   2. Notes written before this existed are markdown-lite ('# ' / '- ' / [a](b)), and
 *      the AI panel can still hand us plain prose. `toNoteHtml` upgrades either into the
 *      same HTML, so there is exactly one render path and no migration step.
 */

/* ── the legacy markdown-lite parser ───────────────────────────────────────────────
 * Kept because it is what upgrades old content. Grammar (line-based, blank lines
 * dropped): '# ' → heading, '- ' → bullet, anything else → paragraph; [label](url)
 * inline. */
function parseInline(text) {
  const segments = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) })
    segments.push({ text: m[1], href: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  if (!segments.length) segments.push({ text: '' })
  return segments
}

export function parseFreeText(content) {
  const src = content == null ? '' : String(content)
  const blocks = []
  for (const raw of src.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    let type, text
    if (line.startsWith('# ')) { type = 'h'; text = line.slice(2) }
    else if (line.startsWith('- ')) { type = 'li'; text = line.slice(2) }
    else { type = 'p'; text = line }
    blocks.push({ type, segments: parseInline(text) })
  }
  return blocks
}

/* ── sanitising ────────────────────────────────────────────────────────────────── */

// Structure and emphasis only. No sizing, no colour, no positioning — a note inherits
// the board's type scale so it cannot be styled into something that isn't a note.
const ALLOWED = new Set([
  'P', 'BR', 'DIV',
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'MARK', 'CODE',
  'UL', 'OL', 'LI',
  'H3', 'H4', 'BLOCKQUOTE',
  'A',
])
// tags that mean the same as an allowed one — normalised rather than dropped, because
// execCommand and pasted markup both produce these
const ALIAS = { STRIKE: 'S', DEL: 'S', FONT: 'SPAN', H1: 'H3', H2: 'H3', H5: 'H4', H6: 'H4', PRE: 'CODE' }
const SAFE_URL = /^(https?:|mailto:)/i

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** Strip a node's children up into its place — used for tags we don't allow but whose
 *  TEXT we want to keep (a <span>, a <table>, a pasted <section>). */
function unwrap(el) {
  const parent = el.parentNode
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function clean(node) {
  // iterate over a static copy: the list is live and unwrapping mutates it
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) continue                       // text — always fine
    if (child.nodeType !== 1) { child.remove(); continue }    // comments, CDATA, …

    const tag = child.tagName
    // these carry no readable text and must never survive
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED' || tag === 'LINK' || tag === 'META') {
      child.remove()
      continue
    }

    let el = child
    const alias = ALIAS[tag]
    if (alias) {
      // rename in place, carrying the children across
      const repl = document.createElement(alias.toLowerCase())
      while (el.firstChild) repl.appendChild(el.firstChild)
      el.parentNode.replaceChild(repl, el)
      el = repl
    }

    if (!ALLOWED.has(el.tagName)) { clean(el); unwrap(el); continue }

    /* Read the ONE attribute we intend to keep before emptying the list — reading it
     * after stripped every valid link of its href, so `<a href="https://…">` came out
     * as bare text. */
    const href = el.tagName === 'A' ? (el.getAttribute('href') || '').trim() : ''
    for (const attr of [...el.attributes]) el.removeAttribute(attr.name)
    if (el.tagName === 'A') {
      if (SAFE_URL.test(href)) {
        el.setAttribute('href', href)
        el.setAttribute('target', '_blank')
        el.setAttribute('rel', 'noopener noreferrer')
      } else {
        // a link we won't follow is just text — keep the words, drop the link
        clean(el); unwrap(el); continue
      }
    }
    clean(el)
  }
}

/* execCommand's list commands produce `<p><ul>…</ul></p>`, which is invalid nesting.
 * The parser corrects it by closing the <p> early — leaving a stray empty <p> on each
 * side of every list. They are invisible in the editor and stack up as blank lines in
 * the placed tile, so they go here. A <p><br></p> is NOT empty: that is a blank line
 * somebody typed on purpose. */
const BLOCKS = new Set(['P', 'H3', 'H4', 'BLOCKQUOTE'])
function dropEmptyBlocks(root) {
  for (const el of [...root.querySelectorAll('p, h3, h4, blockquote')]) {
    if (!BLOCKS.has(el.tagName)) continue
    if (!el.childNodes.length && !el.textContent.trim()) el.remove()
  }
}

/** Sanitise note HTML down to the allowlist. Safe to call on anything, including ''. */
export function sanitizeNote(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  clean(doc.body)
  dropEmptyBlocks(doc.body)
  return doc.body.innerHTML
}

/* ── upgrading ─────────────────────────────────────────────────────────────────── */

/* Content is HTML if it CONTAINS a tag anywhere — not if it starts with one.
 *
 * This tested `^\s*<p…` at first, which is wrong for the commonest case there is: an
 * empty contenteditable puts the first line you type in a bare text node and only wraps
 * later lines, so a two-line note reads `Line one<p>Line two</p>` and fails a
 * starts-with test. It then went down the markdown path, which ESCAPES its input — so
 * the note rendered its own tags as visible text. Markdown-lite and plain prose contain
 * no tags at all, so "has a tag" separates them cleanly wherever the tag sits. */
/* The list covers what our own editor emits AND what the common paste sources produce —
 * a table pasted from Confluence or Excel has to be recognised as HTML so the sanitiser
 * can unwrap it down to its text, rather than fall to the markdown path and render its
 * tags as visible characters. It is a NAMED list rather than a generic `<[a-z]…>`
 * because prose like "if x<y and a>b" would match a generic one and get mangled. */
const HTML_RE = /<(p|div|span|ul|ol|li|h[1-6]|blockquote|b|strong|i|em|u|s|strike|del|mark|code|pre|a|br|hr|font|center|table|thead|tbody|tr|td|th|section|article|header|footer|figure|img)\b[^>]*>/i
export const isNoteHtml = (s) => HTML_RE.test(s || '')

/** Markdown-lite (or plain prose) → the same HTML a note is written in. */
function mdToHtml(md) {
  const out = []
  let inList = false
  const inline = (segs) => segs.map((s) =>
    s.href && SAFE_URL.test(s.href)
      ? `<a href="${escapeHtml(s.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.text)}</a>`
      : escapeHtml(s.text)).join('')
  for (const b of parseFreeText(md)) {
    if (b.type === 'li') {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${inline(b.segments)}</li>`)
      continue
    }
    if (inList) { out.push('</ul>'); inList = false }
    out.push(b.type === 'h' ? `<h3>${inline(b.segments)}</h3>` : `<p>${inline(b.segments)}</p>`)
  }
  if (inList) out.push('</ul>')
  return out.join('')
}

/** The one entry point a renderer needs: any stored content → safe note HTML. */
export function toNoteHtml(content) {
  const src = content == null ? '' : String(content)
  if (!src.trim()) return ''
  return sanitizeNote(isNoteHtml(src) ? src : mdToHtml(src))
}

/* ── reading a note ────────────────────────────────────────────────────────────── */

/**
 * The note's text, with no markup, ONE LINE PER BLOCK.
 *
 * `textContent` alone is not enough: it concatenates without separators, so two
 * paragraphs come back as "…starts FridayNo production changes…" and the first line —
 * which is the note's title — runs into the second. Every block gets an explicit
 * newline after it before the text is read.
 */
export function noteText(content) {
  const doc = new DOMParser().parseFromString(`<body>${toNoteHtml(content)}</body>`, 'text/html')
  doc.body.querySelectorAll('p, h3, h4, li, blockquote, ul, ol, br').forEach((el) => el.after('\n'))
  return (doc.body.textContent || '')
    .replace(/[ \t ]+/g, ' ')
    .split('\n').map((s) => s.trim()).filter(Boolean).join('\n')
}

export const noteIsEmpty = (content) => !noteText(content)

/**
 * A note has no Name field — a sticky note doesn't carry a title, and asking for one
 * before you can write anything is the friction this tile exists to avoid. But the
 * library, the duplicate-name check and every listing still need something to call it,
 * so the title is DERIVED from the first line, the way every notes app does it.
 */
export function noteTitle(content, fallback = 'Note') {
  const first = (noteText(content).split('\n')[0] || '').replace(/[.,;:]+$/, '').trim()
  if (!first) return fallback
  return first.length > 48 ? first.slice(0, 47).trimEnd() + '…' : first
}
