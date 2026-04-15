<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { NButton, NEllipsis, NPopconfirm, NPopover, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, SelectOption, TagProps } from 'naive-ui';
import PlaneEditModal from './components/PlaneEditModal.vue';
import {
  deleteComment,
  deletePlane,
  fetchAdminPlanes,
  fetchExpireOptions,
  fetchMoodConfigs,
  fetchPlaneAttitudes,
  fetchPlaneComments
} from '@/service/api/paperplane';

type MoodKey = 'happy' | 'sad' | 'calm' | 'angry' | 'love';

interface PreviewMoodMeta {
  label: string;
  color: string;
  iconUrl: string;
  emoji: string;
}

const labels = {
  archive: '纸飞机',
  detail: '详情',
  dropPoint: '降落点',
  signalNote: '纸条编号',
  pick: '拾取',
  like: '点赞',
  comment: '回声',
  report: '举报',
  archiveStatus: '已归档',
  archiveNote: '这张纸条已经落地，但内容仍然可以查看。',
  echoTitle: '匿名回声',
  echoDesc: '善语结善缘，恶语伤人心',
  emptyTitle: '这里还没有回声',
  emptyDesc: '如果你愿意，可以留下第一句。',
  voteTitle: '大家的态度',
  barcodeTitle: '纸条二维码',
  barcodeNote: '扫描二维码后可直接打开这张纸条',
  barcodeLoadFailed: '二维码加载失败，请稍后重试',
  barcodeIdLabel: '纸条编号',
  tapToCopy: '点击复制编号',
  composerTitle: '写评论',
  composerNote: '后台仅作用户端详情预览，不在这里实际发送。'
} as const;

const fallbackMoodOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '开心', value: 'happy' },
  { label: '难过', value: 'sad' },
  { label: '平静', value: 'calm' },
  { label: '愤怒', value: 'angry' },
  { label: '心动', value: 'love' }
];

const moodLabelMap: Record<MoodKey, string> = {
  happy: '开心',
  sad: '难过',
  calm: '平静',
  angry: '愤怒',
  love: '心动'
};

const moodTagTypeMap: Record<MoodKey, NonNullable<TagProps['type']>> = {
  happy: 'success',
  sad: 'info',
  calm: 'default',
  angry: 'warning',
  love: 'error'
};

const previewMoodFallbackMap: Record<MoodKey, PreviewMoodMeta> = {
  happy: { label: '开心', color: '#ff7b7b', iconUrl: '', emoji: '☼' },
  sad: { label: '难过', color: '#6aa7ff', iconUrl: '', emoji: '☁' },
  calm: { label: '平静', color: '#36b37e', iconUrl: '', emoji: '◌' },
  angry: { label: '愤怒', color: '#ff9f1c', iconUrl: '', emoji: '▲' },
  love: { label: '心动', color: '#ff6fb1', iconUrl: '', emoji: '♥' }
};

const attitudeIcons = ['◌', '✦', '⚡', '↗'];

const planes = ref<Api.PaperPlane.Plane[]>([]);
const loading = ref(false);
const commentLoading = ref(false);
const barcodeVisible = ref(false);
const barcodeImageFailed = ref(false);
const attitudeExpanded = ref(false);
const selectedPlane = ref<Api.PaperPlane.Plane | null>(null);
const planeComments = ref<Api.PaperPlane.Comment[]>([]);
const moodConfigs = ref<Api.PaperPlane.MoodConfig[]>([]);
const expireOptions = ref<Api.PaperPlane.ExpireOptionConfig[]>([]);
const workspaceRef = ref<HTMLElement | null>(null);
const detailPanelTop = ref(132);
const attitudeSummary = ref<Api.PaperPlane.PlaneAttitudeSummary>({
  options: [],
  myChoice: null,
  totalCount: 0
});
const createTimeRange = ref<[number, number] | null>(null);
const galleryActiveIndex = ref(0);
const editModalVisible = ref(false);
const editingPlane = ref<Api.PaperPlane.Plane | null>(null);
const tableMaxHeight = ref(520);

const filters = reactive({
  id: '',
  keyword: '',
  location: '',
  mood: ''
});

