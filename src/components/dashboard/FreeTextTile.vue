<script setup>
/**
 * FreeTextTile — renders a Free Text widget.
 *
 * The content is markdown (or, for a note written before this, rich HTML). It is
 * injected with `v-html`, so it goes through `toNoteHtml` first — an allowlist sanitiser
 * that also upgrades the older content in place, so there is one render path and no
 * migration step. See data/freeText.js for why that is an allowlist, not a blocklist.
 *
 * The LOOK comes from the widget's own config — alignment, vertical alignment, size,
 * colour, background, padding — resolved by `ftStyle` so the builder's live preview and
 * the placed tile cannot disagree about what a setting means.
 *
 * The box is a flex ROW even though it holds one child: that is what makes `align-items`
 * the vertical control, leaving `text-align` free to be the horizontal one. The child
 * then takes the full width, or `text-align` would have nothing to align inside.
 *
 * Typography lives in `.note-body` in global.css, shared with the builder's preview:
 * markup from `v-html` carries no scope attribute, so a scoped rule here could never
 * reach it.
 */
import { computed } from 'vue'
import { toNoteHtml, ftStyle } from '../../data/freeText.js'

const props = defineProps({
  content: { type: String, default: '' },
  // the presentation config: { size, align, valign, color, bg, pad }
  ft: { type: Object, default: () => ({}) },
})

const html = computed(() => toNoteHtml(props.content))
const style = computed(() => ftStyle(props.ft))
</script>

<template>
  <div class="ftx" :style="style.box">
    <div class="ftx-in note-body" :style="style.text">
      <p v-if="!html" class="ftx-empty">Text to display</p>
      <div v-else v-html="html" />
    </div>
  </div>
</template>

<style scoped>
.ftx { height: 100%; width: 100%; display: flex; overflow: auto; }
/* full width, so the box's text-align has something to act on */
.ftx-in { width: 100%; min-width: 0; }
.ftx-empty { color: var(--muted); margin: 0; }
</style>
