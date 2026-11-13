<script setup lang="ts">
// Màn tạo chủ quán trước khi vào game: ngôn ngữ, nhân vật nam/nữ (xem toàn thân trên sân khấu quán), tên tự điền.
// Chữ trên màn này đổi ngay theo ngôn ngữ đang chọn (chưa cần tải lại trang).
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { save, ui, persist } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { drawPerson, drawCorgi, px, box, shade, CZ, type Ctx } from '../game/pixel'
import { LANG, GENDER, ownerLook, saveProfile, type Lang, type Gender } from '../game/i18n'
import logoUrl from '../assets/logo.png'

const again = save.setupDone // mở lại từ Cài đặt
const lang = ref<Lang>(LANG)
const gender = ref<Gender>(GENDER)
const name = ref(again ? save.player : '') // lần đầu: để trống cho người chơi tự điền
const T = <S,>(vi: S, en: S) => (lang.value === 'en' ? en : vi)
const MAXN = 14

const CHARS: { g: Gender; vi: string; en: string; shirt: string }[] = [
  { g: 'f', vi: 'NỮ', en: 'FEMALE', shirt: CZ.r2 },
  { g: 'm', vi: 'NAM', en: 'MALE', shirt: CZ.t3 },
]
const idx = computed(() => CHARS.findIndex((c) => c.g === gender.value))
let swapAt = -10, swapDir = 1
function setGender(g: Gender, dir = 1) {
  if (g === gender.value) return
  gender.value = g
  swapAt = performance.now() / 1000; swapDir = dir
  sfx('tap')
}
const step = (d: number) => setGender(CHARS[(idx.value + d + CHARS.length) % CHARS.length].g, d)
function pickLang(l: Lang) { if (l !== lang.value) { lang.value = l; sfx('tap') } }

const clean = computed(() => name.value.replace(/\s+/g, ' ').trim().slice(0, MAXN))
const input = ref<HTMLInputElement | null>(null)
const shake = ref(false)
let done = false
function confirm() {
  if (done) return
  if (!clean.value) { // chưa có tên: rung ô tên + mở bàn phím
    shake.value = false
    nextTick(() => { shake.value = true; input.value?.focus() })
    try { sfx('wrong') } catch { /* bỏ qua */ }
    return
  }
  done = true
  ;(document.activeElement as HTMLElement | null)?.blur?.() // đóng bàn phím iPhone
  try { unlockAudio() } catch { /* bỏ qua */ }
  save.player = clean.value
  save.setupDone = true
  ui.showSetup = false
  persist()
  try { sfx('done') } catch { /* bỏ qua */ }
  if (saveProfile(lang.value, gender.value)) setTimeout(() => location.reload(), 250)
}
function close() { ui.showSetup = false; sfx('tap') }

// ---------- sân khấu: góc quán, đèn rọi, chủ quán đứng toàn thân + Cáo ----------
const cv = ref<HTMLCanvasElement | null>(null)
const SW = 120, SH = 72, FLOOR = 54
let raf = 0

