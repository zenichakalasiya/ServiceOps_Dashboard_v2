<script setup>
/**
 * PreviewStateGallery — the widget builder's live-preview EMPTY STATE for every chart type
 * (/preview-states, on the left rail). Each card is exactly what the builder shows while a
 * new widget has no condition yet: the illustration, the title and its two-line line.
 *
 * Everything comes from data/previewArt.js — the same source the builder renders — so the
 * page can't show a state the product doesn't. Each illustration downloads as SVG (colours
 * resolved to the light theme) or a 4× PNG, one at a time or all together as a zip.
 *
 * EMPTY STATES (2026-10-08): the other vectors in the same slate family — the empty
 * dashboard, the empty group and "no data found" — sit in their own section above, each
 * shown with the copy the product puts under it. Their files are taken from the RENDERED
 * component (data/artExport.js), so a download is exactly what the product draws.
 */
import { reactive } from 'vue'
import EmptyPreviewArt from '../components/ui/EmptyPreviewArt.vue'
import EmptyBoardArt from '../components/ui/EmptyBoardArt.vue'
import EmptyGroupArt from '../components/ui/EmptyGroupArt.vue'
import NoDataArt from '../components/ui/NoDataArt.vue'
import { svgFileFromEl, pngFromEl } from '../data/artExport.js'
import { emptyStateFor } from '../data/emptyStates.js'
import Icon from '../components/ui/Icon.vue'
import { PREVIEW_KINDS, previewTitle, previewSvgFile, previewPng } from '../data/previewArt.js'
import { zip } from '../data/morphIcon.js'
import { toast } from '../store/index.js'

