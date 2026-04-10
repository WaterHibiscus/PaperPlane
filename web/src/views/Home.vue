<template>
  <div class="page home-page">
    <section class="hero glass-card">
      <div class="hero-top">
        <div class="brand">
          <span class="brand-mark">✈</span>
          <span class="brand-name">纸飞机降落点</span>
        </div>
        <button class="icon-btn" @click="store.toggleDark()">
          <span class="toggle-icon">{{ isDark ? '☾' : '☀' }}</span>
        </button>
      </div>

      <h1>
        <ShatterHeadline :phrases="headlinePhrases" />
      </h1>
      <p>在特定地点留下匿名回声，让某个未来的你遇见它。</p>

      <div class="hero-actions">
        <van-button round type="primary" @click="goThrow">投掷一架</van-button>
        <button class="ghost-btn" :disabled="randomLoading" @click="handleRandom">
          <van-icon name="shuffle" size="16" />
          <span>{{ randomLoading ? '正在挑选' : '随机拾取' }}</span>
        </button>
      </div>

      <div class="hero-metrics">
        <div class="metric">
          <div class="metric-num">{{ totalPlanes }}</div>
          <div class="metric-label">飞行中</div>
        </div>
        <div class="metric">
          <div class="metric-num">{{ locations.length }}</div>
          <div class="metric-label">降落点</div>
        </div>
        <div class="metric">
          <div class="metric-num">{{ trending.length }}</div>
          <div class="metric-label">热度上升</div>
        </div>
      </div>

      <div class="search-box">
        <van-icon name="search" size="16" />
        <input v-model="query" placeholder="搜索地点" />
      </div>
    </section>

    <section class="map-section">
      <div class="section-title">
        <h2>落点地图</h2>
        <span>实时脉冲</span>
      </div>
      <div class="map-shell glass-card">
        <div class="map-header">
          <div>
            <div class="map-title">校园信号</div>
            <div class="map-sub">选择一个地点启动扫描</div>
          </div>
          <div class="map-tags">
            <span class="map-tag">实时</span>
            <span class="map-tag">匿名</span>
            <span class="map-tag">校园</span>
          </div>
        </div>
        <div class="map-canvas">
          <div class="signal-orbit orbit-a"></div>
          <div class="signal-orbit orbit-b"></div>
          <div class="signal-hud">
            <span class="signal-kicker">匿名信号网</span>
            <strong class="signal-value">{{ totalPlanes }}</strong>
            <span class="signal-caption">{{ busiestLocationLabel }}</span>
          </div>
          <svg class="signal-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(47, 158, 116, 0.15)" />
                <stop offset="45%" stop-color="rgba(47, 158, 116, 0.95)" />
                <stop offset="100%" stop-color="rgba(242, 122, 75, 0.95)" />
              </linearGradient>
              <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              v-for="route in signalRoutes"
              :key="`route-base-${route.id}`"
              class="route-line"
              :d="route.path"
              :style="{
                '--route-width': route.width,
                '--route-opacity': route.opacity,
              }"
            />
            <path
              v-for="route in signalRoutes"
              :key="`route-glow-${route.id}`"
              class="route-glow"
              :d="route.path"
              :style="{
                '--route-width': route.width,
                '--route-duration': `${route.duration}s`,
                '--route-delay': `${route.delay}s`,
              }"
            />

            <g v-for="route in signalRoutes" :key="`route-packet-${route.id}`">
              <circle class="route-packet" :r="route.packetSize">
                <animateMotion
                  :dur="`${route.duration}s`"
                  :begin="`${route.delay}s`"
                  repeatCount="indefinite"
                  :path="route.path"
                />
              </circle>
              <circle class="route-packet secondary" :r="route.packetSize * 0.72">
                <animateMotion
                  :dur="`${route.duration}s`"
                  :begin="`${route.packetOffset}s`"
                  repeatCount="indefinite"
                  :path="route.path"
                />
              </circle>
            </g>
          </svg>
          <button
            v-for="(node, i) in mapNodes"
            :key="node.loc.id"
            class="map-station"
            :style="{
              '--x': `${node.x}%`,
              '--y': `${node.y}%`,
              '--halo': `${node.size}px`,
              '--delay': `${i * 0.18}s`,
              '--label-shift': node.labelShift,
            }"
            @click="goDiscover(node.loc.name)"
          >
            <span class="station-halo"></span>
            <span class="station-core">{{ icons[node.loc.name] || '📍' }}</span>
            <span class="station-label">
              <span class="station-name">{{ node.loc.name }}</span>
              <span class="station-count">{{ node.loc.planeCount }} 架</span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <section v-if="trending.length" class="trend-section">
      <div class="section-title">
        <h2>热度上升</h2>
        <span class="more" @click="router.push('/trending')">查看更多</span>
      </div>
      <div class="trend-list">
        <div
          v-for="(plane, i) in trending"
          :key="plane.id"
          class="trend-card glass-card"
          @click="router.push(`/plane/${plane.id}`)"
        >
          <div class="trend-rank">#{{ i + 1 }}</div>
          <div class="trend-content">{{ plane.content }}</div>
          <div class="trend-meta">📍 {{ plane.locationTag }} · {{ plane.likeCount }} 赞</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import { getRandomPlane, getTrendingPlanes } from '../api'
