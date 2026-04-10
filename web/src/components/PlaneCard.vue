<template>
  <div class="plane-card glass-card" @click="$emit('click')">
    <div class="card-header">
      <div class="header-left">
        <slot name="rank" />
        <MoodTag :mood="plane.mood" />
        <span class="location">📍 {{ plane.locationTag }}</span>
      </div>
      <span class="time">{{ timeAgo(plane.createTime) }}</span>
    </div>
    <p class="content">{{ plane.content }}</p>
    <div class="card-footer">
      <span>拾取 {{ plane.pickCount }}</span>
      <span>点赞 {{ plane.likeCount }}</span>
      <span>评论 {{ plane.commentCount }}</span>
      <span v-if="countdown" class="countdown">{{ countdown }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MoodTag from './MoodTag.vue'

const props = defineProps({ plane: Object })
defineEmits(['click'])

const countdown = ref('')
let timer = null

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

function updateCountdown() {
  const remaining = new Date(props.plane.expireTime).getTime() - Date.now()
  if (remaining <= 0) {
    countdown.value = '已降落'
    if (timer) clearInterval(timer)
    return
  }
  const hours = Math.floor(remaining / 3600000)
  const mins = Math.floor((remaining % 3600000) / 60000)
  countdown.value = `${hours}h ${mins}m`
}

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.plane-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  animation: float-in 0.45s ease both;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.time {
  font-size: 12px;
  color: var(--muted);
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
.countdown {
  margin-left: auto;
  color: var(--accent);
  font-weight: 500;
}
.location {
  font-size: 12px;
  color: var(--muted);
}
</style>
