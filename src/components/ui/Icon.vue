<script setup>
/**
 * Icon — the one icon component. `<Icon name="…" :size="…" />`, unchanged API.
 *
 * Backed by **lucide-vue-next** (UI-STYLE-GUIDE §5: "one family, no mixing"). It used to
 * render Material Symbols ligatures from a webfont; the names below are the same product
 * vocabulary mapped onto lucide components instead, so no call site had to change.
 *
 * Why the indirection is worth keeping rather than importing lucide directly at each
 * call site:
 *   - the ~140 call sites name what the icon MEANS ('predefined-monitor', 'chart-hbar'),
 *     not which glyph draws it, so swapping the library again touches one file;
 *   - lucide's own names churn between majors (BarChart3 → ChartColumn), and that churn
 *     stops here;
 *   - the guide's stroke/size defaults get applied once.
 *
 * Named imports keep this tree-shakeable — only the icons listed here ship, not all 5847.
 *
 * §5 sizes: 15 inside 32px controls · 16 nav/section · 18 panel headers and close buttons
 * · 13–14 inline with 12–13px text. Default colour is inherited (`currentColor`), so the
 * call site's `color` still drives it exactly as it did with the font.
 */
import { computed } from 'vue'
import {
  Plus, Search, Star, Folder, FolderOpen, Clock, RefreshCw, Share2, Link, Copy, Pencil,
  Trash2, Archive, ArchiveRestore, EllipsisVertical, Ellipsis, Maximize, Info,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp, LayoutGrid, List, Check, X, Eye,
  ListFilter, Hash, ChartColumn, ChartLine, ChartPie, Table2, House, LayoutDashboard,
  Sparkles, User, Users, Lock, Globe, Calendar, Download, Image, FileText, ExternalLink,
  Bell, Settings, ArrowLeft, Pin, Wand2, Maximize2, GripVertical, Inbox, TrendingUp, FileOutput,
  Moon, Sun, CalendarDays, Rows3, LayoutTemplate, TriangleAlert, Package, Network,
  Lightbulb, UserCheck, ClipboardCheck, UsersRound, Menu, Keyboard, History, Monitor,
  FolderMinus, FolderPlus, BadgeCheck, Undo2, Redo2, RotateCcw, ThumbsUp, ThumbsDown, ArrowUp, ArrowDown,
  PenLine, Palette, Square, Circle, MoveUpRight, Eraser, Mail, MousePointer2, ChartArea,
  Filter, Triangle, ChartBarBig, ChartBarStacked, ChartNoAxesColumn, ChartSpline, ChartNoAxesCombined,
  ChartColumnBig, Grid3x3, Gauge, AlignLeft, Map, ArrowRight, MessageSquare,
  ChartNoAxesColumnIncreasing, Zap, Send, Paperclip, Brain, Flag, Telescope, Crosshair,
  MonitorSmartphone, Shield, Boxes, PanelLeftOpen, PanelLeftClose, Bold, Italic, Underline,
  Strikethrough, Highlighter, Heading, Quote, Code, ListOrdered, IndentIncrease,
  IndentDecrease, RemoveFormatting, StickyNote, SlidersHorizontal,
} from 'lucide-vue-next'

const props = defineProps({
  name: String,
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 2 },
})