const moodOptions = computed<SelectOption[]>(() => {
  const dynamicOptions = moodConfigs.value
    .filter(item => item.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(item => ({
      label: item.label,
      value: item.key
    }));

  if (dynamicOptions.length) {
    return [{ label: '全部', value: '' }, ...dynamicOptions];
  }

  return fallbackMoodOptions;
});

const selectedMoodMeta = computed<PreviewMoodMeta>(() => {
  const plane = selectedPlane.value;
  if (!plane) {
    return { label: '未知', color: '#8fb3c9', iconUrl: '', emoji: '✦' };
  }

  const fallback = previewMoodFallbackMap[plane.mood as MoodKey] || {
    label: plane.mood || '未知',
    color: '#8fb3c9',
    iconUrl: '',
    emoji: '✦'
  };
  const config = moodConfigs.value.find(item => item.key === plane.mood);

  return {
    label: config?.label || fallback.label,
    color: config?.color || fallback.color,
    iconUrl: config?.iconUrl ? normalizeAssetUrl(config.iconUrl) : fallback.iconUrl,
    emoji: fallback.emoji
  };
});

const detailStyle = computed(() => ({
  '--preview-accent': selectedMoodMeta.value.color,
  '--preview-accent-soft': hexToRgba(selectedMoodMeta.value.color, 0.11),
  '--preview-accent-line': hexToRgba(selectedMoodMeta.value.color, 0.22)
}));

const planeAuthorText = computed(() => {
  const plane = selectedPlane.value;
  if (!plane) return '';
  if (plane.isAnonymous !== false) return '匿名投掷';
  return plane.authorName || '实名发布';
});

const planeTimeText = computed(() => formatPreviewDate(selectedPlane.value?.createTime || null));
const expireText = computed(() => formatPreviewDate(selectedPlane.value?.expireTime || null));
const isArchivedPlane = computed(() => {
  const expireTime = selectedPlane.value?.expireTime;
  return expireTime ? new Date(expireTime).getTime() <= Date.now() : false;
});
const shortId = computed(() => {
  const plane = selectedPlane.value;
  if (!plane) return '--';
  return String(plane.shortCode || '').trim().toUpperCase() || plane.id.slice(0, 8).toUpperCase();
});
const planeIdText = computed(() => {
  const plane = selectedPlane.value;
  if (!plane) return '';
  return String(plane.shortCode || '').trim().toUpperCase() || plane.id.toUpperCase();
});
const planeQrCodeUrl = computed(() =>
  selectedPlane.value ? `${getServiceBaseUrl()}/api/planes/${selectedPlane.value.id}/qrcode.png` : ''
);
const planeImageUrls = computed(() =>
  (selectedPlane.value?.imageUrls || []).map(item => normalizeAssetUrl(item)).filter(Boolean)
);
const hasVote = computed(() => Boolean(selectedPlane.value?.voteOptions?.length));
const voteTitleText = computed(() => selectedPlane.value?.voteTitle || labels.voteTitle);
const attitudeItems = computed(() => {
  const options = selectedPlane.value?.voteOptions || [];
  const total = attitudeSummary.value.totalCount || 0;

  return options.map((option, index) => {
    const count = attitudeSummary.value.options.find(item => item.optionKey === option)?.count || 0;
    return {
      key: option,
      label: option,
      icon: attitudeIcons[index % attitudeIcons.length],
      count,
      percent: total ? Math.max(Math.round((count / total) * 100), count > 0 ? 8 : 0) : 0
    };
  });
});

function getMoodLabel(mood: string) {
  const normalized = String(mood || '').trim();
  if (!normalized) return '-';

  const configLabel = moodConfigs.value.find(item => item.key === normalized)?.label;
  if (configLabel) return configLabel;

  return moodLabelMap[normalized as MoodKey] ?? normalized;
}

function getMoodTagType(mood: string): NonNullable<TagProps['type']> {
  return moodTagTypeMap[mood as MoodKey] ?? 'default';
}

function normalizeSingleLineText(value: string | null | undefined) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clonePlane(plane: Api.PaperPlane.Plane) {
  return {
    ...plane,
    imageUrls: plane.imageUrls ? [...plane.imageUrls] : null,
    voteOptions: plane.voteOptions ? [...plane.voteOptions] : null
  };
}

function getShortPlaneId(id: string) {
  const dashIndex = id.indexOf('-');
  return dashIndex === -1 ? id : `${id.slice(0, dashIndex + 1)}...`;
}

function getServiceBaseUrl() {
  const rawBase = import.meta.env.VITE_SERVICE_BASE_URL || 'http://localhost:5000';
  return rawBase.replace(/\/api\/?$/, '');
}

function normalizeAssetUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = getServiceBaseUrl();
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

function hexToRgba(hex: string, alpha: number) {
  const value = String(hex || '#8fb3c9').replace('#', '');
  const normalized = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function formatPreviewDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

function formatCommentTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
}

async function copyText(value: string, successMessage = '已复制到剪贴板') {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    window.$message?.success(successMessage);
  } catch (error) {
    console.error(error);
    window.$message?.error('复制失败');
  }
}

