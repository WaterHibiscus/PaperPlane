<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'MoodPieChart'
});

interface Props {
  moods: Api.PaperPlane.MoodStatItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);
const hasData = computed(() => props.moods.some(item => item.count > 0));
const totalCount = computed(() => props.moods.reduce((sum, item) => sum + item.count, 0));
const sortedMoods = computed(() => [...props.moods].sort((a, b) => b.count - a.count).slice(0, 8));
const palette = ['#57d6a3', '#f7b267', '#67b7ff', '#ff8e8e', '#c4b5fd', '#ffd166', '#8ecae6', '#95d5b2'];
const chartColors = computed(() => ({
  label: isDark.value ? 'rgba(232, 237, 245, 0.86)' : 'rgba(78, 91, 108, 0.9)',
  line: isDark.value ? 'rgba(155, 169, 189, 0.6)' : 'rgba(162, 174, 188, 0.86)',
  border: isDark.value ? 'rgba(15, 18, 24, 0.92)' : 'rgba(248, 244, 236, 0.96)'
}));

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item',
    confine: true,
    formatter: params => {
      const item = params as { name: string; value: number; percent: number };
      return `${item.name}<br/>${item.value} 条（${item.percent}%）`;
    }
  },
  legend: {
    show: false
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '52%'],
      padAngle: 2,
      label: {
        color: chartColors.value.label,
        formatter: '{b}\n{d}%'
      },
      labelLine: {
        lineStyle: {
          color: chartColors.value.line
        }
      },
      itemStyle: {
        borderColor: chartColors.value.border,
        borderWidth: 2
      },
      data: [] as { name: string; value: number }[]
    }
  ]
}));

function syncChartData() {
  updateOptions(() => ({
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['50%', '52%'],
        padAngle: 2,
        label: {
          color: chartColors.value.label,
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          lineStyle: {
            color: chartColors.value.line
          }
        },
        itemStyle: {
          borderColor: chartColors.value.border,
          borderWidth: 2
        },
        data: sortedMoods.value.map((item, index) => ({
          name: item.mood,
          value: item.count,
          itemStyle: {
            color: palette[index % palette.length]
          }
        }))
      }
    ]
  }));
}

watch([sortedMoods, isDark], syncChartData, { immediate: true, deep: true });
</script>

<template>
  <NCard :bordered="false" class="panel-card h-full">
    <template #header>
      <div class="panel-header">
        <div>
          <p class="panel-kicker">心情雷达</p>
          <h3 class="panel-title">飞行中心情占比</h3>
        </div>
        <div class="panel-total">{{ totalCount }} 条</div>
      </div>
    </template>

    <NSpin :show="loading">
      <NEmpty v-if="!hasData" description="暂无心情数据" class="chart-area flex-center" />
      <div v-else ref="domRef" class="chart-area"></div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.panel-card {
  border: 1px solid var(--dashboard-panel-border, rgba(212, 219, 228, 0.95));
  background:
    radial-gradient(circle at 18% 8%, rgba(87, 214, 163, 0.13), transparent 34%),
    var(--dashboard-panel-bg, linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(248, 250, 252, 0.98)));
  box-shadow: var(--dashboard-panel-shadow, 0 12px 28px rgba(117, 129, 145, 0.14));
  transition: transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 220ms ease;
}

.panel-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--dashboard-panel-shadow-hover, 0 18px 34px rgba(117, 129, 145, 0.18));
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-kicker {
  margin: 0;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dashboard-text-muted, rgba(101, 115, 133, 0.82));
}

.panel-title {
  margin: 8px 0 0;
  font-size: 18px;
  line-height: 1.25;
  color: var(--dashboard-text-strong, rgba(43, 52, 66, 0.98));
}

.panel-total {
  margin-top: 2px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--dashboard-soft-border, rgba(217, 224, 233, 0.9));
  background: var(--dashboard-soft-surface, rgba(255, 255, 255, 0.68));
  font-size: 12px;
  color: var(--dashboard-text-main, rgba(76, 89, 106, 0.92));
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-area {
  height: var(--dashboard-chart-height, clamp(220px, 30vh, 300px));
}
</style>
