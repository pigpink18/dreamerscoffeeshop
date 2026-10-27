<script setup lang="ts">
// Khay nguyên liệu + nút thao tác (chiết xuất, lắc, xay, khuấy, đổ bỏ)
import { ref, computed } from 'vue'
import { ui, save, brewStep, cancelBrew, startBrew, canMake } from '../game/store'
import { recipeById, STEPS, type StepId, type IngredientId } from '../game/data'
import { iconUrl, IMG_URL } from '../game/pixel'
import PixelIcon from './ui/PixelIcon.vue'

const showOrders = ref(false)

const ITEMS: { id: StepId }[] = [
  { id: 'ly' },
  { id: 'da' },
  { id: 'suaDac' },
  { id: 'suaTuoi' },
  { id: 'matcha' },
  { id: 'tra' },
  { id: 'dao' },
  { id: 'syrup' },
  { id: 'kem' },
  { id: 'kemTuoi' },
  { id: 'dua' },
  { id: 'trung' },
  { id: 'cacao' },
]
// chỉ hiện nguyên liệu mà menu hiện tại dùng tới (đỡ rối, khay luôn gọn 1–3 hàng)
const items = computed(() => {
  const used = new Set<StepId>()
  for (const id of save.unlocked) for (const st of recipeById[id].steps) used.add(st)
  return ITEMS.filter((i) => used.has(i.id))
})
const ACTIONS: { id: StepId | 'trash'; img: string; label: string }[] = [
  { id: 'chiet', img: IMG_URL.espresso, label: 'Chiết xuất' },
  { id: 'lac', img: IMG_URL.shaker, label: 'Lắc' },
  { id: 'xay', img: IMG_URL.blender, label: 'Xay' },
  { id: 'khuay', img: iconUrl('khuay'), label: 'Khuấy' },
  { id: 'trash', img: iconUrl('trash'), label: 'Đổ bỏ' },
]
const recipe = computed(() => (ui.brew ? recipeById[ui.brew.recipe] : null))
const curStep = computed(() => (recipe.value && ui.brew ? recipe.value.steps[ui.brew.done.length] ?? null : null))
const stepImg = (s: StepId) => (s === 'chiet' ? IMG_URL.espresso : s === 'lac' ? IMG_URL.shaker : s === 'xay' ? IMG_URL.blender : iconUrl(s))
const stockOf = (s: StepId) => (s === 'chiet' ? save.stock.cafe : STEPS[s].kind === 'ing' ? save.stock[s as IngredientId] : null)
const newOrders = computed(() => ui.orders.filter((o) => o.state === 'new'))
const busyShipper = computed(() => ui.shippers.filter((s) => s.orderId !== null).length)

function act(id: StepId | 'trash') {
  if (id === 'trash') cancelBrew()
  else brewStep(id)
}
function pickOrder(id: number) {
  showOrders.value = false
  startBrew('order', id)
}
</script>

<template>
  <div class="panel">
    <!-- Công thức đang pha -->
    <div class="recipe">
      <template v-if="recipe && ui.brew">
        <div class="rhead">
          <span class="rname">{{ recipe.name }}</span>
          <span v-if="curStep" class="cur">Bước {{ ui.brew.done.length + 1 }}/{{ recipe.steps.length }}: <b>{{ STEPS[curStep].label }}</b></span>
          <span v-else class="cur ok">Xong! Đưa khách</span>
        </div>
        <div class="steps">
          <span
            v-for="(s, i) in recipe.steps" :key="i" class="st" :title="STEPS[s].label"
            :class="{ done: i < ui.brew.done.length, now: i === ui.brew.done.length }"
          >
            <i>{{ i + 1 }}</i><img :src="stepImg(s)" class="pix" alt="" />
          </span>
        </div>
      </template>
      <span v-else class="muted hint">Nhận order trên quầy để bắt đầu pha</span>
      <button v-if="save.upgrades.shipper" class="app-btn" :class="{ hot: newOrders.length }" @click="showOrders = !showOrders">
        <PixelIcon name="phone" :size="2" /> {{ newOrders.length }}<small v-if="busyShipper"> · <PixelIcon name="scooter" :size="2" />{{ busyShipper }}</small>
      </button>
    </div>

    <!-- Danh sách đơn app -->
    <div v-if="showOrders" class="orders">
      <div v-if="!ui.orders.length" class="muted small">Chưa có đơn app</div>
      <div v-for="o in ui.orders" :key="o.id" class="ord">
        <span class="grow"><b>{{ o.name }}</b> · {{ recipeById[o.recipe].name }}
          <span class="obar"><i :style="{ width: Math.max(0, o.timeLeft / o.maxTime) * 100 + '%' }" /></span>
        </span>
        <button v-if="o.state === 'new'" class="mini" :disabled="!!ui.brew || !canMake(o.recipe)" @click="pickOrder(o.id)">Pha</button>
        <span v-else class="tag"><PixelIcon :name="o.state === 'ready' ? 'crate' : 'scooter'" :size="2" /> {{ o.state === 'ready' ? 'chờ ship' : 'đang giao' }}</span>
      </div>
    </div>

    <div class="tray">
      <button v-for="it in items" :key="it.id" class="item" :class="{ out: (stockOf(it.id) ?? 1) < 1 }" @pointerdown.prevent="brewStep(it.id)">
        <img :src="iconUrl(it.id)" class="pix ic" alt="" />
        <span class="lbl">{{ STEPS[it.id].label }}</span>
        <span class="qty">{{ stockOf(it.id) }}</span>
      </button>
    </div>

    <div class="actions">
      <button v-for="a in ACTIONS" :key="a.id" class="action" :class="{ trash: a.id === 'trash' }" @pointerdown.prevent="act(a.id)">
        <img :src="a.img" class="pix aic" alt="" />
        <span>{{ a.label }}</span>
        <small v-if="a.id === 'chiet'">còn {{ save.stock.cafe }}</small>
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel { margin-top: 4px; position: relative; }
.pix { image-rendering: pixelated; image-rendering: crisp-edges; }
.recipe { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; min-height: 30px; }

