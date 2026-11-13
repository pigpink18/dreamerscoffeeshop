<script setup lang="ts">
// Màn tạo chủ quán trước khi vào game: thẻ nhân viên treo dây đeo – ảnh chân dung (nam/nữ), tên viết lên thẻ, ngôn ngữ.
// Chữ trên màn này đổi ngay theo ngôn ngữ đang chọn (chưa cần tải lại trang).
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { save, ui, persist } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { drawPerson, drawCorgi, px, shade, CZ, type Ctx } from '../game/pixel'
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
function setGender(g: Gender) {
  if (g === gender.value) return
  gender.value = g
  sfx('tap')
}
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

// ---------- ảnh chân dung trên thẻ nhân viên: chủ quán (nửa người, đeo tạp dề) + Cáo ló vào góc ----------
const cv = ref<HTMLCanvasElement | null>(null)
const PW = 44, PH = 50
let raf = 0

/** chủ quán: áo + tạp dề quán (vẽ từ đầu tới hông, phần dưới bị khung ảnh cắt) */
function owner(c: Ctx, g: Gender, x: number, y: number, t: number) {
  const ch = CHARS.find((k) => k.g === g)!
  const look = ownerLook(ch.shirt, g)
  const blink = Math.floor(t * 10) % 37 === 0
  const pants = g === 'm' ? '#3b4a66' : '#4a5a7a'
  px(c, x + 2, y + 28, 12, 6, pants)
  drawPerson(c, look, x, y, 'happy', blink)
  const ap = '#6f4630'
  px(c, x + 4, y + 15, 1, 3, ap); px(c, x + 11, y + 15, 1, 3, ap)
  px(c, x + 3, y + 18, 10, 16, ap); px(c, x + 3, y + 18, 10, 1, shade(ap, 25))
  px(c, x + 2, y + 21, 12, 1, shade(ap, -20))
  px(c, x + 5, y + 25, 6, 3, shade(ap, -18)); px(c, x + 5, y + 25, 6, 1, shade(ap, 15))
  px(c, x + 7, y + 19, 2, 2, CZ.b2)
}

function render(t: number) {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.imageSmoothingEnabled = false
  // phông ảnh thẻ: tường xanh quán, vệt sáng chéo như ảnh chụp studio
  px(c, 0, 0, PW, PH, CZ.t1)
  for (let x = 2; x < PW; x += 6) px(c, x, 0, 1, PH, CZ.t2)
  c.fillStyle = 'rgba(255, 236, 190, 0.16)'
  c.beginPath(); c.moveTo(6, 0); c.lineTo(20, 0); c.lineTo(4, PH); c.lineTo(-10, PH); c.closePath(); c.fill()
  c.fillStyle = 'rgba(255, 230, 160, 0.22)'
  c.beginPath(); c.ellipse(20, 20, 16, 18, 0, 0, Math.PI * 2); c.fill()
  const bob = Math.floor(t * 2) % 2
  owner(c, gender.value, 10, 9 + bob, t)
  // Cáo ló đầu vào góc phải dưới
  drawCorgi(c, 21, PH - 12, t, 'sit', true)
  // viền trong ảnh
  c.fillStyle = 'rgba(20, 14, 10, 0.25)'
  c.fillRect(0, 0, PW, 1); c.fillRect(0, 0, 1, PH)
}
function loop(now: number) { render(now / 1000); raf = requestAnimationFrame(loop) }
onMounted(() => { raf = requestAnimationFrame(loop) })
onBeforeUnmount(() => cancelAnimationFrame(raf))

// lật ảnh khi đổi nhân vật
const flip = ref(0)
function pickGender(g: Gender) { if (g !== gender.value) { flip.value++; setGender(g) } }
const today = new Date()
const dd = (n: number) => String(n).padStart(2, '0')
const opened = `${dd(today.getDate())}/${dd(today.getMonth() + 1)}/${today.getFullYear()}`
const staffNo = computed(() => '#' + String(1 + ((clean.value.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0) % 9999)).padStart(4, '0'))
const bars = computed(() => {
  const seed = (clean.value || 'dreamers').split('').reduce((a, ch) => (a * 33 + ch.charCodeAt(0)) >>> 0, 5381)
  return Array.from({ length: 26 }, (_, i) => 1 + (((seed >>> (i % 24)) ^ (i * 7)) % 3))
})
</script>

