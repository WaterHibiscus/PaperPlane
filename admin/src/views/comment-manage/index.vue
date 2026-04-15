<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { deleteComment, fetchAdminComments } from '@/service/api/paperplane';

const comments = ref<Api.PaperPlane.AdminComment[]>([]);
const loading = ref(false);
const filters = reactive({
  keyword: '',
  planeId: ''
});

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
  { title: '评论 ID', key: 'id', width: 180, fixed: 'left', ellipsis: { tooltip: true } },
  { title: '飞机 ID', key: 'planeId', width: 180, fixed: 'left', ellipsis: { tooltip: true } },
  { title: '地点', key: 'locationTag', width: 120 },
  {
    title: '飞机内容',
    key: 'planeContent',
    minWidth: 260,
    ellipsis: { tooltip: true }
  },
  {
    title: '评论内容',
    key: 'reply',
    minWidth: 260,
    ellipsis: { tooltip: true }
  },
  { title: '昵称', key: 'nickName', width: 140, ellipsis: { tooltip: true } },
  {
    title: '回复对象',
    key: 'replyToNickName',
    width: 140,
    render(row) {
      return row.replyToNickName || '-';
    }
  },
  {
    title: '回复数',
    key: 'replyCount',
    width: 90,
    render(row) {
      if (row.replyCount > 0) {
        return h(NTag, { type: 'warning', size: 'small' }, () => row.replyCount);
      }

      return '0';
    }
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return formatTime(row.createTime);
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 128,
    fixed: 'right',
    render(row) {
      const confirmText = row.replyCount > 0 ? '确认删除这条评论及其回复吗？' : '确认删除这条评论吗？';

      return h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row.id) },
        {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, () => '删除'),
          default: () => confirmText
        }
      );
    }
  }
]);

function formatTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN');
}

function buildParams() {
  const keyword = filters.keyword.trim();
  const planeId = filters.planeId.trim();

  return {
    keyword: keyword || undefined,
    planeId: planeId || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

async function loadComments() {
  loading.value = true;

  try {
    const { data, error } = await fetchAdminComments(buildParams());
    if (error) {
      throw error;
    }

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
  pagination.page = 1;
  void loadComments();
}

async function handleDelete(id: string) {
  try {
    const { error } = await deleteComment(id);
    if (error) {
      throw error;
    }

    window.$message?.success('评论删除成功');

    const currentPage = Number(pagination.page || 1);
    const currentSize = Number(pagination.pageSize || 20);
    const currentCount = comments.value.length;
    if (currentPage > 1 && currentCount === 1) {
      pagination.page = currentPage - 1;
    }

    pagination.pageSize = currentSize;
    await loadComments();
  } catch (error) {
    console.error(error);
    window.$message?.error('删除失败');
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
          placeholder="搜索评论内容 / 昵称 / 飞机内容"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.planeId"
          placeholder="按飞机 ID 筛选"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
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
        :scroll-x="1720"
        size="small"
        striped
      />
    </NCard>
  </NSpace>
</template>

<style scoped></style>
