<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import { updatePlane, uploadPlaneImage } from '@/service/api/paperplane';

interface Props {
  show: boolean;
  plane: Api.PaperPlane.Plane | null;
  moodConfigs: Api.PaperPlane.MoodConfig[];
  expireOptions: Api.PaperPlane.ExpireOptionConfig[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'saved', plane: Api.PaperPlane.Plane): void;
}>();

const limits = {
  location: 50,
  content: 200,
  mood: 20,
  author: 30,
  voteTitle: 60,
  voteOption: 30,
  maxVoteOptions: 4,
  maxImages: 9
} as const;

const fallbackMoodOptions: SelectOption[] = [
  { label: '开心', value: 'happy' },
  { label: '难过', value: 'sad' },
  { label: '平静', value: 'calm' },
  { label: '愤怒', value: 'angry' },
  { label: '心动', value: 'love' }
];

const fallbackExpireOptionValues = [24, 48, 72];

const formRef = ref<FormInst | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const submitting = ref(false);
const uploading = ref(false);

const form = reactive({
  locationTag: '',
  content: '',
  mood: '',
  isAnonymous: true,
  authorName: '',
  voteEnabled: false,
  voteTitle: '',
  voteOptions: ['', ''] as string[],
  imageUrls: [] as string[],
  expireHours: 24
});

const activeMoodOptions = computed<SelectOption[]>(() => {
  const configOptions = props.moodConfigs
    .filter(item => item.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(item => ({
      label: item.label,
      value: item.key
    }));

  const options = configOptions.length ? [...configOptions] : [...fallbackMoodOptions];
  const currentMood = form.mood.trim();

  if (currentMood && !options.some(item => item.value === currentMood)) {
    options.unshift({
      label: `当前：${currentMood}`,
      value: currentMood
    });
  }

  return options;
});

const activeExpireOptions = computed<SelectOption[]>(() => {
  const configOptions = props.expireOptions
    .filter(item => item.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(item => ({
      label: item.label,
      value: item.hours
    }));

  const options = configOptions.length
    ? [...configOptions]
    : fallbackExpireOptionValues.map(hours => ({
        label: `${hours} 小时`,
        value: hours
      }));

  if (!options.some(item => item.value === form.expireHours)) {
    options.unshift({
      label: `当前剩余约 ${form.expireHours} 小时`,
      value: form.expireHours
    });
  }

  return options;
});

const normalizedVoteOptions = computed(() => form.voteOptions.map(item => item.trim()).filter(Boolean));
const normalizedImageUrls = computed(() => form.imageUrls.map(item => normalizeAssetUrl(item)).filter(Boolean));

const rules: FormRules = {
  locationTag: [
    {
      required: true,
      trigger: ['input', 'blur'],
      validator: (_rule, value: string) => validateRequiredText(value, '地点', limits.location)
    }
  ],
  content: [
    {
      required: true,
      trigger: ['input', 'blur'],
      validator: (_rule, value: string) => validateRequiredText(value, '正文', limits.content)
    }
  ],
  mood: [
    {
      required: true,
      trigger: ['change', 'blur'],
      validator: (_rule, value: string) => validateRequiredText(value, '情绪', limits.mood)
    }
  ],
  authorName: [
    {
      trigger: ['input', 'blur'],
      validator: (_rule, value: string) => {
        if (form.isAnonymous) return true;
        return validateRequiredText(value, '作者名', limits.author);
      }
    }
  ],
  voteTitle: [
    {
      trigger: ['input', 'blur'],
      validator: (_rule, value: string) => {
        if (!form.voteEnabled) return true;
        return validateRequiredText(value, '投票标题', limits.voteTitle);
      }
    }
  ],
  voteOptions: [
    {
      trigger: ['input', 'blur', 'change'],
      validator: () => {
        if (!form.voteEnabled) return true;
        if (form.voteOptions.length > limits.maxVoteOptions) {
          return new Error(`投票选项最多 ${limits.maxVoteOptions} 个`);
        }

        const oversizedOption = form.voteOptions.find(item => item.trim().length > limits.voteOption);
        if (oversizedOption) {
          return new Error(`投票选项不能超过 ${limits.voteOption} 个字符`);
        }

        if (normalizedVoteOptions.value.length < 2) {
          return new Error('至少保留 2 个有效投票选项');
        }

        return true;
      }
    }
  ],
  expireHours: [
    {
      required: true,
      trigger: ['change', 'blur'],
      validator: (_rule, value: number) => {
        const hours = Number(value);
        if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
          return new Error('请选择有效的存活时长');
        }
        return true;
      }
    }
  ]
};

watch(
  () => [props.show, props.plane?.id],
  async ([visible]) => {
    if (!visible || !props.plane) return;
    resetForm(props.plane);
    await nextTick();
    formRef.value?.restoreValidation();
  },
  { immediate: true }
);

watch(
  () => form.isAnonymous,
  value => {
    if (value) {
      form.authorName = '';
    }
  }
);

watch(
  () => form.voteEnabled,
  value => {
    if (value && form.voteOptions.length < 2) {
      form.voteOptions = ['', ''];
    }
  }
);

function validateRequiredText(value: string | null | undefined, label: string, maxLength: number) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return new Error(`${label}不能为空`);
  }

  if (normalized.length > maxLength) {
    return new Error(`${label}不能超过 ${maxLength} 个字符`);
  }

  return true;
}

