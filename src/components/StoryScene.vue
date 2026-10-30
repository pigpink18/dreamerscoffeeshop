<script setup lang="ts">
// Cảnh hội thoại của cốt truyện chính (kiểu visual novel): quán vẽ pixel, nhân vật đứng sau quầy,
// Cáo ngồi trên quầy, khung thoại gõ từng chữ + lựa chọn. Chung kết thì nối thêm đoạn kết theo điểm.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { save } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { px, drawRoom, drawCounter, drawPerson, drawCorgi, drawLights, CZ, SCENE_W, SCENE_H, COUNTER_Y, loadImages, type Ctx } from '../game/pixel'
import {
  CAST, CHAPTERS, ENDING_TITLE, applyChoice, endingKind, endingLines, endingScore, finishChapter, speakerName, visibleLines,
  type Chapter, type Choice, type Line, type Speaker,
} from '../game/story'
import TypeText from './TypeText.vue'
import PixelIcon from './ui/PixelIcon.vue'

const props = defineProps<{ chapter: Chapter }>()
const ch = props.chapter
const isFinale = ch.id === CHAPTERS[CHAPTERS.length - 1].id

const queue = ref<Line[]>(visibleLines(ch.lines))
const i = ref(0)
const line = computed(() => queue.value[i.value])
const text = computed(() => line.value.text.replace(/\{name\}/g, save.player || 'Yến'))
const typer = ref<InstanceType<typeof TypeText> | null>(null)
const typed = ref(false)
const picked = ref(false)
const ending = ref<null | 'great' | 'good' | 'retry'>(null)
let endAppended = false
const pitch = computed(() => (line.value.who === 'cao' ? 900 : line.value.who === 'none' ? 500 : CAST[line.value.who].pitch))
const showChoices = computed(() => typed.value && !!line.value.choices && !picked.value)

function tap() {
  unlockAudio()
  if (ending.value) return
  if (!typed.value) { typer.value?.skip(); return }
  if (line.value.choices && !picked.value) return
  advance()
}
function advance() {
  if (i.value < queue.value.length - 1) { i.value++; typed.value = false; picked.value = false; sfx('tap'); return }
  if (isFinale && !endAppended) {
    // nối đoạn kết (tính theo điểm lúc này)
    endAppended = true
    queue.value.push(...endingLines()); i.value++; typed.value = false; return
  }
  if (isFinale && !ending.value) { ending.value = endingKind(); sfx(ending.value === 'retry' ? 'tap' : 'heart'); return }
  done()
}
function choose(c: Choice) {
  applyChoice(c)
  picked.value = true
  if (c.reply?.length) queue.value.splice(i.value + 1, 0, ...c.reply)
  advance()
}
function done() {
  finishChapter(ch)
  sfx('done')
}
function onTyped() { typed.value = true }

// ---------- vẽ cảnh ----------
const cv = ref<HTMLCanvasElement | null>(null)
const K = 5
let raf = 0
const t0 = performance.now()

/** vị trí nhân vật: trái = cast[0], phải = người đang nói nếu không có trong cast (khách mời), không thì cast[1] */
const slots = computed<[Speaker, Speaker]>(() => {
  const [a, b] = ch.cast
  const w = line.value.who
  const guest = w !== 'none' && w !== 'cao' && w !== a && w !== b
  return [a, guest ? w : b]
})

