/**
 * Iris host — the ONE seam between the transplanted Iris panel and this app.
 *
 * Iris (src/iris/iris-core.js) is the reference build's own AI panel, kept as the plain
 * script it was written as: global functions, inline `onclick=` handlers, innerHTML
 * rendering. It reads the dashboard through a handful of globals the reference page
 * used to own (`WIDGETS`, `dashState`, `DASH_GROUPS`…) and calls a few host functions
 * (`pickDash`, `awAdd`, `toast`…). This module provides exactly those, live, from our
 * store and router — so Iris answers about the board in front of you, and what it
 * builds lands on that board.
 *
 * Everything ServiceOps-specific Iris SAYS is grounded here (`IRIS.facts()`): numbers
 * are read off the board's own tiles, never invented in the copy.
 */
import { store, toast, createDashboard, addBuiltTile } from '../store/index.js'
import router from '../router/index.js'
import { chart, kpi, shortcut } from '../data/mock.js'
import { chartData } from '../data/records.js'
import css from './iris.css?inline'
import markup from './iris-markup.html?raw'
import core from './iris-core.js?raw'

/* ── the board in front of you ───────────────────────────────────────────────────── */
function board() {
  const r = router.currentRoute.value
  const id = r.name === 'dashboard' ? r.params.id : null
  return store.dashboards.find((d) => d.id === id)
    || store.dashboards.find((d) => d.default && !d.archived)
    || store.dashboards.find((d) => !d.archived)
}
const tiles = () => (board()?.tiles || [])
const live = () => store.dashboards.filter((d) => !d.archived && d.enabled !== false)

/* A tile's labelled values, whatever kind it is: legacy charts carry labels+series,
   spec-driven kinds recompute from records, KPIs are one number. */
function itemsOf(t) {
  if (t.type === 'kpi') return [[t.title, Number(t.value) || 0]]
  if (t.type !== 'chart') return []
  let c = t.chart || {}
  if (c.spec) { try { c = { ...c, ...chartData(c.spec) } } catch { /* a spec this engine cannot read */ } }
  const labels = c.labels || [], s0 = (c.series || [])[0]
  if (!s0 || !Array.isArray(s0.values)) return []
  return labels.map((l, i) => [String(l), Number(s0.values[i]) || 0])
}
const KIND = (t) => t.type === 'kpi' ? 'kpi' : t.type === 'shortcut' ? 'list' : t.type === 'text' ? 'note'
  : (t.chart?.spec?.kind || t.chart?.kind || 'chart')
const plain = (s) => String(s || '').replace(/<[^>]*>/g, '')

/* The board's facts, computed once per question. Field names say what they are; the
   copy in iris-core.js only phrases them. */
function facts() {
  const ts = tiles().filter((t) => t.type !== 'text')
  const k = ts.filter((t) => t.type === 'kpi')
  const find = (re) => k.find((t) => re.test(t.title))
  const val = (t) => (t ? `${t.value}${t.unit || ''}` : null)
  const num = (t) => (t ? Number(t.value) : null)
  const SEV = { bad: 0, warn: 1, good: 2 }
  // every KPI that moved, worst first — the "counters" the reference ranks
  const metrics = k.filter((t) => t.delta).map((t) => ({
    n: plain(t.title), v: val(t), d: (t.delta.dir === 'down' ? -1 : 1) * (Number(t.delta.pct) || 0),
    bad: t.status === 'bad' || t.status === 'warn', status: t.status || 'good',
    def: t.info ? t.info.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase()) : 'a counter on this dashboard',
    src: plain(t.title),
  })).sort((a, b) => (SEV[a.status] ?? 3) - (SEV[b.status] ?? 3) || Math.abs(b.d) - Math.abs(a.d))
  // the biggest single slice/bar on any chart
  let top = null
  ts.filter((t) => t.type === 'chart').forEach((t) => {
    const best = itemsOf(t).slice().sort((a, b) => b[1] - a[1])[0]
    if (best && (!top || best[1] > top.v)) top = { w: plain(t.title), n: best[0], v: best[1] }
  })
  const open = find(/^open requests$|^open requests?\b(?!.*by)/i)
  const overdue = find(/overdue/i), unassigned = find(/unassigned/i), sla = find(/sla/i)
  return {
    dash: board()?.name || 'Dashboard', cat: board()?.category || '', n: ts.length,
    time: store.timeFilter?.label || 'Today',
    open: num(open), overdue: num(overdue), unassigned: num(unassigned),
    sla: val(sla), slaBad: !!sla && sla.status !== 'good',
    kpis: k.map((t) => ({ n: plain(t.title), v: val(t), status: t.status || 'good' })),
    metrics, top,
    widget: (ts[Math.min(2, ts.length - 1)] || {}).title || null,
  }
}

/* ── things Iris can DO ──────────────────────────────────────────────────────────── */
function go(name) {
  const d = live().find((x) => x.name === name)
  if (!d) return false
  router.push(`/dashboard/${d.id}`)
  return true
}
function createDash({ name, cat, sec }) {
  const d = createDashboard({ name, access: sec === 'Private' ? 'private' : 'public', category: cat })
  return d
}
function deleteDash(name) {
  const i = store.dashboards.findIndex((d) => d.name === name && d.mine)
  if (i < 0) return false
  const [d] = store.dashboards.splice(i, 1)
  if (router.currentRoute.value.params.id === d.id) router.push('/')
  return true
}

/* What a built widget becomes on OUR board. `vis` is the reference's visual name
   (hbars · line · donut · big · rows); `series` is optional named lines. */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const seeded = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 9973; return () => (h = (h * 16807) % 2147483647) / 2147483647 }