// our product vocabulary → the lucide component that draws it
const MAP = {
  plus: Plus, search: Search, star: Star, 'star-fill': Star,
  folder: Folder, 'folder-open': FolderOpen, clock: Clock, refresh: RefreshCw,
  share: Share2, link: Link, copy: Copy, edit: Pencil, trash: Trash2,
  archive: Archive, restore: ArchiveRestore, 'dots-v': EllipsisVertical, 'dots-h': Ellipsis,
  fullscreen: Maximize, info: Info, 'chevron-down': ChevronDown,
  'chevron-right': ChevronRight, 'chevron-left': ChevronLeft, 'chevron-up': ChevronUp,
  grid: LayoutGrid, list: List, check: Check, x: X, eye: Eye, filter: ListFilter,
  kpi: Hash, 'chart-bar': ChartColumn, 'chart-line': ChartLine, 'chart-pie': ChartPie,
  table: Table2, home: House, layout: LayoutDashboard, sparkles: Sparkles,
  user: User, users: Users, lock: Lock, globe: Globe, calendar: Calendar,
  download: Download, image: Image, 'file-text': FileText,
  // Export produces a FILE and sends it somewhere — image, PDF, or PDF by email. An
  // ExternalLink arrow said "this opens another page", which is a different promise.
  export: FileOutput,
  bell: Bell, settings: Settings, 'arrow-left': ArrowLeft, pin: Pin, wand: Wand2,
  'maximize-tile': Maximize2, drag: GripVertical, inbox: Inbox, trend: TrendingUp,
  moon: Moon, sun: Sun, calendar2: CalendarDays, rows: Rows3,
  template: LayoutTemplate, alert: TriangleAlert, package: Package, sitemap: Network,
  bulb: Lightbulb, 'user-check': UserCheck, clipboard: ClipboardCheck, team: UsersRound,
  menu: Menu, keyboard: Keyboard, history: History, 'predefined-monitor': Monitor,
  // Ungroup pairs with New group: FolderPlus creates one, FolderMinus dissolves it.
  // lucide's own 'Ungroup' glyph is two dashed squares, which at 15px reads as a
  // smudge and shares no vocabulary with the icon that made the group.
  ungroup: FolderMinus, 'default-home': House, 'new-group': FolderPlus,
  verified: BadgeCheck, undo: Undo2, redo: Redo2,
  /* 'reset' is not 'undo': undo steps back through history, reset puts a form or a set
     of settings back to where it started. Separate names so the two can never drift onto
     the same glyph by accident. */
  reset: RotateCcw,
  'thumb-up': ThumbsUp, 'thumb-down': ThumbsDown,
  'sort-asc': ArrowUp, 'sort-desc': ArrowDown,
  rearrange: LayoutGrid, pen: PenLine, palette: Palette,
  'shape-rect': Square, 'shape-ellipse': Circle, 'shape-arrow': MoveUpRight,
  erase: Eraser, mail: Mail, cursor: MousePointer2,
  'chart-area': ChartArea, 'chart-donut': ChartPie, 'chart-funnel': Filter,
  'chart-pyramid': Triangle, 'chart-hbar': ChartBarBig,
  // PMG-ACT-01 additional chart kinds
  'chart-stack': ChartBarStacked,
  // bars standing side by side, against chart-stack's piled ones — the pair has to be
  // told apart at 22px in the builder's kind row
  'chart-grouped': ChartNoAxesColumn,
  'chart-multiline': ChartSpline,
  'chart-combo': ChartNoAxesCombined, 'chart-hist': ChartColumnBig, 'chart-heatmap': Grid3x3,
  'chart-gauge': Gauge, 'chart-text': AlignLeft, 'chart-map': Map,
  'open-in': ArrowRight, chat: MessageSquare, 'auto-graph': ChartNoAxesColumnIncreasing,
  bolt: Zap, send: Send, attach: Paperclip, brain: Brain, flag: Flag, research: Telescope,
  target: Crosshair, insights: ChartNoAxesCombined,
  // module-rail glyphs
  assets: MonitorSmartphone, patch: Shield, packages: Boxes,
  'panel-left': PanelLeftOpen, 'panel-close': PanelLeftClose,
  // note editor toolbar
  bold: Bold, italic: Italic, underline: Underline, strikethrough: Strikethrough,
  highlight: Highlighter, title: Heading, quote: Quote, code: Code,
  'list-bullet': List, 'list-number': ListOrdered,
  indent: IndentIncrease, outdent: IndentDecrease,
  'clear-format': RemoveFormatting, note: StickyNote,
  // Layout appearance — sliders, because this setting TUNES the board rather than
  // recolouring it; a paint palette would promise theming it does not do.
  appearance: SlidersHorizontal,
}

// the only filled glyph in the set — a favourited star reads as filled, not outlined
const FILLED = new Set(['star-fill'])

const cmp = computed(() => MAP[props.name] || null)
const px = computed(() => (typeof props.size === 'number' ? props.size : parseFloat(props.size) || 18))
/* Lucide's own default is 2. The guide's icons read lighter than that at 13–15px, where
 * a 2px stroke on a 13px glyph closes up the counters, so small sizes step down. */
const stroke = computed(() => (px.value <= 14 ? 1.75 : 2))
</script>

<template>
  <component
    :is="cmp" v-if="cmp" class="ico"
    :size="px" :stroke-width="stroke"
    :fill="FILLED.has(name) ? 'currentColor' : 'none'"
    aria-hidden="true"
  />
</template>

<style scoped>
/* `flex: none` so an icon decorating a label never compresses when the label wraps
   (§5). `display: block` kills the inline baseline gap that pushed icons ~3px low
   inside flex rows. */
.ico { display: block; flex: none; }
</style>
