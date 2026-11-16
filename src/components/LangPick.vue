<script setup lang="ts">
// Màn chọn ngôn ngữ – hiện đầu tiên khi mở game lần đầu (trước màn chào mừng & tạo chủ quán).
// Chữ song ngữ cùng lúc. Chọn xong: lưu hồ sơ ngôn ngữ; đổi khác ngôn ngữ hiện tại thì tải lại trang để áp dụng.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { unlockAudio, sfx } from '../game/audio'
import { px, drawCorgi, type Ctx } from '../game/pixel'
import { LANG, GENDER, saveProfile, type Lang } from '../game/i18n'
import logoUrl from '../assets/logo.png'

const emit = defineEmits<{ done: [] }>()

// ---- gợi ý thêm vào màn hình chính (chơi như app) – ẩn khi đã mở dạng app ----
const isApp = (navigator as any).standalone === true || matchMedia('(display-mode: standalone)').matches
const ua = navigator.userAgent
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const installEvt = ref<any>((window as any).__installPrompt ?? null) // Android/Chrome: cài 1 chạm
const onBip = (e: Event) => { e.preventDefault(); installEvt.value = e }
window.addEventListener('beforeinstallprompt', onBip)
async function install() {
  const e = installEvt.value
  if (!e) return
  e.prompt()
  try { await e.userChoice } catch { /* bỏ qua */ }
  installEvt.value = null
}
const picked = ref<Lang | null>(null)

function pick(l: Lang) {
  if (picked.value) return
  picked.value = l
  try { unlockAudio(); sfx('done') } catch { /* bỏ qua */ }
  const reload = saveProfile(l, GENDER)
  try { localStorage.setItem('dc-lang-picked', '1') } catch { /* bỏ qua */ }
  setTimeout(() => {
    try { sessionStorage.setItem('dc-lang-once', '1') } catch { /* bỏ qua */ }
    if (reload || l !== LANG) location.reload(); else emit('done')
  }, 280)
}

// Cáo ngồi vẫy đuôi trên bậc gỗ
const cv = ref<HTMLCanvasElement | null>(null)
const W = 48, H = 30
let raf = 0
function draw(t: number) {
  const c = cv.value?.getContext('2d') as Ctx | null
  if (!c) return
  c.imageSmoothingEnabled = false
  c.clearRect(0, 0, W, H)
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(24, 26, 13, 2, 0, 0, Math.PI * 2); c.fill()
  drawCorgi(c, 11, 8, t, 'sit', true, { neck: 'bow' })
  if (Math.floor(t * 2) % 2 === 0) { const hx = 35, hy = 2; px(c, hx, hy, 2, 2, '#ff7a8a'); px(c, hx + 3, hy, 2, 2, '#ff7a8a'); px(c, hx, hy + 2, 5, 1, '#ff7a8a'); px(c, hx + 1, hy + 3, 3, 1, '#ff7a8a'); px(c, hx + 2, hy + 4, 1, 1, '#ff7a8a') }
}
function loop(now: number) { draw(now / 1000); raf = requestAnimationFrame(loop) }
onMounted(() => { raf = requestAnimationFrame(loop) })
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('beforeinstallprompt', onBip) })
</script>

