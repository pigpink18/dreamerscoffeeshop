<script setup lang="ts">
// Sổ tay: nhiệm vụ ngày, album khách, thành tựu, app DreamersFood
import { ref, computed } from 'vue'
import { save, ui } from '../game/store'
import { REGULARS, CHARACTERS, FEMALE_NAMES, MALE_NAMES, randomLook } from '../game/data'
import { INTL_NAMES } from '../game/guests'
import { RARE, ACHIEVEMENTS, achCtx, albumCount, ALBUM_TOTAL } from '../game/meta'
import AppView from './AppView.vue'
import PixelIcon from './ui/PixelIcon.vue'
import PersonPortrait from './ui/PersonPortrait.vue'
import { L } from '../game/i18n'

const seg = ref<'quest' | 'album' | 'ach' | 'app'>('quest')
const Q = computed(() => save.meta.quests)
const doneN = computed(() => Q.value.list.filter((q) => q.done).length)
const A = save.meta.album

// ô album: key, tên, ngoại hình (hoặc bóng đen nếu chưa gặp)
const fallback = randomLook()
const groups = computed(() => rawGroups.value.map((g) => ({ ...g, seen: g.items.filter((x) => save.meta.album[x.key]).length })))
const rawGroups = computed(() => [
  { title: L('Khách quen', 'Regulars'), items: REGULARS.map((r) => ({ key: `reg:${r.id}`, name: r.name, look: r.look })) },
  { title: L('Khách hiếm', 'Rare guests'), items: RARE.map((r) => ({ key: `rare:${r.id}`, name: r.name, look: r.look })) },
  { title: L('Khách cá tính', 'Characters'), items: CHARACTERS.map((b, i) => ({ key: `boss:${i}`, name: b.name, look: b.look })) },
  { title: L('Khách du lịch', 'Tourists'), items: INTL_NAMES.map((n) => ({ key: `intl:${n.name}`, name: n.name, look: save.meta.album[`intl:${n.name}`]?.look ?? fallback })) },
  { title: L('Khách vãng lai', 'Passers-by'), items: [...FEMALE_NAMES, ...MALE_NAMES].map((n) => ({ key: `name:${n}`, name: n, look: save.meta.album[`name:${n}`]?.look ?? fallback })) },
])
const rareHint = (key: string) => {
  const r = RARE.find((x) => `rare:${x.id}` === key)
  if (!r) return ''
  const w = r.weather ? L({ sunny: 'nắng', hot: 'nóng', cloudy: 'nhiều mây', rainy: 'mưa' }, { sunny: 'sunny', hot: 'hot', cloudy: 'cloudy', rainy: 'rainy' }) as Record<string, string> : null
  const parts = [r.weather && w ? L('trời ', '') + r.weather.map((x) => w[x]).join('/') : '', r.from !== undefined && r.from >= 0.6 ? L('buổi tối', 'evening') : r.to !== undefined && r.to <= 0.4 ? L('buổi sáng', 'morning') : '', r.minDay ? L(`từ ngày ${r.minDay}`, `from day ${r.minDay}`) : '']
  return parts.filter(Boolean).join(', ') || L('bất chợt', 'anytime')
}
const achList = computed(() => ACHIEVEMENTS.map((a) => {
  const v = a.stat(achCtx.value)
  return { ...a, v: Math.min(v, a.goal), done: save.meta.ach.includes(a.id) }
}).sort((a, b) => Number(a.done) - Number(b.done) || b.v / b.goal - a.v / a.goal))
const fmt = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + L('tr', 'M') : String(n))
void ui
void A
</script>

