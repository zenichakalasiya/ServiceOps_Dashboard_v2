<script setup>
/**
 * LayoutDrawer — the global layout settings as a right-edge drawer.
 *
 * Three of the four entry points open this one shell (the toolbar icon, the sidebar
 * icon, and the board's own control); only the Manage page's Appearance TAB renders
 * the panel inline instead. The difference between those entries is where you reach
 * it from, never what you get.
 *
 * NO SCRIM. That is the whole point on the board: you are judging spacing against
 * your real widgets, and dimming them behind a 40% black sheet would make the thing
 * you are judging unreadable while you judge it. The drawer sits beside the content
 * and the content keeps living — every slider re-renders the board underneath in real
 * time. Clicking outside closes it, so it is still dismissible without a scrim to
 * catch the click.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'
import LayoutAppearance from './LayoutAppearance.vue'
import { store, beginLayoutEdit, cancelLayoutEdit } from '../../store/index.js'

const close = () => { store.ui.layoutOpen = false }
function onKey(e) { if (e.key === 'Escape') close() }

/* The drawer's lifetime IS the edit session, so the snapshot is taken and released
 * here rather than by any one button. Every way out that isn't Apply — the X,
 * Escape, a click outside, even navigating away — lands on the same unmount and
 * reverts. Apply calls commitLayoutEdit() first, which drops the snapshot, so the
 * cancel below finds nothing to undo and the change stands. */
onMounted(() => { beginLayoutEdit(); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { cancelLayoutEdit(); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <teleport to="body">
    <!-- a transparent catcher, not a scrim: it dismisses on an outside click without
         tinting the board the settings are being judged against -->
    <div class="ld-catch" @click="close" />
    <transition name="ld" appear>
      <!-- a div, not an <aside>: `role="dialog"` is not an allowed role on <aside>,
           and no `aria-modal` — the board behind stays live and interactive -->
      <div class="ld" role="dialog" aria-label="Dashboard layout">
        <!-- Title only. The subtitle used to restate the scope, but the two scope cards
             are the first thing in the panel and say it in full — the header was
             answering a question the body answers three lines later. -->
        <header class="ld-h">
          <h3>Dashboard layout</h3>
          <!-- Close only. Reset lives at the footer's left edge, beside the other two
               things you can do to this draft. -->
          <button class="ld-x" title="Close" @click="close"><Icon name="x" :size="18" /></button>
        </header>
        <div class="ld-b"><LayoutAppearance variant="drawer" /></div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.ld-catch { position: fixed; inset: 0; z-index: 110; }
/* 620px — the Create Dashboard drawer's width. Two board-level side panels that open
   from the same header should not be two different sizes, and the extra room is what
   lets the scope cards and the six fields sit two to a row. */
.ld {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 111;
  width: 620px; max-width: 96vw; display: flex; flex-direction: column;
  background: var(--surface); border-left: 1px solid var(--border);
  box-shadow: var(--sh-lg);
}
.ld-h { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 22px; border-bottom: 1px solid var(--border); flex: none; }
.ld-h h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--ink); }
.ld-x { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border: none; background: transparent; color: var(--muted); border-radius: var(--r); }
.ld-x:hover { background: var(--icon-hover); color: var(--ink); }
/* No padding and no scrolling here: LayoutAppearance splits itself into a scrolling
   body and a pinned footer, and it can only do that if it owns the full height. A
   padded, scrolling wrapper would put the footer inside the scroll again. */
.ld-b { flex: 1; min-height: 0; overflow: hidden; }

.ld-enter-active, .ld-leave-active { transition: transform .2s cubic-bezier(.2,.7,.3,1); }
.ld-enter-from, .ld-leave-to { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .ld-enter-active, .ld-leave-active { transition: none; } }
</style>
