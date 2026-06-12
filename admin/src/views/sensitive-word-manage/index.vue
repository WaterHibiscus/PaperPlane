<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NButton, NInput, NInputNumber, NPopconfirm, NSelect, NSpace, NSwitch, NTag } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  adoptSensitiveWordAiSuggestion,
  deleteSensitiveWordAiSuggestion,
  fetchSensitiveWordAiSuggestions,
  fetchSensitiveWords,
  updateSensitiveWords
} from '@/service/api/paperplane';

interface SensitiveWordRow {
  index: number;
  word: string;
  category: Api.PaperPlane.SensitiveWordConfig['category'];
  matchMode: Api.PaperPlane.SensitiveWordConfig['matchMode'];
  handleMode: Api.PaperPlane.SensitiveWordConfig['handleMode'];
  replaceText: string | null;
  scope: string;
  severity: number;
  priority: number;
  isEnabled: boolean;
  remark: string | null;
}

const loading = ref(false);
const saving = ref(false);
const aiLoading = ref(false);
const actingIds = ref<number[]>([]);
const items = ref<Api.PaperPlane.SensitiveWordConfig[]>([]);
const snapshot = ref<Api.PaperPlane.SensitiveWordConfig[]>([]);
const aiSuggestions = ref<Api.PaperPlane.SensitiveWordAiSuggestion[]>([]);

const categoryOptions = [
  { label: '通用 GENERAL', value: 'GENERAL' },
  { label: '辱骂 ABUSE', value: 'ABUSE' },
  { label: '广告 ADS', value: 'ADS' },
  { label: '联系方式 CONTACT', value: 'CONTACT' }
];

const matchModeOptions = [
  { label: '包含 CONTAINS', value: 'CONTAINS' },
  { label: '完全匹配 EXACT', value: 'EXACT' }
];

const handleModeOptions = [
  { label: '拦截 BLOCK', value: 'BLOCK' },
  { label: '人工复核 REVIEW', value: 'REVIEW' },
  { label: '替换 REPLACE', value: 'REPLACE' }
];

const scopeOptions = [
  { label: '纸飞机正文 PLANE', value: 'PLANE' },
  { label: '评论 COMMENT', value: 'COMMENT' },
  { label: '昵称 NICKNAME', value: 'NICKNAME' }
];

const scopeLabelMap: Record<string, string> = {
  PLANE: '正文',
  COMMENT: '评论',
  NICKNAME: '昵称'
};

const categoryLabelMap: Record<Api.PaperPlane.SensitiveWordConfig['category'], string> = {
  GENERAL: '通用',
  ABUSE: '辱骂',
  ADS: '广告',
  CONTACT: '联系方式'
};

const handleLabelMap: Record<Api.PaperPlane.SensitiveWordConfig['handleMode'], string> = {
  BLOCK: '拦截',
  REVIEW: '复核',
  REPLACE: '替换'
};

const tableData = computed<SensitiveWordRow[]>(() =>
  items.value.map((item, index) => ({
    index,
    word: item.word,
    category: item.category,
    matchMode: item.matchMode,
    handleMode: item.handleMode,
    replaceText: item.replaceText,
    scope: item.scope,
    severity: item.severity,
    priority: item.priority,
    isEnabled: item.isEnabled,
    remark: item.remark
  }))
);

function cloneItems(source: Api.PaperPlane.SensitiveWordConfig[]) {
  return source.map(item => ({
    id: item.id,
    word: item.word,
    category: item.category,
    matchMode: item.matchMode,
    handleMode: item.handleMode,
    replaceText: item.replaceText,
    scope: item.scope,
    severity: Number(item.severity || 3),
    priority: Number(item.priority || 100),
    isEnabled: Boolean(item.isEnabled),
    remark: item.remark
  }));
}

function parseScope(scope: string) {
  return scope
    .split(',')
    .map(item => item.trim().toUpperCase())
    .filter(Boolean);
}

function formatScope(values: string[]) {
  return Array.from(new Set(values.map(item => item.trim().toUpperCase()))).join(',');
}

function formatScopeText(scope: string) {
  return parseScope(scope)
    .map(item => scopeLabelMap[item] || item)
    .join(' / ');
}

