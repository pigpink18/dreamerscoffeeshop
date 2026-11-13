<script setup lang="ts">
import { ref } from 'vue'
import { save, ui, buyUpgrade, resetGame, UPGRADES } from '../game/store'
import { moneyShort } from '../game/data'
import PixelIcon from './ui/PixelIcon.vue'
import PremisePanel from './meta/PremisePanel.vue'
import CaoShop from './meta/CaoShop.vue'
import SeatingPanel from './SeatingPanel.vue'
import { L } from '../game/i18n'

const seg = ref<'up' | 'seat' | 'prem' | 'cao'>('up')

const confirmReset = ref(false)
let resetTimer = 0
function onReset() {
  if (!confirmReset.value) { confirmReset.value = true; clearTimeout(resetTimer); resetTimer = window.setTimeout(() => (confirmReset.value = false), 3000); return }
  confirmReset.value = false
  resetGame()
}

const UICON: Record<string, string> = { staff: 'staff', machine: 'gear', shipper: 'scooter', decor: 'plant', sign: 'megaphone', freezer: 'snow', green: 'plant', farmer: 'bean' }

</script>

<template>
  <div>
    <div class="segs">
      <button :class="{ on: seg === 'up' }" @click="seg = 'up'">{{ L('Nâng cấp', 'Upgrades') }}</button>
      <button :class="{ on: seg === 'seat' }" @click="seg = 'seat'">{{ L('Khu ngồi', 'Seating') }}</button>
      <button :class="{ on: seg === 'prem' }" @click="seg = 'prem'">{{ L('Mặt bằng', 'Premises') }}</button>
      <button :class="{ on: seg === 'cao' }" @click="seg = 'cao'">{{ L('Tiệm của Cáo', "Cáo's Shop") }}</button>
    </div>
    <template v-if="seg === 'seat'">
      <div class="section-title" style="margin-top: 4px">{{ L('Khu khách ngồi', 'Seating area') }}</div>
      <p class="muted hint">{{ L('Khi đang bán, vuốt sang trái ở màn quầy để tới khu khách ngồi. Khách ngồi lại uống xong sẽ để lại ly bẩn và tiền boa trên bàn.', 'While open, swipe left from the counter to reach the seating area. Guests who stay leave dirty cups and tips on the table when they finish.') }}</p>
      <SeatingPanel />
    </template>
    <PremisePanel v-else-if="seg === 'prem'" />
    <CaoShop v-else-if="seg === 'cao'" />
    <template v-else>
    <div class="section-title" style="margin-top: 4px">{{ L('Nâng cấp quán', 'Shop upgrades') }}</div>
    <p class="muted hint">{{ L('Mua xong sẽ thấy ngay trong cảnh quán: nhân viên đứng quầy, máy espresso mới, cây xanh, dây đèn, biển neon, mèo nằm quầy…', 'Everything you buy shows up in the shop right away: staff at the counter, a new espresso machine, plants, string lights, a neon sign, a cat napping on the counter…') }}</p>
    <div class="list">
      <div v-for="u in UPGRADES" :key="u.id" class="card up">
        <span class="slot"><PixelIcon :name="UICON[u.id] || 'up'" :size="3" /></span>
        <div class="grow">
          <div class="name">{{ u.name }}<span v-if="u.social" class="pxtag good soc">{{ L('XÃ HỘI', 'SOCIAL') }}</span></div>
          <div class="muted small">{{ u.desc }}</div>
          <div class="pips">
            <span v-for="n in u.costs.length" :key="n" class="pip" :class="{ on: n <= save.upgrades[u.id] }" />
          </div>
          <div class="eff now"><PixelIcon name="check" :size="2" /> {{ L('Hiện tại', 'Now') }}: {{ u.effect(save.upgrades[u.id]) }}</div>
          <div v-if="save.upgrades[u.id] < u.costs.length" class="eff next"><PixelIcon name="up" :size="2" /> {{ L('Cấp', 'Lv') }} {{ save.upgrades[u.id] + 1 }}: {{ u.effect(save.upgrades[u.id] + 1) }}</div>
        </div>
        <button
          v-if="save.upgrades[u.id] < u.costs.length"
          class="btn sm accent"
          :disabled="save.money < u.costs[save.upgrades[u.id]]"
          @click="buyUpgrade(u.id)"
        >{{ moneyShort(u.costs[save.upgrades[u.id]]) }}</button>
        <span v-else class="pxtag good max">{{ L('TỐI ĐA', 'MAX') }}</span>
      </div>
    </div>

    <div class="section-title">{{ L('Thành tích', 'Records') }}</div>
    <div class="stats">
      <div class="tile"><PixelIcon name="sunny" /><b>{{ save.day }}</b><span>{{ L('Ngày', 'Days') }}</span></div>
      <div class="tile"><PixelIcon name="cup" /><b>{{ save.totals.served }}</b><span>{{ L('Ly đã bán', 'Cups sold') }}</span></div>
      <div class="tile"><PixelIcon name="coin" /><b>{{ moneyShort(save.totals.revenue) }}</b><span>{{ L('Tổng doanh thu', 'Total revenue') }}</span></div>
      <div class="tile"><PixelIcon name="trophy" /><b>{{ moneyShort(save.totals.bestProfit) }}</b><span>{{ L('Lời cao nhất/ngày', 'Best day profit') }}</span></div>
    </div>

    <div class="reset">
      <button class="btn sm ghost wide" :class="{ danger: confirmReset }" :disabled="ui.phase === 'open'" @click="onReset">
        {{ confirmReset ? L('CHẠM LẦN NỮA ĐỂ XOÁ DỮ LIỆU', 'TAP AGAIN TO ERASE ALL DATA') : L('CHƠI LẠI TỪ ĐẦU', 'START OVER') }}
      </button>
      <p class="muted tiny center">{{ confirmReset ? L('Toàn bộ tiền, món, nâng cấp sẽ mất và bắt đầu lại từ ngày 1', 'All money, recipes and upgrades will be lost – back to day 1') : L('Cũng có trong Cài đặt (nút bánh răng)', 'Also in Settings (gear button)') }}</p>
    </div>
    </template>
  </div>
