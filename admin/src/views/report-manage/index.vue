<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import { NButton, NInput, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { deletePlane, fetchMoodConfigs, fetchReportedPlanes, updatePlaneOnlineStatus } from '@/service/api/paperplane';

const sourcePlanes = ref<Api.PaperPlane.ReportedPlane[]>([]);
const tablePlanes = ref<Api.PaperPlane.ReportedPlane[]>([]);
const loading = ref(false);
const moodLabelMap = ref<Record<string, string>>({});

const filters = reactive({
  keyword: '',
  location: '',
  status: '',
  reason: ''
});

const reportReasonMap: Record<string, string> = {
  spam: '垃圾广告',
  abuse: '辱骂攻击',
  sexual: '色情低俗',
  privacy: '隐私泄露',
  illegal: '违法有害',
  other: '其他原因'
};

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '已上线', value: 'online' },
  { label: '已下线', value: 'offline' }
];

const reasonOptions: SelectOption[] = [
  { label: '全部原因', value: '' },
  ...Object.entries(reportReasonMap).map(([value, label]) => ({ label, value }))
];

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN');
}

function resolveStatus(row: Api.PaperPlane.ReportedPlane) {
  if (row.isDeleted) return { type: 'error' as const, text: '已下线' };
  return { type: 'success' as const, text: '已上线' };
}

function formatReportReason(row: Api.PaperPlane.ReportedPlane) {
  const key = String(row.latestReportReason || '').trim().toLowerCase();
  if (!key) return '-';
  return reportReasonMap[key] || key;
}

function formatMoodKey(key: string) {
  const normalized = String(key || '').trim();
  if (!normalized) return '-';
  const fallback = normalized.match(/^mood[_-]?(\d+)$/i);
  if (fallback) return `情绪 ${fallback[1]}`;
  return normalized;
}

function getMoodLabel(key: string) {
  const normalized = String(key || '').trim();
  if (!normalized) return '-';
  const mapped = moodLabelMap.value[normalized.toLowerCase()];
  if (mapped && mapped.trim()) return mapped;
  return formatMoodKey(normalized);
}

function applyFilters() {
  const keyword = filters.keyword.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();

  tablePlanes.value = sourcePlanes.value.filter(row => {
    const reasonKey = String(row.latestReportReason || '').trim().toLowerCase();
    const reasonText = (reportReasonMap[reasonKey] || reasonKey || '-').toLowerCase();
    const moodText = getMoodLabel(row.mood).toLowerCase();

    if (filters.status === 'online' && row.isDeleted) return false;
    if (filters.status === 'offline' && !row.isDeleted) return false;
    if (filters.reason && reasonKey !== filters.reason) return false;
    if (location && !String(row.locationTag || '').toLowerCase().includes(location)) return false;

    if (keyword) {
      const haystack = [
        row.id,
        row.shortCode,
        row.content,
        row.locationTag,
        moodText,
        reasonText
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

function handleSearch() {
  applyFilters();
}

function handleReset() {
  filters.keyword = '';
  filters.location = '';
  filters.status = '';
  filters.reason = '';
  applyFilters();
}

async function handleToggleOnline(row: Api.PaperPlane.ReportedPlane, isOnline: boolean) {
  await updatePlaneOnlineStatus(row.id, { isOnline });
  window.$message?.success(isOnline ? '已手动上线' : '已手动下线');
  await loadReported();
}

async function handleDelete(id: string) {
  await deletePlane(id);
  window.$message?.success('已删除');
  await loadReported();
}

const columns: DataTableColumns<Api.PaperPlane.ReportedPlane> = [
  { title: 'ID', key: 'id', width: 120, ellipsis: { tooltip: true } },
  { title: '地点', key: 'locationTag', width: 100, ellipsis: { tooltip: true } },
  {
    title: '内容',
    key: 'content',
    minWidth: 260,
    ellipsis: { tooltip: true }
  },
  {
    title: '情绪',
    key: 'mood',
    width: 140,
    ellipsis: { tooltip: true },
    render(row) {
      return getMoodLabel(row.mood);
    }
  },
  {
    title: '举报次数',
    key: 'reportCount',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.reportCount >= 3 ? 'error' : 'warning',
          size: 'small'
        },
        () => `${row.reportCount} 次`
      );
    }
  },
  {
    title: '最近原因',
    key: 'latestReportReason',
    width: 130,
    ellipsis: { tooltip: true },
    render(row) {
      return formatReportReason(row);
    }
  },
  {
    title: '最近举报时间',
    key: 'latestReportedAt',
    width: 180,
    render(row) {
      return formatDateTime(row.latestReportedAt);
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render(row) {
      const status = resolveStatus(row);
      return h(
        NTag,
        {
          type: status.type,
          size: 'small'
        },
        () => status.text
      );
    }
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return formatDateTime(row.createTime);
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    fixed: 'right',
    render(row) {
      const onlineTarget = row.isDeleted;
      return h(
        NSpace,
        { size: 4, justify: 'center' },
        {
          default: () => [
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleToggleOnline(row, onlineTarget)
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: onlineTarget ? 'success' : 'warning',
                      quaternary: true
                    },
                    () => (onlineTarget ? '上线' : '下线')
                  ),
                default: () => (onlineTarget ? '确认将该纸飞机手动上线？' : '确认将该纸飞机手动下线？')
              }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id)
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'tiny',
                      type: 'error',
                      quaternary: true
                    },
                    () => '删除'
                  ),
                default: () => '确认删除这架纸飞机？'
              }
            )
          ]
        }
      );
    }
  }
];

async function loadMoodConfigs() {
  try {
    const { data } = await fetchMoodConfigs();
    const map: Record<string, string> = {};
    (data || []).forEach(item => {
      const key = String(item.key || '').trim().toLowerCase();
      const label = String(item.label || '').trim();
      if (key && label) map[key] = label;
    });
    moodLabelMap.value = map;
  } catch (error) {
    console.error(error);
    moodLabelMap.value = {};
  }
}

async function loadReported() {
  loading.value = true;
  try {
    const { data } = await fetchReportedPlanes();
    sourcePlanes.value = data || [];
    applyFilters();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadMoodConfigs(), loadReported()]);
});
</script>

<template>
  <NSpace vertical :size="12">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace :size="12" align="center" wrap>
        <NInput
          v-model:value="filters.keyword"
          placeholder="关键词：内容 / 地点 / 情绪 / 原因 / ID"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.location"
          placeholder="地点"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
        />
        <NSelect v-model:value="filters.status" :options="statusOptions" style="width: 130px" />
        <NSelect v-model:value="filters.reason" :options="reasonOptions" style="width: 140px" />
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="tablePlanes"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        :scroll-x="1660"
        size="small"
        striped
      />
    </NCard>
  </NSpace>
</template>
