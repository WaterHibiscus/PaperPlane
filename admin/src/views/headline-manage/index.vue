<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NInput, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchHomeHeadlinesConfig, updateHomeHeadlines } from '@/service/api/paperplane';

interface PhraseRow {
  index: number;
  content: string;
}

const maxPhraseCount = 12;
const phrases = ref<string[]>([]);
const savedPhrases = ref<string[]>([]);
const loading = ref(false);
const saving = ref(false);

const validCount = computed(() => phrases.value.map(item => item.trim()).filter(Boolean).length);
const tableData = computed<PhraseRow[]>(() => phrases.value.map((content, index) => ({ index, content })));

function setPhrase(index: number, value: string) {
  phrases.value[index] = value;
}

function addPhrase() {
  if (phrases.value.length >= maxPhraseCount) {
    window.$message?.warning(`最多可配置 ${maxPhraseCount} 条文案`);
    return;
  }

  phrases.value.push('');
}

function movePhrase(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= phrases.value.length) {
    return;
  }

  [phrases.value[index], phrases.value[target]] = [phrases.value[target], phrases.value[index]];
}

function removePhrase(index: number) {
  if (phrases.value.length === 1) {
    phrases.value[0] = '';
    return;
  }

  phrases.value.splice(index, 1);
}

const columns = computed<DataTableColumns<PhraseRow>>(() => [
  {
    title: '序号',
    key: 'index',
    width: 80,
    render(row) {
      return row.index + 1;
    }
  },
  {
    title: '文案',
    key: 'content',
    minWidth: 500,
    render(row) {
      return h(NInput, {
        value: row.content,
        type: 'text',
        maxlength: 36,
        clearable: true,
        placeholder: '请输入文字滚动文案',
        'onUpdate:value': (value: string) => setPhrase(row.index, value)
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
                onClick: () => movePhrase(row.index, -1)
              },
              { default: () => '上移' }
            ),
            h(
              NButton,
              {
                size: 'small',
                disabled: row.index === phrases.value.length - 1,
                onClick: () => movePhrase(row.index, 1)
              },
              { default: () => '下移' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => removePhrase(row.index)
              },
              { default: () => '删除' }
            )
          ]
        }
      );
    }
  }
]);

async function loadHeadlines() {
  loading.value = true;
  try {
    const { data, error } = await fetchHomeHeadlinesConfig();
    if (error) {
      throw error;
    }

    const nextPhrases = data?.phrases?.length ? [...data.phrases] : [''];
    phrases.value = nextPhrases;
    savedPhrases.value = [...nextPhrases];
  } catch (error) {
    console.error(error);
    window.$message?.error('加载文字滚动文案失败');
  } finally {
    loading.value = false;
  }
}

function resetChanges() {
  phrases.value = savedPhrases.value.length ? [...savedPhrases.value] : [''];
}

async function saveHeadlines() {
  const cleaned = phrases.value.map(item => item.trim()).filter(Boolean);
  if (!cleaned.length) {
    window.$message?.warning('请至少保留一条有效文案');
    return;
  }

  saving.value = true;
  try {
    const { data, error } = await updateHomeHeadlines({ phrases: phrases.value });
    if (error) {
      throw error;
    }

    const nextPhrases = data?.phrases?.length ? [...data.phrases] : [''];
    phrases.value = nextPhrases;
    savedPhrases.value = [...nextPhrases];
    window.$message?.success('保存成功');
  } catch (error) {
    console.error(error);
    window.$message?.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadHeadlines();
});
</script>

<template>
  <NSpace vertical :size="12">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace :size="8" wrap>
        <NButton type="primary" :disabled="phrases.length >= maxPhraseCount" @click="addPhrase">新增</NButton>
        <NButton :disabled="loading" @click="loadHeadlines">刷新</NButton>
        <NButton :disabled="saving" @click="resetChanges">重置</NButton>
        <NButton type="primary" ghost :loading="saving" @click="saveHeadlines">保存</NButton>
      </NSpace>
      <div class="mt-8px text-13px text-#909399">有效文案：{{ validCount }}/{{ maxPhraseCount }}</div>
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

<style scoped></style>
