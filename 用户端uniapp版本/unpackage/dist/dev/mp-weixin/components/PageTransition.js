"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: "light"
    },
    title: {
      type: String,
      default: "正在抵达下一页"
    },
    subtitle: {
      type: String,
      default: "纸飞机正在穿过这片风场"
    }
  },
  computed: {
    themeClass() {
      return this.theme === "dark" ? "theme-dark" : "theme-light";
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.visible
  }, $props.visible ? {
    b: common_vendor.t($props.title),
    c: common_vendor.t($props.subtitle),
    d: common_vendor.n($options.themeClass)
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-992ea324"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/PageTransition.js.map
