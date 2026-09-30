<script setup>
/**
 * ColorPanel — the rich-text editor's colour picker (2026-09-30, to the user's screenshot):
 * a named list on the left — Default · Gray · Green · Blue · Yellow · Orange · Red, a rule,
 * then Custom — and the custom pane on the right: saturation square, hue and opacity rails
 * with a preview chip, Hex (no #) · R · G · B · A, and Cancel / Apply.
 *
 * A named row applies at once and closes. The custom pane commits only on Apply, as a
 * literal (#hex, or rgba() below full opacity). Clicking Custom (or touching the pane)
 * marks the custom row as the one in force.
 *
 * It is TELEPORTED to <body> and placed in viewport coordinates beside its anchor: the
 * editor sits in the builder's scrolling sidebar, which would clip a 440px panel. It opens
 * ABOVE the anchor (the editor's bars are at its bottom) and flips below when there is no
 * room. Every mousedown inside is prevented except on the inputs, so a click on a swatch
 * never takes the editor's selection away.
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Icon from './Icon.vue'
import { isHex, hsvToRgb, rgbToHex, hexToHsv, rgbToHsv, parseLiteral } from '../../data/color.js'

const props = defineProps({
  // the value in force: a named id ('Red') or a literal ('#24344d', 'rgba(…)')
  modelValue: { type: String, default: 'Default' },
  // [{ id, css, swatch? }] — `swatch` overrides `css` for the chip (a Default that means "none")
  options: { type: Array, default: () => [] },
  anchor: { type: Object, default: null },            // the button it opens from
})
const emit = defineEmits(['pick', 'close'])

const named = computed(() => props.options.find((o) => o.id === props.modelValue))
const customOn = ref(!named.value)

/* ── custom pane state, seeded from the value in force when it is a literal ── */
const lit = parseLiteral(props.modelValue)
const hsv = ref(lit ? rgbToHsv(lit.rgb) : hexToHsv('#24344d'))
const alpha = ref(lit ? lit.a : 1)
const rgb = computed(() => hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v))
const hex = computed(() => rgbToHex(rgb.value))
const out = computed(() => (alpha.value >= 1 ? hex.value : `rgba(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b}, ${+alpha.value.toFixed(2)})`))
const hexTxt = computed(() => hex.value.slice(1).toUpperCase())

function touch() { customOn.value = true }
function typeHex(v) {
  const h = '#' + v.replace(/[^0-9a-f]/gi, '')
  if (isHex(h) && (h.length === 4 || h.length === 7)) { hsv.value = hexToHsv(h); touch() }
}
function typeRgb(k, v) {
  const n = Math.min(255, Math.max(0, parseInt(v, 10) || 0))
  hsv.value = rgbToHsv({ ...rgb.value, [k]: n }); touch()
}
function typeA(v) { const n = parseFloat(v); if (!isNaN(n)) { alpha.value = Math.min(1, Math.max(0, n)); touch() } }

/* the saturation/value square */
const sv = ref(null)
function svFrom(e) {
  const r = sv.value.getBoundingClientRect()
  hsv.value = { ...hsv.value, s: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), v: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)) }
}
function svDown(e) {
  touch(); svFrom(e)
  const move = (ev) => svFrom(ev)
  const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up) }
  addEventListener('mousemove', move); addEventListener('mouseup', up)
}

/* ── placement ── */
const PW = 440, PH = 306, GAP = 6
const pos = ref({ top: -9999, left: 0 })
function place() {
  const r = props.anchor?.getBoundingClientRect(); if (!r) return
  const top = r.top >= PH + GAP + 8 ? r.top - PH - GAP : Math.min(window.innerHeight - PH - 8, r.bottom + GAP)
  const left = Math.max(8, Math.min(r.left + r.width / 2 - PW / 2, window.innerWidth - PW - 8))
  pos.value = { top, left }
}
const onKey = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => { nextTick(place); addEventListener('resize', place); addEventListener('scroll', place, true); addEventListener('keydown', onKey) })
onBeforeUnmount(() => { removeEventListener('resize', place); removeEventListener('scroll', place, true); removeEventListener('keydown', onKey) })

// keep the editor's selection: swallow mousedown everywhere except in a text field
function guard(e) { if (!e.target.closest('input')) e.preventDefault() }
</script>