function getCssPxValue(element: HTMLElement, cssVarName: string) {
  const raw = getComputedStyle(element).getPropertyValue(cssVarName).trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function updateDetailPanelTop() {
  const workspaceEl = workspaceRef.value;
  if (!workspaceEl) return;

  const headerHeight = getCssPxValue(workspaceEl, '--soy-header-height');
  const tabHeight = getCssPxValue(workspaceEl, '--soy-tab-height');
  const baseTop = headerHeight + tabHeight + 28;
  const workspaceTop = workspaceEl.getBoundingClientRect().top;

  detailPanelTop.value = Math.max(baseTop, Math.round(workspaceTop));
}

function updateTableMaxHeight() {
  const workspaceEl = workspaceRef.value;
  if (!workspaceEl) return;

  const footerHeight = getCssPxValue(workspaceEl, '--soy-footer-height');
  const bottomSafeGap = (footerHeight > 0 ? footerHeight : 48) + 144;
  const available = Math.floor(window.innerHeight - workspaceEl.getBoundingClientRect().top - bottomSafeGap);
  tableMaxHeight.value = Math.max(320, available);
}

function updateViewportMetrics() {
  updateDetailPanelTop();
  updateTableMaxHeight();
}

function buildParams() {
  const id = filters.id.trim();
  const keyword = filters.keyword.trim();
  const location = filters.location.trim();

  return {
    id: id || undefined,
    keyword: keyword || undefined,
    location: location || undefined,
    mood: filters.mood || undefined,
    createTimeStart: createTimeRange.value ? new Date(createTimeRange.value[0]).toISOString() : undefined,
    createTimeEnd: createTimeRange.value ? new Date(createTimeRange.value[1]).toISOString() : undefined
  };
}

const columns = computed<DataTableColumns<Api.PaperPlane.Plane>>(() => [
  {
    title: '飞机 ID',
    key: 'id',
    width: 118,
    fixed: 'left',
    render(row) {
      return h(
        NPopover,
        { trigger: 'hover', placement: 'top-start' },
        {
          trigger: () => h('div', { class: 'plane-id-cell' }, [h('span', { class: 'plane-id-text' }, getShortPlaneId(row.id))]),
          default: () =>
            h(
              'button',
              {
                class: 'plane-id-popover',
                type: 'button',
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  void copyText(row.id, '飞机 ID 已复制');
                }
              },
              [h('span', { class: 'plane-id-popover-label' }, '点击复制完整 ID'), h('span', { class: 'plane-id-popover-value' }, row.id)]
            )
        }
      );
    }
  },
  {
    title: '地点',
    key: 'locationTag',
    width: 74,
    fixed: 'left',
    ellipsis: { tooltip: true },
    render(row) {
      return h('div', { class: 'plane-location-cell', title: row.locationTag || '-' }, row.locationTag || '-');
    }
  },
  {
    title: '内容',
    key: 'content',
    width: 160,
    render(row) {
      const content = normalizeSingleLineText(row.content);
      return h('div', { class: 'plane-content-clip', title: content || '-' }, [
        h(NEllipsis, { class: 'plane-content-ellipsis', tooltip: true }, { default: () => content || '-' })
      ]);
    }
  },
  {
    title: '情绪',
    key: 'mood',
    width: 80,
    render(row) {
      return h(NTag, { type: getMoodTagType(row.mood), size: 'small' }, () => getMoodLabel(row.mood));
    }
  },
  {
    title: '投递方式',
    key: 'isAnonymous',
    width: 92,
    render(row) {
      return h(NTag, { type: row.isAnonymous ? 'default' : 'info', size: 'small' }, () => (row.isAnonymous ? '匿名' : '实名'));
    }
  },
  { title: '拾取', key: 'pickCount', width: 68 },
  { title: '点赞', key: 'likeCount', width: 68 },
  { title: '评论', key: 'commentCount', width: 68 },
  {
    title: '举报',
    key: 'reportCount',
    width: 68,
    render(row) {
      return row.reportCount > 0
        ? h(NTag, { type: row.reportCount >= 3 ? 'error' : 'warning', size: 'small' }, () => row.reportCount)
        : '0';
    }
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 158,
    render(row) {
      return formatTime(row.createTime);
    }
  },
  {
    title: '过期时间',
    key: 'expireTime',
    width: 158,
    render(row) {
      const expired = new Date(row.expireTime).getTime() < Date.now();
      return h('span', { style: expired ? 'color: #999' : '' }, formatTime(row.expireTime));
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 152,
    fixed: 'right',
    render(row) {
      return h(NSpace, { size: 4 }, () => [
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            quaternary: true,
            onClick: () => {
              void openDetailPreview(row);
            }
          },
          () => '查看详情'
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDeletePlane(row.id) },
          {
            trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, () => '删除'),
            default: () => '确认删除这架纸飞机吗？'
          }
        )
      ]);
    }
  }
]);

