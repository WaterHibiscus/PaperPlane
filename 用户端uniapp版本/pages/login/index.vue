<template>
	<view :class="['auth-page', themeClass]">
		<view class="auth-page__float auth-page__float--a"></view>
		<view class="auth-page__float auth-page__float--b"></view>

		<view class="auth-page__header">
			<view class="auth-brand">
				<view class="auth-brand__mark">
					<image class="auth-brand__icon" src="/static/images/投掷选中.png" mode="aspectFit" />
				</view>
				<view class="auth-brand__copy">
					<text class="auth-brand__title">校园留言墙</text>
					<text class="auth-brand__subtitle">把想说的话折成纸飞机，轻轻放进校园风里。</text>
				</view>
			</view>
			<text class="auth-brand__status">匿名 · 校园 · 低压</text>
		</view>

		<view class="auth-layout">
			<view class="auth-intro">
				<view class="auth-intro__pin"></view>
				<text class="auth-intro__tag">回到落点</text>
				<text class="auth-intro__title">欢迎回来</text>
				<text class="auth-intro__desc">从图书馆门口到宿舍楼下，所有被风吹起的纸条，都在这里重新落稳。</text>
				<view class="auth-intro__meta">
					<text class="auth-intro__chip">图书馆</text>
					<text class="auth-intro__chip">教学楼</text>
					<text class="auth-intro__chip">宿舍楼下</text>
				</view>
			</view>

			<view class="auth-form-card">
				<view class="auth-form-card__tape"></view>
				<text class="auth-form-card__eyebrow">登录</text>
				<text class="auth-form-card__title">继续接住你的纸飞机</text>
				<text class="auth-form-card__summary">用学号或手机号登录，继续查看、投递和拾取校园里的匿名留言。</text>

				<view class="auth-form">
					<view class="auth-form__field">
						<text class="auth-form__label">学号 / 手机号</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.credential }]">
							<input
								v-model="form.credential"
								class="auth-input"
								maxlength="20"
								placeholder="请输入学号或手机号"
								placeholder-class="auth-placeholder"
							/>
						</view>
					</view>

					<view class="auth-form__field">
						<text class="auth-form__label">密码</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.password }]">
							<input
								v-model="form.password"
								class="auth-input"
								type="password"
								maxlength="20"
								placeholder="请输入密码"
								placeholder-class="auth-placeholder"
							/>
						</view>
					</view>

					<view class="auth-form__field">
						<text class="auth-form__label">验证码</text>
						<view class="auth-code">
							<view :class="['auth-input-shell', { 'is-shaking': shakeMap.code }]">
								<input
									v-model="form.code"
									class="auth-input"
									maxlength="4"
									placeholder="请输入验证码"
									placeholder-class="auth-placeholder"
								/>
							</view>
							<view class="auth-code__panel" @tap="refreshCaptcha">
								<image v-if="captchaImage" class="auth-code__image" :src="captchaImage" mode="aspectFill" />
								<text v-else class="auth-code__value">----</text>
								<text class="auth-code__hint">点击刷新</text>
							</view>
						</view>
					</view>

					<view class="auth-agreement" @tap="toggleAgreement">
						<view :class="['auth-agreement__check', { 'is-active': form.agreed }]">
							<text>{{ form.agreed ? '✓' : '' }}</text>
						</view>
						<view class="auth-agreement__text">
							<text>我已阅读并同意</text>
							<text class="auth-agreement__link" @tap.stop="showAgreement('user')">《用户协议》</text>
							<text>和</text>
							<text class="auth-agreement__link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
						</view>
					</view>

					<view class="auth-submit">
						<view :class="['auth-submit__button', { 'is-disabled': submitting }]" @tap="handleLogin">
							<text>{{ submitting ? '登录中...' : '登录' }}</text>
						</view>
					</view>

					<view class="auth-switch">
						<text>还没有账号？</text>
						<view class="auth-switch__link" @tap="goRegister">
							<text>立即注册</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { appState, syncThemeWindow } from '../../common/app-state.js'
