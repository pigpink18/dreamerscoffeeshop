<script setup lang="ts">
// Sổ tay: nhiệm vụ ngày, album khách, thành tựu, app DreamersFood
import { ref, computed } from 'vue'
import { save, ui } from '../game/store'
import { REGULARS, BOSSES, FEMALE_NAMES, MALE_NAMES, randomLook } from '../game/data'
import { RARE, ACHIEVEMENTS, achCtx, albumCount, ALBUM_TOTAL } from '../game/meta'
import AppView from './AppView.vue'
import PixelIcon from './ui/PixelIcon.vue'
import PersonPortrait from './ui/PersonPortrait.vue'
import BossPortrait from './ui/BossPortrait.vue'

const seg = ref<'quest' | 'album' | 'ach' | 'app'>('quest')
const Q = computed(() => save.meta.quests)
const doneN = computed(() => Q.value.list.filter((q) => q.done).length)
const A = save.meta.album

// ô album: key, tên, ngoại hình (hoặc bóng đen nếu chưa gặp)
const fallback = randomLook()
const groups = computed(() => rawGroups.value.map((g) => ({ ...g, seen: g.items.filter((x) => save.meta.album[x.key]).length })))
const rawGroups = computed(() => [
  { title: 'Khách quen', items: REGULARS.map((r) => ({ key: `reg:${r.id}`, name: r.name, look: r.look, boss: -1 })) },
  { title: 'Khách hiếm', items: RARE.map((r) => ({ key: `rare:${r.id}`, name: r.name, look: r.look, boss: -1 })) },
  { title: 'Boss khó tính', items: BOSSES.map((b, i) => ({ key: `boss:${i}`, name: b.name, look: b.look, boss: i })) },
  { title: 'Khách vãng lai', items: [...FEMALE_NAMES, ...MALE_NAMES].map((n) => ({ key: `name:${n}`, name: n, look: save.meta.album[`name:${n}`]?.look ?? fallback, boss: -1 })) },
])
const rareHint = (key: string) => {
  const r = RARE.find((x) => `rare:${x.id}` === key)
  if (!r) return ''
  const w = r.weather ? { sunny: 'nắng', hot: 'nóng', cloudy: 'nhiều mây', rainy: 'mưa' } as Record<string, string> : null
  const parts = [r.weather && w ? 'trời ' + r.weather.map((x) => w[x]).join('/') : '', r.from !== undefined && r.from >= 0.6 ? 'buổi tối' : r.to !== undefined && r.to <= 0.4 ? 'buổi sáng' : '', r.minDay ? `từ ngày ${r.minDay}` : '']
  return parts.filter(Boolean).join(', ') || 'bất chợt'
}
const achList = computed(() => ACHIEVEMENTS.map((a) => {
  const v = a.stat(achCtx.value)
  return { ...a, v: Math.min(v, a.goal), done: save.meta.ach.includes(a.id) }
}).sort((a, b) => Number(a.done) - Number(b.done) || b.v / b.goal - a.v / a.goal))
const fmt = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'tr' : String(n))
void ui
void A
</script>

<template>
  <div>
    <div class="segs">
      <button :class="{ on: seg === 'quest' }" @click="seg = 'quest'">Nhiệm vụ<span v-if="doneN < 3" class="dotn">{{ 3 - doneN }}</span></button>
      <button :class="{ on: seg === 'album' }" @click="seg = 'album'">Album</button>
      <button :class="{ on: seg === 'ach' }" @click="seg = 'ach'">Thành tựu</button>
      <button :class="{ on: seg === 'app' }" @click="seg = 'app'">App & khách</button>
    </div>

    <!-- Nhiệm vụ -->
    <template v-if="seg === 'quest'">
      <div class="card beans"><PixelIcon name="bean" :size="3" /><b>{{ save.meta.beans }} hạt vàng</b><span class="muted small grow">dùng ở Nâng cấp › Tiệm của Cáo</span></div>
      <div class="section-title">Nhiệm vụ ngày {{ save.day }} · {{ doneN }}/3</div>
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
      <p class="muted note">Xong cả 3 nhiệm vụ: thưởng thêm 5 hạt vàng và có thể nhận gợi ý công thức bí mật. Nhiệm vụ đổi mỗi ngày.</p>
    </template>

    <!-- Album -->
    <template v-else-if="seg === 'album'">
      <div class="card beans"><PixelIcon name="menu" :size="3" /><b>{{ albumCount }}/{{ ALBUM_TOTAL }} khách</b><i class="pbar grow"><b :style="{ width: (albumCount / ALBUM_TOTAL) * 100 + '%' }" /></i></div>
      <template v-for="g in groups" :key="g.title">
        <div class="section-title">{{ g.title }} · {{ g.seen }}/{{ g.items.length }}</div>
        <div class="album">
          <div v-for="it in g.items" :key="it.key" class="cell" :class="{ seen: save.meta.album[it.key] }">
            <BossPortrait v-if="it.boss >= 0" :idx="it.boss" mood="grumpy" :scale="2" :class="{ shadow: !save.meta.album[it.key] }" />
            <PersonPortrait v-else :look="it.look" :scale="2" :hidden="!save.meta.album[it.key]" />
            <small>{{ save.meta.album[it.key] ? it.name : '???' }}</small>
            <em v-if="save.meta.album[it.key]">x{{ save.meta.album[it.key].n }}</em>
            <em v-else-if="it.key.startsWith('rare:')" class="hint">{{ rareHint(it.key) }}</em>
          </div>
        </div>
      </template>
    </template>

    <!-- Thành tựu -->
    <template v-else-if="seg === 'ach'">
      <div class="section-title">Thành tựu · {{ save.meta.ach.length }}/{{ ACHIEVEMENTS.length }}</div>
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