async function loadPlanes() {
  loading.value = true;
  try {
    const { data, error } = await fetchAdminPlanes(buildParams());
    if (error) throw error;

    planes.value = data ?? [];
    if (selectedPlane.value) {
      selectedPlane.value = planes.value.find(item => item.id === selectedPlane.value?.id) || null;
    }
  } catch (error) {
    console.error(error);
    window.$message?.error('加载纸飞机列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadMoodConfigOptions() {
  try {
    const { data, error } = await fetchMoodConfigs();
    if (error) throw error;
    moodConfigs.value = data ?? [];
  } catch (error) {
    console.error(error);
  }
}

async function loadExpireOptionConfigs() {
  try {
    const { data, error } = await fetchExpireOptions();
    if (error) throw error;
    expireOptions.value = data ?? [];
  } catch (error) {
    console.error(error);
  }
}

async function loadPlaneComments(planeId?: string) {
  if (!planeId) {
    planeComments.value = [];
    return;
  }

  commentLoading.value = true;
  try {
    const { data, error } = await fetchPlaneComments(planeId);
    if (error) throw error;
    planeComments.value = data ?? [];
  } catch (error) {
    console.error(error);
    window.$message?.error('加载评论失败');
  } finally {
    commentLoading.value = false;
  }
}

async function loadPlaneAttitudeSummary(plane: Api.PaperPlane.Plane | null) {
  if (!plane?.voteOptions?.length) {
    attitudeSummary.value = { options: [], myChoice: null, totalCount: 0 };
    return;
  }

  try {
    const { data, error } = await fetchPlaneAttitudes(plane.id, 'admin-preview');
    if (error) throw error;
    attitudeSummary.value = data ?? { options: [], myChoice: null, totalCount: 0 };
  } catch (error) {
    console.error(error);
    attitudeSummary.value = { options: [], myChoice: null, totalCount: 0 };
  }
}

async function openDetailPreview(plane: Api.PaperPlane.Plane) {
  selectedPlane.value = plane;
  barcodeVisible.value = false;
  barcodeImageFailed.value = false;
  attitudeExpanded.value = false;
  galleryActiveIndex.value = 0;
  await nextTick();
  updateViewportMetrics();
  await Promise.all([loadPlaneComments(plane.id), loadPlaneAttitudeSummary(plane)]);
}

function closeDetailPreview() {
  selectedPlane.value = null;
  planeComments.value = [];
  attitudeSummary.value = { options: [], myChoice: null, totalCount: 0 };
  barcodeVisible.value = false;
  barcodeImageFailed.value = false;
}

function handleSearch() {
  void loadPlanes();
}

function handleReset() {
  filters.id = '';
  filters.keyword = '';
  filters.location = '';
  filters.mood = '';
  createTimeRange.value = null;
  void loadPlanes();
}

async function handleDeletePlane(id: string) {
  try {
    const { error } = await deletePlane(id);
    if (error) throw error;
    if (selectedPlane.value?.id === id) {
      closeDetailPreview();
    }
    window.$message?.success('删除成功');
    await loadPlanes();
  } catch (error) {
    console.error(error);
    window.$message?.error('删除失败');
  }
}

async function handleDeleteComment(commentId: string) {
  try {
    const { error } = await deleteComment(commentId);
    if (error) throw error;
    window.$message?.success('评论删除成功');
    await Promise.all([loadPlanes(), loadPlaneComments(selectedPlane.value?.id)]);
  } catch (error) {
    console.error(error);
    window.$message?.error('评论删除失败');
  }
}

function handlePreviewEdit() {
  if (!selectedPlane.value) return;
  editingPlane.value = clonePlane(selectedPlane.value);
  editModalVisible.value = true;
}

function handleEditModalShowChange(value: boolean) {
  editModalVisible.value = value;
  if (!value) {
    editingPlane.value = null;
  }
}

async function handlePlaneSaved(updatedPlane: Api.PaperPlane.Plane) {
  const planeId = updatedPlane.id;
  const previewingSamePlane = selectedPlane.value?.id === planeId;

  await loadPlanes();

  if (previewingSamePlane) {
    const refreshedPlane = planes.value.find(item => item.id === planeId) || clonePlane(updatedPlane);
    selectedPlane.value = refreshedPlane;
    galleryActiveIndex.value = 0;
    barcodeImageFailed.value = false;

    if (!refreshedPlane.voteOptions?.length) {
      attitudeExpanded.value = false;
    }

    await Promise.all([loadPlaneComments(planeId), loadPlaneAttitudeSummary(refreshedPlane)]);
  }

  window.$message?.success('修改成功');
}

onMounted(() => {
  updateViewportMetrics();
  window.addEventListener('resize', updateViewportMetrics);
  void Promise.all([loadPlanes(), loadMoodConfigOptions(), loadExpireOptionConfigs()]);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportMetrics);
});
</script>

<template>
  <div class="plane-manage-page">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace align="center" :size="12" wrap>
        <NInput v-model:value="filters.id" placeholder="输入飞机 ID 精确查询" clearable style="width: 190px" @keyup.enter="handleSearch" />
        <NInput
          v-model:value="filters.keyword"
          placeholder="输入内容/作者/地点关键词"
          clearable
          style="width: 210px"
          @keyup.enter="handleSearch"
        />
        <NInput v-model:value="filters.location" placeholder="按地点筛选" clearable style="width: 130px" @keyup.enter="handleSearch" />
        <NSelect v-model:value="filters.mood" :options="moodOptions" style="width: 130px" />
        <NDatePicker
          v-model:value="createTimeRange"
          type="datetimerange"
          clearable
          style="width: 320px"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </NSpace>
    </NCard>

    <div ref="workspaceRef" class="plane-workspace">
      <NCard :bordered="false" class="card-wrapper table-card">
        <NDataTable
          :columns="columns"
          :data="planes"
          :loading="loading"
          :pagination="{ pageSize: 20 }"
          :scroll-x="1320"
          :max-height="tableMaxHeight"
          size="small"
          striped
        />
      </NCard>

      <div v-if="selectedPlane" class="detail-panel">
        <NCard :bordered="false" class="card-wrapper detail-panel-card" :style="{ top: `${detailPanelTop}px` }">
          <div class="phone-stage" :style="detailStyle">
            <div class="preview-side-rail">
              <button class="preview-side-edit" type="button" @click="handlePreviewEdit">修改</button>
            </div>
            <div class="phone-frame">
              <div class="phone-notch"></div>
              <div class="phone-screen">
                <div class="phone-content-scale">
                  <div class="phone-nav">
                    <button class="phone-nav-btn" type="button" @click="closeDetailPreview">✕</button>
                  <div class="phone-nav-copy">
                    <span class="phone-nav-title">{{ labels.archive }} · {{ labels.detail }}</span>
                  </div>
                    <button class="phone-nav-btn" type="button" @click="barcodeVisible = true">QR</button>
                  </div>

                  <div class="phone-scroll">
                    <div class="preview-head">
                      <span class="preview-kicker">{{ labels.dropPoint }}</span>
                      <h2 class="preview-location">{{ selectedPlane.locationTag }}</h2>
                      <div class="preview-meta-row">
                        <div class="preview-meta-item preview-meta-mood">
                          <img v-if="selectedMoodMeta.iconUrl" class="preview-mood-icon" :src="selectedMoodMeta.iconUrl" :alt="selectedMoodMeta.label" />
                          <span v-else class="preview-mood-emoji">{{ selectedMoodMeta.emoji }}</span>
                          <span>{{ selectedMoodMeta.label }}</span>
                        </div>
                        <span class="preview-meta-item">{{ planeAuthorText }}</span>
                        <span class="preview-meta-item">{{ planeTimeText }}</span>
                        <span class="preview-meta-item">{{ expireText }}</span>
                      </div>
                    </div>

                    <section class="preview-note-section">
                      <span class="preview-note-id">{{ labels.signalNote }} #{{ shortId }}</span>
                      <p class="preview-note-body">{{ selectedPlane.content }}</p>
                    </section>

                    <section v-if="planeImageUrls.length" class="preview-gallery-section">
                      <div class="preview-gallery-main">
                        <img class="preview-gallery-main-image" :src="planeImageUrls[galleryActiveIndex]" :alt="`${selectedPlane.locationTag} 图片`" />
                        <div class="preview-gallery-badge">{{ galleryActiveIndex + 1 }}/{{ planeImageUrls.length }}</div>
                      </div>

                      <div v-if="planeImageUrls.length > 1" class="preview-gallery-track">
                        <button
                          v-for="(image, index) in planeImageUrls"
                          :key="`${image}-${index}`"
                          :class="['preview-gallery-thumb', galleryActiveIndex === index ? 'active' : '']"
                          type="button"
                          @click="galleryActiveIndex = index"
                        >
                          <img class="preview-gallery-thumb-image" :src="image" :alt="`缩略图 ${index + 1}`" />
                        </button>
                      </div>
                    </section>

                    <section class="preview-stats-row">
                      <div class="preview-stat-item"><span class="preview-stat-value">{{ selectedPlane.pickCount }}</span><span class="preview-stat-label">{{ labels.pick }}</span></div>
                      <div class="preview-stat-item"><span class="preview-stat-value">{{ selectedPlane.likeCount }}</span><span class="preview-stat-label">{{ labels.like }}</span></div>
                      <div class="preview-stat-item"><span class="preview-stat-value">{{ planeComments.length }}</span><span class="preview-stat-label">{{ labels.comment }}</span></div>
                    </section>

                    <div v-if="!isArchivedPlane" class="preview-report-row"><span class="preview-report-link">{{ labels.report }}</span></div>

                    <section v-if="hasVote" class="preview-vote-section">
                      <button class="preview-vote-head" type="button" @click="attitudeExpanded = !attitudeExpanded">
                        <div class="preview-vote-copy">
                          <span class="preview-vote-title">{{ voteTitleText }}</span>
                          <span class="preview-vote-note">点一下，看看大家更想表达什么。</span>
                        </div>
                        <span class="preview-vote-toggle">{{ attitudeExpanded ? '收起' : '展开' }}</span>
                      </button>

                      <div v-if="attitudeExpanded" class="preview-vote-list">
                        <div v-for="item in attitudeItems" :key="item.key" class="preview-vote-item">
                          <div class="preview-vote-top">
                            <span class="preview-vote-icon">{{ item.icon }}</span>
                            <span class="preview-vote-name">{{ item.label }}</span>
                            <span class="preview-vote-count">{{ item.count }}</span>
                          </div>
                          <div class="preview-vote-bar"><div class="preview-vote-fill" :style="{ width: `${item.percent}%` }"></div></div>
                        </div>
                      </div>
                    </section>

                    <section class="preview-comments-section">
                      <div class="preview-comments-head">
                        <div>
                          <span class="preview-comments-title">{{ labels.echoTitle }}</span>
                          <span class="preview-comments-note">{{ labels.echoDesc }}</span>
                        </div>
                        <span class="preview-comments-count">{{ planeComments.length }} 条</span>
                      </div>

                      <div v-if="commentLoading" class="preview-comments-empty">正在加载评论...</div>
                      <div v-else-if="!planeComments.length" class="preview-comments-empty">
                        <span class="preview-empty-title">{{ labels.emptyTitle }}</span>
                        <span class="preview-empty-desc">{{ labels.emptyDesc }}</span>
                      </div>
                      <div v-else class="preview-comment-list">
                        <div v-for="comment in planeComments" :key="comment.id" class="preview-comment-card">
                          <div class="preview-comment-meta">
                            <span class="preview-comment-name">{{ comment.nickName }}</span>
                            <span class="preview-comment-time">{{ formatCommentTime(comment.createTime) }}</span>
                          </div>
                          <div v-if="comment.replyToNickName" class="preview-comment-replyto">回复 {{ comment.replyToNickName }}</div>
                          <p class="preview-comment-text">{{ comment.reply }}</p>
                          <div class="preview-comment-actions">
                            <NPopconfirm @positive-click="handleDeleteComment(comment.id)">
                              <template #trigger>
                                <NButton size="tiny" type="error" quaternary>删除评论</NButton>
                              </template>
                              确认删除这条评论吗？
                            </NPopconfirm>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div :class="['phone-overlay', barcodeVisible ? 'visible' : '']" @click="barcodeVisible = false"></div>

                  <div v-if="barcodeVisible" class="preview-barcode-sheet">
                    <div class="preview-sheet-head">
                      <span class="preview-sheet-title">{{ labels.barcodeTitle }}</span>
                      <button class="preview-sheet-close" type="button" @click="barcodeVisible = false">关闭</button>
                    </div>
                    <img
                      v-if="planeQrCodeUrl && !barcodeImageFailed"
                      class="preview-barcode-image"
                      :src="planeQrCodeUrl"
                      alt="纸条二维码"
                      @error="barcodeImageFailed = true"
                    />
                    <div v-else class="preview-barcode-fallback">{{ labels.barcodeLoadFailed }}</div>
                    <p class="preview-barcode-note">{{ labels.barcodeNote }}</p>
                    <button class="preview-barcode-card" type="button" @click="copyText(planeIdText)">
                      <span class="preview-barcode-label">{{ labels.barcodeIdLabel }}</span>
                      <span class="preview-barcode-value">{{ planeIdText }}</span>
                      <span class="preview-barcode-copy">{{ labels.tapToCopy }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </div>
    </div>

    <PlaneEditModal
      :show="editModalVisible"
      :plane="editingPlane"
      :mood-configs="moodConfigs"
      :expire-options="expireOptions"
      @update:show="handleEditModalShowChange"
      @saved="handlePlaneSaved"
    />
  </div>
</template>

<style scoped>
.plane-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - var(--soy-header-height, 56px) - var(--soy-tab-height, 44px) - var(--soy-footer-height, 48px) - 32px);
  min-height: 0;
  overflow: hidden;
}

