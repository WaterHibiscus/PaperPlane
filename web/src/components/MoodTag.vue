<template>
  <span class="mood-tag" :style="{ '--mood-color': moodColors[mood] || '#909399' }">
    <span class="mood-icon">{{ moodIcons[mood] || '✦' }}</span>
    <span>{{ moodLabels[mood] || mood }}</span>
  </span>
</template>

<script setup>
defineProps({ mood: String })

const moodLabels = {
  happy: '开心',
  sad: '难过',
  calm: '平静',
  angry: '吐槽',
  love: '心动',
}
const moodColors = {
  happy: 'var(--mood-happy)',
  sad: 'var(--mood-sad)',
  calm: 'var(--mood-calm)',
  angry: 'var(--mood-angry)',
  love: 'var(--mood-love)',
}
const moodIcons = {
  happy: '☀️',
  sad: '🌧️',
  calm: '🍃',
  angry: '🔥',
  love: '💗',
}
</script>

<style scoped>
.mood-tag {
  --mood-color: #909399;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--mood-color);
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--mood-color);
}

[data-theme=\"dark\"] .mood-tag {
  background: rgba(18, 26, 30, 0.7);
}

.mood-icon {
  font-size: 12px;
}
</style>
