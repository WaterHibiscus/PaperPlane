"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_storage = require("../../common/storage.js");
const common_utils = require("../../common/utils.js");
const common_moods = require("../../common/moods.js");
const CommentThreadNode = () => "../../components/CommentThreadNode.js";
const _sfc_main = {
  components: {
    CommentThreadNode
  },
  data() {
    return {
      appState: common_appState.appState,
      id: "",
      plane: null,
      comments: [],
      replyTarget: null,
      reply: "",
      remainingText: "",
      timer: null,
      galleryActiveIndex: 0,
      galleryScrollLeft: 0,
      composerVisible: false,
      commentIdentity: "named",
      attitudeExpanded: false,
      voterKey: common_storage.getVoterKey(),
      attitudeSummary: {
        options: [],
        myChoice: null,
        totalCount: 0
      },
      backIcon: "‹",
      shareIcon: "↪",
      labels: {
        archive: "纸飞机",
        openPlane: "详情",
        dropPoint: "降落点",
        signalNote: "纸条编号",
        pick: "拾取",
        like: "点赞",
        comment: "回声",
        likeAction: "续航",
        likeActionKicker: "FUEL",
        likeActionNote: "让它多飞一会",
        reportAction: "举报",
        echoTitle: "匿名回声",
        echoDesc: "善语结善缘，恶语伤人心",
        echoSubtitle: "条",
        attitudeDesc: "点一下，看看大家更想表达什么。",
        voteUnit: "票",
        expandVotes: "展开",
        collapseVotes: "收起",
        myVote: "我的选择",
        tapVote: "点击投票",
        voteLocked: "已投票",
        voteDone: "你已经投过票了",
        echoEmptyTitle: "这里还没有回声",
        echoEmptyDesc: "如果你愿意，可以留下第一句。",
        commentPlaceholder: "写下你的回应...",
        replyPrefix: "回复 ",
        cancelReply: "取消回复",
        openComposer: "写评论",
        openComposerNote: "良缘一句三冬暖，恶语伤人六月寒",
        sheetTitle: "发表评论",
        closeText: "关闭",
        anonymousSend: "匿名发送",
        composerHint: "勾选后将匿名发送。",
        sendReply: "发送",
        anonymousFallback: "匿名同学",
        loadingTitle: "正在打开纸飞机",
        loadingDesc: "正在载入内容和评论。",
        shareCopied: "已复制到剪贴板",
        writeBeforeSend: "写点内容再发送",
        loadFailed: "加载失败",
        likeFailed: "点赞失败",
        likeSuccess: "续航成功",
        reportFailed: "举报失败",
        reportSuccess: "举报已收到",
        sendFailed: "发送失败"
      }
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    planeTime() {
      return this.plane ? common_utils.formatTime(this.plane.createTime) : "";
    },
    authorText() {
      return common_utils.getPlaneAuthorLabel(this.plane);
    },
    moodMeta() {
      var _a;
      return common_moods.getMoodMeta((_a = this.plane) == null ? void 0 : _a.mood);
    },
    shortId() {
      if (!this.id)
        return "--";
      return String(this.id).slice(0, 8).toUpperCase();
    },
    planeImageUrls() {
      var _a;
      return (((_a = this.plane) == null ? void 0 : _a.imageUrls) || []).map((item) => common_api.getAssetUrl(item));
    },
    hasVote() {
      var _a;
      return Array.isArray((_a = this.plane) == null ? void 0 : _a.voteOptions) && this.plane.voteOptions.length > 0;
    },
    voteTitleText() {
      var _a;
      return ((_a = this.plane) == null ? void 0 : _a.voteTitle) || "大家的态度";
    },
    attitudeItems() {
      var _a;
      const counts = this.attitudeSummary.options || [];
      const total = this.attitudeSummary.totalCount || 0;
      return (((_a = this.plane) == null ? void 0 : _a.voteOptions) || []).map((option, index) => {
        const current = counts.find((item) => item.optionKey === option);
        const count = (current == null ? void 0 : current.count) || 0;
        const selected = this.attitudeSummary.myChoice === option;
        return {
          key: option,
          icon: ["💭", "🫶", "⚡", "💬"][index % 4],
          label: option,
          count,
          selected,
          stateText: selected ? this.labels.myVote : this.attitudeLocked ? this.labels.voteLocked : this.labels.tapVote,
          percent: total ? Math.max(Math.round(count / total * 100), count > 0 ? 8 : 0) : 0
        };
      });
    },
    commentTree() {
      const nodes = this.comments.map((item) => ({
        ...item,
        rootCommentId: null,
        children: []
      }));
      const map = new Map(nodes.map((item) => [item.id, item]));
      const roots = [];
      const findRootId = (node) => {
        let current = node;
        while ((current == null ? void 0 : current.parentCommentId) && map.has(current.parentCommentId)) {
          current = map.get(current.parentCommentId);
        }
        return (current == null ? void 0 : current.id) || node.id;
      };
      nodes.forEach((node) => {
        const rootId = findRootId(node);
        node.rootCommentId = rootId;
        if (node.parentCommentId && map.has(rootId) && rootId !== node.id) {
          map.get(rootId).children.push(node);
          return;
        }
        roots.push(node);
      });
      const sortNodes = (items) => {
        items.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
        items.forEach((item) => sortNodes(item.children));
      };
      sortNodes(roots);
      return roots;
    },
    attitudeLocked() {
      return Boolean(this.attitudeSummary.myChoice);
    },
    replyTargetName() {
      var _a;
      return ((_a = this.replyTarget) == null ? void 0 : _a.nickName) || "";
    },
    realNameHint() {
      return `当前以“${this.appState.profileName}”实名发送`;
    },
    detailStyle() {
      return {
        "--mood-color": this.moodMeta.color,
        "--mood-soft": this.hexToRgba(this.moodMeta.color, 0.1),
        "--mood-line": this.hexToRgba(this.moodMeta.color, 0.18)
      };
    }
  },
  onLoad(options) {
    this.id = options.id || "";
  },
  onShow() {
    if (this.id) {
      this.loadDetail();
    }
  },
  onHide() {
    this.composerVisible = false;
    this.replyTarget = null;
    this.clearTimer();
  },
  onUnload() {
    this.composerVisible = false;
    this.replyTarget = null;
    this.clearTimer();
  },
  methods: {
    hexToRgba(hex, alpha) {
      const value = String(hex || "#909399").replace("#", "");
      const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
      const red = parseInt(normalized.slice(0, 2), 16);
      const green = parseInt(normalized.slice(2, 4), 16);
      const blue = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    },
    goBack() {
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.reLaunch({
            url: "/pages/discover/index"
          });
        }
      });
    },
    openComposer(comment = null) {
      this.replyTarget = comment;
      this.composerVisible = true;
    },
    closeComposer() {
      this.composerVisible = false;
      this.replyTarget = null;
    },
    clearReplyTarget() {
      this.replyTarget = null;
    },
    previewPlaneImages(index) {
      if (!this.planeImageUrls.length)
        return;
      common_vendor.index.previewImage({
        urls: this.planeImageUrls,
        current: this.planeImageUrls[index]
      });
    },
    syncGalleryThumb(index) {
      const itemWidth = 148;
      const viewportWidth = 540;
      const target = Math.max(index * itemWidth - (viewportWidth - itemWidth) / 2, 0);
      this.galleryScrollLeft = target;
    },
    handleGalleryChange(event) {
      this.galleryActiveIndex = Number(event.detail.current) || 0;
      this.syncGalleryThumb(this.galleryActiveIndex);
    },
    setGalleryImage(index) {
      this.galleryActiveIndex = index;
      this.syncGalleryThumb(index);
    },
    async loadDetail() {
      var _a;
      try {
        this.reply = "";
        this.attitudeExpanded = false;
        this.galleryActiveIndex = 0;
        this.galleryScrollLeft = 0;
        this.plane = await common_api.getPlaneDetail(this.id);
        this.comments = await common_api.getComments(this.id);
        if (Array.isArray((_a = this.plane) == null ? void 0 : _a.voteOptions) && this.plane.voteOptions.length > 0) {
          try {
            this.attitudeSummary = await common_api.getPlaneAttitudes(this.id, this.voterKey);
          } catch (error) {
            this.attitudeSummary = {
              options: [],
              myChoice: null,
              totalCount: 0
            };
          }
        } else {
          this.attitudeSummary = {
            options: [],
            myChoice: null,
            totalCount: 0
          };
        }
        this.updateRemaining();
        this.startTimer();
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || this.labels.loadFailed,
          icon: "none"
        });
      }
    },
    updateRemaining() {
      if (!this.plane)
        return;
      this.remainingText = common_utils.getRemainingText(this.plane.expireTime);
    },
    startTimer() {
      this.clearTimer();
      this.timer = setInterval(() => {
        this.updateRemaining();
      }, 6e4);
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    async handleLike() {
      try {
        const result = await common_api.likePlane(this.id);
        this.plane.likeCount = result.likeCount;
        this.plane.expireTime = result.expireTime;
        common_storage.saveFueledPlaneId(this.id);
        this.updateRemaining();
        common_vendor.index.showToast({
          title: this.labels.likeSuccess,
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || this.labels.likeFailed,
          icon: "none"
        });
      }
    },
    async handleReport() {
      try {
        await common_api.reportPlane(this.id);
        common_vendor.index.showToast({
          title: this.labels.reportSuccess,
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || this.labels.reportFailed,
          icon: "none"
        });
      }
    },
    async handleAttitudeVote(optionKey) {
      if (this.attitudeLocked) {
        common_vendor.index.showToast({
          title: this.labels.voteDone,
          icon: "none"
        });
        return;
      }
      try {
        this.attitudeSummary = await common_api.votePlaneAttitude(this.id, optionKey, this.voterKey);
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "投票失败",
          icon: "none"
        });
      }
    },
    getCommentPayload(reply) {
      const text = String(reply || "").trim();
      if (this.commentIdentity === "anonymous") {
        return {
          reply: text,
          isAnonymous: true,
          nickName: ""
        };
      }
      const nickName = String(this.appState.profileName || "").trim().slice(0, 30) || "纸飞机同学";
      return {
        reply: text,
        isAnonymous: false,
        nickName
      };
    },
    async handleComment() {
      var _a, _b;
      if (!this.reply.trim()) {
        common_vendor.index.showToast({
          title: this.labels.writeBeforeSend,
          icon: "none"
        });
        return;
      }
      const payload = this.getCommentPayload(this.reply);
      if (!payload)
        return;
      try {
        const comment = await common_api.addComment(this.id, {
          ...payload,
          parentCommentId: ((_a = this.replyTarget) == null ? void 0 : _a.rootCommentId) || ((_b = this.replyTarget) == null ? void 0 : _b.id) || null
        });
        this.comments.push(comment);
        this.plane.commentCount = this.comments.length;
        this.reply = "";
        this.composerVisible = false;
        this.replyTarget = null;
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || this.labels.sendFailed,
          icon: "none"
        });
      }
    },
    handleShare() {
      if (!this.plane)
        return;
      const text = `✈ 纸飞机降落点
📍 ${this.plane.locationTag}

${this.plane.content}`;
      common_vendor.index.setClipboardData({
        data: text,
        success: () => {
          common_vendor.index.showToast({
            title: this.labels.shareCopied,
            icon: "none"
          });
        }
      });
    }
  }
};
if (!Array) {
  const _component_comment_thread_node = common_vendor.resolveComponent("comment-thread-node");
  _component_comment_thread_node();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.backIcon),
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.labels.archive),
    d: common_vendor.t($data.labels.openPlane),
    e: common_vendor.t($data.shareIcon),
    f: common_vendor.o((...args) => $options.handleShare && $options.handleShare(...args)),
    g: $data.plane
  }, $data.plane ? common_vendor.e({
    h: common_vendor.t($data.labels.dropPoint),
    i: common_vendor.t($data.plane.locationTag),
    j: common_vendor.t($options.moodMeta.icon),
    k: common_vendor.t($options.moodMeta.label),
    l: common_vendor.t($options.authorText),
    m: common_vendor.t($options.planeTime),
    n: common_vendor.t($data.remainingText),
    o: common_vendor.t($data.labels.signalNote),
    p: common_vendor.t($options.shortId),
    q: common_vendor.t($data.plane.content),
    r: $options.planeImageUrls.length
  }, $options.planeImageUrls.length ? common_vendor.e({
    s: common_vendor.f($options.planeImageUrls, (image, index, i0) => {
      return {
        a: image,
        b: `${image}-${index}`
      };
    }),
    t: $data.galleryActiveIndex,
    v: $options.planeImageUrls.length > 1,
    w: $options.planeImageUrls.length > 1,
    x: common_vendor.o((...args) => $options.handleGalleryChange && $options.handleGalleryChange(...args)),
    y: common_vendor.t($data.galleryActiveIndex + 1),
    z: common_vendor.t($options.planeImageUrls.length),
    A: common_vendor.o(($event) => $options.previewPlaneImages($data.galleryActiveIndex)),
    B: $options.planeImageUrls.length > 1
  }, $options.planeImageUrls.length > 1 ? {
    C: common_vendor.f($options.planeImageUrls, (image, index, i0) => {
      return {
        a: image,
        b: `${image}-${index}`,
        c: common_vendor.n($data.galleryActiveIndex === index ? "active" : ""),
        d: common_vendor.o(($event) => $options.setGalleryImage(index), `${image}-${index}`)
      };
    }),
    D: $data.galleryScrollLeft
  } : {}) : {}, {
    E: common_vendor.t($data.labels.reportAction),
    F: common_vendor.o((...args) => $options.handleReport && $options.handleReport(...args)),
    G: common_vendor.t($data.plane.pickCount),
    H: common_vendor.t($data.labels.pick),
    I: common_vendor.t($data.plane.likeCount),
    J: common_vendor.t($data.labels.like),
    K: common_vendor.t($data.comments.length),
    L: common_vendor.t($data.labels.comment),
    M: common_vendor.t($data.labels.likeActionKicker),
    N: common_vendor.t($data.labels.likeAction),
    O: common_vendor.t($data.labels.likeActionNote),
    P: common_vendor.o((...args) => $options.handleLike && $options.handleLike(...args)),
    Q: $options.hasVote
  }, $options.hasVote ? common_vendor.e({
    R: common_vendor.t($options.voteTitleText),
    S: common_vendor.t($data.labels.attitudeDesc),
    T: common_vendor.t($data.attitudeSummary.totalCount),
    U: common_vendor.t($data.labels.voteUnit),
    V: common_vendor.t($data.attitudeExpanded ? $data.labels.collapseVotes : $data.labels.expandVotes),
    W: common_vendor.n($data.attitudeExpanded ? "expanded" : ""),
    X: common_vendor.o(($event) => $data.attitudeExpanded = !$data.attitudeExpanded),
    Y: $data.attitudeExpanded
  }, $data.attitudeExpanded ? {
    Z: common_vendor.f($options.attitudeItems, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.icon),
        b: common_vendor.t(item.label),
        c: common_vendor.t(item.stateText),
        d: common_vendor.t(item.count),
        e: `${item.percent}%`,
        f: item.key,
        g: common_vendor.n(item.selected ? "active" : ""),
        h: common_vendor.o(($event) => $options.handleAttitudeVote(item.key), item.key)
      };
    }),
    aa: common_vendor.n($options.attitudeLocked ? "locked" : "")
  } : {}) : {}, {
    ab: common_vendor.t($data.labels.echoTitle),
    ac: common_vendor.t($data.labels.echoDesc),
    ad: common_vendor.t($data.comments.length),
    ae: common_vendor.t($data.labels.echoSubtitle),
    af: !$data.comments.length
  }, !$data.comments.length ? {
    ag: common_vendor.t($data.labels.echoEmptyTitle),
    ah: common_vendor.t($data.labels.echoEmptyDesc)
  } : {
    ai: common_vendor.f($options.commentTree, (comment, k0, i0) => {
      return {
        a: comment.id,
        b: common_vendor.o($options.openComposer, comment.id),
        c: "2fd5b0a7-0-" + i0,
        d: common_vendor.p({
          comment
        })
      };
    })
  }, {
    aj: common_vendor.t($data.labels.openComposer),
    ak: common_vendor.t($data.labels.openComposerNote),
    al: common_vendor.t($data.comments.length),
    am: common_vendor.o(($event) => $options.openComposer()),
    an: common_vendor.n($data.composerVisible ? "visible" : ""),
    ao: common_vendor.o((...args) => $options.closeComposer && $options.closeComposer(...args)),
    ap: common_vendor.t($options.replyTargetName ? `${$data.labels.replyPrefix}${$options.replyTargetName}` : $data.labels.sheetTitle),
    aq: common_vendor.t($data.labels.closeText),
    ar: common_vendor.o((...args) => $options.closeComposer && $options.closeComposer(...args)),
    as: $data.replyTarget
  }, $data.replyTarget ? {
    at: common_vendor.t($data.labels.replyPrefix),
    av: common_vendor.t($options.replyTargetName),
    aw: common_vendor.t($data.labels.cancelReply),
    ax: common_vendor.o((...args) => $options.clearReplyTarget && $options.clearReplyTarget(...args))
  } : {}, {
    ay: $options.replyTargetName ? `${$data.labels.replyPrefix}${$options.replyTargetName}...` : $data.labels.commentPlaceholder,
    az: $data.reply,
    aA: common_vendor.o(($event) => $data.reply = $event.detail.value),
    aB: common_vendor.n($data.commentIdentity === "anonymous" ? "checked" : ""),
    aC: common_vendor.t($data.labels.anonymousSend),
    aD: common_vendor.o(($event) => $data.commentIdentity = $data.commentIdentity === "anonymous" ? "named" : "anonymous"),
    aE: common_vendor.t($data.commentIdentity === "named" ? $options.realNameHint : $data.labels.composerHint),
    aF: common_vendor.t($data.labels.sendReply),
    aG: common_vendor.o((...args) => $options.handleComment && $options.handleComment(...args)),
    aH: common_vendor.n($data.composerVisible ? "visible" : ""),
    aI: common_vendor.o(() => {
    })
  }) : {
    aJ: common_vendor.t($data.labels.loadingTitle),
    aK: common_vendor.t($data.labels.loadingDesc)
  }, {
    aL: common_vendor.n($options.themeClass),
    aM: common_vendor.s($options.detailStyle)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-2fd5b0a7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/index.js.map
