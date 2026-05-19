<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { NButton, NInput, NInputNumber, NSelect, NSpace, NSwitch, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps, SelectOption } from 'naive-ui';
import { fetchAiVoteConfig, fetchAiVoteLogs, updateAiVoteConfig } from '@/service/api/paperplane';

const loading = ref(false);
const saving = ref(false);
const logsLoading = ref(false);
const apiKeyInput = ref('');
const hasApiKey = ref(false);
const apiKeyMasked = ref('');
const configUpdatedAt = ref('');
const configUpdatedBy = ref('');

const config = reactive<Api.PaperPlane.UpdateAiVoteConfigPayload>({
  isEnabled: false,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 300,
  defaultOptionCount: 3,
  timeoutSeconds: 20,
  enableFallback: true,
  perUserMinuteLimit: 5,
  systemPrompt:
    '你是一个校园纸飞机应用的投票助手。根据用户输入内容，生成一个投票标题和2-4个选项。输出必须是 JSON 对象，格式：{"title":"...","options":["...","..."]}。要求：标题不超过60字，选项不超过20字，避免违法、辱骂、隐私暴露等不当内容。',
  clearApiKey: false
});

const filters = reactive({
  keyword: '',
  status: '',
  source: '',
  page: 1,
  pageSize: 20
});

const logs = ref<Api.PaperPlane.AiVoteLog[]>([]);
const total = ref(0);

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' }
];

const sourceOptions: SelectOption[] = [
  { label: '全部来源', value: '' },
  { label: 'AI', value: 'ai' },
  { label: 'Fallback', value: 'fallback' }
];

const pagination = computed<PaginationProps>(() => ({
  page: filters.page,
  pageSize: filters.pageSize,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange(page) {
    filters.page = page;
    void loadLogs();
  },
  onUpdatePageSize(pageSize) {
    filters.page = 1;
    filters.pageSize = pageSize;
    void loadLogs();
  }
}));

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN');
}

const columns: DataTableColumns<Api.PaperPlane.AiVoteLog> = [
  {
    title: '时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return formatDateTime(row.createTime);
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 88,
    render(row) {
      const isSuccess = row.status === 'success';
      return h(
        NTag,
        {
          type: isSuccess ? 'success' : 'error',
          size: 'small'
        },
        () => (isSuccess ? '成功' : '失败')
      );
    }
  },
  {
    title: '来源',
    key: 'source',
    width: 100,
    render(row) {
      return h(
        NTag,
        {
          type: row.source === 'ai' ? 'info' : 'warning',
          size: 'small'
        },
        () => row.source
      );
    }
  },
  {
    title: '输入内容',
    key: 'contentPreview',
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  {
    title: '生成标题',
    key: 'generatedTitle',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render(row) {
      return row.generatedTitle || '-';
    }
  },
  {
    title: '生成选项',
    key: 'generatedOptions',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render(row) {
      return row.generatedOptions?.length ? row.generatedOptions.join(' / ') : '-';
    }
  },
  {
    title: '耗时(ms)',
    key: 'durationMs',
    width: 96
  },
  {
    title: '错误/兜底原因',
    key: 'errorMessage',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render(row) {
      return row.errorMessage || '-';
    }
  },
  {
    title: 'RequestId',
    key: 'requestId',
    width: 240,
    ellipsis: { tooltip: true }
  }
];

async function loadConfig() {
  loading.value = true;
  try {
    const { data, error } = await fetchAiVoteConfig();
    if (error) throw error;
    if (!data) return;

    config.isEnabled = data.isEnabled;
    config.baseUrl = data.baseUrl;
    config.model = data.model;
    config.temperature = Number(data.temperature || 0.7);
    config.maxTokens = Number(data.maxTokens || 300);
    config.defaultOptionCount = Number(data.defaultOptionCount || 3);
    config.timeoutSeconds = Number(data.timeoutSeconds || 20);
    config.enableFallback = Boolean(data.enableFallback);
    config.perUserMinuteLimit = Number(data.perUserMinuteLimit || 5);
    config.systemPrompt = data.systemPrompt || '';
    config.clearApiKey = false;
    apiKeyInput.value = '';
    hasApiKey.value = Boolean(data.hasApiKey);
    apiKeyMasked.value = data.apiKeyMasked || '';
    configUpdatedAt.value = data.updateTime || '';
    configUpdatedBy.value = data.updatedBy || '';
  } catch (error) {
    console.error(error);
    window.$message?.error('加载AI配置失败');
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  const baseUrl = String(config.baseUrl || '').trim();
  const model = String(config.model || '').trim();
  const systemPrompt = String(config.systemPrompt || '').trim();
  const apiKey = String(apiKeyInput.value || '').trim();

  if (!baseUrl) {
    window.$message?.warning('请填写 Base URL');
    return;
  }
  if (!model) {
    window.$message?.warning('请填写模型名称');
    return;
  }
  if (!systemPrompt) {
    window.$message?.warning('请填写系统提示词');
    return;
  }

  saving.value = true;
  try {
    const payload: Api.PaperPlane.UpdateAiVoteConfigPayload = {
      isEnabled: Boolean(config.isEnabled),
      baseUrl,
      model,
      temperature: Number(config.temperature || 0.7),
      maxTokens: Number(config.maxTokens || 300),
      defaultOptionCount: Number(config.defaultOptionCount || 3),
      timeoutSeconds: Number(config.timeoutSeconds || 20),
      enableFallback: Boolean(config.enableFallback),
      perUserMinuteLimit: Number(config.perUserMinuteLimit || 0),
      systemPrompt,
      apiKey: apiKey || undefined,
      clearApiKey: Boolean(config.clearApiKey)
    };
    const { data, error } = await updateAiVoteConfig(payload);
    if (error) throw error;
    if (!data) return;
    window.$message?.success('AI配置已保存');
    await loadConfig();
  } catch (error) {
    console.error(error);
    window.$message?.error('保存AI配置失败');
  } finally {
    saving.value = false;
  }
}

async function loadLogs() {
  logsLoading.value = true;
  try {
    const params = {
      keyword: filters.keyword.trim() || undefined,
      status: (filters.status || undefined) as 'success' | 'failed' | undefined,
      source: (filters.source || undefined) as 'ai' | 'fallback' | undefined,
      page: filters.page,
      pageSize: filters.pageSize
    };
    const { data, error } = await fetchAiVoteLogs(params);
    if (error) throw error;
    logs.value = data?.items || [];
    total.value = Number(data?.total || 0);
  } catch (error) {
    console.error(error);
    window.$message?.error('加载日志失败');
  } finally {
    logsLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadLogs();
}

function handleReset() {
  filters.keyword = '';
  filters.status = '';
  filters.source = '';
  filters.page = 1;
  void loadLogs();
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadLogs()]);
});
</script>

