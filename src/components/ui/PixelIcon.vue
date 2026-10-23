<script setup lang="ts">
// Icon pixel art vẽ bằng SVG (mỗi ô 1 hình vuông), sắc nét ở mọi kích thước.
import { computed } from 'vue'
import { ICONS, PAL } from '../../game/pixelIcons'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 3 })
const grid = computed(() => ICONS[props.name] || ICONS.coin)
const w = computed(() => Math.max(...grid.value.map((r) => r.length)))
const cells = computed(() => {
  const out: { x: number; y: number; c: string }[] = []
  grid.value.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out.push({ x, y, c: PAL[ch] || '#f0f' }) }))
  return out
})
</script>

<template>
  <svg class="pxi" :width="w * size" :height="grid.length * size" :viewBox="`0 0 ${w} ${grid.length}`" shape-rendering="crispEdges" aria-hidden="true">
    <rect v-for="(p, i) in cells" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.c" />
  </svg>
</template>

<style scoped>
.pxi { display: inline-block; vertical-align: middle; flex: none; }
</style>
