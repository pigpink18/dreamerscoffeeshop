<script setup lang="ts">
// Màn thiết lập trước khi vào game: ngôn ngữ, chủ quán nam/nữ, tên chủ quán.
// Chữ trên màn này đổi ngay theo ngôn ngữ đang chọn (chưa cần tải lại trang).
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, persist } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { drawPerson, px, CZ, type Ctx } from '../game/pixel'
import { LANG, GENDER, DEFAULT_NAME, ownerLook, saveProfile, type Lang, type Gender } from '../game/i18n'
import logoUrl from '../assets/logo.png'

const lang = ref<Lang>(LANG)
const gender = ref<Gender>(GENDER)
const name = ref(save.player || DEFAULT_NAME[GENDER])
const again = computed(() => save.setupDone) // mở lại từ Cài đặt
const T = <S,>(vi: S, en: S) => (lang.value === 'en' ? en : vi)

const RANDOM: Record<Gender, string[]> = {
  f: ['Yến', 'Mai', 'Lan', 'Thảo', 'Vy', 'Hân', 'An', 'My', 'Ngân', 'Trâm'],
  m: ['Minh', 'Huy', 'Nam', 'Khoa', 'Bảo', 'Phong', 'Long', 'Tú', 'Quân', 'Đạt'],
}
function pickGender(g: Gender) {
  if (g === gender.value) return
  // tên còn là tên gợi ý của giới tính cũ → đổi sang tên gợi ý của giới tính mới
  if (!name.value.trim() || RANDOM[gender.value].includes(name.value.trim())) name.value = DEFAULT_NAME[g]
  gender.value = g
  sfx('tap')
}
function dice() {
  const pool = RANDOM[gender.value].filter((n) => n !== name.value)
  name.value = pool[Math.floor(Math.random() * pool.length)]
  sfx('tap')
}
function pickLang(l: Lang) { lang.value = l; sfx('tap') }

const clean = computed(() => name.value.replace(/\s+/g, ' ').trim().slice(0, 14))
let done = false
function confirm() {
  if (done) return
  done = true
  ;(document.activeElement as HTMLElement | null)?.blur?.() // đóng bàn phím iPhone
  try { unlockAudio() } catch { /* bỏ qua */ }
  save.player = clean.value || DEFAULT_NAME[gender.value]
  save.setupDone = true
  ui.showSetup = false
  persist()
  try { sfx('done') } catch { /* bỏ qua */ }
  if (saveProfile(lang.value, gender.value)) setTimeout(() => location.reload(), 250)
}
function close() { ui.showSetup = false; sfx('tap') }

