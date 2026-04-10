<template>
	<view :class="['app-page', 'with-tabbar', 'throw-page', themeClass, { launching: launchAnimating }]" :style="throwStyle">
		<view :class="['throw-shell', { 'is-launching': launchAnimating }]">
			<view :class="['throw-frame', { 'is-launching': launchAnimating }]">
				<view class="throw-topbar">
					<view class="top-icon-btn" @tap="goBack">
						<image class="top-icon-image" :src="closeIcon" mode="aspectFit" />
					</view>

					<view class="mode-pill" @tap="isAnonymous = !isAnonymous">
						<text class="mode-text">{{ isAnonymous ? labels.anonymousMode : labels.realMode }}</text>
						<view :class="['mode-switch', isAnonymous ? '' : 'named']">
							<view class="mode-dot"></view>
						</view>
					</view>
				</view>

				<view class="draft-stage">
					<text class="draft-mode-note">{{ isAnonymous ? labels.anonymousHint : realModeHint }}</text>
					<textarea
						v-model="content"
						class="draft-input"
						maxlength="200"
						:placeholder="labels.editorPlaceholder"
						placeholder-class="draft-placeholder"
					/>
					<text class="draft-count">{{ wordCount }}/200</text>

					<view class="image-strip">
						<view class="image-strip-head">
							<text class="image-strip-title">{{ labels.imageLabel }}</text>
							<text class="image-strip-note">{{ selectedImages.length }}/9</text>
						</view>

						<view class="image-grid">
							<view v-for="(item, index) in selectedImages" :key="`${item}-${index}`" class="image-tile">
								<image class="image-preview" :src="item" mode="aspectFill" @tap="previewImages(index)" />
								<view class="image-remove" @tap.stop="removeImage(index)">
									<text>×</text>
								</view>
							</view>

							<view v-if="selectedImages.length < 9" class="image-picker-tile" @tap="chooseImages">
								<image class="image-picker-icon-image" :src="addImageIcon" mode="aspectFit" />
								<text class="image-picker-text">{{ labels.addImage }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="control-card">
					<picker mode="selector" :range="locationOptions" @change="handleLocationChange">
						<view class="setting-row">
							<view class="setting-meta">
								<image class="setting-icon-image" :src="pinIcon" mode="aspectFit" />
								<text class="setting-label">{{ labels.locationLabel }}</text>
							</view>
							<view class="setting-value">
								<text>{{ locationDisplay }}</text>
								<text class="setting-arrow">{{ arrowIcon }}</text>
							</view>
						</view>
					</picker>

					<picker mode="selector" :range="moodPickerOptions" @change="handleMoodChange">
						<view class="setting-row">
							<view class="setting-meta">
								<image class="setting-icon-image" :src="moodIcon" mode="aspectFit" />
								<text class="setting-label">{{ labels.moodLabel }}</text>
							</view>
							<view class="setting-value">
								<text>{{ currentMoodLabel }}</text>
								<text class="setting-arrow">{{ arrowIcon }}</text>
							</view>
						</view>
					</picker>

					<picker mode="selector" :range="expirePickerOptions" @change="handleExpireChange">
						<view class="setting-row">
							<view class="setting-meta">
								<image class="setting-icon-image" :src="timeIcon" mode="aspectFit" />
								<text class="setting-label">{{ labels.expireLabel }}</text>
							</view>
							<view class="setting-value">
								<text>{{ expireLabel }}</text>
								<text class="setting-arrow">{{ arrowIcon }}</text>
							</view>
						</view>
					</picker>

					<view class="setting-row vote-row" @tap="voteEditorOpen = !voteEditorOpen">
						<view class="setting-meta">
							<image class="setting-icon-image" :src="voteIcon" mode="aspectFit" />
							<text class="setting-label">{{ labels.voteLabel }}</text>
						</view>
						<view class="setting-value">
							<text>{{ voteSummaryText }}</text>
							<text :class="['setting-arrow', 'expand-arrow', voteEditorOpen ? 'expanded' : '']">{{ arrowIcon }}</text>
						</view>
					</view>

					<view :class="['vote-editor-wrap', voteEditorOpen ? 'open' : '']">
						<view class="vote-editor">
							<input
								v-model="voteTitle"
								class="vote-input"
								maxlength="60"
								:placeholder="labels.voteTitlePlaceholder"
								placeholder-class="placeholder-text"
							/>

							<input
								v-for="(item, index) in voteOptionInputs"
								:key="`vote-option-${index}`"
								v-model="voteOptionInputs[index]"
								class="vote-input"
								maxlength="20"
								:placeholder="`${labels.voteOptionPlaceholder} ${index + 1}`"
								placeholder-class="placeholder-text"
							/>
						</view>
					</view>

					<view
						:class="['launch-btn', { loading, launching: launchAnimating, disabled: !canLaunch && !loading && !launchAnimating }]"
						@tap="handleThrow"
					>
						<image class="launch-icon-image" :src="planeIcon" mode="aspectFit" />
						<text>{{ launchButtonText }}</text>
					</view>
					<view v-if="loading && !launchAnimating" class="launch-progress">
						<view class="launch-progress-row">
							<text class="launch-progress-stage">{{ publishStageText }}</text>
							<text class="launch-progress-percent">{{ publishProgress }}%</text>
						</view>
						<view class="launch-progress-track">
							<view class="launch-progress-fill" :style="{ width: `${publishProgress}%` }"></view>
						</view>
						<text class="launch-progress-detail">{{ publishDetailText }}</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="launchAnimating" class="origami-launch-scene">
			<view class="launch-haze haze-left"></view>
			<view class="launch-haze haze-right"></view>
			<view class="launch-wind-track track-one"></view>
			<view class="launch-wind-track track-two"></view>
			<view class="launch-wind-track track-three"></view>
			<view class="origami-plane">
				<view class="origami-plane-shadow"></view>
				<view class="origami-plane-body">
					<view class="origami-wing wing-left">
						<text class="origami-wing-copy">{{ launchPreviewText }}</text>
					</view>
					<view class="origami-wing wing-right">
						<text class="origami-wing-copy">{{ launchPreviewText }}</text>
					</view>
					<view class="origami-nose"></view>
					<view class="origami-core">
						<view class="origami-core-line line-left"></view>
						<view class="origami-core-line line-right"></view>
						<view class="origami-core-line line-center"></view>
					</view>
				</view>
			</view>
			<view class="origami-launch-copy">
				<text class="launch-copy-kicker">{{ labels.launching }}</text>
				<text class="launch-copy-title">{{ labels.launchFlightTitle }}</text>
				<text class="launch-copy-note">{{ labels.launchFlightSubtitle }}</text>
			</view>
		</view>

		<page-transition :visible="pageTransitionVisible" :theme="appState.theme" />
		<app-tabbar active="throw" :theme="appState.theme" />
	</view>
</template>

<script>
import AppTabbar from '../../components/AppTabbar.vue'
import PageTransition from '../../components/PageTransition.vue'
import { appState, fetchLocations, setCurrentLocation } from '../../common/app-state.js'
import { throwPlane, uploadPlaneImage } from '../../common/api.js'
import { expireOptions, moodOptions } from '../../common/moods.js'
import { clearThrowDraft, getThrowDraft, setThrowDraft } from '../../common/storage.js'
import pageTransitionMixin from '../../common/page-transition.js'
import { uiIcons } from '../../common/ui-icons.js'

export default {
	mixins: [pageTransitionMixin],
	components: {
		AppTabbar,
		PageTransition,
	},
	data() {
		return {
			appState,
			moodOptions,
			expireOptions,
			content: '',
			selectedImages: [],
			mood: 'calm',
			location: '',
			isAnonymous: true,
			expireHours: 24,
			voteEditorOpen: false,
			voteTitle: '',
			voteOptionInputs: ['', '', '', ''],
			loading: false,
			publishStage: 'idle',
			publishProgress: 0,
			publishDetail: '',
			launchAnimating: false,
			launchTimer: null,
			closeIcon: uiIcons.close,
			arrowIcon: '›',
			pinIcon: uiIcons.location,
			timeIcon: uiIcons.hourglass,
			moodIcon: uiIcons.emotion,
			voteIcon: uiIcons.vote,
			planeIcon: uiIcons.throwActive,
			addImageIcon: uiIcons.more,
			labels: {
				anonymousMode: '匿名投递',
				realMode: '实名投递',
				anonymousHint: '这架纸飞机会以匿名身份起飞。',
				editorPlaceholder: '写下你想留在这里的话...',
				imageLabel: '附加图片',
				addImage: '添加图片',
				locationLabel: '降落地点',
				moodLabel: '纸飞机情绪',
				expireLabel: '存活时间',
				voteLabel: '附加投票',
				voteTitlePlaceholder: '投票标题',
				voteOptionPlaceholder: '投票选项',
				launch: '放飞纸飞机',
				launching: '正在起飞...',
				launchFlightTitle: '这一页已经被折成纸飞机',
				launchFlightSubtitle: '它会带着你的心情穿过风，落进某个陌生人的手心。',
			},
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		locations() {
			return this.appState.locations || []
		},
		locationOptions() {
			return this.locations.map(item => item.name)
		},
		moodPickerOptions() {
			return this.moodOptions.map(item => item.text)
		},
		expirePickerOptions() {
			return this.expireOptions.map(item => item.text)
		},
		wordCount() {
			return (this.content || '').length
		},
		currentMoodLabel() {
			const current = this.moodOptions.find(item => item.value === this.mood)
			return current ? current.text : '平静'
		},
		expireLabel() {
			const current = this.expireOptions.find(item => item.value === this.expireHours)
			return current ? current.text : '24小时'
		},
		realModeHint() {
			return `这架纸飞机会显示为“${this.appState.profileName}”发布。`
		},
		locationDisplay() {
			return this.location || '请选择地点'
		},
		normalizedVoteOptions() {
			return this.voteOptionInputs.map(item => item.trim()).filter(Boolean)
		},
		hasVoteDraft() {
			return Boolean(this.voteTitle.trim() || this.normalizedVoteOptions.length)
		},
		voteSummaryText() {
			if (!this.voteTitle.trim() && !this.normalizedVoteOptions.length) {
				return '不设置'
			}
			if (this.voteTitle.trim() && this.normalizedVoteOptions.length >= 2) {
				return `${this.normalizedVoteOptions.length} 个选项`
			}
			return '填写中'
		},
		canLaunch() {
			if (!this.content.trim() || !this.location) return false
			if (!this.hasVoteDraft) return true
			return Boolean(this.voteTitle.trim()) && this.normalizedVoteOptions.length >= 2
		},
		throwStyle() {
			return {
				'--throw-accent': '#31bc7d',
				'--throw-accent-strong': '#1f9d69',
				'--throw-accent-glow': 'rgba(49, 188, 125, 0.34)',
			}
		},
		launchPreviewText() {
			const source = String(this.content || '').trim()
			return source ? source.slice(0, 24) : '纸页正在收起今天想说的话'
		},
		launchButtonText() {
			if (!this.loading) return this.labels.launch
			if (this.publishStage === 'uploading') {
				return `上传中 ${this.publishProgress}%`
			}
			return this.publishStageText || this.labels.launching
		},
		publishStageText() {
			switch (this.publishStage) {
			case 'preparing':
				return '准备发布中'
			case 'uploading':
				return '图片上传中'
			case 'submitting':
				return '提交内容中'
			case 'launching':
				return '正在起飞'
			default:
				return this.labels.launching
			}
		},
		publishDetailText() {
			if (this.publishDetail) return this.publishDetail
			if (this.publishStage === 'uploading') return '正在传输图片数据'
			if (this.publishStage === 'submitting') return '正在保存纸飞机内容'
			if (this.publishStage === 'launching') return '即将完成发布'
			return '正在处理你的请求'
		},
	},
	watch: {
		content: 'persistDraft',
		selectedImages: {
			handler: 'persistDraft',
			deep: true,
		},
		mood: 'persistDraft',
		location: 'persistDraft',
		isAnonymous: 'persistDraft',
		expireHours: 'persistDraft',
		voteEditorOpen: 'persistDraft',
		voteTitle: 'persistDraft',
		voteOptionInputs: {
			handler: 'persistDraft',
			deep: true,
		},
	},
	async onShow() {
		await fetchLocations()
		this.restoreDraft()
	},
	onHide() {
		this.persistDraft()
		this.clearLaunchTimer()
		this.launchAnimating = false
		this.resetPublishState()
	},
	onUnload() {
		this.persistDraft()
		this.clearLaunchTimer()
		this.launchAnimating = false
		this.resetPublishState()
	},
	methods: {
		goBack() {
			uni.switchTab({
				url: '/pages/home/index',
				fail: () => {
					uni.reLaunch({
						url: '/pages/home/index',
					})
				},
			})
		},
		handleLocationChange(event) {
			const index = Number(event.detail.value)
			this.location = this.locationOptions[index] || this.location
		},
		handleMoodChange(event) {
			const index = Number(event.detail.value)
			const current = this.moodOptions[index]
			if (current) {
				this.mood = current.value
			}
		},
		handleExpireChange(event) {
			const index = Number(event.detail.value)
			const current = this.expireOptions[index]
			if (current) {
				this.expireHours = current.value
			}
		},
		chooseImages() {
			const remainCount = 9 - this.selectedImages.length
			if (remainCount <= 0) return
			uni.chooseImage({
				count: remainCount,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: res => {
					const files = res.tempFilePaths || []
					this.selectedImages = [...this.selectedImages, ...files].slice(0, 9)
				},
			})
		},
		removeImage(index) {
			this.selectedImages.splice(index, 1)
		},
		previewImages(current) {
			if (!this.selectedImages.length) return
			uni.previewImage({
				urls: this.selectedImages,
				current: this.selectedImages[current],
			})
		},
		persistDraft() {
			const draft = {
				content: this.content,
				selectedImages: this.selectedImages,
				mood: this.mood,
				location: this.location,
				isAnonymous: this.isAnonymous,
				expireHours: this.expireHours,
				voteEditorOpen: this.voteEditorOpen,
				voteTitle: this.voteTitle,
				voteOptionInputs: this.voteOptionInputs,
			}
			const hasDraft =
				Boolean(draft.content?.trim()) ||
				draft.selectedImages.length > 0 ||
				Boolean(draft.location) ||
				draft.mood !== 'calm' ||
				draft.isAnonymous !== true ||
				draft.expireHours !== 24 ||
				Boolean(draft.voteEditorOpen) ||
				Boolean(draft.voteTitle?.trim()) ||
				draft.voteOptionInputs.some(item => String(item || '').trim())

			if (!hasDraft) {
				clearThrowDraft()
				return
			}

			setThrowDraft(draft)
		},
		restoreDraft() {
			const draft = getThrowDraft()
			if (draft) {
				this.content = draft.content || ''
				this.selectedImages = Array.isArray(draft.selectedImages)
					? draft.selectedImages.slice(0, 9)
					: []
				this.mood = draft.mood || 'calm'
				this.location = draft.location || this.appState.currentLocation || ''
				this.isAnonymous = draft.isAnonymous !== false
				this.expireHours = draft.expireHours || 24
				this.voteEditorOpen = Boolean(draft.voteEditorOpen)
				this.voteTitle = draft.voteTitle || ''
				this.voteOptionInputs = Array.isArray(draft.voteOptionInputs)
					? [...draft.voteOptionInputs, '', '', '', ''].slice(0, 4)
					: ['', '', '', '']
				return
			}
			if (this.appState.currentLocation) {
				this.location = this.appState.currentLocation
			}
		},
		resetVoteDraft() {
			this.voteEditorOpen = false
			this.voteTitle = ''
			this.voteOptionInputs = ['', '', '', '']
			this.selectedImages = []
		},
		playLaunchAnimation(duration = 1680) {
			this.clearLaunchTimer()
			this.launchAnimating = true
			return new Promise(resolve => {
				this.launchTimer = setTimeout(() => {
					this.launchAnimating = false
					this.launchTimer = null
					resolve()
				}, duration)
			})
		},
		clearLaunchTimer() {
			if (this.launchTimer) {
				clearTimeout(this.launchTimer)
				this.launchTimer = null
			}
		},
		resetPublishState() {
			this.publishStage = 'idle'
			this.publishProgress = 0
			this.publishDetail = ''
		},
		setPublishState(stage, progress, detail = '') {
			this.publishStage = stage
			if (typeof progress === 'number') {
				const next = Math.round(progress)
				this.publishProgress = Math.max(0, Math.min(100, next))
			}
			this.publishDetail = detail
		},
		withTimeout(taskPromise, ms = 25000, message = '发布请求超时，请稍后重试') {
			let timer = null
			return new Promise((resolve, reject) => {
				timer = setTimeout(() => {
					reject(new Error(message))
				}, ms)
				Promise.resolve(taskPromise)
					.then(result => {
						if (timer) clearTimeout(timer)
						resolve(result)
					})
					.catch(error => {
						if (timer) clearTimeout(timer)
						reject(error)
					})
			})
		},
		async handleThrow() {
			if (this.loading || this.launchAnimating) return
			if (!this.content.trim()) {
				uni.showToast({
					title: '请写点什么吧',
					icon: 'none',
				})
				return
			}
			if (!this.location) {
				uni.showToast({
					title: '请选择地点',
					icon: 'none',
				})
				return
			}

			if (this.hasVoteDraft) {
				if (!this.voteTitle.trim()) {
					uni.showToast({
						title: '请填写投票标题',
						icon: 'none',
					})
					return
				}
				if (this.normalizedVoteOptions.length < 2) {
					uni.showToast({
						title: '至少填写两个投票选项',
						icon: 'none',
					})
					return
				}
			}

			this.loading = true
			this.setPublishState('preparing', 3, '正在准备发布内容')
			try {
				const imageUrls = await this.uploadImagesInOrder(this.selectedImages)
				this.setPublishState('submitting', 95, '正在提交纸飞机')
				await this.withTimeout(throwPlane({
					locationTag: this.location,
					content: this.content.trim(),
					mood: this.mood,
					isAnonymous: this.isAnonymous,
					authorName: this.isAnonymous ? '' : this.appState.profileName,
					imageUrls,
					expireHours: this.expireHours,
					voteTitle: this.hasVoteDraft ? this.voteTitle.trim() : '',
					voteOptions: this.hasVoteDraft ? this.normalizedVoteOptions : [],
				}), 120000)
				this.setPublishState('launching', 100, '发布成功，准备起飞')
				setCurrentLocation(this.location)
				await this.playLaunchAnimation()
				this.content = ''
				this.resetVoteDraft()
				clearThrowDraft()
				uni.switchTab({
					url: '/pages/home/index',
					fail: () => {
						uni.reLaunch({
							url: '/pages/home/index',
						})
					},
				})
			} catch (error) {
				uni.showToast({
					title: error.message || '投递失败',
					icon: 'none',
				})
			} finally {
				this.loading = false
				if (!this.launchAnimating) {
					this.resetPublishState()
				}
			}
		},
		async uploadImagesInOrder(filePaths = []) {
			if (!Array.isArray(filePaths) || filePaths.length === 0) {
				this.setPublishState('uploading', 90, '无需上传图片')
				return []
			}

			const totalCount = filePaths.length
			const results = []

			for (let index = 0; index < totalCount; index += 1) {
				const progress = 5 + ((index / totalCount) * 85)
				this.setPublishState('uploading', progress, `正在上传图片 ${index + 1}/${totalCount}`)
				const url = await uploadPlaneImage(filePaths[index])
				results.push(url)
			}

			this.setPublishState('uploading', 92, `图片上传完成 ${totalCount}/${totalCount}`)
			return results
		},
	},
}
</script>

<style scoped>
.throw-page {
	padding-top: 0;
	padding-left: 0;
	padding-right: 0;
	background:
		radial-gradient(circle at 14% 8%, rgba(208, 221, 239, 0.78), transparent 36%),
		radial-gradient(circle at 88% 100%, rgba(244, 222, 230, 0.72), transparent 30%),
		linear-gradient(180deg, rgba(247, 245, 241, 0.98), rgba(244, 239, 235, 0.98));
}

.throw-page.theme-dark {
	background:
		radial-gradient(circle at 14% 8%, rgba(70, 94, 112, 0.34), transparent 36%),
		radial-gradient(circle at 88% 100%, rgba(104, 82, 96, 0.3), transparent 30%),
		linear-gradient(180deg, rgba(15, 20, 22, 0.98), rgba(11, 16, 19, 0.98));
}

.throw-shell {
	min-height: calc(100vh - 200rpx);
	display: flex;
}

.throw-shell.is-launching {
	pointer-events: none;
}

.throw-frame {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: calc(env(safe-area-inset-top) + 22rpx) 28rpx 28rpx;
	background: transparent;
	transform-origin: center 18%;
	transition:
		transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
		opacity 0.28s ease,
		filter 0.32s ease;
}

.theme-dark .throw-frame {
	background: transparent;
}

.throw-frame.is-launching {
	opacity: 0.18;
	filter: blur(10rpx);
	transform: scale(0.95) translateY(26rpx);
}

.throw-topbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.top-icon-btn {
	width: 62rpx;
	height: 62rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.52);
	color: var(--muted);
}

.theme-dark .top-icon-btn {
	background: rgba(255, 255, 255, 0.06);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
}

.top-icon-image {
	width: 30rpx;
	height: 30rpx;
	display: block;
}

.mode-pill {
	display: inline-flex;
	align-items: center;
	gap: 12rpx;
	padding: 10rpx 14rpx 10rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.58);
}

