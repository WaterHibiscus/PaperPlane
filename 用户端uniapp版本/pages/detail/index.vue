<template>
	<view :class="['app-page', 'detail-page', themeClass]" :style="detailStyle">
		<view class="detail-nav">
			<view class="nav-btn" @tap="goBack">
				<image class="nav-icon-image" :src="backIcon" mode="aspectFit" />
			</view>
			<view class="nav-center">
				<text class="nav-kicker">{{ labels.archive }}</text>
				<text class="nav-title">{{ labels.openPlane }}</text>
			</view>
			<view class="nav-btn" @tap="handleShare">
				<image class="nav-icon-image" :src="shareIcon" mode="aspectFit" />
			</view>
		</view>

		<view v-if="plane" class="detail-shell">
			<view class="detail-head">
				<text class="detail-kicker">{{ labels.dropPoint }}</text>
				<text class="detail-title">{{ plane.locationTag }}</text>
				<view class="meta-row">
					<view class="meta-item mood-item">
						<image class="mood-icon-image" :src="moodMeta.icon" mode="aspectFit" />
						<text>{{ moodMeta.label }}</text>
					</view>
					<text class="meta-item">{{ authorText }}</text>
					<text class="meta-item">{{ planeTime }}</text>
					<text class="meta-item">{{ remainingText }}</text>
				</view>
			</view>

			<view class="note-section">
				<text class="note-id">{{ labels.signalNote }} #{{ shortId }}</text>
				<text class="note-body">{{ plane.content }}</text>
			</view>

			<view v-if="planeImageUrls.length" class="gallery-section">
				<view class="gallery-main" @tap="previewPlaneImages(galleryActiveIndex)">
					<swiper
						class="gallery-swiper"
						:current="galleryActiveIndex"
						:autoplay="planeImageUrls.length > 1"
						:circular="planeImageUrls.length > 1"
						:interval="3200"
						:duration="420"
						indicator-dots
						indicator-color="rgba(255,255,255,0.42)"
						indicator-active-color="rgba(255,255,255,0.92)"
						@change="handleGalleryChange"
					>
						<swiper-item v-for="(image, index) in planeImageUrls" :key="`${image}-${index}`">
							<image class="gallery-main-image" :src="image" mode="aspectFill" lazy-load />
						</swiper-item>
					</swiper>
					<view class="gallery-main-badge">
						<text>{{ galleryActiveIndex + 1 }}/{{ planeImageUrls.length }}</text>
					</view>
				</view>

				<scroll-view
					v-if="planeImageUrls.length > 1"
					class="gallery-scroll"
					scroll-x
					:scroll-left="galleryScrollLeft"
					scroll-with-animation
				>
					<view class="gallery-track">
						<view
							v-for="(image, index) in planeImageUrls"
							:key="`${image}-${index}`"
							:class="['gallery-thumb', galleryActiveIndex === index ? 'active' : '']"
							@tap="setGalleryImage(index)"
						>
							<image class="gallery-thumb-image" :src="image" mode="aspectFill" lazy-load />
						</view>
					</view>
				</scroll-view>
			</view>

			<view class="report-row">
				<text class="report-link" @tap="handleReport">{{ labels.reportAction }}</text>
			</view>

			<view class="action-section">
				<view class="engagement-row">
					<view class="stats-row">
						<view class="stat-item">
							<text class="stat-value">{{ plane.pickCount }}</text>
							<text class="stat-label">{{ labels.pick }}</text>
						</view>
						<view class="stat-item">
							<text class="stat-value">{{ plane.likeCount }}</text>
							<text class="stat-label">{{ labels.like }}</text>
						</view>
						<view class="stat-item">
							<text class="stat-value">{{ comments.length }}</text>
							<text class="stat-label">{{ labels.comment }}</text>
						</view>
					</view>

					<view class="action-side">
						<view class="action-btn action-primary" @tap="handleLike">
							<view class="action-copy">
								<text class="action-kicker">{{ labels.likeActionKicker }}</text>
								<text class="action-title">{{ labels.likeAction }}</text>
								<text class="action-note">{{ labels.likeActionNote }}</text>
							</view>
							<text class="action-arrow">↗</text>
						</view>
					</view>
				</view>

				<view v-if="hasVote" class="attitude-panel">
					<view class="attitude-head" @tap="attitudeExpanded = !attitudeExpanded">
						<view class="attitude-copy">
							<text class="attitude-title">{{ voteTitleText }}</text>
							<text class="attitude-note">{{ labels.attitudeDesc }}</text>
						</view>
						<view class="attitude-head-side">
							<text class="attitude-total">{{ attitudeSummary.totalCount }} {{ labels.voteUnit }}</text>
							<text class="attitude-toggle-text">{{ attitudeExpanded ? labels.collapseVotes : labels.expandVotes }}</text>
							<text :class="['attitude-chevron', attitudeExpanded ? 'expanded' : '']">⌄</text>
						</view>
					</view>

					<view v-if="attitudeExpanded" class="attitude-body">
						<view class="attitude-list">
						<view
							v-for="item in attitudeItems"
							:key="item.key"
							:class="['attitude-item', item.selected ? 'active' : '', attitudeLocked ? 'locked' : '']"
							@tap.stop="handleAttitudeVote(item.key)"
						>
							<view class="attitude-top">
								<view class="attitude-meta">
									<text class="attitude-icon">{{ item.icon }}</text>
									<view class="attitude-meta-copy">
										<text class="attitude-name">{{ item.label }}</text>
										<text class="attitude-state">{{ item.stateText }}</text>
									</view>
								</view>
								<text class="attitude-count">{{ item.count }}</text>
							</view>
							<view class="attitude-bar">
								<view class="attitude-fill" :style="{ width: `${item.percent}%` }"></view>
							</view>
						</view>
					</view>
					</view>
				</view>
			</view>

			<view class="thread-section">
				<view class="thread-head">
					<view class="thread-copy">
						<text class="thread-title">{{ labels.echoTitle }}</text>
						<text class="thread-note">{{ labels.echoDesc }}</text>
					</view>
					<text class="thread-count">{{ comments.length }} {{ labels.echoSubtitle }}</text>
				</view>

				<view v-if="!comments.length" class="thread-empty">
					<text class="empty-title">{{ labels.echoEmptyTitle }}</text>
					<text class="empty-desc">{{ labels.echoEmptyDesc }}</text>
				</view>

				<view v-else class="comment-list">
					<comment-thread-node
						v-for="comment in commentTree"
						:key="comment.id"
						:comment="comment"
						@reply="openComposer"
					/>
				</view>
			</view>

			<view class="composer-dock">
				<view class="composer-trigger" @tap="openComposer()">
					<view class="composer-trigger-copy">
						<text class="composer-trigger-title">{{ labels.openComposer }}</text>
						<text class="composer-trigger-note">{{ labels.openComposerNote }}</text>
					</view>
					<text class="composer-trigger-count">{{ comments.length }}</text>
				</view>
			</view>

			<view :class="['composer-overlay', composerVisible ? 'visible' : '']" @tap="closeComposer"></view>

			<view :class="['composer-sheet', composerVisible ? 'visible' : '']" @tap.stop>
				<view class="sheet-handle"></view>
				<view class="sheet-head">
					<text class="sheet-title">{{ replyTargetName ? `${labels.replyPrefix}${replyTargetName}` : labels.sheetTitle }}</text>
					<text class="sheet-close" @tap="closeComposer">{{ labels.closeText }}</text>
				</view>

				<view class="composer">
					<view v-if="replyTarget" class="reply-banner">
						<text class="reply-banner-text">{{ labels.replyPrefix }}{{ replyTargetName }}</text>
						<text class="reply-banner-clear" @tap="clearReplyTarget">{{ labels.cancelReply }}</text>
					</view>
					<view class="composer-field">
						<textarea
							v-model="reply"
							class="composer-input"
							maxlength="200"
							:placeholder="replyTargetName ? `${labels.replyPrefix}${replyTargetName}...` : labels.commentPlaceholder"
							placeholder-class="placeholder-text"
						/>
						<view class="anonymous-toggle" @tap="commentIdentity = commentIdentity === 'anonymous' ? 'named' : 'anonymous'">
							<view :class="['anonymous-check', commentIdentity === 'anonymous' ? 'checked' : '']">
								<view class="anonymous-dot"></view>
							</view>
							<text class="anonymous-text">{{ labels.anonymousSend }}</text>
						</view>
					</view>
					<view class="composer-footer">
						<text class="composer-hint">{{ commentIdentity === 'named' ? realNameHint : labels.composerHint }}</text>
						<view class="submit-btn" @tap="handleComment">
							<text>{{ labels.sendReply }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-else class="loading-state">
			<text class="empty-title">{{ labels.loadingTitle }}</text>
			<text class="empty-desc">{{ labels.loadingDesc }}</text>
		</view>
	</view>
</template>

<script>
import CommentThreadNode from '../../components/CommentThreadNode.vue'
import { appState, syncThemeWindow } from '../../common/app-state.js'
import { addComment, getAssetUrl, getComments, getPlaneAttitudes, getPlaneDetail, likePlane, reportPlane, votePlaneAttitude } from '../../common/api.js'
import { getVoterKey } from '../../common/storage.js'
import { formatTime, getPlaneAuthorLabel, getRemainingText } from '../../common/utils.js'
import { getMoodMeta } from '../../common/moods.js'
import { uiIcons } from '../../common/ui-icons.js'

export default {
	components: {
		CommentThreadNode,
	},
	data() {
		return {
			appState,
			id: '',
			plane: null,
			comments: [],
			replyTarget: null,
			reply: '',
			remainingText: '',
			timer: null,
			galleryActiveIndex: 0,
			galleryScrollLeft: 0,
			composerVisible: false,
			commentIdentity: 'named',
			attitudeExpanded: false,
			voterKey: getVoterKey(),
			attitudeSummary: {
				options: [],
				myChoice: null,
				totalCount: 0,
			},
			backIcon: uiIcons.back,
			shareIcon: uiIcons.more,
			labels: {
				archive: '纸飞机',
				openPlane: '详情',
				dropPoint: '降落点',
				signalNote: '纸条编号',
				pick: '拾取',
				like: '点赞',
				comment: '回声',
				likeAction: '续航',
				likeActionKicker: 'FUEL',
				likeActionNote: '让它多飞一会',
				reportAction: '举报',
				echoTitle: '匿名回声',
				echoDesc: '善语结善缘，恶语伤人心',
				echoSubtitle: '条',
				attitudeDesc: '点一下，看看大家更想表达什么。',
				voteUnit: '票',
				expandVotes: '展开',
				collapseVotes: '收起',
				myVote: '我的选择',
				tapVote: '点击投票',
				voteLocked: '已投票',
				voteDone: '你已经投过票了',
				echoEmptyTitle: '这里还没有回声',
				echoEmptyDesc: '如果你愿意，可以留下第一句。',
				commentPlaceholder: '写下你的回应...',
				replyPrefix: '回复 ',
				cancelReply: '取消回复',
				openComposer: '写评论',
				openComposerNote: '良缘一句三冬暖，恶语伤人六月寒',
				sheetTitle: '发表评论',
				closeText: '关闭',
				anonymousSend: '匿名发送',
				composerHint: '勾选后将匿名发送。',
				sendReply: '发送',
				anonymousFallback: '匿名同学',
				loadingTitle: '正在打开纸飞机',
				loadingDesc: '正在载入内容和评论。',
				shareCopied: '已复制到剪贴板',
				writeBeforeSend: '写点内容再发送',
				loadFailed: '加载失败',
				likeFailed: '点赞失败',
				likeSuccess: '续航成功',
				reportFailed: '举报失败',
				reportSuccess: '举报已收到',
				sendFailed: '发送失败',
			},
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
		planeTime() {
			return this.plane ? formatTime(this.plane.createTime) : ''
		},
		authorText() {
			return getPlaneAuthorLabel(this.plane)
		},
		moodMeta() {
			return getMoodMeta(this.plane?.mood)
		},
		shortId() {
			if (!this.id) return '--'
			return String(this.id).slice(0, 8).toUpperCase()
		},
		planeImageUrls() {
			return (this.plane?.imageUrls || []).map(item => getAssetUrl(item))
		},
		hasVote() {
			return Array.isArray(this.plane?.voteOptions) && this.plane.voteOptions.length > 0
		},
		voteTitleText() {
			return this.plane?.voteTitle || '大家的态度'
		},
		attitudeItems() {
			const counts = this.attitudeSummary.options || []
			const total = this.attitudeSummary.totalCount || 0
			return (this.plane?.voteOptions || []).map((option, index) => {
				const current = counts.find(item => item.optionKey === option)
				const count = current?.count || 0
				const selected = this.attitudeSummary.myChoice === option
				return {
					key: option,
					icon: ['💭', '🫶', '⚡', '💬'][index % 4],
					label: option,
					count,
					selected,
					stateText: selected
						? this.labels.myVote
						: this.attitudeLocked
							? this.labels.voteLocked
							: this.labels.tapVote,
					percent: total ? Math.max(Math.round((count / total) * 100), count > 0 ? 8 : 0) : 0,
				}
			})
		},
		commentTree() {
			const nodes = this.comments.map(item => ({
				...item,
				rootCommentId: null,
				children: [],
			}))
			const map = new Map(nodes.map(item => [item.id, item]))
			const roots = []
			const findRootId = node => {
				let current = node
				while (current?.parentCommentId && map.has(current.parentCommentId)) {
					current = map.get(current.parentCommentId)
				}
				return current?.id || node.id
			}

			nodes.forEach(node => {
				const rootId = findRootId(node)
				node.rootCommentId = rootId
				if (node.parentCommentId && map.has(rootId) && rootId !== node.id) {
					map.get(rootId).children.push(node)
					return
				}
				roots.push(node)
			})

			const sortNodes = items => {
				items.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
				items.forEach(item => sortNodes(item.children))
			}

			sortNodes(roots)
			return roots
		},
		attitudeLocked() {
			return Boolean(this.attitudeSummary.myChoice)
		},
		replyTargetName() {
			return this.replyTarget?.nickName || ''
		},
		realNameHint() {
			return `当前以“${this.appState.profileName}”实名发送`
		},
		detailStyle() {
			return {
				'--mood-color': this.moodMeta.color,
				'--mood-soft': this.hexToRgba(this.moodMeta.color, 0.1),
				'--mood-line': this.hexToRgba(this.moodMeta.color, 0.18),
			}
		},
	},
	onLoad(options) {
		this.id = options.id || ''
	},
	onShow() {
		syncThemeWindow(this.appState.theme)
		if (this.id) {
			this.loadDetail()
		}
	},
	onHide() {
		this.composerVisible = false
		this.replyTarget = null
		this.clearTimer()
	},
	onUnload() {
		this.composerVisible = false
		this.replyTarget = null
		this.clearTimer()
	},
	methods: {
		hexToRgba(hex, alpha) {
			const value = String(hex || '#909399').replace('#', '')
			const normalized = value.length === 3
				? value.split('').map(char => char + char).join('')
				: value
			const red = parseInt(normalized.slice(0, 2), 16)
			const green = parseInt(normalized.slice(2, 4), 16)
			const blue = parseInt(normalized.slice(4, 6), 16)
			return `rgba(${red}, ${green}, ${blue}, ${alpha})`
		},
		goBack() {
			uni.navigateBack({
				fail: () => {
					uni.reLaunch({
						url: '/pages/discover/index',
					})
				},
			})
		},
		openComposer(comment = null) {
			this.replyTarget = comment
			this.composerVisible = true
		},
		closeComposer() {
			this.composerVisible = false
			this.replyTarget = null
		},
		clearReplyTarget() {
			this.replyTarget = null
		},
		previewPlaneImages(index) {
			if (!this.planeImageUrls.length) return
			uni.previewImage({
				urls: this.planeImageUrls,
				current: this.planeImageUrls[index],
			})
		},
		syncGalleryThumb(index) {
			const itemWidth = 148
			const viewportWidth = 540
			const target = Math.max(index * itemWidth - (viewportWidth - itemWidth) / 2, 0)
			this.galleryScrollLeft = target
		},
		handleGalleryChange(event) {
			this.galleryActiveIndex = Number(event.detail.current) || 0
			this.syncGalleryThumb(this.galleryActiveIndex)
		},
		setGalleryImage(index) {
			this.galleryActiveIndex = index
			this.syncGalleryThumb(index)
		},
		async loadDetail() {
			try {
				this.reply = ''
				this.attitudeExpanded = false
				this.galleryActiveIndex = 0
				this.galleryScrollLeft = 0
				this.plane = await getPlaneDetail(this.id)
				this.comments = await getComments(this.id)
				if (Array.isArray(this.plane?.voteOptions) && this.plane.voteOptions.length > 0) {
					try {
						this.attitudeSummary = await getPlaneAttitudes(this.id, this.voterKey)
					} catch (error) {
						this.attitudeSummary = {
							options: [],
							myChoice: null,
							totalCount: 0,
						}
					}
				} else {
					this.attitudeSummary = {
						options: [],
						myChoice: null,
						totalCount: 0,
					}
				}
				this.updateRemaining()
				this.startTimer()
			} catch (error) {
				uni.showToast({
					title: error.message || this.labels.loadFailed,
					icon: 'none',
				})
			}
		},
		updateRemaining() {
			if (!this.plane) return
			this.remainingText = getRemainingText(this.plane.expireTime)
		},
		startTimer() {
			this.clearTimer()
			this.timer = setInterval(() => {
				this.updateRemaining()
			}, 60000)
		},
		clearTimer() {
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		},
		async handleLike() {
			try {
				const result = await likePlane(this.id)
				this.plane.likeCount = result.likeCount
				this.plane.expireTime = result.expireTime
				this.updateRemaining()
				uni.showToast({
					title: this.labels.likeSuccess,
					icon: 'success',
				})
			} catch (error) {
				uni.showToast({
					title: error.message || this.labels.likeFailed,
					icon: 'none',
				})
			}
		},
		async handleReport() {
			try {
				await reportPlane(this.id)
				uni.showToast({
					title: this.labels.reportSuccess,
					icon: 'success',
				})
			} catch (error) {
				uni.showToast({
					title: error.message || this.labels.reportFailed,
					icon: 'none',
				})
			}
		},
		async handleAttitudeVote(optionKey) {
			if (this.attitudeLocked) {
				uni.showToast({
					title: this.labels.voteDone,
					icon: 'none',
				})
				return
			}
			try {
				this.attitudeSummary = await votePlaneAttitude(this.id, optionKey, this.voterKey)
			} catch (error) {
				uni.showToast({
					title: error.message || '投票失败',
					icon: 'none',
				})
			}
		},
		getCommentPayload(reply) {
			const text = String(reply || '').trim()
			if (this.commentIdentity === 'anonymous') {
				return {
					reply: text,
					isAnonymous: true,
					nickName: '',
				}
			}

			const nickName = String(this.appState.profileName || '').trim().slice(0, 30) || '纸飞机同学'
			return {
				reply: text,
				isAnonymous: false,
				nickName,
			}
		},
		async handleComment() {
			if (!this.reply.trim()) {
				uni.showToast({
					title: this.labels.writeBeforeSend,
					icon: 'none',
				})
				return
			}
			const payload = this.getCommentPayload(this.reply)
			if (!payload) return
			try {
				const comment = await addComment(this.id, {
					...payload,
					parentCommentId: this.replyTarget?.rootCommentId || this.replyTarget?.id || null,
				})
				this.comments.push(comment)
				this.plane.commentCount = this.comments.length
				this.reply = ''
				this.composerVisible = false
				this.replyTarget = null
			} catch (error) {
				uni.showToast({
					title: error.message || this.labels.sendFailed,
					icon: 'none',
				})
			}
		},
		handleShare() {
			if (!this.plane) return
			const text = `纸飞机降落点\n地点：${this.plane.locationTag}\n\n${this.plane.content}`
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.showToast({
						title: this.labels.shareCopied,
						icon: 'none',
					})
				},
			})
		},
	},
}
</script>