<template>
  <div class="langpick">
    <div class="wrap">
      <img :src="logoUrl" class="logo" alt="Dreamers Coffee" />
      <b class="tname">DREAMERS COFFEE</b>
      <canvas ref="cv" :width="W" :height="H" class="cv" />
      <div class="board">
        <i class="nail" /><i class="nail r" />
        <p class="q">Chọn ngôn ngữ<span>Choose your language</span></p>
        <button class="opt" :class="{ on: picked === 'vi' }" @click="pick('vi')">
          <i class="flag vn"><b /></i>
          <span class="nm">Tiếng Việt<small>Vietnamese</small></span>
          <span class="go">▶</span>
        </button>
        <button class="opt" :class="{ on: picked === 'en' }" @click="pick('en')">
          <i class="flag en"><b /></i>
          <span class="nm">English<small>Tiếng Anh</small></span>
          <span class="go">▶</span>
        </button>
      </div>
      <p class="note">Có thể đổi lại trong Cài đặt · You can change this later in Settings</p>
      <!-- thêm vào màn hình chính để chơi như app -->
      <div v-if="!isApp" class="a2hs">
        <span class="ic"><i /><b /></span>
        <div class="tx">
          <b>Thêm vào màn hình chính · Add to Home Screen</b>
          <template v-if="isIOS">
            <span>Bấm <em class="share" aria-label="Chia sẻ"><i /></em> <u>Chia sẻ</u> ở thanh dưới Safari → <u>Thêm vào MH chính</u> để chơi toàn màn hình như app.</span>
            <span class="en">Tap <em class="share"><i /></em> <u>Share</u> in Safari → <u>Add to Home Screen</u> to play full-screen like an app.</span>
          </template>
          <template v-else>
            <span>Mở menu <u>⋮</u> của trình duyệt → <u>Thêm vào màn hình chính</u> (hoặc <u>Cài đặt ứng dụng</u>) để chơi như app.</span>
            <span class="en">Open the browser menu <u>⋮</u> → <u>Add to Home screen</u> (or <u>Install app</u>) to play like an app.</span>
          </template>
          <button v-if="installEvt" class="inst" @click="install">CÀI ĐẶT APP · INSTALL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.langpick {
  position: absolute; inset: 0; z-index: 130; display: flex; flex-direction: column; align-items: center;
  background:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.14) 0 2px, transparent 2px 38px),
    #2a1b12;
  color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 12px) 18px calc(env(safe-area-inset-bottom, 0px) + 18px);
  overflow-y: auto;
}
.wrap { width: 100%; max-width: 400px; margin: auto 0; display: flex; flex-direction: column; align-items: center; }
.logo { width: 96px; height: 96px; image-rendering: pixelated; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 8px 0 10px rgba(0, 0, 0, 0.3); margin: 12px 0 18px; }
.tname { font-size: 16px; letter-spacing: 0.22em; color: #ffd77a; text-shadow: 0 2px 0 #1a100a; }
.cv { width: 144px; height: 90px; image-rendering: pixelated; margin: 6px 0 -6px; }
.board {
  position: relative; width: 100%; padding: 16px 14px 14px; display: flex; flex-direction: column; gap: 12px;
  background: repeating-linear-gradient(0deg, #a16b36 0 9px, #8d5c2e 9px 10px), #a16b36;
  box-shadow: var(--px-border), inset 0 -4px 0 #6f4630, inset 0 3px 0 #bf8a4a, 0 8px 0 rgba(0, 0, 0, 0.35);
}
.nail { position: absolute; top: 7px; left: 7px; width: 4px; height: 4px; background: #d5a534; box-shadow: 0 1px 0 #3b2a20; }
.nail.r { left: auto; right: 7px; }
.q { text-align: center; font-size: 15px; font-weight: 900; letter-spacing: 0.1em; color: #fff4dc; text-shadow: 0 2px 0 #4a2e1f; text-transform: uppercase; display: flex; flex-direction: column; gap: 2px; }
.q span { font-size: 11px; letter-spacing: 0.14em; color: #f1d9b3; }
.opt {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px 14px; text-align: left;
  background: #fff4dc; color: #3b2a20; box-shadow: var(--px-border-2), inset 0 -4px 0 #eed59b, 0 5px 0 rgba(0, 0, 0, 0.3);
  transition: transform 0.06s;
}
.opt:active, .opt.on { transform: translateY(3px); box-shadow: var(--px-border-2), inset 0 -2px 0 #eed59b, 0 2px 0 rgba(0, 0, 0, 0.3); }
.opt.on { background: #f2c14e; }
.nm { flex: 1; display: flex; flex-direction: column; font-size: 19px; font-weight: 900; line-height: 1.15; }
.nm small { font-size: 11px; font-weight: 700; color: #8a6a4f; letter-spacing: 0.04em; }
.go { font-size: 14px; color: #a16b36; }
.flag { position: relative; flex: none; width: 36px; height: 24px; box-shadow: 0 0 0 2px #261c1b, 0 3px 0 2px rgba(0,0,0,0.2); }
.flag.vn { background: #da251d; }
.flag.vn b { position: absolute; left: 10px; top: 4px; width: 16px; height: 16px; background: #ffde00;
  clip-path: polygon(50% 0, 62% 38%, 100% 38%, 69% 60%, 81% 100%, 50% 76%, 19% 100%, 31% 60%, 0 38%, 38% 38%); }
.flag.en { background: repeating-linear-gradient(180deg, #b22234 0 3.7px, #fff 3.7px 7.4px); }
.flag.en b { position: absolute; left: 0; top: 0; width: 15px; height: 13px; background: #3c3b6e; }
.a2hs { margin-top: 16px; width: 100%; display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #3b2618; box-shadow: var(--px-border-2), inset 0 -3px 0 #2a1a10; }
.a2hs .ic { position: relative; flex: none; width: 30px; height: 40px; background: #1f150f; box-shadow: 0 0 0 2px #e6c79c; margin-top: 2px; }
.a2hs .ic i { position: absolute; left: 7px; top: 9px; width: 16px; height: 16px; background: #ffd77a; box-shadow: 0 0 0 2px #261c1b; }
.a2hs .ic b { position: absolute; left: 10px; bottom: 3px; width: 10px; height: 2px; background: #e6c79c; }
.a2hs .tx { display: flex; flex-direction: column; gap: 5px; font-size: 12px; line-height: 1.45; color: #f1d9b3; }
.a2hs .tx > b { font-size: 12px; letter-spacing: 0.04em; color: #ffd77a; }
.a2hs .en { color: #b9997a; font-size: 11px; }
.a2hs u { text-decoration: none; font-weight: 900; color: #fff4dc; }
.share { position: relative; display: inline-block; width: 13px; height: 14px; vertical-align: -2px; border: 2px solid #8fc1ff; border-top-color: transparent; box-sizing: border-box; }
.share i { position: absolute; left: 3px; top: -5px; width: 2px; height: 10px; background: #8fc1ff; }
.share i::before { content: ''; position: absolute; left: -3px; top: 0; width: 8px; height: 8px; border-left: 2px solid #8fc1ff; border-top: 2px solid #8fc1ff; transform: rotate(45deg); transform-origin: 0 0; left: 1px; top: -1px; width: 4px; height: 4px; }
.inst { align-self: flex-start; margin-top: 4px; font-size: 12px; font-weight: 900; letter-spacing: 0.06em; padding: 6px 12px 8px; background: #2f9e6b; color: #fff; box-shadow: var(--px-border-2), inset 0 -3px 0 #1d6b47; }
.note { margin-top: 18px; font-size: 11px; text-align: center; color: #a88a6c; }
</style>