.theme-dark .mode-pill {
	background: rgba(255, 255, 255, 0.06);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
}

.mode-text {
	font-size: 22rpx;
	color: var(--ink);
}

.mode-switch {
	width: 50rpx;
	height: 30rpx;
	padding: 4rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	background: #39b087;
}

.mode-switch.named {
	justify-content: flex-start;
	background: rgba(28, 36, 40, 0.18);
}

.theme-dark .mode-switch.named {
	background: rgba(230, 237, 241, 0.2);
}

.mode-dot {
	width: 22rpx;
	height: 22rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.96);
}

.draft-stage {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 56rpx 8rpx 28rpx;
}

.draft-mode-note {
	display: block;
	margin-bottom: 18rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: var(--muted);
}

.draft-input {
	width: 100%;
	flex: 1;
	min-height: 200rpx;
	font-size: 42rpx;
	line-height: 1.55;
	color: rgba(92, 102, 110, 0.94);
	background: transparent;
}

.theme-dark .draft-input {
	color: rgba(222, 231, 236, 0.96);
}

.draft-placeholder {
	color: rgba(168, 176, 184, 0.88);
}

.theme-dark .draft-placeholder {
	color: rgba(152, 164, 172, 0.7);
}

.draft-count {
	align-self: flex-end;
	margin-top: 16rpx;
	font-size: 20rpx;
	color: var(--muted);
}

