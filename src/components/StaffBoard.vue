<script setup lang="ts">
// Dãy quầy phía sau do nhân viên lo – cảnh pixel nhỏ (cùng bảng màu cảnh quán):
// nhân viên đứng sau quầy, đang pha thì lắc shaker + bóng thoại có ly đang pha và thanh tiến độ, rảnh thì lau quầy.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ui, staffServeTime } from '../game/store'
import { px, box, CZ, OUT, drawBarista, drawCup, woodShelf, glassJar, BARISTA_NAMES, type Ctx } from '../game/pixel'
import { recipeCup } from '../game/text'

const W = 176, H = 74, Y = 54 // Y: mép mặt quầy
const cv = ref<HTMLCanvasElement>()
const wrap = ref<HTMLDivElement>()
let ctx: Ctx | null = null, scale = 3, raf = 0, ro: ResizeObserver | null = null

/** vị trí (x trái) của nhân viên i khi có n người: chia đều dãy quầy */
const slotX = (i: number, n: number) => Math.round((W / n) * (i + 0.5)) - 8

function resize() {
  const el = wrap.value, c = cv.value
  if (!el || !c) return
  const w = el.clientWidth
  if (w < 50) return
  scale = Math.max(1, Math.ceil((w * (window.devicePixelRatio || 1)) / W))
  if (c.width !== W * scale) { c.width = W * scale; c.height = H * scale }
  ctx = c.getContext('2d')
}
function bubble(c: Ctx, cx: number, top: number, r: string | null, p: number) {
  // bóng thoại pixel: ly đang pha + thanh tiến độ 10 ô
  const bw = 30, bx = cx - bw / 2
  box(c, bx, top, bw, 20, '#fffaf0', OUT)
  px(c, cx - 2, top + 20, 5, 1, OUT); px(c, cx - 1, top + 19, 3, 2, '#fffaf0'); px(c, cx, top + 21, 1, 1, OUT)
  if (r) {
    c.save(); c.translate(bx + 3, top + 3); c.scale(0.62, 0.62); drawCup(c, recipeCup(r as never), 0, 2); c.restore()
    for (let k = 0; k < 4; k++) { px(c, bx + 13 + k * 4, top + 12, 4, 5, OUT); px(c, bx + 14 + k * 4, top + 13, 2, 3, k < Math.ceil(p * 4) ? '#3fd18b' : '#e6d6c2') }
    px(c, bx + 13, top + 6, 13, 1, '#c9b49a'); px(c, bx + 13, top + 9, 9, 1, '#c9b49a') // dòng "ghi chú"
  } else {
    // rảnh: nốt nhạc ngân nga
    px(c, bx + 11, top + 5, 1, 8, OUT); px(c, bx + 11, top + 5, 4, 1, OUT); px(c, bx + 9, top + 12, 3, 2, OUT)
    px(c, bx + 18, top + 7, 1, 6, OUT); px(c, bx + 16, top + 12, 3, 2, OUT)
  }
}
function draw(t: number) {
  const c = ctx
  if (!c) return
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  // tường kem sọc + gờ gỗ + ốp chân tường xanh (như cảnh quán)
  px(c, 0, 0, W, Y, '#f0dcb4')
  for (let x = 0; x < W; x += 8) px(c, x, 0, 1, 38, '#e6cb9c')
  px(c, 0, 0, W, 2, CZ.w1); px(c, 0, 2, W, 1, CZ.w3)
  px(c, 0, 38, W, 1, CZ.ink); px(c, 0, 39, W, 1, CZ.w5); px(c, 0, 40, W, 1, CZ.w1)
  px(c, 0, 41, W, Y - 41, CZ.t1)
  for (let x = 2; x < W; x += 14) { px(c, x, 43, 11, Y - 45, CZ.t0); px(c, x + 1, 44, 10, Y - 46, CZ.t1) }
  // kệ hũ 2 góc
  woodShelf(c, 4, 26, 22); ['#7fb34d', '#e0a03a', '#9a5b34'].forEach((j, i) => glassJar(c, 6 + i * 6, 18, j))
  woodShelf(c, W - 26, 26, 22); ['#f4a46e', '#9fd3ea', '#e8506a'].forEach((j, i) => glassJar(c, W - 24 + i * 6, 18, j))
  // nhân viên + bóng thoại
  const n = Math.max(1, ui.staffProgress.length)
  for (let i = 0; i < ui.staffProgress.length; i++) {
    const x = slotX(i, n), r = ui.staffRecipe[i] ?? null
    const p = Math.min(1, (ui.staffProgress[i] ?? 0) / staffServeTime.value)
    drawBarista(c, x, 30, !!r, t, i, p)
    bubble(c, x + 8, 1, r, p)
  }
  // mặt quầy gỗ + thân quầy ô panel (như quầy chính)
  px(c, 0, Y - 1, W, 1, CZ.ink); px(c, 0, Y, W, 4, CZ.w3); px(c, 0, Y, W, 1, CZ.w5)
  for (let x = 3; x < W; x += 13) px(c, x, Y + 2, 6, 1, CZ.w4)
  px(c, 0, Y + 4, W, 1, CZ.w1); px(c, 0, Y + 5, W, 1, CZ.ink)
  px(c, 0, Y + 6, W, H - Y - 6, CZ.w2)
  for (let x = 2; x < W; x += 5) px(c, x, Y + 6, 1, H - Y - 6, CZ.w1)
  px(c, 0, Y + 6, W, 2, CZ.w0)
}
function frame(now: number) { raf = requestAnimationFrame(frame); draw(now / 1000) }
onMounted(() => {
  resize(); ro = new ResizeObserver(resize); if (wrap.value) ro.observe(wrap.value)
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); ro?.disconnect() })
const n = () => Math.max(1, ui.staffProgress.length)
</script>

<template>
  <div ref="wrap" class="sboard">
    <canvas ref="cv" class="pixel" />
    <!-- bảng tên gỗ dưới chân từng nhân viên -->
    <span v-for="(_, i) in ui.staffProgress" :key="i" class="plate" :style="{ left: ((slotX(i, n()) + 8) / W) * 100 + '%' }">{{ BARISTA_NAMES[i % 3] }}</span>
  </div>
</template>

<style scoped>
.sboard { position: relative; margin: 6px 3px 0; box-shadow: var(--px-border), 0 6px 0 rgba(59, 42, 32, 0.25); line-height: 0; }
.sboard canvas { display: block; width: 100%; height: auto; aspect-ratio: 176 / 74; image-rendering: pixelated; image-rendering: crisp-edges; }
.plate { position: absolute; bottom: 7%; transform: translateX(-50%); line-height: 1; padding: 3px 7px 4px; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #ffe8b8; background: #6f4630; box-shadow: var(--px-border-2), inset 0 -2px 0 #4a2e1f; text-shadow: 0 1px 0 #3b2a20; }
</style>
