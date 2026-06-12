<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'GlobalLogo'
});

interface Props {
  /** Whether to show the title */
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>
  <RouterLink to="/" class="global-logo">
    <div class="logo-slot">
      <SystemLogo class="logo-mark" />
    </div>
    <div v-show="showTitle" class="title-slot">
      <h2 class="logo-title">
        {{ $t('system.title') }}
      </h2>
    </div>
  </RouterLink>
</template>

<style scoped>
.global-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  padding-inline: 12px;
}

.logo-slot,
.title-slot {
  display: flex;
  align-items: center;
  min-width: 0;
}

.logo-slot {
  flex: 0 0 auto;
  justify-content: flex-start;
}

.title-slot {
  flex: 1 1 auto;
  justify-content: flex-start;
}

.logo-mark {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
}

.logo-title {
  margin: 0;
  overflow: hidden;
  color: rgb(var(--primary-color));
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition:
    color 0.3s ease,
    opacity 0.3s ease;
}
</style>
