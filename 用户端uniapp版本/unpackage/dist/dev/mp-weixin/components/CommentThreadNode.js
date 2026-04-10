"use strict";
const common_utils = require("../common/utils.js");
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  name: "CommentThreadNode",
  props: {
    comment: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      repliesExpanded: false
    };
  },
  computed: {
    visibleChildren() {
      const children = this.comment.children || [];
      if (children.length <= 1 || this.repliesExpanded) {
        return children;
      }
      return children.slice(0, 1);
    },
    hiddenReplyCount() {
      const children = this.comment.children || [];
      if (children.length <= 1) {
        return 0;
      }
      return this.repliesExpanded ? children.length - 1 : children.length - 1;
    }
  },
  methods: {
    formatCommentTime(dateStr) {
      return common_utils.formatTime(dateStr);
    },
    handleReply() {
      this.$emit("reply", this.comment);
    }
  }
};
if (!Array) {
  const _component_comment_thread_node = common_vendor.resolveComponent("comment-thread-node");
  _component_comment_thread_node();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t(($props.comment.nickName || "?").slice(0, 1)),
    b: common_vendor.t($props.comment.nickName || "匿名同学"),
    c: common_vendor.t($options.formatCommentTime($props.comment.createTime)),
    d: $props.comment.replyToNickName
  }, $props.comment.replyToNickName ? {
    e: common_vendor.t($props.comment.replyToNickName)
  } : {}, {
    f: common_vendor.t($props.comment.reply),
    g: common_vendor.o((...args) => $options.handleReply && $options.handleReply(...args)),
    h: $props.comment.children && $props.comment.children.length
  }, $props.comment.children && $props.comment.children.length ? common_vendor.e({
    i: common_vendor.f($options.visibleChildren, (child, k0, i0) => {
      return {
        a: child.id,
        b: common_vendor.o(($event) => _ctx.$emit("reply", $event), child.id),
        c: "8e0bac4d-0-" + i0,
        d: common_vendor.p({
          comment: child,
          depth: $props.depth + 1
        })
      };
    }),
    j: $options.hiddenReplyCount > 0
  }, $options.hiddenReplyCount > 0 ? {
    k: common_vendor.t($data.repliesExpanded ? `收起回复` : `展开其余 ${$options.hiddenReplyCount} 条回复`),
    l: common_vendor.o(($event) => $data.repliesExpanded = !$data.repliesExpanded)
  } : {}) : {}, {
    m: common_vendor.n($props.depth > 0 ? "thread-node-child" : "")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8e0bac4d"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/CommentThreadNode.js.map
