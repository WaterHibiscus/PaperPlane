<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import LocationBarChart from './modules/location-bar-chart.vue';
import MoodPieChart from './modules/mood-pie-chart.vue';
import StatusDonutChart from './modules/status-donut-chart.vue';
import { fetchLocations, fetchStats } from '@/service/api/paperplane';
import { useThemeStore } from '@/store/modules/theme';

const stats = ref<Api.PaperPlane.Stats>({
  totalPlanes: 0,
  activePlanes: 0,
  todayThrows: 0,
  totalLocations: 0,
  totalComments: 0,
  activeMoodDistribution: []
});

const locations = ref<Api.PaperPlane.Location[]>([]);
const loading = ref(true);
const loadFailed = ref(false);
const themeStore = useThemeStore();

const landedPlanes = computed(() => Math.max(0, stats.value.totalPlanes - stats.value.activePlanes));
const flightRate = computed(() => {
  if (stats.value.totalPlanes <= 0) return 0;
  return Math.round((stats.value.activePlanes / stats.value.totalPlanes) * 100);
});

const topMood = computed(() => {
  if (!stats.value.activeMoodDistribution.length) return '暂无';
  return [...stats.value.activeMoodDistribution].sort((a, b) => b.count - a.count)[0]?.mood ?? '暂无';
});

const dominantMoodCount = computed(() => {
  if (!stats.value.activeMoodDistribution.length) return 0;
  return [...stats.value.activeMoodDistribution].sort((a, b) => b.count - a.count)[0]?.count ?? 0;
});

const activeIntensity = computed(() => {
  if (stats.value.activePlanes <= 0) return 0;
  return Math.min(100, Math.round((stats.value.activePlanes / Math.max(1, stats.value.totalPlanes)) * 100));
});

const metrics = computed(() => [
  {
    key: 'total',
    label: '纸飞机总量',
    value: stats.value.totalPlanes,
    unit: '架',
    tone: 'steel'
  },
  {
    key: 'active',
    label: '飞行中',
    value: stats.value.activePlanes,
    unit: '架',
    tone: 'emerald'
  },
  {
    key: 'today',
    label: '今日投递',
    value: stats.value.todayThrows,
    unit: '条',
    tone: 'amber'
  },
  {
    key: 'landed',
    label: '已落地',
    value: landedPlanes.value,
    unit: '架',
    tone: 'slate'
  },
  {
    key: 'location',
    label: '地点覆盖',
    value: stats.value.totalLocations,
    unit: '个',
    tone: 'cobalt'
  },
  {
    key: 'comment',
    label: '评论互动',
    value: stats.value.totalComments,
    unit: '条',
    tone: 'slate'
  }
]);

const updateTimeText = computed(() => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
});

