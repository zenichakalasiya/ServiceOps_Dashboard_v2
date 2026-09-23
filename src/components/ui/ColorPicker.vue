<script setup>
/**
 * ColorPicker — a named palette with a custom picker behind it.
 *
 * The field looks and measures like our Dropdown (36px, same border, same chevron) so a
 * colour reads as one more field in a form rather than as a special control. What opens
 * is a two-pane popover: the named swatches on the left, a full picker on the right.
 *
 * ── Named first, custom second ────────────────────────────────────────────────────
 * The value is normally a NAME ('Red'), not a hex. A name survives the theme switch —
 * it resolves through the caller's token for that colour — where a stored `#dc2626`
 * would stay the same ink on a dark card and become unreadable. Custom exists because
 * people ask for it, and is the only value stored as a literal.
 *
 * ── Why it is teleported ──────────────────────────────────────────────────────────
 * The picker is ~300px tall and the field can sit anywhere in a scrolling panel, so it
 * is teleported to <body> and positioned in viewport coordinates: it opens BELOW the
 * field, flips ABOVE when there is not enough room underneath, and slides along the
 * x-axis to stay on screen. Left inside the panel it was clipped by the first ancestor
 * with overflow — which is the panel itself.
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  // [{ id, css }] — the named palette this field offers
  options: { type: Array, default: () => [] },
  // resolves a token like `var(--red)` to a real colour for the swatches
  resolve: { type: Function, default: null },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const btn = ref(null)
const pos = ref({ top: 0, left: 0 })

const isHex = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v || ''))
const current = computed(() => props.options.find((o) => o.id === props.modelValue))
const label = computed(() => (current.value ? current.value.id : isHex(props.modelValue) ? 'Custom' : props.modelValue || 'Select'))
const swatch = computed(() => (current.value ? current.value.css : props.modelValue))

/* ── the custom pane's own state ────────────────────────────────────────────────── */
const hsv = ref({ h: 210, s: 0.5, v: 0.9 })
const alpha = ref(1)
const hexIn = ref('#7fa8d9')

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}
function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}
function hexToHsv(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let hh = 0
  if (d) {
    if (max === r) hh = 60 * (((g - b) / d) % 6)
    else if (max === g) hh = 60 * ((b - r) / d + 2)
    else hh = 60 * ((r - g) / d + 4)
  }
  return { h: (hh + 360) % 360, s: max ? d / max : 0, v: max }
}

const rgb = computed(() => hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v))
const hex = computed(() => rgbToHex(rgb.value))
const preview = computed(() => (alpha.value >= 1 ? hex.value : `rgba(${rgb.value.r},${rgb.value.g},${rgb.value.b},${alpha.value.toFixed(2)})`))
// the value Apply would commit — alpha below 1 has to be rgba(), which hex cannot carry
const committed = computed(() => (alpha.value >= 1 ? hex.value : preview.value))

watch(hex, (v) => { hexIn.value = v })
function typeHex(v) {
  hexIn.value = v
  if (isHex(v)) hsv.value = hexToHsv(v)
}

/* ── opening: measure, then place ───────────────────────────────────────────────── */
const PW = 396, PH = 306, GAP = 6
function place() {
  const r = btn.value?.getBoundingClientRect(); if (!r) return
  const below = window.innerHeight - r.bottom
  // below by default; above when it would not fit and there IS room up there
  const top = below >= PH + GAP || below >= r.top ? r.bottom + GAP : Math.max(8, r.top - PH - GAP)
  const left = Math.max(8, Math.min(r.left, window.innerWidth - PW - 8))
  pos.value = { top, left }
}
function toggle() {
  open.value = !open.value
  if (!open.value) return
  if (isHex(props.modelValue)) { hsv.value = hexToHsv(props.modelValue); hexIn.value = props.modelValue }
  nextTick(place)
}
function pickNamed(o) { emit('update:modelValue', o.id); open.value = false }
function applyCustom() { emit('update:modelValue', committed.value); open.value = false }

/* The popover lives on <body>, so it does not move with the panel behind it — close on
   scroll rather than leaving it stranded beside a field that has scrolled away. */
const onScroll = () => { if (open.value) open.value = false }
watch(open, (v) => {
  if (v) { window.addEventListener('scroll', onScroll, true); window.addEventListener('resize', place) }
  else { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', place) }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', place)
})

/* ── the saturation/value square ────────────────────────────────────────────────── */
const sv = ref(null)
function svFrom(e) {
  const r = sv.value.getBoundingClientRect()
  hsv.value = {
    ...hsv.value,
    s: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    v: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)),
  }
}
function svDown(e) {
  svFrom(e)
  const move = (ev) => svFrom(ev)
  const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
}
</script>

