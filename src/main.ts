import { createApp } from 'vue'

// Lỗi JS hiện thẳng lên màn hình (hàm __showErr khai báo sẵn trong index.html, bắt cả lỗi lúc nạp module)
const showError = (msg: string) => (window as any).__showErr?.(msg)
import './style.css'
import App from './App.vue'
import { unlockAudio } from './game/audio'
import { initMeta } from './game/meta'
import { initStory } from './game/story'
import { initKitchen } from './game/kitchen'

initMeta()
initStory() // sau initMeta: bọc thêm vào các hook của meta
initKitchen()
const app = createApp(App)
app.config.errorHandler = (err, _vm, info) => { console.error(err); showError(`${info}: ${(err as Error)?.stack || err}`) }
app.mount('#app')
// chạy local: ?dev=bep vào thẳng bếp (src/game/devtools.ts) – bản build bỏ hẳn đoạn này
if (import.meta.env.DEV) import('./game/devtools').then((m) => m.devBoot())

// Trình duyệt chỉ cho phát âm thanh sau lần chạm đầu tiên
document.addEventListener('pointerdown', unlockAudio, { passive: true })

// Chặn zoom 2 ngón trên iOS. (Zoom double-tap đã tắt bằng CSS touch-action: manipulation,
// KHÔNG chặn touchend nữa – trước đây chặn làm mất cú chạm thứ 2 khi bấm nhanh.)
document.addEventListener('gesturestart', (e) => e.preventDefault())

// iOS Safari chỉ hiện hiệu ứng :active (nút lún xuống) khi trang có lắng nghe touchstart
document.addEventListener('touchstart', () => {}, { passive: true })

// Chiều cao app = đúng phần màn hình trình duyệt cho phép vẽ (không vượt ra ngoài → không bị cắt mất thanh tab).
// Trên iPhone chế độ app, phần đáy iOS chừa lại sẽ có màu nâu (background_color trong manifest) trùng thanh tab.
// iOS 26 (app ngoài màn hình chính): khung cố định (position: fixed) theo innerHeight không phủ được dải đáy màn hình.
// Kiểu "tràn viền" (mặc định khi chạy như app): bỏ khung cố định, cho trang cao 100vh (ở chế độ app vh có tính cả vùng đáy)
// → thanh tab nằm sát mép dưới. Nếu máy nào bị cắt thanh tab, tắt "Tràn viền" trong Cài đặt để về kiểu cũ.
const standalone = () => (navigator as any).standalone === true || matchMedia('(display-mode: standalone)').matches
export const edgeMode = () => standalone() && localStorage.getItem('dc-edge') !== '0'
function fitScreen() {
  const root = document.documentElement
  const edge = edgeMode()
  root.classList.toggle('edge', edge)
  const h = window.innerHeight
  root.style.setProperty('--app-h', edge ? '100vh' : `${h}px`)
  const portrait = h >= window.innerWidth
  const screenH = portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width)
  const gap = standalone() && !edge ? screenH - h : 0 // kiểu cũ: phần đáy iOS không cho vẽ → không chừa safe-area lần 2
  root.style.setProperty('--tab-pad', gap > 16 ? '8px' : 'max(8px, calc(env(safe-area-inset-bottom, 0px) - 4px))')
}
;(window as any).__fitScreen = fitScreen
fitScreen()
window.addEventListener('resize', fitScreen)
window.addEventListener('orientationchange', () => setTimeout(fitScreen, 300))
window.addEventListener('pageshow', fitScreen)
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(fitScreen, 100) })
setTimeout(fitScreen, 500) // iOS đôi khi báo sai kích thước ngay lúc mở app

// Chống lệch vùng chạm trên iPhone: app nằm trong khung cố định nên cả trang và các vùng "overflow: hidden"
// không bao giờ được cuộn. Nếu iOS lỡ cuộn chúng (bàn phím bật/tắt, vuốt dội, focus…), hình vẫn đứng yên
// nhưng vùng nhận chạm bị lệch → phải bấm lệch xuống mới ăn. Thấy cuộn là kéo về 0 ngay.
function unshift() {
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0)
}
window.addEventListener('scroll', unshift, { passive: true })
window.visualViewport?.addEventListener('resize', () => { unshift(); fitScreen() })
document.addEventListener('focusout', () => setTimeout(() => { unshift(); fitScreen() }, 50))
document.addEventListener('scroll', (e) => {
  const el = e.target
  if (!(el instanceof HTMLElement) || !(el.scrollTop || el.scrollLeft)) return
  const cs = getComputedStyle(el)
  const fixedX = cs.overflowX === 'hidden' || cs.overflowX === 'clip'
  const fixedY = cs.overflowY === 'hidden' || cs.overflowY === 'clip'
  if (fixedX && el.scrollLeft) el.scrollLeft = 0
  if (fixedY && el.scrollTop) el.scrollTop = 0
}, { capture: true, passive: true })

// Android/Chrome: giữ lại sự kiện "cài app" phát ra sớm để màn chọn ngôn ngữ hiện nút cài 1 chạm
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); (window as any).__installPrompt = e })
