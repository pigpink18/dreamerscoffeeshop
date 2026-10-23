<script setup lang="ts">
import PixelIcon from './ui/PixelIcon.vue'
import { ref, onMounted } from 'vue'

// Gợi ý "cài app" – Android dùng beforeinstallprompt, iOS hướng dẫn thủ công
const DISMISS_KEY = 'dreamers-install-dismissed'
const show = ref(false)
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
let deferred: any = null

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true

onMounted(() => {
  if (standalone() || localStorage.getItem(DISMISS_KEY)) return
  if (isIOS) show.value = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    show.value = true
  })
})

async function install() {
  if (!deferred) return
  deferred.prompt()
  await deferred.userChoice
  deferred = null
  show.value = false
}

function dismiss() {
  show.value = false
  try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* bỏ qua */ }
}
</script>

<template>
  <div v-if="show" class="card hint">
    <PixelIcon name="phone" :size="4" />
    <div class="grow">
      <b>Cài game như app</b>
      <div v-if="isIOS" class="muted small">Bấm <b>Chia sẻ</b> <PixelIcon name="up" :size="2" /> rồi <b>Thêm vào MH chính</b></div>
      <div v-else class="muted small">Chơi toàn màn hình, không cần mạng</div>
    </div>
    <button v-if="!isIOS" class="btn sm accent" @click="install">CÀI ĐẶT</button>
    <button class="close" @click="dismiss" aria-label="Đóng"><PixelIcon name="cross" :size="2" /></button>
  </div>
</template>

<style scoped>
.hint { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; background: #fff3dc; --paper-shade: #f3e2a8; }
.small { font-size: 13px; }
.close { color: var(--muted); font-size: 16px; padding: 6px; }
</style>
