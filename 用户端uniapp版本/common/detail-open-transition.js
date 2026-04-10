export default {
	data() {
		return {
			detailOpenVisible: false,
			detailOpenTimer: null,
		}
	},
	onHide() {
		this.clearDetailOpenTimer()
		this.detailOpenVisible = false
	},
	onUnload() {
		this.clearDetailOpenTimer()
		this.detailOpenVisible = false
	},
	methods: {
		clearDetailOpenTimer() {
			if (this.detailOpenTimer) {
				clearTimeout(this.detailOpenTimer)
				this.detailOpenTimer = null
			}
		},
		openPlaneDetail(id, delay = 160) {
			if (!id || this.detailOpenVisible) return
			this.detailOpenVisible = true
			this.clearDetailOpenTimer()
			this.detailOpenTimer = setTimeout(() => {
				uni.navigateTo({
					url: `/pages/detail/index?id=${id}`,
				})
			}, delay)
		},
	},
}