function bg(c: Ctx, t: number) {
  if (ch.bg === 'stage') {
    // sân khấu ngoài trời buổi tối giữa chợ
    const bands = ['#1d2547', '#25305a', '#2f3b69', '#3b4777', '#4a5585']
    bands.forEach((col, k) => px(c, 0, k * 9, SCENE_W, 9, col))
    for (let k = 0; k < 14; k++) px(c, (k * 37) % SCENE_W, (k * 13) % 30, 1, 1, Math.floor(t * 2 + k) % 4 ? '#fff6d8' : '#8b93c4')
    px(c, 0, 45, SCENE_W, 17, '#2a2240')
    for (let x = 0; x < SCENE_W; x += 12) px(c, x, 38 + ((x / 12) % 3) * 2, 10, 24, '#352b4f') // mái chợ xa
    drawLights(c, t)
    px(c, 0, COUNTER_Y, SCENE_W, SCENE_H - COUNTER_Y, CZ.w2) // sàn sân khấu
    for (let x = 0; x < SCENE_W; x += 10) px(c, x, COUNTER_Y, 1, SCENE_H - COUNTER_Y, CZ.w1)
    px(c, 0, COUNTER_Y, SCENE_W, 2, CZ.w4)
    // băng rôn
    px(c, 30, 10, 68, 11, CZ.r1); px(c, 30, 21, 68, 1, CZ.r0)
    for (let x = 34; x < 94; x += 4) px(c, x, 14, 2, 3, '#ffe8b8')
    // đèn rọi
    c.fillStyle = 'rgba(255, 236, 170, 0.12)'
    c.beginPath(); c.moveTo(20, 0); c.lineTo(8, COUNTER_Y); c.lineTo(52, COUNTER_Y); c.fill()
    c.beginPath(); c.moveTo(108, 0); c.lineTo(76, COUNTER_Y); c.lineTo(120, COUNTER_Y); c.fill()
    return
  }
  const dayFrac = ch.bg === 'shop' ? 0.35 : ch.bg === 'night' ? 0.92 : 0.72
  drawRoom(c, dayFrac, ch.bg === 'rain' ? 'rainy' : ch.bg === 'night' ? 'cloudy' : 'sunny', t)
}
function overlay(c: Ctx, t: number) {
  if (ch.bg === 'night' || ch.bg === 'rain') {
    c.fillStyle = ch.bg === 'rain' ? 'rgba(20, 16, 40, 0.5)' : 'rgba(16, 14, 36, 0.38)'
    c.fillRect(0, 0, SCENE_W, SCENE_H)
  }
  if (ch.bg === 'rain') {
    // đèn cầy trên quầy (đêm cúp điện)
    for (const x of [14, 108]) {
      const fl = Math.floor(t * 8 + x) % 3
      c.fillStyle = 'rgba(255, 190, 90, 0.16)'; c.beginPath(); c.arc(x + 1, COUNTER_Y - 6, 16 + fl, 0, Math.PI * 2); c.fill()
      px(c, x, COUNTER_Y - 6, 3, 6, '#f4ead8'); px(c, x + 1, COUNTER_Y - 8 - (fl ? 1 : 0), 1, 2, '#ffb43c'); px(c, x + 1, COUNTER_Y - 7, 1, 1, '#fff2a8')
    }
  }
}
function person(c: Ctx, s: Speaker, x: number, t: number) {
  if (s === 'none' || s === 'cao') return
  const talking = line.value.who === s
  const bob = talking && !typed.value ? Math.floor(t * 6) % 2 : 0
  const mood = talking ? line.value.mood ?? 'neutral' : 'neutral'
  const blink = Math.floor(t * 10 + x) % 41 === 0
  drawPerson(c, CAST[s].look, x, 34 - bob, mood, blink)
  if (talking) { px(c, x + 6, 27 - (Math.floor(t * 3) % 2), 4, 1, CZ.b1); px(c, x + 7, 28 - (Math.floor(t * 3) % 2), 2, 1, CZ.b1) } // mũi tên người đang nói
  else if (line.value.who !== 'none') { c.fillStyle = 'rgba(38, 28, 27, 0.18)'; c.fillRect(x, 34, 16, 28) } // người không nói hơi tối đi
}
function frame() {
  const c = cv.value?.getContext('2d')
  if (c) {
    const t = (performance.now() - t0) / 1000
    c.setTransform(K, 0, 0, K, 0, 0)
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, SCENE_W, SCENE_H)
    bg(c, t)
    const [a, b] = slots.value
    person(c, a, 18, t)
    person(c, b, 94, t)
    if (ch.bg === 'stage') { px(c, 0, COUNTER_Y, SCENE_W, 3, CZ.w5) } else drawCounter(c)
    const caoTalk = line.value.who === 'cao'
    drawCorgi(c, 53, COUNTER_Y - 17 - (caoTalk && !typed.value ? Math.floor(t * 6) % 2 : 0), t, ch.id === 'c5' && !caoTalk ? 'lie' : 'sit', ch.id !== 'c5', save.meta.wear)
    overlay(c, t)
    // khung tối 4 góc
    c.fillStyle = 'rgba(20, 12, 8, 0.22)'; c.fillRect(0, 0, SCENE_W, 2); c.fillRect(0, SCENE_H - 2, SCENE_W, 2)
  }
  raf = requestAnimationFrame(frame)
}
onMounted(() => { loadImages(); raf = requestAnimationFrame(frame); sfx('bell') })
onBeforeUnmount(() => cancelAnimationFrame(raf))

const nameCol = (s: Speaker) => ({ yen: '#3f7a73', cao: '#a16b36', tu: '#7a4f8a', thang: '#24242b', me: '#b8484a', kenny: '#2e3f6e', linh: '#d9568a', none: '#8a7566' })[s]
const score = computed(() => endingScore())
</script>

