<script>
/**
 * BoardSkeleton — the board's first-landing loading state, CHOREOGRAPHED.
 *
 * Idea taken from opendashboards.com (studied live 2026-11-20): its skeleton cards are
 * absolutely positioned and GLIDE between layouts (translate / width / height, 760ms,
 * cubic-bezier(.7,0,.2,1)), new cards pop in from ~96%, each card carries a chart GLYPH
 * (bars, area, trend line, ring, rows) tinted 3–8% of the text colour, and a status pill
 * narrates the work. Our twist: every variant ENDS on the board's REAL layout, each card
 * wearing its tile's REAL glyph — so the hand-off to the live board is a crossfade in place,
 * never a jump.
 *
 * Variants (store.ui.skeletonStyle):
 *   choreo   — Choreograph: draft layouts that reshuffle, then settle on the real one
 *   assemble — Assemble: the real layout from frame one; cards pop in reading order, their
 *              glyphs draw themselves, then one light sweep crosses the board
 *   split    — Divide: one card fills the board, splits into rows, rows split into tiles
 *   classic  — the previous shimmer grid (baseline; rendered by DashboardView, not here)
 *
 * Positions are computed here (12-col row flow, the same row-height rule as cellStyle() in
 * DashboardView) because absolute positioning is what makes the glide possible — a CSS grid
 * can't tween a card from one track to another.
 */
/* how long each variant plays — DashboardView holds the board in "loading" this long */
export const SKELETON_MS = { classic: 600, choreo: 3000, assemble: 2300, split: 2700 }

/* A tile's REAL height once it has rendered. The formula (row floor) can't know that a Shortcut
 * table outgrows it by a row; so after every load DashboardView calls rememberTileHeights() and
 * the next landing on that board (revisit, Replay, manual refresh) settles to the exact pixel.
 * A board never seen before uses the formula. In the product this cache would ride along with
 * the saved layout. */
const HEIGHTS = new Map()
export function rememberTileHeights(root) {
  root?.querySelectorAll('.cell[data-tile]').forEach((el) => HEIGHTS.set(el.dataset.tile, Math.round(el.getBoundingClientRect().height)))
}

export const SKELETON_STYLES = [
  { id: 'choreo', n: '①', label: 'Choreograph', desc: 'Draft layouts reshuffle — cards pop in, stretch and trade places — then settle on this board’s real layout. The opendashboards.com idea.' },
  { id: 'assemble', n: '②', label: 'Assemble', desc: 'The real layout from the first frame; cards pop in reading order and each chart draws itself, then one light sweep. Calm and honest.' },
  { id: 'split', n: '③', label: 'Divide', desc: 'One card fills the board, splits into rows, and each row splits into its widgets — cell division.' },
  { id: 'classic', n: '④', label: 'Classic', desc: 'The previous fixed shimmer grid — kept as the baseline.' },
]
</script>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  board: { type: Object, default: null },
  variant: { type: String, default: 'choreo' },
  hGap: { type: Number, default: 14 },
  vGap: { type: Number, default: 14 },
  rowHeight: { type: Number, default: 140 },
})

const EASE_MS = 760
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- what the board will look like ---------- */
const KIND_GLYPH = {
  bar: 'bars', column: 'bars', hist: 'bars', stack: 'bars', grouped: 'bars', combo: 'bars',
  hbar: 'hbars', funnel: 'hbars',
  line: 'trend', multiline: 'trend', area: 'area', mapbubble: 'area',
  pie: 'ring', donut: 'ring', gauge: 'ring', heatmap: 'heat',
}
function glyphFor(t) {
  if (t.type === 'kpi') return 'kpi'
  if (t.type === 'shortcut') return 'rows'
  if (t.type === 'text') return 'lines'
  const k = t.chart?.spec?.kind || t.chart?.kind
  return KIND_GLYPH[k] || 'bars'
}
const item = (t, inset) => ({ w: Math.min(12, Math.max(2, t.w || 3)), h: Math.max(1, t.h || 1), px: HEIGHTS.get(t.id), glyph: glyphFor(t), inset })

