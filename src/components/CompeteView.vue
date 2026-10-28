<script setup lang="ts">
// Đua top: bảng xếp hạng tuần trên Phố Dốc Mộng Mơ với 5 quán đối thủ + bảng online (nếu bật)
import { computed } from 'vue'
import { save } from '../game/store'
import { moneyShort } from '../game/data'
import { street, myRank, weekNo, daysLeftInWeek, isContestDay, streetMul, WEEK_REWARDS_LIST } from '../game/meta'
import PixelIcon from './ui/PixelIcon.vue'
import OnlineBoard from './meta/OnlineBoard.vue'

const top = computed(() => Math.max(1, ...street.value.map((r) => r.week)))
const news = computed(() => (save.meta.news && save.meta.news.day === save.day ? save.meta.news : null))
const last = computed(() => save.meta.week.lastResult)
const MEDAL = ['#f2c14e', '#c4cbd1', '#d9874a']
</script>

<template>
  <div>
    <div class="card head">
      <PixelIcon name="trophy" :size="5" />
      <div class="grow">
        <div class="kicker">PHỐ DỐC MỘNG MƠ · TUẦN {{ weekNo }}</div>
        <div class="ttl">Bạn đang hạng <b>#{{ myRank + 1 }}</b> / 6</div>
        <div class="muted small">
          <template v-if="isContestDay">Hôm nay là <b>Ngày hội Barista</b>: điểm phố x2, chốt bảng cuối ngày!</template>
          <template v-else>Còn {{ daysLeftInWeek }} ngày tới Ngày hội Barista (chốt bảng tuần)</template>
        </div>
        <div class="muted small">Lượng khách theo thứ hạng: <b :class="streetMul >= 1 ? 'up' : 'down'">x{{ streetMul.toFixed(2) }}</b></div>
      </div>
    </div>

    <div v-if="news" class="card news"><PixelIcon name="megaphone" :size="3" /><span>{{ news.text }}</span></div>

    <div class="section-title">Bảng xếp hạng tuần</div>
    <div class="card board">
      <div v-for="(r, i) in street" :key="r.id" class="rw" :class="{ me: r.me }">
        <span class="rk" :style="i < 3 ? { background: MEDAL[i] } : {}">{{ i + 1 }}</span>
        <span class="sw" :style="{ background: r.color }" />
        <div class="grow info">
          <div class="nm">{{ r.name }}<small v-if="r.me"> (bạn)</small></div>
          <div class="muted tiny">{{ r.owner }} · “{{ r.slogan }}”</div>
          <i class="pbar"><b :style="{ width: (r.week / top) * 100 + '%', background: r.me ? '#f2c14e' : r.color }" /></i>
        </div>
        <div class="sc"><b>{{ r.week }}</b><small v-if="r.last">+{{ r.last }}</small></div>
      </div>
    </div>
    <p class="muted note">Điểm phố mỗi ngày = ly bán + ly chuẩn + khách nước ngoài + doanh thu + sao đánh giá. Đối thủ mạnh dần mỗi tuần – đứng top để đông khách hơn.</p>

    <div class="section-title">Thưởng chốt tuần</div>
    <div class="card list">
      <div v-for="(w, i) in WEEK_REWARDS_LIST" :key="i" class="row rew" :class="{ cur: myRank === i }">
        <span class="rk" :style="i < 3 ? { background: MEDAL[i] } : {}">{{ i + 1 }}</span>
        <span class="grow">{{ w.text }}</span>
        <b><PixelIcon name="bean" :size="2" /> {{ w.beans }}</b>
        <b v-if="w.money" class="mn">+{{ moneyShort(w.money) }}</b>
      </div>
    </div>
    <div v-if="last" class="muted note">Tuần trước: hạng #{{ last.rank + 1 }} · +{{ last.beans }} hạt vàng{{ last.money ? ` · +${moneyShort(last.money)}` : '' }}</div>

    <OnlineBoard />
  </div>
</template>

<style scoped>
.head { display: flex; align-items: center; gap: 12px; }
.kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.14em; color: #a9744f; }
.ttl { font-size: 18px; font-weight: 900; }
.small { font-size: 12px; line-height: 1.4; }
.tiny { font-size: 10px; }
.up { color: var(--good); }
.down { color: var(--bad); }
.news { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 13px; font-weight: 700; background: #fff6dc; }
.board { padding: 6px 8px; display: flex; flex-direction: column; }
.rw { display: flex; align-items: center; gap: 8px; padding: 8px 2px; border-bottom: 2px dotted #e6d3b8; }
.rw:last-child { border-bottom: none; }
.rw.me { background: #fff3cf; margin: 0 -8px; padding: 8px 10px; }
.rk { width: 22px; height: 22px; flex: none; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; background: #efe3d5; box-shadow: var(--px-border-2); }
.sw { width: 8px; height: 30px; flex: none; box-shadow: 0 0 0 2px #3b2a20; }
.info { min-width: 0; }
.nm { font-weight: 900; font-size: 14px; }
.nm small { font-weight: 700; color: #a9744f; }
.info .tiny { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.sc { display: flex; flex-direction: column; align-items: flex-end; min-width: 48px; }
.sc b { font-size: 16px; font-variant-numeric: tabular-nums; }
.sc small { font-size: 10px; color: var(--good); font-weight: 800; }
.note { font-size: 12px; margin: 10px 4px; line-height: 1.4; }
.list { padding: 6px 10px; }
.rew { gap: 8px; padding: 6px 0; font-size: 13px; }
.rew b { display: inline-flex; align-items: center; gap: 3px; }
.rew .mn { color: var(--good); margin-left: 6px; }
.rew.cur { font-weight: 900; }
</style>
