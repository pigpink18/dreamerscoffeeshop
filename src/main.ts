import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { unlockAudio } from './game/audio'

createApp(App).mount('#app')

// Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên
document.addEventListener('pointerdown', unlockAudio, { passive: true })

// Chặn zoom bằng 2 ngón / double-tap trên iOS để cảm giác như app thật
document.addEventListener('gesturestart', (e) => e.preventDefault())
let lastTouch = 0
document.addEventListener('touchend', (e) => {
  const now = Date.now()
  if (now - lastTouch < 300) e.preventDefault()
  lastTouch = now
}, { passive: false })
