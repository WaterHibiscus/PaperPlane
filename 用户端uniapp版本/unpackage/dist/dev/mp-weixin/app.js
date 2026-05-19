"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const common_auth = require("./common/auth.js");
const common_appState = require("./common/app-state.js");
if (!Math) {
  "./pages/login/index.js";
  "./pages/register/index.js";
  "./pages/home/index.js";
  "./pages/discover/index.js";
  "./pages/throw/index.js";
  "./pages/trending/index.js";
  "./pages/mine/index.js";
  "./pages/profile-edit/index.js";
  "./pages/detail/index.js";
  "./pages/scan/index.js";
}
const _sfc_main = {
  onLaunch: async function() {
    common_vendor.index.__f__("log", "at App.vue:7", "PaperPlane App Launch");
    common_appState.syncThemeWindow(common_appState.appState.theme);
    try {
      await common_auth.fetchCurrentUser();
    } catch (error) {
    }
    try {
      await common_appState.fetchMoodConfigs();
    } catch (error) {
    }
  },
  onShow: function() {
    common_appState.syncThemeWindow(common_appState.appState.theme);
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
