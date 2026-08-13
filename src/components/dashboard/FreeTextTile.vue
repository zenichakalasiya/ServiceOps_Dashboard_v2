<script setup>
/**
 * FreeTextTile — renders a Free Text tile's content as a NOTE.
 *
 * The content is rich HTML written in NoteEditor. It is injected with `v-html`, so it
 * goes through `toNoteHtml` first — an allowlist sanitiser that also upgrades the older
 * markdown-lite content in place, so there is one render path and no migration step.
 * See data/freeText.js for why that is an allowlist rather than a blocklist.
 *
 * The typography lives in `.note-body` in global.css, shared with the editor: markup
 * from `v-html` carries no scope attribute, so a scoped rule here could never reach it,
 * and sharing it is what makes the editor a true preview of the placed tile.
 */
import { computed } from 'vue'
import { toNoteHtml } from '../../data/freeText.js'

const props = defineProps({ content: { type: String, default: '' } })
const html = computed(() => toNoteHtml(props.content))
</script>

<template>
  <div class="ftx note-body">
    <p v-if="!html" class="ftx-empty">Nothing written yet.</p>
    <div v-else v-html="html" />
  </div>
</template>

<style scoped>
.ftx { height: 100%; overflow: auto; }
.ftx-empty { color: var(--muted); font-style: italic; margin: 0; }
</style>