.image-strip {
	margin-top: 18rpx;
}

.image-strip-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 12rpx;
}

.image-strip-title,
.image-strip-note {
	font-size: 20rpx;
	color: var(--muted);
}

.image-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.image-tile,
.image-picker-tile {
	position: relative;
	width: 132rpx;
	height: 132rpx;
	border-radius: 20rpx;
	overflow: hidden;
	flex-shrink: 0;
}

.image-tile {
	background: rgba(255, 255, 255, 0.74);
}

.theme-dark .image-tile {
	background: rgba(255, 255, 255, 0.08);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
}

.image-preview {
	width: 100%;
	height: 100%;
}

.image-remove {
	position: absolute;
	right: 8rpx;
	top: 8rpx;
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(15, 20, 22, 0.54);
	color: rgba(255, 255, 255, 0.94);
	font-size: 24rpx;
	line-height: 1;
}

.theme-dark .image-remove {
	background: rgba(0, 0, 0, 0.42);
}

.image-picker-tile {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	border: 2rpx dashed rgba(28, 36, 40, 0.12);
	background: rgba(255, 255, 255, 0.34);
}

.theme-dark .image-picker-tile {
	border-color: rgba(230, 237, 241, 0.12);
	background: rgba(255, 255, 255, 0.03);
}

