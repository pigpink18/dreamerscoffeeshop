<script setup lang="ts">
import { computed } from 'vue'
import {
  save, ui, weather, forecast, wages, expectedCustomers, expectedOrders, portionsLeft, canMake,
  openShop, togglePause, cycleSpeed, todayBoss, DAY_LENGTH, clock,
} from '../game/store'
import { recipeById, money, moneyShort } from '../game/data'
import { rentToday, premise } from '../game/store'
import { myRank, isContestDay } from '../game/meta'
import { GOODS, goodUnlocked } from '../game/metaData'
import { iconUrl } from '../game/pixel'
const shelf = computed(() => GOODS.filter((g) => goodUnlocked(g, save.meta.premise)))
import InstallHint from './InstallHint.vue'
import CounterScene from './CounterScene.vue'
import WorkPanel from './WorkPanel.vue'
import PixelIcon from './ui/PixelIcon.vue'
import DrinkIcon from './ui/DrinkIcon.vue'
import BossPortrait from './ui/BossPortrait.vue'
import { todayBosses } from '../game/store'
import { BOSSES } from '../game/data'

const bossNames = computed(() => todayBosses.value.map((i) => BOSSES[i].name).join(' · '))
const WX: Record<string, string> = { sunny: 'sunny', hot: 'hot', cloudy: 'cloudy', rainy: 'rainy' }

const expected = computed(() => Math.round(expectedCustomers()))
const expectedApp = computed(() => Math.round(expectedOrders()))
const dayPct = computed(() => Math.min(100, (ui.time / DAY_LENGTH) * 100))
const lost = computed(() => ui.stats.angry + ui.stats.full + ui.stats.tooExpensive + ui.stats.cancelled)
</script>