.plane-id-cell,
.plane-location-cell,
.plane-content-clip {
  display: block;
  min-width: 0;
}

.plane-id-text,
.plane-location-cell,
.plane-content-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #24384d;
}

.plane-id-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 280px;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.plane-id-popover-label {
  font-size: 12px;
  color: #6f879b;
}

.plane-id-popover-value {
  line-height: 1.5;
  color: #24384d;
  word-break: break-all;
}

.plane-content-clip {
  height: 22px;
  line-height: 22px;
  overflow: hidden;
}

.plane-workspace {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 0;
}

.table-card {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-card :deep(.n-card__content) {
  min-height: 0;
}

.table-card :deep(.n-data-table-tr) {
  height: 44px;
}

.table-card :deep(.n-data-table-td) {
  vertical-align: middle;
}

.table-card :deep(.n-data-table-td[data-col-key='content'] > .cell) {
  overflow: hidden;
}

.detail-panel {
  width: 320px;
  flex: 0 0 320px;
  padding: 0 !important;
}

.detail-panel-card {
  --n-color: transparent !important;
  --n-color-modal: transparent !important;
  --n-color-embedded: transparent !important;
  --n-border-color: transparent !important;
  --n-box-shadow: none !important;
  --n-box-shadow-popover: none !important;
  position: fixed;
  top: calc(var(--soy-header-height) + var(--soy-tab-height) + 28px);
  right: 24px;
  width: 320px;
  z-index: 4;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible;
}

.detail-panel-card :deep(.n-card__content) {
  padding: 0 !important;
  background: transparent !important;
}

.phone-stage {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
}

.preview-side-rail {
  display: flex;
  align-items: stretch;
  flex: 0 0 22px;
}

.preview-side-edit {
  width: 22px;
  max-height: 100%;
  border: none;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(238, 228, 213, 0.98), rgba(226, 214, 198, 0.94));
  color: #6b5542;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  line-height: 1.2;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  box-shadow: inset -1px 0 0 rgba(36, 56, 77, 0.06);
  margin: 0 10px;
}

