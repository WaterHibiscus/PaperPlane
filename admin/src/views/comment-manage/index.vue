<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { NButton, NPopconfirm, NPopover, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps, SelectOption } from 'naive-ui';
import { deleteComment, fetchAdminComments } from '@/service/api/paperplane';

const comments = ref<Api.PaperPlane.AdminComment[]>([]);
const loading = ref(false);
const deletingIds = ref<Set<string>>(new Set());
const createTimeRange = ref<[number, number] | null>(null);

const filters = reactive({
  keyword: '',
  planeId: '',
  location: '',
  commentType: '',
  hasReplies: ''
});

const commentTypeOptions: SelectOption[] = [
  { label: '全部类型', value: '' },
  { label: '主评论', value: 'root' },
  { label: '回复', value: 'reply' }
];

const hasRepliesOptions: SelectOption[] = [
  { label: '全部回复状态', value: '' },
  { label: '有回复', value: 'true' },
  { label: '无回复', value: 'false' }
];

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange(page) {
    pagination.page = page;
    void loadComments();
  },
  onUpdatePageSize(pageSize) {
    pagination.page = 1;
    pagination.pageSize = pageSize;
    void loadComments();
  }
});

const columns = computed<DataTableColumns<Api.PaperPlane.AdminComment>>(() => [
  {
    title: '评论 ID',
    key: 'id',
    width: 128,
    fixed: 'left',
    render(row) {
      return renderIdCell(row.id, '点击复制评论ID', '评论ID已复制');
    }
  },
  {
    title: '飞机 ID',
    key: 'planeId',
    width: 128,
    fixed: 'left',
    render(row) {
      return renderIdCell(row.planeId, '点击复制飞机ID', '飞机ID已复制');
    }
  },
  {
    title: '评论类型',
    key: 'commentType',
    width: 92,
    render(row) {
      const isReply = Boolean(row.parentCommentId);
      return h(NTag, { size: 'small', type: isReply ? 'info' : 'default' }, () => (isReply ? '回复' : '主评论'));
    }
  },
  { title: '地点', key: 'locationTag', width: 120, ellipsis: { tooltip: true } },
  {
    title: '飞机内容',
    key: 'planeContent',
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  {
    title: '评论内容',
    key: 'reply',
    minWidth: 240,
    ellipsis: { tooltip: true }
  },
  {
    title: '昵称',
    key: 'nickName',
    width: 120,
    ellipsis: { tooltip: true },
    render(row) {
      return row.nickName || '-';
    }
  },
  {
    title: '回复对象',
    key: 'replyToNickName',
    width: 120,
    ellipsis: { tooltip: true },
    render(row) {
      return row.replyToNickName || '-';
    }
  },
  {
    title: '回复数',
    key: 'replyCount',
    width: 92,
    render(row) {
      if (row.parentCommentId) return '-';
      if (row.replyCount > 0) return h(NTag, { type: 'warning', size: 'small' }, () => row.replyCount);
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
    title: '操作',
    key: 'actions',
    width: 112,
    fixed: 'right',
    render(row) {
      const deleting = deletingIds.value.has(row.id);
      const confirmText = row.replyCount > 0 ? '确认删除这条评论及其回复吗？' : '确认删除这条评论吗？';

      return h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row.id) },
        {
          trigger: () =>
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                quaternary: true,
                loading: deleting,
                disabled: deleting
              },
              () => '删除'
            ),
          default: () => confirmText
        }
      );
    }
  }
]);

function renderIdCell(id: string, tip: string, successText: string) {
  return h(
    NPopover,
    { trigger: 'hover', placement: 'top-start' },
    {
      trigger: () => h('div', { class: 'id-cell' }, [h('span', { class: 'id-text' }, getShortId(id))]),
      default: () =>
        h(
          'button',
          {
            class: 'id-popover',
            type: 'button',
            onClick: (event: MouseEvent) => {
              event.stopPropagation();
              void copyText(id, successText);
            }
          },
          [h('span', { class: 'id-popover-label' }, tip), h('span', { class: 'id-popover-value' }, id)]
        )
    }
  );
}

function getShortId(id: string) {
  const index = id.indexOf('-');
  return index === -1 ? id : `${id.slice(0, index + 1)}...`;
}

function isGuid(value: string) {
  if (!value) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatTime(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
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

function buildParams() {
  const keyword = filters.keyword.trim();
  const planeId = filters.planeId.trim();
  const location = filters.location.trim();

  if (planeId && !isGuid(planeId)) {
    window.$message?.warning('飞机ID格式不正确，请输入完整 UUID');
    return null;
  }

  return {
    keyword: keyword || undefined,
    planeId: planeId || undefined,
    location: location || undefined,
    commentType: (filters.commentType || undefined) as 'root' | 'reply' | undefined,
    hasReplies: filters.hasReplies === '' ? undefined : filters.hasReplies === 'true',
    createTimeStart: createTimeRange.value ? new Date(createTimeRange.value[0]).toISOString() : undefined,
    createTimeEnd: createTimeRange.value ? new Date(createTimeRange.value[1]).toISOString() : undefined,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

async function loadComments() {
  loading.value = true;

  try {
    const params = buildParams();
    if (!params) return;

    const { data, error } = await fetchAdminComments(params);
    if (error) throw error;

    comments.value = data?.items ?? [];
    pagination.itemCount = data?.total ?? 0;
  } catch (error) {
    console.error(error);
    window.$message?.error('加载评论列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  void loadComments();
}

function handleReset() {
  filters.keyword = '';
  filters.planeId = '';
  filters.location = '';
  filters.commentType = '';
  filters.hasReplies = '';
  createTimeRange.value = null;
  pagination.page = 1;
  void loadComments();
}

async function handleDelete(id: string) {
  if (deletingIds.value.has(id)) return;

  deletingIds.value.add(id);
  try {
    const { error } = await deleteComment(id);
    if (error) throw error;

    window.$message?.success('评论删除成功');

    const currentPage = Number(pagination.page || 1);
    const currentCount = comments.value.length;
    if (currentPage > 1 && currentCount === 1) {
      pagination.page = currentPage - 1;
    }

    await loadComments();
  } catch (error) {
    console.error(error);
    window.$message?.error('删除失败');
  } finally {
    deletingIds.value.delete(id);
  }
}

void loadComments();
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace align="center" :size="12" wrap>
        <NInput
          v-model:value="filters.keyword"
          placeholder="评论内容 / 昵称 / 飞机内容 / 地点 / ID"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.planeId"
          placeholder="按飞机ID精确筛选（UUID）"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <NInput v-model:value="filters.location" placeholder="按地点筛选" clearable style="width: 140px" @keyup.enter="handleSearch" />
        <NSelect v-model:value="filters.commentType" :options="commentTypeOptions" style="width: 130px" />
        <NSelect v-model:value="filters.hasReplies" :options="hasRepliesOptions" style="width: 150px" />
        <NDatePicker
          v-model:value="createTimeRange"
          type="datetimerange"
          clearable
          style="width: 320px"
          start-placeholder="评论开始时间"
          end-placeholder="评论结束时间"
        />
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        remote
        :columns="columns"
        :data="comments"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="1760"
        size="small"
        striped
      />
    </NCard>
  </NSpace>
</template>

<style scoped>
.id-cell {
  display: block;
  min-width: 0;
}

.id-text {
  color: #24384d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.id-popover {
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

.id-popover-label {
  font-size: 12px;
  color: #6f879b;
}

.id-popover-value {
  line-height: 1.5;
  color: #24384d;
  word-break: break-all;
}
</style>
