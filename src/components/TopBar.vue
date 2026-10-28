<script setup lang="ts">
import { computed } from 'vue'
import { save, ui, clock } from '../game/store'
import { money } from '../game/data'
import { ref } from 'vue'
import { audio, unlockAudio, TRACK_LIST, type TrackChoice } from '../game/audio'
import PixelIcon from './ui/PixelIcon.vue'
import PixelNum from './ui/PixelNum.vue'
import logoUrl from '../assets/logo.png'

function toggle(k: 'music' | 'sfx') { unlockAudio(); audio[k] = !audio[k] }
const menu = ref(false)
const BUILD = __BUILD__
function choose(id: TrackChoice) { unlockAudio(); audio.track = id; audio.music = true; menu.value = false }
const playingName = () => (audio.playing === 'boss' ? 'Kịch tính (boss)' : audio.playing === 'bossSoft' ? 'Hồi hộp nhẹ (boss)' : audio.playing === 'report' ? 'Mappy (tổng kết ngày)' : TRACK_LIST.find((t) => t.id === audio.playing)?.name ?? '')

const moneyText = computed(() => money(save.money).replace(/\s/g, ''))
const wxIcon = computed(() => ({ sunny: 'sunny', hot: 'hot', cloudy: 'cloudy', rainy: 'rainy' } as Record<string, string>)[save.weather] || 'sunny')
const stars = computed(() => Math.round(save.reputation / 20 * 2) / 2) // 0..5, bước 0.5
</script>

