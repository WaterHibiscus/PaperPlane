<template>
  <div class="radar-wrapper">
    <div class="radar">
      <div class="radar-grid"></div>
      <div class="radar-sweep"></div>
      <div class="radar-center"></div>
      <div class="radar-beacon"></div>
    </div>
    <p class="radar-text">扫描附近的纸飞机...</p>
  </div>
</template>

<style scoped>
.radar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 0 20px;
}
.radar {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, rgba(47, 158, 116, 0.18), transparent 60%),
    radial-gradient(circle at center, rgba(242, 122, 75, 0.16), transparent 70%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.radar-grid {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  border: 1px dashed rgba(47, 158, 116, 0.35);
  box-shadow:
    inset 0 0 0 18px rgba(47, 158, 116, 0.08),
    inset 0 0 0 44px rgba(47, 158, 116, 0.06);
}
.radar-center {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  top: 104px;
  left: 104px;
  box-shadow: 0 0 12px rgba(47, 158, 116, 0.6);
}
.radar-beacon {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-2);
  top: 46px;
  left: 140px;
  animation: beacon 2.6s ease-in-out infinite;
}
.radar-sweep {
  position: absolute;
  width: 220px;
  height: 220px;
  top: 0;
  left: 0;
  transform-origin: 110px 110px;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(47, 158, 116, 0.25) 70deg, transparent 70deg);
  border-radius: 50%;
  animation: sweep 2.6s linear infinite;
}
@keyframes sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes beacon {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.6); opacity: 1; }
}
.radar-text {
  margin-top: 20px;
  color: var(--muted);
  font-size: 13px;
}
</style>
