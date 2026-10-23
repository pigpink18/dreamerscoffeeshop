<script setup lang="ts">
// Icon món: vẽ đúng ly thành phẩm của công thức (các lớp màu, đá, kem…) bằng pixel art
import { ref, onMounted, watch } from 'vue'
import { drawCup } from '../../game/pixel'
import { recipeCup } from '../../game/text'
import type { RecipeId } from '../../game/data'

const props = withDefaults(defineProps<{ id: RecipeId; scale?: number; gray?: boolean }>(), { scale: 2, gray: false })
const cv = ref<HTMLCanvasElement | null>(null)
function draw() {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.clearRect(0, 0, 16, 22)
  drawCup(c, recipeCup(props.id), 2, 4)
}
onMounted(draw)
watch(() => props.id, draw)
</script>

<template>
  <canvas ref="cv" width="16" height="22" class="drink" :class="{ gray }" :style="{ width: 16 * scale + 'px', height: 22 * scale + 'px' }" />
</template>

<style scoped>
.drink { image-rendering: pixelated; image-rendering: crisp-edges; display: block; flex: none; }
.drink.gray { filter: grayscale(1) opacity(0.55); }
</style>
