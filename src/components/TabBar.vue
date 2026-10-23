<script setup lang="ts">
import { computed } from 'vue'
import { ui, save, canMake, vibrate, type Tab } from '../game/store'
import PixelIcon from './ui/PixelIcon.vue'

const lowStock = computed(() => !save.unlocked.some((r) => canMake(r)) || save.unlocked.some((r) => !canMake(r)))

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'shop', icon: 'shop', label: 'Quán' },
  { id: 'stock', icon: 'crate', label: 'Kho' },
  { id: 'menu', icon: 'menu', label: 'Menu' },
  { id: 'app', icon: 'heart', label: 'Khách' },
  { id: 'upgrade', icon: 'up', label: 'Nâng cấp' },
]

function go(t: Tab) {
  if (ui.tab !== t) vibrate(5)
  ui.tab = t
}
</script>

<template>
  <nav class="tabbar">
    <button v-for="t in tabs" :key="t.id" class="tab" :class="{ active: ui.tab === t.id }" @click="go(t.id)">
      <span class="icon"><PixelIcon :name="t.icon" :size="3" /></span>
      <span class="lbl">{{ t.label }}</span>
      <span v-if="t.id === 'stock' && lowStock" class="dot" />
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex; gap: 6px;
  background:
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.06) 0 2px, transparent 2px 9px),
    #6f4630;
  box-shadow: 0 -3px 0 #3b2a20, inset 0 3px 0 #8a5a3c;
  padding: 8px 8px calc(var(--safe-bottom) + 8px);
  z-index: 2;
}
.tab {
  flex: 1; position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 0 7px;
  color: #e6c79c;
  background: #5a3a28;
  box-shadow: var(--px-border-2), inset 0 -3px 0 #4a2e1f;
  transition: transform 0.1s;
}
.tab .icon { height: 27px; display: flex; align-items: center; filter: saturate(0.35) brightness(0.85); transition: transform 0.15s, filter 0.15s; }
.tab .lbl { font-size: 10px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
.tab.active {
  color: var(--ink); background: #f2c14e; transform: translateY(-4px);
  box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 4px 0 #3b2a20;
}
.tab.active .icon { filter: none; transform: scale(1.08); }
.dot {
  position: absolute; top: 3px; right: 6px;
  width: 9px; height: 9px; background: #e0524a;
  box-shadow: 0 0 0 2px #3b2a20;
  animation: dotBlink 1s steps(2) infinite;
}
@keyframes dotBlink { 50% { opacity: 0.4; } }
</style>
