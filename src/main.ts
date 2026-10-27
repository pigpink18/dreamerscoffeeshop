import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { unlockAudio } from './game/audio'
import { initMeta } from './game/meta'

initMeta()
createApp(App).mount('#app')

// Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên
document.addEventListener('pointerdown', unlockAudio, { passive: true })

// Chặn zoom 2 ngón trên iOS. (Zoom double-tap đã tắt bằng CSS touch-action: manipulation,
// KHÔNG chặn touchend nữa – trước đây chặn làm mất cú chạm thứ 2 khi bấm nhanh.)
document.addEventListener('gesturestart', (e) => e.preventDefault())

// iOS Safari chỉ hiện hiệu ứng :active (nút lún xuống) khi trang có lắng nghe touchstart
document.addEventListener('touchstart', () => {}, { passive: true })

// Chiều cao app = đúng phần màn hình trình duyệt cho phép vẽ (không vượt ra ngoài → không bị cắt mất thanh tab).
// Trên iPhone chế độ app, phần đáy iOS chừa lại sẽ có màu nâu (background_color trong manifest) trùng thanh tab.
function fitScreen() {
  document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`)
}
fitScreen()
window.addEventListener('resize', fitScreen)
window.addEventListener('orientationchange', () => setTimeout(fitScreen, 300))
window.addEventListener('pageshow', fitScreen)
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(fitScreen, 100) })
setTimeout(fitScreen, 500) // iOS đôi khi báo sai kích thước ngay lúc mở app
