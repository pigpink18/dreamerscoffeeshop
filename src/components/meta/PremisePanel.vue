<script setup lang="ts">
import { save } from '../../game/store'
import { moneyShort } from '../../game/data'
import { PREMISES, premiseLocked, rentPremise } from '../../game/meta'
import RoomPreview from './RoomPreview.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { L } from '../../game/i18n'
</script>

<template>
  <div>
    <p class="muted hint">{{ L('Thuê mặt bằng lớn hơn: khách đông hơn, chịu trả giá cao hơn, thêm chỗ chờ – nhưng tiền thuê mỗi ngày cũng cao hơn.', 'Rent a bigger place: more guests, happier to pay more, extra waiting spots – but the daily rent goes up too.') }}</p>
    <div class="list">
      <div v-for="p in PREMISES" :key="p.id" class="card prem" :class="{ cur: save.meta.premise === p.id, past: save.meta.premise > p.id }">
        <RoomPreview :premise="p.id" :corgi="save.meta.premise === p.id" />
        <div class="body">
          <div class="name">{{ p.name }} <span v-if="save.meta.premise === p.id" class="pxtag good">{{ L('ĐANG Ở', 'CURRENT') }}</span></div>
          <div class="muted small">{{ p.desc }}</div>
          <div class="effs">
            <span class="pxtag">{{ L('Khách', 'Guests') }} x{{ p.customerMul }}</span>
            <span class="pxtag" v-if="p.priceMul > 1">{{ L('Giá chấp nhận', 'Price tolerance') }} +{{ Math.round((p.priceMul - 1) * 100) }}%</span>
            <span class="pxtag" v-if="p.slots">+{{ p.slots }} {{ L('chỗ chờ', 'queue spots') }}</span>
            <span class="pxtag warn">{{ L('Thuê', 'Rent') }} {{ moneyShort(p.rent) }}/{{ L('ngày', 'day') }}</span>
          </div>
          <div v-if="save.meta.premise < p.id" class="act">
            <span class="muted small lock" v-if="premiseLocked(p.id)"><PixelIcon name="lock" :size="2" /> {{ premiseLocked(p.id) }}</span>
            <span v-else class="muted small">{{ L('Tiền cọc', 'Deposit') }} {{ moneyShort(p.deposit) }}</span>
            <button class="btn sm accent" :disabled="!!premiseLocked(p.id) || save.money < p.deposit" @click="rentPremise(p.id)">{{ L('THUÊ', 'RENT') }} · {{ moneyShort(p.deposit) }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hint { font-size: 12px; margin: 0 4px 10px; }
.list { display: flex; flex-direction: column; gap: 14px; }
.prem { padding: 8px; }
.prem.cur { background: #fff6dc; }
.prem.past { opacity: 0.6; }
.body { padding: 8px 4px 2px; }
.name { font-weight: 900; display: flex; align-items: center; gap: 6px; }
.small { font-size: 12px; line-height: 1.35; }
.effs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.effs .pxtag { font-size: 10px; }
.act { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
.lock { display: inline-flex; align-items: center; gap: 4px; color: #b3261e; font-weight: 700; }
</style>
