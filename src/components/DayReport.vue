<script setup lang="ts">
// Màn tổng kết cuối ngày kiểu game: chấm sao, số lợi nhuận chạy, sổ thu chi, chỉ số, boss, danh tiếng.
// Toàn bộ icon là pixel art (PixelIcon) — không dùng emoji.
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { ui, save, nextDay, forecast, bossIndex } from '../game/store'
import { money, moneyShort, BOSSES, recipeById } from '../game/data'
import { sfx } from '../game/audio'
import PixelIcon from './ui/PixelIcon.vue'
import PixelNum from './ui/PixelNum.vue'
import BossPortrait from './ui/BossPortrait.vue'

const r = computed(() => ui.report!)
const repDelta = computed(() => r.value.repEnd - r.value.repStart)
const maxAbs = computed(() => Math.max(1, ...save.history.map((h) => Math.abs(h))))

// ---- chấm sao ngày hôm nay ----
const lost = computed(() => r.value.angry + r.value.tooExpensive + r.value.full + r.value.cancelled)
const happyRatio = computed(() => {
  const ok = r.value.served + r.value.delivered
  return ok + lost.value ? ok / (ok + lost.value) : 0
})
const stars = computed(() => {
  if (r.value.bankrupt) return 0
  let s = 0
  if (r.value.profit >= 0) s++
  if (s && happyRatio.value >= 0.6) s++
  if (s === 2 && happyRatio.value >= 0.85 && r.value.profit > 0 && r.value.boss !== 'lose') s++
  return s
})
const verdict = computed(() => (r.value.bankrupt ? 'PHÁ SẢN RỒI…' : ['NGÀY KHÓ KHĂN', 'TẠM ỔN', 'LÀM TỐT LẮM!', 'NGÀY TUYỆT VỜI!'][stars.value]))

// ---- số lợi nhuận chạy từ 0 lên ----
const shown = ref(0)
let raf = 0
const timers: number[] = []
const fmt = (n: number) => (n > 0 ? '+' : n < 0 ? '-' : '') + money(Math.abs(n)).replace(/\s/g, '')
const profitText = computed(() => fmt(shown.value))
onMounted(() => {
  const target = r.value.profit
  const t0 = performance.now(), dur = 900
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    shown.value = p >= 1 ? target : Math.round((target * e) / 1000) * 1000
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  for (let i = 0; i < stars.value; i++) timers.push(window.setTimeout(() => sfx('coin'), 450 + i * 260))
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); timers.forEach(clearTimeout) })

// ---- danh tiếng: thanh 20 ô ----
const SEG = 20
const repSeg = computed(() => Math.round((Math.max(0, Math.min(100, r.value.repEnd)) / 100) * SEG))

const bossList = computed(() => {
  const log = r.value.bossLog?.length ? r.value.bossLog : r.value.boss ? [{ idx: bossIndex(), win: r.value.boss === 'win' }] : []
  return log.map((b) => ({ ...b, ...BOSSES[b.idx] }))
})
const bossWins = computed(() => bossList.value.filter((b) => b.win).length)
const weatherIcon = computed(() => ({ sunny: 'sunny', hot: 'hot', cloudy: 'cloudy', rainy: 'rainy' } as Record<string, string>)[save.forecast] || 'sunny')
</script>