async function loadData() {
  loading.value = true;
  loadFailed.value = false;
  try {
    const [statsRes, locationsRes] = await Promise.all([fetchStats(), fetchLocations()]);

    if (statsRes.error) throw statsRes.error;
    if (locationsRes.error) throw locationsRes.error;

    if (statsRes.data) {
      stats.value = {
        ...stats.value,
        ...statsRes.data,
        activeMoodDistribution: statsRes.data.activeMoodDistribution ?? []
      };
    }
    if (locationsRes.data) {
      locations.value = locationsRes.data;
    }
  } catch (error) {
    console.error(error);
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <section :class="['dashboard-shell', { 'dashboard-shell-dark': themeStore.darkMode }]">
    <div class="noise-layer"></div>
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <div class="dashboard-grid">
      <section class="left-column">
        <NCard :bordered="false" class="hero-card panel-card">
          <div class="hero-topline">
            <p class="hero-kicker">PaperPlane Control Matrix</p>
            <span class="hero-chip">Live</span>
          </div>

          <h2 class="hero-title">校园纸飞机态势中枢</h2>
          <p class="hero-desc">聚焦飞行中纸飞机心情结构与地点热度，用更高密度视图判断当前传播势能。</p>

          <div class="hero-meter">
            <div class="meter-head">
              <span>飞行强度</span>
              <span>{{ activeIntensity }}%</span>
            </div>
            <NProgress
              type="line"
              :show-indicator="false"
              :percentage="activeIntensity"
              :height="8"
              rail-color="rgba(122, 138, 166, 0.24)"
              color="linear-gradient(90deg, #56d5a4 0%, #60a5fa 100%)"
            />
          </div>

          <div class="hero-meta">
            <span>更新时间 {{ updateTimeText }}</span>
            <span>主导心情 {{ topMood }}（{{ dominantMoodCount }}）</span>
          </div>

          <NButton size="small" class="refresh-btn" :loading="loading" secondary @click="loadData">
            刷新数据
          </NButton>
        </NCard>

        <NCard :bordered="false" class="metric-wrapper panel-card">
          <div class="metric-grid">
            <article
              v-for="(item, index) in metrics"
              :key="item.key"
              :class="['metric-card', `tone-${item.tone}`]"
              :style="{ '--card-index': index }"
            >
              <p class="metric-label">{{ item.label }}</p>
              <p class="metric-value">
                {{ item.value }}
                <span class="metric-unit">{{ item.unit }}</span>
              </p>
            </article>
          </div>
        </NCard>

      </section>

      <section class="middle-column">
        <MoodPieChart :moods="stats.activeMoodDistribution" :loading="loading" />
      </section>

      <section class="right-column">
        <StatusDonutChart :stats="stats" :loading="loading" />

        <NCard :bordered="false" class="insight-card panel-card">
          <p class="insight-kicker">Strategic Snapshot</p>

          <div class="insight-item">
            <span class="insight-label">飞行率</span>
            <span class="insight-value">{{ flightRate }}%</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">覆盖地点</span>
            <span class="insight-value">{{ stats.totalLocations }} 个</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">评论总量</span>
            <span class="insight-value">{{ stats.totalComments }} 条</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">主导心情</span>
            <span class="insight-value">{{ topMood }}</span>
          </div>

          <NAlert v-if="loadFailed" type="error" title="数据加载失败，请重试" class="mt-12px" />
        </NCard>
      </section>

      <section class="location-row">
        <LocationBarChart :locations="locations" :loading="loading" />
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-shell {
  position: relative;
  flex: none;
  width: 100%;
  min-height: auto;
  --dashboard-chart-height: clamp(220px, 30vh, 300px);
  --dashboard-shell-border: rgba(209, 215, 224, 0.92);
  --dashboard-shell-bg:
    radial-gradient(circle at 12% 0%, rgba(250, 204, 145, 0.24), transparent 32%),
    radial-gradient(circle at 88% 10%, rgba(129, 183, 255, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(250, 246, 239, 0.98), rgba(244, 248, 252, 0.98) 54%, rgba(242, 246, 250, 0.98));
  --dashboard-noise-color: rgba(124, 133, 145, 0.18);
  --dashboard-glow-a: rgba(249, 190, 118, 0.24);
  --dashboard-glow-b: rgba(120, 170, 250, 0.22);
  --dashboard-panel-border: rgba(212, 219, 228, 0.95);
  --dashboard-panel-border-strong: rgba(183, 194, 208, 0.96);
  --dashboard-panel-bg: linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(248, 250, 252, 0.98));
  --dashboard-panel-shadow: 0 12px 28px rgba(117, 129, 145, 0.14);
  --dashboard-panel-shadow-hover: 0 18px 34px rgba(117, 129, 145, 0.18);
  --dashboard-text-strong: rgba(43, 52, 66, 0.98);
  --dashboard-text-main: rgba(76, 89, 106, 0.92);
  --dashboard-text-muted: rgba(101, 115, 133, 0.82);
  --dashboard-soft-surface: rgba(255, 255, 255, 0.68);
  --dashboard-soft-border: rgba(217, 224, 233, 0.9);
  --dashboard-hero-bg:
    linear-gradient(135deg, rgba(255, 224, 184, 0.34), transparent 42%),
    linear-gradient(180deg, rgba(255, 251, 245, 0.98), rgba(248, 250, 252, 0.98));
  --dashboard-metric-bg: linear-gradient(180deg, rgba(255, 252, 248, 0.98), rgba(247, 249, 251, 0.98));
  --dashboard-insight-bg:
    radial-gradient(circle at 100% 0%, rgba(252, 211, 153, 0.22), transparent 40%),
    linear-gradient(180deg, rgba(255, 251, 245, 0.97), rgba(247, 249, 252, 0.98));
  padding: clamp(14px, 2.3vw, 24px);
  border-radius: 20px;
  border: 1px solid var(--dashboard-shell-border);
  background: var(--dashboard-shell-bg);
  color: var(--dashboard-text-strong);
  overflow: hidden;
}

.noise-layer {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(var(--dashboard-noise-color) 0.6px, transparent 0.6px),
    radial-gradient(var(--dashboard-noise-color) 0.4px, transparent 0.4px);
  background-size: 4px 4px, 7px 7px;
  opacity: 0.22;
  pointer-events: none;
}

.glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(26px);
  pointer-events: none;
}

.glow-a {
  width: 220px;
  height: 220px;
  top: -62px;
  left: -52px;
  background: var(--dashboard-glow-a);
}

.glow-b {
  width: 250px;
  height: 250px;
  right: -72px;
  bottom: -70px;
  background: var(--dashboard-glow-b);
}

.dashboard-grid {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 16px;
  grid-template-columns: 1.4fr 1fr 0.95fr;
  align-items: start;
}

.left-column,
.middle-column,
.right-column,
.location-row {
  display: grid;
  gap: 16px;
  opacity: 0;
  transform: translateY(14px);
  animation: section-in 760ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

.left-column {
  animation-delay: 20ms;
}

.middle-column {
  animation-delay: 120ms;
}

.right-column {
  animation-delay: 200ms;
}

.location-row {
  grid-column: 1 / -1;
  animation-delay: 260ms;
}

.panel-card {
  position: relative;
  isolation: isolate;
  border: 1px solid var(--dashboard-panel-border);
  background: var(--dashboard-panel-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    var(--dashboard-panel-shadow);
  will-change: transform;
  transition:
    transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1),
    border-color 220ms ease,
    box-shadow 220ms ease,
    background-color 220ms ease;
}

.panel-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.34);
  transition: border-color 220ms ease, opacity 220ms ease;
  opacity: 0.8;
}