const GROUPS = {
  priority: ['Urgent', 'High', 'Medium', 'Low'], status: ['Open', 'In Progress', 'Pending', 'Resolved'],
  technician: ['Priya Nair', 'Rahul Shah', 'Sneha Iyer', 'Vikram D.', 'Aarav Mehta'],
  'technician group': ['Service Desk', 'Network', 'Hardware', 'Access'],
  category: ['Hardware', 'Software', 'Network', 'Access', 'Email'], site: ['Mumbai', 'Pune', 'Bengaluru', 'Delhi'],
}
const addedIds = []
function addWidget(title, vis, opt = {}) {
  const d = board(); if (!d) return null
  const r = seeded(title)
  const g = String(opt.group || '').toLowerCase().replace(/^by\s+/, '')
  const labels = GROUPS[g] || GROUPS.priority
  let t
  if (vis === 'big') t = kpi(title, Math.round(8 + r() * 40), '', { dir: 'up', pct: Math.round(r() * 20) }, 'warn', `Built by Iris — ${title}.`)
  else if (vis === 'rows') t = shortcut(title, ['Request', 'Subject', 'Priority', 'Status'],
    Array.from({ length: 6 }, (_, i) => [`#REQ-${4800 + i}`, ['VPN drops on Wi-Fi', 'Laptop battery swelling', 'Shared drive access', 'Email bounce', 'New joiner kit', 'Printer offline'][i], labels[i % labels.length], 'Open']))
  else if (vis === 'line' || opt.series) {
    const names = opt.series || ['Requests']
    t = chart(title, { kind: 'line', labels: DAYS, series: names.map((n) => ({ name: n, values: DAYS.map(() => Math.round(10 + r() * 50)) })) }, `Built by Iris — ${title}.`)
  } else {
    const kind = vis === 'donut' ? 'donut' : vis === 'hbar' ? 'hbar' : 'bar'
    t = chart(title, { kind, labels, series: [{ name: 'Requests', values: labels.map(() => Math.round(6 + r() * 60)) }] }, `Built by Iris — ${title}.`)
  }
  addBuiltTile(d, t)
  addedIds.push({ board: d.id, id: t.id })
  setTimeout(() => {
    const el = document.querySelector(`[data-tile="${t.id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 120)
  return t
}
function undoAdd() {
  const last = addedIds.pop(); if (!last) return false
  const d = store.dashboards.find((x) => x.id === last.board)
  if (d) d.tiles = d.tiles.filter((t) => t.id !== last.id)
  return true
}
function investigate(title) {
  const t = tiles().find((x) => plain(x.title) === title)
  if (!t) { toast(`“${title}” is not on this dashboard`); return false }
  const el = document.querySelector(`[data-tile="${t.id}"]`)
  if (!el) { toast('Could not locate that widget'); return false }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('aiflash')
  setTimeout(() => el.classList.remove('aiflash'), 1800)
  toast(`Jumped to “${title}”`)
  return true
}

/* ── the globals the reference panel reads ───────────────────────────────────────── */
function installGlobals() {
  const def = (k, get, set) => Object.defineProperty(window, k, { configurable: true, get, set: set || (() => {}) })
  def('WIDGETS', () => [tiles().map((t) => ({ t: KIND(t), title: plain(t.title), items: itemsOf(t) }))])
  let curG = 0
  def('curG', () => curG, (v) => { curG = 0 })
  def('TABS', () => [''])
  def('ungrouped', () => true)
  def('dashState', () => ({ cur: board()?.name || '' }))
  def('DASH_GROUPS', () => {
    const by = new Map()
    live().forEach((d) => {
      const g = d.category || 'Other'
      if (!by.has(g)) by.set(g, { name: g, items: [] })
      by.get(g).items.push([d.name, d.mine ? 'mine' : 'pmg', d.access === 'private' ? 1 : 0])
    })
    return [...by.values()]
  })
  def('DASH_INDEX', () => Object.fromEntries(live().map((d) => [d.name, { n: d.name, t: d.mine ? 'mine' : 'pmg', p: d.access === 'private' ? 1 : 0, g: d.category }])))
  window.W_USER = []
  window.IRIS = {
    board, tiles, facts, go, createDash, deleteDash, addWidget, undoAdd, investigate,
    user: () => String(store.currentUser || '').split(/\s+/)[0] || 'there',
    cats: () => store.categories.slice(),
    openAddWidget: () => { store.ui.irisAddWidget = true },
    toast: (m) => toast(m),
  }
}

/* ── mount once: styles, markup, then the panel's own script ─────────────────────── */
/* The flag lives on window, not in this module: a hot reload re-runs this module with a fresh
   `let`, and injecting the classic script twice throws ("Identifier … has already been
   declared"). A re-run only refreshes the stylesheet. */
export function mountIris() {
  if (window.__irisMounted) {
    const st = document.getElementById('iris-css'); if (st) st.textContent = css
    return
  }
  window.__irisMounted = true
  installGlobals()
  const st = document.createElement('style'); st.id = 'iris-css'; st.textContent = css
  document.head.appendChild(st)
  const host = document.createElement('div'); host.id = 'iris-root'; host.innerHTML = markup
  document.body.appendChild(host)
  const sc = document.createElement('script'); sc.id = 'iris-core'; sc.textContent = core
  document.body.appendChild(sc)
  // the rail width the panel clamps its floating card against
  const syncRail = () => {
    const r = document.querySelector('.rail')
    document.body.style.setProperty('--rail-w', (r ? r.getBoundingClientRect().width : 56) + 'px')
  }
  syncRail(); new ResizeObserver(syncRail).observe(document.querySelector('.rail') || document.body)
}
export function openIris(where) { mountIris(); window.aiOpen && window.aiOpen(where) }