<style scoped>
.detail-page {
	padding-top: 0;
	padding-bottom: 56rpx;
	background:
		linear-gradient(180deg, var(--bg), var(--bg)),
		radial-gradient(circle at 0 0, var(--mood-soft), transparent 28%);
}

.detail-nav {
	position: sticky;
	top: 0;
	z-index: 20;
	margin: 0 -28rpx;
	padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx 18rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(247, 242, 233, 0.92);
	backdrop-filter: blur(16rpx);
	border-bottom: 2rpx solid rgba(28, 36, 40, 0.05);
}

.theme-dark .detail-nav {
	background: rgba(15, 20, 22, 0.9);
	border-bottom-color: rgba(230, 237, 241, 0.08);
}

.nav-btn {
	width: 68rpx;
	height: 68rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 18rpx;
	color: var(--ink);
	background: transparent;
	border: 2rpx solid var(--border);
}

.nav-icon-image {
	width: 34rpx;
	height: 34rpx;
	display: block;
}

.nav-center {
	flex: 1;
	min-width: 0;
	margin: 0 18rpx;
	text-align: center;
}

.nav-kicker {
	display: block;
	font-size: 18rpx;
	letter-spacing: 3rpx;
	color: var(--muted);
}

.nav-title {
	display: block;
	margin-top: 6rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: var(--ink);
}

