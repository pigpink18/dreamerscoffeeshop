<script setup lang="ts">
// Ảnh xem trước mặt bằng (vẽ pixel cảnh quán không có khách)
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { save } from '../../game/store'
import { drawRoom, drawCounter, drawCorgi, SCENE_W, SCENE_H, COUNTER_Y, type Ctx } from '../../game/pixel'
import { drawRoomMid, drawRoomBig, drawCounterMid, drawCounterBig, drawStools, drawDecorItems, drawSouvenirShelf } from '../../game/rooms'
import { drawSign, SIGN_W } from '../../game/sign'

const props = withDefaults(defineProps<{ premise: number; animate?: boolean; corgi?: boolean }>(), { animate: false, corgi: true })
const cv = ref<HTMLCanvasElement | null>(null)
const K = 4
let raf = 0
function draw(now = 0) {
  const c = cv.value?.getContext('2d') as Ctx | null
  if (!c) return
  const t = now / 1000
  c.setTransform(K, 0, 0, K, 0, 0)
  c.imageSmoothingEnabled = false
  const P = props.premise
  if (P === 2) drawRoomBig(c, 0.3, 'sunny', t)
  else if (P === 1) drawRoomMid(c, 0.3, 'sunny', t)
  else drawRoom(c, 0.3, 'sunny', t, 5)
  if (P === save.meta.premise) drawDecorItems(c, save.meta.decor, P, t)
  const full = { croissant: 9, bongLan: 9, cupcake: 9, tiramisu: 9, lyGom: 1, binhGom: 1, postcard: 1, mocKhoa: 1 } // xem trước: kệ đầy hàng
  if (P === 2) { drawCounterBig(c, t, full); drawSign(c, 4, COUNTER_Y + 6, t, 0); drawStools(c) }
  else if (P === 1) { drawCounterMid(c); drawSign(c, (SCENE_W - SIGN_W) / 2 - 6, COUNTER_Y + 6, t, 0); drawSouvenirShelf(c, full) }
  else { drawCounter(c); drawSign(c, (SCENE_W - SIGN_W) / 2, COUNTER_Y + 6, t, 0) }
  if (props.corgi) drawCorgi(c, P === 2 ? 78 : 2, SCENE_H - 18, t, 'sit', true, save.meta.wear)
  if (props.animate) raf = requestAnimationFrame(draw)
}
onMounted(() => { const el = cv.value!; el.width = SCENE_W * K; el.height = SCENE_H * K; raf = requestAnimationFrame(draw) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
watch(() => [save.meta.wear, save.meta.decor], () => { if (!props.animate) draw(performance.now()) }, { deep: true })
</script>

<template>
  <canvas ref="cv" class="room" />
</template>

<style scoped>
.room { display: block; width: 100%; aspect-ratio: 128 / 92; image-rendering: pixelated; image-rendering: crisp-edges; box-shadow: var(--px-border-2); }
</style>
