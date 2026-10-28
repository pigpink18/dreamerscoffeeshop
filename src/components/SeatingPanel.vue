<script setup lang="ts">
// Quản lý khu khách ngồi: mua thêm bàn, nâng loại bàn, thuê nhân viên phục vụ
import { computed } from 'vue'
import {
  save, ui, maxTables, buyTables, upgradeTables, hireWaiter,
  TABLE_COSTS, TABLE_LEVELS, TABLE_LEVEL_COSTS, WAITER_COSTS, WAITER_WAGE, MAX_TABLES, CLEAN_TAPS,
} from '../game/store'
import { moneyShort } from '../game/data'
import { PREMISES } from '../game/metaData'
import PixelIcon from './ui/PixelIcon.vue'

defineProps<{ compact?: boolean }>()

const tableCost = computed(() => (save.seating.tables < maxTables.value ? TABLE_COSTS[save.seating.tables] : undefined))
const nextPremise = computed(() => PREMISES.find((_p, i) => i > save.meta.premise && MAX_TABLES[i] > save.seating.tables))
const levelCost = computed(() => TABLE_LEVEL_COSTS[save.seating.level])
const waiterCost = computed(() => WAITER_COSTS[save.seating.waiter])
</script>

<template>
  <div class="sp" :class="{ compact }">
    <div class="row">
      <span class="ic"><PixelIcon name="house" :size="3" /></span>
      <div class="grow">
        <b v-if="!save.seating.tables">Khu ngồi bỏ hoang</b>
        <b v-else>Bàn ghế {{ save.seating.tables }}/{{ maxTables }}</b>
        <small v-if="!save.seating.tables">Bụi bặm, mạng nhện giăng kín. Dọn dẹp & kê 2 bàn đầu tiên để khách ngồi lại, boa thêm</small>
        <small v-else-if="tableCost">Kê thêm 2 bàn: nhiều khách được ngồi lại, boa thêm</small>
        <small v-else-if="nextPremise">Mặt bằng này tối đa {{ maxTables }} bàn · thuê "{{ nextPremise.name }}" để kê thêm</small>
        <small v-else>Đã kín chỗ</small>
      </div>
      <button v-if="tableCost" class="btn sm accent" :disabled="save.money < tableCost" @click="buyTables">{{ save.seating.tables ? '+2' : 'Dọn dẹp' }} · {{ moneyShort(tableCost) }}</button>
      <span v-else class="pxtag good">TỐI ĐA</span>
    </div>

    <div class="row">
      <span class="ic"><PixelIcon name="star" :size="3" /></span>
      <div class="grow">
        <b>{{ TABLE_LEVELS[save.seating.level].name }}</b>
        <small v-if="levelCost !== undefined">Lên {{ TABLE_LEVELS[save.seating.level + 1].name }}: {{ TABLE_LEVELS[save.seating.level + 1].desc }}</small>
        <small v-else>{{ TABLE_LEVELS[save.seating.level].desc }}</small>
      </div>
      <button v-if="levelCost !== undefined" class="btn sm accent" :disabled="save.money < levelCost" @click="upgradeTables">{{ moneyShort(levelCost) }}</button>
      <span v-else class="pxtag good">TỐI ĐA</span>
    </div>

    <div class="row">
      <span class="ic"><PixelIcon name="staff" :size="3" /></span>
      <div class="grow">
        <b>Phục vụ {{ save.seating.waiter }}/{{ WAITER_COSTS.length }}</b>
        <small>Tự dọn bàn & thu tiền boa · lương {{ moneyShort(WAITER_WAGE) }}/ngày</small>
      </div>
      <button v-if="waiterCost !== undefined" class="btn sm accent" :disabled="save.money < waiterCost" @click="hireWaiter">Thuê · {{ moneyShort(waiterCost) }}</button>
      <span v-else class="pxtag good">TỐI ĐA</span>
    </div>

    <p v-if="!compact || (ui.phase === 'open' && !save.seating.waiter)" class="hint">
      Chạm {{ CLEAN_TAPS }} lần vào bàn bẩn để lau & nhận tiền boa. Bàn bẩn để lâu bị trừ uy tín, khách tới sau không có chỗ ngồi.
    </p>
  </div>
</template>

<style scoped>
.sp { display: flex; flex-direction: column; gap: 8px; margin: 8px 3px 0; }
.row { display: flex; align-items: center; gap: 8px; background: var(--paper, #fffaf0); padding: 6px 8px; box-shadow: var(--px-border-2), inset 0 -3px 0 #ecdcc4; }
.ic { display: flex; width: 30px; justify-content: center; }
.grow { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.grow b { font-size: 13px; }
.grow small { font-size: 11px; color: #8a7566; line-height: 1.25; }
.btn.sm { white-space: nowrap; }
.hint { margin: 2px 2px 0; font-size: 11px; color: #6f4e37; line-height: 1.35; }
.compact { gap: 6px; }
.compact .row { padding: 4px 8px; }
</style>