<template>
  <!-- ====== CHUẨN BỊ ====== -->
  <div v-if="ui.phase !== 'open'" class="prep">
    <InstallHint />

    <div class="card hero">
      <div class="hero-weather"><PixelIcon :name="WX[save.weather] || 'sunny'" :size="6" /></div>
      <div class="grow">
        <div class="kicker">NGÀY {{ save.day }} · HÔM NAY</div>
        <div class="hero-title">{{ weather.name }}</div>
        <div class="muted small">
          Dự kiến ~<b>{{ expected }}</b> khách
          <template v-if="save.upgrades.shipper"> · ~<b>{{ expectedApp }}</b> đơn app</template>
        </div>
      </div>
      <div class="tomorrow">
        <div class="tiny">NGÀY MAI</div>
        <PixelIcon :name="WX[save.forecast] || 'sunny'" :size="3" />
        <div class="tiny fn">{{ forecast.name }}</div>
      </div>
    </div>

    <div class="card boss-card">
      <div class="boss-pts">
        <div v-for="(bi, n) in todayBosses" :key="n" class="boss-pt" :style="{ marginLeft: n ? '-22px' : '0', zIndex: 9 - n }"><BossPortrait :idx="bi" mood="grumpy" :scale="2" /></div>
      </div>
      <div class="grow">
        <div class="tiny bk"><PixelIcon name="crown" :size="2" /> HÔM NAY: {{ todayBosses.length }} BOSS</div>
        <b>{{ bossNames }}</b>
        <div class="small bt">{{ todayBosses.length > 1 ? 'Ghé rải rác trong ngày' : todayBoss.title + ' · sẽ ghé vào giữa ngày' }}, thời gian phục vụ rất ngắn! <span class="muted">Quán từ 4.5 sao (từ ngày 10) sẽ có thêm boss thứ 2.</span></div>
      </div>
    </div>

    <div v-if="isContestDay" class="card contest"><PixelIcon name="trophy" :size="4" /><div class="grow"><b>NGÀY HỘI BARISTA PHỐ NÚI</b><div class="small">Điểm phố hôm nay x2 · cuối ngày chốt bảng xếp hạng tuần và trao thưởng!</div></div></div>
    <div v-if="save.meta.news && save.meta.news.day === save.day" class="card news"><PixelIcon name="megaphone" :size="3" /><span class="small">{{ save.meta.news.text }}</span></div>

    <div class="duo">
      <button class="card mini" @click="ui.tab = 'compete'">
        <div class="tiny">ĐUA TOP PHỐ</div>
        <b>Hạng #{{ myRank + 1 }}</b>
        <small class="muted">Điểm tuần {{ save.meta.week.my }}</small>
      </button>
      <button class="card mini" @click="ui.tab = 'app'">
        <div class="tiny">NHIỆM VỤ HÔM NAY</div>
        <b>{{ save.meta.quests.list.filter((q) => q.done).length }}/3 xong</b>
        <small class="muted"><PixelIcon name="bean" :size="2" /> {{ save.meta.beans }} hạt vàng</small>
      </button>
    </div>

    <div class="section-title">Món sẵn sàng bán</div>
    <div class="card list">
      <div v-for="id in save.unlocked" :key="id" class="row item">
        <DrinkIcon :id="id" :scale="2" />
        <div class="grow">
          <div class="name">{{ recipeById[id].name }}</div>
          <div class="muted small">{{ moneyShort(save.prices[id]) }} / ly</div>
        </div>
        <span class="pxtag" :class="portionsLeft(id) === 0 ? 'bad' : portionsLeft(id) < 8 ? 'warn' : 'good'">
          {{ portionsLeft(id) === 0 ? 'HẾT' : `còn ${portionsLeft(id)} ly` }}
        </span>
      </div>
    </div>

    <template v-if="shelf.length">
      <div class="section-title">Kệ hàng bán kèm</div>
      <div class="card list">
        <div v-for="g in shelf" :key="g.id" class="row item">
          <img :src="iconUrl(g.id)" class="gimg" alt="" />
          <div class="grow">
            <div class="name">{{ g.name }}</div>
            <div class="muted small">{{ moneyShort(g.price) }} / món · {{ g.kind === 'bakery' ? 'bánh tươi, chỉ bán trong ngày' : 'không hư' }}</div>
          </div>
          <span class="pxtag" :class="(save.meta.goods[g.id] ?? 0) === 0 ? 'bad' : (save.meta.goods[g.id] ?? 0) < 5 ? 'warn' : 'good'">
            {{ (save.meta.goods[g.id] ?? 0) === 0 ? 'HẾT' : `còn ${save.meta.goods[g.id]}` }}
          </span>
        </div>
        <div class="muted small hintg">Khách gọi kèm món nào sẽ hiện trong khung thoại – bấm món đó ở <b>kệ hàng</b> dưới khay để trao. Nhập hàng ở tab Kho.</div>
      </div>
    </template>

    <div class="section-title">Cuối ngày</div>
    <div class="card list small-list">
      <div class="row"><PixelIcon name="house" /><span class="grow">Tiền thuê {{ premise.name }}</span><b>{{ money(rentToday) }}</b></div>
      <div class="row" v-if="wages"><PixelIcon name="staff" /><span class="grow">Lương nhân viên & shipper</span><b>{{ money(wages) }}</b></div>
      <div class="row" v-if="!save.upgrades.freezer"><PixelIcon name="ice" /><span class="grow muted">Đá còn dư sẽ tan hết</span></div>
    </div>

    <div class="cta">
      <button class="btn big accent" @click="openShop"><PixelIcon name="shop" :size="3" /> MỞ CỬA BÁN HÀNG</button>
      <div v-if="!save.unlocked.some(canMake)" class="muted small center">Kho trống — vào tab <b>Kho</b> để nhập hàng</div>
    </div>
  </div>

  <!-- ====== ĐANG BÁN: đứng quầy ====== -->
  <div v-else class="open">
    <div class="controls">
      <div class="progress pxbar"><i class="bar" :style="{ width: dayPct + '%' }" /></div>
      <span class="mini-stat"><PixelIcon name="coin" :size="2" /> {{ moneyShort(ui.stats.revenue) }}</span>
      <span class="mini-stat" :class="{ bad: lost }"><PixelIcon name="cross" :size="2" /> {{ lost }}</span>
      <button class="btn sm ghost ctrl" @click="togglePause"><PixelIcon :name="ui.paused ? 'play' : 'pause'" :size="3" /></button>
      <button class="btn sm ghost ctrl" @click="cycleSpeed">x{{ ui.speed }}</button>
    </div>

    <div class="scene-box"><CounterScene /></div>

    <WorkPanel />

    <Transition name="fade">
      <div v-if="ui.paused" class="pause" @click="togglePause">
        <div class="card pause-card">
          <template v-if="ui.resumed">
            <PixelIcon name="play" :size="6" />
            <b>CHƠI TIẾP CA BÁN</b>
            <div class="muted small">Ngày {{ save.day }} · {{ clock }} · đã lưu đúng chỗ bạn rời đi</div>
            <span class="btn accent sm resume-btn">CHẠM ĐỂ CHƠI TIẾP</span>
          </template>
          <template v-else>
            <PixelIcon name="pause" :size="6" />
            <b>TẠM DỪNG</b>
            <div class="muted small">Chạm để tiếp tục</div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gimg { width: 32px; height: 32px; image-rendering: pixelated; }