function getDefaultExpireHours() {
  const firstOption = activeExpireOptions.value[0];
  return typeof firstOption?.value === 'number' ? firstOption.value : 24;
}

function resolveExpireHours(plane: Api.PaperPlane.Plane) {
  const expireTime = new Date(plane.expireTime).getTime();
  if (Number.isNaN(expireTime)) return getDefaultExpireHours();

  const hours = Math.ceil((expireTime - Date.now()) / (60 * 60 * 1000));
  return Math.min(168, Math.max(1, hours || getDefaultExpireHours()));
}

function resetForm(plane: Api.PaperPlane.Plane) {
  const nextVoteOptions = plane.voteOptions?.slice(0, limits.maxVoteOptions) || [];

  form.locationTag = plane.locationTag || '';
  form.content = plane.content || '';
  form.mood = plane.mood || activeMoodOptions.value[0]?.value?.toString() || 'calm';
  form.isAnonymous = plane.isAnonymous !== false;
  form.authorName = plane.authorName || '';
  form.voteEnabled = nextVoteOptions.length >= 2;
  form.voteTitle = plane.voteTitle || '';
  form.voteOptions = nextVoteOptions.length ? [...nextVoteOptions] : ['', ''];
  form.imageUrls = plane.imageUrls ? [...plane.imageUrls].slice(0, limits.maxImages) : [];
  form.expireHours = resolveExpireHours(plane);
}

function getServiceBaseUrl() {
  const rawBase = import.meta.env.VITE_SERVICE_BASE_URL || 'http://localhost:5000';
  return rawBase.replace(/\/api\/?$/, '');
}

function normalizeAssetUrl(url: string | null | undefined) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const base = getServiceBaseUrl();
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

function handleModalShowChange(value: boolean) {
  if (!value && submitting.value) return;
  emit('update:show', value);
}

function handleCancel() {
  handleModalShowChange(false);
}

function addVoteOption() {
  if (form.voteOptions.length >= limits.maxVoteOptions) return;
  form.voteOptions = [...form.voteOptions, ''];
}

function removeVoteOption(index: number) {
  if (form.voteOptions.length <= 2) {
    window.$message?.warning('至少保留 2 个选项；如需关闭投票，请关闭“启用投票”');
    return;
  }

  form.voteOptions = form.voteOptions.filter((_, optionIndex) => optionIndex !== index);
}

function removeImage(index: number) {
  form.imageUrls = form.imageUrls.filter((_, imageIndex) => imageIndex !== index);
}

function triggerSelectImage() {
  if (uploading.value || submitting.value) return;
  fileInputRef.value?.click();
}

async function handleSelectImage(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const files = Array.from(input?.files || []);

  if (!files.length) return;

  const remainingCount = limits.maxImages - form.imageUrls.length;
  if (remainingCount <= 0) {
    window.$message?.warning(`最多上传 ${limits.maxImages} 张图片`);
    if (input) input.value = '';
    return;
  }

  uploading.value = true;
  let successCount = 0;

  try {
    for (const file of files.slice(0, remainingCount)) {
      if (!file.type.startsWith('image/')) {
        window.$message?.warning(`${file.name} 不是图片文件，已跳过`);
        continue;
      }

      const { data, error } = await uploadPlaneImage(file);
      if (error) throw error;
      if (!data?.url) throw new Error('图片上传返回为空');

      form.imageUrls = [...form.imageUrls, data.url];
      successCount += 1;
    }

    if (successCount > 0) {
      window.$message?.success(`成功上传 ${successCount} 张图片`);
    }
  } catch (error) {
    console.error(error);
    const status = Number((error as any)?.response?.status || 0);
    const backendMessage = String((error as any)?.response?.data?.message || '').trim();
    if (backendMessage) {
      window.$message?.error(backendMessage);
      return;
    }
    if (status === 400) {
      window.$message?.error('提交数据不符合后端校验规则');
      return;
    }
    if (status === 404) {
      window.$message?.error('未找到可修改的数据');
      return;
    }
    window.$message?.error('图片上传失败');
  } finally {
    uploading.value = false;
    if (input) input.value = '';
  }
}

