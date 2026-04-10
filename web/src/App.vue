<template>
  <van-config-provider :theme="isDark ? 'dark' : 'light'">
    <div class="app-shell">
      <router-view />
    </div>
    <nav v-if="showTabbar" class="curved-tabbar" :style="tabbarStyle">
      <svg class="curved-bg" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
        <path :d="tabbarPath" />
      </svg>

      <div class="curved-bubble" aria-hidden="true">
        <Transition name="bubble-icon" mode="out-in">
          <van-icon :key="tabs[active].icon" :name="tabs[active].icon" size="22" class="bubble-icon" />
        </Transition>
      </div>

      <button
        v-for="(tab, i) in tabs"
        :key="tab.path"
        class="curved-item"
        :class="{ active: i === active }"
        :aria-label="tab.label"
        :title="tab.label"
        @click="go(tab.path, i)"
      >
        <van-icon :name="tab.icon" size="20" />
      </button>
    </nav>
  </van-config-provider>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from './stores/app'
import {
  ConfigProvider as VanConfigProvider,
  Icon as VanIcon,
} from 'vant'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const { isDark } = storeToRefs(store)
const tabs = [
  { path: '/', icon: 'wap-home-o', label: '首页' },
  { path: '/discover', icon: 'search', label: '发现' },
  { path: '/throw', icon: 'edit', label: '投掷' },
  { path: '/trending', icon: 'fire-o', label: '热门' },
  { path: '/mine', icon: 'user-o', label: '我的' },
]

const active = ref(0)
const showTabbar = computed(() => !route.path.startsWith('/plane/'))

watchEffect(() => {
  const index = tabs.findIndex((tab) => {
    if (tab.path === '/') return route.path === '/'
    return route.path.startsWith(tab.path)
  })
  active.value = index === -1 ? 0 : index
})

function go(path, index) {
  if (typeof index === 'number') active.value = index
  if (route.path !== path) router.push(path)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const notchWidth = 26
const notchDepth = 28
const notchCurve = 7
const notchMargin = notchWidth / 2
const activePercent = computed(() => ((active.value + 0.5) / tabs.length) * 100)
const activeX = computed(() => clamp(activePercent.value, notchMargin, 100 - notchMargin))

const tabbarStyle = computed(() => ({
  '--active-x': `${activeX.value}%`,
  '--tab-count': tabs.length,
}))

const tabbarPath = computed(() => {
  const W = 100
  const H = 64
  const x = activeX.value
  const left = x - notchWidth / 2
  const right = x + notchWidth / 2
  return `
    M 0 0
    L ${left - notchCurve} 0
    C ${left + notchCurve} 0, ${left + notchCurve} ${notchDepth}, ${x} ${notchDepth}
    C ${right - notchCurve} ${notchDepth}, ${right - notchCurve} 0, ${right + notchCurve} 0
    L ${W} 0
    L ${W} ${H}
    L 0 ${H}
    Z
  `
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
