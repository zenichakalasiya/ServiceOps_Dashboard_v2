<script setup>
// Custom select — replaces native <select> across the dashboard fields.
import { ref, computed } from 'vue'
import Icon from './Icon.vue'
const props = defineProps({
  modelValue: { type: [String, Number, Array], default: '' },
  options: { type: Array, default: () => [] },     // [{ value, label }] or ["a","b"]
  placeholder: { type: String, default: 'Select' },
  size: { type: String, default: 'md' },           // md | sm
  multiple: { type: Boolean, default: false },
  // read-only: the VALUE stays legible, only the affordance goes (see .dd-btn:disabled)
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const norm = computed(() => props.options.map((o) => (typeof o === 'object' ? o : { value: o, label: o })))
const arr = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))
const selectedLabel = computed(() => {
  if (props.multiple) return norm.value.filter((o) => arr.value.includes(o.value)).map((o) => o.label).join(', ')
  const s = norm.value.find((o) => o.value === props.modelValue)
  return s ? s.label : ''
})
function isOn(o) { return props.multiple ? arr.value.includes(o.value) : o.value === props.modelValue }
function pick(o) {
  if (props.multiple) {
    emit('update:modelValue', arr.value.includes(o.value) ? arr.value.filter((v) => v !== o.value) : [...arr.value, o.value])
  } else { emit('update:modelValue', o.value); open.value = false }
}
</script>

<template>
  <div class="dd" :class="[{ open }, 'dd-' + size]">
    <button type="button" class="dd-btn" :disabled="disabled" @click.stop="disabled || (open = !open)">
      <span class="dd-val" :class="{ ph: !selectedLabel }">{{ selectedLabel || placeholder }}</span>
      <Icon name="chevron-down" :size="16" class="dd-chev" />
    </button>
    <div v-if="open" class="dd-back" @click="open = false" />
    <transition name="dd-pop">
      <div v-if="open" class="dd-menu">
        <button v-for="o in norm" :key="o.value" type="button" class="dd-opt" :class="{ on: isOn(o) }" @click="pick(o)">
          <span class="ellip">{{ o.label }}</span>
          <Icon v-if="isOn(o)" name="check" :size="15" class="dd-ck" />
        </button>
        <div v-if="!norm.length" class="dd-none">No options</div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dd { position: relative; }
.dd-btn { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; height: 36px; padding: 0 12px; border: 1px solid var(--border-strong); background: var(--surface); color: var(--ink); border-radius: var(--r); font-size: 13px; text-align: left; transition: border-color .15s, box-shadow .15s; }
/* Disabled reads the same as a disabled .input: the chosen value must stay readable,
   because on a predefined widget this field exists precisely so you can SEE it. */
.dd-btn:disabled { background: var(--surface-2); color: var(--ink-2); border-color: var(--border); cursor: default; opacity: 1; }
.dd-btn:disabled :deep(.ico) { opacity: .45; }
.dd-sm .dd-btn { height: 32px; font-size: 13px; border-radius: 4px; padding: 0 10px; }
.dd-btn:hover { border-color: #c7cad9; }
.dd.open .dd-btn { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.dd-val { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-val.ph { color: var(--muted-2); }
.dd-chev { color: var(--muted); transition: transform .15s; flex: none; }
.dd.open .dd-chev { transform: rotate(180deg); }
.dd-back { position: fixed; inset: 0; z-index: 60; }
.dd-menu { position: absolute; z-index: 70; top: calc(100% + 5px); left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh-pop); padding: 5px; max-height: 240px; overflow: auto; }
.dd-opt { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 8px 10px; border: none; background: transparent; border-radius: 4px; font-size: 13px; color: var(--ink-2); text-align: left; }
.dd-opt:hover { background: var(--surface-2); }
.dd-opt.on { color: var(--primary-700); font-weight: 500; }
.dd-ck { color: var(--primary); flex: none; }
.dd-none { padding: 10px; text-align: center; color: var(--muted-2); font-size: 13px; }
.ellip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-pop-enter-active { transition: opacity .12s ease, transform .12s ease; }
.dd-pop-enter-from { opacity: 0; transform: translateY(-4px); }
</style>
