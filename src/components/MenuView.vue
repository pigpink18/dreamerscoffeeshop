<script setup lang="ts">
import { save, setPrice, unlockRecipe, recipeCost, vibrate, fairPrice, RECIPES } from '../game/store'
import { STEPS, moneyShort, UNLOCK_ORDER, type RecipeId, type StepId } from '../game/data'
import { iconUrl, IMG_URL } from '../game/pixel'
import DrinkIcon from './ui/DrinkIcon.vue'
import PixelIcon from './ui/PixelIcon.vue'
import LabPanel from './meta/LabPanel.vue'
import { computed, ref } from 'vue'

const seg = ref<'menu' | 'lab'>('menu')
const LIST = computed(() => RECIPES.filter((r) => !r.secret || save.unlocked.includes(r.id)))
const normalCount = RECIPES.filter((r) => !r.secret).length

const nextGift = () => UNLOCK_ORDER.find((id) => !save.unlocked.includes(id))
const stepImg = (s: StepId) => (s === 'chiet' ? IMG_URL.espresso : s === 'lac' ? IMG_URL.shaker : s === 'xay' ? IMG_URL.blender : iconUrl(s))

function step(id: RecipeId, d: number) {
  setPrice(id, save.prices[id] + d)
  vibrate(5)
}
const ratio = (id: RecipeId, fair: number) => save.prices[id] / fair
function priceLabel(r: number) {
  if (r < 0.85) return { t: 'Rẻ – khách thích', c: 'good' }
  if (r <= 1.05) return { t: 'Hợp lý', c: '' }
  if (r <= 1.3) return { t: 'Hơi đắt', c: 'warn' }
  return { t: 'Quá đắt!', c: 'bad' }
}
</script>

<template>
  <div>
    <div class="segs">
      <button :class="{ on: seg === 'menu' }" @click="seg = 'menu'">Menu & giá</button>
      <button :class="{ on: seg === 'lab' }" @click="seg = 'lab'">Phòng thử món<span v-if="save.meta.hints.length" class="dotn">{{ save.meta.hints.length }}</span></button>
    </div>
    <LabPanel v-if="seg === 'lab'" />
    <template v-else>
    <div class="section-title" style="margin-top: 4px">Giá bán & công thức · {{ save.unlocked.length }}/{{ normalCount + save.meta.secrets.length }} món</div>
    <div class="list">
      <div v-for="r in LIST" :key="r.id" class="card rec" :class="{ locked: !save.unlocked.includes(r.id) }">
        <div class="row">
          <span class="slot"><DrinkIcon :id="r.id" :scale="2" :gray="!save.unlocked.includes(r.id)" /><PixelIcon v-if="!save.unlocked.includes(r.id)" class="lk" name="lock" :size="2" /></span>
          <div class="grow">
            <div class="name">{{ r.name }}</div>
            <div class="needs">
              <span v-for="(s, i) in r.steps" :key="i" class="st"><img :src="stepImg(s)" :title="STEPS[s].label" alt="" /><i v-if="i < r.steps.length - 1">›</i></span>
            </div>
          </div>
          <template v-if="save.unlocked.includes(r.id)">
            <span class="pxtag" :class="priceLabel(ratio(r.id, fairPrice(r.id))).c">{{ priceLabel(ratio(r.id, fairPrice(r.id))).t }}</span>
          </template>
        </div>

        <div v-if="save.unlocked.includes(r.id)" class="price-row">
          <button class="btn sm ghost step" @click="step(r.id, -1000)">−</button>
          <div class="price">
            <b class="pr">{{ moneyShort(save.prices[r.id]) }}</b>
            <span class="muted">vốn {{ moneyShort(recipeCost(r.id)) }} · lời {{ moneyShort(save.prices[r.id] - recipeCost(r.id)) }}</span>
          </div>
          <button class="btn sm ghost step" @click="step(r.id, 1000)">+</button>
        </div>
        <div v-else class="price-row">
          <div class="grow muted small">
            <span v-if="nextGift() === r.id" class="gift"><PixelIcon name="gift" :size="2" /> Xong ngày hôm nay sẽ mở khoá + tặng nguyên liệu</span>
            <span v-else><PixelIcon name="lock" :size="2" /> Mỗi ngày bán xong mở thêm 1 món</span>
            <br />Giá đề xuất {{ moneyShort(fairPrice(r.id)) }}
          </div>
          <button class="btn sm accent" :disabled="save.money < r.unlockCost" @click="unlockRecipe(r.id)">
            <PixelIcon name="lock" :size="2" /> MỞ KHOÁ {{ moneyShort(r.unlockCost) }}
          </button>
        </div>
      </div>
    </div>
    <p class="muted note">Giá thấp giúp tăng danh tiếng, giá cao lời nhiều hơn nhưng khách có thể bỏ đi. Còn {{ RECIPES.length - normalCount }} công thức bí mật ở Phòng thử món!</p>
    </template>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 14px; }
.rec.locked { background: #f4ebe0; }
.slot { position: relative; width: 48px; height: 52px; flex: none; display: flex; align-items: center; justify-content: center; background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -3px 0 #e0c8a8; }
.lk { position: absolute; right: -4px; bottom: -4px; }
.name { font-weight: 900; }
.needs { font-size: 14px; margin-top: 4px; display: flex; flex-wrap: wrap; align-items: center; }
.st { display: inline-flex; align-items: center; }
.st img { width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; }
.needs i { font-style: normal; color: var(--muted); margin: 0 2px; font-size: 11px; }
.gift { color: #b7791f; font-weight: 800; }
.tag { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 99px; white-space: nowrap; }
.tag.good { background: #e1f3ea; color: var(--good); }
.tag.ok { background: #efe3d5; color: var(--brand); }
.tag.warn { background: #fdf0d9; color: #b7791f; }
.tag.bad { background: #fbe3e2; color: var(--bad); }
.price-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 2px dotted #e6d3b8; }
.step { width: 46px; font-size: 22px; padding: 0 0 3px; }
.price { flex: 1; text-align: center; display: flex; flex-direction: column; }
.price b { font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums; }
.price span { font-size: 12px; }
.small { font-size: 13px; }
.note { font-size: 13px; margin: 14px 4px; }
</style>