.phone-frame {
  position: relative;
  width: min(100%, 232px);
  padding: 6px;
  border-radius: 24px;
  background: linear-gradient(180deg, #0f1316, #1b2025);
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.24);
}

.phone-notch {
  position: absolute;
  left: 50%;
  top: 8px;
  width: 68px;
  height: 13px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.06);
  z-index: 4;
}

.phone-screen {
  --preview-content-scale: 1;
  --preview-screen-height: 404px;
  position: relative;
  overflow: hidden;
  min-height: var(--preview-screen-height);
  border-radius: 16px;
  background:
    radial-gradient(circle at 0 0, var(--preview-accent-soft), transparent 26%),
    linear-gradient(180deg, #f7f2e9, #fffcf7);
}

.phone-content-scale {
  position: relative;
  width: calc(100% / var(--preview-content-scale));
  min-height: calc(var(--preview-screen-height) / var(--preview-content-scale));
  transform: scale(var(--preview-content-scale));
  transform-origin: top left;
}

.phone-nav {
  position: absolute;
  inset: 0 0 auto;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 9px 7px;
  background: rgba(247, 242, 233, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(36, 56, 77, 0.08);
}

.phone-nav-btn {
  width: 22px;
  height: 22px;
  border: 1px solid rgba(36, 56, 77, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #24384d;
  font-size: 9px;
  font-weight: 700;
}

.phone-nav-copy {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.preview-kicker,
.preview-note-id {
  font-size: 7px;
  letter-spacing: 0.28em;
  color: #6f879b;
}

.phone-nav-title {
  display: block;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  color: #24384d;
}

.phone-scroll {
  max-height: var(--preview-screen-height);
  overflow-y: auto;
  padding: 42px 11px 14px;
}

.preview-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-location {
  margin: 0;
  font-size: 18px;
  line-height: 1.05;
  font-weight: 700;
  color: #24384d;
}

.preview-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  padding-top: 7px;
  border-top: 1px solid rgba(36, 56, 77, 0.1);
}

.preview-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  color: #6f879b;
}

.preview-meta-mood {
  color: var(--preview-accent);
  font-weight: 600;
}

.preview-mood-icon {
  width: 13px;
  height: 13px;
  display: block;
  object-fit: contain;
}

.preview-vote-section,
.preview-comment-card {
  margin-top: 12px;
  padding: 10px 11px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(36, 56, 77, 0.08);
}

.preview-archive-note,
.preview-vote-note,
.preview-comments-note,
.preview-empty-desc,
.preview-comment-replyto {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.55;
  color: #6f879b;
}

.preview-note-section {
  margin-top: 14px;
  padding-left: 10px;
  border-left: 3px solid var(--preview-accent);
}

.preview-note-body {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #24384d;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-gallery-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.preview-gallery-main {
  position: relative;
  height: 176px;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.66);
}

.preview-gallery-main-image,
.preview-gallery-thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-gallery-badge {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 20, 22, 0.56);
  font-size: 9px;
  color: rgba(255, 255, 255, 0.96);
}