.panel-card:hover {
  border-color: var(--dashboard-panel-border-strong);
  transform: translateY(-4px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    var(--dashboard-panel-shadow-hover);
}

.panel-card:hover::before {
  border-color: rgba(255, 255, 255, 0.52);
  opacity: 1;
}

.hero-card {
  background: var(--dashboard-hero-bg);
  overflow: hidden;
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: -120% auto auto -35%;
  width: 52%;
  height: 260%;
  transform: rotate(18deg);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.42) 48%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  transition: transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.hero-card:hover::after {
  transform: translateX(18px) rotate(18deg);
}

.hero-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hero-kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dashboard-text-muted);
}

.hero-chip {
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid rgba(86, 213, 164, 0.3);
  background: rgba(86, 213, 164, 0.14);
  color: rgba(43, 122, 92, 0.92);
  font-size: 11px;
  line-height: 1;
  transition: background-color 220ms ease, border-color 220ms ease, color 220ms ease;
  animation: chip-breathe 2.8s ease-in-out infinite;
}

.hero-card:hover .hero-chip {
  border-color: rgba(86, 213, 164, 0.42);
  background: rgba(86, 213, 164, 0.18);
  color: rgba(31, 98, 73, 0.96);
}

.hero-title {
  margin: 12px 0 0;
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.1;
  color: var(--dashboard-text-strong);
}

.hero-desc {
  margin: 12px 0 0;
  color: var(--dashboard-text-main);
  line-height: 1.65;
}

.hero-meter {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--dashboard-soft-border);
  background: var(--dashboard-soft-surface);
}

.meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 12px;
  color: var(--dashboard-text-main);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 12px;
  color: var(--dashboard-text-muted);
  font-size: 12px;
}

.refresh-btn {
  margin-top: 12px;
  transition: transform 180ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.refresh-btn:hover {
  transform: translateY(-1px);
}

.metric-wrapper {
  background: var(--dashboard-metric-bg);
}

.metric-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric-card {
  border-radius: 12px;
  padding: 13px 13px 12px;
  border: 1px solid var(--dashboard-soft-border);
  background: rgba(255, 255, 255, 0.58);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
  opacity: 0;
  transform: translateY(10px);
  animation: metric-in 520ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  animation-delay: calc(120ms + var(--card-index, 0) * 48ms);
}

.metric-card:hover {
  transform: translateY(-3px);
  border-color: rgba(181, 193, 207, 0.92);
  background: rgba(255, 255, 255, 0.76);
}

.metric-label {
  margin: 0;
  font-size: 12px;
  color: var(--dashboard-text-muted);
}

.metric-value {
  margin: 7px 0 0;
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 700;
  line-height: 1.2;
  color: var(--dashboard-text-strong);
}

.metric-unit {
  margin-left: 4px;
  font-size: 12px;
  color: var(--dashboard-text-muted);
}

.tone-steel {
  border-color: rgba(187, 197, 211, 0.92);
}

.tone-emerald {
  border-color: rgba(86, 213, 164, 0.34);
  background: linear-gradient(130deg, rgba(86, 213, 164, 0.16), rgba(255, 255, 255, 0.62));
}

.tone-amber {
  border-color: rgba(247, 178, 103, 0.34);
  background: linear-gradient(130deg, rgba(247, 178, 103, 0.14), rgba(255, 255, 255, 0.62));
}

.tone-slate {
  border-color: rgba(187, 197, 211, 0.92);
}

.tone-cobalt {
  border-color: rgba(96, 165, 250, 0.34);
  background: linear-gradient(130deg, rgba(96, 165, 250, 0.14), rgba(255, 255, 255, 0.62));
}

.insight-card {
  background: var(--dashboard-insight-bg);
}

.insight-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dashboard-text-muted);
}

