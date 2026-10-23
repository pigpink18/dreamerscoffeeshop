<script setup lang="ts">
import { ui } from '../game/store'
import PixelIcon from './ui/PixelIcon.vue'
const ICON: Record<string, string> = { info: 'chat', bad: 'warn', good: 'coin', say: 'chat', rap: 'mic', heart: 'heart' }
</script>

<template>
  <div class="toasts">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.kind"><PixelIcon :name="ICON[t.kind] || 'chat'" :size="2" /><span>{{ t.text }}</span></div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--safe-top) + 78px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 40;
}
.toast {
  display: flex; align-items: center; gap: 8px;
  background: #3b2a20;
  color: #fff;
  padding: 8px 12px 10px;
  font-weight: 800;
  font-size: 13px;
  max-width: calc(100% - 28px);
  line-height: 1.35;
  box-shadow: -3px 0 0 0 #1f140d, 3px 0 0 0 #1f140d, 0 -3px 0 0 #1f140d, 0 3px 0 0 #1f140d, inset 0 -3px 0 rgba(0, 0, 0, 0.25), 0 6px 0 rgba(0, 0, 0, 0.18);
}
.toast.bad { background: #c0392b; }
.toast.good { background: #2f9e6b; }
.toast.say { background: #fffaf0; color: var(--ink); }
.toast.rap { background: #4b2a7a; color: #fff; font-style: italic; }
.toast.heart { background: #fff1c4; color: #6b4a00; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px) scale(0.95); }
.toast-leave-to { opacity: 0; }
</style>