.detail-shell,
.loading-state {
	width: 100%;
	max-width: 860px;
	margin: 0 auto;
}

.detail-shell {
	padding-top: 26rpx;
	padding-bottom: 170rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.detail-head {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.detail-kicker {
	font-size: 18rpx;
	letter-spacing: 3rpx;
	color: var(--muted);
}

.detail-title {
	font-size: 48rpx;
	line-height: 1.1;
	font-weight: 700;
	color: var(--ink);
}

.meta-row {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx 18rpx;
	padding-top: 12rpx;
	border-top: 2rpx solid var(--border);
}

.meta-item {
	font-size: 22rpx;
	line-height: 1.5;
	color: var(--muted);
}

.mood-item {
	color: var(--mood-color);
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
}

.mood-icon-image {
	width: 22rpx;
	height: 22rpx;
	display: block;
	flex-shrink: 0;
}

.note-section {
	padding-left: 22rpx;
	border-left: 4rpx solid var(--mood-color);
}

.note-id {
	display: block;
	font-size: 18rpx;
	letter-spacing: 2rpx;
	color: var(--muted);
}

.note-body {
	display: block;
	margin-top: 18rpx;
	font-size: 34rpx;
	line-height: 1.9;
	color: var(--ink);
	word-break: break-word;
	white-space: pre-wrap;
}

.gallery-section {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	margin-top: -6rpx;
}

.gallery-main {
	position: relative;
	height: 500rpx;
	border-radius: 28rpx;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.62);
}

.gallery-swiper {
	width: 100%;
	height: 100%;
}

.gallery-main-image {
	width: 100%;
	height: 100%;
}

.gallery-main-badge {
	position: absolute;
	right: 16rpx;
	bottom: 16rpx;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(15, 20, 22, 0.52);
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.96);
}