function room(c: Ctx, t: number) {
  // tường gỗ xanh + ván dọc
  px(c, 0, 0, SW, FLOOR, CZ.t1)
  for (let x = 3; x < SW; x += 8) px(c, x, 0, 1, 38, CZ.t2)
  // ốp chân tường
  px(c, 0, 38, SW, FLOOR - 38, CZ.w2); px(c, 0, 38, SW, 1, CZ.w4); px(c, 0, 39, SW, 1, CZ.w3)
  for (let x = 6; x < SW; x += 14) px(c, x, 41, 10, 10, CZ.w1), px(c, x + 1, 42, 8, 8, CZ.w2)
  // cửa sổ trái: trời chiều + đồi thông
  box(c, 6, 8, 24, 20, '#bfe3f5', CZ.ink)
  px(c, 7, 9, 22, 8, '#ffd9a8'); px(c, 7, 17, 22, 10, '#a8d4ec')
  for (let i = 0; i < 4; i++) { const x = 8 + i * 6; px(c, x + 1, 19, 2, 3, '#3d6b4f'); px(c, x, 22, 4, 3, '#2f5a42'); px(c, x - 1, 25, 6, 2, '#2f5a42') }
  px(c, 17, 9, 2, 18, CZ.w2); px(c, 7, 17, 22, 1, CZ.w2)
  px(c, 5, 28, 26, 2, CZ.w4); px(c, 5, 30, 26, 1, CZ.w1)
  // kệ phải: hũ + ly
  px(c, 88, 16, 28, 2, CZ.w4); px(c, 88, 18, 28, 1, CZ.w1)
  const jars = [CZ.r1, CZ.b1, '#7bb662', CZ.w3]
  jars.forEach((col, i) => { box(c, 90 + i * 7, 9, 5, 7, col, CZ.ink); px(c, 90 + i * 7, 9, 5, 1, '#f4f4f0') })
  px(c, 88, 30, 28, 2, CZ.w4); px(c, 88, 32, 28, 1, CZ.w1)
  for (let i = 0; i < 4; i++) { box(c, 90 + i * 7, 25, 5, 5, '#fffaf0', CZ.ink); px(c, 91 + i * 7, 26, 3, 1, CZ.w2) }
  // sàn gỗ
  for (let y = FLOOR; y < SH; y += 3) {
    px(c, 0, y, SW, 3, (y / 3) % 2 ? CZ.w3 : CZ.w4)
    const off = ((y / 3) % 2) * 9
    for (let x = off; x < SW; x += 18) px(c, x, y, 1, 3, CZ.w2)
  }
  px(c, 0, FLOOR, SW, 1, CZ.w1)
  // đèn thả + quầng sáng rọi xuống
  px(c, 59, 0, 1, 4, CZ.ink)
  box(c, 54, 3, 12, 5, CZ.b1, CZ.ink); px(c, 55, 4, 10, 1, CZ.b2); px(c, 58, 8, 4, 1, '#fff3b0')
  const fl = 0.16 + 0.02 * Math.sin(t * 3)
  c.fillStyle = `rgba(255, 226, 150, ${fl})`
  c.beginPath(); c.moveTo(55, 8); c.lineTo(65, 8); c.lineTo(86, SH - 6); c.lineTo(34, SH - 6); c.closePath(); c.fill()
  c.fillStyle = 'rgba(255, 230, 160, 0.22)'
  c.beginPath(); c.ellipse(60, FLOOR + 9, 24, 5, 0, 0, Math.PI * 2); c.fill()
}

/** chủ quán toàn thân: áo + tạp dề quán, quần, giày */
function owner(c: Ctx, g: Gender, x: number, y: number, t: number, hop: number) {
  const ch = CHARS.find((k) => k.g === g)!
  const look = ownerLook(ch.shirt, g)
  const blink = Math.floor(t * 10) % 37 === 0
  // bóng dưới chân
  c.fillStyle = 'rgba(38, 28, 27, 0.35)'
  c.beginPath(); c.ellipse(x + 8, y + 39.5 + hop, 9 - hop / 3, 2, 0, 0, Math.PI * 2); c.fill()
  const pants = g === 'm' ? '#3b4a66' : '#4a5a7a'
  // chân + giày
  px(c, x + 2, y + 28, 12, 4, pants); px(c, x + 2, y + 28, 12, 1, shade(pants, 18))
  px(c, x + 4, y + 32, 3, 5, pants); px(c, x + 9, y + 32, 3, 5, pants)
  px(c, x + 3, y + 37, 5, 2, CZ.ink); px(c, x + 9, y + 37, 5, 2, CZ.ink)
  px(c, x + 4, y + 37, 2, 1, '#fffaf2'); px(c, x + 10, y + 37, 2, 1, '#fffaf2')
  drawPerson(c, look, x, y, 'happy', blink)
  // tạp dề nâu + dây đeo cổ + túi + logo nhỏ
  const ap = '#6f4630'
  px(c, x + 4, y + 15, 1, 3, ap); px(c, x + 11, y + 15, 1, 3, ap)
  px(c, x + 3, y + 18, 10, 13, ap); px(c, x + 3, y + 18, 10, 1, shade(ap, 25))
  px(c, x + 2, y + 21, 12, 1, shade(ap, -20))
  px(c, x + 5, y + 25, 6, 3, shade(ap, -18)); px(c, x + 5, y + 25, 6, 1, shade(ap, 15))
  px(c, x + 7, y + 19, 2, 2, CZ.b2)
}

