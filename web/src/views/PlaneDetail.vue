<template>
  <div class="detail-page page">
    <van-nav-bar title="拆开纸飞机" left-arrow @click-left="$router.back()" />

    <div v-if="plane" class="detail-shell" :style="{ '--mood-color': moodTone }">
      <div v-if="!showContent" class="unfold-card glass-card" @click="showContent = true">
        <div class="unfold-icon">✈️</div>
        <div class="unfold-text">点击拆开</div>
        <div class="unfold-sub">纸张会在你指尖展开</div>
      </div>

      <template v-else>
        <section class="paper-card">
          <div class="paper-header">
            <MoodTag :mood="plane.mood" />
            <div class="paper-meta">📍 {{ plane.locationTag }} · {{ formatTime(plane.createTime) }}</div>
          </div>
          <p class="paper-text">{{ plane.content }}</p>
          <div class="paper-stats">
            <span>拾取 {{ plane.pickCount }}</span>
            <span>点赞 {{ plane.likeCount }}</span>
            <span>评论 {{ plane.commentCount }}</span>
            <span class="expire">{{ remainingText }}</span>
          </div>
        </section>

        <div class="emoji-bar">
          <button
            v-for="e in emojis"
            :key="e"
            class="emoji-btn"
            @click="quickComment(e)"
          >{{ e }}</button>
        </div>

        <div class="actions">
          <button class="action-pill" @click="handleLike">👍 点赞续航</button>
          <button class="action-pill ghost" @click="handleReport">🚩 举报</button>
          <button class="action-pill ghost" @click="handleShare">📎 分享</button>
        </div>

        <div class="comments-section">
          <div class="section-title">
            <h2>匿名评论</h2>
            <span>{{ comments.length }} 条</span>
          </div>
          <div v-for="c in comments" :key="c.id" class="comment-item glass-card">
            <div class="comment-nick">{{ c.nickName }}</div>
            <div class="comment-text">{{ c.reply }}</div>
            <div class="comment-time">{{ formatTime(c.createTime) }}</div>
          </div>
          <van-empty v-if="comments.length === 0" description="暂无评论" image="search" />
        </div>

        <div class="comment-input">
          <van-field v-model="reply" placeholder="写一条匿名评论..." :maxlength="200">
            <template #button>
              <van-button size="small" type="primary" @click="handleComment">发送</van-button>
            </template>
          </van-field>
        </div>
      </template>
    </div>
    <van-loading v-else class="loading" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { showSuccessToast, showFailToast, showToast } from 'vant'
import { NavBar as VanNavBar, Button as VanButton, Field as VanField, Loading as VanLoading, Empty as VanEmpty } from 'vant'
import { getPlaneDetail, likePlane, reportPlane, getComments, addComment } from '../api'
import MoodTag from '../components/MoodTag.vue'

const route = useRoute()
const plane = ref(null)
const comments = ref([])
const reply = ref('')
const showContent = ref(false)
const remainingText = ref('')
let timer = null

const emojis = ['👍', '❤️', '😂', '😢', '🔥', '💪', '🎉', '😮', '🤔', '👏']

const moodColors = {
  happy: 'var(--mood-happy)',
  sad: 'var(--mood-sad)',
  calm: 'var(--mood-calm)',
  angry: 'var(--mood-angry)',
  love: 'var(--mood-love)',
}

const moodTone = computed(() => {
  if (!plane.value) return 'var(--accent)'
  return moodColors[plane.value.mood] || 'var(--accent)'
})

function updateRemaining() {
  if (!plane.value?.expireTime) return
  const remaining = new Date(plane.value.expireTime).getTime() - Date.now()
  if (remaining <= 0) {
    remainingText.value = '已降落'
    return
  }
  const hours = Math.floor(remaining / 3600000)
  const mins = Math.floor((remaining % 3600000) / 60000)
  remainingText.value = `剩余 ${hours}h ${mins}m`
}

async function load() {
  const { data } = await getPlaneDetail(route.params.id)
  plane.value = data
  const res = await getComments(route.params.id)
  comments.value = res.data
  updateRemaining()
  if (timer) clearInterval(timer)
  timer = setInterval(updateRemaining, 60000)
}

async function handleLike() {
  const { data } = await likePlane(route.params.id)
  plane.value.likeCount = data.likeCount
  plane.value.expireTime = data.expireTime
  updateRemaining()
  showSuccessToast('续航成功！')
}

async function handleReport() {
  await reportPlane(route.params.id)
  showSuccessToast('举报已收到')
}

async function quickComment(emoji) {
  try {
    const { data } = await addComment(route.params.id, emoji)
    comments.value.push(data)
  } catch {
    showFailToast('发送失败')
  }
}

async function handleComment() {
  if (!reply.value.trim()) return
  try {
    const { data } = await addComment(route.params.id, reply.value)
    comments.value.push(data)
    reply.value = ''
  } catch (e) {
    showFailToast(e.response?.data?.message || '发送失败')
  }
}

async function handleShare() {
  if (!plane.value) return
  const text = `✈️ 纸飞机降落点\n📍 ${plane.value.locationTag}\n\n${plane.value.content}`
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制到剪贴板')
  } catch {
    showToast('复制失败')
  }
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(load)

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.detail-page {
  padding-bottom: 80px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unfold-card {
  padding: 40px 16px;
  text-align: center;
  border: 2px dashed rgba(47, 158, 116, 0.35);
  animation: float-in 0.6s ease both;
}

.unfold-icon {
  font-size: 56px;
  margin-bottom: 10px;
  animation: float 2.2s ease-in-out infinite;
}

.unfold-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.unfold-sub {
  font-size: 12px;
  color: var(--muted);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.paper-card {
  padding: 18px;
  border-radius: var(--radius-lg);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .paper-card {
  background: linear-gradient(150deg, rgba(20, 28, 32, 0.95), rgba(20, 28, 32, 0.8));
}

.paper-card::after {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, var(--mood-color), transparent 70%);
  opacity: 0.18;
  right: -60px;
  top: -80px;
}

.paper-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.paper-meta {
  font-size: 12px;
  color: var(--muted);
}

.paper-text {
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 14px;
  word-break: break-all;
}

.paper-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}

.paper-stats .expire {
  color: var(--accent);
  font-weight: 600;
}

.emoji-bar {
  display: flex;
  gap: 8px;
  padding: 0 4px;
  overflow-x: auto;
}

.emoji-btn {
  font-size: 20px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
}

[data-theme="dark"] .emoji-btn {
  background: rgba(18, 26, 30, 0.7);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-pill {
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 12px 24px rgba(47, 158, 116, 0.28);
}

.action-pill.ghost {
  background: rgba(255, 255, 255, 0.8);
  color: var(--ink);
  border: 1px solid var(--border);
  box-shadow: none;
}

[data-theme="dark"] .action-pill.ghost {
  background: rgba(18, 26, 30, 0.7);
  color: var(--ink);
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 80px;
}

.comment-item {
  padding: 12px 14px;
}

.comment-nick {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
}

.comment-time {
  font-size: 11px;
  color: var(--muted);
  margin-top: 6px;
}

.comment-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(14px);
}

[data-theme="dark"] .comment-input {
  background: rgba(18, 26, 30, 0.92);
}
</style>
