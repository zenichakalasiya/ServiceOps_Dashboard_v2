<script setup>
/**
 * Hint — the info icon that sits beside a field label and carries the sentence that
 * used to sit under the field.
 *
 * A one-liner under every field turns a form into a wall of prose: it costs vertical
 * space on every render to answer a question most people only have once. On the icon,
 * the same sentence is there for whoever wants it and invisible to everyone else.
 *
 * Teleported to <body> and positioned in viewport coordinates, because the panels these
 * live in scroll and clip.
 */
import { ref } from 'vue'
import Icon from './Icon.vue'

defineProps({ text: { type: String, required: true } })

const el = ref(null)
const open = ref(false)
const pos = ref({ top: 0, left: 0 })
const W = 260

function show() {
  const r = el.value?.getBoundingClientRect(); if (!r) return
  // prefer opening below; flip above when the field is near the bottom of the viewport
  const below = r.bottom + 8
  const flip = below + 90 > window.innerHeight
  pos.value = {
    top: flip ? r.top - 8 : below,
    left: Math.max(8, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 8)),
    flip,
  }
  open.value = true
}
</script>

<template>
  <span ref="el" class="hint-ic" @mouseenter="show" @mouseleave="open = false" tabindex="0" @focus="show" @blur="open = false">
    <Icon name="info" :size="13" />
  </span>
  <teleport to="body">
    <transition name="fade">
      <span v-if="open" class="tt hint-tt" :class="{ up: pos.flip }" :style="{ top: pos.top + 'px', left: pos.left + 'px' }">{{ text }}</span>
    </transition>
  </teleport>
</template>

<style scoped>
.hint-ic { display: inline-grid; place-items: center; margin-left: 5px; color: var(--muted); cursor: help; vertical-align: -2px; }
.hint-ic:hover, .hint-ic:focus-visible { color: var(--primary); outline: none; }
.hint-tt { position: fixed; z-index: 200; width: 260px; }
.hint-tt.up { transform: translateY(-100%); }
</style>
