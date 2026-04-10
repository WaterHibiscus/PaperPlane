<script>
	import { fetchCurrentUser } from './common/auth.js'
	import { appState, syncThemeWindow } from './common/app-state.js'

	export default {
		onLaunch: async function() {
			console.log('PaperPlane App Launch')
			syncThemeWindow(appState.theme)
			try {
				await fetchCurrentUser()
			} catch (error) {
				// Ignore startup sync failures to avoid blocking the app.
			}
		},
		onShow: function() {
			syncThemeWindow(appState.theme)
		}
	}
</script>
<style lang="scss">
page {
	min-height: 100%;
	background: #f7f2e9;
	color: #1c2428;
	font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

html,
body,
.uni-page-body,
scroll-view,
.uni-scroll-view,
.uni-scroll-view-content {
	scrollbar-width: none;
	-ms-overflow-style: none;
}

page::-webkit-scrollbar,
html::-webkit-scrollbar,
body::-webkit-scrollbar,
.uni-page-body::-webkit-scrollbar,
scroll-view::-webkit-scrollbar,
.uni-scroll-view::-webkit-scrollbar,
.uni-scroll-view-content::-webkit-scrollbar {
	width: 0;
	height: 0;
	display: none;
	background: transparent;
}

view,
text,
button,
input,
textarea,
scroll-view {
	box-sizing: border-box;
}

.theme-light {
	--bg: #f7f2e9;
	--bg-2: #eef4f1;
	--surface: rgba(255, 255, 255, 0.78);
	--surface-solid: #ffffff;
	--ink: #1c2428;
	--muted: #68737d;
	--accent: #2f9e74;
	--accent-2: #f27a4b;
	--accent-3: #ffcf5a;
	--border: rgba(28, 36, 40, 0.08);
	--ring: rgba(47, 158, 116, 0.25);
	--shadow: 0 20rpx 56rpx rgba(31, 36, 40, 0.12);
	--shadow-soft: 0 14rpx 34rpx rgba(31, 36, 40, 0.08);
	--mood-happy: #ff7b7b;
	--mood-sad: #6aa7ff;
	--mood-calm: #36b37e;
	--mood-angry: #ff9f1c;
	--mood-love: #ff6fb1;
}

.theme-dark {
	--bg: #0f1416;
	--bg-2: #111a1d;
	--surface: rgba(22, 31, 35, 0.84);
	--surface-solid: #161f23;
	--ink: #e6edf1;
	--muted: #a0aab2;
	--accent: #36c08d;
	--accent-2: #ff985f;
	--accent-3: #ffd26a;
	--border: rgba(230, 237, 241, 0.08);
	--ring: rgba(54, 192, 141, 0.24);
	--shadow: 0 20rpx 56rpx rgba(0, 0, 0, 0.35);
	--shadow-soft: 0 14rpx 34rpx rgba(0, 0, 0, 0.24);
	--mood-happy: #ff8f8f;
	--mood-sad: #79b6ff;
	--mood-calm: #59d5a1;
	--mood-angry: #ffb347;
	--mood-love: #ff91c5;
}

.app-page {
	min-height: 100vh;
	padding: 28rpx 28rpx 72rpx;
	background:
		radial-gradient(circle at 10% 0%, rgba(47, 158, 116, 0.18), transparent 30%),
		radial-gradient(circle at 100% 0%, rgba(242, 122, 75, 0.18), transparent 28%),
		linear-gradient(180deg, var(--bg), var(--bg-2));
	color: var(--ink);
}

.with-tabbar {
	padding-bottom: 200rpx;
}

.glass-card {
	background: var(--surface);
	border: 2rpx solid var(--border);
	border-radius: 32rpx;
	box-shadow: var(--shadow-soft);
	backdrop-filter: blur(22rpx);
}

.section-title {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	margin: 22rpx 0 18rpx;
}

.section-heading {
	font-size: 36rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
}

.section-note {
	font-size: 22rpx;
	color: var(--muted);
}

.chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
	line-height: 1;
	color: var(--muted);
	background: rgba(255, 255, 255, 0.72);
	border: 2rpx solid var(--border);
	white-space: nowrap;
}

.theme-dark .chip {
	background: rgba(20, 28, 32, 0.86);
}

.chip.active {
	color: #ffffff;
	background: linear-gradient(135deg, var(--accent), var(--accent-2));
	border-color: transparent;
	box-shadow: 0 16rpx 30rpx rgba(47, 158, 116, 0.22);
}

.icon-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.74);
	border: 2rpx solid var(--border);
	color: var(--ink);
	box-shadow: var(--shadow-soft);
}

.theme-dark .icon-btn {
	background: rgba(20, 28, 32, 0.88);
}

.primary-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 34rpx;
	height: 84rpx;
	border-radius: 999rpx;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	background: linear-gradient(135deg, var(--accent), #4ac28f);
	box-shadow: 0 18rpx 34rpx rgba(47, 158, 116, 0.25);
}

.ghost-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 28rpx;
	height: 84rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	color: var(--ink);
	background: rgba(255, 255, 255, 0.76);
	border: 2rpx solid var(--border);
}

.theme-dark .ghost-pill {
	background: rgba(20, 28, 32, 0.88);
}

.page-head {
	margin-bottom: 20rpx;
}

.page-title {
	font-size: 40rpx;
	font-weight: 700;
	line-height: 1.2;
}

.page-subtitle {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: var(--muted);
}

.empty-card {
	padding: 50rpx 36rpx;
	text-align: center;
}

.empty-title {
	font-size: 30rpx;
	font-weight: 600;
	margin-bottom: 10rpx;
}

.empty-desc {
	font-size: 24rpx;
	color: var(--muted);
	line-height: 1.6;
}

.placeholder-text {
	color: #9ea7b0;
}
</style>

