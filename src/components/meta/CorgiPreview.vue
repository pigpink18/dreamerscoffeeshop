<script setup lang="ts">
// Cáo mặc đồ (xem trước ở Tiệm của Cáo)
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { save } from '../../game/store'
import { drawCorgi, type Ctx } from '../../game/pixel'

const props = withDefaults(defineProps<{ scale?: number; still?: boolean; wear?: Partial<Record<'head' | 'eyes' | 'neck' | 'body', string>> }>(), { scale: 6, still: false })
const cv = ref<HTMLCanvasElement | null>(null)
let raf = 0
function draw(now: number) {
  const c = cv.value?.getContext('2d') as Ctx | null
  if (c) {
    c.setTransform(4, 0, 0, 4, 0, 0)
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, 34, 26)
    drawCorgi(c, 4, 7, now / 1000, 'stand', true, props.wear ?? save.meta.wear)
  }
  if (!props.still) raf = requestAnimationFrame(draw)
}
watch(() => save.meta.wear, () => { if (props.still) draw(0) }, { deep: true })
onMounted(() => { const el = cv.value!; el.width = 34 * 4; el.height = 26 * 4; raf = requestAnimationFrame(draw) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="cv" class="corgi" :style="{ width: 34 * (scale / 2) + 'px', height: 26 * (scale / 2) + 'px' }" />
</template>

<style scoped>
.corgi { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }
</style>