import { showFailToast } from 'vant'
import { Button as VanButton } from 'vant'
import ShatterHeadline from '../components/ShatterHeadline.vue'

const store = useAppStore()
const { locations, isDark } = storeToRefs(store)
const router = useRouter()
const randomLoading = ref(false)
const trending = ref([])
const query = ref('')
const headlinePhrases = [
  '把心绪折成纸，交给校园的风',
  '把没说出口的话，留在路过的风景',
  '让匿名的回声，刚好落进谁手里',
  '把今天的情绪，投向一个真实地点',
  '给某个陌生同学，留下一次轻回应',
]

const icons = {
  '图书馆': '📚',
  '食堂': '🍜',
  '操场': '🏃',
  '教学楼': '🏫',
  '宿舍楼': '🏠',
  '校门口': '🚪',
}

const filteredLocations = computed(() => {
  const q = query.value.trim()
  if (!q) return locations.value
  return locations.value.filter(l => l.name.includes(q))
})

const nodePresets = [
  { x: 16, y: 28, size: 70 },
  { x: 40, y: 18, size: 62 },
  { x: 70, y: 26, size: 74 },
  { x: 28, y: 64, size: 68 },
  { x: 58, y: 58, size: 80 },
  { x: 82, y: 70, size: 60 },
  { x: 12, y: 70, size: 58 },
  { x: 48, y: 76, size: 66 },
]

const mapNodes = computed(() =>
  filteredLocations.value.map((loc, i) => {
    const preset = nodePresets[i % nodePresets.length]
    const countBoost = Math.min(loc.planeCount || 0, 6) * 2
    const size = Math.min(Math.max(preset.size + countBoost, 56), 90)
    const labelShift = preset.x > 72 ? '-16px' : preset.x < 20 ? '16px' : '0px'
    return {
      loc,
      ...preset,
      size,
      labelShift,
    }
  })
)

const totalPlanes = computed(() => {
  return locations.value.reduce((sum, loc) => sum + (loc.planeCount || 0), 0)
})

const busiestLocationLabel = computed(() => {
  if (!filteredLocations.value.length) return '等待新的投递进入网络'

  const hottest = [...filteredLocations.value].sort((a, b) => (b.planeCount || 0) - (a.planeCount || 0))[0]
  if (!hottest?.planeCount) return '所有落点当前都很安静'

  return `${hottest.name} 最活跃 · ${hottest.planeCount} 架`
})

