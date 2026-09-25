<script setup>
/**
 * MorphIconKit — the monochrome Chart Morph as files a developer can take away, on the
 * /loaders page under its card: the animated SVG (auto light/dark, or in the text colour),
 * the five charts as stills (SVG + PNG), the Vue component, and everything as one zip.
 * The files themselves are built in data/morphIcon.js.
 */
import { FRAMES, morphSvg, morphPng, zip } from '../../data/morphIcon.js'
import chartLoaderSrc from './ChartLoader.vue?raw'
import Icon from './Icon.vue'
import { toast } from '../../store/index.js'

const USAGE = `<ChartLoader variant="morph" mono smooth :size="60" />`

const ANIMATED = [
  { theme: 'auto', file: 'chart-morph.svg', label: 'Animated SVG', note: 'Follows light / dark' },
  { theme: 'current', file: 'chart-morph-currentcolor.svg', label: 'Animated SVG · text colour', note: 'Inline it; tint with CSS color' },
]

function save(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
const svgBlob = (s) => new Blob([s], { type: 'image/svg+xml' })

async function copy(text, what) {
  try {
    await navigator.clipboard.writeText(text)
    toast(`${what} copied`, 'success')
  } catch {
    toast('Copy was blocked by the browser — use Download instead', 'warn')
  }
}

const dlSvg = (a) => save(svgBlob(morphSvg({ theme: a.theme })), a.file)
const dlFrameSvg = (i) => save(svgBlob(morphSvg({ theme: 'auto', frame: i })), `chart-morph-${FRAMES[i].id}.svg`)
async function dlFramePng(i) {
  try { save(await morphPng(i), `chart-morph-${FRAMES[i].id}@4x.png`) } catch { toast('PNG could not be rendered', 'danger') }
}
const dlVue = () => save(new Blob([chartLoaderSrc], { type: 'text/plain' }), 'ChartLoader.vue')

async function dlAll() {
  const enc = new TextEncoder()
  const files = [
    ...ANIMATED.map((a) => ({ name: a.file, data: enc.encode(morphSvg({ theme: a.theme })) })),
    ...FRAMES.map((f, i) => ({ name: `frames/chart-morph-${f.id}.svg`, data: enc.encode(morphSvg({ theme: 'auto', frame: i })) })),
    { name: 'vue/ChartLoader.vue', data: enc.encode(chartLoaderSrc) },
    { name: 'README.txt', data: enc.encode(README) },
  ]
  for (const [i, f] of FRAMES.entries()) {
    files.push({ name: `frames/chart-morph-${f.id}@4x.png`, data: new Uint8Array(await (await morphPng(i)).arrayBuffer()) })
  }
  save(zip(files), 'chart-morph-icon.zip')
}

const README = `Chart Morph — Monochrome (Column · Line · Donut · Scatter · Stacked)
The widget loader from the ServiceOps dashboard prototype (/loaders).

chart-morph.svg               Animated, self-contained (pure CSS keyframes, 10s loop,
                              2s per chart). Works as <img src>, CSS background or inline.
                              Follows the OS light/dark setting; honours reduced motion.
chart-morph-currentcolor.svg  Same animation in ONE colour, currentColor. Inline it in the
                              HTML and set CSS 'color' on the parent to tint it.
frames/*.svg, frames/*.png    The five charts as stills (PNG at 4x, 640x400, transparent).
vue/ChartLoader.vue           The original Vue 3 component (all loader variants).
                              Usage: ${USAGE}

Artboard 160x100. The product shows it 60px wide in the widget body with a caption under
it: Stacking the columns… · Tracing the trend… · Slicing the donut… · Finding the pattern… ·
Filling the columns…
`

const thumb = (i) => morphSvg({ theme: 'current', frame: i, width: 44 })
</script>

<template>
  <section class="kit" aria-label="Chart Morph icon files">
    <div class="kit-head">
      <span class="kit-t"><Icon name="download" :size="14" /> Icon files</span>
      <button class="kit-all" @click="dlAll"><Icon name="package" :size="14" /> Download all (.zip)</button>
    </div>

    <div v-for="a in ANIMATED" :key="a.file" class="kit-row">
      <div class="kit-l"><b>{{ a.label }}</b><span>{{ a.note }}</span></div>
      <button class="kit-b" title="Copy SVG code" @click="copy(morphSvg({ theme: a.theme }), 'SVG code')"><Icon name="copy" :size="13" /> Copy</button>
      <button class="kit-b" :title="`Download ${a.file}`" @click="dlSvg(a)"><Icon name="download" :size="13" /> SVG</button>
    </div>

    <div class="kit-sub">Still frames</div>
    <div class="kit-frames">
      <div v-for="(f, i) in FRAMES" :key="f.id" class="kit-f">
        <!-- eslint-disable-next-line vue/no-v-html — our own generated SVG -->
        <span class="kit-art" v-html="thumb(i)" />
        <span class="kit-fn">{{ f.name }}</span>
        <span class="kit-fb">
          <button title="Download SVG" @click="dlFrameSvg(i)">SVG</button>
          <button title="Download PNG (4×)" @click="dlFramePng(i)">PNG</button>
        </span>
      </div>
    </div>

    <div class="kit-row">
      <div class="kit-l"><b>Vue component</b><code>{{ USAGE }}</code></div>
      <button class="kit-b" title="Copy usage" @click="copy(USAGE, 'Usage')"><Icon name="copy" :size="13" /> Copy</button>
      <button class="kit-b" title="Download ChartLoader.vue" @click="dlVue"><Icon name="download" :size="13" /> .vue</button>
    </div>
  </section>
</template>

<style scoped>
.kit { border: 1px solid var(--tile-border); border-radius: var(--r-lg); background: var(--bg); padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.kit-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kit-t { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink); }
.kit-all { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: none; border-radius: var(--r-sm); background: var(--sel); color: var(--surface); font-size: 12px; font-weight: 600; cursor: pointer; }
.kit-all:hover { opacity: .9; }
.kit-row { display: flex; align-items: center; gap: 6px; }
.kit-l { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.kit-l b { font-size: 12px; font-weight: 600; color: var(--ink); }
.kit-l span, .kit-l code { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kit-l code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.kit-b { flex: none; display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 8px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); color: var(--ink-2); font-size: 11px; font-weight: 600; cursor: pointer; }
.kit-b:hover { color: var(--ink); border-color: var(--border-strong); }
.kit-sub { font-size: 11px; font-weight: 600; color: var(--label); margin-top: 2px; }
.kit-frames { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.kit-f { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 2px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); min-width: 0; }
.kit-art { color: var(--picker-ico); line-height: 0; }
.kit-fn { font-size: 10px; color: var(--ink-2); }
.kit-fb { display: flex; gap: 2px; }
.kit-fb button { border: none; background: none; padding: 1px 3px; border-radius: 3px; font-size: 10px; font-weight: 600; color: var(--primary); cursor: pointer; }
.kit-fb button:hover { background: var(--seg-track); }
</style>