.insight-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--dashboard-soft-border);
}

.insight-item:last-of-type {
  border-bottom: none;
}

.insight-label {
  color: var(--dashboard-text-main);
}

.insight-value {
  color: var(--dashboard-text-strong);
  font-weight: 650;
}

.dashboard-shell-dark {
  --dashboard-shell-border: rgba(255, 255, 255, 0.08);
  --dashboard-shell-bg:
    radial-gradient(circle at 14% 0%, rgba(86, 213, 164, 0.16), transparent 32%),
    radial-gradient(circle at 88% 10%, rgba(96, 165, 250, 0.18), transparent 36%),
    linear-gradient(145deg, #0d1118, #090d14 54%, #0c1118);
  --dashboard-noise-color: rgba(255, 255, 255, 0.08);
  --dashboard-glow-a: rgba(86, 213, 164, 0.23);
  --dashboard-glow-b: rgba(96, 165, 250, 0.22);
  --dashboard-panel-border: rgba(255, 255, 255, 0.08);
  --dashboard-panel-border-strong: rgba(159, 176, 201, 0.34);
  --dashboard-panel-bg: linear-gradient(155deg, rgba(19, 24, 34, 0.95), rgba(12, 16, 23, 0.97));
  --dashboard-panel-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
  --dashboard-panel-shadow-hover: 0 26px 42px rgba(0, 0, 0, 0.38);
  --dashboard-text-strong: rgba(242, 246, 252, 0.98);
  --dashboard-text-main: rgba(195, 208, 227, 0.88);
  --dashboard-text-muted: rgba(159, 176, 201, 0.86);
  --dashboard-soft-surface: rgba(255, 255, 255, 0.03);
  --dashboard-soft-border: rgba(255, 255, 255, 0.08);
  --dashboard-hero-bg:
    linear-gradient(125deg, rgba(96, 165, 250, 0.18), transparent 40%),
    linear-gradient(165deg, rgba(16, 21, 31, 0.96), rgba(13, 17, 24, 0.98));
  --dashboard-metric-bg: linear-gradient(165deg, rgba(21, 26, 35, 0.96), rgba(12, 16, 23, 0.98));
  --dashboard-insight-bg:
    radial-gradient(circle at 100% 0%, rgba(247, 178, 103, 0.14), transparent 40%),
    linear-gradient(160deg, rgba(20, 25, 34, 0.96), rgba(13, 17, 24, 0.98));
}

@keyframes section-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes metric-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes chip-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(86, 213, 164, 0.12);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(86, 213, 164, 0);
  }
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }

  .middle-column {
    grid-column: auto;
  }
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .middle-column,
  .right-column,
  .location-row {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 760px) {
  .dashboard-shell {
    --dashboard-chart-height: clamp(200px, 36vh, 250px);
    padding: 12px;
    border-radius: 14px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-height: 860px) and (min-width: 1101px) {
  .dashboard-shell {
    --dashboard-chart-height: clamp(190px, 26vh, 250px);
  }

  .dashboard-grid,
  .left-column,
  .middle-column,
  .right-column {
    gap: 12px;
  }
}

@media (max-height: 760px) and (min-width: 1101px) {
  .dashboard-shell {
    --dashboard-chart-height: clamp(170px, 22vh, 220px);
    padding: 12px;
  }

  .hero-title {
    font-size: clamp(20px, 2vw, 28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .left-column,
  .middle-column,
  .right-column,
  .location-row,
  .metric-card {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