function createRoutePath(from, to, index) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  const normalX = -dy / distance
  const normalY = dx / distance
  const bend = Math.min(16, 8 + distance * 0.12) * (index % 2 === 0 ? 1 : -1)

  const c1x = from.x + dx * 0.32 + normalX * bend
  const c1y = from.y + dy * 0.18 + normalY * bend
  const c2x = from.x + dx * 0.68 + normalX * bend
  const c2y = from.y + dy * 0.82 + normalY * bend

  return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`
}

const signalRoutes = computed(() => {
  const nodes = mapNodes.value
  if (nodes.length < 2) return []

  const pairs = []
  for (let i = 0; i < nodes.length - 1; i += 1) {
    pairs.push([nodes[i], nodes[i + 1]])
  }

  if (nodes.length > 2) {
    for (let i = 0; i < nodes.length; i += 2) {
      pairs.push([nodes[i], nodes[(i + 2) % nodes.length]])
    }
  }

  const seen = new Set()

  return pairs
    .filter(([from, to]) => {
      if (!from || !to || from.loc.id === to.loc.id) return false
      const key = [from.loc.id, to.loc.id].sort((a, b) => a - b).join('-')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 7)
    .map(([from, to], index) => {
      const heat = Math.max(from.loc.planeCount || 0, to.loc.planeCount || 0)
      const width = Math.min(2.8, 1.05 + heat * 0.18)

      return {
        id: `${from.loc.id}-${to.loc.id}-${index}`,
        path: createRoutePath(from, to, index),
        width,
        opacity: Math.min(0.78, 0.28 + heat * 0.08),
        duration: 5.4 + (index % 3) * 0.9,
        delay: index * 0.65,
        packetOffset: index * 0.65 + 1.8,
        packetSize: Math.min(2.2, 1.15 + heat * 0.08),
      }
    })
})

function goDiscover(name) {
  store.currentLocation = name
  router.push('/discover')
}

function goThrow() {
  router.push('/throw')
}

async function handleRandom() {
  randomLoading.value = true
  try {
    const { data } = await getRandomPlane()
    router.push(`/plane/${data.id}`)
  } catch {
    showFailToast('暂无飞机可拾取')
  } finally {
    randomLoading.value = false
  }
}

async function loadTrending() {
  try {
    const { data } = await getTrendingPlanes()
    trending.value = data.slice(0, 3)
  } catch {
    trending.value = []
  }
}

onMounted(async () => {
  await store.fetchLocations()
  loadTrending()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  padding: 20px 18px 18px;
  position: relative;
  overflow: hidden;
  animation: float-in 0.6s ease both;
}

.hero::before {
  content: '';
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 158, 116, 0.25), transparent 60%);
  top: -90px;
  right: -70px;
  pointer-events: none;
  z-index: 0;
}

.hero > * {
  position: relative;
  z-index: 1;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(47, 158, 116, 0.15);
  font-size: 18px;
}

.brand-name {
  font-size: 18px;
  letter-spacing: 0.5px;
}

.toggle-icon {
  font-size: 18px;
  line-height: 1;
}

.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(18px, 5.8vw, 22px);
  line-height: 1.4;
  margin-bottom: 8px;
  min-height: calc(1.4em + 0.8em);
}

.hero p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  color: var(--ink);
  font-size: 13px;
}

.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

[data-theme="dark"] .ghost-btn {
  background: rgba(18, 26, 30, 0.7);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  text-align: center;
}

[data-theme="dark"] .metric {
  background: rgba(18, 26, 30, 0.7);
}

.metric-num {
  font-weight: 700;
  font-size: 18px;
  color: var(--accent);
}

.metric-label {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
}

[data-theme="dark"] .search-box {
  background: rgba(18, 26, 30, 0.7);
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--ink);
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-shell {
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.map-shell::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 18px;
  pointer-events: none;
}

.map-shell::after {
  content: '';
  position: absolute;
  inset: -40px;
  background:
    radial-gradient(circle at 20% 20%, rgba(47, 158, 116, 0.12), transparent 45%),
    radial-gradient(circle at 80% 10%, rgba(242, 122, 75, 0.12), transparent 45%),
    radial-gradient(circle at 70% 70%, rgba(255, 207, 90, 0.12), transparent 40%);
  opacity: 0.6;
  pointer-events: none;
}

[data-theme="dark"] .map-shell::after {
  background:
    radial-gradient(circle at 18% 18%, rgba(113, 135, 150, 0.08), transparent 42%),
    radial-gradient(circle at 82% 12%, rgba(138, 102, 82, 0.08), transparent 38%),
    radial-gradient(circle at 68% 78%, rgba(82, 101, 115, 0.07), transparent 40%);
  opacity: 0.42;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
}

.map-title {
  font-family: var(--font-display);
  font-size: 16px;
  margin-bottom: 4px;
}

.map-sub {
  font-size: 12px;
  color: var(--muted);
}

.map-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.map-tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--accent);
  background: rgba(47, 158, 116, 0.12);
}

[data-theme="dark"] .map-tag {
  color: #c8d1d8;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.map-canvas {
  position: relative;
  height: 320px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 20% 20%, rgba(47, 158, 116, 0.14), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(242, 122, 75, 0.14), transparent 40%),
    linear-gradient(140deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.75));
  border: 1px solid var(--border);
  overflow: hidden;
  z-index: 1;
}

[data-theme="dark"] .map-canvas {
  background:
    radial-gradient(circle at 16% 18%, rgba(92, 110, 123, 0.16), transparent 34%),
    radial-gradient(circle at 84% 22%, rgba(103, 86, 76, 0.12), transparent 30%),
    linear-gradient(145deg, rgba(12, 16, 19, 0.96), rgba(18, 22, 26, 0.92) 46%, rgba(23, 28, 33, 0.88));
  border-color: rgba(230, 237, 241, 0.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 -1px 0 rgba(255, 255, 255, 0.02);
}

.map-canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(47, 158, 116, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 158, 116, 0.08) 1px, transparent 1px);
  background-size: 46px 46px;
  opacity: 0.5;
  pointer-events: none;
}

[data-theme="dark"] .map-canvas::before {
  background-image:
    linear-gradient(rgba(226, 232, 237, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 237, 0.035) 1px, transparent 1px);
  opacity: 0.28;
}

.map-canvas::after {
  content: '';
  position: absolute;
  inset: -40px;
  background:
    radial-gradient(circle at 70% 30%, rgba(47, 158, 116, 0.18), transparent 45%),
    radial-gradient(circle at 30% 70%, rgba(255, 207, 90, 0.16), transparent 50%);
  opacity: 0.4;
  pointer-events: none;
}

[data-theme="dark"] .map-canvas::after {
  background:
    radial-gradient(circle at 72% 28%, rgba(110, 130, 142, 0.14), transparent 40%),
    radial-gradient(circle at 28% 72%, rgba(122, 98, 83, 0.12), transparent 42%);
  opacity: 0.3;
}

.signal-orbit {
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(47, 158, 116, 0.14);
  background: radial-gradient(circle, rgba(47, 158, 116, 0.08), transparent 72%);
  filter: blur(0.2px);
  pointer-events: none;
  z-index: 1;
}

[data-theme="dark"] .signal-orbit {
  border-color: rgba(230, 237, 241, 0.06);
  background: radial-gradient(circle, rgba(126, 142, 153, 0.07), transparent 72%);
}

.orbit-a {
  width: 220px;
  height: 220px;
  left: -24px;
  bottom: -108px;
  animation: orbit-drift 16s ease-in-out infinite;
}

.orbit-b {
  width: 180px;
  height: 180px;
  right: -36px;
  top: -56px;
  animation: orbit-drift 14s ease-in-out infinite reverse;
}

.signal-hud {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'kicker value'
    'caption value';
  column-gap: 12px;
  row-gap: 2px;
  min-width: 188px;
  max-width: 228px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 158, 116, 0.16);
  box-shadow: 0 12px 32px rgba(31, 36, 40, 0.1);
  backdrop-filter: blur(14px);
}

[data-theme="dark"] .signal-hud {
  background: rgba(15, 19, 23, 0.84);
  border-color: rgba(230, 237, 241, 0.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
}

.signal-kicker {
  grid-area: kicker;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.signal-value {
  grid-area: value;
  justify-self: end;
  align-self: center;
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1;
  color: var(--ink);
}

.signal-caption {
  grid-area: caption;
  font-size: 11px;
  line-height: 1.35;
  color: var(--accent);
}

.signal-network {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.route-line,
.route-glow {
  fill: none;
  stroke-linecap: round;
}

.route-line {
  stroke: rgba(47, 158, 116, 0.16);
  stroke-width: var(--route-width);
  opacity: var(--route-opacity);
}

.route-glow {
  stroke: url(#routeGradient);
  stroke-width: calc(var(--route-width) + 0.4);
  stroke-dasharray: 12 18;
  filter: url(#routeGlow);
  animation: route-flow var(--route-duration) linear infinite;
  animation-delay: var(--route-delay);
}

.route-packet {
  fill: var(--accent-3);
  opacity: 0.95;
  filter: drop-shadow(0 0 10px rgba(255, 207, 90, 0.65));
}

.route-packet.secondary {
  fill: var(--accent);
  opacity: 0.55;
  filter: drop-shadow(0 0 8px rgba(47, 158, 116, 0.5));
}

.map-station {
  position: absolute;
  left: var(--x);
  top: var(--y);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
}

.map-station:active {
  transform: translate(-50%, -50%) scale(0.96);
}

.station-halo {
  position: absolute;
  width: var(--halo);
  height: var(--halo);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 158, 116, 0.22), transparent 60%);
  opacity: 0.6;
  animation: halo-pulse 3.6s ease-in-out infinite;
  animation-delay: var(--delay);
  z-index: 0;
}

.station-core {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  box-shadow: 0 8px 18px rgba(31, 36, 40, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  z-index: 1;
  animation: core-float 3.6s ease-in-out infinite;
  animation-delay: var(--delay);
}

[data-theme="dark"] .station-core {
  background: rgba(20, 24, 29, 0.94);
  border-color: rgba(230, 237, 241, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.22);
}

.station-label {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border);
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
  box-shadow: 0 6px 14px rgba(31, 36, 40, 0.08);
  white-space: nowrap;
  transform: translateX(var(--label-shift, 0));
}

[data-theme="dark"] .station-label {
  background: rgba(16, 20, 24, 0.86);
  border-color: rgba(230, 237, 241, 0.06);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.16);
}

.station-name {
  color: var(--ink);
  white-space: nowrap;
}

.station-count {
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
}

@keyframes route-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -120; }
}

@keyframes orbit-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(0.98); opacity: 0.45; }
  50% { transform: translate3d(10px, -12px, 0) scale(1.04); opacity: 0.8; }
}

@keyframes core-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes halo-pulse {
  0%, 100% { transform: scale(0.92); opacity: 0.45; }
  50% { transform: scale(1.05); opacity: 0.75; }
}

.trend-section .more {
  color: var(--accent);
  cursor: pointer;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-card {
  padding: 12px 14px;
}

.trend-rank {
  font-size: 12px;
  color: var(--accent-2);
  font-weight: 600;
  margin-bottom: 6px;
}

.trend-content {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trend-meta {
  font-size: 12px;
  color: var(--muted);
}
</style>
