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
					<text class="auth-brand__subtitle">像贴便签一样，把账号信息轻轻别在公告栏边上。</text>
				</view>
			</view>
			<text class="auth-brand__status">真实落点 · 轻量表达</text>
		</view>

		<view class="auth-layout">
			<view class="auth-intro">
				<view class="auth-intro__pin"></view>
				<text class="auth-intro__tag">创建账户</text>
				<text class="auth-intro__title">给每一架纸飞机留一个能再次接住它的人</text>
				<text class="auth-intro__desc">先把你的名字、学号和联系方式折进一张小纸条里，再让这段校园故事慢慢起飞。</text>
				<view class="auth-intro__meta">
					<text class="auth-intro__chip">匿名留言</text>
					<text class="auth-intro__chip">同校交流</text>
					<text class="auth-intro__chip">慢慢回应</text>
				</view>
			</view>

			<view class="auth-form-card">
				<view class="auth-form-card__tape"></view>
				<text class="auth-form-card__eyebrow">注册</text>
				<text class="auth-form-card__title">先为自己写一张便签</text>
				<text class="auth-form-card__summary">注册完成后，你就可以投递纸飞机、拾取留言，也能在“我的”页面里继续整理自己的记录。</text>

				<view class="auth-form">
					<view class="auth-form__field">
						<text class="auth-form__label">用户名</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.username }]">
							<input
								v-model="form.username"
								class="auth-input"
								maxlength="12"
								placeholder="请输入用户名"
								placeholder-class="auth-placeholder"
							/>
						</view>
					</view>

					<view class="auth-form__field">
						<text class="auth-form__label">学号</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.studentId }]">
							<input
								v-model="form.studentId"
								class="auth-input"
								maxlength="20"
								placeholder="请输入学号"
								placeholder-class="auth-placeholder"
							/>
						</view>
					</view>

					<view class="auth-form__field">
						<text class="auth-form__label">手机号</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.phone }]">
							<input
								v-model="form.phone"
								class="auth-input"
								type="number"
								maxlength="11"
								placeholder="请输入手机号"
								placeholder-class="auth-placeholder"
							/>
						</view>
					</view>

					<view class="auth-form__field">
						<text class="auth-form__label">设置密码</text>
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
						<text class="auth-form__label">确认密码</text>
						<view :class="['auth-input-shell', { 'is-shaking': shakeMap.confirmPassword }]">
							<input
								v-model="form.confirmPassword"
								class="auth-input"
								type="password"
								maxlength="20"
								placeholder="请再次输入密码"
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
							<text class="auth-agreement__link" @tap.stop="showAgreement('privacy')">《隐私政策》</text>
							<text>与</text>
							<text class="auth-agreement__link" @tap.stop="showAgreement('user')">《用户协议》</text>
						</view>
					</view>

					<view class="auth-submit">
						<view :class="['auth-submit__button', { 'is-disabled': submitting }]" @tap="handleRegister">
							<text>{{ submitting ? '注册中...' : '立即注册' }}</text>
						</view>
					</view>

					<view class="auth-switch">
						<text>已经有账号？</text>
						<view class="auth-switch__link" @tap="goLogin">
							<text>返回登录</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { appState, syncThemeWindow } from '../../common/app-state.js'
import { fetchCaptcha, registerAccount } from '../../common/auth.js'

export default {
	data() {
		return {
			appState,
			form: {
				username: '',
				studentId: '',
				phone: '',
				password: '',
				confirmPassword: '',
				code: '',
				agreed: false,
			},
			captchaId: '',
			captchaImage: '',
			shakeMap: {
				username: false,
				studentId: false,
				phone: false,
				password: false,
				confirmPassword: false,
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
	onLoad() {
		this.refreshCaptcha()
	},
	onShow() {
		syncThemeWindow(this.appState.theme)
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
				? '当前为演示版注册页，正式上线时请替换成你们项目的真实用户协议内容。'
				: '当前为演示版注册页，正式上线时请替换成你们项目的真实隐私政策内容。'

			uni.showModal({
				title,
				content,
				showCancel: false,
			})
		},
		validateForm() {
			const username = this.form.username.trim()
			const studentId = this.form.studentId.trim()
			const phone = this.form.phone.trim()
			const password = this.form.password.trim()
			const confirmPassword = this.form.confirmPassword.trim()
			const code = this.form.code.trim().toUpperCase()

			if (!username) {
				this.shakeField('username')
				uni.showToast({
					title: '请输入用户名',
					icon: 'none',
				})
				return false
			}
			if (!studentId) {
				this.shakeField('studentId')
				uni.showToast({
					title: '请输入学号',
					icon: 'none',
				})
				return false
			}
			if (!/^[A-Za-z0-9]{6,20}$/.test(studentId)) {
				this.shakeField('studentId')
				uni.showToast({
					title: '学号格式不正确',
					icon: 'none',
				})
				return false
			}
			if (!phone) {
				this.shakeField('phone')
				uni.showToast({
					title: '请输入手机号',
					icon: 'none',
				})
				return false
			}
			if (!/^1\d{10}$/.test(phone)) {
				this.shakeField('phone')
				uni.showToast({
					title: '请输入正确的手机号',
					icon: 'none',
				})
				return false
			}
			if (!password) {
				this.shakeField('password')
				uni.showToast({
					title: '请设置密码',
					icon: 'none',
				})
				return false
			}
			if (password.length < 6) {
				this.shakeField('password')
				uni.showToast({
					title: '密码至少 6 位',
					icon: 'none',
				})
				return false
			}
			if (!confirmPassword) {
				this.shakeField('confirmPassword')
				uni.showToast({
					title: '请再次输入密码',
					icon: 'none',
				})
				return false
			}
			if (password !== confirmPassword) {
				this.shakeField('confirmPassword')
				uni.showToast({
					title: '两次密码不一致',
					icon: 'none',
				})
				return false
			}
			if (!code) {
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
		async handleRegister() {
			if (this.submitting || !this.validateForm()) return

			this.submitting = true
			try {
				await registerAccount({
					username: this.form.username,
					studentId: this.form.studentId,
					phone: this.form.phone,
					password: this.form.password,
					captchaId: this.captchaId,
					captchaCode: this.form.code.trim().toUpperCase(),
				})
				uni.showToast({
					title: '注册成功',
					icon: 'success',
				})
				setTimeout(() => {
					uni.redirectTo({
						url: `/pages/login/index?account=${encodeURIComponent(this.form.phone)}`,
					})
				}, 280)
			} catch (error) {
				const message = String(error.message || '注册失败')
				if (message.includes('验证码')) {
					this.shakeField('code')
					this.form.code = ''
					await this.refreshCaptcha()
				} else if (message.includes('手机号')) {
					this.shakeField('phone')
				} else if (message.includes('学号')) {
					this.shakeField('studentId')
				} else {
					this.shakeField('username')
				}
				uni.showToast({
					title: message,
					icon: 'none',
				})
			} finally {
				this.submitting = false
			}
		},
		goLogin() {
			uni.navigateBack({
				fail: () => {
					uni.redirectTo({
						url: '/pages/login/index',
					})
				},
			})
		},
	},
}
</script>

<style scoped lang="scss">
@import '../../common/auth-page.scss';
</style>
