<script setup>
/**
 * FormattingHelp — what a Free Text widget accepts, with each mark shown rendered.
 *
 * It is generated from `FT_SYNTAX` and rendered through the SAME `toNoteHtml` the tile
 * uses, so the right-hand column is not a mock-up of the result — it IS the result. A
 * mark this help lists but the renderer does not support would show up here as literal
 * text, which is the failure being designed out: a documented mark that silently does
 * nothing is worse than an undocumented one.
 */
import Icon from '../ui/Icon.vue'
import { FT_SYNTAX, toNoteHtml } from '../../data/freeText.js'
import { toast } from '../../store/index.js'

defineEmits(['close'])

function copy(md) {
  navigator.clipboard?.writeText(md)
  toast('Copied to clipboard', 'success')
}
</script>

<template>
  <teleport to="body">
    <div class="fh-overlay" @click.self="$emit('close')">
      <div class="fh" role="dialog" aria-label="Formatting help">
        <header class="fh-head">
          <h4>Formatting help</h4>
          <button class="dlg-x" @click="$emit('close')"><Icon name="x" :size="18" /></button>
        </header>

        <div class="fh-body">
          <div v-for="s in FT_SYNTAX" :key="s.md" class="fh-row">
            <div class="fh-src">
              <pre>{{ s.md }}</pre>
              <button class="fh-copy" title="Copy" @click="copy(s.md)"><Icon name="copy" :size="14" /></button>
            </div>
            <div class="fh-out">
              <div class="note-body" v-html="toNoteHtml(s.md)" />
              <span class="fh-note">{{ s.note }}</span>
            </div>
          </div>
        </div>

        <footer class="fh-foot">
          <span class="fh-hint">Anything not listed here is shown as plain text.</span>
          <button class="btn" @click="$emit('close')">Close</button>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.fh-overlay { position: fixed; inset: 0; background: rgba(20,21,38,.5); backdrop-filter: blur(2px); z-index: 150; display: grid; place-items: center; padding: 24px; }
.fh { width: min(680px, 94vw); max-height: 82vh; background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--sh-lg); display: flex; flex-direction: column; overflow: hidden; }
.fh-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border); }
.fh-head h4 { margin: 0; font-size: 15px; font-weight: 600; color: var(--ink); }
.fh-body { flex: 1; overflow: auto; padding: 4px 18px; }
/* Source on the left, result on the right — the pairing IS the explanation, so they sit
   on one row rather than the result being a caption under the code. */
.fh-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-hairline); }
.fh-row:last-child { border-bottom: none; }
.fh-src { position: relative; background: var(--surface-2); border-radius: var(--r); padding: 9px 34px 9px 11px; }
.fh-src pre { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--ink-2); white-space: pre-wrap; word-break: break-word; }
.fh-copy { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border: none; background: transparent; color: var(--muted); border-radius: var(--r); display: grid; place-items: center; }
.fh-copy:hover { background: var(--surface); color: var(--ink); }
.fh-out :deep(*) { margin: 0; }
.fh-out :deep(ul), .fh-out :deep(ol) { padding-left: 18px; }
.fh-out :deep(img) { max-width: 100%; max-height: 54px; border-radius: var(--r); }
.fh-note { display: block; margin-top: 5px; font-size: 11.5px; color: var(--muted); }
.fh-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-top: 1px solid var(--border); }
.fh-hint { font-size: 12px; color: var(--muted); }
</style>
