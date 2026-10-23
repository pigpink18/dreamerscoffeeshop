<script setup lang="ts">
// Chân dung nhân vật (khách quen, người cần ly treo…) vẽ lại từ nhân vật trong game
import { ref, onMounted, watch } from 'vue'
import { drawPerson, type Mood } from '../../game/pixel'
import type { Look } from '../../game/data'

const props = withDefaults(defineProps<{ look: Look; mood?: Mood; scale?: number; hidden?: boolean }>(), { mood: 'neutral', scale: 2, hidden: false })
const cv = ref<HTMLCanvasElement | null>(null)
function draw() {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.clearRect(0, 0, 18, 18)
  drawPerson(c, props.look, 1, 2, props.mood, false)
}
onMounted(draw)
watch(() => [props.look, props.mood], draw, { deep: true })
</script>

<template>
  <canvas ref="cv" width="18" height="18" class="pp" :class="{ hidden }" :style="{ width: 18 * scale + 'px', height: 18 * scale + 'px' }" />
</template>

<style scoped>
.pp { image-rendering: pixelated; image-rendering: crisp-edges; display: block; flex: none; }
.pp.hidden { filter: brightness(0) opacity(0.35); }
</style>
