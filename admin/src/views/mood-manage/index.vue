<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NInput, NInputNumber, NSpace, NSwitch } from 'naive-ui';
import { fetchMoodConfigs, updateMoodConfigs, uploadMoodIcon } from '@/service/api/paperplane';

const loading = ref(false);
const saving = ref(false);
const uploadingKey = ref('');
const items = ref<Api.PaperPlane.MoodConfig[]>([]);
const snapshot = ref<Api.PaperPlane.MoodConfig[]>([]);

const keyRule = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const colorRule = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const activeCount = computed(() => items.value.filter(item => item.isActive).length);

function isFixedCustom(item: Api.PaperPlane.MoodConfig) {
  return item.key === 'custom' || item.isCustom;
}

function normalizeFixedCustom(item: Api.PaperPlane.MoodConfig) {
  item.key = 'custom';
  item.label = '自定义心情';
  item.isCustom = true;
  item.isActive = true;
}

function cloneItems(source: Api.PaperPlane.MoodConfig[]) {
  return source.map(item => ({
    key: item.key,
    label: item.label,
    iconUrl: item.iconUrl,
    color: item.color,
    sortOrder: Number(item.sortOrder || 0),
    isActive: Boolean(item.isActive),
    isCustom: Boolean(item.isCustom)
  }));
}

function normalizeAssetUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const rawBase = import.meta.env.VITE_SERVICE_BASE_URL || 'http://localhost:5000';
  const base = rawBase.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

function ensureOneCustom(targetKey?: string) {
  if (!items.value.length) return;
  let customIndex = items.value.findIndex(item => item.key === 'custom');
  if (customIndex < 0 && targetKey) customIndex = items.value.findIndex(item => item.key === targetKey);
  if (customIndex < 0) customIndex = items.value.findIndex(item => item.isCustom);

  if (customIndex < 0) {
    items.value.push({
      key: 'custom',
      label: '自定义心情',
      iconUrl: '',
      color: '#7d8b8a',
      sortOrder: items.value.length * 10 + 10,
      isActive: true,
      isCustom: true
    });
    customIndex = items.value.length - 1;
  }

  items.value.forEach((item, index) => {
    item.isCustom = index === customIndex;
    if (index === customIndex) {
      normalizeFixedCustom(item);
    }
  });
}

function addItem() {
  const index = items.value.length + 1;
  const key = `mood_${index}`;
  items.value.push({
    key,
    label: '新情绪',
    iconUrl: '',
    color: '#909399',
    sortOrder: index * 10,
    isActive: true,
    isCustom: false
  });
}

function removeItem(index: number) {
  if (index < 0 || index >= items.value.length) return;
  if (isFixedCustom(items.value[index])) return;
  items.value.splice(index, 1);
  ensureOneCustom();
}

function move(index: number, direction: -1 | 1) {
  const next = index + direction;
  if (next < 0 || next >= items.value.length) return;
  [items.value[index], items.value[next]] = [items.value[next], items.value[index]];
}

function resetAll() {
  items.value = cloneItems(snapshot.value);
}

async function loadAll() {
  loading.value = true;
  try {
    const { data, error } = await fetchMoodConfigs();
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    items.value = cloneItems(list);
    ensureOneCustom();
    snapshot.value = cloneItems(items.value);
  } catch (error) {
    console.error(error);
    window.$message?.error('加载情绪配置失败');
  } finally {
    loading.value = false;
  }
}

function validateItems() {
  if (!items.value.length) {
    window.$message?.warning('至少保留一个情绪项');
    return false;
  }

  const keySet = new Set<string>();
  for (const item of items.value) {
    if (isFixedCustom(item)) {
      normalizeFixedCustom(item);
    }

    item.key = String(item.key || '').trim().toLowerCase();
    item.label = String(item.label || '').trim();
    item.iconUrl = String(item.iconUrl || '').trim();
    item.color = String(item.color || '').trim();
    item.sortOrder = Number(item.sortOrder || 0);

    if (!keyRule.test(item.key)) {
      window.$message?.warning(`无效 key: ${item.key || '(empty)'}`);
      return false;
    }
    if (keySet.has(item.key)) {
      window.$message?.warning(`重复 key: ${item.key}`);
      return false;
    }
    keySet.add(item.key);

    if (!item.label) {
      window.$message?.warning(`请填写文案: ${item.key}`);
      return false;
    }
    if (!item.iconUrl) {
      window.$message?.warning(`请配置图标: ${item.key}`);
      return false;
    }
    if (item.color && !colorRule.test(item.color)) {
      window.$message?.warning(`颜色格式错误: ${item.key}`);
      return false;
    }
  }

  if (!items.value.some(item => item.isActive)) {
    window.$message?.warning('至少启用一个情绪项');
    return false;
  }

  ensureOneCustom();
  return true;
}

