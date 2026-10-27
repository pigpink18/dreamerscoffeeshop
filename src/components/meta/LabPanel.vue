<script setup lang="ts">
// Phòng thử món: tự xếp thứ tự nguyên liệu + thao tác để tìm công thức bí mật
import { ref, computed } from 'vue'
import { save } from '../../game/store'
import { STEPS, recipeById, type StepId } from '../../game/data'
import { iconUrl, IMG_URL } from '../../game/pixel'
import { SECRET_RECIPES, knownIngredients, tryRecipe } from '../../game/meta'
import { SECRET_HINTS } from '../../game/metaData'
import DrinkIcon from '../ui/DrinkIcon.vue'
import PixelIcon from '../ui/PixelIcon.vue'

const BASE: StepId[] = ['ly', 'da', 'suaDac', 'suaTuoi', 'matcha', 'tra', 'dao', 'syrup', 'kem', 'kemTuoi']
const ACTS: StepId[] = ['chiet', 'lac', 'xay', 'khuay']
const palette = computed(() => [...BASE, ...(['dua', 'trung', 'cacao'] as StepId[]).filter((s) => knownIngredients.value.has(s as never)), ...ACTS])
const img = (s: StepId) => (s === 'chiet' ? IMG_URL.espresso : s === 'lac' ? IMG_URL.shaker : s === 'xay' ? IMG_URL.blender : iconUrl(s))
const seq = ref<StepId[]>([])
const msg = ref<{ t: string; k: string } | null>(null)
const last = ref<StepId[]>([])
function retry() { seq.value = [...last.value]; msg.value = null }

function add(s: StepId) { if (seq.value.length < 7) seq.value.push(s); msg.value = null }
function pop() { seq.value.pop(); msg.value = null }
function test() {
  if (seq.value.length < 3) { msg.value = { t: 'Cho ít nhất 3 bước rồi pha thử nha', k: 'warn' }; return }
  const r = tryRecipe(seq.value)
  last.value = [...seq.value]
  seq.value = []
  if (r.kind === 'found') msg.value = { t: `Tìm ra công thức bí mật: ${recipeById[r.recipe].name}! Đã thêm vào menu + tặng nguyên liệu`, k: 'good' }
  else if (r.kind === 'known') msg.value = { t: `Đây là ${recipeById[r.recipe!].name} – món đã có rồi`, k: '' }
  else if (r.kind === 'order') msg.value = { t: 'Đúng nguyên liệu rồi! Nhưng thứ tự chưa chuẩn…', k: 'warn' }
  else if (r.kind === 'close') msg.value = { t: 'Hơi giống một công thức bí mật… thử đổi vài bước xem', k: 'warn' }
  else msg.value = { t: 'Uống thử… vị lạ quá… Không phải công thức nào cả', k: 'bad' }
}
const found = (id: string) => save.meta.secrets.includes(id as never)
const hinted = (id: string) => save.meta.hints.includes(id as never)
const ingOf = (id: string) => [...new Set(recipeById[id as keyof typeof recipeById].steps.filter((s) => s !== 'ly'))].sort()
</script>

<template>
  <div>
    <div class="section-title">Phòng thử món</div>
    <div class="card lab">
      <div class="seq">
        <span v-for="(s, i) in seq" :key="i" class="chip"><i>{{ i + 1 }}</i><img :src="img(s)" alt="" /></span>
        <span v-if="!seq.length" class="muted small">Chạm nguyên liệu / thao tác theo thứ tự bạn đoán…</span>
      </div>
      <div class="pal">
        <button v-for="s in palette" :key="s" class="pi" :class="{ act: STEPS[s].kind === 'act' }" @click="add(s)"><img :src="img(s)" alt="" /><small>{{ STEPS[s].label }}</small></button>
      </div>
      <div class="btns">
        <button class="btn sm ghost" :disabled="!seq.length" @click="pop">Bỏ bước</button>
        <button class="btn sm accent" @click="test">PHA THỬ</button>
      </div>
      <div v-if="msg" class="msg" :class="msg.k">{{ msg.t }} <button v-if="msg.k !== 'good' && last.length" class="btn sm ghost" @click="retry">Sửa lại lần vừa thử</button></div>
      <p class="muted tiny">Pha thử miễn phí, không tốn nguyên liệu. Mọi món đều bắt đầu bằng Ly.</p>
    </div>
    <div class="section-title">Công thức bí mật · {{ save.meta.secrets.length }}/{{ SECRET_RECIPES.length }}</div>
    <div class="secrets">
      <div v-for="r in SECRET_RECIPES" :key="r.id" class="card sc" :class="{ found: found(r.id) }">
        <DrinkIcon v-if="found(r.id)" :id="r.id" :scale="2" />
        <span v-else class="q"><PixelIcon name="question" :size="3" /></span>
        <div class="grow">
          <b>{{ found(r.id) ? r.name : '??? ' }}</b>
          <div v-if="found(r.id)" class="muted small">Đã có trong menu</div>
          <template v-else-if="hinted(r.id)">
            <div class="small hint">“{{ SECRET_HINTS[r.id] }}”</div>
            <div class="ings"><img v-for="s in ingOf(r.id)" :key="s" :src="img(s)" :title="STEPS[s].label" alt="" /></div>
          </template>
          <div v-else class="muted small">Chưa có gợi ý – gặp khách hiếm, làm nhiệm vụ, mở thành tựu để nhận</div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.small { font-size: 12px; line-height: 1.35; }
.tiny { font-size: 11px; margin: 8px 2px 0; }
.secrets { display: flex; flex-direction: column; gap: 10px; }
.sc { display: flex; align-items: center; gap: 10px; }
.sc.found { background: #eefaf2; }
.q { width: 32px; height: 44px; display: flex; align-items: center; justify-content: center; background: #efe3d5; box-shadow: var(--px-border-2); }
.hint { font-style: italic; color: #6f4e37; }
.ings { display: flex; gap: 4px; margin-top: 4px; }
.ings img { width: 32px; height: 32px; image-rendering: pixelated; }
.lab { display: flex; flex-direction: column; gap: 10px; }
.seq { min-height: 40px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 6px; background: #f1e2cf; box-shadow: var(--px-border-2); }
.chip { position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fffaf2; box-shadow: 0 0 0 2px #3b2a20; }
.chip img { width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain; }
.chip i { position: absolute; top: -6px; left: -6px; font-style: normal; font-size: 9px; font-weight: 900; background: #f2c14e; padding: 0 3px; box-shadow: 0 0 0 1px #3b2a20; }
.pal { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.pi { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px 0 5px; background: #fffaf2; box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2; }
.pi.act { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -3px 0 #d99a2b; }
.pi:active { transform: translateY(2px); }
.pi img { width: 32px; height: 32px; image-rendering: pixelated; object-fit: contain; }
.pi small { font-size: 9px; font-weight: 800; }
.btns { display: flex; justify-content: space-between; }
.msg { font-size: 13px; font-weight: 800; padding: 8px 10px; background: #efe3d5; box-shadow: var(--px-border-2); }
.msg.good { background: #e1f3ea; color: #1d6b47; }
.msg.warn { background: #fdf0d9; color: #8a5a00; }
.msg.bad { background: #fbe3e2; color: #a3302a; }
</style>
