"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_planeCode = require("../../common/plane-code.js");
const common_uiIcons = require("../../common/ui-icons.js");
const _sfc_main = {
  data() {
    return {
      appState: common_appState.appState,
      backIcon: common_uiIcons.uiIcons.back,
      manualCode: "",
      scanStatus: "将纸条条形码对准取景框",
      scannerAvailable: true,
      unsupportedTitle: "当前浏览器不支持直接扫码",
      unsupportedDesc: "可以手动输入纸条编号或条码内容继续打开详情。",
      scanLocked: false,
      html5QrCode: null
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    }
  },
  onShow() {
    common_appState.syncThemeWindow(this.appState.theme);
  },
  onReady() {
    this.initScanner();
  },
  onHide() {
    this.stopScanner();
  },
  onUnload() {
    this.stopScanner();
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.switchTab({
            url: "/pages/mine/index"
          });
        }
      });
    },
    async initScanner() {
      this.scanStatus = "当前环境不支持浏览器扫码";
      return;
    },
    async stopScanner() {
      if (!this.html5QrCode)
        return;
      try {
        if (typeof this.html5QrCode.isScanning === "function" ? this.html5QrCode.isScanning : true) {
          await this.html5QrCode.stop();
        }
      } catch (error) {
      }
      try {
        if (typeof this.html5QrCode.clear === "function") {
          this.html5QrCode.clear();
        }
      } catch (error) {
      }
      this.html5QrCode = null;
    },
    handleScannedValue(rawValue) {
      const planeId = common_planeCode.parseScannedPlaneId(rawValue);
      if (!planeId) {
        this.scanStatus = "未识别到有效纸条条码";
        return;
      }
      this.scanLocked = true;
      this.stopScanner();
      common_vendor.index.redirectTo({
        url: `/pages/detail/index?id=${planeId}`
      });
    },
    submitManualCode() {
      const planeId = common_planeCode.parseScannedPlaneId(this.manualCode);
      if (!planeId) {
        common_vendor.index.showToast({
          title: "请输入有效纸条编号",
          icon: "none"
        });
        return;
      }
      this.stopScanner();
      common_vendor.index.redirectTo({
        url: `/pages/detail/index?id=${planeId}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.backIcon,
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: $data.scannerAvailable
  }, $data.scannerAvailable ? {} : {
    d: common_vendor.t($data.unsupportedTitle),
    e: common_vendor.t($data.unsupportedDesc)
  }, {
    f: common_vendor.t($data.scanStatus),
    g: $data.manualCode,
    h: common_vendor.o(($event) => $data.manualCode = $event.detail.value),
    i: common_vendor.o((...args) => $options.submitManualCode && $options.submitManualCode(...args)),
    j: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-70a79306"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/scan/index.js.map
