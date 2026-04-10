<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchStats, fetchLocations } from '@/service/api/paperplane';

const stats = ref<Api.PaperPlane.Stats>({
  totalPlanes: 0,
  activePlanes: 0,
  todayThrows: 0,
  totalLocations: 0,
  totalComments: 0
});

const locations = ref<Api.PaperPlane.Location[]>([]);
const loading = ref(true);

async function loadData() {
  loading.value = true;
  try {
    const [statsRes, locsRes] = await Promise.all([
      fetchStats(),
      fetchLocations()
    ]);
    if (statsRes.data) stats.value = statsRes.data;
    if (locsRes.data) locations.value = locsRes.data;
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

onMounted(loadData);
</script>

<template>
  <NSpace vertical :size="16">
    <NGrid :x-gap="16" :y-gap="16" cols="2 s:2 m:4" responsive="screen">
      <NGi>
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic label="总飞机数" :value="stats.totalPlanes">
            <template #prefix>
              <NIcon><span style="font-size:20px">✈️</span></NIcon>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic label="飞行中" :value="stats.activePlanes">
            <template #prefix>
              <NIcon><span style="font-size:20px">🛫</span></NIcon>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic label="今日投掷" :value="stats.todayThrows">
            <template #prefix>
              <NIcon><span style="font-size:20px">📅</span></NIcon>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic label="总评论数" :value="stats.totalComments">
            <template #prefix>
              <NIcon><span style="font-size:20px">💬</span></NIcon>
            </template>
          </NStatistic>
        </NCard>
      </NGi>
    </NGrid>

    <NCard title="各地点飞机数量" :bordered="false" class="card-wrapper">
      <NSpin :show="loading">
        <NDataTable
          :columns="locColumns"
          :data="locations"
          :pagination="false"
          size="small"
        />
      </NSpin>
    </NCard>
  </NSpace>
</template>

<script lang="ts">
const locColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '地点名称', key: 'name' },
  { title: '排序', key: 'sortOrder', width: 80 },
  { title: '飞机数量', key: 'planeCount', width: 100 }
];

export default { name: 'HomeDashboard' };
</script>

<style scoped></style>