.image-picker-icon-image {
	width: 28rpx;
	height: 28rpx;
	display: block;
	opacity: 0.75;
}

.image-picker-text {
	font-size: 18rpx;
	color: var(--muted);
}

.control-card {
	padding: 20rpx;
	border-radius: 34rpx;
	background: rgba(255, 255, 255, 0.82);
	box-shadow: 0 14rpx 28rpx rgba(196, 190, 182, 0.12);
}

.theme-dark .control-card {
	background: rgba(255, 255, 255, 0.05);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
	box-shadow: none;
}

.setting-row {
	min-height: 78rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.setting-row + .setting-row {
	border-top: 2rpx solid rgba(28, 36, 40, 0.05);
}

.theme-dark .setting-row + .setting-row {
	border-top-color: rgba(230, 237, 241, 0.06);
}

.setting-meta {
	display: inline-flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}

.setting-icon-image {
	width: 24rpx;
	height: 24rpx;
	display: block;
	flex-shrink: 0;
}

.setting-label {
	font-size: 24rpx;
	color: var(--muted);
}

.setting-value {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	flex-shrink: 0;
	font-size: 24rpx;
	color: var(--ink);
}

.theme-dark .setting-value {
	color: rgba(226, 234, 239, 0.92);
}

.setting-arrow {
	font-size: 28rpx;
	line-height: 1;
	color: var(--muted);
}

.expand-arrow {
	transition: transform 0.18s ease;
}

.expand-arrow.expanded {
	transform: rotate(90deg);
}

.vote-row {
	margin-top: 2rpx;
}

.vote-editor-wrap {
	display: grid;
	grid-template-rows: 0fr;
	opacity: 0;
	transition: grid-template-rows 0.26s ease, opacity 0.2s ease;
}

.vote-editor-wrap.open {
	grid-template-rows: 1fr;
	opacity: 1;
}

.vote-editor {
	min-height: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	padding-top: 0;
	border-top: 0 solid rgba(28, 36, 40, 0.05);
}

.vote-editor-wrap.open .vote-editor {
	padding-top: 14rpx;
	border-top-width: 2rpx;
}

.theme-dark .vote-editor-wrap.open .vote-editor {
	border-top-color: rgba(230, 237, 241, 0.06);
}

.vote-input {
	width: 100%;
	height: 76rpx;
	padding: 0 18rpx;
	border-radius: 18rpx;
	background: rgba(247, 245, 241, 0.88);
	font-size: 24rpx;
	color: var(--ink);
}

.theme-dark .vote-input {
	background: rgba(255, 255, 255, 0.05);
	border: 2rpx solid rgba(230, 237, 241, 0.08);
	color: rgba(226, 234, 239, 0.92);
}

.launch-btn {
	margin-top: 18rpx;
	height: 92rpx;
	border-radius: 20rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 42%),
		linear-gradient(135deg, var(--throw-accent), var(--throw-accent-strong));
	color: rgba(255, 255, 255, 0.94);
	font-size: 30rpx;
	font-weight: 700;
	box-shadow:
		0 22rpx 38rpx var(--throw-accent-glow),
		0 4rpx 0 rgba(255, 255, 255, 0.16) inset;
	transition:
		transform 0.16s cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 0.22s cubic-bezier(0.22, 1, 0.36, 1),
		background 0.22s ease,
		color 0.22s ease,
		opacity 0.2s ease;
}

