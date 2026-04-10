<template>
  <div class="discover-page page">
    <van-nav-bar left-arrow @click-left="$router.back()">
      <template #title>
        <div class="nav-title">
          <div class="title-main">{{ currentLocation || '发现飞机' }}</div>
          <div class="title-sub">雷达扫描 · {{ filteredPlanes.length }} 架</div>
        </div>
      </template>
    </van-nav-bar>

    <div v-if="!currentLocation" class="location-select">
      <div class="section-title">
        <h2>选择落点</h2>
        <span>开始扫描</span>
      </div>
      <div class="location-chips">
        <button
          v-for="loc in locations"
          :key="loc.id"
          class="chip"
          @click="selectLocation(loc.name)"
        >
          {{ loc.name }}
        </button>
      </div>
    </div>

    <template v-else>
      <div class="discover-toolbar">
        <div class="mood-scroll">
          <button
            v-for="m in moodFilters"
            :key="m.value"
            :class="['chip', { active: activeMood === m.value }]"
            @click="activeMood = m.value"
          >
            {{ m.label }}
          </button>
        </div>
        <button class="icon-btn" @click="handleRandom">
          <van-icon name="shuffle" size="18" />
        </button>
      </div>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <RadarScan v-if="scanning" />
        <div v-else class="plane-list">
          <van-empty v-if="filteredPlanes.length === 0" description="这里还没有飞机" />
          <PlaneCard
            v-for="(p, i) in filteredPlanes"
            :key="p.id"
            :plane="p"
            :style="{ animationDelay: `${i * 40}ms` }"
            @click="$router.push(`/plane/${p.id}`)"
          />
        </div>
      </van-pull-refresh>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar as VanNavBar, Empty as VanEmpty, PullRefresh as VanPullRefresh, Icon as VanIcon } from 'vant'
import { showFailToast } from 'vant'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import { getPlanes, getRandomPlane } from '../api'
import RadarScan from '../components/RadarScan.vue'
import PlaneCard from '../components/PlaneCard.vue'

const router = useRouter()
const store = useAppStore()
const { locations, currentLocation } = storeToRefs(store)
const planes = ref([])
const scanning = ref(false)
const refreshing = ref(false)
const activeMood = ref('all')

const moodFilters = [
  { label: '全部', value: 'all' },
  { label: '开心', value: 'happy' },
  { label: '难过', value: 'sad' },
  { label: '平静', value: 'calm' },
  { label: '吐槽', value: 'angry' },
  { label: '心动', value: 'love' },
]

const filteredPlanes = computed(() => {
  if (activeMood.value === 'all') return planes.value
  return planes.value.filter(p => p.mood === activeMood.value)
})

function selectLocation(name) {
  store.currentLocation = name
}

async function loadPlanes(loc) {
  scanning.value = true
  try {
    const { data } = await getPlanes(loc)
    setTimeout(() => {
      planes.value = data
      scanning.value = false
    }, 1200)
  } catch {
    scanning.value = false
  }
}

async function onRefresh() {
  if (currentLocation.value) {
    const { data } = await getPlanes(currentLocation.value)
    planes.value = data
  }
  refreshing.value = false
}

async function handleRandom() {
  try {
    const { data } = await getRandomPlane()
    router.push(`/plane/${data.id}`)
  } catch {
    showFailToast('暂无飞机可拾取')
  }
}

watch(currentLocation, (val) => {
  if (val) loadPlanes(val)
})

onMounted(async () => {
  await store.fetchLocations()
  if (currentLocation.value) loadPlanes(currentLocation.value)
})
</script>

<style scoped>
.discover-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.nav-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

.title-main {
  font-size: 16px;
  font-weight: 600;
}

.title-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.location-select {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.location-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.discover-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mood-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.plane-list {
  padding-bottom: 12px;
}
</style>