<template>
  <div class="backdrop">
    <div class="sheet">
      <div class="ribbon"><span>KẾT THÚC NGÀY {{ save.day }}</span></div>

      <!-- sao + đánh giá -->
      <div class="stars">
        <div v-for="i in 3" :key="i" class="st" :class="['s' + i, { on: i <= stars }]" :style="{ animationDelay: 0.35 + (i - 1) * 0.26 + 's' }">
          <PixelIcon :name="i <= stars ? 'star' : 'starOff'" :size="i === 2 ? 7 : 5" />
        </div>
      </div>
      <div class="verdict" :class="{ bad: r.bankrupt || stars === 0 }">{{ verdict }}</div>

      <!-- lợi nhuận -->
      <div class="panel hero">
        <div class="cap">LỢI NHUẬN HÔM NAY</div>
        <PixelNum :text="profitText" :size="5" :color="r.profit >= 0 ? '#2f9e6b' : '#d9534f'" :shadow="r.profit >= 0 ? '#1d6b47' : '#8f2a26'" :light="r.profit >= 0 ? '#5fc98c' : '#f07a72'" />
      </div>

      <!-- sổ thu chi -->
      <div class="panel ledger">
        <div class="ttl">SỔ THU CHI</div>
        <div class="row"><PixelIcon name="coin" /><span class="lb">Doanh thu</span><b class="good">+{{ money(r.revenue) }}</b></div>
        <div v-if="r.goodsRev" class="row sub"><PixelIcon name="gift" :size="2" /><span class="lb">gồm bán kèm {{ r.goodsSold }} món bánh / lưu niệm</span><span>{{ money(r.goodsRev) }}</span></div>
        <div v-if="r.tips" class="row sub"><PixelIcon name="heart" :size="2" /><span class="lb">gồm tiền tip</span><span>{{ money(r.tips) }}</span></div>
        <div v-if="r.seated || r.noSeat" class="row sub"><PixelIcon name="crowd" :size="2" /><span class="lb">Khu ngồi: {{ r.seated || 0 }} khách ngồi<template v-if="r.noSeat"> · {{ r.noSeat }} khách hết chỗ</template></span><span>{{ money(r.seatTips || 0) }}</span></div>
        <div class="row"><PixelIcon name="crate" /><span class="lb">Nhập hàng</span><b>{{ r.spent ? "-" + money(r.spent) : money(0) }}</b></div>
        <div class="row"><PixelIcon name="house" /><span class="lb">Mặt bằng</span><b>-{{ money(r.rent) }}</b></div>
        <div v-if="r.wages" class="row"><PixelIcon name="staff" /><span class="lb">Lương pha chế, phục vụ &amp; shipper</span><b>-{{ money(r.wages) }}</b></div>
        <div v-if="r.meta && r.meta.spoiled" class="row sub"><PixelIcon name="cross" :size="2" /><span class="lb">Bánh tồn phải bỏ</span><span>{{ r.meta.spoiled }} cái</span></div>
        <div v-if="r.meltedIce" class="row sub"><PixelIcon name="ice" :size="2" /><span class="lb">Đá bị tan</span><span>{{ r.meltedIce }} phần</span></div>
        <div class="total"><span>CÒN LẠI</span><b :class="r.profit >= 0 ? 'good' : 'bad'">{{ fmt(r.profit) }}</b></div>
      </div>

      <!-- chỉ số khách -->
      <div class="stats">
        <div class="tile good"><i class="ic"><PixelIcon name="cup" /></i><b>{{ r.served }}</b><span>Hài lòng</span></div>
        <div class="tile" :class="{ bad: r.angry }"><i class="ic"><PixelIcon name="clock" /></i><b>{{ r.angry }}</b><span>Chờ lâu bỏ đi</span></div>
        <div class="tile" :class="{ bad: r.tooExpensive }"><i class="ic"><PixelIcon name="tag" /></i><b>{{ r.tooExpensive }}</b><span>Chê đắt</span></div>
        <div class="tile" :class="{ bad: r.full }"><i class="ic"><PixelIcon name="crowd" /></i><b>{{ r.full }}</b><span>Quán đông</span></div>
      </div>
      <div v-if="r.delivered || r.cancelled" class="stats three">
        <div class="tile good"><i class="ic"><PixelIcon name="scooter" /></i><b>{{ r.delivered }}</b><span>Đơn app đã giao</span></div>
        <div class="tile" :class="{ bad: r.cancelled }"><i class="ic"><PixelIcon name="cross" /></i><b>{{ r.cancelled }}</b><span>Đơn bị huỷ</span></div>
        <div class="tile"><i class="ic"><PixelIcon name="star" /></i><b>{{ r.delivered ? (r.starsSum / r.delivered).toFixed(1) : '–' }}</b><span>Sao trung bình</span></div>
      </div>

      <!-- boss -->
      <div v-if="bossList.length > 1" class="boss-sum">BOSS HÔM NAY · thắng <b>{{ bossWins }}/{{ bossList.length }}</b></div>
      <div v-for="(boss, i) in bossList" :key="i" class="panel boss" :class="boss.win ? 'win' : 'lose'">
        <div class="pt"><BossPortrait :idx="boss.idx" :mood="boss.win ? 'grumpy' : 'happy'" :scale="2" /></div>
        <div class="info">
          <div class="bname">BOSS · {{ boss.name }}</div>
          <div class="chip">{{ boss.win ? 'ĐÃ CHINH PHỤC' : 'THẤT BẠI' }}</div>
          <div class="note">{{ boss.win ? 'Nhận 5 sao — dù vẫn mặt nặng mày nhẹ' : 'Bị chấm 1 sao xéo sắc, mất danh tiếng' }}</div>
        </div>
        <PixelIcon v-if="boss.win" class="trophy" name="trophy" :size="4" />
      </div>

      <!-- đua top phố -->
      <div v-if="r.meta" class="panel street" :class="{ contest: r.meta.contest }">
        <div class="tag-ribbon"><PixelIcon name="trophy" :size="2" /> ĐUA TOP PHỐ<span v-if="r.meta.contest" class="x2">NGÀY HỘI X2</span></div>
        <div class="srow">
          <div class="rank" :class="'r' + Math.min(r.meta.rank, 3)">
            <small>HẠNG</small><b>{{ r.meta.rank + 1 }}</b>
          </div>
          <div class="grow">
            <div class="ttl">ĐIỂM PHỐ HÔM NAY</div>
            <PixelNum :text="String(r.meta.dayScore)" :size="4" color="#f2c14e" shadow="#7a4e1f" light="#fff1a8" />
            <div v-if="r.meta.rank < r.meta.prevRank" class="move up"><PixelIcon name="up" :size="2" /> LÊN {{ r.meta.prevRank - r.meta.rank }} HẠNG</div>
            <div v-else-if="r.meta.rank > r.meta.prevRank" class="move down"><PixelIcon name="down" :size="2" /> TỤT {{ r.meta.rank - r.meta.prevRank }} HẠNG</div>
            <div v-else class="move">GIỮ HẠNG</div>
          </div>
        </div>
        <div v-if="r.meta.week" class="week">
          <PixelIcon name="crown" :size="3" />
          <div class="grow"><small>CHỐT BẢNG TUẦN</small><b>Hạng {{ r.meta.week.rank + 1 }} · {{ r.meta.week.title }}</b></div>
          <span class="rw"><PixelIcon name="bean" :size="2" />+{{ r.meta.week.beans }}</span>
          <span v-if="r.meta.week.money" class="rw money">+{{ moneyShort(r.meta.week.money) }}</span>
        </div>
      </div>

      <!-- phần thưởng: nhiệm vụ, thành tựu, hạt vàng -->
      <div v-if="r.meta && (r.meta.quests.length || r.meta.achievements.length || r.meta.beans)" class="panel loot">
        <div class="tag-ribbon gold"><PixelIcon name="gift" :size="2" /> PHẦN THƯỞNG HÔM NAY</div>
        <div v-for="q in r.meta.quests" :key="'q' + q" class="lrow">
          <span class="ic q"><PixelIcon name="check" :size="2" /></span><span class="grow">{{ q }}</span><span class="kind">NHIỆM VỤ</span>
        </div>
        <div v-for="a in r.meta.achievements" :key="'a' + a" class="lrow">
          <span class="ic a"><PixelIcon name="trophy" :size="2" /></span><span class="grow">{{ a }}</span><span class="kind ach">THÀNH TỰU</span>
        </div>
        <div v-if="r.meta.beans" class="beans"><PixelIcon name="bean" :size="3" /><b>+{{ r.meta.beans }}</b><span>HẠT VÀNG</span></div>
      </div>

      <!-- phần thưởng: món mới -->
      <div v-if="r.newRecipe" class="panel new-recipe">
        <b>XONG NGÀY · MỞ KHOÁ MÓN MỚI</b>
        <div>Mở khoá <b>{{ recipeById[r.newRecipe].name }}</b> + tặng nguyên liệu dùng thử. Từ mai khách sẽ gọi món này!</div>
      </div>

      <!-- danh tiếng -->
      <div class="panel rep">
        <div class="rep-top">
          <span class="ttl">DANH TIẾNG</span>
          <span class="val"><b>{{ Math.round(r.repEnd) }}</b>/100</span>
          <span class="delta" :class="repDelta >= 0 ? 'up' : 'down'">{{ repDelta >= 0 ? '▲' : '▼' }} {{ Math.abs(repDelta).toFixed(1) }}</span>
        </div>
        <div class="bar">
          <i v-for="i in SEG" :key="i" :class="{ on: i <= repSeg, hi: i <= repSeg && i > SEG * 0.7 }" :style="{ animationDelay: 0.6 + i * 0.03 + 's' }" />
        </div>
      </div>

      <!-- 7 ngày gần nhất -->
      <div v-if="save.history.length > 1" class="panel chart-wrap">
        <div class="ttl">LỢI NHUẬN 7 NGÀY</div>
        <div class="chart">
          <div v-for="(h, i) in save.history" :key="i" class="col" :class="{ today: i === save.history.length - 1 }">
            <span class="v">{{ moneyShort(h) }}</span>
            <div class="b" :class="h >= 0 ? 'pos' : 'neg'" :style="{ height: Math.max(6, (Math.abs(h) / maxAbs) * 100) + '%' }" />
          </div>
        </div>
      </div>

      <div v-if="r.bankrupt" class="panel warn">Quán đã hết tiền và phá sản. Thử lại với chiến lược khác nhé!</div>

      <button class="go" :class="{ retry: r.bankrupt }" @click="nextDay">
        <template v-if="r.bankrupt">CHƠI LẠI</template>
        <template v-else>
          <span>SANG NGÀY {{ save.day + 1 }}</span>
          <span class="wx"><PixelIcon :name="weatherIcon" :size="3" />{{ forecast.name }}</span>
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute; inset: 0; z-index: 30;
  background: rgba(30, 18, 10, 0.6);
  display: flex; align-items: flex-end;
}
.sheet {
  --ink: #3b2a20; --paper: #fffaf0; --shade: #efdcc2;
  position: relative;
  width: 100%;
  max-height: 94%;
  overflow-y: auto;
  background:
    repeating-linear-gradient(0deg, rgba(122, 78, 51, 0.05) 0 2px, transparent 2px 6px),
    #f4e6d2;
  border-top: 4px solid var(--ink);
  box-shadow: 0 -4px 0 #a9744f inset;
  padding: 0 14px calc(var(--safe-bottom) + 16px);
  animation: up 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
  color: var(--ink);
}
@keyframes up { from { transform: translateY(100%); } }