// ---------- tranh chân dung 2 chủ quán ----------
const cvF = ref<HTMLCanvasElement | null>(null)
const cvM = ref<HTMLCanvasElement | null>(null)
const PW = 36, PH = 30
let raf = 0
function portrait(c: Ctx, g: Gender, t: number, on: boolean) {
  c.clearRect(0, 0, PW, PH)
  // tường quán + ván ốp + quầy gỗ
  px(c, 0, 0, PW, PH, on ? CZ.t2 : CZ.t1)
  for (let x = 2; x < PW; x += 6) px(c, x, 0, 1, 19, on ? CZ.t3 : CZ.t2)
  px(c, 3, 4, 7, 6, CZ.w2); px(c, 4, 5, 5, 4, CZ.paper); px(c, 5, 6, 3, 1, CZ.r1) // tranh nhỏ
  px(c, 0, 22, PW, 8, CZ.w2); px(c, 0, 22, PW, 1, CZ.w4); px(c, 0, 29, PW, 1, CZ.w0)
  const bob = on ? Math.floor(t * 2.4) % 2 : 0
  drawPerson(c, ownerLook(g === 'f' ? CZ.r2 : CZ.t3, g), 10, 5 - bob, on ? 'happy' : 'neutral', Math.floor(t * 10 + (g === 'm' ? 13 : 0)) % 37 === 0)
  px(c, 0, 23, PW, 7, CZ.w3); px(c, 0, 23, PW, 1, CZ.w5); px(c, 0, 29, PW, 1, CZ.w1)
  // ly cà phê trên quầy
  px(c, 27, 18, 5, 5, CZ.ink); px(c, 28, 19, 3, 3, '#fffaf0'); px(c, 28, 19, 3, 1, CZ.w2)
  if (on && Math.floor(t * 3) % 2) px(c, 29, 16, 1, 1, '#ffffff')
  if (!on) { c.fillStyle = 'rgba(20,14,10,0.35)'; c.fillRect(0, 0, PW, PH) }
}
function loop(now: number) {
  const t = now / 1000
  for (const [cv, g] of [[cvF.value, 'f'], [cvM.value, 'm']] as const) {
    const c = cv?.getContext('2d')
    if (c) { c.imageSmoothingEnabled = false; portrait(c, g, t, gender.value === g) }
  }
  raf = requestAnimationFrame(loop)
}
onMounted(() => { raf = requestAnimationFrame(loop) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="setup">
    <div class="wrap">
      <div class="head">
        <img :src="logoUrl" class="logo" alt="" />
        <div>
          <b class="tname">DREAMERS COFFEE</b>
          <small>{{ again ? T('Hồ sơ chủ quán', 'Owner profile') : T('Trước khi mở quán…', 'Before we open…') }}</small>
        </div>
        <button v-if="again" class="x" @pointerdown="close">{{ T('ĐÓNG', 'CLOSE') }}</button>
      </div>

      <div class="board">
        <span class="section-title">{{ T('Ngôn ngữ', 'Language') }}</span>
        <div class="langs">
          <button class="lg" :class="{ on: lang === 'vi' }" @click="pickLang('vi')">
            <i class="flag vn"><b /></i> Tiếng Việt
          </button>
          <button class="lg" :class="{ on: lang === 'en' }" @click="pickLang('en')">
            <i class="flag en"><b /></i> English
          </button>
        </div>

        <span class="section-title">{{ T('Chủ quán', 'Shop owner') }}</span>
        <div class="who">
          <button class="pick" :class="{ on: gender === 'f' }" @click="pickGender('f')">
            <canvas ref="cvF" :width="PW" :height="PH" class="pv" />
            <span class="plate">{{ T('NỮ', 'FEMALE') }}</span>
          </button>
          <button class="pick" :class="{ on: gender === 'm' }" @click="pickGender('m')">
            <canvas ref="cvM" :width="PW" :height="PH" class="pv" />
            <span class="plate">{{ T('NAM', 'MALE') }}</span>
          </button>
        </div>

        <span class="section-title">{{ T('Tên chủ quán', 'Owner name') }}</span>
        <div class="namerow">
          <input v-model="name" class="nm" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false"
            :placeholder="DEFAULT_NAME[gender]" @keydown.enter="confirm" />
          <button class="btn sm accent dice" :aria-label="T('Tên ngẫu nhiên', 'Random name')" @click="dice">
            <i class="die"><b /><b /><b /></i>
          </button>
        </div>
        <p class="sign">{{ T('Biển quán', 'Sign') }}: <b>{{ clean || DEFAULT_NAME[gender] }} &amp; {{ T('Cáo', 'Cáo the corgi') }}</b></p>
      </div>

      <button class="btn big good go" @pointerdown="confirm" @click="confirm">
        {{ again ? T('LƯU', 'SAVE') : T('MỞ QUÁN ▶', "LET'S OPEN ▶") }}
      </button>
      <p v-if="again && (lang !== LANG || gender !== GENDER)" class="note">{{ T('Game sẽ tải lại để đổi ngôn ngữ / nhân vật.', 'The game will reload to apply language / character.') }}</p>
    </div>
  </div>
</template>

<style scoped>
.setup {
  position: absolute; inset: 0; z-index: 110; display: flex; flex-direction: column; align-items: center;
  background:
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0 2px, transparent 2px 38px),
    #3b2518;
  color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 14px) 14px calc(env(safe-area-inset-bottom, 0px) + 20px);
  overflow-y: auto; -webkit-overflow-scrolling: touch;
}
.wrap { width: 100%; max-width: 440px; margin: auto 0; display: flex; flex-direction: column; gap: 18px; }
.head { display: flex; align-items: center; gap: 12px; }
.head > div { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.logo { width: 52px; height: 52px; image-rendering: pixelated; box-shadow: 0 0 0 2px #261c1b, 0 0 0 4px #80502c, 0 0 0 6px #261c1b; margin: 6px; }
.tname { font-size: 15px; letter-spacing: 0.18em; }
.head small { font-size: 12px; color: #c9a888; font-weight: 700; }
.x { font-size: 11px; font-weight: 900; padding: 4px 9px 6px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #2e1c12; }

/* tấm bảng giấy kem viền gỗ dày (giống khung lời kể ở truyện mở đầu) */
.board {
  position: relative; margin: 8px 9px 0; background: #fff4dc; color: #261c1b; padding: 0 14px 14px;
  box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #a16b36, 0 0 0 9px #261c1b, inset 0 -4px 0 #eed59b, 0 9px 0 9px rgba(0, 0, 0, 0.3);
}
.board::before, .board::after { content: ''; position: absolute; top: -7px; width: 4px; height: 4px; background: #d5a534; box-shadow: 0 1px 0 #886321; }
.board::before { left: -7px; } .board::after { right: -7px; }
.board .section-title { margin: 16px 0 10px; }

.langs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 3px; }
.lg {
  display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 8px 3px;
  font-weight: 900; font-size: 14px; background: #f1e2cf; color: #3b2a20;
  box-shadow: var(--px-border-2), inset 0 -4px 0 #d8bf9f, inset 0 2px 0 #fff6ea;
}
.lg:active { transform: translateY(3px); }
.lg.on { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 0 0 5px #fff4dc, 0 0 0 7px #3b2a20; }

/* cờ pixel nhỏ */
.flag { position: relative; display: inline-block; width: 20px; height: 14px; box-shadow: 0 0 0 2px #261c1b; flex: none; }
.flag.vn { background: #da251d; }
.flag.vn b { position: absolute; left: 7px; top: 4px; width: 6px; height: 6px; background: #ffde00;
  clip-path: polygon(50% 0, 62% 38%, 100% 38%, 69% 60%, 81% 100%, 50% 76%, 19% 100%, 31% 60%, 0 38%, 38% 38%); }
.flag.en { background: repeating-linear-gradient(180deg, #b22234 0 2px, #fff 2px 4px); }
.flag.en b { position: absolute; left: 0; top: 0; width: 9px; height: 8px; background: #3c3b6e; box-shadow: inset 2px 2px 0 -1px #fff; }

.who { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 3px; }
.pick { display: flex; flex-direction: column; background: #261c1b; padding: 4px; box-shadow: 0 0 0 3px #80502c, 0 0 0 5px #261c1b, 0 6px 0 3px rgba(0, 0, 0, 0.25); }
.pick:active { transform: translateY(2px); }
.pick.on { box-shadow: 0 0 0 3px #f2c14e, 0 0 0 5px #261c1b, 0 6px 0 3px rgba(0, 0, 0, 0.25); }
.pv { display: block; width: 100%; aspect-ratio: 36 / 30; image-rendering: pixelated; image-rendering: crisp-edges; }
.plate { display: block; margin-top: 4px; padding: 3px 0 5px; font-size: 12px; font-weight: 900; letter-spacing: 0.2em; background: #80502c; color: #e6c79c; box-shadow: inset 0 -3px 0 #603b25; }
.pick.on .plate { background: #f2c14e; color: #3b2a20; box-shadow: inset 0 -3px 0 #d99a2b; }

.namerow { display: flex; gap: 10px; align-items: stretch; padding: 0 3px; }
.nm {
  flex: 1; min-width: 0; font: inherit; font-size: 18px; font-weight: 900; color: #261c1b; background: #fffaf0;
  border: 0; border-radius: 0; padding: 8px 10px; outline: none; -webkit-user-select: text; user-select: text;
  box-shadow: var(--px-border-2), inset 0 3px 0 #ecdcc4;
}
.nm:focus { box-shadow: var(--px-border-2), inset 0 3px 0 #ecdcc4, 0 0 0 5px #f2c14e; }
.dice { min-height: 44px; width: 48px; padding: 0 0 3px; }
/* xúc xắc pixel */
.die { position: relative; display: block; width: 18px; height: 18px; background: #fffaf0; box-shadow: 0 0 0 2px #3b2a20; }
.die b { position: absolute; width: 4px; height: 4px; background: #3b2a20; }
.die b:nth-child(1) { left: 2px; top: 2px; } .die b:nth-child(2) { left: 7px; top: 7px; } .die b:nth-child(3) { left: 12px; top: 12px; }
.sign { margin: 12px 3px 0; font-size: 12px; font-weight: 700; color: #8a6a50; }
.sign b { color: #3b2a20; }

.go { margin-top: 8px; color: #fff; text-shadow: 0 2px 0 #1d6b47; }
.note { font-size: 12px; text-align: center; color: #c9a888; font-weight: 700; }
</style>