/* the board in display order: ungrouped tiles, then each group (header band + its tiles) */
const items = computed(() => {
  const b = props.board
  if (!b) return []
  const ids = new Set((b.groups || []).map((g) => g.id))
  const inG = (gid) => b.tiles
    .filter((t) => ((t.group && ids.has(t.group)) ? t.group : null) === gid)
    .sort((a, c) => (c.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const out = inG(null).map((t) => item(t, 0))
  for (const g of b.groups || []) {
    out.push({ band: true, glyph: 'band', w: 12, h: 0, inset: 0, groupStart: true })
    if (!g.collapsed) for (const t of inG(g.id)) out.push(item(t, 13))   // 1px border + 12px body padding
    out.push({ groupEnd: true })
  }
  return out
})

/* 12-column row flow — mirrors the grid: a row is as tall as its tallest card */
function pack(list, W) {
  const { hGap: gap, vGap: vgap, rowHeight: rowH } = props
  const rects = []
  let x = 0, y = 0, rowMax = 0, row = 0
  const breakRow = () => { if (x > 0) { y += rowMax + vgap; x = 0; rowMax = 0; row++ } }
  for (const it of list) {
    if (it.groupEnd) { breakRow(); y += 12 + 16 - vgap; continue }   // body padding + group gap
    if (it.band) {
      breakRow()
      rects.push({ x: 1, y: y + 1, w: W - 2, h: 40, row: row++, band: true })   // inside the group's 1px border
      y += 1 + 40 + 12                                                 // border + header + body padding
      continue
    }
    const inner = W - it.inset * 2
    const col = (inner - 11 * gap) / 12
    if (x + it.w > 12) breakRow()
    // a one-row tile measures 144 on the live board, not the 140 floor — its header + value
    // content outgrow it; matching that keeps the final frame on the real tiles to the pixel
    const h = it.px || (it.h === 1 && it.glyph === 'kpi' ? Math.max(rowH, 144) : rowH + (it.h - 1) * 110)
    rects.push({ x: it.inset + x * (col + gap), y, w: it.w * col + (it.w - 1) * gap, h, row })
    rowMax = Math.max(rowMax, h)
    x += it.w
  }
  return rects
}

/* ---------- size ---------- */
const root = ref(null)
const W = ref(0)
let ro
onMounted(() => {
  W.value = root.value?.clientWidth || 1000          // before any card renders — see the template
  ro = new ResizeObserver(([e]) => { W.value = e.contentRect.width })
  ro.observe(root.value)
  start()
})

/* the real layout, capped to roughly what fits on first sight */
const finalRects = computed(() => {
  const all = pack(items.value, W.value)
  const out = []
  for (const r of all) { if (out.length >= 14 || r.y > 1100) break; out.push(r) }
  return out
})
const finalGlyphs = computed(() => items.value.filter((i) => !i.groupEnd).map((i) => i.glyph))
const N = computed(() => Math.max(finalRects.value.length, 3))

/* draft layouts for Choreograph — deliberately NOT the real one, so the settle reads as a decision */
const DRAFT_A = [[6, 2, 'bars'], [6, 2, 'area'], [4, 1, 'kpi'], [4, 1, 'kpi'], [4, 1, 'kpi'], [12, 2, 'trend'], [6, 2, 'ring'], [6, 2, 'rows']]
const DRAFT_B = [[12, 2, 'area'], [3, 1, 'kpi'], [3, 1, 'kpi'], [3, 1, 'kpi'], [3, 1, 'kpi'], [8, 2, 'bars'], [4, 2, 'ring'], [12, 2, 'rows']]
const draft = (tpl) => {
  const list = Array.from({ length: N.value }, (_, i) => { const [w, h, glyph] = tpl[i % tpl.length]; return { w, h, glyph, inset: 0 } })
  return { rects: pack(list, W.value), glyphs: list.map((l) => l.glyph) }
}

/* ---------- timeline ---------- */
const t = ref(0)
const timers = []
function start() {
  if (props.variant === 'classic') return
  const end = SKELETON_MS[props.variant]
  if (reduce) { t.value = end; return }
  const step = 50
  for (let ms = step; ms <= end; ms += step) timers.push(setTimeout(() => (t.value = ms), ms))
}
onBeforeUnmount(() => { timers.forEach(clearTimeout); ro?.disconnect() })

const frame = computed(() => {
  const fin = finalRects.value, fg = finalGlyphs.value, n = N.value, now = t.value
  const card = (rect, on, glyph, extra = {}) => ({ rect, on, glyph, ...extra })

  if (props.variant === 'choreo') {
    const A = draft(DRAFT_A), B = draft(DRAFT_B)
    const every = Math.min(170, 1150 / n)
    const phase = now < 1450 ? 'A' : now < 2150 ? 'B' : 'F'
    const cards = Array.from({ length: n }, (_, i) => {
      const on = now >= 120 + i * every
      if (phase === 'A') return card(A.rects[i], on, A.glyphs[i])
      if (phase === 'B') return card(B.rects[i], true, B.glyphs[i])
      return fin[i] ? card(fin[i], true, fg[i], { band: fin[i].band }) : card(B.rects[i], false, B.glyphs[i])
    })
    const caption = now < 1350 ? 'Reading your data' : now < 2100 ? 'Picking the right charts' : 'Arranging the layout'
    return { cards, caption }
  }

  if (props.variant === 'assemble') {
    const every = Math.min(95, 900 / n)
    const cards = fin.map((r, i) => card(r, now >= 80 + i * every, fg[i], { band: r.band, draw: true }))
    return { cards, caption: now < 1100 ? 'Fetching widget data' : 'Drawing the charts', sweep: now >= 1250 }
  }

  /* split — one card → rows → tiles */
  const bottom = fin.reduce((m, r) => Math.max(m, r.y + r.h), 0)
  const rows = {}
  fin.forEach((r, i) => {
    const b = rows[r.row] || (rows[r.row] = { first: i, y: r.y, h: 0, x0: r.x, x1: r.x + r.w })
    b.h = Math.max(b.h, r.h); b.x0 = Math.min(b.x0, r.x); b.x1 = Math.max(b.x1, r.x + r.w)
  })
  const phase = now < 700 ? 0 : now < 1450 ? 1 : 2
  const cards = fin.map((r, i) => {
    if (phase === 2) return card(r, true, fg[i], { band: r.band })
    const rb = rows[r.row]
    if (phase === 1) return card({ x: rb.x0, y: rb.y, w: rb.x1 - rb.x0, h: rb.h }, rb.first === i, r.band ? 'band' : 'lines', { band: r.band })
    return card({ x: 0, y: 0, w: W.value, h: Math.max(bottom, 420) }, i === 0, 'none')
  })
  const caption = phase === 0 ? 'Reading your data' : phase === 1 ? 'Laying out the board' : 'Placing the widgets'
  return { cards, caption }
})

const height = computed(() => {
  const vis = frame.value.cards.filter((c) => c.on && c.rect)
  return Math.max(420, ...vis.map((c) => c.rect.y + c.rect.h))
})

/* stable pseudo-random shape values per card, so a glyph never flickers between renders */
const rnd = (i, k) => { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s) }
const barVals = (i) => Array.from({ length: 7 }, (_, k) => 0.3 + rnd(i, k) * 0.7)
const hbarVals = (i) => Array.from({ length: 5 }, (_, k) => 0.35 + rnd(i, k + 9) * 0.65).sort((a, b) => b - a)
const ROW_W = [100, 86, 70, 92, 58]
function trendPath(i) {
  const pts = Array.from({ length: 7 }, (_, k) => [k * (100 / 6), 12 + (1 - (0.25 + rnd(i, k + 3) * 0.7)) * 76])
  return pts.reduce((d, [x, y], k) => {
    if (!k) return `M${x} ${y}`
    const [px, py] = pts[k - 1], cx = (px + x) / 2
    return `${d} C${cx} ${py} ${cx} ${y} ${x} ${y}`
  }, '')
}
const areaPath = (i) => `${trendPath(i)} L100 100 L0 100 Z`
const titleW = (i) => 28 + rnd(i, 20) * 30 + '%'
const cardStyle = (c) => ({
  translate: `${c.rect.x}px ${c.rect.y}px`,
  width: c.rect.w + 'px',
  height: c.rect.h + 'px',
})
</script>

<template>
  <div ref="root" class="bsk" :class="['v-' + variant, { reduce }]" :style="{ height: height + 'px' }" aria-busy="true" aria-label="Loading dashboard">
    <!-- cards wait for the first measure: rendered at W=0 they'd slide in from nothing -->
    <div v-for="(c, i) in (W ? frame.cards : [])" :key="i" class="bsk-card" :class="{ on: c.on, band: c.band, draw: c.draw }" :style="cardStyle(c)">
      <Transition name="bsk-g" mode="out-in">
        <div :key="c.glyph" class="bsk-body" :class="'g-' + c.glyph">
          <template v-if="c.glyph === 'band'"><i class="bone" style="width: 18%" /></template>
          <template v-else-if="c.glyph !== 'none'">
            <i class="bone" :style="{ width: titleW(i) }" />
            <template v-if="c.glyph === 'kpi'">
              <div class="fill" />
              <i class="bone big" :style="{ width: 30 + rnd(i, 4) * 25 + '%' }" />
              <i class="bone sm" :style="{ width: 22 + rnd(i, 5) * 20 + '%' }" />
            </template>
            <div v-else-if="c.glyph === 'bars'" class="bars">
              <i v-for="(v, k) in barVals(i)" :key="k" :style="{ '--v': v, '--d': k * 45 + 'ms' }" />
            </div>
            <div v-else-if="c.glyph === 'hbars'" class="hbars">
              <i v-for="(v, k) in hbarVals(i)" :key="k" :style="{ '--v': v, '--d': k * 60 + 'ms' }" />
            </div>
            <svg v-else-if="c.glyph === 'trend'" class="trend" viewBox="0 0 100 100" preserveAspectRatio="none"><path :d="trendPath(i)" pathLength="1" /></svg>
            <svg v-else-if="c.glyph === 'area'" class="area" viewBox="0 0 100 100" preserveAspectRatio="none"><path :d="areaPath(i)" /></svg>
            <div v-else-if="c.glyph === 'ring'" class="ring">
              <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" pathLength="1" /></svg>
            </div>
            <div v-else-if="c.glyph === 'heat'" class="heat">
              <i v-for="k in 28" :key="k" :style="{ opacity: 0.35 + rnd(i, k) * 0.65, '--d': (k % 7) * 40 + 'ms' }" />
            </div>
            <div v-else-if="c.glyph === 'rows'" class="rows">
              <i v-for="(w, k) in ROW_W" :key="k" class="bone row" :style="{ width: w + '%', '--d': k * 60 + 'ms' }" />
            </div>
            <div v-else-if="c.glyph === 'lines'" class="rows lines">
              <i class="bone" style="width: 90%" /><i class="bone" style="width: 76%" /><i class="bone" style="width: 54%" />
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <div v-if="frame.sweep" class="bsk-sweep" />

    <div class="bsk-note" :style="{ top: Math.min(height / 2, 230) + 'px' }">
      <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.22-8.56" /></svg>
      <Transition name="bsk-cap" mode="out-in"><span :key="frame.caption">{{ frame.caption }}</span></Transition>
    </div>
  </div>
</template>

<style scoped>
.bsk {
  --e: cubic-bezier(.7, 0, .2, 1);               /* the reference's glide: slow out, decisive in */
  --pop: cubic-bezier(.2, .8, .2, 1);
  --sk-card: color-mix(in srgb, var(--ink) 3%, var(--surface));
  --sk-line: color-mix(in srgb, var(--ink) 10%, var(--surface));
  --sk-shape: color-mix(in srgb, var(--ink) 8%, transparent);
  position: relative;
  width: 100%;
  transition: height 760ms var(--e);
}

/* a card — position + size glide; appearing = a small pop from 96% */
.bsk-card {
  position: absolute; top: 0; left: 0;
  box-sizing: border-box; overflow: hidden;
  border: 1px solid var(--sk-line);
  border-radius: 8px;
  background: var(--sk-card);
  opacity: 0; scale: .96;
  transition:
    translate 760ms var(--e), width 760ms var(--e), height 760ms var(--e),
    opacity 320ms ease, scale 420ms var(--pop);
}
.bsk-card.on { opacity: 1; scale: 1; }
.bsk-card.band { border-radius: 8px; background: color-mix(in srgb, var(--ink) 5%, var(--surface)); }

.bsk-body { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.g-band { justify-content: center; align-items: center; padding: 0 16px; }
.bone { display: block; flex: none; height: 10px; border-radius: 6px; background: var(--sk-shape); }
.bone.big { height: 26px; border-radius: 6px; }
.bone.sm { height: 8px; margin-top: -6px; }
.fill { flex: 1; }

.bars { flex: 1; min-height: 0; display: flex; align-items: flex-end; gap: 8px; }
.bars i { flex: 1 1 0; height: calc(var(--v) * 100%); border-radius: 6px 6px 2px 2px; background: var(--sk-shape); transform-origin: bottom; }
.hbars { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
.hbars i { flex: 1 1 0; width: calc(var(--v) * 100%); min-height: 6px; max-height: 20px; border-radius: 2px 6px 6px 2px; background: var(--sk-shape); transform-origin: left; }
.trend { flex: 1; min-height: 0; width: 100%; overflow: visible; }
.trend path { fill: none; stroke: var(--sk-shape); stroke-width: 5; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.area { flex: 1; min-height: 0; width: 100%; -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent); mask-image: linear-gradient(to bottom, #000 70%, transparent); }
.area path { fill: var(--sk-shape); }
.ring { flex: 1; min-height: 0; display: grid; place-items: center; }
.ring svg { height: 100%; max-height: 170px; aspect-ratio: 1; transform: rotate(-90deg); }
.ring circle { fill: none; stroke: var(--sk-shape); stroke-width: 15; }
.heat { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.heat i { border-radius: 3px; background: var(--sk-shape); }
.rows { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.rows .row { height: 14px; border-radius: 4px; }
.lines { justify-content: flex-start; gap: 10px; }

/* glyph swap: a quick crossfade with a hint of lift, so content changes read as "thinking" */
.bsk-g-enter-active, .bsk-g-leave-active { transition: opacity 180ms ease, translate 220ms var(--pop); }
.bsk-g-enter-from { opacity: 0; translate: 0 6px; }
.bsk-g-leave-to { opacity: 0; }

/* Assemble: each glyph draws itself once its card has popped in */
.draw.on .bars i { animation: skGrowY 620ms var(--pop) backwards; animation-delay: calc(140ms + var(--d)); }
.draw.on .hbars i { animation: skGrowX 620ms var(--pop) backwards; animation-delay: calc(140ms + var(--d)); }
.draw.on .rows .row { animation: skGrowX 520ms var(--pop) backwards; animation-delay: calc(120ms + var(--d)); transform-origin: left; }
.draw.on .heat i { animation: skFade 500ms ease backwards; animation-delay: calc(120ms + var(--d)); }
.draw.on .trend path { stroke-dasharray: 1; animation: skDraw 900ms var(--e) 120ms backwards; }
.draw.on .ring circle { stroke-dasharray: 1; animation: skDraw 900ms var(--e) 120ms backwards; }
.draw.on .area path { animation: skRise 700ms var(--pop) 120ms backwards; transform-origin: bottom; }
.draw.on .big { animation: skGrowX 520ms var(--pop) 160ms backwards; transform-origin: left; }
@keyframes skGrowY { from { transform: scaleY(0); } }
@keyframes skGrowX { from { transform: scaleX(0); } }
@keyframes skFade { from { opacity: 0; } }
@keyframes skDraw { from { stroke-dashoffset: 1; } }
@keyframes skRise { from { transform: scaleY(0); opacity: 0; } }

/* one light pass across the whole board (Assemble's finish) */
.bsk-sweep {
  position: absolute; inset: 0; pointer-events: none; border-radius: 8px;
  background: linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--surface) 70%, transparent) 50%, transparent 70%);
  background-size: 250% 100%;
  animation: skSweep 1100ms ease-in-out forwards;
}
@keyframes skSweep { from { background-position: 120% 0; } to { background-position: -30% 0; } }

/* the status pill that narrates the load */
.bsk-note {
  position: absolute; left: 50%; z-index: 2;
  translate: -50% -50%;
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 12px;
  border: 1px solid var(--border); border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(16, 24, 40, .06);
  color: var(--ink-2); font-size: 12.5px; white-space: nowrap;
  transition: top 760ms var(--e);
}
.spin { animation: skSpin .9s linear infinite; flex: none; }
@keyframes skSpin { to { transform: rotate(360deg); } }
.bsk-cap-enter-active, .bsk-cap-leave-active { transition: opacity 160ms ease, translate 200ms var(--pop); }
.bsk-cap-enter-from { opacity: 0; translate: 0 5px; }
.bsk-cap-leave-to { opacity: 0; translate: 0 -5px; }

.reduce, .reduce * { transition: none !important; animation: none !important; }
.reduce .spin { animation: skSpin 1.6s linear infinite !important; }
</style>