function render(t: number) {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.imageSmoothingEnabled = false
  c.clearRect(0, 0, SW, SH)
  room(c, t)
  // đổi nhân vật: nhảy lên + lấp lánh
  const st = t - swapAt
  const hop = st < 0.45 ? Math.round(Math.sin((st / 0.45) * Math.PI) * 5) : Math.floor(t * 2.2) % 2
  const slide = st < 0.25 ? Math.round((1 - st / 0.25) * 10 * swapDir) : 0
  owner(c, gender.value, 52 + slide, FLOOR - 37 - hop, t, hop)
  if (st < 0.6) {
    const k = st / 0.6
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + k * 2
      const r = 10 + k * 14
      px(c, Math.round(60 + Math.cos(a) * r), Math.round(34 + Math.sin(a) * r * 0.8), 2, 2, i % 2 ? CZ.b2 : '#ffffff')
    }
  }
  // Cáo ngồi cạnh chủ quán, vẫy đuôi
  drawCorgi(c, 74, FLOOR - 13, t, 'sit', true)
  // khung tối nhẹ 4 góc
  c.fillStyle = 'rgba(20, 14, 10, 0.18)'
  c.fillRect(0, 0, SW, 2); c.fillRect(0, SH - 2, SW, 2)
}
function loop(now: number) { render(now / 1000); raf = requestAnimationFrame(loop) }
onMounted(() => { raf = requestAnimationFrame(loop) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="setup">
    <div class="wrap">
      <header class="head">
        <img :src="logoUrl" class="logo" alt="" />
        <div class="ht">
          <b class="tname">DREAMERS COFFEE</b>
          <small>{{ again ? T('Hồ sơ chủ quán', 'Owner profile') : T('Tạo chủ quán', 'Create your owner') }}</small>
        </div>
        <div class="langs">
          <button class="lg" :class="{ on: lang === 'vi' }" aria-label="Tiếng Việt" @click="pickLang('vi')"><i class="flag vn"><b /></i>VI</button>
          <button class="lg" :class="{ on: lang === 'en' }" aria-label="English" @click="pickLang('en')"><i class="flag en"><b /></i>EN</button>
        </div>
      </header>

      <!-- sân khấu nhân vật: khung tranh gỗ dày, ốc đồng, mũi tên đổi nhân vật hai bên -->
      <div class="stage">
        <canvas ref="cv" :width="SW" :height="SH" class="cv" />
        <button class="arrow l" :aria-label="T('Nhân vật trước', 'Previous')" @click="step(-1)"><i /></button>
        <button class="arrow r" :aria-label="T('Nhân vật sau', 'Next')" @click="step(1)"><i /></button>
        <div class="pips"><i v-for="ch in CHARS" :key="ch.g" :class="{ on: ch.g === gender }" /></div>
      </div>

      <!-- bảng chọn giới tính: 2 thẻ gỗ như nút trong game -->
      <div class="tabs">
        <button v-for="(ch, i) in CHARS" :key="ch.g" class="tab" :class="{ on: ch.g === gender }" @click="setGender(ch.g, i > idx ? 1 : -1)">
          {{ T(ch.vi, ch.en) }}
        </button>
      </div>

      <!-- biển tên bằng đồng gắn trên tấm gỗ -->
      <div class="plank">
        <i class="nail" /><i class="nail r" />
        <label class="plabel" for="owner-name">{{ T('TÊN CHỦ QUÁN', "OWNER'S NAME") }}</label>
        <div class="plaque" :class="{ shake, empty: !clean }" @animationend="shake = false">
          <input id="owner-name" ref="input" v-model="name" class="nm" :maxlength="MAXN" autocomplete="off" autocapitalize="words" spellcheck="false"
            :placeholder="T('Nhập tên của bạn…', 'Type your name…')" enterkeyhint="done" @keydown.enter="confirm" />
          <span class="count">{{ clean.length }}/{{ MAXN }}</span>
        </div>
        <p class="sign">
          <span>{{ T('Biển quán', 'Shop sign') }}</span>
          <b :class="{ ghost: !clean }">{{ clean || '_____' }} &amp; Cáo</b>
        </p>
      </div>

      <button class="btn big good go" :class="{ off: !clean }" @pointerdown="confirm" @click="confirm">
        {{ again ? T('LƯU', 'SAVE') : T('MỞ QUÁN ▶', "LET'S OPEN ▶") }}
      </button>
      <p v-if="!clean" class="note">{{ T('Đặt tên cho chủ quán để bắt đầu nhé', 'Give your owner a name to begin') }}</p>
      <p v-else-if="again && (lang !== LANG || gender !== GENDER)" class="note">{{ T('Game sẽ tải lại để đổi ngôn ngữ / nhân vật.', 'The game will reload to apply language / character.') }}</p>
      <button v-if="again" class="x" @pointerdown="close">{{ T('ĐÓNG', 'CLOSE') }}</button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  position: absolute; inset: 0; z-index: 110; display: flex; flex-direction: column; align-items: center;
  background:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.14) 0 2px, transparent 2px 38px),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 7px),
    #3b2518;
  color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 12px) 14px calc(env(safe-area-inset-bottom, 0px) + 18px);
  overflow-y: auto; -webkit-overflow-scrolling: touch;
}
.wrap { width: 100%; max-width: 440px; margin: auto 0; display: flex; flex-direction: column; gap: 16px; }