.preview-gallery-track {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.preview-gallery-thumb {
  width: 54px;
  height: 54px;
  padding: 2px;
  border: 1px solid rgba(36, 56, 77, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.64);
  flex: 0 0 auto;
}

.preview-gallery-thumb.active {
  border-color: var(--preview-accent);
  background: var(--preview-accent-soft);
}

.preview-stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 12px;
  padding: 10px 0 8px;
  border-top: 1px solid rgba(36, 56, 77, 0.1);
  border-bottom: 1px solid rgba(36, 56, 77, 0.1);
}

.preview-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #24384d;
}

.preview-stat-label,
.preview-report-link,
.preview-comments-count,
.preview-comment-time {
  font-size: 8px;
  color: #6f879b;
}

.preview-report-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.preview-vote-head,
.preview-comment-actions,
.preview-barcode-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-vote-head {
  width: 100%;
  padding: 0;
  background: transparent;
  text-align: left;
}

.preview-vote-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.preview-vote-title,
.preview-comments-title {
  font-size: 11px;
  font-weight: 700;
  color: #24384d;
}

.preview-vote-toggle {
  font-size: 8px;
  color: #6f879b;
}

.preview-vote-list,
.preview-comment-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 8px;
}

.preview-vote-item {
  padding: 8px 9px;
  border-radius: 11px;
  background: #fff;
}