<template>
  <div class="setup">
    <div class="wrap">
      <header class="head">
        <img :src="logoUrl" class="logo" alt="" />
        <div class="ht">
          <b class="tname">DREAMERS COFFEE</b>
          <small>{{ again ? T('Hồ sơ chủ quán', 'Owner profile') : T('Nhận thẻ chủ quán', 'Get your owner badge') }}</small>
        </div>
        <div class="langs">
          <button class="lg" :class="{ on: lang === 'vi' }" aria-label="Tiếng Việt" @click="pickLang('vi')"><i class="flag vn"><b /></i>VI</button>
          <button class="lg" :class="{ on: lang === 'en' }" aria-label="English" @click="pickLang('en')"><i class="flag en"><b /></i>EN</button>
        </div>
      </header>

      <!-- thẻ nhân viên treo dây đeo -->
      <div class="hang">
        <div class="strap"><i /><i /></div>
        <div class="badge" :class="{ shake }" @animationend="shake = false">
          <i class="clip" />
          <div class="band">
            <span class="bl">DREAMERS COFFEE</span>
            <span class="br">{{ T('THẺ NHÂN VIÊN', 'STAFF BADGE') }}</span>
          </div>
          <div class="body">
            <div class="photo">
              <canvas :key="flip" ref="cv" :width="PW" :height="PH" class="cv" />
            </div>
            <div class="info">
              <span class="role">{{ T('CHỦ QUÁN', 'OWNER') }}</span>
              <label class="field" :class="{ empty: !clean }" for="owner-name">
                <input id="owner-name" ref="input" v-model="name" class="nm" :maxlength="MAXN" autocomplete="off" autocapitalize="words" spellcheck="false"
                  :placeholder="T('Tên của bạn', 'Your name')" enterkeyhint="done" @keydown.enter="confirm" />
                <span class="count">{{ clean.length }}/{{ MAXN }}</span>
              </label>
              <div class="sw" role="radiogroup" :aria-label="T('Nhân vật', 'Character')">
                <button v-for="ch in CHARS" :key="ch.g" role="radio" :aria-checked="ch.g === gender" :class="{ on: ch.g === gender }" @click="pickGender(ch.g)">{{ T(ch.vi, ch.en) }}</button>
              </div>
              <dl class="meta">
                <div><dt>{{ T('Khai trương', 'Opened') }}</dt><dd>{{ opened }}</dd></div>
                <div><dt>{{ T('Mã số', 'No.') }}</dt><dd>{{ staffNo }}</dd></div>
              </dl>
            </div>
          </div>
          <div class="foot">
            <span class="barcode"><i v-for="(b, i) in bars" :key="i" :style="{ width: b + 'px' }" /></span>
            <span class="sign">{{ clean || '_____' }} &amp; Cáo</span>
          </div>
          <span class="stamp" :class="{ show: !!clean }">{{ T('CHỦ QUÁN', 'OWNER') }}</span>
        </div>
      </div>

      <button class="btn big good go" :class="{ off: !clean }" @pointerdown="confirm" @click="confirm">
        {{ again ? T('LƯU', 'SAVE') : T('MỞ QUÁN ▶', "LET'S OPEN ▶") }}
      </button>
      <p v-if="!clean" class="note">{{ T('Viết tên lên thẻ để bắt đầu nhé', 'Write your name on the badge to begin') }}</p>
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

