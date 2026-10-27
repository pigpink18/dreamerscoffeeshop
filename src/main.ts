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

// iPhone chế độ app (Thêm vào MH chính): có lúc chiều cao trang bị hụt đúng bằng thanh trạng thái
// → đo chiều cao màn hình thật và cho app phủ kín.
function fitScreen() {
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone || matchMedia('(display-mode: standalone)').matches
  const h = standalone ? Math.max(window.innerHeight, screen.height) : window.innerHeight
  document.documentElement.style.setProperty('--app-h', `${h}px`)
}
fitScreen()
window.addEventListener('resize', fitScreen)
window.addEventListener('orientationchange', () => setTimeout(fitScreen, 300))
window.addEventListener('pageshow', fitScreen)
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(fitScreen, 100) })
setTimeout(fitScreen, 500) // iOS đôi khi báo sai kích thước ngay lúc mở app
