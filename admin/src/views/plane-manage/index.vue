<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, SelectOption, TagProps } from 'naive-ui';
import { deleteComment, deletePlane, fetchAdminPlanes, fetchPlaneComments } from '@/service/api/paperplane';

type MoodKey = 'happy' | 'sad' | 'calm' | 'angry' | 'love';

const planes = ref<Api.PaperPlane.Plane[]>([]);
const loading = ref(false);
const commentLoading = ref(false);
const commentPanelVisible = ref(false);
const selectedPlane = ref<Api.PaperPlane.Plane | null>(null);
const planeComments = ref<Api.PaperPlane.Comment[]>([]);
const createTimeRange = ref<[number, number] | null>(null);

const filters = reactive({
  id: '',
  keyword: '',
  location: '',
  mood: ''
});

const moodOptions: SelectOption[] = [
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

const moodToneMap: Record<MoodKey, string> = {
  happy: '#f5b971',
  sad: '#83a6d8',
  calm: '#86b8a8',
  angry: '#e87d6c',
  love: '#df8fab'
};

const selectedMoodTone = computed(() => {
  if (!selectedPlane.value) {
    return '#8fb3c9';
  }

  return moodToneMap[selectedPlane.value.mood as MoodKey] ?? '#8fb3c9';
});

const columns = computed<DataTableColumns<Api.PaperPlane.Plane>>(() => [
  { title: '飞机 ID', key: 'id', width: 220, ellipsis: { tooltip: true } },
  { title: '地点', key: 'locationTag', width: 110 },
  {
    title: '内容',
    key: 'content',
    minWidth: 260,
    ellipsis: { tooltip: true }
  },
  {
    title: '情绪',
    key: 'mood',
    width: 90,
    render(row) {
      return h(NTag, { type: getMoodTagType(row.mood), size: 'small' }, () => getMoodLabel(row.mood));
    }
  },
  {
    title: '投递方式',
    key: 'isAnonymous',
    width: 100,
    render(row) {
      return h(NTag, { type: row.isAnonymous ? 'default' : 'info', size: 'small' }, () =>
        row.isAnonymous ? '匿名' : '实名'
      );
    }
  },
  { title: '拾取', key: 'pickCount', width: 80 },
  { title: '点赞', key: 'likeCount', width: 80 },
  { title: '评论', key: 'commentCount', width: 80 },
  {
    title: '举报',
    key: 'reportCount',
    width: 80,
    render(row) {
      if (row.reportCount > 0) {
        return h(NTag, { type: row.reportCount >= 3 ? 'error' : 'warning', size: 'small' }, () => row.reportCount);
      }

      return '0';
    }
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 170,
    render(row) {
      return formatTime(row.createTime);
    }
  },
  {
    title: '过期时间',
    key: 'expireTime',
    width: 170,
    render(row) {
      const expired = new Date(row.expireTime).getTime() < Date.now();
      return h('span', { style: expired ? 'color: #999' : '' }, formatTime(row.expireTime));
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row) {
      return h(NSpace, { size: 4 }, () => [
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            quaternary: true,
            onClick: () => {
              void openCommentPanel(row);
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

function getMoodLabel(mood: string) {
  return moodLabelMap[mood as MoodKey] ?? mood;
}

function getMoodTagType(mood: string): NonNullable<TagProps['type']> {
  return moodTagTypeMap[mood as MoodKey] ?? 'default';
}

function formatTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN');
}

function formatShortTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getRemainText(expireTime: string | null) {
  if (!expireTime) {
    return '未知';
  }

  const remaining = new Date(expireTime).getTime() - Date.now();
  if (remaining <= 0) {
    return '已降落';
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `剩余 ${hours}h ${minutes}m`;
}

function buildPlaneParams() {
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

function closeCommentPanel() {
  commentPanelVisible.value = false;
}

function syncSelectedPlane(nextPlanes: Api.PaperPlane.Plane[]) {
  if (!selectedPlane.value) {
    return;
  }

  const matchedPlane = nextPlanes.find(item => item.id === selectedPlane.value?.id) || null;
  selectedPlane.value = matchedPlane;

  if (!matchedPlane) {
    commentPanelVisible.value = false;
    planeComments.value = [];
  }
}

async function loadPlanes() {
  loading.value = true;

  try {
    const { data, error } = await fetchAdminPlanes(buildPlaneParams());
    if (error) {
      throw error;
    }

    const nextPlanes = data ?? [];
    planes.value = nextPlanes;
    syncSelectedPlane(nextPlanes);
  } catch (error) {
    console.error(error);
    window.$message?.error('加载纸飞机列表失败');
  } finally {
    loading.value = false;
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
    if (error) {
      throw error;
    }

    planeComments.value = data ?? [];
  } catch (error) {
    console.error(error);
    window.$message?.error('加载评论失败');
  } finally {
    commentLoading.value = false;
  }
}

async function openCommentPanel(plane: Api.PaperPlane.Plane) {
  selectedPlane.value = plane;
  commentPanelVisible.value = true;
  await loadPlaneComments(plane.id);
}

async function handleDeletePlane(id: string) {
  try {
    const { error } = await deletePlane(id);
    if (error) {
      throw error;
    }

    if (selectedPlane.value?.id === id) {
      commentPanelVisible.value = false;
      selectedPlane.value = null;
      planeComments.value = [];
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
    if (error) {
      throw error;
    }

    window.$message?.success('评论删除成功');
    await Promise.all([loadPlanes(), loadPlaneComments(selectedPlane.value?.id)]);
  } catch (error) {
    console.error(error);
    window.$message?.error('评论删除失败');
  }
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

onMounted(() => {
  void loadPlanes();
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace align="center" :size="12" wrap>
        <NInput
          v-model:value="filters.id"
          placeholder="输入飞机 ID 精确查询"
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.keyword"
          placeholder="输入内容/作者/地点关键词"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.location"
          placeholder="按地点筛选"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
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

    <div class="plane-workspace">
      <NCard :bordered="false" class="card-wrapper table-card">
        <NDataTable
          :columns="columns"
          :data="planes"
          :loading="loading"
          :pagination="{ pageSize: 20 }"
          :scroll-x="1650"
          size="small"
          striped
        />
      </NCard>

      <div v-if="commentPanelVisible && selectedPlane" class="detail-panel">
        <NCard :bordered="false" class="card-wrapper detail-panel-card">
          <div class="detail-panel-header">
            <div class="detail-panel-title-group">
              <div class="detail-panel-title">拆开纸飞机</div>
              <div class="detail-panel-subtitle">参考用户端详情页展示</div>
            </div>
            <NButton size="small" quaternary @click="closeCommentPanel">关闭</NButton>
          </div>

          <div class="detail-shell" :style="{ '--mood-color': selectedMoodTone }">
            <section class="paper-card">
              <div class="paper-header">
                <div class="paper-meta-row">
                  <span class="mood-chip">
                    <span class="mood-dot"></span>
                    <span>{{ getMoodLabel(selectedPlane.mood) }}</span>
                  </span>
                  <div class="paper-meta">📍 {{ selectedPlane.locationTag }} · {{ formatShortTime(selectedPlane.createTime) }}</div>
                </div>
                <div class="paper-id">ID：{{ selectedPlane.id }}</div>
              </div>

              <p class="paper-text">{{ selectedPlane.content }}</p>

              <div class="paper-stats">
                <span>拾取 {{ selectedPlane.pickCount }}</span>
                <span>点赞 {{ selectedPlane.likeCount }}</span>
                <span>评论 {{ selectedPlane.commentCount }}</span>
                <span class="expire">{{ getRemainText(selectedPlane.expireTime) }}</span>
              </div>
            </section>

            <div class="emoji-bar">
              <button class="emoji-btn" type="button">✈️</button>
              <button class="emoji-btn" type="button">💬</button>
              <button class="emoji-btn" type="button">📍</button>
              <button class="emoji-btn" type="button">❤️</button>
              <button class="emoji-btn" type="button">👀</button>
            </div>

            <div class="actions">
              <button class="action-pill" type="button">当前详情预览</button>
              <button class="action-pill ghost" type="button">
                {{ selectedPlane.isAnonymous ? '匿名投递' : '实名投递' }}
              </button>
              <button class="action-pill ghost" type="button">举报 {{ selectedPlane.reportCount }}</button>
            </div>

            <div class="comments-section">
              <div class="section-title">
                <h2>匿名评论</h2>
                <span>{{ planeComments.length }} 条</span>
              </div>

              <NSpin :show="commentLoading">
                <NEmpty v-if="!planeComments.length" description="暂无评论" class="empty-state" />

                <div v-else class="comment-list">
                  <div v-for="comment in planeComments" :key="comment.id" class="comment-item">
                    <div class="comment-top">
                      <div class="comment-nick">{{ comment.nickName }}</div>
                      <div class="comment-time">{{ formatShortTime(comment.createTime) }}</div>
                    </div>

                    <div v-if="comment.replyToNickName" class="comment-reply-tip">回复 {{ comment.replyToNickName }}</div>

                    <div class="comment-text">{{ comment.reply }}</div>

                    <div class="comment-footer">
                      <NPopconfirm @positive-click="handleDeleteComment(comment.id)">
                        <template #trigger>
                          <NButton size="tiny" type="error" quaternary>删除评论</NButton>
                        </template>
                        确认删除这条评论吗？
                      </NPopconfirm>
                    </div>
                  </div>
                </div>
              </NSpin>
            </div>
          </div>
        </NCard>
      </div>
    </div>
  </NSpace>
</template>

<style scoped>
.plane-workspace {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.table-card {
  flex: 1;
  min-width: 0;
}

.detail-panel {
  width: 440px;
  flex: 0 0 440px;
}

.detail-panel-card {
  position: sticky;
  top: 12px;
  overflow: hidden;
}

.detail-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.detail-panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #24384d;
}

.detail-panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #7890a6;
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(158, 176, 190, 0.22);
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  box-shadow: 0 18px 40px rgba(148, 163, 184, 0.18);
}

.paper-card::after {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  top: -70px;
  right: -60px;
  opacity: 0.22;
  background: radial-gradient(circle, var(--mood-color), transparent 70%);
}

.paper-header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.paper-meta-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paper-meta {
  font-size: 12px;
  color: #6f879b;
}

.paper-id {
  font-size: 11px;
  color: #8aa0b2;
  word-break: break-all;
}

.mood-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  color: color-mix(in srgb, var(--mood-color) 75%, #344256 25%);
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid color-mix(in srgb, var(--mood-color) 60%, #ffffff 40%);
  font-size: 12px;
  font-weight: 600;
}

.mood-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--mood-color);
}

.paper-text {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #24384d;
  font-size: 15px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}

.paper-stats {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  font-size: 12px;
  color: #6f879b;
}

.paper-stats .expire {
  color: color-mix(in srgb, var(--mood-color) 68%, #42566c 32%);
  font-weight: 700;
}

.emoji-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 2px;
}

.emoji-btn {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid rgba(158, 176, 190, 0.28);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 18px;
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.1);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-pill {
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--mood-color) 76%, #5c7d98 24%);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--mood-color) 22%, transparent 78%);
}

.action-pill.ghost {
  background: rgba(255, 255, 255, 0.88);
  color: #314a61;
  border: 1px solid rgba(158, 176, 190, 0.24);
  box-shadow: none;
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 2px 2px 6px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title h2 {
  margin: 0;
  color: #294057;
  font-size: 15px;
  font-weight: 700;
}

.section-title span {
  color: #7b92a6;
  font-size: 12px;
}

.empty-state {
  margin-top: 24px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 14px 14px 12px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 252, 0.94));
  border: 1px solid rgba(158, 176, 190, 0.2);
  box-shadow: 0 12px 24px rgba(148, 163, 184, 0.12);
}

.comment-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.comment-nick {
  color: color-mix(in srgb, var(--mood-color) 72%, #34506c 28%);
  font-size: 13px;
  font-weight: 700;
}

.comment-time {
  color: #8ca1b3;
  font-size: 11px;
}

.comment-reply-tip {
  margin-top: 8px;
  color: #6e879b;
  font-size: 12px;
}

.comment-text {
  margin-top: 8px;
  color: #263c51;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
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
  }
}
</style>
