<template>
  <div class="page mine-page">
    <van-nav-bar title="我的飞机" />

    <section class="profile-card glass-card">
      <div class="avatar">旅</div>
      <div class="profile-info">
        <div class="profile-name">匿名旅人</div>
        <div class="profile-sub">你的纸飞机档案</div>
      </div>
      <div class="profile-chip">本地记录</div>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">{{ myPlanes.length }}</div>
        <div class="stat-label">投掷数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ totalLikes }}</div>
        <div class="stat-label">总获赞</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ totalComments }}</div>
        <div class="stat-label">总评论</div>
      </div>
    </section>

    <section class="plane-list">
      <van-loading v-if="loading" class="loading" />
      <template v-else>
        <van-empty v-if="myPlanes.length === 0" description="你还没有投掷过飞机" />
        <div
          v-for="(p, i) in myPlanes"
          :key="p.id"
          class="my-plane-card glass-card"
          :style="{ animationDelay: `${i * 40}ms` }"
          @click="$router.push(`/plane/${p.id}`)"
        >
          <div class="card-header">
            <MoodTag :mood="p.mood" />
            <span class="location">📍 {{ p.locationTag }}</span>
            <span :class="['status', isExpired(p) ? 'expired' : 'active']">
              {{ isExpired(p) ? '已降落' : '飞行中' }}
            </span>
          </div>
          <p class="content">{{ p.content }}</p>
          <div class="card-footer">
            <span>拾取 {{ p.pickCount }}</span>
            <span>点赞 {{ p.likeCount }}</span>
            <span>评论 {{ p.commentCount }}</span>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NavBar as VanNavBar, Loading as VanLoading, Empty as VanEmpty } from 'vant'
import { getMyPlanes } from '../api'
import MoodTag from '../components/MoodTag.vue'

const myPlanes = ref([])
const loading = ref(true)

const totalLikes = computed(() => myPlanes.value.reduce((s, p) => s + p.likeCount, 0))
const totalComments = computed(() => myPlanes.value.reduce((s, p) => s + p.commentCount, 0))

function isExpired(plane) {
  return new Date(plane.expireTime) < new Date()
}

function getMyPlaneIds() {
  try {
    return JSON.parse(localStorage.getItem('myPlaneIds') || '[]')
  } catch {
    return []
  }
}

onMounted(async () => {
  const ids = getMyPlaneIds()
  if (ids.length > 0) {
    const { data } = await getMyPlanes(ids)
    myPlanes.value = data
  }
  loading.value = false
})
</script>

<style scoped>
.mine-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.profile-sub {
  font-size: 12px;
  color: var(--muted);
}

.profile-chip {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(47, 158, 116, 0.12);
  color: var(--accent);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
  text-align: center;
}

[data-theme="dark"] .stat-card {
  background: rgba(18, 26, 30, 0.7);
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.plane-list {
  padding-bottom: 12px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.my-plane-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  animation: float-in 0.5s ease both;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.location {
  font-size: 12px;
  color: var(--muted);
}

.status {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status.active {
  background: rgba(47, 158, 116, 0.15);
  color: var(--accent);
}

.status.expired {
  background: rgba(242, 122, 75, 0.2);
  color: var(--accent-2);
}

.content {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}
</style>