/* đầu trang */
.head { display: flex; align-items: center; gap: 10px; }
.logo { width: 44px; height: 44px; image-rendering: pixelated; box-shadow: 0 0 0 2px #261c1b, 0 0 0 4px #80502c, 0 0 0 6px #261c1b; margin: 6px; flex: none; }
.ht { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.tname { font-size: 13px; letter-spacing: 0.16em; white-space: nowrap; }
.ht small { font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #f2c14e; }
.langs { display: flex; gap: 6px; flex: none; }
.lg {
  display: flex; align-items: center; gap: 5px; padding: 4px 7px 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.08em;
  background: #4a2e1f; color: #c9a888; box-shadow: var(--px-border-2), inset 0 -3px 0 #2e1c12;
}
.lg.on { background: #f2c14e; color: #3b2a20; box-shadow: var(--px-border-2), inset 0 -3px 0 #d99a2b, inset 0 2px 0 #fff1a8; }
.lg:active { transform: translateY(2px); }
.flag { position: relative; display: inline-block; width: 14px; height: 10px; box-shadow: 0 0 0 1px #261c1b; flex: none; }
.flag.vn { background: #da251d; }
.flag.vn b { position: absolute; left: 4px; top: 2px; width: 6px; height: 6px; background: #ffde00;
  clip-path: polygon(50% 0, 62% 38%, 100% 38%, 69% 60%, 81% 100%, 50% 76%, 19% 100%, 31% 60%, 0 38%, 38% 38%); }
.flag.en { background: repeating-linear-gradient(180deg, #b22234 0 1.5px, #fff 1.5px 3px); }
.flag.en b { position: absolute; left: 0; top: 0; width: 6px; height: 5px; background: #3c3b6e; }

/* sân khấu: khung tranh gỗ dày, ốc đồng 4 góc (giống truyện mở đầu) */
.stage { position: relative; margin: 10px 10px 4px; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 10px 0 10px rgba(0, 0, 0, 0.3); }
.stage::before, .stage::after { content: ''; position: absolute; top: -8px; width: 4px; height: 4px; background: #d5a534; box-shadow: 0 1px 0 #886321; pointer-events: none; }
.stage::before { left: -8px; } .stage::after { right: -8px; }
.cv { display: block; width: 100%; aspect-ratio: 120 / 72; image-rendering: pixelated; image-rendering: crisp-edges; }
/* mũi tên pixel hai bên */
.arrow {
  position: absolute; top: 50%; width: 34px; height: 40px; margin-top: -20px; display: grid; place-items: center;
  background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 4px 0 rgba(0, 0, 0, 0.3);
}
.arrow:active { transform: translateY(3px); box-shadow: var(--px-border-2), inset 0 -2px 0 #d99a2b, 0 1px 0 rgba(0, 0, 0, 0.3); }
.arrow.l { left: -4px; } .arrow.r { right: -4px; }
.arrow i { width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; margin-top: -2px; }
.arrow.l i { border-right: 8px solid #3b2a20; margin-left: -2px; }
.arrow.r i { border-left: 8px solid #3b2a20; margin-left: 2px; }
.pips { position: absolute; left: 0; right: 0; bottom: -24px; display: flex; justify-content: center; gap: 6px; }
.pips i { width: 8px; height: 4px; background: #5a4334; transition: width 0.25s, background 0.25s; }
.pips i.on { width: 16px; background: #d5a534; }

/* 2 thẻ giới tính */
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 3px 0; }
.tab {
  min-height: 42px; padding: 0 0 3px; font-size: 14px; font-weight: 900; letter-spacing: 0.22em;
  background: #80502c; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -4px 0 #603b25, inset 0 2px 0 #a16b36, 0 5px 0 rgba(0, 0, 0, 0.3);
}
.tab.on { background: #f2c14e; color: #3b2a20; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 5px 0 rgba(0, 0, 0, 0.3); }
.tab:active { transform: translateY(3px); }

/* tấm gỗ có biển tên đồng */
.plank {
  position: relative; margin: 4px 3px 0; padding: 12px 14px 12px;
  background: repeating-linear-gradient(0deg, #a16b36 0 9px, #8d5c2e 9px 10px), #a16b36;
  box-shadow: var(--px-border), inset 0 -4px 0 #6f4630, inset 0 3px 0 #bf8a4a, 0 7px 0 rgba(0, 0, 0, 0.3);
}
.nail { position: absolute; top: 7px; left: 7px; width: 4px; height: 4px; background: #d5a534; box-shadow: 0 1px 0 #3b2a20; }
.nail.r { left: auto; right: 7px; }
.plabel { display: block; text-align: center; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; color: #ffe8b8; text-shadow: 0 2px 0 #4a2e1f; margin-bottom: 9px; }
.plaque {
  display: flex; align-items: center; gap: 8px; padding: 3px 10px 5px;
  background: linear-gradient(#f6dc8a, #e2b84f); box-shadow: 0 0 0 2px #886321, 0 0 0 4px #3b2a20, inset 0 2px 0 #fff3c4, inset 0 -3px 0 #c39432;
}
.plaque.shake { animation: shake 0.35s steps(4) 1; }
@keyframes shake { 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-3px); } }
.nm {
  flex: 1; min-width: 0; font: inherit; font-size: 20px; font-weight: 900; letter-spacing: 0.04em; text-align: center;
  color: #3b2a20; background: transparent; border: 0; border-radius: 0; padding: 6px 0; outline: none;
  -webkit-user-select: text; user-select: text; caret-color: #3b2a20;
}
.nm::placeholder { color: rgba(59, 42, 32, 0.45); font-size: 15px; letter-spacing: 0.02em; }
.count { font-size: 10px; font-weight: 900; color: #886321; flex: none; }
.plaque:focus-within { box-shadow: 0 0 0 2px #886321, 0 0 0 4px #3b2a20, 0 0 0 7px #fff4dc, inset 0 2px 0 #fff3c4, inset 0 -3px 0 #c39432; }
.sign { display: flex; justify-content: center; gap: 6px; margin-top: 10px; font-size: 12px; font-weight: 700; color: #f1d9b3; }
.sign b { color: #fff; text-shadow: 0 2px 0 #4a2e1f; }
.sign b.ghost { color: #e6c79c; opacity: 0.7; }

.go { margin-top: 6px; color: #fff; text-shadow: 0 2px 0 #1d6b47; }
.go.off { filter: grayscale(0.6) brightness(0.85); }
.note { font-size: 12px; text-align: center; color: #c9a888; font-weight: 700; margin-top: -4px; }
.x { align-self: center; font-size: 11px; font-weight: 900; padding: 5px 12px 7px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #2e1c12; }
</style>
