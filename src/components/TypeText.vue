<script setup lang="ts">
// Chữ hiện ra từng chữ như khách đang nói (kèm tiếng "bíp" nhỏ), dừng lâu hơn ở dấu câu.
// Chạm vào để hiện hết ngay. Phần chưa hiện vẫn giữ chỗ (ẩn) để khung chat không bị giật kích thước.
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { talkBlip } from '../game/audio'
import { noEmoji } from '../game/text'

const props = withDefaults(defineProps<{ text: string; speed?: number; pitch?: number; instant?: boolean }>(), { speed: 32, pitch: 560, instant: false })
const emit = defineEmits<{ done: [] }>()

const chars = computed(() => Array.from(noEmoji(props.text || '')))
const shown = ref(0)
const finished = computed(() => shown.value >= chars.value.length)
let timer = 0
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function stop() { if (timer) { clearTimeout(timer); timer = 0 } }
function finish() { stop(); shown.value = chars.value.length; emit('done') }
function tick() {
  if (shown.value >= chars.value.length) return finish()
  shown.value++
  const ch = chars.value[shown.value - 1]
  if (/[\p{L}\p{N}]/u.test(ch) && shown.value % 2) talkBlip(props.pitch)
  const pause = /[.!?…]/.test(ch) ? 7 : /[,;:]/.test(ch) ? 4 : 1
  timer = window.setTimeout(tick, props.speed * pause)
}
function run() {
  stop()
  if (props.instant || reduce) return finish()
  shown.value = 0
  timer = window.setTimeout(tick, 120)
}
/** chạm để hiện hết */
function skip() { if (!finished.value) finish() }
defineExpose({ skip, finished })

watch(() => props.text, run, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <span class="tt" @click="skip"><span>{{ chars.slice(0, shown).join('') }}</span><span v-if="!finished" class="cursor" /><span class="rest" aria-hidden="true">{{ chars.slice(shown).join('') }}</span></span>
</template>

<style scoped>
.rest { visibility: hidden; }
.cursor {
  display: inline-block; width: 6px; height: 2px; margin-right: -6px; vertical-align: baseline;
  background: currentColor; animation: cur 0.5s steps(2) infinite;
}
@keyframes cur { 50% { opacity: 0; } }
</style>