.preview-vote-top,
.preview-comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.preview-vote-icon,
.preview-vote-name,
.preview-vote-count,
.preview-comment-name {
  color: #24384d;
}

.preview-vote-icon {
  font-size: 13px;
}

.preview-vote-name,
.preview-comment-name {
  font-size: 9px;
  font-weight: 700;
}

.preview-vote-count {
  font-size: 9px;
  font-weight: 700;
}

.preview-vote-bar {
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(36, 56, 77, 0.08);
}

.preview-vote-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--preview-accent), rgba(47, 158, 116, 0.72));
}

.preview-comments-section {
  margin-top: 12px;
}

.preview-comments-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.preview-comments-empty {
  padding: 14px 0 4px;
  text-align: center;
}

.preview-empty-title {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #24384d;
}

.preview-comment-card {
  margin-top: 0;
  box-shadow: 0 12px 24px rgba(148, 163, 184, 0.12);
}

.preview-comment-text {
  margin: 8px 0 0;
  color: #263c51;
  font-size: 10px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.phone-overlay {
  position: absolute;
  inset: 0;
  z-index: 9;
  opacity: 0;
  pointer-events: none;
  background: rgba(15, 20, 22, 0.34);
  transition: opacity 0.2s ease;
}

.phone-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.preview-barcode-sheet {
  position: absolute;
  inset: auto 14px 14px;
  z-index: 10;
  padding: 10px;
  border-radius: 16px;
  background: rgba(247, 242, 233, 0.98);
  border: 1px solid rgba(36, 56, 77, 0.08);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
}

.preview-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-sheet-title {
  font-size: 11px;
  font-weight: 700;
  color: #24384d;
}

.preview-sheet-close {
  background: transparent;
  font-size: 8px;
  color: #6f879b;
}

.preview-barcode-image,
.preview-barcode-fallback {
  width: 150px;
  height: 150px;
  max-width: 100%;
  border-radius: 16px;
  background: #fff;
  margin: 0 auto;
}

.preview-barcode-image {
  display: block;
  object-fit: contain;
}

.preview-barcode-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  font-size: 9px;
  color: #6f879b;
}

.preview-barcode-note {
  margin: 8px 0 0;
  font-size: 8px;
  line-height: 1.6;
  color: #6f879b;
  text-align: center;
}

.preview-barcode-card {
  width: 100%;
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(36, 56, 77, 0.08);
  text-align: left;
}

.preview-barcode-label {
  display: block;
  font-size: 8px;
  color: #6f879b;
}

.preview-barcode-value {
  display: block;
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #24384d;
  word-break: break-all;
}

.preview-barcode-copy {
  display: block;
  margin-top: 6px;
  font-size: 8px;
  color: var(--preview-accent);
}

@media (max-width: 1360px) {
  .plane-workspace {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
    flex-basis: auto;
  }

  .detail-panel-card {
    position: static;
    width: auto;
    overflow: hidden;
  }

  .detail-panel-card :deep(.n-card__content) {
    padding: 0;
  }

  .phone-stage {
    justify-content: center;
  }

  .phone-frame {
    width: min(100%, 256px);
  }
}
</style>