async function handleSubmit() {
  if (!props.plane) return;

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitting.value = true;

  try {
    const payload: Api.PaperPlane.UpdatePlanePayload = {
      locationTag: form.locationTag.trim(),
      content: form.content.trim(),
      mood: form.mood.trim(),
      isAnonymous: form.isAnonymous,
      authorName: form.isAnonymous ? '' : form.authorName.trim(),
      imageUrls: [...form.imageUrls],
      expireHours: Number(form.expireHours || getDefaultExpireHours()),
      voteTitle: form.voteEnabled ? form.voteTitle.trim() : '',
      voteOptions: form.voteEnabled ? [...normalizedVoteOptions.value] : []
    };

    const { data, error } = await updatePlane(props.plane.id, payload);
    if (error) throw error;
    if (!data) throw new Error('更新返回为空');

    emit('saved', data);
    emit('update:show', false);
  } catch (error) {
    console.error(error);
    const status = Number((error as any)?.response?.status || 0);
    const backendMessage = String((error as any)?.response?.data?.message || '').trim();
    if (backendMessage) {
      window.$message?.error(backendMessage);
      return;
    }
    if (status === 400) {
      window.$message?.error('提交数据不符合后端校验规则');
      return;
    }
    if (status === 404) {
      window.$message?.error('未找到可修改的数据');
      return;
    }
    window.$message?.error('修改失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NModal :show="show" :mask-closable="!submitting" @update:show="handleModalShowChange">
    <NCard
      :bordered="false"
      class="plane-edit-modal-card"
      role="dialog"
      aria-modal="true"
      title="修改纸飞机"
      closable
      @close="handleCancel"
    >
      <div class="plane-edit-modal-body">
        <div class="plane-edit-scroll">
          <div class="plane-edit-scroll-inner">
            <NForm ref="formRef" :model="form" :rules="rules" label-placement="top" require-mark-placement="right-hanging">
            <section class="form-section">
              <div class="section-head">
                <div>
                  <h3 class="section-title">基本信息</h3>
                  <p class="section-desc">修改地点、正文、情绪和显示身份，保存后右侧预览会同步刷新。</p>
                </div>
              </div>

              <div class="form-grid form-grid-two">
                <NFormItem label="地点" path="locationTag">
                  <NInput v-model:value="form.locationTag" :maxlength="limits.location" placeholder="请输入地点" clearable />
                </NFormItem>

                <NFormItem label="情绪" path="mood">
                  <NSelect v-model:value="form.mood" :options="activeMoodOptions" placeholder="请选择情绪" />
                </NFormItem>
              </div>

              <NFormItem label="正文内容" path="content">
                <NInput
                  v-model:value="form.content"
                  type="textarea"
                  :maxlength="limits.content"
                  :autosize="{ minRows: 5, maxRows: 8 }"
                  show-count
                  placeholder="请输入纸飞机正文"
                />
              </NFormItem>

              <div class="form-grid form-grid-two">
                <NFormItem label="匿名投递">
                  <NSwitch v-model:value="form.isAnonymous">
                    <template #checked>匿名</template>
                    <template #unchecked>实名</template>
                  </NSwitch>
                </NFormItem>

                <NFormItem label="存活时长" path="expireHours">
                  <NSelect v-model:value="form.expireHours" :options="activeExpireOptions" placeholder="请选择存活时长" />
                </NFormItem>
              </div>

              <NFormItem label="作者名" path="authorName">
                <NInput
                  v-model:value="form.authorName"
                  :maxlength="limits.author"
                  :disabled="form.isAnonymous"
                  :placeholder="form.isAnonymous ? '匿名投递时不展示作者名' : '请输入作者名'"
                  clearable
                />
              </NFormItem>
            </section>

            <section class="form-section">
              <div class="section-head">
                <div>
                  <h3 class="section-title">投票设置</h3>
                  <p class="section-desc">最多 4 个选项。关闭投票后，本条纸飞机将不展示投票区。</p>
                </div>

                <NSwitch v-model:value="form.voteEnabled">
                  <template #checked>启用</template>
                  <template #unchecked>关闭</template>
                </NSwitch>
              </div>

              <div v-if="form.voteEnabled" class="vote-panel">
                <NFormItem label="投票标题" path="voteTitle">
                  <NInput v-model:value="form.voteTitle" :maxlength="limits.voteTitle" placeholder="请输入投票标题" clearable />
                </NFormItem>

                <NFormItem path="voteOptions">
                  <template #label>
                    <div class="vote-option-label">
                      <span>投票选项</span>
                      <span class="vote-option-meta">{{ normalizedVoteOptions.length }}/{{ limits.maxVoteOptions }}</span>
                    </div>
                  </template>

                  <div class="vote-option-list">
                    <div v-for="(option, index) in form.voteOptions" :key="`vote-option-${index}`" class="vote-option-row">
                      <NInput
                        v-model:value="form.voteOptions[index]"
                        :maxlength="limits.voteOption"
                        :placeholder="`请输入选项 ${index + 1}`"
                        clearable
                      />
                      <NButton quaternary type="error" :disabled="form.voteOptions.length <= 2" @click="removeVoteOption(index)">
                        删除
                      </NButton>
                    </div>
                  </div>
                </NFormItem>

                <div class="vote-option-toolbar">
                  <NButton secondary :disabled="form.voteOptions.length >= limits.maxVoteOptions" @click="addVoteOption">新增选项</NButton>
                  <span class="section-tip">至少保留 2 个有效选项才会启用投票。</span>
                </div>
              </div>

              <div v-else class="section-empty">当前未启用投票，保存后右侧预览将隐藏投票区。</div>
            </section>

            <section class="form-section">
              <div class="section-head">
                <div>
                  <h3 class="section-title">图片设置</h3>
                  <p class="section-desc">支持预览、删除已有图片，也可以继续上传新图片。</p>
                </div>

                <NButton
                  size="small"
                  secondary
                  :loading="uploading"
                  :disabled="submitting || form.imageUrls.length >= limits.maxImages"
                  @click="triggerSelectImage"
                >
                  上传图片
                </NButton>
              </div>

              <input ref="fileInputRef" class="hidden-input" type="file" accept="image/*" multiple @change="handleSelectImage" />

              <div v-if="normalizedImageUrls.length" class="image-grid">
                <div v-for="(image, index) in normalizedImageUrls" :key="`${image}-${index}`" class="image-card">
                  <img class="image-preview" :src="image" :alt="`纸飞机图片 ${index + 1}`" />
                  <button class="image-remove" type="button" @click="removeImage(index)">删除</button>
                </div>
              </div>

              <div v-else class="section-empty">当前没有图片，保存为空即可。</div>

              <p class="section-tip">最多 {{ limits.maxImages }} 张图片，上传中的图片会自动追加到当前列表。</p>
            </section>
            </NForm>
          </div>
        </div>
        <div class="plane-edit-actions plane-edit-actions-inline">
          <span class="footer-tip">保存后会同步刷新左侧列表和右侧手机预览</span>
          <NSpace :size="12">
            <NButton :disabled="submitting" @click="handleCancel">取消</NButton>
            <NButton type="primary" :loading="submitting" @click="handleSubmit">保存修改</NButton>
          </NSpace>
        </div>
      </div>

      <template #footer>
        <div class="plane-edit-actions">
          <span class="footer-tip">保存后将同步刷新左侧列表与右侧手机预览</span>
          <NSpace :size="12">
            <NButton :disabled="submitting" @click="handleCancel">取消</NButton>
            <NButton type="primary" :loading="submitting" @click="handleSubmit">保存修改</NButton>
          </NSpace>
        </div>
      </template>
    </NCard>
  </NModal>
</template>

<style scoped>
.plane-edit-modal-card {
  width: min(680px, calc(100vw - 48px));
  height: min(82vh, 880px);
  max-height: min(82vh, 880px);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
}

.plane-edit-modal-card :deep(.n-card-header) {
  flex: 0 0 auto;
}

.plane-edit-modal-card :deep(.n-card__content) {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.plane-edit-modal-card :deep(.n-card__footer) {
  display: none !important;
}

.plane-edit-modal-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.plane-edit-scroll {
  flex: 1 1 auto;
  min-height: 0;
  height: calc(82vh - 210px);
  max-height: calc(82vh - 210px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.plane-edit-scroll-inner {
  padding: 20px 20px 12px;
}

.form-section {
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(250, 250, 252, 0.96), rgba(245, 247, 250, 0.96));
}

.form-section + .form-section {
  margin-top: 14px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #24384d;
}

.section-desc,
.section-tip,
.footer-tip,
.vote-option-meta {
  font-size: 12px;
  color: #6f879b;
}

.section-desc {
  margin: 6px 0 0;
  line-height: 1.6;
}

.section-empty {
  padding: 24px 12px;
  border: 1px dashed rgba(111, 135, 155, 0.35);
  border-radius: 14px;
  text-align: center;
  font-size: 13px;
  color: #6f879b;
  background: rgba(255, 255, 255, 0.72);
}

.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid-two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.vote-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vote-option-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.vote-option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vote-option-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.vote-option-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.image-card {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}

.image-preview {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 10px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.68);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.plane-edit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.plane-edit-actions-inline {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), #fff);
}

@media (max-width: 640px) {
  .plane-edit-scroll {
    height: calc(82vh - 248px);
    max-height: calc(82vh - 248px);
  }

  .form-grid-two,
  .image-grid {
    grid-template-columns: 1fr;
  }

  .vote-option-row,
  .vote-option-toolbar,
  .plane-edit-actions,
  .section-head {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
