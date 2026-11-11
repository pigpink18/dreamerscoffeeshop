<script setup lang="ts">
// Khay nguyên liệu + nút thao tác (chiết xuất, lắc, xay, khuấy, đổ bỏ)
import { ref, computed } from 'vue'
import { ui, save, brewStep, cancelBrew, startBrew, canMake, giveAddon, tutOn, staffAll } from '../game/store'
import { kitchen, kitchenOpen } from '../game/kitchen'
import { GOODS, goodUnlocked } from '../game/metaData'
import { recipeById, STEPS, type StepId, type IngredientId } from '../game/data'
import { iconUrl, IMG_URL } from '../game/pixel'
import PixelIcon from './ui/PixelIcon.vue'

const showOrders = ref(false)
// kệ hàng bán kèm (bánh / lưu niệm) – hiện khi đã thuê mặt bằng có bán
const shelf = computed(() => GOODS.filter((g) => goodUnlocked(g, save.meta.premise)))
const wanted = computed(() => { const c = ui.queue[0]; return c && c.addon && !c.addonDone ? c.addon : null })

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

/** hướng dẫn ly đầu tiên: nút cần bấm tiếp theo */
const guideId = computed(() => (tutOn.value && ui.brew && !ui.brew.busy ? curStep.value : null))
const tutText = computed(() => {
  if (!tutOn.value) return ''
  if (ui.present) return 'Chạm vào ly để trao cho khách!'
  if (!ui.brew) return 'Khách đang chờ: bấm nút vàng “Nhận order” trên bóng thoại'
  return curStep.value ? `Bấm nút đang sáng: ${STEPS[curStep.value].label} (làm đúng thứ tự từng bước)` : ''
})

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
  <!-- có nhân viên pha chế: họ lo hết quầy nước, bạn chỉ xem & vào bếp -->
  <div v-if="staffAll" class="panel staff-panel">
    <!-- quầy do nhân viên lo: nhân viên pha ngay trong cảnh quầy phía trên → ở đây chỉ còn kệ hàng + nút vào bếp -->
    <div v-if="shelf.length" class="shelf">
      <span class="sh-lbl">KỆ</span>
      <button v-for="g in shelf" :key="g.id" class="good" :class="{ want: wanted === g.id, out: (save.meta.goods[g.id] ?? 0) < 1 }" @pointerdown.prevent="giveAddon(g.id)">
        <img :src="iconUrl(g.id)" class="pix" alt="" /><span class="gq">{{ save.meta.goods[g.id] ?? 0 }}</span>
      </button>
    </div>
    <button class="btn accent big go-kitchen" @click="ui.page = 2">
      <PixelIcon name="house" :size="3" /> {{ kitchenOpen() ? 'VÀO BẾP' : 'MỞ KHU BẾP' }}
      <span v-if="kitchenOpen() && kitchen.tickets.length" class="pxtag warn">{{ kitchen.tickets.length }} phiếu</span>
    </button>
  </div>
  <div v-else class="panel">
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
      <div v-if="tutText" class="tut"><b>HƯỚNG DẪN</b> {{ tutText }}</div>
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
      <button v-for="it in items" :key="it.id" class="item" :class="{ out: (stockOf(it.id) ?? 1) < 1, guide: guideId === it.id }" @pointerdown.prevent="brewStep(it.id)">
        <img :src="iconUrl(it.id)" class="pix ic" alt="" />
        <span class="lbl">{{ STEPS[it.id].label }}</span>
        <span class="qty">{{ stockOf(it.id) }}</span>
      </button>
    </div>

    <div v-if="shelf.length" class="shelf">
      <span class="sh-lbl">KỆ</span>
      <button v-for="g in shelf" :key="g.id" class="good" :class="{ want: wanted === g.id, out: (save.meta.goods[g.id] ?? 0) < 1 }" @pointerdown.prevent="giveAddon(g.id)">
        <img :src="iconUrl(g.id)" class="pix" alt="" /><span class="gq">{{ save.meta.goods[g.id] ?? 0 }}</span>
      </button>
    </div>

    <div class="actions">
      <button v-for="a in ACTIONS" :key="a.id" class="action" :class="{ trash: a.id === 'trash', guide: guideId === a.id }" @pointerdown.prevent="act(a.id)">
        <img :src="a.img" class="pix aic" alt="" />
        <span>{{ a.label }}</span>
        <small v-if="a.id === 'chiet'">còn {{ save.stock.cafe }}</small>
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel { margin-top: 4px; position: relative; display: flex; flex-direction: column; min-height: 0; }
.recipe, .shelf, .actions, .orders { flex: none; }
.shelf { display: flex; align-items: center; gap: 5px; margin: 8px 3px 0; padding: 4px 6px; background: #6f4630; box-shadow: var(--px-border), inset 0 -3px 0 #4a2e1f; overflow-x: auto; }
.sh-lbl { font-size: 9px; font-weight: 900; letter-spacing: 0.1em; color: #ffe8b8; writing-mode: vertical-rl; transform: rotate(180deg); }
.good { position: relative; flex: none; width: 40px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fffaf2; box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2; }
.good img { width: 32px; height: 32px; }
.good .gq { position: absolute; right: 1px; bottom: 0; font-size: 9px; font-weight: 900; color: #8a7566; }
.good.out { opacity: 0.4; }
.good.want { background: #fff1a8; box-shadow: 0 0 0 3px #e0524a, inset 0 -3px 0 #f2c14e; animation: wantPulse 0.7s ease-in-out infinite; }
@keyframes wantPulse { 50% { transform: translateY(-3px); } }
.good:active { transform: translateY(2px); }
.pix { image-rendering: pixelated; image-rendering: crisp-edges; }
/* chiều cao cố định dù đang pha hay không → khung cảnh quán phía trên không bị to/nhỏ */
.recipe { display: flex; flex-wrap: wrap; align-items: center; align-content: center; gap: 6px 8px; min-height: 50px; } /* giữ chỗ cố định cho dòng công thức: nhận order không làm khay/cảnh nhảy lên xuống */

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
  background: #fffaf2; min-height: 46px;
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
  .item { min-height: 40px; }
  .ic { width: 24px; height: 24px; }
  .lbl { font-size: 9px; }
  .action { padding: 2px 0 4px; }
  .aic { width: 22px; height: 22px; }
  .tray { margin-top: 6px; }
  .actions { margin-top: 8px; }
}
/* thiếu chỗ (ShopView thêm class tight): khay gọn lại – nút thấp hơn, icon nhỏ hơn */
.panel.tight .recipe { min-height: 40px; }
.panel.tight .tray { gap: 3px; padding: 3px; margin-top: 4px; }
.panel.tight .item { min-height: 32px; }
.panel.tight .ic { width: 20px; height: 20px; }
.panel.tight .lbl { font-size: 8px; }
.panel.tight .actions { margin-top: 5px; gap: 4px; }
.panel.tight .action { padding: 1px 0 3px; font-size: 10px; }
.panel.tight .aic { width: 18px; height: 18px; }
.panel.tight .shelf { margin-top: 4px; padding: 2px 6px; }
@media (max-height: 600px) {
  .lbl, .action small { display: none; }
  .item { min-height: 34px; }
}
/* màn thấp (iPhone SE, mini…): khay gọn lại để khung cảnh quán đủ chỗ, vẫn rộng bằng khay */
@media (max-height: 720px) {
  .tray { gap: 4px; padding: 4px; margin-top: 5px; }
  .item { min-height: 38px; }
  .ic { width: 24px; height: 24px; }
  .shelf { margin-top: 5px; padding: 2px 6px; }
  .actions { margin-top: 6px; gap: 4px; }
  .aic { width: 22px; height: 22px; }
}
.staff-panel { display: flex; flex-direction: column; gap: 8px; }
.go-kitchen .pxtag { margin-left: 4px; font-size: 12px; letter-spacing: 0; }
.tut { flex-basis: 100%; margin-top: 4px; padding: 4px 7px; font-size: 12px; font-weight: 700; color: #3b2a20; background: #ffe9a8; box-shadow: 0 0 0 2px #d99a2b; animation: tutIn 0.3s ease-out; }
.tut b { font-size: 10px; letter-spacing: 1px; color: #fff; background: #d8333a; padding: 1px 4px; margin-right: 4px; }
@keyframes tutIn { from { transform: translateY(-4px); opacity: 0; } }
</style>
