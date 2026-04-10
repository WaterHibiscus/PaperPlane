<template>
	<view :class="['app-page', 'profile-edit-page', themeClass]">
		<view class="profile-edit-page__nav">
			<view class="profile-edit-page__nav-back" @tap="goBack">
				<image class="profile-edit-page__nav-back-icon" :src="backIcon" mode="aspectFit" />
				<text>返回</text>
			</view>
			<text class="profile-edit-page__nav-title">编辑个人资料</text>
			<view
				:class="['profile-edit-page__nav-save', { 'is-disabled': !canSave || saving }]"
				@tap="handleSave"
			>
				<text>{{ saving ? '保存中...' : '保存' }}</text>
			</view>
		</view>

		<text class="profile-edit-page__page-note">资料会同步到服务器，同一账号在多设备登录可保持一致。</text>

		<view class="profile-edit-page__profile-card">
			<view class="profile-edit-page__avatar">
				<image
					v-if="avatarDraft"
					class="profile-edit-page__avatar-image"
					:src="avatarPreviewUrl"
					mode="aspectFill"
				/>
				<text v-else class="profile-edit-page__avatar-fallback">{{ nicknameInitial }}</text>
			</view>

			<view class="profile-edit-page__avatar-actions">
				<view class="profile-edit-page__avatar-btn profile-edit-page__avatar-btn--primary" @tap="chooseAvatar">
					<text>更换头像</text>
				</view>
				<view v-if="avatarDraft" class="profile-edit-page__avatar-btn" @tap="clearAvatar">
					<text>恢复默认</text>
				</view>
			</view>

			<view class="profile-edit-page__identity">
				<text class="profile-edit-page__identity-name">{{ previewName }}</text>
				<text class="profile-edit-page__identity-meta">ID: {{ profileId }} · {{ previewGenderLabel }}</text>
				<text class="profile-edit-page__identity-bio">{{ previewBio }}</text>
			</view>
		</view>

		<view class="profile-edit-page__form-card">
			<view class="profile-edit-page__field">
				<text class="profile-edit-page__label">昵称</text>
				<text class="profile-edit-page__hint">用于不匿名评论时显示的名称</text>
				<input
					v-model="nicknameDraft"
					class="profile-edit-page__input"
					maxlength="12"
					placeholder="输入你的昵称"
					placeholder-class="placeholder-text"
				/>
			</view>

			<view class="profile-edit-page__field">
				<text class="profile-edit-page__label">性别</text>
				<text class="profile-edit-page__hint">仅用于补充个人资料展示</text>
				<view class="profile-edit-page__gender-row">
					<view
						v-for="option in genderOptions"
						:key="option.value"
						:class="['profile-edit-page__gender-chip', { 'is-active': genderDraft === option.value }]"
						@tap="genderDraft = option.value"
					>
						<text>{{ option.label }}</text>
					</view>
				</view>
			</view>

			<view class="profile-edit-page__field">
				<view class="profile-edit-page__field-head">
					<text class="profile-edit-page__label">个人简介</text>
					<text class="profile-edit-page__count">{{ bioDraft.length }}/200</text>
				</view>
				<text class="profile-edit-page__hint">写一句会显示在个人主页上的自我介绍</text>
				<textarea
					v-model="bioDraft"
					class="profile-edit-page__textarea"
					maxlength="200"
					placeholder="把想说的话写在这里。"
					placeholder-class="placeholder-text"
				/>
			</view>
		</view>

		<text class="profile-edit-page__footer-note">保存后会立即同步到“我的”页面。</text>

		<view
			:class="['profile-edit-page__primary-save', { 'is-disabled': !canSave || saving }]"
			@tap="handleSave"
		>
			<text>{{ saving ? '保存中...' : '保存资料' }}</text>
		</view>
	</view>
</template>

<script>
import { appState, setProfileAvatar, setProfileBio, setProfileGender, setProfileName, syncThemeWindow } from '../../common/app-state.js'
import { getVoterKey } from '../../common/storage.js'
import { getAssetUrl, getMyProfile, updateMyProfile, uploadMyAvatar } from '../../common/api.js'
import { uiIcons } from '../../common/ui-icons.js'