<template>
  <header class="topbar" :class="{ compact: ui.phase === 'open' }">
    <div class="brandrow">
      <button class="brand" title="Xem lại truyện mở đầu" @click="ui.phase !== 'open' && (ui.showIntro = true)"><img :src="logoUrl" class="blogo" alt="" /> DREAMERS COFFEE <small class="owner">· {{ save.player }} & Cáo</small></button>
      <div class="snd">
        <button :class="{ off: !audio.music }" @click="unlockAudio(); menu = !menu" aria-label="Nhạc"><PixelIcon name="music" :size="2" /></button>
        <button :class="{ off: !audio.sfx }" @click="toggle('sfx')" aria-label="Âm thanh"><PixelIcon :name="audio.sfx ? 'speaker' : 'speakerOff'" :size="2" /></button>
      </div>
    </div>
    <Transition name="drop">
      <div v-if="menu" class="music-menu" @click.stop>
        <div class="mm-head">
          <b>NHẠC QUÁN</b>
          <button class="sw" :class="{ on: audio.music }" @click="toggle('music')">{{ audio.music ? 'BẬT' : 'TẮT' }}</button>
        </div>
        <label class="vol">
          <PixelIcon :name="audio.volume > 0 ? 'speaker' : 'speakerOff'" :size="2" />
          <input type="range" min="0" max="1" step="0.05" v-model.number="audio.volume" aria-label="Âm lượng" />
          <b>{{ Math.round(audio.volume * 100) }}</b>
        </label>
        <button v-for="t in TRACK_LIST" :key="t.id" class="trk" :class="{ sel: audio.track === t.id }" @click="choose(t.id)">
          <PixelIcon name="music" :size="2" />
          <span class="tt"><b>{{ t.name }}</b><small>{{ t.desc }}</small></span>
          <span v-if="audio.track === t.id" class="chk"><PixelIcon name="play" :size="2" /></span>
        </button>
        <div v-if="audio.music && audio.playing" class="now">Đang phát: {{ playingName() }}</div>
        <div class="note">Nhạc quán: bossa nova sáng tác riêng cho Dreamers Coffee · Bản cập nhật: {{ BUILD }}</div>
      </div>
    </Transition>
    <div class="money">
      <span v-if="ui.phase !== 'open'" class="label">TIỀN QUÁN</span>
      <PixelNum :text="moneyText" :size="ui.phase === 'open' ? 3 : 4" :color="save.money < 0 ? '#ff9a8c' : '#ffd77a'" shadow="#2a1a10" :light="save.money < 0 ? '#ffc4bb' : '#fff1a8'" />
    </div>
    <div class="chips">
      <div class="chip">
        <PixelIcon :name="wxIcon" :size="2.4" />
        <span v-if="ui.phase === 'open'" class="mono">{{ clock }}</span>
        <span v-else>NGÀY {{ save.day }}</span>
      </div>
      <div class="chip beans" title="Hạt vàng"><PixelIcon name="bean" :size="2" />{{ save.meta.beans }}</div>
      <div class="chip rep" :title="`Danh tiếng ${Math.round(save.reputation)}/100`">
        <PixelIcon name="star" :size="2" />{{ stars.toFixed(1) }}
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  padding: calc(var(--safe-top) + 8px) 14px 12px;
  background:
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.06) 0 2px, transparent 2px 9px),
    #6f4630;
  color: #fff;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  box-shadow: inset 0 -4px 0 #4a2e1f, inset 0 2px 0 #8a5a3c, 0 3px 0 #3b2a20, 0 6px 0 rgba(59, 42, 32, 0.18);
  z-index: 2;
}
.brandrow { width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.blogo { width: 20px; height: 20px; image-rendering: pixelated; box-shadow: 0 0 0 2px #3b2a20; }
.owner { font-size: 10px; letter-spacing: 0.04em; color: #e6c79c; font-weight: 800; }
.brand { background: none; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.16em; color: #ffe8b8; text-shadow: 0 1px 0 #3b2a20; }
.snd { display: flex; gap: 8px; }
.snd button {
  width: 32px; height: 30px; display: flex; align-items: center; justify-content: center;
  background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -3px 0 #d8bf9f, 0 3px 0 #3b2a20;
}
.snd button:active { transform: translateY(2px); box-shadow: var(--px-border-2); }
.snd button.off { background: #b9a48f; box-shadow: var(--px-border-2), inset 0 -3px 0 #9c8670; opacity: 0.8; }
.topbar.compact { padding-bottom: 8px; }
.topbar.compact .brandrow { margin-bottom: 4px; }
.topbar.compact .chip { padding: 3px 8px 4px; font-size: 12px; }
.money { display: flex; flex-direction: column; gap: 4px; }
.label { font-size: 10px; font-weight: 900; letter-spacing: 0.16em; color: #e6c79c; }
.chips { display: flex; gap: 6px; }
.chip {
  display: flex; align-items: center; gap: 6px;
  background: #4a2e1f; color: #ffe8b8;
  padding: 5px 9px 6px;
  font-size: 13px; font-weight: 900; letter-spacing: 0.04em;
  box-shadow: var(--px-border-2), inset 0 2px 0 #3b2318;
}
.mono { font-variant-numeric: tabular-nums; }

.music-menu {
  position: absolute; right: 12px; top: calc(var(--safe-top) + 48px); z-index: 50;
  width: 272px; background: var(--paper); color: var(--ink);
  padding: 10px; box-shadow: var(--px-border), inset 0 -4px 0 var(--paper-shade), 0 7px 0 rgba(59, 42, 32, 0.35);
}
.mm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.mm-head b { font-size: 12px; letter-spacing: 0.14em; color: #a9744f; }
.sw { font-size: 11px; font-weight: 900; padding: 3px 10px; background: #e6d6c2; color: #8a7566; box-shadow: var(--px-border-2); }
.sw.on { background: #3fb57b; color: #fff; }
.vol { display: flex; align-items: center; gap: 8px; padding: 6px 8px 8px; margin-bottom: 4px; background: #f1e2cf; box-shadow: var(--px-border-2); }
.vol b { font-size: 12px; min-width: 24px; text-align: right; font-variant-numeric: tabular-nums; }
.vol input { flex: 1; -webkit-appearance: none; appearance: none; height: 8px; background: #5a4334; box-shadow: 0 0 0 2px #3b2a20; outline: none; }
.vol input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 20px; background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20, inset 0 -3px 0 #d99a2b; cursor: pointer; }
.vol input::-moz-range-thumb { width: 14px; height: 20px; border: none; border-radius: 0; background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20; cursor: pointer; }
.mm-sub { font-size: 10px; font-weight: 900; letter-spacing: 0.12em; color: #a9744f; margin: 10px 2px 6px; }
.trk { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; padding: 7px 8px; margin-top: 4px; }
.trk.sel { background: #fff0cc; box-shadow: var(--px-border-2); }
.tt { flex: 1; display: flex; flex-direction: column; }
.tt b { font-size: 13px; }
.tt small { font-size: 11px; color: var(--muted); }
.now { font-size: 11px; font-weight: 900; color: #6f4e37; margin-top: 8px; }
.note { font-size: 10px; color: var(--muted); margin-top: 4px; }
.drop-enter-active, .drop-leave-active { transition: all 0.15s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