function formatDateTime(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function setWord(index: number, value: string) {
  items.value[index].word = value;
}

function setCategory(index: number, value: string) {
  items.value[index].category = value as Api.PaperPlane.SensitiveWordConfig['category'];
}

function setMatchMode(index: number, value: string) {
  items.value[index].matchMode = value as Api.PaperPlane.SensitiveWordConfig['matchMode'];
}

function setHandleMode(index: number, value: string) {
  items.value[index].handleMode = value as Api.PaperPlane.SensitiveWordConfig['handleMode'];
}

function setReplaceText(index: number, value: string) {
  items.value[index].replaceText = value || null;
}

function setScope(index: number, values: string[]) {
  items.value[index].scope = formatScope(values);
}

function setSeverity(index: number, value: number | null) {
  items.value[index].severity = Number(value || 1);
}

function setPriority(index: number, value: number | null) {
  items.value[index].priority = Number(value || 0);
}

function setEnabled(index: number, value: boolean) {
  items.value[index].isEnabled = value;
}

function setRemark(index: number, value: string) {
  items.value[index].remark = value || null;
}

function addItem() {
  items.value.push({
    id: crypto.randomUUID(),
    word: '',
    category: 'GENERAL',
    matchMode: 'CONTAINS',
    handleMode: 'BLOCK',
    replaceText: null,
    scope: 'PLANE,COMMENT,NICKNAME',
    severity: 3,
    priority: 100,
    isEnabled: true,
    remark: null
  });
}

function removeItem(index: number) {
  items.value.splice(index, 1);
}

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.value.length) return;
  [items.value[index], items.value[target]] = [items.value[target], items.value[index]];
}

function markActing(id: number, active: boolean) {
  if (active) {
    if (!actingIds.value.includes(id)) {
      actingIds.value = [...actingIds.value, id];
    }
    return;
  }

  actingIds.value = actingIds.value.filter(item => item !== id);
}

function isActing(id: number) {
  return actingIds.value.includes(id);
}

function mergeWordBankItem(target: Api.PaperPlane.SensitiveWordConfig[], nextItem: Api.PaperPlane.SensitiveWordConfig) {
  const normalizedWord = nextItem.word.trim().toLowerCase();
  const index = target.findIndex(item => item.word.trim().toLowerCase() === normalizedWord);
  if (index >= 0) {
    target[index] = {
      ...target[index],
      ...nextItem
    };
    return;
  }

  target.push({ ...nextItem });
}

function removeAiSuggestion(id: number) {
  aiSuggestions.value = aiSuggestions.value.filter(item => item.id !== id);
}