export default {
	data() {
		return {
			appState,
			backIcon: uiIcons.back,
			avatarDraft: '',
			nicknameDraft: '',
			genderDraft: 'secret',
			bioDraft: '',
			initialAvatar: '',
			saving: false,
			profileId: String(getVoterKey() || '').slice(-4).toUpperCase(),
			genderOptions: [
				{ label: '男', value: 'male' },
				{ label: '女', value: 'female' },
				{ label: '保密', value: 'secret' },
			],
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		avatarPreviewUrl() {
			const value = String(this.avatarDraft || '')
			if (!value) return ''
			if (/^[a-zA-Z]+:/.test(value)) {
				return value
			}
			return getAssetUrl(value)
		},
		nicknameInitial() {
			return (this.nicknameDraft || this.appState.profileName || '匿').slice(0, 1)
		},
		canSave() {
			const name = String(this.nicknameDraft || '').trim()
			const bio = String(this.bioDraft || '').trim()
			return Boolean(name) && (
				this.avatarDraft !== this.appState.profileAvatar ||
				name !== this.appState.profileName ||
				this.genderDraft !== this.appState.profileGender ||
				bio !== this.appState.profileBio
			)
		},
		previewName() {
			return String(this.nicknameDraft || '').trim() || '纸飞机同学'
		},
		previewGenderLabel() {
			if (this.genderDraft === 'male') return '男'
			if (this.genderDraft === 'female') return '女'
			return '保密'
		},
		previewBio() {
			return String(this.bioDraft || '').trim() || '把想说的话写在这里。'
		},
	},
	onShow() {
		syncThemeWindow(this.appState.theme)
		this.loadProfile()
	},
	methods: {
		async loadProfile() {
			try {
				const profile = await getMyProfile()
				this.avatarDraft = profile?.avatarUrl || ''
				this.initialAvatar = this.avatarDraft
				this.nicknameDraft = profile?.username || this.appState.profileName
				this.genderDraft = profile?.gender || this.appState.profileGender || 'secret'
				this.bioDraft = profile?.bio || this.appState.profileBio || ''
				setProfileAvatar(this.avatarDraft)
				setProfileName(this.nicknameDraft)
				setProfileGender(this.genderDraft)
				setProfileBio(this.bioDraft)
			} catch (error) {
				this.avatarDraft = this.appState.profileAvatar || ''
				this.initialAvatar = this.avatarDraft
				this.nicknameDraft = this.appState.profileName
				this.genderDraft = this.appState.profileGender || 'secret'
				this.bioDraft = this.appState.profileBio || ''
				uni.showToast({
					title: error.message || '资料加载失败',
					icon: 'none',
				})
			}
		},
		goBack() {
			uni.navigateBack({
				fail: () => {
					uni.switchTab({
						url: '/pages/mine/index',
					})
				},
			})
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: res => {
					const filePath = res.tempFilePaths && res.tempFilePaths[0]
					if (!filePath) return
					this.avatarDraft = filePath
				},
			})
		},
		clearAvatar() {
			this.avatarDraft = ''
		},
		async handleSave() {
			if (!this.canSave || this.saving) return
			const username = String(this.nicknameDraft || '').trim()
			const bio = String(this.bioDraft || '').trim()
			if (!username) {
				uni.showToast({
					title: '昵称不能为空',
					icon: 'none',
				})
				return
			}

			this.saving = true
			try {
				let avatarUrl = this.avatarDraft || ''
				const shouldUploadAvatar = Boolean(
					avatarUrl &&
					avatarUrl !== this.initialAvatar &&
					!/^https?:\/\//.test(avatarUrl) &&
					!avatarUrl.startsWith('/uploads/'),
				)

				if (shouldUploadAvatar) {
					avatarUrl = await uploadMyAvatar(avatarUrl)
				}

				const profile = await updateMyProfile({
					username,
					avatarUrl: avatarUrl || '',
					gender: this.genderDraft || 'secret',
					bio,
				})

				setProfileAvatar(profile?.avatarUrl || '')
				setProfileName(profile?.username || username)
				setProfileGender(profile?.gender || this.genderDraft || 'secret')
				setProfileBio(profile?.bio || bio)
				this.initialAvatar = profile?.avatarUrl || ''
				this.avatarDraft = this.initialAvatar
				uni.showToast({
					title: '资料已保存',
					icon: 'success',
				})
				setTimeout(() => {
					this.goBack()
				}, 260)
			} catch (error) {
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none',
				})
			} finally {
				this.saving = false
			}
		},
	},
}
</script>

<style>
.profile-edit-page {
	min-height: 100vh;
	background: rgba(247, 250, 248, 1);
}

.profile-edit-page .profile-edit-page__nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: calc(env(safe-area-inset-top) + 18rpx) 16rpx 16rpx;
	border-bottom: 2rpx solid rgba(224, 224, 224, 1);
	background: rgba(247, 250, 248, 1);
}

.profile-edit-page .profile-edit-page__nav-back,
.profile-edit-page .profile-edit-page__nav-save {
	font-size: 16px;
	color: rgba(76, 175, 80, 1);
	line-height: 1;
}

