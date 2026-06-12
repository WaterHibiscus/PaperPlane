<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEcharts } from '@/hooks/common/echarts';
import { useThemeStore } from '@/store/modules/theme';

defineOptions({
  name: 'LocationBarChart'
});

interface Props {
  locations: Api.PaperPlane.Location[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.darkMode);
const sortedLocations = computed(() => [...props.locations].sort((a, b) => b.planeCount - a.planeCount).slice(0, 8));
const maxCount = computed(() => sortedLocations.value[0]?.planeCount ?? 0);
const chartColors = computed(() => ({
  splitLine: isDark.value ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.2)',
  axisLabel: isDark.value ? 'rgba(177, 188, 205, 0.82)' : 'rgba(102, 117, 136, 0.88)',
  categoryLabel: isDark.value ? 'rgba(220, 229, 241, 0.88)' : 'rgba(49, 61, 77, 0.92)',
  valueLabel: isDark.value ? 'rgba(232, 239, 246, 0.9)' : 'rgba(59, 73, 90, 0.92)'
}));

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '4%',
    right: '4%',
    bottom: '6%',
    top: '16%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: chartColors.value.splitLine
      }
    },
    axisLabel: {
      color: chartColors.value.axisLabel
    }
  },
  yAxis: {
    type: 'category',
    inverse: true,
    axisTick: {
      show: false
    },
    axisLine: {
      show: false
    },
    axisLabel: {
      color: chartColors.value.categoryLabel
    },
    data: [] as string[]
  },
  series: [
    {
      name: '纸飞机数量',
      type: 'bar',
      barWidth: 14,
      data: [] as number[],
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#56d5a4' },
            { offset: 1, color: '#5c9eff' }
          ]
        }
      },
      label: {
        show: true,
        position: 'right',
        color: chartColors.value.valueLabel
      }
    }
  ]
}));

function syncChartData() {
  updateOptions(() => ({
    yAxis: {
      type: 'category',
      inverse: true,
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        color: chartColors.value.categoryLabel
      },
      data: sortedLocations.value.map(item => item.name)
    },
    xAxis: {
      type: 'value',
      max: maxCount.value > 0 ? Math.ceil(maxCount.value * 1.2) : 5,
      splitLine: {
        lineStyle: {
          color: chartColors.value.splitLine
        }
      },
      axisLabel: {
        color: chartColors.value.axisLabel
      }
    },
    series: [
      {
        name: '纸飞机数量',
        type: 'bar',
        barWidth: 14,
        data: sortedLocations.value.map(item => item.planeCount),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#56d5a4' },
              { offset: 1, color: '#5c9eff' }
            ]
          }
        },
        label: {
          show: true,
          position: 'right',
          color: chartColors.value.valueLabel
        }
      }
    ]
  }));
}

watch([sortedLocations, isDark], syncChartData, { immediate: true, deep: true });
</script>

<template>
  <NCard :bordered="false" class="panel-card h-full">
    <template #header>
      <div class="panel-header">
        <div>
          <p class="panel-kicker">地点热度</p>
          <h3 class="panel-title">地点热度 Top 8</h3>
        </div>
      </div>
    </template>

    <NSpin :show="loading">
      <NEmpty v-if="sortedLocations.length === 0" description="暂无地点数据" class="chart-area flex-center" />
      <div v-else ref="domRef" class="chart-area"></div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.panel-card {
  border: 1px solid var(--dashboard-panel-border, rgba(212, 219, 228, 0.95));
  background:
    radial-gradient(circle at 12% 12%, rgba(92, 158, 255, 0.12), transparent 36%),
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

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-area {
  height: var(--dashboard-chart-height, clamp(220px, 30vh, 300px));
}
</style>
