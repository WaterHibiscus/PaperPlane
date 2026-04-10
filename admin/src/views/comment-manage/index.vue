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
  { title: 'Comment ID', key: 'id', width: 180, ellipsis: { tooltip: true } },
  { title: 'Plane ID', key: 'planeId', width: 180, ellipsis: { tooltip: true } },
  { title: 'Location', key: 'locationTag', width: 120 },
  {
    title: 'Plane Content',
    key: 'planeContent',
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  {
    title: 'Comment',
    key: 'reply',
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  { title: 'Nickname', key: 'nickName', width: 140, ellipsis: { tooltip: true } },
  {
    title: 'Reply To',
    key: 'replyToNickName',
    width: 140,
    render(row) {
      return row.replyToNickName || '-';
    }
  },
  {
    title: 'Replies',
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
    title: 'Created At',
    key: 'createTime',
    width: 180,
    render(row) {
      return formatTime(row.createTime);
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render(row) {
      const confirmText = row.replyCount > 0 ? 'Delete this comment and its replies?' : 'Delete this comment?';

      return h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row.id) },
        {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, () => 'Delete'),
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
    window.$message?.error('Failed to load comments.');
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

    window.$message?.success('Comment deleted.');

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
    window.$message?.error('Delete failed.');
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
          placeholder="Search comment / nickname / plane content"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="filters.planeId"
          placeholder="Filter by plane ID"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <NButton type="primary" @click="handleSearch">Search</NButton>
        <NButton @click="handleReset">Reset</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        remote
        :columns="columns"
        :data="comments"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="1500"
        size="small"
        striped
      />
    </NCard>
  </NSpace>
</template>

<style scoped></style>