.profile-edit-page .profile-edit-page__nav-back {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
}

.profile-edit-page .profile-edit-page__nav-back-icon {
	width: 24rpx;
	height: 24rpx;
	display: block;
}

.profile-edit-page .profile-edit-page__nav-save.is-disabled {
	color: rgba(170, 170, 170, 1);
}

.profile-edit-page .profile-edit-page__nav-title {
	font-size: 18px;
	font-weight: 700;
	color: rgba(51, 51, 51, 1);
	line-height: 1.2;
}

.profile-edit-page .profile-edit-page__page-note {
	display: block;
	padding: 16rpx 16rpx 0;
	font-size: 12px;
	line-height: 1.6;
	color: rgba(153, 153, 153, 1);
}

.profile-edit-page .profile-edit-page__header-copy {
	flex: 1;
	min-width: 0;
}

.profile-edit-page .profile-edit-page__title {
	display: block;
	font-size: 18px;
	font-weight: 700;
	color: rgba(51, 51, 51, 1);
	text-align: center;
}

.profile-edit-page .profile-edit-page__subtitle {
	display: none;
}

.profile-edit-page .profile-edit-page__profile-card,
.profile-edit-page .profile-edit-page__form-card {
	background: rgba(255, 255, 255, 1);
	border-radius: 12px;
	border: 1px solid rgba(224, 224, 224, 1);
}

.profile-edit-page .profile-edit-page__profile-card {
	margin: 20rpx 16rpx 0;
	padding: 24rpx 20rpx;
	text-align: center;
}

.profile-edit-page .profile-edit-page__avatar {
	width: 80px;
	height: 80px;
	margin: 0 auto;
	border-radius: 50%;
	background: rgba(255, 255, 255, 1);
	border: 4px solid #ffffff;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}

.profile-edit-page .profile-edit-page__avatar-image {
	width: 100%;
	height: 100%;
}

.profile-edit-page .profile-edit-page__avatar-fallback {
	font-size: 36rpx;
	font-weight: 700;
	color: rgba(180, 200, 190, 1);
}

.profile-edit-page .profile-edit-page__avatar-actions {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 40rpx;
	margin-top: 16rpx;
}

.profile-edit-page .profile-edit-page__avatar-btn {
	padding: 8px 16px;
	border-radius: 8px;
	border: 1px solid rgba(224, 224, 224, 1);
	font-size: 14px;
	color: rgba(102, 102, 102, 1);
	background: rgba(255, 255, 255, 1);
}

.profile-edit-page .profile-edit-page__avatar-btn--primary {
	border-color: rgba(76, 175, 80, 1);
	color: rgba(76, 175, 80, 1);
}

.profile-edit-page .profile-edit-page__identity {
	margin-top: 18rpx;
	text-align: left;
}

.profile-edit-page .profile-edit-page__identity-name {
	display: block;
	font-size: 16px;
	font-weight: 700;
	color: rgba(51, 51, 51, 1);
}

.profile-edit-page .profile-edit-page__identity-meta {
	display: block;
	margin-top: 8rpx;
	font-size: 14px;
	color: rgba(102, 102, 102, 1);
}

.profile-edit-page .profile-edit-page__identity-bio {
	display: block;
	margin-top: 10rpx;
	font-size: 14px;
	line-height: 1.6;
	color: rgba(102, 102, 102, 1);
}

.profile-edit-page .profile-edit-page__form-card {
	margin: 20rpx 16rpx 0;
	padding: 24rpx 20rpx;
}

.profile-edit-page .profile-edit-page__field + .profile-edit-page__field {
	margin-top: 20px;
}

.profile-edit-page .profile-edit-page__field-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.profile-edit-page .profile-edit-page__label {
	display: block;
	font-size: 14px;
	font-weight: 600;
	color: rgba(51, 51, 51, 1);
}

.profile-edit-page .profile-edit-page__hint,
.profile-edit-page .profile-edit-page__count {
	display: block;
	margin-top: 8rpx;
	font-size: 12px;
	line-height: 1.6;
	color: rgba(153, 153, 153, 1);
}

.profile-edit-page .profile-edit-page__input,
.profile-edit-page .profile-edit-page__textarea {
	width: 100%;
	margin-top: 8px;
	border-radius: 8px;
	border: 1px solid rgba(224, 224, 224, 1);
	background: rgba(255, 255, 255, 1);
	font-size: 15px;
	color: rgba(51, 51, 51, 1);
}

.profile-edit-page .profile-edit-page__input {
	height: 48px;
	padding: 0 16px;
}

.profile-edit-page .profile-edit-page__gender-row {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: 8px;
}

.profile-edit-page .profile-edit-page__gender-chip {
	padding: 10px 20px;
	border-radius: 8px;
	border: 1px solid rgba(224, 224, 224, 1);
	background: rgba(255, 255, 255, 1);
	font-size: 14px;
	color: rgba(102, 102, 102, 1);
}

.profile-edit-page .profile-edit-page__gender-chip.is-active {
	background: rgba(76, 175, 80, 1);
	border-color: rgba(76, 175, 80, 1);
	color: #ffffff;
}

.profile-edit-page .profile-edit-page__textarea {
	min-height: 120px;
	padding: 16px;
	line-height: 1.6;
}

.profile-edit-page .profile-edit-page__footer-note {
	display: block;
	padding: 24px 16px 12px;
	font-size: 12px;
	line-height: 1.6;
	color: rgba(153, 153, 153, 1);
}

.profile-edit-page .profile-edit-page__primary-save {
	margin: 0 16px 24px;
	height: 52px;
	border-radius: 12px;
	background: rgba(76, 175, 80, 1);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	font-size: 16px;
	font-weight: 700;
}

.profile-edit-page .profile-edit-page__primary-save.is-disabled {
	background: rgba(210, 216, 220, 1);
	color: rgba(110, 118, 124, 1);
}

.profile-edit-page.theme-dark {
	background: rgba(15, 20, 22, 1);
}

.profile-edit-page.theme-dark .profile-edit-page__nav {
	background: rgba(15, 20, 22, 0.96);
	border-bottom-color: rgba(230, 237, 241, 0.08);
}

.profile-edit-page.theme-dark .profile-edit-page__nav-back,
.profile-edit-page.theme-dark .profile-edit-page__nav-save {
	color: rgba(126, 223, 183, 0.96);
}

.profile-edit-page.theme-dark .profile-edit-page__nav-save.is-disabled {
	color: rgba(148, 160, 168, 0.7);
}

.profile-edit-page.theme-dark .profile-edit-page__nav-title {
	color: var(--ink);
}

.profile-edit-page.theme-dark .profile-edit-page__page-note,
.profile-edit-page.theme-dark .profile-edit-page__footer-note,
.profile-edit-page.theme-dark .profile-edit-page__hint,
.profile-edit-page.theme-dark .profile-edit-page__count,
.profile-edit-page.theme-dark .profile-edit-page__identity-meta,
.profile-edit-page.theme-dark .profile-edit-page__identity-bio {
	color: rgba(190, 198, 202, 0.78);
}

.profile-edit-page.theme-dark .profile-edit-page__profile-card,
.profile-edit-page.theme-dark .profile-edit-page__form-card {
	background: rgba(24, 32, 36, 0.96);
	border-color: rgba(230, 237, 241, 0.08);
}

.profile-edit-page.theme-dark .profile-edit-page__avatar {
	background: rgba(22, 31, 35, 0.96);
	border-color: rgba(230, 237, 241, 0.08);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.22);
}

