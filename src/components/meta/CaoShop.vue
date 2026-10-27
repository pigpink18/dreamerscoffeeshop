<script setup lang="ts">
import { save } from '../../game/store'
import { OUTFITS, DECOR_ITEMS, buyOutfit, buyDecor } from '../../game/meta'
import CorgiPreview from './CorgiPreview.vue'
import PixelIcon from '../ui/PixelIcon.vue'

const SLOT: Record<string, string> = { head: 'Mũ', eyes: 'Kính', neck: 'Cổ', body: 'Áo' }
const owned = (id: string) => save.meta.outfits.includes(id)
const wearing = (id: string) => Object.values(save.meta.wear).includes(id)
</script>

<template>
  <div>
    <div class="card beans">
      <CorgiPreview :scale="6" />
      <div class="grow">
        <div class="kicker">TIỆM CỦA CÁO</div>
        <div class="bn"><PixelIcon name="bean" :size="3" /> {{ save.meta.beans }} hạt vàng</div>
        <div class="muted small">Kiếm hạt vàng từ nhiệm vụ ngày, thành tựu, khách hiếm và giải đua top phố. Hạt vàng không mua bằng tiền được!</div>
      </div>
    </div>

    <div class="section-title">Trang phục cho Cáo</div>
    <div class="grid">
      <button v-for="o in OUTFITS" :key="o.id" class="card it" :class="{ on: wearing(o.id), own: owned(o.id) }" @click="buyOutfit(o.id)">
        <CorgiPreview :scale="3" still :wear="{ [o.slot]: o.id }" />
        <b>{{ o.name }}</b>
        <small class="muted">{{ SLOT[o.slot] }}</small>
        <span class="pxtag" :class="wearing(o.id) ? 'good' : owned(o.id) ? '' : save.meta.beans >= o.cost ? 'warn' : ''">
          {{ wearing(o.id) ? 'ĐANG MẶC' : owned(o.id) ? 'MẶC' : `${o.cost} hạt` }}
        </span>
      </button>
    </div>

    <div class="section-title">Trang trí quán</div>
    <div class="list">
      <div v-for="d in DECOR_ITEMS" :key="d.id" class="card row deco">
        <div class="grow">
          <b>{{ d.name }}</b>
          <div class="muted small">+{{ Math.round(d.buff * 100) }}% khách · thấy ngay trong quán</div>
        </div>
        <span v-if="save.meta.decor.includes(d.id)" class="pxtag good">ĐÃ CÓ</span>
        <button v-else class="btn sm accent" :disabled="save.meta.beans < d.cost" @click="buyDecor(d.id)"><PixelIcon name="bean" :size="2" /> {{ d.cost }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.beans { display: flex; align-items: center; gap: 12px; }
.kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.14em; color: #a9744f; }
.bn { font-size: 20px; font-weight: 900; display: flex; align-items: center; gap: 6px; margin: 2px 0; }
.small { font-size: 12px; line-height: 1.35; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.it { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 4px 10px; text-align: center; }
.it b { font-size: 12px; line-height: 1.2; }
.it small { font-size: 10px; }
.it .pxtag { font-size: 9px; margin-top: 2px; }
.it.own { background: #fffaf0; }
.it.on { background: #e1f3ea; }
.list { display: flex; flex-direction: column; gap: 10px; }
.deco { display: flex; align-items: center; gap: 10px; }
</style>