const columns = computed<DataTableColumns<SensitiveWordRow>>(() => [
  {
    title: '序号',
    key: 'index',
    width: 70,
    render(row) {
      return row.index + 1;
    }
  },
  {
    title: '敏感词',
    key: 'word',
    minWidth: 160,
    render(row) {
      return h(NInput, {
        value: row.word,
        maxlength: 100,
        placeholder: '输入敏感词',
        'onUpdate:value': (value: string) => setWord(row.index, value)
      });
    }
  },
  {
    title: '分类',
    key: 'category',
    width: 150,
    render(row) {
      return h(NSelect, {
        value: row.category,
        options: categoryOptions,
        onUpdateValue: (value: string) => setCategory(row.index, value)
      });
    }
  },
  {
    title: '匹配',
    key: 'matchMode',
    width: 130,
    render(row) {
      return h(NSelect, {
        value: row.matchMode,
        options: matchModeOptions,
        onUpdateValue: (value: string) => setMatchMode(row.index, value)
      });
    }
  },
  {
    title: '处理',
    key: 'handleMode',
    width: 140,
    render(row) {
      return h(NSelect, {
        value: row.handleMode,
        options: handleModeOptions,
        onUpdateValue: (value: string) => setHandleMode(row.index, value)
      });
    }
  },
  {
    title: '生效范围',
    key: 'scope',
    minWidth: 220,
    render(row) {
      return h(NSelect, {
        value: parseScope(row.scope),
        options: scopeOptions,
        multiple: true,
        clearable: false,
        onUpdateValue: (values: string[]) => setScope(row.index, values)
      });
    }
  },
  {
    title: '优先级',
    key: 'priority',
    width: 110,
    render(row) {
      return h(NInputNumber, {
        value: row.priority,
        min: 0,
        max: 9999,
        precision: 0,
        style: 'width: 100px',
        'onUpdate:value': (value: number | null) => setPriority(row.index, value)
      });
    }
  },
  {
    title: '严重级别',
    key: 'severity',
    width: 120,
    render(row) {
      return h(NInputNumber, {
        value: row.severity,
        min: 1,
        max: 10,
        precision: 0,
        style: 'width: 100px',
        'onUpdate:value': (value: number | null) => setSeverity(row.index, value)
      });
    }
  },
  {
    title: '替换文本',
    key: 'replaceText',
    minWidth: 160,
    render(row) {
      return h(NInput, {
        value: row.replaceText ?? '',
        maxlength: 50,
        placeholder: '仅 REPLACE 模式可填',
        disabled: row.handleMode !== 'REPLACE',
        'onUpdate:value': (value: string) => setReplaceText(row.index, value)
      });
    }
  },
  {
    title: '启用',
    key: 'isEnabled',
    width: 90,
    render(row) {
      return h(NSwitch, {
        value: row.isEnabled,
        'onUpdate:value': (value: boolean) => setEnabled(row.index, value)
      });
    }
  },
  {
    title: '备注',
    key: 'remark',
    minWidth: 180,
    render(row) {
      return h(NInput, {
        value: row.remark ?? '',
        maxlength: 200,
        placeholder: '备注',
        'onUpdate:value': (value: string) => setRemark(row.index, value)
      });
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    render(row) {
      return h(
        NSpace,
        { size: 6 },
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

const aiColumns = computed<DataTableColumns<Api.PaperPlane.SensitiveWordAiSuggestion>>(() => [
  {
    title: '建议敏感词',
    key: 'suggestedWord',
    minWidth: 140
  },
  {
    title: '分类',
    key: 'category',
    width: 110,
    render(row) {
      return h(
        NTag,
        { type: row.category === 'ABUSE' ? 'error' : row.category === 'ADS' ? 'warning' : 'info', bordered: false },
        { default: () => categoryLabelMap[row.category] || row.category }
      );
    }
  },
  {
    title: '范围',
    key: 'scope',
    width: 140,
    render(row) {
      return formatScopeText(row.scope);
    }
  },
  {
    title: '处理建议',
    key: 'handleMode',
    width: 110,
    render(row) {
      return handleLabelMap[row.handleMode] || row.handleMode;
    }
  },
  {
    title: '命中内容预览',
    key: 'sourceTextPreview',
    minWidth: 220
  },
  {
    title: 'AI 理由',
    key: 'reason',
    minWidth: 220,
    render(row) {
      return row.reason || '-';
    }
  },
  {
    title: '置信度',
    key: 'confidence',
    width: 100,
    render(row) {
      return row.confidence == null ? '-' : `${Math.round(row.confidence * 100)}%`;
    }
  },
  {
    title: '发现时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return formatDateTime(row.createTime);
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      return h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NPopconfirm,
              {
                onPositiveClick: () => adoptSuggestion(row.id)
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'primary',
                      loading: isActing(row.id)
                    },
                    { default: () => '采纳入库' }
                  ),
                default: () => `确认采纳“${row.suggestedWord}”并加入词库吗？`
              }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => dismissSuggestion(row.id)
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error',
                      ghost: true,
                      loading: isActing(row.id)
                    },
                    { default: () => '不采纳' }
                  ),
                default: () => '确认删除这条 AI 建议吗？'
              }
            )
          ]
        }
      );
    }
  }
]);

async function loadWordBank() {
  loading.value = true;
  try {
    const { data, error } = await fetchSensitiveWords();
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    items.value = cloneItems(list);
    snapshot.value = cloneItems(list);
  } catch (error) {
    console.error(error);
    window.$message?.error('加载敏感词词库失败');
  } finally {
    loading.value = false;
  }
}

async function loadAiSuggestions() {
  aiLoading.value = true;
  try {
    const { data, error } = await fetchSensitiveWordAiSuggestions();
    if (error) throw error;
    aiSuggestions.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
    window.$message?.error('加载 AI 待采纳词失败');
  } finally {
    aiLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadWordBank(), loadAiSuggestions()]);
}

