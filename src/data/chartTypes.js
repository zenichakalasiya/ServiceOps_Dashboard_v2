/**
 * chartTypes.js — chart FAMILIES and the rules for converting within one.
 *
 * ── Why families ────────────────────────────────────────────────────────────────
 * A chart type is a way of DRAWING a configured dataset. Two types are
 * interchangeable when they read the same configuration — same dimensions, same
 * measure — so switching between them is a repaint, not a reconfiguration. That
 * relationship is what a family captures.
 *
 * It matters most on a PREDEFINED widget, where the configuration is not the user's
 * to edit: the only safe thing we can offer is "draw this same data differently".
 * Offering Heatmap next to Pie there would be offering a conversion that cannot
 * work, because the heatmap needs two dimensions the pie was never given.
 *
 * ── The families ────────────────────────────────────────────────────────────────
 *   category    one categorical dimension × one measure, on an axis
 *               Column · Bar · Line · Area — plus Stacked and Multi-line, which
 *               need a SECOND (split) dimension and so are config-gated.
 *   part-whole  one dimension × one measure, drawn as shares of a total
 *               Pie · Doughnut
 *   value       a single scalar
 *               KPI · Gauge
 *   distribution / matrix / stages / records / note — one member each. Nothing
 *               else reads their configuration, so they have nothing to convert to.
 *
 * ── Config gating ───────────────────────────────────────────────────────────────
 * Membership says a conversion is *conceivable*; `whyDisabled()` says whether THIS
 * widget has what it needs. A Column with no split field can't become Stacked —
 * there is nothing to stack by. Those appear disabled WITH THE REASON rather than
 * missing, so the answer to "why can't I pick that?" is on screen (the same call
 * Dynatrace makes) instead of being left to guess.
 */
import { NEW_KINDS } from './chartOptions.js'

/* Every chart kind, with the family it belongs to. `slice` marks part-of-whole:
 * those encode ONE series as shares, so a multi-series widget can't become one. */
export const CHART_TYPES = [
  { id: 'bar', label: 'Column', icon: 'chart-bar', family: 'category', slice: false },
  { id: 'hbar', label: 'Bar', icon: 'chart-hbar', family: 'category', slice: false },
  { id: 'line', label: 'Line', icon: 'chart-line', family: 'category', slice: false },
  { id: 'area', label: 'Area', icon: 'chart-area', family: 'category', slice: false },
  // need a split dimension — see needsSplit below
  { id: 'stack', label: 'Stacked', icon: 'chart-stack', family: 'category', slice: false, needsSplit: true },
  { id: 'multiline', label: 'Multi-line', icon: 'chart-multiline', family: 'category', slice: false, needsSplit: true },

  { id: 'pie', label: 'Pie', icon: 'chart-pie', family: 'part-whole', slice: true },
  { id: 'donut', label: 'Doughnut', icon: 'chart-donut', family: 'part-whole', slice: true },

  { id: 'gauge', label: 'Gauge', icon: 'chart-gauge', family: 'value', slice: false },

  // solo families — nothing reads the same configuration
  { id: 'combo', label: 'Combo', icon: 'chart-combo', family: 'combo', slice: false },
  { id: 'hist', label: 'Histogram', icon: 'chart-hist', family: 'distribution', slice: false },
  { id: 'funnel', label: 'Funnel', icon: 'chart-funnel', family: 'stages', slice: true },
  { id: 'heatmap', label: 'Heatmap', icon: 'chart-heatmap', family: 'matrix', slice: false },
  { id: 'mapbubble', label: 'Map Bubble', icon: 'chart-map', family: 'geo', slice: false },
]

export const FAMILIES = {
  category: { label: 'Axis charts', why: 'plot one category against one value, so they read the same configuration' },
  'part-whole': { label: 'Part of a whole', why: 'draw one series as shares of a total' },
  value: { label: 'Single value', why: 'reduce the data to one number' },
  combo: { label: 'Combo', why: 'pairs a count with an aggregate on a second axis' },
  distribution: { label: 'Distribution', why: 'bins a numeric field into ranges' },
  stages: { label: 'Stages', why: 'counts records reaching each stage of an ordered field' },
  matrix: { label: 'Matrix', why: 'crosses two dimensions into a grid' },
  geo: { label: 'Geographic', why: 'positions values on a map' },
}

const byId = new Map(CHART_TYPES.map((t) => [t.id, t]))
export const typeOf = (kind) => byId.get(kind) || null
export const familyOf = (kind) => byId.get(kind)?.family || null

/** Everything in the same family as this kind — the conversions worth offering. */
export function familyMembers(kind) {
  const fam = familyOf(kind)
  return fam ? CHART_TYPES.filter((t) => t.family === fam) : []
}

/* Does this widget carry a second dimension to split by? A spec-driven Stacked /
 * Multi-line names it in its spec; a legacy chart has one only if it was built with
 * more than one series (Created vs Resolved). */
function splitOf(chart) {
  if (!chart) return null
  const s = chart.spec || {}
  return s.stackSplit || s.mlSplit || s.split || ((chart.series || []).length > 1 ? 'its series' : null)
}

/**
 * A widget is FROZEN when it has no sibling to become.
 *
 * Note what this no longer says: it used to freeze every predefined non-bar/line
 * widget outright, which is why a predefined Pie could not become a Doughnut even
 * though that conversion changes nothing but an inner radius. Provenance is not the
 * question — whether the family has another member is.
 */
export function isFrozen(tile) {
  if (tile?.type && tile.type !== 'chart') return true
  return familyMembers(tile?.chart?.kind).length < 2
}

/** What the ⋯ menu / the builder's edit picker may offer: this kind's family. */
export function typesFor(tile) {
  if (isFrozen(tile)) return []
  return familyMembers(tile?.chart?.kind)
}

export function frozenReason(tile) {
  const t = typeOf(tile?.chart?.kind)
  if (!t) return 'This widget can’t be converted to another type'
  const fam = FAMILIES[t.family]
  return `A ${t.label} has no other type that reads the same configuration${fam ? ` — it ${fam.why}` : ''}`
}

/**
 * Why this specific widget can't become that type — null when it can.
 * Rendered as the disabled item's tooltip.
 */
export function whyDisabled(type, chart) {
  // part-of-whole can only show ONE series
  if (type.slice) {
    const n = (chart?.series || []).length
    if (n > 1) return `${type.label} shows a single series — this widget plots ${n}`
  }
  // stacked / multi-line need something to split by
  if (type.needsSplit && !splitOf(chart)) {
    return `${type.label} needs a second field to split by, and this widget doesn’t have one`
  }
  return null
}

/* Kept for callers that still ask "is this one of the three simple kinds?".
 * NEW_KINDS remains the authority for "is this spec-driven?" — see chartOptions.js. */
export const SWITCHABLE_KINDS = ['bar', 'hbar', 'line', 'area']
export { NEW_KINDS }