/* băng rôn tiêu đề bằng gỗ */
.ribbon {
  position: sticky; top: 0; z-index: 2;
  margin: 0 -14px; padding: 10px 0 8px; text-align: center;
  background: #6f4630;
  box-shadow: inset 0 -3px 0 #4a2e1f, inset 0 3px 0 #8a5a3c, 0 3px 0 rgba(59, 42, 32, 0.25);
}
.ribbon span {
  display: inline-block; font-weight: 900; font-size: 15px; letter-spacing: 0.14em; color: #ffe8b8;
  text-shadow: 0 2px 0 #3b2a20;
}

/* khung pixel dùng chung: góc vát bậc thang, viền 3px */
.panel {
  background: var(--paper);
  margin: 11px 3px 0;
  padding: 9px 12px;
  box-shadow:
    -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink),
    inset 0 -4px 0 0 var(--shade), 0 7px 0 0 rgba(59, 42, 32, 0.22);
}
.ttl { font-size: 11px; font-weight: 900; letter-spacing: 0.12em; color: #a9744f; }
.good { color: #2f9e6b; }
.bad { color: #d9534f; }

/* sao */
.stars { display: flex; justify-content: center; align-items: flex-end; gap: 10px; margin-top: 12px; height: 66px; }
.st { opacity: 0; animation: starIn 0.45s cubic-bezier(0.3, 1.8, 0.5, 1) forwards; }
.st.s2 { transform-origin: bottom; margin-bottom: 8px; }
.st:not(.on) { animation-name: starOff; }
@keyframes starIn { 0% { opacity: 0; transform: scale(0.2) rotate(-25deg); } 70% { opacity: 1; transform: scale(1.25); } 100% { opacity: 1; transform: scale(1); } }
@keyframes starOff { to { opacity: 0.85; } }
.verdict {
  text-align: center; font-weight: 900; font-size: 20px; letter-spacing: 0.06em; margin-top: 4px;
  color: #6f4630; text-shadow: 0 2px 0 #fff;
  animation: pop 0.4s 1.1s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.verdict.bad { color: #b3261e; }
@keyframes pop { from { opacity: 0; transform: scale(0.6); } }

/* lợi nhuận */
.hero { text-align: center; padding: 10px 12px 14px; }
.hero .cap { font-size: 10px; font-weight: 900; letter-spacing: 0.16em; color: #a9744f; margin-bottom: 8px; }

/* sổ thu chi */
.ledger .ttl { margin-bottom: 4px; }
.row { display: flex; align-items: center; gap: 10px; padding: 7px 0; font-size: 14px; border-bottom: 2px dotted #e6d3b8; }
.row .lb { flex: 1; font-weight: 700; }
.row b { font-variant-numeric: tabular-nums; font-weight: 900; }
.row.sub { padding: 3px 0 6px 34px; font-size: 12px; color: #8a7566; gap: 6px; }
.row.sub .lb { font-weight: 600; }
.total {
  display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding: 8px 10px;
  background: #f6ead8; font-weight: 900; letter-spacing: 0.06em; font-size: 13px;
  box-shadow: inset 0 0 0 2px #e2cba9;
}
.total b { font-size: 16px; letter-spacing: 0; font-variant-numeric: tabular-nums; }

/* chỉ số */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin: 14px 3px 0; }
.stats.three { grid-template-columns: repeat(3, 1fr); }
.tile {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: var(--paper); padding: 9px 2px 10px; text-align: center;
  box-shadow: -2px 0 0 0 var(--ink), 2px 0 0 0 var(--ink), 0 -2px 0 0 var(--ink), 0 2px 0 0 var(--ink), inset 0 -5px 0 0 #e9dcc8, 0 5px 0 0 rgba(59, 42, 32, 0.2);
}
.tile .ic { height: 27px; display: flex; align-items: center; }
.tile b { font-size: 20px; font-weight: 900; line-height: 1; margin-top: 2px; font-variant-numeric: tabular-nums; }
.tile span { font-size: 10px; font-weight: 700; color: #8a7566; line-height: 1.15; }
.tile.good { box-shadow: -2px 0 0 0 var(--ink), 2px 0 0 0 var(--ink), 0 -2px 0 0 var(--ink), 0 2px 0 0 var(--ink), inset 0 -5px 0 0 #6ad08f, 0 5px 0 0 rgba(59, 42, 32, 0.2); }
.tile.bad { background: #fff1ef; box-shadow: -2px 0 0 0 var(--ink), 2px 0 0 0 var(--ink), 0 -2px 0 0 var(--ink), 0 2px 0 0 var(--ink), inset 0 -5px 0 0 #f08c84, 0 5px 0 0 rgba(59, 42, 32, 0.2); }
.tile.bad b { color: #d9534f; }

/* cà phê treo */
.kind { display: flex; align-items: center; gap: 10px; font-size: 13px; background: #fff7dc; --shade: #f3e2a8; }

/* món mới */
/* ---- đua top phố ---- */
.tag-ribbon { display: inline-flex; align-items: center; gap: 6px; margin: -9px 0 8px -12px; padding: 4px 10px 5px 8px; background: #6f4630; color: #ffe8b8; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; box-shadow: inset 0 -3px 0 #4a2e1f, 3px 3px 0 rgba(59, 42, 32, 0.25); }
.tag-ribbon.gold { background: #d99a2b; color: #3b2a20; box-shadow: inset 0 -3px 0 #a86e14, 3px 3px 0 rgba(59, 42, 32, 0.25); }
.tag-ribbon .x2 { margin-left: 6px; padding: 1px 5px; background: #e0524a; color: #fff; font-size: 9px; letter-spacing: 0.06em; animation: blinkX 0.6s steps(2) infinite; }
@keyframes blinkX { 50% { opacity: 0.55; } }
.street { background: #3b2a20; --shade: #2a1d16; color: #ffe8b8; }
.street.contest { background: #4a2328; --shade: #33171b; }
.street .ttl { color: #e6c79c; margin-bottom: 4px; }
.srow { display: flex; align-items: center; gap: 12px; }
.rank { width: 58px; height: 62px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #efe3d5; color: #3b2a20; box-shadow: 0 0 0 3px #1f140d, inset 0 -5px 0 rgba(0, 0, 0, 0.18), inset 0 3px 0 rgba(255, 255, 255, 0.5); }
.rank small { font-size: 9px; font-weight: 900; letter-spacing: 0.1em; }
.rank b { font-size: 30px; line-height: 1; font-weight: 900; }
.rank.r0 { background: #f2c14e; }
.rank.r1 { background: #d6dde3; }
.rank.r2 { background: #e0975a; }
.move { display: inline-flex; align-items: center; gap: 5px; margin-top: 6px; padding: 2px 7px 3px; font-size: 11px; font-weight: 900; letter-spacing: 0.06em; background: #5a4334; color: #e6c79c; }
.move.up { background: #2f9e6b; color: #fff; }
.move.down { background: #b3261e; color: #fff; }
.week { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 8px 10px; background: #f2c14e; color: #3b2a20; box-shadow: 0 0 0 3px #1f140d, inset 0 -4px 0 #d99a2b; }
.week small { display: block; font-size: 9px; font-weight: 900; letter-spacing: 0.12em; color: #7a4e1f; }
.week b { font-size: 14px; }
.week .rw { display: inline-flex; align-items: center; gap: 3px; font-weight: 900; font-size: 13px; padding: 2px 6px; background: #fffaf0; box-shadow: 0 0 0 2px #3b2a20; }
.week .rw.money { color: #1d6b47; }
/* ---- phần thưởng ---- */
.loot { background: #fff8e6; }
.lrow { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 2px dotted #e6d3b8; font-size: 13px; font-weight: 800; }
.lrow .ic { width: 24px; height: 24px; flex: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #3b2a20; }
.lrow .ic.q { background: #c9f0d8; }
.lrow .ic.a { background: #f2c14e; }
.lrow .kind { font-size: 9px; font-weight: 900; letter-spacing: 0.08em; padding: 2px 5px; background: #2f9e6b; color: #fff; }
.lrow .kind.ach { background: #d99a2b; color: #3b2a20; }
.beans { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 10px; padding: 8px; background: #3b2a20; color: #ffe8b8; box-shadow: inset 0 -4px 0 #1f140d; }
.beans b { font-size: 22px; color: #f2c14e; }
.beans span { font-size: 11px; font-weight: 900; letter-spacing: 0.14em; }
.new-recipe { padding: 10px 12px; background: #fff3dc; font-size: 13px; text-align: center; }
.new-recipe b:first-child { display: block; font-size: 11px; letter-spacing: 0.06em; color: #b7791f; margin-bottom: 2px; }

/* boss */
.boss-sum { font-size: 12px; font-weight: 800; color: #8a5a3c; text-align: center; letter-spacing: 0.04em; }
.boss { display: flex; align-items: center; gap: 12px; padding: 8px 12px; overflow: hidden; }
.boss.win { background: #eefaf2; --shade: #c9ecd6; }
.boss.lose { background: #fff1ef; --shade: #f5d2cd; }
.boss .pt { background: #f3dcc2; box-shadow: 0 0 0 2px var(--ink); flex: none; }
.boss .info { flex: 1; min-width: 0; }
.boss .bname { font-size: 11px; font-weight: 900; letter-spacing: 0.06em; color: #8a5a3c; }
.boss .chip {
  display: inline-block; margin: 4px 0; padding: 2px 8px; font-size: 13px; font-weight: 900; letter-spacing: 0.08em; color: #fff;
  background: #2f9e6b; box-shadow: 0 0 0 2px var(--ink), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
}
.boss.lose .chip { background: #b3261e; }
.boss .note { font-size: 12px; font-weight: 600; color: #6f5a4a; }
.boss .trophy { animation: bob 1.2s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-3px); } }

/* danh tiếng */
.rep-top { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.rep-top .ttl { flex: 1; }
.rep-top .val { font-size: 13px; color: #8a7566; font-weight: 700; }
.rep-top .val b { font-size: 18px; color: var(--ink); }
.delta { font-size: 11px; font-weight: 900; padding: 2px 6px; color: #fff; box-shadow: 0 0 0 2px var(--ink); }
.delta.up { background: #2f9e6b; }
.delta.down { background: #d9534f; }
.bar { display: grid; grid-template-columns: repeat(20, 1fr); gap: 2px; padding: 3px; background: #3b2a20; }
.bar i { height: 12px; background: #5a4334; }
.bar i.on { background: #f2c14e; box-shadow: inset 0 -3px 0 #c98a2b, inset 0 2px 0 #fff1a8; animation: segIn 0.2s both; }
.bar i.hi { background: #6ad08f; box-shadow: inset 0 -3px 0 #2f9e6b, inset 0 2px 0 #c8f5d8; }
@keyframes segIn { from { opacity: 0; transform: scaleY(0.2); } }

/* biểu đồ 7 ngày */
.chart { display: flex; align-items: flex-end; gap: 6px; height: 64px; margin-top: 8px; }
.col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 3px; }
.col .v { font-size: 9px; font-weight: 800; color: #8a7566; }
.col .b { width: 100%; min-height: 4px; box-shadow: 0 0 0 2px var(--ink); }
.col .pos { background: #6ad08f; box-shadow: 0 0 0 2px var(--ink), inset 0 3px 0 #b5efc9; }
.col .neg { background: #f08c84; box-shadow: 0 0 0 2px var(--ink), inset 0 3px 0 #ffc4be; }
.col.today .v { color: var(--ink); }
.col.today .b { animation: grow 0.6s 0.8s cubic-bezier(0.3, 1.4, 0.5, 1) both; transform-origin: bottom; }
@keyframes grow { from { transform: scaleY(0); } }

.warn { background: #fff1ef; color: #b3261e; font-weight: 800; text-align: center; font-size: 14px; --shade: #f5d2cd; }

/* nút kiểu game: khối dày, nhấn lún xuống */
.go {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  width: calc(100% - 6px); margin: 20px 3px 4px; padding: 11px 10px 13px;
  font: inherit; font-weight: 900; font-size: 18px; letter-spacing: 0.1em; color: #3b2a20;
  background: #f2c14e; border: none; cursor: pointer;
  box-shadow: -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink),
    inset 0 -6px 0 0 #d99a2b, inset 0 3px 0 0 #fff1a8, 0 9px 0 0 #6f4630;
  transition: transform 0.06s, box-shadow 0.06s;
}
.go:active { transform: translateY(6px); box-shadow: -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink), inset 0 -3px 0 0 #d99a2b, 0 3px 0 0 #6f4630; }
.go .wx { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 0.04em; font-weight: 800; color: #6f4630; }
.go.retry { background: #ff8a7a; box-shadow: -3px 0 0 0 var(--ink), 3px 0 0 0 var(--ink), 0 -3px 0 0 var(--ink), 0 3px 0 0 var(--ink), inset 0 -6px 0 0 #d9534f, inset 0 3px 0 0 #ffd0c8, 0 9px 0 0 #6f4630; }
</style>
