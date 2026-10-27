<script setup lang="ts">
import { noEmoji } from '../game/emoji'
import { computed } from 'vue'
import { save, appRating, ui } from '../game/store'
import { REGULARS, BOND_LEVELS, bondLevel, SHIPPERS } from '../game/data'
import PixelIcon from './ui/PixelIcon.vue'
import DrinkIcon from './ui/DrinkIcon.vue'
import PersonPortrait from './ui/PersonPortrait.vue'

const BOND_ICON = ['heartOff', 'heart', 'heart2']

const rating = computed(() => appRating.value)
const dist = computed(() => {
  const d = [0, 0, 0, 0, 0]
  for (const r of save.reviews) d[r.stars - 1]++
  return d.reverse()
})
const maxDist = computed(() => Math.max(1, ...dist.value))
const regulars = computed(() => REGULARS.map((r) => ({ ...r, bond: save.bonds[r.id] ?? 0 })).sort((a, b) => b.bond - a.bond))
</script>

<template>
  <div>
    <!-- Trang quán trên app giao đồ (hư cấu) -->
    <div class="card store">
      <div class="brand"><span class="logo">DreamersFood</span><span class="muted tiny">app giao đồ uống</span></div>
      <div class="row">
        <div class="avatar"><PixelIcon name="cup" :size="4" /></div>
        <div class="grow">
          <div class="name">Dreamers Coffee</div>
          <div class="muted small">Cà phê · Trà · Giao nhanh bởi shipper rapper</div>
        </div>
      </div>
      <template v-if="save.upgrades.shipper">
        <div class="rating-row">
          <div class="big">{{ rating.toFixed(1) }}</div>
          <div>
            <div class="stars"><PixelIcon v-for="i in 5" :key="i" :name="i <= Math.round(rating) ? 'star' : 'starOff'" :size="2" /></div>
            <div class="muted tiny">{{ save.reviews.length }} đánh giá</div>
          </div>
          <div class="dist grow">
            <div v-for="(n, i) in dist" :key="i" class="drow"><span>{{ 5 - i }}</span><div><i :style="{ width: (n / maxDist) * 100 + '%' }" /></div></div>
          </div>
        </div>
        <div class="crew">
          <span v-for="(s, i) in SHIPPERS.slice(0, save.upgrades.shipper)" :key="i" class="pxtag"><PixelIcon name="scooter" :size="2" /> {{ s.name }}</span>
        </div>
      </template>
      <div v-else class="locked">
        <PixelIcon name="scooter" :size="4" /><span>Chưa mở bán online. Thuê <b>Shipper rapper</b> ở tab Nâng cấp để nhận đơn qua app nha!</span>
        <button class="btn sm accent" style="margin-top: 10px" @click="ui.tab = 'upgrade'"><PixelIcon name="up" :size="2" /> ĐI TỚI NÂNG CẤP</button>
      </div>
    </div>

    <template v-if="save.reviews.length">
      <div class="section-title">Đánh giá mới nhất</div>
      <div class="reviews">
        <div v-for="r in save.reviews.slice(0, 12)" :key="r.id" class="card review">
          <div class="row">
            <span class="ava">{{ r.name[0] }}</span>
            <div class="grow">
              <b>{{ r.name }}</b>
              <div class="stars sm"><PixelIcon v-for="i in 5" :key="i" :name="i <= r.stars ? 'star' : 'starOff'" :size="1.5" /></div>
            </div>
            <span class="muted tiny rday">Ngày {{ r.day }} <DrinkIcon :id="r.recipe" :scale="1" /></span>
          </div>
          <p>{{ noEmoji(r.text) }}</p>
        </div>
      </div>
    </template>

    <div class="section-title">Khách quen</div>
    <div class="card regs">
      <div v-for="r in regulars" :key="r.id" class="reg">
        <span class="face"><PersonPortrait :look="r.look" :hidden="r.bond <= 0" :scale="2" /><PixelIcon v-if="r.bond <= 0" class="q" name="question" :size="2" /></span>
        <div class="grow">
          <b>{{ r.bond > 0 ? r.name : '???' }}</b>
          <div class="muted tiny">{{ r.bond > 0 ? r.role : 'Chưa gặp – sẽ sớm ghé quán' }}</div>
          <div class="hearts pxbar"><i :style="{ width: r.bond + '%' }" /></div>
        </div>
        <span class="lvl pxtag" :class="['', 'warn', 'bad'][bondLevel(r.bond)]"><PixelIcon :name="BOND_ICON[bondLevel(r.bond)]" :size="2" /> {{ BOND_LEVELS[bondLevel(r.bond)].name }}</span>
      </div>
      <div class="muted tiny note">Tám chuyện & pha chuẩn để thân hơn. Khách quen/bạn thân tip nhiều hơn và kiên nhẫn hơn.</div>
    </div>

    <div class="section-title">Tác động xã hội</div>
    <div class="card impact">
      <div class="tile"><PixelIcon name="plant" /><b>{{ save.impact.plastic }}</b><small>ly nhựa đã tiết kiệm</small></div>
      <div class="tile"><PixelIcon name="bean" /><b>{{ save.impact.farmerKg.toFixed(1) }}kg</b><small>cà phê mua từ nông dân</small></div>
    </div>
    <p class="muted tiny note">Mở “Sống xanh” và “Cà phê sạch Cầu Đất” ở tab Nâng cấp để tăng tác động.</p>
  </div>