/* dây đeo + thẻ nhân viên (đung đưa nhẹ) */
.hang { position: relative; display: flex; flex-direction: column; align-items: center; margin-top: -4px; }
.strap { display: flex; gap: 22px; height: 34px; }
.strap i { width: 9px; height: 100%; background: repeating-linear-gradient(180deg, #d9534f 0 6px, #b8423e 6px 7px); box-shadow: 0 0 0 2px #261c1b; }
.strap i:first-child { transform: skewX(18deg); transform-origin: bottom; }
.strap i:last-child { transform: skewX(-18deg); transform-origin: bottom; }
.badge {
  position: relative; width: 100%; max-width: 360px; background: #fffaf0; color: #3b2a20;
  box-shadow: 0 0 0 3px #261c1b, 0 0 0 5px #e9d6b8, 0 0 0 7px #261c1b, 0 12px 0 4px rgba(0, 0, 0, 0.3);
  transform-origin: 50% -34px; animation: sway 4.5s ease-in-out infinite;
}
.badge.shake { animation: shake 0.35s steps(4) 1; }
@keyframes sway { 0%, 100% { transform: rotate(-1.2deg); } 50% { transform: rotate(1.2deg); } }
@keyframes shake { 25% { transform: translateX(-6px); } 50% { transform: translateX(6px); } 75% { transform: translateX(-3px); } }
.clip { position: absolute; left: 50%; top: -12px; width: 34px; height: 16px; margin-left: -17px; background: #c3cad0; box-shadow: 0 0 0 2px #261c1b, inset 0 3px 0 #eef2f4, inset 0 -3px 0 #8f979e; z-index: 2; }
.clip::after { content: ''; position: absolute; left: 11px; top: 5px; width: 12px; height: 4px; background: #3b2a20; }
.band { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px 12px 8px; background: #6f4630; box-shadow: inset 0 -3px 0 #4a2e1f, inset 0 3px 0 #8a5c38; }
.bl { font-size: 12px; font-weight: 900; letter-spacing: 0.16em; color: #ffd77a; text-shadow: 0 2px 0 #2a1a10; white-space: nowrap; }
.br { font-size: 9px; font-weight: 900; letter-spacing: 0.14em; color: #e9c58a; white-space: nowrap; }
.body { display: flex; gap: 12px; padding: 12px; background: repeating-linear-gradient(0deg, rgba(110, 70, 48, 0.05) 0 1px, transparent 1px 6px); }
.photo { flex: none; width: 42%; max-width: 140px; padding: 4px; background: #fff; box-shadow: 0 0 0 2px #3b2a20, 3px 3px 0 2px rgba(59, 42, 32, 0.25); align-self: flex-start; }
.cv { display: block; width: 100%; aspect-ratio: 44 / 50; image-rendering: pixelated; image-rendering: crisp-edges; animation: flipIn 0.35s ease-out; }
@keyframes flipIn { 0% { transform: scaleX(0.05); filter: brightness(1.6); } 100% { transform: scaleX(1); } }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.role { align-self: flex-start; font-size: 10px; font-weight: 900; letter-spacing: 0.18em; color: #fff; background: #3fb57b; padding: 3px 7px 4px; box-shadow: 0 0 0 2px #1d6b47; }
.field { display: flex; align-items: baseline; gap: 4px; border-bottom: 3px solid #3b2a20; padding-bottom: 2px; cursor: text; }
.field.empty { border-bottom-style: dashed; border-bottom-color: #b9a58e; }
.field:focus-within { border-bottom-color: #d99a2b; border-bottom-style: solid; }
.nm {
  flex: 1; min-width: 0; font: inherit; font-size: 21px; font-weight: 900; letter-spacing: 0.02em;
  color: #3b2a20; background: transparent; border: 0; border-radius: 0; padding: 2px 0; outline: none;
  -webkit-user-select: text; user-select: text; caret-color: #d99a2b;
}
.nm::placeholder { color: rgba(59, 42, 32, 0.35); font-size: 16px; }
.count { font-size: 9px; font-weight: 900; color: #a58d74; flex: none; }
.sw { display: grid; grid-template-columns: 1fr 1fr; background: #e6d6c2; box-shadow: 0 0 0 2px #3b2a20; padding: 3px; gap: 3px; }
.sw button { padding: 6px 0 7px; font-size: 12px; font-weight: 900; letter-spacing: 0.16em; color: #8a7566; background: transparent; }
.sw button.on { color: #3b2a20; background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20, inset 0 -3px 0 #d99a2b, inset 0 2px 0 #fff1a8; }
.sw button:active { transform: translateY(1px); }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; }
.meta div { display: flex; flex-direction: column; gap: 1px; }
.meta dt { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #a58d74; }
.meta dd { margin: 0; font-size: 12px; font-weight: 900; font-variant-numeric: tabular-nums; }
.foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px 10px; border-top: 2px dashed #d8c4a8; }
.barcode { display: flex; gap: 2px; height: 22px; }
.barcode i { display: block; height: 100%; background: #3b2a20; }
.sign { font-size: 11px; font-weight: 900; color: #8a6a4f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.stamp {
  position: absolute; right: 12px; bottom: 40px; padding: 3px 8px 4px; font-size: 13px; font-weight: 900; letter-spacing: 0.14em;
  color: #c0392b; box-shadow: 0 0 0 2px #c0392b, inset 0 0 0 1px rgba(192, 57, 43, 0.35); opacity: 0; transform: rotate(-14deg) scale(1.6);
  transition: opacity 0.2s, transform 0.25s cubic-bezier(.3, 1.6, .5, 1); pointer-events: none; mix-blend-mode: multiply;
}
.stamp.show { opacity: 0.85; transform: rotate(-14deg) scale(1); }

.go { margin-top: 6px; color: #fff; text-shadow: 0 2px 0 #1d6b47; }
.go.off { filter: grayscale(0.6) brightness(0.85); }
.note { font-size: 12px; text-align: center; color: #c9a888; font-weight: 700; margin-top: -4px; }
.x { align-self: center; font-size: 11px; font-weight: 900; padding: 5px 12px 7px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #2e1c12; }
</style>
