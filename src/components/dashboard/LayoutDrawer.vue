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
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../ui/Icon.vue'
import LayoutAppearance from './LayoutAppearance.vue'
import { store, byId, beginLayoutEdit, cancelLayoutEdit, resetLayoutValues, isLayoutDefault } from '../../store/index.js'

/* The header's Reset needs the same board the panel edits, so it reads it the same
 * way — from the route — rather than reaching into the child. The scope-aware rules
 * themselves live in the store, so the two can't disagree. */
const route = useRoute()
const dash = computed(() => (route.params.id ? byId(route.params.id) : null))
const atDefaults = computed(() => isLayoutDefault(dash.value))

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
        <header class="ld-h">
          <div class="ld-t">
            <Icon name="appearance" :size="16" />
            <div>
              <b>Dashboard layout</b>
              <!-- the subtitle follows the SCOPE, so the header never claims a reach the
                   selected option does not have -->
              <span>{{ store.ui.layoutScope === 'this' ? 'This dashboard’s layout' : 'Your layout, on every dashboard' }}</span>
            </div>
          </div>
          <!-- Reset then Close, the same pairing the widget builder's header uses.
               Reset is part of the draft: it moves the sliders, and Cancel still
               takes it back. -->
          <div class="ld-acts">
            <button
              class="ld-x" :disabled="atDefaults"
              title="Reset every value to its default" @click="resetLayoutValues(dash)"
            ><Icon name="reset" :size="16" /></button>
            <button class="ld-x" title="Close" @click="close"><Icon name="x" :size="18" /></button>
          </div>
        </header>
        <div class="ld-b"><LayoutAppearance variant="drawer" /></div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.ld-catch { position: fixed; inset: 0; z-index: 110; }
.ld {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 111;
  width: 380px; max-width: 92vw; display: flex; flex-direction: column;
  background: var(--surface); border-left: 1px solid var(--border);
  box-shadow: var(--sh-lg);
}
.ld-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); flex: none; }
.ld-t { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.ld-t :deep(.ico) { color: var(--muted); margin-top: 2px; }
.ld-t div { display: flex; flex-direction: column; min-width: 0; }
.ld-t b { font-size: 16px; font-weight: 600; color: var(--ink); }
.ld-t span { font-size: 12px; color: var(--muted); margin-top: 1px; }
.ld-acts { display: flex; align-items: center; gap: 2px; flex: none; }
.ld-x { flex: none; width: 32px; height: 32px; display: grid; place-items: center; border: none; background: transparent; color: var(--muted); border-radius: var(--r); }
.ld-x:hover:not(:disabled) { background: var(--icon-hover); color: var(--ink); }
.ld-x:disabled { opacity: .35; cursor: not-allowed; }
/* No padding and no scrolling here: LayoutAppearance splits itself into a scrolling
   body and a pinned footer, and it can only do that if it owns the full height. A
   padded, scrolling wrapper would put the footer inside the scroll again. */
.ld-b { flex: 1; min-height: 0; overflow: hidden; }

.ld-enter-active, .ld-leave-active { transition: transform .2s cubic-bezier(.2,.7,.3,1); }
.ld-enter-from, .ld-leave-to { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .ld-enter-active, .ld-leave-active { transition: none; } }
</style>
