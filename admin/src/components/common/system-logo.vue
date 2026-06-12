<template>
  <div class="system-logo">
    <div class="logo-badge">
      <SvgIcon local-icon="logo" class="logo-mark" />
    </div>
  </div>
</template>

<style scoped>
.system-logo {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.logo-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 22%;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.7) 36%, transparent 37%),
    linear-gradient(145deg, rgb(var(--primary-50-color)) 0%, rgb(var(--primary-100-color)) 42%, rgb(var(--primary-200-color)) 100%);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow:
    0 8px 18px rgba(77, 103, 133, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.logo-mark {
  width: 70%;
  height: 70%;
  color: rgb(var(--primary-700-color));
}
</style>