</template>

<style scoped>
.small { font-size: 12px; }
.tiny { font-size: 11px; }
.store { padding: 14px; }
.brand { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.logo { font-weight: 900; color: #e8503a; letter-spacing: -0.02em; font-size: 15px; }
.avatar { width: 54px; height: 54px; background: #6f4630; display: flex; align-items: center; justify-content: center; box-shadow: var(--px-border-2), inset 0 -4px 0 #4a2e1f; }
.name { font-weight: 900; font-size: 18px; }
.rating-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.big { font-size: 40px; font-weight: 900; letter-spacing: -0.03em; }
.stars { display: flex; gap: 2px; }
.stars.sm { gap: 1px; margin-top: 2px; }
.dist { display: flex; flex-direction: column; gap: 2px; }
.drow { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--muted); }
.drow div { flex: 1; height: 6px; background: #eadccd; box-shadow: 0 0 0 1px #3b2a20; overflow: hidden; }
.drow i { display: block; height: 100%; background: #f5a623; }
.crew { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.chip { background: #f1e4d4; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
.locked { margin-top: 12px; background: #fff3dc; padding: 12px; font-size: 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; box-shadow: var(--px-border-2); }
.reviews { display: flex; flex-direction: column; gap: 13px; }
.review { padding: 12px; }
.review p { margin-top: 6px; font-size: 14px; }
.ava { width: 32px; height: 32px; background: #e8a33d; color: #3b2a20; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: var(--px-border-2), inset 0 -3px 0 #c98a2b; }
.rday { display: inline-flex; align-items: center; gap: 4px; }
.regs { padding: 6px 14px 12px; }
.reg { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 2px dotted #e6d3b8; }
.reg .face { position: relative; width: 40px; height: 40px; flex: none; display: flex; align-items: center; justify-content: center; background: #f1e2cf; box-shadow: var(--px-border-2); overflow: visible; }
.reg .face .q { position: absolute; }
.hearts { height: 7px; margin: 6px 2px 0; }
.hearts i { background: #ff6b81 !important; box-shadow: inset 0 -2px 0 #c94f63, inset 0 1px 0 #ffc4ce !important; }
.lvl { font-size: 10px; }
.note { margin: 10px 4px 0; }
.impact { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: none; box-shadow: none; padding: 0; }
.impact .tile { gap: 3px; background: var(--paper); padding: 10px 12px 12px; box-shadow: var(--px-border-2), inset 0 -5px 0 #e9dcc8, 0 5px 0 rgba(59, 42, 32, 0.2); }
.impact div { display: flex; flex-direction: column; }
.impact b { font-size: 20px; font-weight: 900; }
.impact small { font-size: 11px; color: var(--muted); }
</style>
