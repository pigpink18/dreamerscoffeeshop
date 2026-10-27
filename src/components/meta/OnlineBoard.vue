<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { save } from '../../game/store'
import { onlineEnabled, board, loadBoard, submitScore, myNick } from '../../game/online'
import PixelIcon from '../ui/PixelIcon.vue'

const editing = ref(false)
const nick = ref(myNick())
const myPos = computed(() => board.rows.findIndex((r) => r.player_id === save.playerId))
function saveNick() {
  save.meta.online.nick = nick.value.trim().slice(0, 24)
  editing.value = false
  submitScore().then(loadBoard)
}
onMounted(() => { if (onlineEnabled && Date.now() - board.at > 60_000) submitScore().then(loadBoard) })
</script>

<template>
  <div>
    <div class="section-title">Bảng xếp hạng online</div>
    <div v-if="!onlineEnabled" class="card off">
      <PixelIcon name="phone" :size="3" />
      <div class="muted small">Chưa bật. Khi chủ game cấu hình máy chủ (xem README), điểm phố tích luỹ của mọi người chơi trên mọi máy sẽ được so tài ở đây.</div>
    </div>
    <div v-else class="card on">
      <div class="me">
        <div class="grow">
          <div class="muted tiny">TÊN TRÊN BẢNG</div>
          <div v-if="!editing" class="nm" @click="editing = true">{{ myNick() }} <small class="muted">(sửa)</small></div>
          <div v-else class="edit"><input v-model="nick" maxlength="24" @keyup.enter="saveNick" /><button class="btn sm accent" @click="saveNick">LƯU</button></div>
        </div>
        <div class="sc"><small>ĐIỂM</small><b>{{ Math.round(save.meta.online.career) }}</b></div>
      </div>
      <div v-if="board.loading" class="muted small">Đang tải…</div>
      <div v-else-if="board.error" class="muted small">{{ board.error }} <button class="btn sm ghost" @click="loadBoard">THỬ LẠI</button></div>
      <div v-else class="rows">
        <div v-for="(r, i) in board.rows" :key="r.player_id" class="rw" :class="{ mine: r.player_id === save.playerId }">
          <span class="rk">{{ i + 1 }}</span>
          <span class="grow">{{ r.name }} <small class="muted">· ngày {{ r.day }} · {{ r.stars }} sao</small></span>
          <b>{{ r.score }}</b>
        </div>
        <div v-if="!board.rows.length" class="muted small">Chưa có ai – bán xong 1 ngày để lên bảng!</div>
        <div v-if="board.rows.length && myPos < 0" class="muted small">Bạn chưa vào top 50 – cố lên!</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.off { display: flex; align-items: center; gap: 10px; }
.small { font-size: 12px; line-height: 1.4; }
.tiny { font-size: 10px; letter-spacing: 0.1em; font-weight: 900; }
.me { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; border-bottom: 2px dotted #e6d3b8; margin-bottom: 6px; }
.nm { font-weight: 900; }
.edit { display: flex; gap: 6px; }
.edit input { flex: 1; min-width: 0; font: inherit; font-weight: 800; padding: 4px 6px; border: none; background: #f1e2cf; box-shadow: var(--px-border-2); }
.sc { display: flex; flex-direction: column; align-items: flex-end; }
.sc small { font-size: 9px; font-weight: 900; color: #a9744f; }
.sc b { font-size: 18px; }
.rows { display: flex; flex-direction: column; }
.rw { display: flex; align-items: center; gap: 8px; padding: 6px 2px; font-size: 13px; border-bottom: 1px dotted #e6d3b8; }
.rw.mine { background: #fff3cf; font-weight: 900; }
.rk { width: 22px; text-align: center; font-weight: 900; }
</style>
