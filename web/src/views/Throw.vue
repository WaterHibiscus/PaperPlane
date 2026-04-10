<template>
  <div class="throw-page page">
    <van-nav-bar title="投掷纸飞机" left-arrow @click-left="$router.back()" />

    <section class="throw-hero glass-card">
      <h1>写下你的心绪</h1>
      <p>内容最多 200 字，匿名投掷到一个地点。</p>
    </section>

    <section class="editor-card glass-card">
      <van-field
        v-model="content"
        type="textarea"
        placeholder="写下你想说的话..."
        :maxlength="200"
        show-word-limit
        rows="6"
        autosize
        class="throw-editor"
      />
    </section>

    <section class="pick-section">
      <div class="section-title">
        <h2>选择情绪</h2>
        <span>{{ moodLabel }}</span>
      </div>
      <div class="mood-grid">
        <button
          v-for="m in moodOptions"
          :key="m.value"
          :class="['mood-chip', { active: mood === m.value }]"
          @click="selectMood(m)"
        >
          <span class="mood-emoji">{{ m.icon }}</span>
          <span>{{ m.text }}</span>
        </button>
      </div>
    </section>

    <section class="pick-section">
      <div class="section-title">
        <h2>选择地点</h2>
        <span>{{ location || '请先选择' }}</span>
      </div>
      <div class="chip-scroll">
        <button
          v-for="loc in locations"
          :key="loc.id"
          :class="['chip', { active: location === loc.name }]"
          @click="location = loc.name"
        >
          {{ loc.name }}
        </button>
      </div>
    </section>

    <section class="pick-section">
      <div class="section-title">
        <h2>飞行时效</h2>
        <span>{{ expireLabel }}</span>
      </div>
      <div class="expire-row">
        <button
          v-for="opt in expireOptions"
          :key="opt.value"
          :class="['chip', { active: expireHours === opt.value }]"
          @click="selectExpire(opt)"
        >
          {{ opt.text }}
        </button>
      </div>
    </section>

    <div class="btn-area">
      <van-button
        type="primary"
        round
        block
        :loading="loading"
        :class="{ 'fly-out': flyAnim }"
        @click="handleThrow"
      >
        投掷纸飞机
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { NavBar as VanNavBar, Field as VanField, Button as VanButton } from 'vant'
import { throwPlane } from '../api'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useAppStore()
const { locations } = storeToRefs(store)

const content = ref('')
const mood = ref('calm')
const moodLabel = ref('平静')
const location = ref('')
const expireHours = ref(24)
const expireLabel = ref('24小时')
const loading = ref(false)
const flyAnim = ref(false)

const moodOptions = [
  { text: '开心', value: 'happy', icon: '☀️' },
  { text: '难过', value: 'sad', icon: '🌧️' },
  { text: '平静', value: 'calm', icon: '🍃' },
  { text: '吐槽', value: 'angry', icon: '🔥' },
  { text: '心动', value: 'love', icon: '💗' },
]

const expireOptions = [
  { text: '2小时', value: 2 },
  { text: '24小时', value: 24 },
  { text: '48小时', value: 48 },
]

onMounted(async () => {
  await store.fetchLocations()
  if (store.currentLocation) location.value = store.currentLocation
})

function selectMood(item) {
  mood.value = item.value
  moodLabel.value = item.text
}

function selectExpire(item) {
  expireHours.value = item.value
  expireLabel.value = item.text
}

function saveMyPlaneId(id) {
  try {
    const ids = JSON.parse(localStorage.getItem('myPlaneIds') || '[]')
    ids.unshift(id)
    localStorage.setItem('myPlaneIds', JSON.stringify(ids))
  } catch {
    localStorage.setItem('myPlaneIds', JSON.stringify([id]))
  }
}

async function handleThrow() {
  if (!content.value.trim()) return showFailToast('请写点什么吧')
  if (!location.value) return showFailToast('请选择地点')

  loading.value = true
  try {
    const { data } = await throwPlane({
      locationTag: location.value,
      content: content.value,
      mood: mood.value,
      expireHours: expireHours.value,
    })
    saveMyPlaneId(data.id)
    flyAnim.value = true
    setTimeout(() => {
      showSuccessToast('纸飞机已飞出！')
      router.push('/')
    }, 600)
  } catch (e) {
    showFailToast(e.response?.data?.message || '投掷失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.throw-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.throw-hero {
  padding: 18px 16px;
}

.throw-hero h1 {
  font-family: var(--font-display);
  font-size: 20px;
  margin-bottom: 6px;
}

.throw-hero p {
  font-size: 13px;
  color: var(--muted);
}

.editor-card {
  padding: 8px;
}

.throw-editor :deep(.van-field__control) {
  font-size: 14px;
  line-height: 1.7;
  background: transparent;
}

.throw-editor :deep(.van-field__word-limit) {
  color: var(--muted);
}

.pick-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.mood-chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 12px 10px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  color: var(--muted);
  transition: all 0.2s ease;
}

[data-theme="dark"] .mood-chip {
  background: rgba(18, 26, 30, 0.7);
}

.mood-chip.active {
  border-color: transparent;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  box-shadow: 0 12px 24px rgba(47, 158, 116, 0.25);
}

.mood-emoji {
  font-size: 18px;
}

.chip-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.expire-row {
  display: flex;
  gap: 10px;
}

.btn-area {
  padding: 8px 0 24px;
}

.fly-out {
  animation: flyOut 0.6s ease-in forwards;
}

@keyframes flyOut {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-200px) scale(0.5); opacity: 0; }
}
</style>