<template>
  <div class="cp">
    <button ref="btn" type="button" class="cp-btn" @click.stop="toggle">
      <span class="cp-sw" :style="{ background: swatch }" />
      <span class="cp-lbl">{{ label }}</span>
      <span v-if="isHex(modelValue)" class="cp-hex">{{ modelValue }}</span>
      <Icon name="chevron-down" :size="16" class="cp-chev" />
    </button>

    <teleport to="body">
      <div v-if="open" class="cp-back" @click="open = false" />
      <div v-if="open" class="cp-pop" :style="{ top: pos.top + 'px', left: pos.left + 'px' }" @click.stop>
        <!-- named palette -->
        <div class="cp-names">
          <button
            v-for="o in options" :key="o.id" type="button" class="cp-name"
            :class="{ on: o.id === modelValue }" @click="pickNamed(o)"
          >
            <span class="cp-sw" :style="{ background: o.css }" />
            <span class="ellip">{{ o.id }}</span>
            <Icon v-if="o.id === modelValue" name="check" :size="14" />
          </button>
        </div>

        <!-- custom -->
        <div class="cp-custom">
          <div
            ref="sv" class="cp-sv"
            :style="{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }"
            @mousedown.prevent="svDown"
          >
            <span class="cp-dot" :style="{ left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%' }" />
          </div>

          <div class="cp-sliders">
            <div class="cp-rails">
              <input class="cp-hue" type="range" min="0" max="360" v-model.number="hsv.h" aria-label="Hue" />
              <input
                class="cp-alpha" type="range" min="0" max="1" step="0.01" v-model.number="alpha" aria-label="Opacity"
                :style="{ '--a-to': hex }"
              />
            </div>
            <!-- on a checker, so a low alpha reads as transparent rather than as pale -->
            <span class="cp-preview"><i :style="{ background: preview }" /></span>
          </div>

          <div class="cp-fields">
            <label class="cp-f cp-f-hex">
              <input :value="hexIn" @input="typeHex($event.target.value)" spellcheck="false" />
              <span>Hex</span>
            </label>
            <label class="cp-f"><input :value="rgb.r" readonly /><span>R</span></label>
            <label class="cp-f"><input :value="rgb.g" readonly /><span>G</span></label>
            <label class="cp-f"><input :value="rgb.b" readonly /><span>B</span></label>
            <label class="cp-f"><input :value="alpha.toFixed(2)" readonly /><span>A</span></label>
          </div>

          <div class="cp-foot">
            <button class="btn btn-sm" @click="open = false">Cancel</button>
            <button class="btn btn-sm btn-primary" @click="applyCustom">Apply</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.cp { position: relative; }
/* measures like our Dropdown: same height, same border, same chevron */
.cp-btn { display: flex; align-items: center; gap: 8px; width: 100%; height: 36px; padding: 0 10px; border: 1px solid var(--border-control); background: var(--surface); border-radius: var(--r); font-size: 13px; color: var(--ink-2); }
.cp-btn:hover { border-color: var(--muted-2); }
.cp-lbl { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-hex { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; color: var(--muted-2); }
.cp-chev { color: var(--muted); flex: none; }
/* the chip carries a hairline: Transparent and a white Default have nothing to show
   against the field otherwise */
.cp-sw { width: 14px; height: 14px; flex: none; border-radius: 3px; border: 1px solid var(--border-strong); }

.cp-back { position: fixed; inset: 0; z-index: 199; }
.cp-pop { position: fixed; z-index: 200; width: 396px; display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-pop); overflow: hidden; }

.cp-names { width: 132px; flex: none; border-right: 1px solid var(--border); padding: 6px; overflow: auto; max-height: 304px; }
.cp-name { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 8px; border: none; background: transparent; border-radius: var(--r); font-size: 13px; color: var(--ink-2); text-align: left; }
.cp-name:hover { background: var(--surface-2); }
.cp-name.on { color: var(--primary-700); font-weight: 500; }
.cp-name .ellip { flex: 1; min-width: 0; }

.cp-custom { flex: 1; min-width: 0; padding: 10px; display: flex; flex-direction: column; gap: 9px; }
.cp-sv { position: relative; height: 120px; border-radius: var(--r); cursor: crosshair; }
.cp-dot { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.35); pointer-events: none; }

.cp-sliders { display: flex; align-items: center; gap: 9px; }
.cp-rails { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.cp-rails input { -webkit-appearance: none; appearance: none; width: 100%; height: 10px; border-radius: var(--r-pill); border: 1px solid var(--border); outline: none; }
.cp-rails input::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 1px solid rgba(0,0,0,.35); box-shadow: 0 1px 2px rgba(0,0,0,.3); }
.cp-hue { background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); }
/* the alpha rail shows the colour it is fading, so the slider means something */
.cp-alpha { background:
  linear-gradient(to right, transparent, var(--a-to)),
  repeating-conic-gradient(var(--border) 0% 25%, var(--surface) 0% 50%) 0 0 / 8px 8px; }
.cp-preview { width: 30px; height: 30px; flex: none; border-radius: var(--r); border: 1px solid var(--border); overflow: hidden; background: repeating-conic-gradient(var(--border) 0% 25%, var(--surface) 0% 50%) 0 0 / 8px 8px; }
.cp-preview i { display: block; width: 100%; height: 100%; }

.cp-fields { display: flex; gap: 6px; }
.cp-f { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cp-f-hex { flex: 2.2; }
.cp-f input { width: 100%; min-width: 0; height: 26px; padding: 0 6px; text-align: center; border: 1px solid var(--border-control); border-radius: var(--r); background: var(--surface); color: var(--ink); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; outline: none; }
.cp-f input:focus { border-color: var(--primary); }
.cp-f span { font-size: 10px; color: var(--muted-2); }

.cp-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 1px; }
</style>
