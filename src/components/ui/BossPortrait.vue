<script setup lang="ts">
// Chân dung boss (đầu + vai) vẽ lại từ sprite trong game
import { ref, onMounted, watch } from 'vue'
import { drawBoss } from '../../game/bossSprites'
import type { Mood } from '../../game/pixel'

const props = withDefaults(defineProps<{ idx: number; mood?: Mood; scale?: number }>(), { mood: 'grumpy', scale: 3 })
const cv = ref<HTMLCanvasElement | null>(null)
function draw() {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.clearRect(0, 0, 24, 26)
  drawBoss(c, props.idx, 0, -2, props.mood, false)
}
onMounted(draw)
watch(() => [props.idx, props.mood], draw)
</script>

<template>
  <canvas ref="cv" width="24" height="26" class="boss-pt" :style="{ width: 24 * scale + 'px', height: 26 * scale + 'px' }" />
</template>

<style scoped>
.boss-pt { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }
</style>