.gallery-scroll {
	white-space: nowrap;
}

.gallery-track {
	display: inline-flex;
	gap: 12rpx;
	padding-right: 8rpx;
}

.gallery-thumb {
	width: 136rpx;
	height: 136rpx;
	padding: 4rpx;
	border-radius: 22rpx;
	flex-shrink: 0;
	background: rgba(255, 255, 255, 0.54);
	border: 2rpx solid rgba(28, 36, 40, 0.05);
}

.theme-dark .gallery-thumb {
	background: rgba(255, 255, 255, 0.04);
	border-color: rgba(230, 237, 241, 0.08);
}

.gallery-thumb.active {
	border-color: var(--mood-color);
	background: var(--mood-soft);
}

.gallery-thumb-image {
	width: 100%;
	height: 100%;
	border-radius: 18rpx;
}

.report-row {
	display: flex;
	justify-content: flex-end;
	margin-top: -10rpx;
}

.report-link {
	padding: 8rpx 0;
	font-size: 20rpx;
	line-height: 1.4;
	color: var(--muted);
}

.engagement-row {
	display: flex;
	align-items: stretch;
	gap: 16rpx;
}

.stats-row {
	flex: 3;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
	padding: 18rpx 0 16rpx;
	border-top: 2rpx solid var(--border);
	border-bottom: 2rpx solid var(--border);
}

