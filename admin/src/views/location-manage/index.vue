<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';
import { NButton, NInput, NInputNumber, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  createLocation,
  deleteLocation,
  searchLocations,
  updateLocation,
  uploadLocationIcon
} from '@/service/api/paperplane';

const locations = ref<Api.PaperPlane.Location[]>([]);
const loading = ref(false);
const keyword = ref('');
const showModal = ref(false);
const editingId = ref<number | null>(null);
const iconUploading = ref(false);

const formData = reactive<{
  name: string;
  sortOrder: number | null;
  iconUrl: string;
}>({
  name: '',
  sortOrder: 0,
  iconUrl: ''
});

function normalizeAssetUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const rawBase = import.meta.env.VITE_SERVICE_BASE_URL || 'http://localhost:5000';
  const base = rawBase.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

const columns: DataTableColumns<Api.PaperPlane.Location> = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '图标',
    key: 'iconUrl',
    width: 90,
    render(row) {
      if (!row.iconUrl) {
        return h('span', { class: 'text-12px text-#999' }, '-');
      }

      return h('img', {
        src: normalizeAssetUrl(row.iconUrl),
        alt: row.name,
        style: 'width:32px;height:32px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;'
      });
    }
  },
  { title: '地点名称', key: 'name', minWidth: 220 },
  { title: '排序', key: 'sortOrder', width: 100 },
  { title: '纸飞机数量', key: 'planeCount', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row) {
      return h(NSpace, { size: 8 }, () => [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            quaternary: true,
            onClick: () => openEdit(row)
          },
          () => '编辑'
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row.id) },
          {
            trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, () => '删除'),
            default: () => '确认删除这个地点吗？'
          }
        )
      ]);
    }
  }
];

async function loadLocations() {
  loading.value = true;

  try {
    const { data, error } = await searchLocations({ keyword: keyword.value.trim() || undefined });
    if (error) throw error;

    locations.value = data ?? [];
  } catch (error) {
    console.error(error);
    window.$message?.error('加载地点列表失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formData.name = '';
  formData.sortOrder = 0;
  formData.iconUrl = '';
  showModal.value = true;
}

function openEdit(row: Api.PaperPlane.Location) {
  editingId.value = row.id;
  formData.name = row.name;
  formData.sortOrder = row.sortOrder;
  formData.iconUrl = row.iconUrl || '';
  showModal.value = true;
}

function handleSearch() {
  void loadLocations();
}

function handleReset() {
  keyword.value = '';
  void loadLocations();
}

function clearIcon() {
  formData.iconUrl = '';
}

async function handleIconFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    window.$message?.warning('请上传图片文件');
    if (input) input.value = '';
    return;
  }

  iconUploading.value = true;
  try {
    const { data, error } = await uploadLocationIcon(file);
    if (error) throw error;
    if (!data?.url) throw new Error('上传返回为空');

    formData.iconUrl = data.url;
    window.$message?.success('图标上传成功');
  } catch (error) {
    console.error(error);
    window.$message?.error('图标上传失败');
  } finally {
    iconUploading.value = false;
    if (input) input.value = '';
  }
}

async function handleSubmit() {
  if (!formData.name.trim()) {
    window.$message?.warning('请输入地点名称');
    return;
  }

  const payload = {
    name: formData.name.trim(),
    sortOrder: Number(formData.sortOrder || 0),
    iconUrl: formData.iconUrl || null
  };

  try {
    if (editingId.value !== null) {
      const { error } = await updateLocation(editingId.value, payload);
      if (error) throw error;
      window.$message?.success('地点更新成功');
    } else {
      const { error } = await createLocation(payload);
      if (error) throw error;
      window.$message?.success('地点创建成功');
    }

    showModal.value = false;
    await loadLocations();
  } catch (error) {
    console.error(error);
    window.$message?.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    const { error } = await deleteLocation(id);
    if (error) throw error;

    window.$message?.success('地点删除成功');
    await loadLocations();
  } catch (error) {
    console.error(error);
    window.$message?.error('删除失败');
  }
}

onMounted(() => {
  void loadLocations();
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace justify="space-between" align="center" wrap>
        <NSpace align="center" :size="12" wrap>
          <NInput
            v-model:value="keyword"
            placeholder="输入地点名称查询"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
          <NButton type="primary" @click="handleSearch">查询</NButton>
          <NButton @click="handleReset">重置</NButton>
        </NSpace>

        <NButton type="primary" @click="openCreate">新增地点</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable :columns="columns" :data="locations" :loading="loading" :pagination="false" size="small" striped />
    </NCard>

    <NModal v-model:show="showModal" preset="dialog" :title="editingId !== null ? '编辑地点' : '新增地点'">
      <NSpace vertical :size="12" style="padding: 12px 0">
        <NInput v-model:value="formData.name" placeholder="地点名称" />
        <NInputNumber v-model:value="formData.sortOrder" placeholder="排序值" :min="0" style="width: 100%" />

        <div class="icon-upload">
          <div class="icon-upload-head">
            <span class="label">地点图标</span>
            <NButton size="tiny" quaternary type="error" :disabled="!formData.iconUrl" @click="clearIcon">清除</NButton>
          </div>

          <input
            class="icon-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            :disabled="iconUploading"
            @change="handleIconFileChange"
          />
          <div class="icon-tip">{{ iconUploading ? '上传中...' : '建议上传 1:1 小图标（png/webp 更清晰）' }}</div>

          <div v-if="formData.iconUrl" class="icon-preview-wrap">
            <img class="icon-preview" :src="normalizeAssetUrl(formData.iconUrl)" alt="地点图标预览" />
          </div>
        </div>
      </NSpace>

      <template #action>
        <NButton @click="showModal = false">取消</NButton>
        <NButton type="primary" @click="handleSubmit">确定</NButton>
      </template>
    </NModal>
  </NSpace>
</template>

<style scoped>
.icon-upload {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.icon-upload-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.icon-upload-head .label {
  font-size: 13px;
  color: #333;
}

.icon-input {
  width: 100%;
}

.icon-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}

.icon-preview-wrap {
  margin-top: 10px;
}

.icon-preview {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}
</style>
