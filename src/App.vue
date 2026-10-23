<script setup lang="ts">
import { ui, save } from './game/store'
import TopBar from './components/TopBar.vue'
import TabBar from './components/TabBar.vue'
import ShopView from './components/ShopView.vue'
import StockView from './components/StockView.vue'
import MenuView from './components/MenuView.vue'
import UpgradeView from './components/UpgradeView.vue'
import DayReport from './components/DayReport.vue'
import Toasts from './components/Toasts.vue'
import AppView from './components/AppView.vue'
import IntroStory from './components/IntroStory.vue'

const views = { shop: ShopView, stock: StockView, menu: MenuView, app: AppView, upgrade: UpgradeView }
</script>

<template>
  <div class="app">
    <TopBar />
    <main class="content">
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
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.25s; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
</style>