.stat-item {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.stat-value {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--ink);
}

.stat-label {
	font-size: 20rpx;
	color: var(--muted);
}

.action-section {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.action-side {
	flex: 2;
	display: flex;
	align-items: stretch;
}

.action-btn {
	flex: 1;
	min-height: 112rpx;
	padding: 18rpx 20rpx 16rpx 22rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.action-primary {
	color: var(--ink);
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.78)),
		linear-gradient(135deg, var(--mood-soft), rgba(255, 255, 255, 0.12));
	border: 2rpx solid var(--mood-line);
	box-shadow:
		0 7rpx 12rpx rgba(31, 36, 40, 0.08),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.88);
}

.theme-dark .action-primary {
	background:
		linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
		linear-gradient(135deg, var(--mood-soft), rgba(255, 255, 255, 0.02));
	box-shadow:
		0 14rpx 24rpx rgba(0, 0, 0, 0.18),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.06);
}

.action-copy {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4rpx;
	min-width: 0;
}

.action-kicker {
	font-size: 18rpx;
	letter-spacing: 3rpx;
	color: var(--mood-color);
}

.action-title {
	font-size: 28rpx;
	line-height: 1.2;
	font-weight: 700;
	color: var(--ink);
}

.action-note {
	font-size: 20rpx;
	line-height: 1.4;
	color: var(--muted);
}