<template>
  <NSpace vertical :size="12">
    <NCard :bordered="false" class="card-wrapper" title="AI投票配置">
      <NSpace vertical :size="10">
        <NSpace :size="14" align="center" wrap>
          <span class="field-label">启用AI</span>
          <NSwitch v-model:value="config.isEnabled" />
          <span class="field-label">启用失败回退</span>
          <NSwitch v-model:value="config.enableFallback" />
        </NSpace>

        <NSpace :size="12" wrap>
          <NInput v-model:value="config.baseUrl" placeholder="Base URL (例如 https://api.openai.com/v1)" style="width: 360px" />
          <NInput v-model:value="config.model" placeholder="模型名 (例如 gpt-4o-mini)" style="width: 220px" />
          <NInputNumber v-model:value="config.temperature" :min="0" :max="2" :step="0.1" style="width: 140px" placeholder="温度" />
          <NInputNumber v-model:value="config.maxTokens" :min="64" :max="1024" :step="16" style="width: 140px" placeholder="MaxTokens" />
          <NInputNumber v-model:value="config.defaultOptionCount" :min="2" :max="4" :step="1" style="width: 140px" placeholder="默认选项数" />
          <NInputNumber v-model:value="config.timeoutSeconds" :min="5" :max="60" :step="1" style="width: 140px" placeholder="超时秒数" />
          <NInputNumber v-model:value="config.perUserMinuteLimit" :min="0" :max="30" :step="1" style="width: 160px" placeholder="每用户每分钟限制" />
        </NSpace>

        <NSpace :size="12" align="center" wrap>
          <NInput
            v-model:value="apiKeyInput"
            type="password"
            placeholder="输入新 API Key（留空不修改）"
            show-password-on="click"
            style="width: 420px"
          />
          <span class="muted">{{ hasApiKey ? `当前Key：${apiKeyMasked}` : '当前未配置API Key' }}</span>
          <span class="field-label">清空Key</span>
          <NSwitch v-model:value="config.clearApiKey" />
        </NSpace>

        <NInput
          v-model:value="config.systemPrompt"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          placeholder="系统提示词"
        />

        <NSpace :size="8" wrap>
          <NButton :loading="loading" @click="loadConfig">刷新配置</NButton>
          <NButton type="primary" ghost :loading="saving" @click="saveConfig">保存配置</NButton>
          <span class="muted">最后更新：{{ configUpdatedAt ? formatDateTime(configUpdatedAt) : '-' }} {{ configUpdatedBy ? `(${configUpdatedBy})` : '' }}</span>
        </NSpace>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper" title="AI投票日志">
      <NSpace :size="10" wrap>
        <NInput
          v-model:value="filters.keyword"
          clearable
          placeholder="关键词（内容 / 标题 / 错误 / RequestId）"
          style="width: 320px"
          @keyup.enter="handleSearch"
        />
        <NSelect v-model:value="filters.status" :options="statusOptions" style="width: 140px" />
        <NSelect v-model:value="filters.source" :options="sourceOptions" style="width: 140px" />
        <NButton type="primary" @click="handleSearch">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </NSpace>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        :columns="columns"
        :data="logs"
        :loading="logsLoading"
        :pagination="pagination"
        size="small"
        :scroll-x="1700"
      />
    </NCard>
  </NSpace>
</template>

<style scoped>
.field-label {
  font-size: 13px;
  color: #606266;
}

.muted {
  font-size: 12px;
  color: #909399;
}
</style>
