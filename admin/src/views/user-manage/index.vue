<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { NAvatar, NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps, SelectOption } from 'naive-ui';
import { fetchAdminUsers, updateAppUserStatus } from '@/service/api/paperplane';

const users = ref<Api.PaperPlane.AdminUser[]>([]);
const loading = ref(false);
const filters = reactive({
  keyword: '',
  status: ''
});

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'true' },
  { label: '禁用', value: 'false' }
];

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange(page) {
    pagination.page = page;
    void loadUsers();
  },
  onUpdatePageSize(pageSize) {
    pagination.page = 1;
    pagination.pageSize = pageSize;
    void loadUsers();
  }
});

const columns = computed<DataTableColumns<Api.PaperPlane.AdminUser>>(() => [
  {
    title: '用户',
    key: 'username',
    minWidth: 180,
    render(row) {
      const avatar = row.avatarUrl
        ? h(NAvatar, { round: true, size: 32, src: normalizeAssetUrl(row.avatarUrl) })
        : h(NAvatar, { round: true, size: 32 }, { default: () => row.username.slice(0, 1).toUpperCase() });

      return h(NSpace, { align: 'center', size: 8 }, () => [
        avatar,
        h('div', null, [
          h('div', { class: 'font-600' }, row.username),
          h('div', { class: 'text-12px text-#999' }, row.phone)
        ])
      ]);
    }
  },
  { title: '学号', key: 'studentId', width: 140, ellipsis: { tooltip: true } },
  {
    title: '性别',
    key: 'gender',
    width: 100,
    render(row) {
      return formatGender(row.gender);
    }
  },
  {
    title: '状态',
    key: 'isActive',
    width: 100,
    render(row) {
      return h(NTag, { type: row.isActive ? 'success' : 'error', size: 'small' }, () =>
        row.isActive ? '正常' : '禁用'
      );
    }
  },
  { title: '投递', key: 'thrownPlaneCount', width: 90 },
  { title: '点赞', key: 'likeCount', width: 80 },
  { title: '拾取', key: 'pickCount', width: 80 },
  {
    title: '简介',
    key: 'bio',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render(row) {
      return row.bio || '-';
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
    title: '最后登录',
    key: 'lastLoginTime',
    width: 180,
    render(row) {
      return formatTime(row.lastLoginTime);
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render(row) {
      const nextActive = !row.isActive;
      const actionText = nextActive ? '启用' : '禁用';
      const confirmText = nextActive ? '确认启用这个用户吗？' : '确认禁用这个用户并清理登录态吗？';

      return h(
        NPopconfirm,
        { onPositiveClick: () => handleStatusChange(row.id, nextActive) },
        {
          trigger: () =>
            h(
              NButton,
              {
                size: 'small',
                type: nextActive ? 'primary' : 'warning',
                quaternary: true
              },
              () => actionText
            ),
          default: () => confirmText
        }
      );
    }
  }
]);

function normalizeAssetUrl(url: string | null) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${import.meta.env.VITE_SERVICE_BASE_URL}${url}`;
}

function formatGender(value: string) {
  const genderMap: Record<string, string> = {
    male: '男',
    female: '女',
    secret: '保密'
  };

  return genderMap[value] ?? value;
}

function formatTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN');
}

function buildParams() {
  const keyword = filters.keyword.trim();

  return {
    keyword: keyword || undefined,
    isActive: filters.status === '' ? undefined : filters.status === 'true',
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

async function loadUsers() {
  loading.value = true;

  try {
    const { data, error } = await fetchAdminUsers(buildParams());
    if (error) {
      throw error;
    }

    users.value = data?.items ?? [];
    pagination.itemCount = data?.total ?? 0;
  } catch (error) {
    console.error(error);
    window.$message?.error('加载用户失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  void loadUsers();
}

function handleReset() {
  filters.keyword = '';
  filters.status = '';
  pagination.page = 1;
  void loadUsers();
}

async function handleStatusChange(id: string, isActive: boolean) {
  try {
    const { error } = await updateAppUserStatus(id, { isActive });
    if (error) {
      throw error;
    }

    window.$message?.success(isActive ? '用户已启用' : '用户已禁用');
    await loadUsers();
  } catch (error) {
    console.error(error);
    window.$message?.error('状态更新失败');
  }
}

void loadUsers();
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace align="center" :size="12" wrap>
        <NInput
          v-model:value="filters.keyword"
          placeholder="输入用户名 / 学号 / 手机号"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
        />
        <NSelect v-model:value="filters.status" :options="statusOptions" style="width: 160px" />
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        remote
        :columns="columns"
        :data="users"
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