.action-arrow {
	flex-shrink: 0;
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.74);
	border: 2rpx solid rgba(28, 36, 40, 0.06);
	font-size: 24rpx;
	line-height: 1;
	color: var(--mood-color);
}

.theme-dark .action-arrow {
	background: rgba(255, 255, 255, 0.05);
	border-color: rgba(230, 237, 241, 0.08);
}

.attitude-panel {
	display: flex;
	flex-direction: column;
	margin-top: 10rpx;
	padding: 0 18rpx 18rpx;
	border-radius: 24rpx;
	border: 2rpx solid rgba(28, 36, 40, 0.05);
	background: rgba(255, 255, 255, 0.42);
}

.theme-dark .attitude-panel {
	border-color: rgba(230, 237, 241, 0.08);
	background: rgba(255, 255, 255, 0.03);
}

.attitude-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 20rpx 0 12rpx;
}

.attitude-head-side {
	display: inline-flex;
	align-items: center;
	gap: 10rpx;
	flex-shrink: 0;
}

.attitude-copy {
	flex: 1;
	min-width: 0;
}

.attitude-title {
	display: block;
	font-size: 24rpx;
	font-weight: 700;
	color: var(--ink);
}

.attitude-note {
	display: block;
	margin-top: 6rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: var(--muted);
}

