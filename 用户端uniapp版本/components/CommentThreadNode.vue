<template>
	<view :class="['thread-node', depth > 0 ? 'thread-node-child' : '']">
		<view class="comment-item">
			<view class="comment-avatar">
				<text>{{ (comment.nickName || '?').slice(0, 1) }}</text>
			</view>
			<view class="comment-main">
				<view class="comment-top">
					<text class="comment-name">{{ comment.nickName || '匿名同学' }}</text>
					<text class="comment-time">{{ formatCommentTime(comment.createTime) }}</text>
				</view>
				<text v-if="comment.replyToNickName" class="comment-replyto">回复 {{ comment.replyToNickName }}</text>
				<text class="comment-text">{{ comment.reply }}</text>
				<view class="comment-actions">
					<text class="comment-reply-btn" @tap.stop="handleReply">回复</text>
				</view>
			</view>
		</view>

		<view v-if="comment.children && comment.children.length" class="comment-children">
			<comment-thread-node
				v-for="child in visibleChildren"
				:key="child.id"
				:comment="child"
				:depth="depth + 1"
				@reply="$emit('reply', $event)"
			/>
			<view
				v-if="hiddenReplyCount > 0"
				class="comment-collapse-toggle"
				@tap.stop="repliesExpanded = !repliesExpanded"
			>
				<text>{{ repliesExpanded ? `收起回复` : `展开其余 ${hiddenReplyCount} 条回复` }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { formatTime } from '../common/utils.js'

export default {
	name: 'CommentThreadNode',
	props: {
		comment: {
			type: Object,
			required: true,
		},
		depth: {
			type: Number,
			default: 0,
		},
	},
	data() {
		return {
			repliesExpanded: false,
		}
	},
	computed: {
		visibleChildren() {
			const children = this.comment.children || []
			if (children.length <= 1 || this.repliesExpanded) {
				return children
			}
			return children.slice(0, 1)
		},
		hiddenReplyCount() {
			const children = this.comment.children || []
			if (children.length <= 1) {
				return 0
			}
			return this.repliesExpanded ? children.length - 1 : children.length - 1
		},
	},
	methods: {
		formatCommentTime(dateStr) {
			return formatTime(dateStr)
		},
		handleReply() {
			this.$emit('reply', this.comment)
		},
	},
}
</script>

<style scoped>
.thread-node {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.thread-node-child {
	margin-left: 34rpx;
	padding-left: 18rpx;
	border-left: 2rpx solid rgba(28, 36, 40, 0.08);
}

.comment-item {
	display: flex;
	align-items: flex-start;
	gap: 14rpx;
	padding: 18rpx 0;
	border-top: 2rpx solid var(--border);
}

.comment-avatar {
	width: 48rpx;
	height: 48rpx;
	flex-shrink: 0;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--mood-soft);
	color: var(--mood-color);
	font-size: 22rpx;
	font-weight: 700;
}

.comment-main {
	flex: 1;
	min-width: 0;
}

.comment-top {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 16rpx;
}

.comment-name {
	flex: 1;
	min-width: 0;
	font-size: 24rpx;
	font-weight: 600;
	color: var(--ink);
}

.comment-time {
	flex-shrink: 0;
	font-size: 20rpx;
	color: var(--muted);
}

.comment-replyto {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	color: var(--mood-color);
}

.comment-text {
	display: block;
	margin-top: 8rpx;
	font-size: 27rpx;
	line-height: 1.75;
	color: var(--ink);
	word-break: break-word;
}

.comment-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 10rpx;
}

.comment-reply-btn {
	font-size: 22rpx;
	color: var(--muted);
}

.comment-children {
	display: flex;
	flex-direction: column;
}

.comment-collapse-toggle {
	display: inline-flex;
	align-items: center;
	padding: 6rpx 0 2rpx;
	font-size: 22rpx;
	color: var(--muted);
}
</style>