import { fetchCaptcha, getCurrentSession, loginAccount } from '../../common/auth.js'

export default {
	data() {
		return {
			appState,
			form: {
				credential: '',
				password: '',
				code: '',
				agreed: false,
			},
			captchaId: '',
			captchaImage: '',
			shakeMap: {
				credential: false,
				password: false,
				code: false,
			},
			submitting: false,
		}
	},
	computed: {
		themeClass() {
			return this.appState.theme === 'dark' ? 'theme-dark' : 'theme-light'
		},
	},
	onLoad(query) {
		if (query?.account) {
			this.form.credential = decodeURIComponent(query.account)
		}
		this.refreshCaptcha()
	},
	onShow() {
		syncThemeWindow(this.appState.theme)
		if (getCurrentSession()?.accessToken) {
			uni.reLaunch({
				url: '/pages/home/index',
			})
		}
	},
	methods: {
		async refreshCaptcha() {
			try {
				const data = await fetchCaptcha()
				this.captchaId = data?.captchaId || ''
				this.captchaImage = data?.captchaImage || ''
			} catch (error) {
				this.captchaId = ''
				this.captchaImage = ''
				uni.showToast({
					title: error.message || '验证码加载失败',
					icon: 'none',
				})
			}
		},
		shakeField(field) {
			this.shakeMap = {
				...this.shakeMap,
				[field]: false,
			}
			setTimeout(() => {
				this.shakeMap = {
					...this.shakeMap,
					[field]: true,
				}
				setTimeout(() => {
					this.shakeMap = {
						...this.shakeMap,
						[field]: false,
					}
				}, 420)
			}, 20)
		},
		toggleAgreement() {
			this.form.agreed = !this.form.agreed
		},
		showAgreement(type) {
			const title = type === 'user' ? '用户协议' : '隐私政策'
			const content = type === 'user'
				? '当前为演示版登录页，正式上线时请替换为你们项目的真实用户协议内容。'
				: '当前为演示版登录页，正式上线时请替换为你们项目的真实隐私政策内容。'

			uni.showModal({
				title,
				content,
				showCancel: false,
			})
		},
		validateForm() {
			if (!this.form.credential.trim()) {
				this.shakeField('credential')
				uni.showToast({
					title: '请输入学号或手机号',
					icon: 'none',
				})
				return false
			}
			if (!this.form.password.trim()) {
				this.shakeField('password')
				uni.showToast({
					title: '请输入密码',
					icon: 'none',
				})
				return false
			}
			if (!this.form.code.trim()) {
				this.shakeField('code')
				uni.showToast({
					title: '请输入验证码',
					icon: 'none',
				})
				return false
			}
			if (!this.captchaId) {
				this.shakeField('code')
				this.form.code = ''
				this.refreshCaptcha()
				uni.showToast({
					title: '验证码已失效，请刷新',
					icon: 'none',
				})
				return false
			}
			if (!this.form.agreed) {
				uni.showToast({
					title: '请先勾选协议',
					icon: 'none',
				})
				return false
			}
			return true
		},
		async handleLogin() {
			if (this.submitting || !this.validateForm()) return

			this.submitting = true
			try {
				await loginAccount({
					credential: this.form.credential,
					password: this.form.password,
					captchaId: this.captchaId,
					captchaCode: this.form.code.trim().toUpperCase(),
				})
				uni.showToast({
					title: '登录成功',
					icon: 'success',
				})
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/home/index',
					})
				}, 280)
			} catch (error) {
				const message = String(error.message || '登录失败')
				if (message.includes('验证码')) {
					this.shakeField('code')
					this.form.code = ''
					await this.refreshCaptcha()
				} else if (message.includes('密码')) {
					this.shakeField('password')
				} else {
					this.shakeField('credential')
				}
				uni.showToast({
					title: message,
					icon: 'none',
				})
			} finally {
				this.submitting = false
			}
		},
		goRegister() {
			uni.navigateTo({
				url: '/pages/register/index',
			})
		},
	},
}
</script>

<style scoped lang="scss">
@import '../../common/auth-page.scss';
</style>