.attitude-total {
	flex-shrink: 0;
	font-size: 22rpx;
	color: var(--muted);
}

.attitude-toggle-text {
	font-size: 20rpx;
	color: var(--muted);
}

.attitude-chevron {
	font-size: 22rpx;
	line-height: 1;
	color: var(--muted);
	transform: rotate(0deg);
	transition: transform 0.18s ease;
}

.attitude-chevron.expanded {
	transform: rotate(180deg);
}

.attitude-body {
	padding-top: 14rpx;
	border-top: 2rpx solid var(--border);
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.attitude-list {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.attitude-item {
	padding: 16rpx 18rpx;
	border-radius: 20rpx;
	border: 2rpx solid var(--border);
	background: rgba(255, 255, 255, 0.45);
}

.theme-dark .attitude-item {
	background: rgba(255, 255, 255, 0.03);
}

.attitude-item.active {
	border-color: var(--mood-line);
	background: var(--mood-soft);
}

.attitude-item.locked {
	opacity: 0.92;
}

.attitude-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.attitude-meta {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.attitude-icon {
	flex-shrink: 0;
	font-size: 28rpx;
	line-height: 1;
}

.attitude-meta-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.attitude-name {
	font-size: 22rpx;
	font-weight: 600;
	color: var(--ink);
}

.attitude-state {
	font-size: 18rpx;
	color: var(--muted);
}

.attitude-count {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: var(--ink);
}

.attitude-bar {
	margin-top: 12rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: rgba(28, 36, 40, 0.08);
	overflow: hidden;
}

.theme-dark .attitude-bar {
	background: rgba(230, 237, 241, 0.08);
}

.attitude-fill {
	height: 100%;
	min-width: 0;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--mood-color), rgba(47, 158, 116, 0.72));
}

.thread-section {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	padding-top: 8rpx;
}

.thread-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 18rpx;
}

.thread-copy {
	flex: 1;
	min-width: 0;
}

.thread-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: var(--ink);
}

.thread-note {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: var(--muted);
}

.thread-count {
	flex-shrink: 0;
	font-size: 22rpx;
	color: var(--muted);
}

.composer {
	padding-top: 18rpx;
}

.composer-field {
	position: relative;
	padding-bottom: 14rpx;
	border-bottom: 2rpx solid var(--border);
}

.composer-input {
	width: 100%;
	min-height: 170rpx;
	padding-bottom: 44rpx;
	font-size: 28rpx;
	line-height: 1.75;
	color: var(--ink);
	background: transparent;
}

.anonymous-toggle {
	position: absolute;
	right: 0;
	bottom: 6rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 10rpx 0 8rpx 20rpx;
	background: linear-gradient(90deg, rgba(247, 242, 233, 0), var(--bg) 22%);
	font-size: 22rpx;
	line-height: 1;
	color: var(--muted);
}

.anonymous-check {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(28, 36, 40, 0.18);
	background: rgba(255, 255, 255, 0.9);
	box-shadow:
		0 4rpx 10rpx rgba(31, 36, 40, 0.08),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
	transition: all 0.18s ease;
}

.theme-dark .anonymous-check {
	border-color: rgba(230, 237, 241, 0.22);
	background: rgba(24, 30, 33, 0.92);
	box-shadow:
		0 4rpx 10rpx rgba(0, 0, 0, 0.18),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
}

.anonymous-check.checked {
	border-color: var(--mood-color);
	background: var(--mood-soft);
	box-shadow:
		0 6rpx 14rpx rgba(31, 36, 40, 0.1),
		0 0 0 6rpx rgba(255, 255, 255, 0.6);
}

.theme-dark .anonymous-check.checked {
	box-shadow:
		0 6rpx 14rpx rgba(0, 0, 0, 0.18),
		0 0 0 6rpx rgba(24, 30, 33, 0.9);
}