<template>
  <div>
    <div class="segs">
      <button :class="{ on: seg === 'quest' }" @click="seg = 'quest'">{{ L('Nhiệm vụ', 'Quests') }}<span v-if="doneN < 3" class="dotn">{{ 3 - doneN }}</span></button>
      <button :class="{ on: seg === 'album' }" @click="seg = 'album'">Album</button>
      <button :class="{ on: seg === 'ach' }" @click="seg = 'ach'">{{ L('Thành tựu', 'Trophies') }}</button>
      <button :class="{ on: seg === 'app' }" @click="seg = 'app'">{{ L('App & khách', 'App & guests') }}</button>
    </div>

    <!-- Nhiệm vụ -->
    <template v-if="seg === 'quest'">
      <div class="card beans"><PixelIcon name="bean" :size="3" /><b>{{ save.meta.beans }} {{ L('hạt vàng', 'gold beans') }}</b><span class="muted small grow">{{ L('dùng ở Nâng cấp › Tiệm của Cáo', "spend at Upgrades › Cáo's Shop") }}</span></div>
      <div class="section-title">{{ L(`Nhiệm vụ ngày ${save.day}`, `Day ${save.day} quests`) }} · {{ doneN }}/3</div>
      <div class="list">
        <div v-for="(q, i) in Q.list" :key="i" class="card quest" :class="{ done: q.done }">
          <PixelIcon :name="q.done ? 'star' : 'starOff'" :size="3" />
          <div class="grow">
            <b>{{ q.text }}</b>
            <i class="pbar"><b :style="{ width: (q.progress / q.target) * 100 + '%' }" /></i>
            <small class="muted">{{ q.kind === 'revenue' || q.kind === 'tips' ? `${fmt(q.progress)}/${fmt(q.target)}` : `${q.progress}/${q.target}` }}</small>
          </div>
          <span class="pxtag" :class="q.done ? 'good' : 'warn'"><PixelIcon name="bean" :size="2" /> {{ q.beans }}</span>
        </div>
      </div>
      <p class="muted note">{{ L('Xong cả 3 nhiệm vụ: thưởng thêm 5 hạt vàng và có thể nhận gợi ý công thức bí mật. Nhiệm vụ đổi mỗi ngày.', 'Finish all 3 quests for 5 bonus gold beans and a chance at a secret recipe hint. Quests change daily.') }}</p>
    </template>

    <!-- Album -->
    <template v-else-if="seg === 'album'">
      <div class="card beans"><PixelIcon name="menu" :size="3" /><b>{{ albumCount }}/{{ ALBUM_TOTAL }} {{ L('khách', 'guests') }}</b><i class="pbar grow"><b :style="{ width: (albumCount / ALBUM_TOTAL) * 100 + '%' }" /></i></div>
      <template v-for="g in groups" :key="g.title">
        <div class="section-title">{{ g.title }} · {{ g.seen }}/{{ g.items.length }}</div>
        <div class="album">
          <div v-for="it in g.items" :key="it.key" class="cell" :class="{ seen: save.meta.album[it.key] }">
            <PersonPortrait :look="it.look" :scale="2" :hidden="!save.meta.album[it.key]" />
            <small>{{ save.meta.album[it.key] ? it.name : '???' }}</small>
            <em v-if="save.meta.album[it.key]">x{{ save.meta.album[it.key].n }}</em>
            <em v-else-if="it.key.startsWith('rare:')" class="hint">{{ rareHint(it.key) }}</em>
          </div>
        </div>
      </template>
    </template>

    <!-- Thành tựu -->
    <template v-else-if="seg === 'ach'">
      <div class="section-title">{{ L('Thành tựu', 'Trophies') }} · {{ save.meta.ach.length }}/{{ ACHIEVEMENTS.length }}</div>
      <div class="list">
        <div v-for="a in achList" :key="a.id" class="card quest" :class="{ done: a.done }">
          <PixelIcon :name="a.done ? 'trophy' : 'lock'" :size="3" />
          <div class="grow">
            <b>{{ a.name }}</b>
            <div class="muted small">{{ a.desc }}</div>
            <i class="pbar"><b :style="{ width: (a.v / a.goal) * 100 + '%' }" /></i>
            <small class="muted">{{ fmt(a.v) }}/{{ fmt(a.goal) }}</small>
          </div>
          <span class="pxtag" :class="a.done ? 'good' : ''"><PixelIcon name="bean" :size="2" /> {{ a.beans }}</span>
        </div>
      </div>
    </template>

    <AppView v-else />
  </div>
</template>

<style scoped>
.beans { display: flex; align-items: center; gap: 10px; }
.small { font-size: 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.quest { display: flex; align-items: center; gap: 10px; }
.quest b { font-size: 13px; }
.quest .pbar { margin: 6px 0 2px; }
.quest small { font-size: 10px; }
.quest.done { background: #eefaf2; }
.quest .pxtag { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; }
.note { font-size: 12px; margin: 12px 4px; }
.album { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 2px 7px; background: #efe3d5; box-shadow: var(--px-border-2); text-align: center; }
.cell.seen { background: #fffaf0; }
.cell small { font-size: 10px; font-weight: 800; line-height: 1.2; }
.cell em { font-style: normal; font-size: 9px; color: #a9744f; font-weight: 800; }
.cell em.hint { color: #8a7566; font-weight: 600; }
.shadow { filter: brightness(0) opacity(0.35); }
</style>