.hintg { padding-top: 8px; line-height: 1.4; }
.contest { display: flex; align-items: center; gap: 10px; margin-top: 12px; background: #fff3cf; }
.contest b { font-size: 13px; letter-spacing: 0.04em; }
.news { display: flex; align-items: center; gap: 10px; margin-top: 12px; background: #fff6dc; font-weight: 700; }
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.mini { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 10px 12px 12px; }
.mini .tiny { font-size: 9px; font-weight: 900; letter-spacing: 0.12em; color: #a9744f; }
.mini b { font-size: 16px; }
.mini small { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; }

.small { font-size: 13px; }
.tiny { font-size: 11px; }
.center { text-align: center; margin-top: 8px; }

/* Chuẩn bị */
.hero { display: flex; align-items: center; gap: 12px; }
.hero-weather { width: 60px; display: flex; justify-content: center; animation: sunbob 2.4s ease-in-out infinite; }
@keyframes sunbob { 50% { transform: translateY(-3px); } }
.kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.14em; color: #a9744f; }
.hero-title { font-size: 21px; font-weight: 900; }
.tomorrow { display: flex; flex-direction: column; align-items: center; gap: 3px; background: #f1e2cf; padding: 6px 8px; box-shadow: var(--px-border-2); }
.tomorrow .tiny { font-weight: 900; letter-spacing: 0.08em; color: #8a5a3c; font-size: 9px; }
.tomorrow .fn { letter-spacing: 0; font-size: 10px; }
.boss-card { display: flex; align-items: center; gap: 12px; margin-top: 14px; background: #3a1a16; color: #fff; --paper-shade: #2a110e; }
.boss-pts { display: flex; flex: none; }
.boss-pt { position: relative; background: #f3dcc2; box-shadow: 0 0 0 2px #f2c14e, 0 0 0 4px #3b2a20; flex: none; animation: bossGlow 1.6s ease-in-out infinite; }
@keyframes bossGlow { 50% { box-shadow: 0 0 0 2px #ff6b5a, 0 0 0 4px #3b2a20, 0 0 12px 2px rgba(255, 90, 70, 0.5); } }
.boss-card .bk { display: flex; align-items: center; gap: 5px; color: #ffcf4d; font-weight: 900; letter-spacing: 0.12em; margin-bottom: 2px; }
.boss-card .bt { opacity: 0.8; }
.treo { display: flex; align-items: center; gap: 12px; margin-top: 14px; background: #fff6d9; --paper-shade: #f3e2a8; font-size: 14px; }
.list { padding: 4px 14px; }
.item { padding: 8px 0; border-bottom: 2px dotted #e6d3b8; }
.item:last-child { border-bottom: none; }
.ic { font-size: 28px; width: 36px; text-align: center; }
.name { font-weight: 700; }
.pill { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.p-ok { background: #e1f3ea; color: var(--good); }
.p-warn { background: #fdf0d9; color: #b7791f; }
.p-bad { background: #fbe3e2; color: var(--bad); }
.small-list .row { padding: 8px 0; font-size: 14px; border-bottom: 2px dotted #e6d3b8; }
.small-list .row:last-child { border-bottom: none; }
.cta { margin-top: 24px; }

/* Đang bán */
.open { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; }
.open > * { flex: none; }
.open > .scene-box { flex: 1 1 0; min-height: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; padding: 2px 0 8px; }
.open > .panel { flex: none; }
.controls { display: flex; align-items: center; gap: 8px; }
.progress { flex: 1; margin: 0 3px; }
.progress .bar { background: #f2c14e; box-shadow: inset 0 -3px 0 #d99a2b, inset 0 2px 0 #fff1a8; }
.ctrl { min-width: 40px; min-height: 34px; padding: 0 8px; font-variant-numeric: tabular-nums; }
.mini-stat { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 900; white-space: nowrap; }
.mini-stat.bad { color: var(--bad); }

.scene-box { margin: 8px 3px 0; }
.crew { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.crew .chip { font-size: 11px; font-weight: 700; background: var(--card); border-radius: 99px; padding: 4px 9px; box-shadow: var(--shadow); }
.scene {
  position: relative;
  margin-top: 12px;
  border-radius: var(--radius);
  background: linear-gradient(#fdf6ec, #f0dfcb);
  overflow: hidden;
  box-shadow: var(--shadow);
  height: 104px;
}
.awning {
  height: 22px;
  background: repeating-linear-gradient(90deg, #c0392b 0 24px, #fff6ea 24px 48px);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.06);
}
.counter {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 56px;
  background: linear-gradient(#a9744f, #6f4e37);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}
.barista { position: relative; font-size: 30px; margin-top: -36px; display: flex; flex-direction: column; align-items: center; }
.barista small { font-size: 10px; color: #fff; font-weight: 700; margin-top: 2px; }
.staff { animation: bob 1.2s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(-3px); } }
.ring {
  width: 30px; height: 6px; border-radius: 9px; margin-top: 4px;
  background: linear-gradient(90deg, #ffd56b calc(var(--p) * 1%), rgba(255, 255, 255, 0.3) 0);
}
.cap { color: #fff; font-size: 12px; font-weight: 700; background: rgba(0, 0, 0, 0.2); padding: 4px 10px; border-radius: 99px; }
.floats { position: absolute; inset: 0; pointer-events: none; }
.float {
  position: absolute;
  transform: translateX(-50%);
  font-weight: 800;
  font-size: 13px;
  background: #fff;
  padding: 3px 10px;
  border-radius: 99px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  animation: rise 1.3s ease-out forwards;
}
.float.good { color: var(--good); }
.float.bad { color: var(--bad); font-size: 12px; }
@keyframes rise {
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -26px) scale(1); }
}

.shippers { display: flex; gap: 8px; margin-top: 10px; }
.shipper { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--card); border-radius: 14px; padding: 8px 10px; box-shadow: var(--shadow); font-size: 13px; min-width: 0; }
.shipper .emoji { font-size: 24px; }
.shipper.busy { background: #fff3dc; }
.road { position: relative; height: 16px; margin-top: 2px; border-bottom: 2px dashed #d6c2ad; }
.bike { position: absolute; bottom: -4px; transform: translateX(-50%) scaleX(-1); font-size: 16px; transition: left 0.2s linear; }

.seg { display: flex; background: #eadccd; border-radius: 14px; padding: 4px; margin-top: 12px; }
.seg button { flex: 1; padding: 9px 0; border-radius: 11px; font-weight: 700; font-size: 14px; color: var(--muted); }
.seg button.on { background: var(--card); color: var(--ink); box-shadow: var(--shadow); }
.badge { display: inline-block; min-width: 20px; padding: 0 6px; border-radius: 99px; background: #d6c2ad; color: #fff; font-size: 11px; line-height: 18px; }
.badge.hot { background: var(--bad); }

.queue { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; min-height: 120px; position: relative; }
.cust {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: var(--card);
  border-radius: 16px;
  padding: 10px 12px;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  transition: transform 0.08s, border-color 0.2s;
  cursor: pointer;
}
.cust:active { transform: scale(0.98); }
.cust.urgent { border-color: #f3b5b3; }
.cust.cant { opacity: 0.75; }
.cust.regular { background: #fffaf0; }
.cust.needy { background: #fff6d9; border-color: #f6d77b; }
.face { font-size: 32px; }
.info { min-width: 0; }
.who { font-size: 12px; font-weight: 800; color: var(--brand); }
.tag { font-size: 10px; font-weight: 700; background: #f1e4d4; padding: 1px 6px; border-radius: 99px; margin-left: 4px; }
.tag.gold { background: #fde7a6; }
.order { font-weight: 700; font-size: 15px; }
.say { font-size: 12px; color: var(--bad); font-style: italic; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.patience { height: 6px; background: #f0e4d6; border-radius: 9px; margin-top: 6px; overflow: hidden; }
.patience div { height: 100%; background: var(--good); border-radius: 9px; transition: width 0.15s linear; }
.urgent .patience div { background: var(--bad); }
.serve {
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  flex-shrink: 0;
}
.serve:active { transform: scale(0.94); }
.cant .serve { background: #c9b6a6; }
.state { font-size: 12px; font-weight: 800; color: #b7791f; background: #fdf0d9; padding: 6px 10px; border-radius: 10px; white-space: nowrap; }
.state.go { color: var(--good); background: #e1f3ea; }
.empty { text-align: center; padding: 30px 0; font-size: 14px; }

.cust-enter-active { transition: all 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3); }
.cust-leave-active { transition: all 0.25s ease-in; position: absolute; width: 100%; }
.cust-enter-from { opacity: 0; transform: translateX(40px); }
.cust-leave-to { opacity: 0; transform: translateX(-40px) scale(0.9); }
.cust-move { transition: transform 0.3s; }

.stockstrip { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.stockstrip .chip {
  display: flex; align-items: center; gap: 4px;
  background: var(--card); border-radius: 99px; padding: 5px 10px;
  font-size: 13px; font-weight: 700; box-shadow: var(--shadow);
}
.stockstrip .chip.low { background: #fbe3e2; color: var(--bad); }
.stockstrip .more { color: var(--brand); }

.today { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.today div { background: var(--card); border-radius: 14px; padding: 10px; text-align: center; box-shadow: var(--shadow); }
.today b { display: block; font-size: 18px; }
.today span { font-size: 11px; color: var(--muted); }

.pause {
  position: fixed; inset: 0; background: rgba(59, 42, 32, 0.35);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.resume-btn { margin-top: 6px; letter-spacing: 0.08em; }
.pause-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 26px; width: min(320px, 86%); }
.pause-card b { letter-spacing: 0.1em; font-size: 17px; }
.big-ic { font-size: 36px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