.anonymous-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: var(--mood-color);
	transform: scale(0);
	opacity: 0;
	transition: all 0.18s ease;
}

.anonymous-check.checked .anonymous-dot {
	transform: scale(1);
	opacity: 1;
}

.anonymous-text {
	display: inline-flex;
	align-items: center;
	line-height: 1;
	font-size: 22rpx;
	font-weight: 500;
}

.composer-footer {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	margin-top: 16rpx;
}

.composer-hint {
	flex: 1;
	min-width: 240rpx;
	font-size: 20rpx;
	line-height: 1.6;
	color: var(--muted);
}

.submit-btn {
	min-width: 140rpx;
	height: 70rpx;
	padding: 0 24rpx;
	border-radius: 18rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--ink);
	color: var(--bg);
	font-size: 24rpx;
	font-weight: 600;
}

.thread-empty {
	padding-top: 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.composer-dock {
	position: fixed;
	left: 28rpx;
	right: 28rpx;
	bottom: calc(env(safe-area-inset-bottom) + 20rpx);
	z-index: 30;
}

.composer-trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 18rpx 22rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.92);
	border: 2rpx solid rgba(28, 36, 40, 0.06);
	box-shadow: 0 18rpx 36rpx rgba(31, 36, 40, 0.12);
	backdrop-filter: blur(14rpx);
}

.theme-dark .composer-trigger {
	background: rgba(20, 28, 32, 0.94);
	border-color: rgba(230, 237, 241, 0.08);
	box-shadow: 0 18rpx 36rpx rgba(0, 0, 0, 0.24);
}

.composer-trigger-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.composer-trigger-title {
	font-size: 28rpx;
	font-weight: 700;
	color: var(--ink);
}

.composer-trigger-note {
	font-size: 20rpx;
	line-height: 1.5;
	color: var(--muted);
}

.composer-trigger-count {
	flex-shrink: 0;
	min-width: 52rpx;
	height: 52rpx;
	padding: 0 14rpx;
	border-radius: 999rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--mood-soft);
	font-size: 22rpx;
	font-weight: 700;
	color: var(--mood-color);
}

.composer-overlay {
	position: fixed;
	inset: 0;
	z-index: 39;
	background: rgba(12, 17, 19, 0.28);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.22s ease;
}

.composer-overlay.visible {
	opacity: 1;
	pointer-events: auto;
}

.composer-sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 40;
	padding: 18rpx 28rpx calc(env(safe-area-inset-bottom) + 24rpx);
	border-radius: 30rpx 30rpx 0 0;
	background: rgba(247, 242, 233, 0.98);
	border-top: 2rpx solid rgba(28, 36, 40, 0.05);
	box-shadow: 0 -20rpx 40rpx rgba(31, 36, 40, 0.12);
	transform: translateY(105%);
	transition: transform 0.24s ease;
}

.theme-dark .composer-sheet {
	background: rgba(15, 20, 22, 0.98);
	border-top-color: rgba(230, 237, 241, 0.08);
	box-shadow: 0 -20rpx 40rpx rgba(0, 0, 0, 0.28);
}

.composer-sheet.visible {
	transform: translateY(0);
}

.sheet-handle {
	width: 88rpx;
	height: 8rpx;
	margin: 0 auto 20rpx;
	border-radius: 999rpx;
	background: rgba(28, 36, 40, 0.14);
}

.theme-dark .sheet-handle {
	background: rgba(230, 237, 241, 0.14);
}

.sheet-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 18rpx;
}

.sheet-title {
	font-size: 30rpx;
	font-weight: 700;
	color: var(--ink);
}

.sheet-close {
	font-size: 22rpx;
	color: var(--muted);
}

.comment-list {
	display: flex;
	flex-direction: column;
}

.loading-state {
	padding-top: 80rpx;
}

.reply-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 0 0 16rpx;
}

.reply-banner-text {
	flex: 1;
	min-width: 0;
	font-size: 22rpx;
	color: var(--mood-color);
}

.reply-banner-clear {
	flex-shrink: 0;
	font-size: 20rpx;
	color: var(--muted);
}

@media (max-width: 420px) {
	.detail-title {
		font-size: 42rpx;
	}

	.note-body {
		font-size: 31rpx;
	}

	.engagement-row {
		gap: 12rpx;
	}

	.stats-row {
		gap: 10rpx;
	}

	.submit-btn {
		width: 100%;
	}
}
</style>
