<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { NTag, NButton, NPopconfirm } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchReportedPlanes, deletePlane } from '@/service/api/paperplane';

const planes = ref<any[]>([]);
const loading = ref(true);

const moodMap: Record<string, string> = {
  happy: '开心', sad: '难过', calm: '平静', angry: '吐槽', love: '心动'
};

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80, ellipsis: { tooltip: true } },
  { title: '地点', key: 'locationTag', width: 80 },
  {
    title: '内容',
    key: 'content',
    ellipsis: { tooltip: true }
  },
  {
    title: '情绪',
    key: 'mood',
    width: 70,
    render(row: any) {
      return h('span', moodMap[row.mood] || row.mood);
    }
  },
  {
    title: '举报次数',
    key: 'reportCount',
    width: 90,
    render(row: any) {
      return h(NTag, {
        type: row.reportCount >= 3 ? 'error' : 'warning',
        size: 'small'
      }, () => `${row.reportCount} 次`);
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: any) {
      const expired = new Date(row.expireTime) < new Date();
      const isDown = row.reportCount >= 3 || expired;
      return h(NTag, {
        type: isDown ? 'error' : 'success',
        size: 'small'
      }, () => isDown ? '已下线' : '飞行中');
    }
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 150,
    render(row: any) {
      return new Date(row.createTime).toLocaleString('zh-CN');
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row: any) {
      return h(NPopconfirm, {
        onPositiveClick: () => handleDelete(row.id)
      }, {
        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, () => '删除'),
        default: () => '确认删除该飞机？'
      });
    }
  }
];

async function loadReported() {
  loading.value = true;
  try {
    const { data } = await fetchReportedPlanes();
    planes.value = data || [];
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

async function handleDelete(id: string) {
  await deletePlane(id);
  window.$message?.success('已删除');
  loadReported();
}

onMounted(loadReported);
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NAlert type="info" title="举报管理">
        当飞机被举报3次后会自动下线。此处展示被举报过的飞机列表。
      </NAlert>
    </NCard>
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="planes"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        :scroll-x="800"
        size="small"
        striped
      />
    </NCard>
  </NSpace>
</template>

<style scoped></style>