<template>
  <teleport to="body">
    <div class="cpx" :style="{ top: pos.top + 'px', left: pos.left + 'px' }" @mousedown="guard">
      <div class="cpx-names">
        <button
          v-for="o in options" :key="o.id" type="button" class="cpx-row"
          :class="{ on: !customOn && o.id === modelValue }" @click="emit('pick', o.id)"
        >
          <span class="cpx-sw" :style="{ background: o.swatch || o.css }" />
          <span class="cpx-l">{{ o.id }}</span>
          <Icon v-if="!customOn && o.id === modelValue" name="check" :size="15" />
        </button>
        <i class="cpx-rule" />
        <button type="button" class="cpx-row" :class="{ on: customOn }" @click="touch">
          <span class="cpx-sw cpx-sw-ck"><i :style="{ background: out }" /></span>
          <span class="cpx-l">Custom</span>
          <Icon v-if="customOn" name="check" :size="15" />
        </button>
      </div>

      <div class="cpx-pane">
        <div
          ref="sv" class="cpx-sv" @mousedown.prevent="svDown"
          :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }"
        >
          <span class="cpx-dot" :style="{ left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%' }" />
        </div>

        <div class="cpx-sliders">
          <div class="cpx-rails">
            <input v-model.number="hsv.h" class="cpx-hue" type="range" min="0" max="359" aria-label="Hue" @input="touch" />
            <input v-model.number="alpha" class="cpx-alpha" type="range" min="0" max="1" step="0.01" aria-label="Opacity" :style="{ '--a-to': hex }" @input="touch" />
          </div>
          <span class="cpx-prev"><i :style="{ background: out }" /></span>
        </div>

        <div class="cpx-fields">
          <label class="cpx-f cpx-f-hex"><input :value="hexTxt" maxlength="6" spellcheck="false" @change="typeHex($event.target.value)" /><span>Hex</span></label>
          <label class="cpx-f"><input :value="rgb.r" @change="typeRgb('r', $event.target.value)" /><span>R</span></label>
          <label class="cpx-f"><input :value="rgb.g" @change="typeRgb('g', $event.target.value)" /><span>G</span></label>
          <label class="cpx-f"><input :value="rgb.b" @change="typeRgb('b', $event.target.value)" /><span>B</span></label>
          <label class="cpx-f"><input :value="+alpha.toFixed(2)" @change="typeA($event.target.value)" /><span>A</span></label>
        </div>

        <div class="cpx-foot">
          <button type="button" class="btn" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-primary" @click="emit('pick', out)">Apply</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.cpx { position: fixed; z-index: 300; width: 440px; height: 306px; display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-pop); overflow: hidden; }

/* the named list */
.cpx-names { width: 150px; flex: none; padding: 8px 6px; border-right: 1px solid var(--border); overflow: auto; display: flex; flex-direction: column; gap: 2px; }
.cpx-row { display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; flex: none; padding: 0 8px; border: none; border-radius: var(--r); background: transparent; color: var(--ink); font-size: 13px; text-align: left; cursor: pointer; }
.cpx-row:hover { background: var(--surface-2); }
.cpx-row.on { background: var(--row-hover, var(--surface-2)); font-weight: 600; }
.cpx-row :deep(.ico) { color: var(--ink); flex: none; }
.cpx-l { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cpx-sw { width: 16px; height: 16px; flex: none; border-radius: 4px; border: 1px solid var(--border-strong); overflow: hidden; }
/* the custom chip shows its colour over a checker, so a low opacity reads as see-through */
.cpx-sw-ck { background: repeating-conic-gradient(var(--border) 0% 25%, var(--surface) 0% 50%) 0 0 / 6px 6px; }
.cpx-sw-ck i { display: block; width: 100%; height: 100%; }
.cpx-rule { display: block; flex: none; height: 1px; margin: 4px 2px; background: var(--border); }

/* the custom pane */
.cpx-pane { flex: 1; min-width: 0; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
.cpx-sv { position: relative; height: 150px; flex: none; border-radius: var(--r); cursor: crosshair; }
.cpx-dot { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .35); pointer-events: none; }
.cpx-sliders { display: flex; align-items: center; gap: 10px; }
.cpx-rails { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.cpx-rails input { -webkit-appearance: none; appearance: none; display: block; width: 100%; height: 12px; margin: 0; border-radius: var(--r-pill); border: none; outline: none; cursor: pointer; }
.cpx-rails input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .4), 0 1px 3px rgba(0, 0, 0, .3); }
.cpx-rails input::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .4); }
.cpx-hue { background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); }
.cpx-alpha { background: linear-gradient(to right, transparent, var(--a-to)), repeating-conic-gradient(var(--border) 0% 25%, var(--surface) 0% 50%) 0 0 / 8px 8px; }
.cpx-prev { width: 30px; height: 30px; flex: none; border-radius: var(--r); border: 1px solid var(--border); overflow: hidden; background: repeating-conic-gradient(var(--border) 0% 25%, var(--surface) 0% 50%) 0 0 / 8px 8px; }
.cpx-prev i { display: block; width: 100%; height: 100%; }
.cpx-fields { display: flex; gap: 6px; }
.cpx-f { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 0; }
.cpx-f-hex { flex: 2.6; }
.cpx-f input { width: 100%; min-width: 0; height: 28px; padding: 0 4px; text-align: center; border: 1px solid var(--border-control); border-radius: var(--r); background: var(--surface-2); color: var(--ink); font-size: 12px; outline: none; }
.cpx-f input:focus { border-color: var(--primary); background: var(--surface); }
.cpx-f span { font-size: 11px; color: var(--muted); }
.cpx-foot { margin-top: auto; display: flex; justify-content: flex-end; gap: 8px; }
</style>