.rhead { display: flex; flex: 1 1 0; align-items: baseline; gap: 8px; min-width: 0; }
.rname { font-weight: 900; font-size: 13px; white-space: nowrap; }
.cur { font-size: 11px; color: #6f4e37; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cur.ok { color: #1d6b47; font-weight: 900; }
.steps { order: 3; flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: 4px; }
.st {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 24px; background: #efe3d5; box-shadow: 0 0 0 2px #cdb79c; margin: 2px;
}
.st i { position: absolute; top: -5px; left: -5px; font-style: normal; font-size: 8px; font-weight: 900; background: #fff; color: #8a7566; padding: 0 2px; box-shadow: 0 0 0 1px #cdb79c; line-height: 10px; }
.st img { width: 16px; height: 16px; object-fit: contain; }
.st.done { background: #c9f0d8; box-shadow: 0 0 0 2px #2f9e6b; opacity: 0.6; }
.st.now { background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20, inset 0 -2px 0 #d99a2b; animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(1.1); } }
.hint { font-size: 13px; flex: 1; }
.app-btn { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; font-weight: 900; font-size: 13px; background: #fff; box-shadow: var(--px-border-2), inset 0 -3px 0 #e0d0bc; padding: 4px 8px 6px; }
.app-btn small { display: inline-flex; align-items: center; gap: 3px; }
.tag { display: inline-flex; align-items: center; gap: 4px; }
.app-btn.hot { background: #ffe1dc; animation: pulse 1s infinite; }
.orders { position: absolute; left: 2px; right: 2px; top: 38px; z-index: 20; max-height: 210px; overflow-y: auto; background: #fff; box-shadow: var(--px-border-2), 0 6px 0 rgba(59, 42, 32, 0.3); padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.ord { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.obar { display: block; height: 4px; background: #f0e4d6; border-radius: 3px; margin-top: 3px; overflow: hidden; }
.obar i { display: block; height: 100%; background: #2f9e6b; }
.mini { background: #6f4630; color: #fff; font-weight: 900; padding: 5px 12px 7px; font-size: 12px; box-shadow: var(--px-border-2), inset 0 -3px 0 #4a2e1f; }
.mini:disabled { opacity: 0.4; }
.tag { font-size: 11px; font-weight: 800; color: #b7791f; }
.small { font-size: 12px; }

.tray {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 8px), #a06c46; padding: 6px; margin: 8px 3px 0;
  box-shadow: var(--px-border), inset 0 3px 0 #b98a62, inset 0 -4px 0 #7a4e33;
}
.item {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fffaf2; height: 46px;
  box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2, 0 4px 0 rgba(59, 42, 32, 0.5); transition: transform 0.06s;
}
.item:active { transform: translateY(3px); box-shadow: var(--px-border-2); }
.item.out { opacity: 0.45; }
.ic { width: 32px; height: 32px; }
.lbl { font-size: 10px; font-weight: 800; margin-top: 1px; }
.qty { position: absolute; top: 2px; right: 4px; font-size: 9px; font-weight: 900; color: #8a7566; }

.actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 10px 3px 0; }
.action {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  background: #f2c14e; padding: 3px 0 5px;
  font-size: 11px; font-weight: 900; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 4px 0 rgba(59, 42, 32, 0.5);
}
.action:active { transform: translateY(3px); box-shadow: var(--px-border-2); }
.action.trash { background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -4px 0 #d8bf9f, 0 4px 0 rgba(59, 42, 32, 0.5); }
.aic { height: 28px; width: 28px; object-fit: contain; }
.action small { font-size: 9px; font-weight: 800; color: #6f4e37; }
/* màn hình thấp (iPhone nhỏ / đang mở trong trình duyệt): khay gọn hơn để cảnh quán to hơn */
@media (max-height: 720px) {
  .item { height: 40px; }
  .ic { width: 24px; height: 24px; }
  .lbl { font-size: 9px; }
  .action { padding: 2px 0 4px; }
  .aic { width: 22px; height: 22px; }
  .tray { margin-top: 6px; }
  .actions { margin-top: 8px; }
}
@media (max-height: 600px) {
  .lbl, .action small { display: none; }
  .item { height: 34px; }
}
</style>
