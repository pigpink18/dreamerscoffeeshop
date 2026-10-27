<script setup lang="ts">
import { computed } from 'vue'
import { save, buyPack, INGREDIENTS } from '../game/store'
import { recipeById, recipeNeeds, moneyShort, type IngredientId } from '../game/data'
import { iconUrl } from '../game/pixel'
import { knownIngredients, GOODS, goodUnlocked, goodsStock, buyGoods } from '../game/meta'
import PixelIcon from './ui/PixelIcon.vue'

const groups = computed(() => [
  { kind: 'souvenir', title: 'Đồ gốm & lưu niệm', lock: 'Thuê Quán gác gỗ đồi thông (Nâng cấp › Mặt bằng) để mở kệ lưu niệm', note: 'Khách mua kèm khi gọi nước. Không hư, để lâu được.' },
  { kind: 'bakery', title: 'Tủ bánh', lock: 'Thuê Dreamers Flagship để mở tủ bánh', note: 'Bánh tươi chỉ bán trong ngày – cuối ngày còn dư sẽ phải bỏ.' },
].map((g) => ({ ...g, open: GOODS.some((x) => x.kind === g.kind && goodUnlocked(x, save.meta.premise)), items: GOODS.filter((x) => x.kind === g.kind) })))

const SECRET_ING = new Set<IngredientId>(['dua', 'trung', 'cacao'])

const used = computed(() => {
  const set = new Set<IngredientId>()
  for (const id of save.unlocked) for (const k of Object.keys(recipeNeeds(recipeById[id]))) set.add(k as IngredientId)
  return set
})
const sorted = computed(() => INGREDIENTS.filter((i) => !SECRET_ING.has(i.id) || knownIngredients.value.has(i.id) || save.stock[i.id] > 0).sort((a, b) => Number(used.value.has(b.id)) - Number(used.value.has(a.id))))
</script>

<template>
  <div>
    <div class="section-title" style="margin-top: 4px">Nhập nguyên liệu</div>
    <div class="list">
      <div v-for="i in sorted" :key="i.id" class="card ing" :class="{ unused: !used.has(i.id) }">
        <span class="slot"><img :src="iconUrl(i.id)" class="pix ic" alt="" /></span>
        <div class="grow">
          <div class="name">{{ i.name }}</div>
          <div class="muted small">
            Gói {{ i.packSize }} phần · {{ moneyShort(i.packPrice) }}
            <span v-if="!used.has(i.id)" class="pxtag nouse">CHƯA DÙNG</span>
          </div>
        </div>
        <div class="qty" :class="{ low: used.has(i.id) && save.stock[i.id] < 5 }"><small>KHO</small>{{ save.stock[i.id] }}</div>
        <div class="btns">
          <button class="btn sm accent" :disabled="save.money < i.packPrice" @click="buyPack(i.id)">+1</button>
          <button class="btn sm ghost" :disabled="save.money < i.packPrice * 3" @click="buyPack(i.id, 3)">+3</button>
        </div>
      </div>
    </div>
    <p class="muted note">Mẹo: đá tan hết vào cuối ngày nếu chưa có tủ đông, nên chỉ nhập vừa đủ.</p>

    <template v-for="g in groups" :key="g.kind">
      <div class="section-title">{{ g.title }}</div>
      <div v-if="!g.open" class="card locked"><PixelIcon name="lock" :size="3" /><span class="muted small">{{ g.lock }}</span></div>
      <template v-else>
        <div class="list">
          <div v-for="i in g.items" :key="i.id" class="card ing">
            <span class="slot"><img :src="iconUrl(i.id)" class="pix ic" alt="" /></span>
            <div class="grow">
              <div class="name">{{ i.name }}</div>
              <div class="muted small">Gói {{ i.pack }} · {{ moneyShort(i.cost * i.pack) }} · bán <b class="sell">{{ moneyShort(i.price) }}</b>/món</div>
            </div>
            <div class="qty"><small>KỆ</small>{{ goodsStock(i.id) }}</div>
            <div class="btns">
              <button class="btn sm accent" :disabled="save.money < i.cost * i.pack" @click="buyGoods(i.id)">+1</button>
            </div>
          </div>
        </div>
        <p class="muted note">{{ g.note }}</p>
      </template>
    </template>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 13px; }
.ing { display: flex; align-items: center; gap: 10px; padding: 9px 10px 11px; }
.ing.unused { background: #f4ebe0; }
.ing.unused .slot, .ing.unused .name { opacity: 0.55; }
.slot { width: 44px; height: 44px; flex: none; display: flex; align-items: center; justify-content: center; background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -3px 0 #e0c8a8; }
.nouse { margin-left: 4px; font-size: 9px; padding: 1px 5px; }
.ic { width: 32px; height: 32px; }
.name { font-weight: 900; }
.small { font-size: 12px; }
.qty { display: flex; flex-direction: column; align-items: center; font-size: 18px; font-weight: 900; min-width: 40px; font-variant-numeric: tabular-nums; line-height: 1.1; }
.qty small { font-size: 8px; letter-spacing: 0.1em; color: #a9744f; }
.qty.low { color: var(--bad); animation: lowBlink 1s steps(2) infinite; }
@keyframes lowBlink { 50% { opacity: 0.5; } }
.btns { display: flex; gap: 8px; }
.btns .btn { min-width: 44px; padding: 0 10px; }
.note { font-size: 13px; margin: 14px 4px; }
.locked { display: flex; align-items: center; gap: 10px; }
.sell { color: var(--good); }
</style>