function save(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
const fileName = (k, ext) => `preview-empty-${k.id}.${ext}`
const dlSvg = (k) => save(new Blob([previewSvgFile(k.id)], { type: 'image/svg+xml' }), fileName(k, 'svg'))
async function dlPng(k) {
  try { save(await previewPng(k.id), fileName(k, 'png')) } catch { toast('PNG could not be rendered', 'danger') }
}
async function copySvg(k) {
  try { await navigator.clipboard.writeText(previewSvgFile(k.id)); toast(`${k.label} SVG copied`, 'success') }
  catch { toast('Copy was blocked by the browser — use Download instead', 'warn') }
}
/* ── the empty states — every other vector in this family, with the product's own copy ── */
const ND = emptyStateFor(null, 'nodata')
const EMPTY_ARTS = [
  { id: 'empty-dashboard', label: 'Empty dashboard', comp: EmptyBoardArt, width: 220, where: 'a new dashboard with no widgets',
    title: 'Your dashboard is empty', desc: 'Add a Widget, KPI or Shortcut to start visualizing your data.' },
  { id: 'empty-group', label: 'Empty group', comp: EmptyGroupArt, width: 150, where: 'a group with no widgets in it',
    title: '', desc: 'No widgets yet — drag one here, or add a widget.' },
  { id: 'no-data', label: 'No data found', comp: NoDataArt, width: 112, where: 'a widget whose query matched nothing',
    title: ND.title, desc: ND.sub },
]
const artEls = reactive({})
const artSvg = (a) => artEls[a.id]?.$el
const artName = (a, ext) => `empty-state-${a.id}.${ext}`
const artTitle = (a) => a.title || a.label
const artFile = (a) => svgFileFromEl(artSvg(a), { title: artTitle(a), width: a.width * 2 })
const dlArtSvg = (a) => save(new Blob([artFile(a)], { type: 'image/svg+xml' }), artName(a, 'svg'))
async function dlArtPng(a) {
  try { save(await pngFromEl(artSvg(a), { title: artTitle(a) }), artName(a, 'png')) } catch { toast('PNG could not be rendered', 'danger') }
}
async function copyArtSvg(a) {
  try { await navigator.clipboard.writeText(artFile(a)); toast(`${a.label} SVG copied`, 'success') }
  catch { toast('Copy was blocked by the browser — use Download instead', 'warn') }
}

async function dlAll() {
  const enc = new TextEncoder(), files = []
  for (const a of EMPTY_ARTS) {
    files.push({ name: `empty-states/svg/${artName(a, 'svg')}`, data: enc.encode(artFile(a)) })
    files.push({ name: `empty-states/png/${artName(a, 'png')}`, data: new Uint8Array(await (await pngFromEl(artSvg(a), { title: artTitle(a) })).arrayBuffer()) })
  }
  for (const k of PREVIEW_KINDS) {
    files.push({ name: `preview-states/svg/${fileName(k, 'svg')}`, data: enc.encode(previewSvgFile(k.id)) })
    files.push({ name: `preview-states/png/${fileName(k, 'png')}`, data: new Uint8Array(await (await previewPng(k.id)).arrayBuffer()) })
  }
  const copy = EMPTY_ARTS.map((a) => `${a.label} — ${a.where}\n  ${a.title ? a.title + '\n  ' : ''}${a.desc}\n`).join('\n') + '\n'
    + PREVIEW_KINDS.map((k) => `${k.label}\n  ${previewTitle(k.id)}\n  ${k.desc}\n`).join('\n')
  files.push({ name: 'copy.txt', data: enc.encode(copy) })
  save(zip(files), 'empty-and-preview-states.zip')
}
</script>

<template>
  <div class="ps">
    <header class="ps-head">
      <div>
        <h1>Preview States</h1>
        <p class="ps-sub">Every empty-state vector in the product, ready to download as SVG or PNG in the product's slate: the empty dashboard, an empty group, a widget with no data — and the widget builder's live preview while a new widget has no condition yet, one for every chart type.</p>
      </div>
      <button class="btn btn-primary" @click="dlAll"><Icon name="download" :size="15" /> Download all (.zip)</button>
    </header>

    <h2 class="ps-sec">Empty states <span>Dashboard, group and widget</span></h2>
    <div class="ps-grid">
      <article v-for="a in EMPTY_ARTS" :key="a.id" class="ps-item">
        <!-- the empty state, with the copy the product shows under it -->
        <div class="ps-card">
          <component :is="a.comp" :ref="(el) => (artEls[a.id] = el)" class="ps-art" :width="a.width" />
          <b v-if="a.title" class="ps-t">{{ a.title }}</b>
          <p class="ps-d">{{ a.desc }}</p>
        </div>
        <div class="ps-meta">
          <span class="ps-name">{{ a.label }} <i class="ps-where">{{ a.where }}</i></span>
          <span class="ps-acts">
            <button class="ps-b" title="Copy SVG code" @click="copyArtSvg(a)"><Icon name="copy" :size="13" /> Copy</button>
            <button class="ps-b" :title="`Download ${artName(a, 'svg')}`" @click="dlArtSvg(a)"><Icon name="download" :size="13" /> SVG</button>
            <button class="ps-b" :title="`Download ${artName(a, 'png')} (4×)`" @click="dlArtPng(a)"><Icon name="download" :size="13" /> PNG</button>
          </span>
        </div>
      </article>
    </div>

    <h2 class="ps-sec">Preview states <span>The widget builder's live preview, per chart type</span></h2>
    <div class="ps-grid">
      <article v-for="k in PREVIEW_KINDS" :key="k.id" class="ps-item">
        <!-- the preview card, as the builder draws it -->
        <div class="ps-card">
          <EmptyPreviewArt class="ps-art" :kind="k.id" :width="176" />
          <b class="ps-t">{{ previewTitle(k.id) }}</b>
          <p class="ps-d">{{ k.desc }}</p>
        </div>
        <div class="ps-meta">
          <span class="ps-name">{{ k.label }}</span>
          <span class="ps-acts">
            <button class="ps-b" title="Copy SVG code" @click="copySvg(k)"><Icon name="copy" :size="13" /> Copy</button>
            <button class="ps-b" :title="`Download ${fileName(k, 'svg')}`" @click="dlSvg(k)"><Icon name="download" :size="13" /> SVG</button>
            <button class="ps-b" :title="`Download ${fileName(k, 'png')} (4×)`" @click="dlPng(k)"><Icon name="download" :size="13" /> PNG</button>
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ps { padding: 20px 24px 48px; background: var(--surface); min-height: 100%; }
.ps-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
.ps-head h1 { margin: 0 0 4px; font-size: 18px; font-weight: 600; color: var(--ink); }
.ps-sub { margin: 0; max-width: 680px; font-size: 13px; line-height: 1.5; color: var(--muted); }
.ps-sec { margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: var(--ink); display: flex; align-items: baseline; gap: 10px; }
.ps-sec span { font-size: 12px; font-weight: 400; color: var(--muted); }
.ps-where { font-style: normal; font-weight: 400; color: var(--muted); margin-left: 4px; font-size: 12px; }
.ps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.ps-item { display: flex; flex-direction: column; gap: 8px; }
/* the builder's preview card: bordered, white, the empty state centred in it */
.ps-card { height: 280px; border: 1px solid var(--tile-border); border-radius: var(--r-lg); background: var(--surface);
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 6px; padding: 20px 24px; }
.ps-art { color: var(--picker-ico); margin-bottom: 10px; }
.ps-t { font-size: 14px; font-weight: 600; color: var(--ink); }
/* two lines, never more */
.ps-d { margin: 0; max-width: 300px; font-size: 13px; line-height: 1.5; color: var(--muted);
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ps-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ps-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.ps-acts { display: flex; gap: 6px; }
.ps-b { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 8px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); color: var(--ink-2); font-size: 11px; font-weight: 600; cursor: pointer; }
.ps-b:hover { color: var(--ink); border-color: var(--border-strong); }
</style>