.launch-btn.disabled {
	background: linear-gradient(135deg, rgba(201, 207, 212, 0.78), rgba(219, 224, 228, 0.94));
	border-color: transparent;
	color: rgba(101, 110, 116, 0.86);
	box-shadow: none;
}

.launch-btn.loading {
	opacity: 0.82;
}

.launch-btn:active {
	transform: scale(0.985) translateY(2rpx);
	box-shadow: 0 12rpx 22rpx rgba(49, 188, 125, 0.22);
}

.launch-btn.launching {
	transform: scale(0.97);
	box-shadow: 0 12rpx 22rpx rgba(49, 188, 125, 0.2);
}

.launch-btn.disabled .launch-icon-image {
	opacity: 0.7;
}

.theme-dark .launch-btn.disabled {
	background: linear-gradient(135deg, rgba(61, 70, 76, 0.9), rgba(74, 83, 90, 0.94));
	border-color: transparent;
	color: rgba(186, 196, 202, 0.72);
	box-shadow: none;
}

.launch-icon-image {
	width: 28rpx;
	height: 28rpx;
	display: block;
}

.launch-progress {
	margin-top: 14rpx;
	padding: 10rpx 4rpx 0;
}

.launch-progress-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10rpx;
}

.launch-progress-stage,
.launch-progress-percent,
.launch-progress-detail {
	font-size: 20rpx;
	color: var(--muted);
}

