<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { getPaletteColorByNumber, mixColor } from '@sa/color';
import { loginModuleRecord } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
import ResetPwd from './modules/reset-pwd.vue';
import BindWechat from './modules/bind-wechat.vue';

interface Props {
  /** The login module */
  module?: UnionKey.LoginModule;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();

interface LoginModule {
  label: App.I18n.I18nKey;
  component: Component;
}

const moduleMap: Record<UnionKey.LoginModule, LoginModule> = {
  'pwd-login': { label: loginModuleRecord['pwd-login'], component: PwdLogin },
  'code-login': { label: loginModuleRecord['code-login'], component: CodeLogin },
  register: { label: loginModuleRecord.register, component: Register },
  'reset-pwd': { label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  'bind-wechat': { label: loginModuleRecord['bind-wechat'], component: BindWechat }
};

const activeModule = computed(() => moduleMap[props.module || 'pwd-login']);

const bgColor = computed(() => {
  const COLOR_WHITE = '#ffffff';

  const ratio = themeStore.darkMode ? 0.5 : 0.2;

  return mixColor(COLOR_WHITE, themeStore.themeColor, ratio);
});

const accentColor = computed(() =>
  themeStore.darkMode ? getPaletteColorByNumber(themeStore.themeColor, 500) : getPaletteColorByNumber(themeStore.themeColor, 400)
);
</script>

<template>
  <div class="login-page relative size-full flex-center overflow-hidden" :style="{ backgroundColor: bgColor }">
    <div class="login-backdrop">
      <div class="backdrop-orb orb-left" :style="{ backgroundColor: `${accentColor}20` }"></div>
      <div class="backdrop-orb orb-right" :style="{ backgroundColor: `${accentColor}14` }"></div>
      <div class="backdrop-grid"></div>
      <div class="brand-watermark">
        <SvgIcon local-icon="logo" />
      </div>
    </div>
    <NCard :bordered="false" class="login-card relative z-4 w-auto rd-20px">
      <div class="w-400px lt-sm:w-300px">
        <header class="flex-y-center justify-between">
          <SystemLogo class="size-44px lt-sm:size-36px" />
          <h3 class="text-28px text-primary font-500 lt-sm:text-22px">{{ $t('system.title') }}</h3>
          <div class="i-flex-col">
            <ThemeSchemaSwitch
              :theme-schema="themeStore.themeScheme"
              :show-tooltip="false"
              class="text-20px lt-sm:text-18px"
              @switch="themeStore.toggleThemeScheme"
            />
            <LangSwitch
              v-if="themeStore.header.multilingual.visible"
              :lang="appStore.locale"
              :lang-options="appStore.localeOptions"
              :show-tooltip="false"
              @change-lang="appStore.changeLocale"
            />
          </div>
        </header>
        <main class="pt-24px">
          <h3 class="text-18px text-primary font-medium">{{ $t(activeModule.label) }}</h3>
          <div class="pt-24px">
            <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
              <component :is="activeModule.component" />
            </Transition>
          </div>
        </main>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.login-page {
  isolation: isolate;
}

.login-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.backdrop-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
}

.orb-left {
  top: -12%;
  left: -8%;
  width: clamp(220px, 30vw, 420px);
  height: clamp(220px, 30vw, 420px);
}

.orb-right {
  right: -6%;
  bottom: -18%;
  width: clamp(280px, 36vw, 520px);
  height: clamp(280px, 36vw, 520px);
}

.backdrop-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.42) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.42) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(135deg, transparent 8%, rgba(0, 0, 0, 0.8) 40%, transparent 100%);
  opacity: 0.34;
}

.brand-watermark {
  position: absolute;
  right: clamp(24px, 7vw, 128px);
  bottom: clamp(24px, 6vw, 96px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(180px, 26vw, 360px);
  height: clamp(180px, 26vw, 360px);
  border-radius: 32%;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1) 38%, transparent 39%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 28px 80px rgba(55, 84, 114, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  transform: rotate(-12deg);
}

.brand-watermark :deep(svg) {
  width: 62%;
  height: 62%;
  color: rgba(255, 255, 255, 0.82);
}

.login-card {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 64px rgba(48, 72, 98, 0.16);
  backdrop-filter: blur(10px);
}

:global(.dark) .backdrop-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
}

:global(.dark) .brand-watermark {
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04) 38%, transparent 39%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

:global(.dark) .brand-watermark :deep(svg) {
  color: rgba(255, 255, 255, 0.28);
}

:global(.dark) .login-card {
  background: rgba(24, 32, 42, 0.9);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
}
</style>