</template>

<style scoped>
.hint { font-size: 12px; margin: 0 4px 10px; }
.list { display: flex; flex-direction: column; gap: 14px; }
.up { display: flex; align-items: center; gap: 12px; }
.slot { width: 46px; height: 46px; flex: none; display: flex; align-items: center; justify-content: center; background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -3px 0 #e0c8a8; }
.soc { margin-left: 6px; font-size: 9px; padding: 1px 5px; vertical-align: 2px; }
.name { font-weight: 900; }
.small { font-size: 12px; line-height: 1.35; }
.pips { display: flex; gap: 6px; margin: 8px 2px 2px; }
.pip { width: 16px; height: 8px; background: #5a4334; box-shadow: 0 0 0 2px #3b2a20; }
.eff { font-size: 11px; font-weight: 700; margin-top: 4px; }
.eff.now { color: var(--good); }
.eff.next { color: #b7791f; }
.pip.on { background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20, inset 0 -2px 0 #d99a2b; }
.max { font-size: 10px; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 3px; }
.tile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; background: var(--paper); padding: 10px 12px 12px; box-shadow: var(--px-border-2), inset 0 -5px 0 #e9dcc8, 0 5px 0 rgba(59, 42, 32, 0.2); }
.stats b { font-size: 20px; font-weight: 900; margin-top: 2px; }
.stats span { font-size: 12px; color: var(--muted); }
.center { text-align: center; margin-top: 18px; }
.reset { text-align: center; margin-top: 24px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.reset { margin: 18px 0 8px; display: flex; flex-direction: column; gap: 6px; }
.danger { background: var(--bad) !important; color: #fff !important; }
.tiny { font-size: 11px; }
</style>
