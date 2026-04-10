<template>
  <div class="page trending-page">
    <van-nav-bar title="热门飞机">
      <template #right>
        <van-icon name="replay" @click="loadTrending" />
      </template>
    </van-nav-bar>

    <section class="trend-hero glass-card">
      <div class="hero-title">今日热门</div>
      <div class="hero-sub">根据点赞与拾取实时更新</div>
      <div class="hero-count">{{ planes.length }} 架在热榜</div>
    </section>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="plane-list">
        <van-loading v-if="loading" class="loading" />
        <template v-else>
          <van-empty v-if="planes.length === 0" description="暂无热门飞机" />
          <PlaneCard
            v-for="(p, i) in planes"
            :key="p.id"
            :plane="p"
            :style="{ animationDelay: `${i * 40}ms` }"
            @click="$router.push(`/plane/${p.id}`)"
          >
            <template #rank>
              <span class="rank" :class="{ top: i < 3 }">#{{ i + 1 }}</span>
            </template>
          </PlaneCard>
        </template>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NavBar as VanNavBar, PullRefresh as VanPullRefresh, Loading as VanLoading, Empty as VanEmpty, Icon as VanIcon } from 'vant'
import { getTrendingPlanes } from '../api'
import PlaneCard from '../components/PlaneCard.vue'

const planes = ref([])
const loading = ref(true)
const refreshing = ref(false)

async function loadTrending() {
  loading.value = true
  const { data } = await getTrendingPlanes()
  planes.value = data
  loading.value = false
}

async function onRefresh() {
  const { data } = await getTrendingPlanes()
  planes.value = data
  refreshing.value = false
}

onMounted(loadTrending)
</script>

<style scoped>
.trending-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trend-hero {
  padding: 16px;
  text-align: center;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 6px;
}

.hero-sub {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}

.hero-count {
  font-size: 13px;
  color: var(--accent);
}

.plane-list {
  padding-bottom: 12px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(47, 158, 116, 0.15);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  margin-right: 6px;
}

.rank.top {
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
}
</style>