function resetAll() {
  items.value = cloneItems(snapshot.value);
}

function validateItems() {
  const set = new Set<string>();

  for (const item of items.value) {
    item.word = String(item.word || '').trim();
    item.scope = formatScope(parseScope(item.scope));
    item.priority = Number(item.priority || 0);
    item.severity = Number(item.severity || 1);
    item.replaceText = item.replaceText ? String(item.replaceText).trim() : null;
    item.remark = item.remark ? String(item.remark).trim() : null;

    if (!item.word) {
      window.$message?.warning('敏感词不能为空');
      return false;
    }

    const normalizedWord = item.word.toLowerCase();
    if (set.has(normalizedWord)) {
      window.$message?.warning(`敏感词重复：${item.word}`);
      return false;
    }
    set.add(normalizedWord);

    if (!item.scope) {
      window.$message?.warning(`请至少选择一个生效范围：${item.word}`);
      return false;
    }

    if (item.handleMode === 'REPLACE' && !item.replaceText) {
      window.$message?.warning(`REPLACE 模式需要配置替换文本：${item.word}`);
      return false;
    }
  }

  return true;
}

async function saveAll() {
  if (!validateItems()) return;
  saving.value = true;
  try {
    const payload = { items: cloneItems(items.value) };
    const { data, error } = await updateSensitiveWords(payload);
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    items.value = cloneItems(list);
    snapshot.value = cloneItems(list);
    window.$message?.success('敏感词词库保存成功');
  } catch (error) {
    console.error(error);
    window.$message?.error('敏感词词库保存失败');
  } finally {
    saving.value = false;
  }
}

async function adoptSuggestion(id: number) {
  markActing(id, true);
  try {
    const { data, error } = await adoptSensitiveWordAiSuggestion(id);
    if (error) throw error;
    if (data) {
      mergeWordBankItem(snapshot.value, data);
      mergeWordBankItem(items.value, data);
    }
    removeAiSuggestion(id);
    window.$message?.success('已采纳并加入词库');
  } catch (error) {
    console.error(error);
    window.$message?.error('采纳失败');
  } finally {
    markActing(id, false);
  }
}

async function dismissSuggestion(id: number) {
  markActing(id, true);
  try {
    const { error } = await deleteSensitiveWordAiSuggestion(id);
    if (error) throw error;
    removeAiSuggestion(id);
    window.$message?.success('已删除待采纳记录');
  } catch (error) {
    console.error(error);
    window.$message?.error('删除失败');
  } finally {
    markActing(id, false);
  }
}

onMounted(() => {
  void refreshAll();
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace justify="space-between" align="center" wrap>
        <div>
          <div class="panel-title">敏感词词库</div>
          <div class="panel-desc">本地词库优先拦截；未命中的内容会继续走 AI 审核，并把疑似敏感词送到下方待采纳列表。AI 审核复用“AI投票管理”里的模型连接配置。</div>
        </div>
        <NSpace :size="8" wrap>
          <NButton type="primary" @click="addItem">新增敏感词</NButton>
          <NButton :disabled="loading || aiLoading" @click="refreshAll">刷新全部</NButton>
          <NButton :disabled="saving" @click="resetAll">重置词库</NButton>
          <NButton type="primary" ghost :loading="saving" @click="saveAll">保存词库</NButton>
        </NSpace>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper" title="词库管理">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="false"
        :single-line="false"
        size="small"
      />
    </NCard>

    <NCard :bordered="false" class="card-wrapper" title="AI 待采纳词">
      <div class="summary-row">
        <span>这里展示 AI 在词库未命中时拦截出来的疑似敏感词。点击“采纳入库”后会自动加入词库，并从待采纳列表移除。</span>
        <span class="summary-count">当前 {{ aiSuggestions.length }} 条</span>
      </div>
      <NDataTable
        :columns="aiColumns"
        :data="aiSuggestions"
        :loading="aiLoading"
        :pagination="false"
        :single-line="false"
        size="small"
      />
    </NCard>
  </NSpace>
</template>

<style scoped>
.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.panel-desc {
  margin-top: 6px;
  max-width: 760px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.summary-count {
  white-space: nowrap;
  color: #374151;
  font-weight: 600;
}

@media (max-width: 900px) {
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