.profile-edit-page.theme-dark .profile-edit-page__avatar-fallback {
	color: rgba(164, 186, 177, 0.92);
}

.profile-edit-page.theme-dark .profile-edit-page__avatar-btn {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(230, 237, 241, 0.08);
	color: rgba(190, 198, 202, 0.9);
}

.profile-edit-page.theme-dark .profile-edit-page__avatar-btn--primary {
	border-color: rgba(126, 223, 183, 0.36);
	color: rgba(126, 223, 183, 0.96);
}

.profile-edit-page.theme-dark .profile-edit-page__identity-name,
.profile-edit-page.theme-dark .profile-edit-page__label {
	color: var(--ink);
}

.profile-edit-page.theme-dark .profile-edit-page__input,
.profile-edit-page.theme-dark .profile-edit-page__textarea,
.profile-edit-page.theme-dark .profile-edit-page__gender-chip {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(230, 237, 241, 0.08);
	color: rgba(214, 223, 229, 0.92);
}

.profile-edit-page.theme-dark .profile-edit-page__gender-chip.is-active {
	background: rgba(54, 192, 141, 0.16);
	border-color: rgba(126, 223, 183, 0.32);
	color: rgba(126, 223, 183, 0.98);
}

.profile-edit-page.theme-dark .profile-edit-page__primary-save {
	background: linear-gradient(135deg, rgba(54, 192, 141, 0.96), rgba(75, 206, 163, 0.96));
}

.profile-edit-page.theme-dark .profile-edit-page__primary-save.is-disabled {
	background: rgba(70, 80, 86, 0.9);
	color: rgba(166, 176, 182, 0.8);
}
</style>