.launch-progress-percent {
	font-variant-numeric: tabular-nums;
}

.launch-progress-track {
	margin-top: 8rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background: rgba(28, 36, 40, 0.08);
	overflow: hidden;
}

.launch-progress-fill {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, #2f9e74, #1f9d69);
	transition: width 0.18s ease;
}

.launch-progress-detail {
	display: block;
	margin-top: 8rpx;
}

.theme-dark .launch-progress-track {
	background: rgba(230, 237, 241, 0.12);
}

.theme-dark .launch-progress-stage,
.theme-dark .launch-progress-percent,
.theme-dark .launch-progress-detail {
	color: rgba(186, 196, 202, 0.8);
}

.origami-launch-scene {
	position: fixed;
	inset: 0;
	z-index: 90;
	overflow: hidden;
	pointer-events: none;
	background:
		radial-gradient(circle at 16% 18%, rgba(208, 221, 239, 0.28), transparent 30%),
		radial-gradient(circle at 84% 76%, rgba(244, 222, 230, 0.28), transparent 28%),
		linear-gradient(180deg, rgba(247, 245, 241, 0.22), rgba(244, 239, 235, 0.12));
	backdrop-filter: blur(2rpx);
}

.launch-haze {
	position: absolute;
	border-radius: 50%;
	filter: blur(18rpx);
	opacity: 0.9;
	animation: haze-float 1.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.haze-left {
	left: -60rpx;
	bottom: 220rpx;
	width: 260rpx;
	height: 260rpx;
	background: radial-gradient(circle, rgba(207, 223, 244, 0.5), transparent 68%);
}

.haze-right {
	right: -40rpx;
	top: 220rpx;
	width: 220rpx;
	height: 220rpx;
	background: radial-gradient(circle, rgba(244, 220, 229, 0.48), transparent 68%);
	animation-delay: 0.08s;
}

.launch-wind-track {
	position: absolute;
	left: 50%;
	border-top: 4rpx dashed rgba(151, 168, 183, 0.34);
	border-radius: 999rpx;
	opacity: 0;
	transform-origin: center;
	animation: wind-sweep 1.64s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.track-one {
	top: 54%;
	width: 320rpx;
	height: 80rpx;
	margin-left: -200rpx;
	--wind-rotate: -10deg;
	transform: rotate(-10deg);
}

.track-two {
	top: 45%;
	width: 420rpx;
	height: 112rpx;
	margin-left: -80rpx;
	--wind-rotate: -26deg;
	transform: rotate(-26deg);
	animation-delay: 0.1s;
}

.track-three {
	top: 32%;
	width: 360rpx;
	height: 88rpx;
	margin-left: 10rpx;
	--wind-rotate: -34deg;
	transform: rotate(-34deg);
	animation-delay: 0.18s;
}

.origami-plane {
	position: absolute;
	left: 50%;
	bottom: 208rpx;
	width: 360rpx;
	height: 248rpx;
	transform: translateX(-50%);
	perspective: 1400rpx;
	animation: plane-flight 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-plane-shadow {
	position: absolute;
	left: 50%;
	bottom: 2rpx;
	width: 210rpx;
	height: 40rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(115, 123, 135, 0.24), transparent 68%);
	transform: translateX(-50%);
	animation: plane-shadow 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-plane-body {
	position: absolute;
	inset: 0;
	transform-style: preserve-3d;
	animation: plane-body-bank 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-wing,
.origami-core,
.origami-nose {
	position: absolute;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 243, 236, 0.98) 72%),
		repeating-linear-gradient(180deg, transparent 0 28rpx, rgba(154, 164, 175, 0.08) 28rpx 30rpx);
	border: 2rpx solid rgba(198, 187, 171, 0.52);
	box-shadow: 0 18rpx 26rpx rgba(104, 108, 113, 0.12);
}

.origami-wing {
	top: 30rpx;
	width: 176rpx;
	height: 128rpx;
	padding: 18rpx 18rpx 0;
	overflow: hidden;
	transform-origin: bottom center;
}

.wing-left {
	left: 10rpx;
	clip-path: polygon(0 0, 100% 18%, 66% 100%, 0 74%);
	animation: wing-fold-left 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.wing-right {
	right: 10rpx;
	clip-path: polygon(0 18%, 100% 0, 100% 74%, 34% 100%);
	animation: wing-fold-right 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-wing-copy {
	display: block;
	font-size: 18rpx;
	line-height: 1.5;
	color: rgba(106, 116, 124, 0.72);
	letter-spacing: 1rpx;
	transform: rotate(-4deg);
}

.wing-right .origami-wing-copy {
	transform: rotate(4deg);
	text-align: right;
}

.origami-core {
	left: 50%;
	top: 42rpx;
	width: 118rpx;
	height: 164rpx;
	border-radius: 14rpx 14rpx 40rpx 40rpx;
	transform: translateX(-50%);
	clip-path: polygon(50% 0, 100% 28%, 74% 100%, 26% 100%, 0 28%);
	animation: core-fold 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-core-line {
	position: absolute;
	background: rgba(147, 158, 169, 0.26);
}

.line-left,
.line-right {
	top: 36rpx;
	bottom: 24rpx;
	width: 2rpx;
}

.line-left {
	left: 34rpx;
	transform: rotate(22deg);
}

.line-right {
	right: 34rpx;
	transform: rotate(-22deg);
}

.line-center {
	left: 50%;
	top: 18rpx;
	bottom: 20rpx;
	width: 2rpx;
	transform: translateX(-50%);
}

.origami-nose {
	left: 50%;
	top: 4rpx;
	width: 136rpx;
	height: 82rpx;
	transform: translateX(-50%);
	clip-path: polygon(50% 0, 100% 100%, 0 100%);
	animation: nose-fold 1.64s cubic-bezier(0.2, 0.95, 0.32, 1) forwards;
}

.origami-launch-copy {
	position: absolute;
	left: 50%;
	bottom: 118rpx;
	width: 520rpx;
	max-width: calc(100vw - 96rpx);
	text-align: center;
	transform: translateX(-50%);
	animation: launch-copy-rise 0.92s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.launch-copy-kicker {
	display: block;
	font-size: 20rpx;
	letter-spacing: 6rpx;
	text-transform: uppercase;
	color: rgba(112, 122, 132, 0.84);
}

.launch-copy-title {
	display: block;
	margin-top: 12rpx;
	font-size: 38rpx;
	font-weight: 700;
	line-height: 1.28;
	color: rgba(44, 54, 58, 0.96);
}

.launch-copy-note {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.65;
	color: rgba(112, 122, 132, 0.92);
}

.theme-dark .origami-launch-scene {
	background:
		radial-gradient(circle at 16% 18%, rgba(86, 104, 121, 0.28), transparent 30%),
		radial-gradient(circle at 84% 76%, rgba(111, 92, 101, 0.24), transparent 28%),
		linear-gradient(180deg, rgba(15, 20, 22, 0.16), rgba(15, 20, 22, 0.08));
}

.theme-dark .launch-copy-kicker,
.theme-dark .launch-copy-note {
	color: rgba(197, 206, 212, 0.78);
}

.theme-dark .launch-copy-title {
	color: rgba(233, 239, 243, 0.96);
}

.theme-dark .launch-wind-track {
	border-top-color: rgba(173, 187, 199, 0.18);
}

.theme-dark .origami-wing,
.theme-dark .origami-core,
.theme-dark .origami-nose {
	background:
		linear-gradient(180deg, rgba(37, 45, 50, 0.96), rgba(26, 33, 37, 0.98) 72%),
		repeating-linear-gradient(180deg, transparent 0 28rpx, rgba(139, 154, 166, 0.08) 28rpx 30rpx);
	border-color: rgba(230, 237, 241, 0.08);
	box-shadow: 0 18rpx 26rpx rgba(0, 0, 0, 0.24);
}

.theme-dark .origami-wing-copy {
	color: rgba(187, 197, 205, 0.48);
}

@keyframes haze-float {
	0% {
		opacity: 0;
		transform: scale(0.86) translateY(24rpx);
	}
	100% {
		opacity: 0.9;
		transform: scale(1) translateY(0);
	}
}

@keyframes launch-copy-rise {
	0% {
		opacity: 0;
		transform: translateX(-50%) translateY(22rpx);
	}
	100% {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
}

@keyframes wind-sweep {
	0% {
		opacity: 0;
		transform: translate3d(-80rpx, 34rpx, 0) scale(0.82) rotate(var(--wind-rotate, 0deg));
	}
	28% {
		opacity: 0.55;
	}
	100% {
		opacity: 0;
		transform: translate3d(240rpx, -170rpx, 0) scale(1.08) rotate(var(--wind-rotate, 0deg));
	}
}

@keyframes plane-flight {
	0% {
		transform: translateX(-50%) translate3d(0, 34rpx, 0) scale(1.02);
	}
	42% {
		transform: translateX(-50%) translate3d(0, 0, 0) scale(1);
	}
	68% {
		transform: translateX(-50%) translate3d(42rpx, -96rpx, 0) scale(0.92);
	}
	100% {
		transform: translateX(-50%) translate3d(246rpx, -560rpx, 0) scale(0.54);
	}
}

@keyframes plane-body-bank {
	0% {
		transform: rotate(0deg) rotateX(0deg) rotateY(0deg);
	}
	40% {
		transform: rotate(-8deg) rotateX(6deg) rotateY(0deg);
	}
	68% {
		transform: rotate(-12deg) rotateX(10deg) rotateY(-6deg);
	}
	100% {
		transform: rotate(-24deg) rotateX(14deg) rotateY(-18deg);
	}
}

@keyframes plane-shadow {
	0% {
		opacity: 0.18;
		transform: translateX(-50%) scale(1);
	}
	100% {
		opacity: 0;
		transform: translateX(-10%) scale(0.46);
	}
}

@keyframes wing-fold-left {
	0% {
		transform: translate3d(0, 44rpx, 0) rotate(0deg) rotateY(0deg);
	}
	34% {
		transform: translate3d(0, 0, 0) rotate(-6deg) rotateY(0deg);
	}
	62% {
		transform: translate3d(18rpx, -6rpx, 0) rotate(-14deg) rotateY(58deg);
	}
	100% {
		transform: translate3d(42rpx, 4rpx, 0) rotate(-24deg) rotateY(72deg);
	}
}

@keyframes wing-fold-right {
	0% {
		transform: translate3d(0, 44rpx, 0) rotate(0deg) rotateY(0deg);
	}
	34% {
		transform: translate3d(0, 0, 0) rotate(6deg) rotateY(0deg);
	}
	62% {
		transform: translate3d(-18rpx, -6rpx, 0) rotate(14deg) rotateY(-58deg);
	}
	100% {
		transform: translate3d(-42rpx, 4rpx, 0) rotate(24deg) rotateY(-72deg);
	}
}

@keyframes core-fold {
	0% {
		transform: translateX(-50%) translateY(36rpx) scaleY(1.08);
	}
	38% {
		transform: translateX(-50%) translateY(0) scaleY(1);
	}
	66% {
		transform: translateX(-50%) translateY(-4rpx) rotateX(12deg);
	}
	100% {
		transform: translateX(-50%) translateY(-8rpx) rotateX(18deg);
	}
}

@keyframes nose-fold {
	0% {
		transform: translateX(-50%) translateY(56rpx) rotateX(-28deg);
	}
	42% {
		transform: translateX(-50%) translateY(8rpx) rotateX(-6deg);
	}
	68% {
		transform: translateX(-50%) translateY(2rpx) rotateX(4deg);
	}
	100% {
		transform: translateX(-50%) translateY(-2rpx) rotateX(12deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.throw-frame,
	.launch-btn,
	.origami-launch-scene,
	.origami-plane,
	.origami-plane-body,
	.origami-wing,
	.origami-core,
	.origami-nose,
	.launch-haze,
	.launch-wind-track,
	.origami-launch-copy {
		animation: none !important;
		transition-duration: 0.01ms !important;
	}

	.throw-frame.is-launching {
		opacity: 0.3;
		filter: none;
		transform: none;
	}

	.origami-plane {
		transform: translateX(-50%) translate3d(180rpx, -380rpx, 0) scale(0.6);
	}
}
</style>
