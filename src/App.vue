<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ui, save } from './game/store'
import TopBar from './components/TopBar.vue'
import TabBar from './components/TabBar.vue'
import ShopView from './components/ShopView.vue'
import StockView from './components/StockView.vue'
import MenuView from './components/MenuView.vue'
import UpgradeView from './components/UpgradeView.vue'
import DayReport from './components/DayReport.vue'
import Toasts from './components/Toasts.vue'
import BookView from './components/BookView.vue'
import CompeteView from './components/CompeteView.vue'
import IntroStory from './components/IntroStory.vue'

const main = ref<HTMLElement | null>(null)
// đổi tab → cuộn lên đầu (tránh mất thanh chọn mục ở trên cùng)
watch(() => [ui.tab, ui.phase], () => nextTick(() => main.value?.scrollTo({ top: 0 })))
const views = { shop: ShopView, stock: StockView, menu: MenuView, compete: CompeteView, app: BookView, upgrade: UpgradeView }
</script>

<template>
  <div class="app">
    <TopBar />
    <main ref="main" class="content" :class="{ locked: ui.phase === 'open' && ui.tab === 'shop' }">
      <KeepAlive>
        <component :is="views[ui.tab]" />
      </KeepAlive>
    </main>
    <TabBar />
    <Toasts />
    <Transition name="sheet">
      <DayReport v-if="ui.report" />
    </Transition>
    <Transition name="sheet">
      <IntroStory v-if="!save.introSeen || ui.showIntro" />
    </Transition>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg);
}
.content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 12px 14px 24px;
}
/* đang bán: màn hình cố định, không cuộn – cảnh quán tự co cho vừa */
.content.locked { overflow: hidden; display: flex; flex-direction: column; padding-top: 8px; padding-bottom: 8px; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.25s; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
</style>
