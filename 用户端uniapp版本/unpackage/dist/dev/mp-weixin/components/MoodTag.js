"use strict";
const common_moods = require("../common/moods.js");
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    mood: {
      type: String,
      default: "calm"
    }
  },
  computed: {
    meta() {
      return common_moods.getMoodMeta(this.mood);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($options.meta.icon),
    b: common_vendor.t($options.meta.label),
    c: $options.meta.color,
    d: $options.meta.color
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a2ea2a7e"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/MoodTag.js.map
