<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'StatusDonutChart'
});

interface Props {
  stats: Api.PaperPlane.Stats;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);
const active = computed(() => Math.max(0, props.stats.activePlanes));
const landed = computed(() => Math.max(0, props.stats.totalPlanes - props.stats.activePlanes));
const activeRate = computed(() => {
  if (props.stats.totalPlanes <= 0) return 0;
  return Math.round((active.value / props.stats.totalPlanes) * 100);
});
const chartData = computed(() => [
  { name: '飞行中', value: active.value, color: '#56d5a4' },
  { name: '已落地', value: landed.value, color: '#f7b267' }
]);
const chartColors = computed(() => ({
  legend: isDark.value ? 'rgba(205, 215, 229, 0.82)' : 'rgba(95, 109, 127, 0.88)',
  label: isDark.value ? 'rgba(231, 238, 247, 0.9)' : 'rgba(78, 91, 108, 0.92)',
  line: isDark.value ? 'rgba(152, 166, 186, 0.62)' : 'rgba(162, 174, 188, 0.86)',
  border: isDark.value ? 'rgba(15, 18, 24, 0.92)' : 'rgba(248, 244, 236, 0.96)'
}));

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: '2%',
    textStyle: {
      color: chartColors.value.legend
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '80%'],
      center: ['50%', '44%'],
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
    legend: {
      bottom: '2%',
      textStyle: {
        color: chartColors.value.legend
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '80%'],
        center: ['50%', '44%'],
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
        data: chartData.value.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color
          }
        }))
      }
    ]
  }));
}

watch([chartData, isDark], syncChartData, { immediate: true, deep: true });
</script>

<template>
  <NCard :bordered="false" class="panel-card h-full">
    <template #header>
      <div class="panel-header">
        <div>
          <p class="panel-kicker">飞行状态</p>
          <h3 class="panel-title">纸飞机状态占比</h3>
        </div>
        <div class="panel-total">飞行率 {{ activeRate }}%</div>
      </div>
    </template>

    <NSpin :show="loading">
      <div ref="domRef" class="chart-area"></div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.panel-card {
  border: 1px solid var(--dashboard-panel-border, rgba(212, 219, 228, 0.95));
  background:
    radial-gradient(circle at 82% 0%, rgba(247, 178, 103, 0.16), transparent 34%),
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

.chart-area {
  height: var(--dashboard-chart-height, clamp(220px, 30vh, 300px));
}
</style>
