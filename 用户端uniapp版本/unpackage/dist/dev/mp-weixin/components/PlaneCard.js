"use strict";
const common_appState = require("../common/app-state.js");
const common_api = require("../common/api.js");
const common_utils = require("../common/utils.js");
const common_vendor = require("../common/vendor.js");
const MoodTag = () => "./MoodTag.js";
const _sfc_main = {
  components: {
    MoodTag
  },
  props: {
    plane: {
      type: Object,
      required: true
    },
    rank: {
      type: Number,
      default: 0
    }
  },
  computed: {
    themeClass() {
      return common_appState.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    formattedRank() {
      return String(this.rank || 0).padStart(2, "0");
    },
    rankToneClass() {
      if (this.rank === 1)
        return "rank-top-1";
      if (this.rank === 2)
        return "rank-top-2";
      if (this.rank === 3)
        return "rank-top-3";
      return "rank-plain";
    },
    compactTime() {
      var _a;
      if (!((_a = this.plane) == null ? void 0 : _a.createTime))
        return "";
      const date = new Date(this.plane.createTime);
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hour = `${date.getHours()}`.padStart(2, "0");
      const minute = `${date.getMinutes()}`.padStart(2, "0");
      return `${month}/${day} ${hour}:${minute}`;
    },
    remainText() {
      return common_utils.getRemainingShort(this.plane.expireTime);
    },
    authorText() {
      return common_utils.getPlaneAuthorLabel(this.plane);
    },
    previewImage() {
      var _a, _b;
      return ((_b = (_a = this.plane) == null ? void 0 : _a.imageUrls) == null ? void 0 : _b.length) ? common_api.getAssetUrl(this.plane.imageUrls[0]) : "";
    },
    extraImageCount() {
      var _a, _b;
      return Math.max((((_b = (_a = this.plane) == null ? void 0 : _a.imageUrls) == null ? void 0 : _b.length) || 0) - 1, 0);
    },
    heatLabel() {
      const score = this.getHeatScore(this.plane);
      if (score >= 36)
        return "全场焦点";
      if (score >= 22)
        return "高热";
      if (score >= 10)
        return "升温中";
      if (score > 0)
        return "上榜中";
      return "待升温";
    }
  },
  methods: {
    getHeatScore(plane) {
      return Number((plane == null ? void 0 : plane.likeCount) || 0) * 2 + Number((plane == null ? void 0 : plane.pickCount) || 0);
    },
    handleSelect() {
      this.$emit("select", this.plane);
    }
  }
};
if (!Array) {
  const _component_mood_tag = common_vendor.resolveComponent("mood-tag");
  _component_mood_tag();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($options.formattedRank),
    b: common_vendor.n({
      top: $props.rank <= 3
    }),
    c: common_vendor.p({
      mood: $props.plane.mood
    }),
    d: common_vendor.t($props.plane.locationTag),
    e: common_vendor.t($options.heatLabel),
    f: common_vendor.t($options.compactTime),
    g: common_vendor.t($options.authorText),
    h: common_vendor.t($props.plane.content),
    i: common_vendor.t($options.getHeatScore($props.plane)),
    j: common_vendor.t($options.remainText),
    k: $options.previewImage
  }, $options.previewImage ? {
    l: $options.previewImage,
    m: common_vendor.t($options.extraImageCount > 0 ? `+${$options.extraImageCount}` : "图片")
  } : {}, {
    n: common_vendor.t($props.plane.pickCount),
    o: common_vendor.t($props.plane.likeCount),
    p: common_vendor.t($props.plane.commentCount),
    q: common_vendor.n($options.themeClass),
    r: common_vendor.n($options.rankToneClass),
    s: common_vendor.n({
      "with-media": $options.previewImage
    }),
    t: common_vendor.o((...args) => $options.handleSelect && $options.handleSelect(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c98ee2ae"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/PlaneCard.js.map
