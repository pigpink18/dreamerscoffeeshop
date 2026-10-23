<script setup lang="ts">
// Số kiểu game: font pixel 5x7 vẽ bằng SVG + bóng đổ cứng. Hỗ trợ 0-9 . , + - đ k
import { computed } from 'vue'

const F: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['0', '0', '0', '0', '0', '1', '1'],
  ',': ['0', '0', '0', '0', '0', '1', '1'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  'đ': ['00010', '00111', '00010', '01110', '10010', '10010', '01110'],
  'k': ['10000', '10000', '10010', '10100', '11000', '10100', '10010'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
}
const props = withDefaults(defineProps<{ text: string; size?: number; color?: string; shadow?: string; light?: string }>(), { size: 4, color: '#2f9e6b', shadow: '#3b2a20', light: '' })
const layout = computed(() => {
  const cells: { x: number; y: number }[] = []
  let x = 0
  for (const ch of String(props.text)) {
    const g = F[ch] || F[' ']
    g.forEach((row, y) => [...row].forEach((b, k) => { if (b === '1') cells.push({ x: x + k, y }) }))
    x += g[0].length + 1
  }
  return { cells, w: Math.max(1, x - 1) }
})
</script>

<template>
  <svg class="pxn" :width="(layout.w + 1) * size" :height="8 * size" :viewBox="`0 0 ${layout.w + 1} 8`" shape-rendering="crispEdges" :aria-label="text" role="img">
    <rect v-for="(p, i) in layout.cells" :key="'s' + i" :x="p.x" :y="p.y + 1" width="1" height="1" :fill="shadow" />
    <rect v-for="(p, i) in layout.cells" :key="'c' + i" :x="p.x" :y="p.y" width="1" height="1" :fill="light && p.y < 2 ? light : color" />
  </svg>
</template>

<style scoped>
.pxn { display: inline-block; vertical-align: middle; }
</style>