async function saveAll() {
  if (!validateItems()) return;
  saving.value = true;
  try {
    const payload = { items: cloneItems(items.value) };
    const { data, error } = await updateMoodConfigs(payload);
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    items.value = cloneItems(list);
    ensureOneCustom();
    snapshot.value = cloneItems(items.value);
    window.$message?.success('保存成功');
  } catch (error) {
    console.error(error);
    window.$message?.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function onUploadIcon(item: Api.PaperPlane.MoodConfig, event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    window.$message?.warning('请选择图片文件');
    if (input) input.value = '';
    return;
  }

  uploadingKey.value = item.key;
  try {
    const { data, error } = await uploadMoodIcon(file);
    if (error) throw error;
    if (!data?.url) throw new Error('upload response empty');
    item.iconUrl = data.url;
    window.$message?.success('图标上传成功');
  } catch (error) {
    console.error(error);
    const message =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      '图标上传失败';
    window.$message?.error(message);
  } finally {
    uploadingKey.value = '';
    if (input) input.value = '';
  }
}

onMounted(() => {
  void loadAll();
});
</script>

<template>
  <NSpace vertical :size="12">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace :size="8" wrap>
        <NButton type="primary" @click="addItem">新增情绪</NButton>
        <NButton :disabled="loading" @click="loadAll">刷新</NButton>
        <NButton :disabled="saving" @click="resetAll">重置</NButton>
        <NButton type="primary" ghost :loading="saving" @click="saveAll">保存</NButton>
      </NSpace>
      <div class="summary">固定包含 1 个“自定义心情”选项，用户端选择后自行输入文字</div>
    </NCard>

    <NCard v-for="(item, index) in items" :key="`${item.key}-${index}`" :bordered="false" class="card-wrapper mood-card">
      <div class="mood-head">
        <div>#{{ index + 1 }}</div>
        <NSpace :size="8">
          <NButton size="small" :disabled="index === 0" @click="move(index, -1)">上移</NButton>
          <NButton size="small" :disabled="index === items.length - 1" @click="move(index, 1)">下移</NButton>
          <NButton size="small" type="error" ghost :disabled="isFixedCustom(item)" @click="removeItem(index)">删除</NButton>
        </NSpace>
      </div>

      <div class="mood-grid">
        <NInput v-model:value="item.key" placeholder="key: happy/custom" :disabled="isFixedCustom(item)" />
        <NInput v-model:value="item.label" placeholder="文案" :disabled="isFixedCustom(item)" />
        <NInput v-model:value="item.color" placeholder="#RRGGBB" />
        <NInputNumber v-model:value="item.sortOrder" :min="-999" :max="9999" style="width: 100%" placeholder="排序" />
      </div>

      <div class="mood-switches">
        <div class="switch-item">
          <span>启用</span>
          <NSwitch v-model:value="item.isActive" :disabled="isFixedCustom(item)" />
        </div>
        <div v-if="isFixedCustom(item)" class="switch-item custom-note">
          前端用户选择“自定义心情”后，会自己输入心情文字
        </div>
      </div>

      <div class="icon-row">
        <img v-if="item.iconUrl" class="icon-preview" :src="normalizeAssetUrl(item.iconUrl)" alt="icon" />
        <div v-else class="icon-empty">无图标</div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,.ico,.svg,.bmp,.jfif"
          :disabled="uploadingKey === item.key"
          @change="event => onUploadIcon(item, event)"
        />
      </div>
    </NCard>
  </NSpace>
</template>

<style scoped>
.summary {
  margin-top: 8px;
  color: #80858f;
  font-size: 13px;
}

.mood-card {
  border: 1px solid #eef1f4;
}

.mood-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mood-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mood-switches {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.switch-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.custom-note {
  color: #80858f;
  font-size: 13px;
}

.icon-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.icon-empty {
  width: 40px;
  height: 40px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9aa1a9;
  font-size: 12px;
}
</style>