<template>
  <div class="story" @click="tap">
    <div class="wrap">
      <div class="top">
        <span class="ttl"><PixelIcon name="star" :size="2" /> {{ ch.title }}</span>
        <span class="day">NGÀY {{ save.day }}</span>
      </div>
      <div class="stage"><canvas ref="cv" :width="SCENE_W * K" :height="SCENE_H * K" class="cv" /></div>

      <div v-if="!ending" class="box" :class="{ narr: line.who === 'none' }">
        <span v-if="line.who !== 'none'" class="name" :style="{ background: nameCol(line.who) }">{{ speakerName(line.who) }}</span>
        <div class="txt"><TypeText ref="typer" :key="i + ':' + text" :text="text" :pitch="pitch" :speed="28" @done="onTyped" /></div>
        <div v-if="showChoices" class="choices" @click.stop>
          <button v-for="(c, k) in line.choices" :key="k" :class="{ sassy: c.sassy }" @click="choose(c)">
            <PixelIcon :name="c.sassy ? 'megaphone' : 'chat'" :size="2" /> <span v-if="c.sassy" class="sass">XÉO SẮC</span> {{ c.text }}
          </button>
        </div>
        <div v-else class="nav"><span class="hint">{{ typed ? 'chạm để tiếp ▸' : '' }}</span></div>
      </div>

      <div v-else class="box end" @click.stop>
        <div class="etag">KẾT THÚC CỐT TRUYỆN</div>
        <b class="etitle">{{ ENDING_TITLE[ending] }}</b>
        <div class="escore">Danh tiếng {{ Math.round(save.reputation) }} + lòng phố {{ (save.story.flags.support ?? 0) * 2 }} = <b>{{ score }}</b> điểm</div>
        <div class="muted">Quán vẫn mở tiếp, bạn cứ chơi thoả thích. {{ ending === 'retry' ? 'Mùa sau thử chọn khác xem sao nhé!' : '' }}</div>
        <button class="go" @click="done"><PixelIcon name="play" :size="2" /> TIẾP TỤC BÁN</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story {
  position: absolute; inset: 0; z-index: 90; display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: #241812; color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 10px) 14px calc(env(safe-area-inset-bottom, 0px) + 18px);
  user-select: none; -webkit-user-select: none; overflow-y: auto;
}
.wrap { width: 100%; max-width: 480px; margin: auto 0; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ttl { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; color: #e6c79c; text-transform: uppercase; }
.day { font-size: 11px; font-weight: 900; color: #a16b36; letter-spacing: 0.1em; }
.stage { position: relative; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 10px 0 10px rgba(0, 0, 0, 0.3); margin: 10px; }
.cv { display: block; width: 100%; aspect-ratio: 128 / 92; image-rendering: pixelated; image-rendering: crisp-edges; }
.box {
  position: relative; margin: 34px 7px 0; background: #fff4dc; color: #261c1b; padding: 18px 14px 12px; font-size: 16px; line-height: 1.5; font-weight: 600;
  box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #a16b36, 0 0 0 9px #261c1b, inset 0 -4px 0 #eed59b, 0 9px 0 9px rgba(0, 0, 0, 0.3); min-height: 130px;
  display: flex; flex-direction: column; gap: 10px;
}
.box.narr { background: #f1e3c6; font-style: italic; color: #4a3428; }
.name { position: absolute; left: 8px; top: -14px; font-size: 12px; font-weight: 900; color: #fff; padding: 3px 10px 4px; letter-spacing: 0.04em; box-shadow: 0 0 0 3px #261c1b; }
.nav { margin-top: auto; display: flex; justify-content: flex-end; }
.hint { font-size: 11px; color: #a16b36; animation: blink 1.4s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.35; } }
.choices { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; animation: cin 0.2s ease-out; }
@keyframes cin { from { opacity: 0; transform: translateY(4px); } }
.choices button {
  text-align: left; font-size: 14px; font-weight: 800; line-height: 1.35; padding: 9px 10px 11px; background: #fff; color: #261c1b;
  box-shadow: -2px 0 0 0 #3b2a20, 2px 0 0 0 #3b2a20, 0 -2px 0 0 #3b2a20, 0 2px 0 0 #3b2a20, inset 0 -3px 0 #e6d3b8;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.choices button.sassy { background: #fff0e6; }
.choices button:active { background: #f2c14e; }
.sass { font-size: 9px; font-weight: 900; color: #fff; background: #d9534f; padding: 1px 4px; letter-spacing: 0.06em; }
.end { align-items: center; text-align: center; gap: 8px; }
.etag { font-size: 10px; font-weight: 900; letter-spacing: 0.18em; color: #a16b36; }
.etitle { font-size: 18px; line-height: 1.3; }
.escore { font-size: 13px; }
.muted { font-size: 12px; color: #8a7566; }
.go { margin-top: 6px; display: inline-flex; align-items: center; gap: 6px; font-weight: 900; font-size: 14px; padding: 8px 16px 10px; background: #2f9e6b; color: #fff; box-shadow: var(--px-border-2), inset 0 -4px 0 #1d6b47; }
</style>
