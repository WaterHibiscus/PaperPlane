<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NInput, NInputNumber, NSpace, NSwitch } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchExpireOptions, updateExpireOptions } from '@/service/api/paperplane';

interface ExpireRow {
  index: number;
  hours: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

const maxOptionCount = 12;
const loading = ref(false);
const saving = ref(false);
const items = ref<Api.PaperPlane.ExpireOptionConfig[]>([]);
const snapshot = ref<Api.PaperPlane.ExpireOptionConfig[]>([]);

const activeCount = computed(() => items.value.filter(item => item.isActive).length);
const tableData = computed<ExpireRow[]>(() =>
  items.value.map((item, index) => ({
    index,
    hours: item.hours,
    label: item.label,
    sortOrder: item.sortOrder,
    isActive: item.isActive
  }))
);

function cloneItems(source: Api.PaperPlane.ExpireOptionConfig[]) {
  return source.map(item => ({
    hours: Number(item.hours || 0),
    label: item.label,
    sortOrder: Number(item.sortOrder || 0),
    isActive: Boolean(item.isActive)
  }));
}

function setHours(index: number, value: number | null) {
  items.value[index].hours = Number(value || 0);
}

function setLabel(index: number, value: string) {
  items.value[index].label = value;
}

function setSortOrder(index: number, value: number | null) {
  items.value[index].sortOrder = Number(value || 0);
}

function setActive(index: number, value: boolean) {
  items.value[index].isActive = value;
}

function addItem() {
  if (items.value.length >= maxOptionCount) {
    window.$message?.warning(`最多可配置 ${maxOptionCount} 个存活时间选项`);
    return;
  }

  items.value.push({
    hours: 24,
    label: '24小时',
    sortOrder: items.value.length * 10 + 10,
    isActive: true
  });
}

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.value.length) return;
  [items.value[index], items.value[target]] = [items.value[target], items.value[index]];
}

function removeItem(index: number) {
  if (items.value.length === 1) {
    window.$message?.warning('至少保留一个存活时间选项');
    return;
  }

  items.value.splice(index, 1);
}

const columns = computed<DataTableColumns<ExpireRow>>(() => [
  {
    title: '序号',
    key: 'index',
    width: 80,
    render(row) {
      return row.index + 1;
    }
  },
  {
    title: '小时数',
    key: 'hours',
    width: 140,
    render(row) {
      return h(NInputNumber, {
        value: row.hours,
        min: 1,
        max: 168,
        precision: 0,
        style: 'width: 120px',
        'onUpdate:value': (value: number | null) => setHours(row.index, value)
      });
    }
  },
  {
    title: '显示文案',
    key: 'label',
    minWidth: 220,
    render(row) {
      return h(NInput, {
        value: row.label,
        maxlength: 20,
        placeholder: '例如：24小时',
        'onUpdate:value': (value: string) => setLabel(row.index, value)
      });
    }
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 140,
    render(row) {
      return h(NInputNumber, {
        value: row.sortOrder,
        min: -999,
        max: 9999,
        precision: 0,
        style: 'width: 120px',
        'onUpdate:value': (value: number | null) => setSortOrder(row.index, value)
      });
    }
  },
  {
    title: '启用',
    key: 'isActive',
    width: 100,
    render(row) {
      return h(NSwitch, {
        value: row.isActive,
        'onUpdate:value': (value: boolean) => setActive(row.index, value)
      });
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render(row) {
      return h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                disabled: row.index === 0,
                onClick: () => moveItem(row.index, -1)
              },
              { default: () => '上移' }
            ),
            h(
              NButton,
              {
                size: 'small',
                disabled: row.index === items.value.length - 1,
                onClick: () => moveItem(row.index, 1)
              },
              { default: () => '下移' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => removeItem(row.index)
              },
              { default: () => '删除' }
            )
          ]
        }
      );
    }
  }
]);

async function loadOptions() {
  loading.value = true;
  try {
    const { data, error } = await fetchExpireOptions();
    if (error) throw error;

    const nextItems = Array.isArray(data) && data.length ? cloneItems(data) : [{ hours: 24, label: '24小时', sortOrder: 10, isActive: true }];
    items.value = nextItems;
    snapshot.value = cloneItems(nextItems);
  } catch (error) {
    console.error(error);
    window.$message?.error('加载存活时间配置失败');
  } finally {
    loading.value = false;
  }
}

function resetChanges() {
  items.value = snapshot.value.length ? cloneItems(snapshot.value) : [{ hours: 24, label: '24小时', sortOrder: 10, isActive: true }];
}

function validateItems() {
  if (!items.value.length) {
    window.$message?.warning('至少保留一个存活时间选项');
    return false;
  }

  const hourSet = new Set<number>();
  for (const item of items.value) {
    item.hours = Number(item.hours || 0);
    item.label = String(item.label || '').trim();
    item.sortOrder = Number(item.sortOrder || 0);

    if (!Number.isInteger(item.hours) || item.hours < 1 || item.hours > 168) {
      window.$message?.warning(`小时数必须在 1 到 168 之间`);
      return false;
    }
    if (hourSet.has(item.hours)) {
      window.$message?.warning(`小时数重复：${item.hours}`);
      return false;
    }
    hourSet.add(item.hours);

    if (!item.label) {
      item.label = `${item.hours}小时`;
    }
  }

  if (!items.value.some(item => item.isActive)) {
    window.$message?.warning('至少启用一个存活时间选项');
    return false;
  }

  return true;
}

async function saveOptions() {
  if (!validateItems()) return;

  saving.value = true;
  try {
    const payload = { items: cloneItems(items.value) };
    const { data, error } = await updateExpireOptions(payload);
    if (error) throw error;

    const nextItems = Array.isArray(data) && data.length ? cloneItems(data) : cloneItems(payload.items);
    items.value = nextItems;
    snapshot.value = cloneItems(nextItems);
    window.$message?.success('保存成功');
  } catch (error) {
    console.error(error);
    window.$message?.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadOptions();
});
</script>

<template>
  <NSpace vertical :size="12">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace :size="8" wrap>
        <NButton type="primary" :disabled="items.length >= maxOptionCount" @click="addItem">新增</NButton>
        <NButton :disabled="loading" @click="loadOptions">刷新</NButton>
        <NButton :disabled="saving" @click="resetChanges">重置</NButton>
        <NButton type="primary" ghost :loading="saving" @click="saveOptions">保存</NButton>
      </NSpace>
      <div class="summary">启用项 {{ activeCount }} / {{ items.length }}</div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="false"
        :bordered="true"
        :single-line="false"
        size="small"
      />
    </NCard>
  </NSpace>
</template>

<style scoped>
.summary {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}
</style>
