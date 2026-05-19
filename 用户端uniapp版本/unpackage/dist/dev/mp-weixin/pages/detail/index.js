"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_api = require("../../common/api.js");
const common_planeCode = require("../../common/plane-code.js");
const common_storage = require("../../common/storage.js");
const common_utils = require("../../common/utils.js");
const common_moods = require("../../common/moods.js");
const common_uiIcons = require("../../common/ui-icons.js");
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
      barcodeVisible: false,
      barcodeImageFailed: false,
      commentIdentity: "named",
      attitudeExpanded: false,
      voterKey: common_storage.getVoterKey(),
      attitudeSummary: {
        options: [],
        myChoice: null,
        totalCount: 0
      },
      backIcon: common_uiIcons.uiIcons.back,
      shareIcon: common_uiIcons.uiIcons.more,
      labels: {
        archive: "纸飞机",
        openPlane: "详情",
        dropPoint: "降落点",
        signalNote: "纸条编号",
        pick: "拾取",
        like: "点赞",
        comment: "回声",
        archiveStatus: "已归档",
        archiveNote: "这张纸条已经落地，但内容仍然可以查看。",
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
        barcodeTitle: "纸条二维码",
        barcodeNote: "扫描二维码后可直接打开这张纸条",
        barcodeLoadFailed: "二维码加载失败，请稍后重试",
        barcodeIdLabel: "纸条编号",
        tapToCopy: "点击复制编号",
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
    isArchivedPlane() {
      var _a;
      return Boolean(((_a = this.plane) == null ? void 0 : _a.expireTime) && common_utils.isExpired(this.plane.expireTime));
    },
    shortId() {
      var _a;
      const code = String(((_a = this.plane) == null ? void 0 : _a.shortCode) || "").trim().toUpperCase();
      if (code)
        return code;
      if (!this.id)
        return "--";
      return String(this.id).slice(0, 8).toUpperCase();
    },
    planeIdText() {
      var _a, _b, _c;
      const code = String(((_a = this.plane) == null ? void 0 : _a.shortCode) || "").trim().toUpperCase();
      if (code)
        return code;
      return common_planeCode.formatPlaneId(((_b = this.plane) == null ? void 0 : _b.id) || this.id) || String(((_c = this.plane) == null ? void 0 : _c.id) || this.id || "").toUpperCase();
    },
    barcodeImageUrl() {
      var _a;
      return common_api.getPlaneQrCodePngUrl(((_a = this.plane) == null ? void 0 : _a.id) || this.id);
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
    common_appState.syncThemeWindow(this.appState.theme);
    if (this.id) {
      this.loadDetail();
    }
  },
  onHide() {
    this.composerVisible = false;
    this.barcodeVisible = false;
    this.replyTarget = null;
    this.clearTimer();
  },
  onUnload() {
    this.composerVisible = false;
    this.barcodeVisible = false;
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
      var _a, _b;
      try {
        this.reply = "";
        this.attitudeExpanded = false;
        this.galleryActiveIndex = 0;
        this.galleryScrollLeft = 0;
        this.plane = await common_api.getPlaneDetail(this.id);
        this.id = ((_a = this.plane) == null ? void 0 : _a.id) || this.id;
        this.comments = await common_api.getComments(this.id);
        if (Array.isArray((_b = this.plane) == null ? void 0 : _b.voteOptions) && this.plane.voteOptions.length > 0) {
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
    openCodeSheet() {
      if (!this.barcodeImageUrl)
        return;
      this.barcodeImageFailed = false;
      this.barcodeVisible = true;
    },
    handleBarcodeImageError() {
      this.barcodeImageFailed = true;
    },
    closeCodeSheet() {
      this.barcodeVisible = false;
    },
    copyPlaneId() {
      if (!this.planeIdText)
        return;
      common_vendor.index.setClipboardData({
        data: this.planeIdText,
        success: () => {
          common_vendor.index.showToast({
            title: this.labels.shareCopied,
            icon: "none"
          });
        }
      });
    },
    handleShare() {
      if (!this.plane)
        return;
      const text = `纸飞机降落点
地点：${this.plane.locationTag}

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
    a: $data.backIcon,
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.labels.archive),
    d: common_vendor.t($data.labels.openPlane),
    e: $data.shareIcon,
    f: common_vendor.o((...args) => $options.openCodeSheet && $options.openCodeSheet(...args)),
    g: $data.plane
  }, $data.plane ? common_vendor.e({
    h: common_vendor.t($data.labels.dropPoint),
    i: common_vendor.t($data.plane.locationTag),
    j: $options.moodMeta.icon,
    k: common_vendor.t($options.moodMeta.label),
    l: common_vendor.t($options.authorText),
    m: common_vendor.t($options.planeTime),
    n: common_vendor.t($data.remainingText),
    o: $options.isArchivedPlane
  }, $options.isArchivedPlane ? {
    p: common_vendor.t($data.labels.archiveStatus),
    q: common_vendor.t($data.labels.archiveNote)
  } : {}, {
    r: common_vendor.t($data.labels.signalNote),
    s: common_vendor.t($options.shortId),
    t: common_vendor.t($data.plane.content),
    v: $options.planeImageUrls.length
  }, $options.planeImageUrls.length ? common_vendor.e({
    w: common_vendor.f($options.planeImageUrls, (image, index, i0) => {
      return {
        a: image,
        b: `${image}-${index}`
      };
    }),
    x: $data.galleryActiveIndex,
    y: $options.planeImageUrls.length > 1,
    z: $options.planeImageUrls.length > 1,
    A: common_vendor.o((...args) => $options.handleGalleryChange && $options.handleGalleryChange(...args)),
    B: common_vendor.t($data.galleryActiveIndex + 1),
    C: common_vendor.t($options.planeImageUrls.length),
    D: common_vendor.o(($event) => $options.previewPlaneImages($data.galleryActiveIndex)),
    E: $options.planeImageUrls.length > 1
  }, $options.planeImageUrls.length > 1 ? {
    F: common_vendor.f($options.planeImageUrls, (image, index, i0) => {
      return {
        a: image,
        b: `${image}-${index}`,
        c: common_vendor.n($data.galleryActiveIndex === index ? "active" : ""),
        d: common_vendor.o(($event) => $options.setGalleryImage(index), `${image}-${index}`)
      };
    }),
    G: $data.galleryScrollLeft
  } : {}) : {}, {
    H: common_vendor.t($data.plane.pickCount),
    I: common_vendor.t($data.labels.pick),
    J: common_vendor.t($data.plane.likeCount),
    K: common_vendor.t($data.labels.like),
    L: common_vendor.t($data.comments.length),
    M: common_vendor.t($data.labels.comment),
    N: !$options.isArchivedPlane
  }, !$options.isArchivedPlane ? {
    O: common_vendor.t($data.labels.reportAction),
    P: common_vendor.o((...args) => $options.handleReport && $options.handleReport(...args))
  } : {}, {
    Q: !$options.isArchivedPlane
  }, !$options.isArchivedPlane ? common_vendor.e({
    R: common_vendor.t($data.labels.likeActionKicker),
    S: common_vendor.t($data.labels.likeAction),
    T: common_vendor.t($data.labels.likeActionNote),
    U: common_vendor.o((...args) => $options.handleLike && $options.handleLike(...args)),
    V: $options.hasVote
  }, $options.hasVote ? common_vendor.e({
    W: common_vendor.t($options.voteTitleText),
    X: common_vendor.t($data.labels.attitudeDesc),
    Y: common_vendor.t($data.attitudeSummary.totalCount),
    Z: common_vendor.t($data.labels.voteUnit),
    aa: common_vendor.t($data.attitudeExpanded ? $data.labels.collapseVotes : $data.labels.expandVotes),
    ab: common_vendor.n($data.attitudeExpanded ? "expanded" : ""),
    ac: common_vendor.o(($event) => $data.attitudeExpanded = !$data.attitudeExpanded),
    ad: $data.attitudeExpanded
  }, $data.attitudeExpanded ? {
    ae: common_vendor.f($options.attitudeItems, (item, k0, i0) => {
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
    af: common_vendor.n($options.attitudeLocked ? "locked" : "")
  } : {}) : {}) : {}, {
    ag: common_vendor.t($data.labels.echoTitle),
    ah: common_vendor.t($data.labels.echoDesc),
    ai: common_vendor.t($data.comments.length),
    aj: common_vendor.t($data.labels.echoSubtitle),
    ak: !$data.comments.length
  }, !$data.comments.length ? {
    al: common_vendor.t($data.labels.echoEmptyTitle),
    am: common_vendor.t($data.labels.echoEmptyDesc)
  } : {
    an: common_vendor.f($options.commentTree, (comment, k0, i0) => {
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
    ao: !$options.isArchivedPlane
  }, !$options.isArchivedPlane ? {
    ap: common_vendor.t($data.labels.openComposer),
    aq: common_vendor.t($data.labels.openComposerNote),
    ar: common_vendor.t($data.comments.length),
    as: common_vendor.o(($event) => $options.openComposer())
  } : {}) : {}, {
    at: $data.plane
  }, $data.plane ? {
    av: common_vendor.n($data.barcodeVisible ? "visible" : ""),
    aw: common_vendor.o((...args) => $options.closeCodeSheet && $options.closeCodeSheet(...args))
  } : {}, {
    ax: $data.plane
  }, $data.plane ? common_vendor.e({
    ay: common_vendor.t($data.labels.barcodeTitle),
    az: common_vendor.t($data.labels.closeText),
    aA: common_vendor.o((...args) => $options.closeCodeSheet && $options.closeCodeSheet(...args)),
    aB: $options.barcodeImageUrl && !$data.barcodeImageFailed
  }, $options.barcodeImageUrl && !$data.barcodeImageFailed ? {
    aC: $options.barcodeImageUrl,
    aD: common_vendor.o((...args) => $options.handleBarcodeImageError && $options.handleBarcodeImageError(...args))
  } : {
    aE: common_vendor.t($data.labels.barcodeLoadFailed)
  }, {
    aF: common_vendor.t($data.labels.barcodeNote),
    aG: common_vendor.t($data.labels.barcodeIdLabel),
    aH: common_vendor.t($options.planeIdText),
    aI: common_vendor.t($data.labels.tapToCopy),
    aJ: common_vendor.o((...args) => $options.copyPlaneId && $options.copyPlaneId(...args)),
    aK: common_vendor.n($data.barcodeVisible ? "visible" : ""),
    aL: common_vendor.o(() => {
    })
  }) : {}, {
    aM: $data.plane
  }, $data.plane ? {
    aN: common_vendor.n($data.composerVisible ? "visible" : ""),
    aO: common_vendor.o((...args) => $options.closeComposer && $options.closeComposer(...args))
  } : {}, {
    aP: $data.plane
  }, $data.plane ? common_vendor.e({
    aQ: common_vendor.t($options.replyTargetName ? `${$data.labels.replyPrefix}${$options.replyTargetName}` : $data.labels.sheetTitle),
    aR: common_vendor.t($data.labels.closeText),
    aS: common_vendor.o((...args) => $options.closeComposer && $options.closeComposer(...args)),
    aT: $data.replyTarget
  }, $data.replyTarget ? {
    aU: common_vendor.t($data.labels.replyPrefix),
    aV: common_vendor.t($options.replyTargetName),
    aW: common_vendor.t($data.labels.cancelReply),
    aX: common_vendor.o((...args) => $options.clearReplyTarget && $options.clearReplyTarget(...args))
  } : {}, {
    aY: $options.replyTargetName ? `${$data.labels.replyPrefix}${$options.replyTargetName}...` : $data.labels.commentPlaceholder,
    aZ: $data.reply,
    ba: common_vendor.o(($event) => $data.reply = $event.detail.value),
    bb: common_vendor.n($data.commentIdentity === "anonymous" ? "checked" : ""),
    bc: common_vendor.t($data.labels.anonymousSend),
    bd: common_vendor.o(($event) => $data.commentIdentity = $data.commentIdentity === "anonymous" ? "named" : "anonymous"),
    be: common_vendor.t($data.commentIdentity === "named" ? $options.realNameHint : $data.labels.composerHint),
    bf: common_vendor.t($data.labels.sendReply),
    bg: common_vendor.o((...args) => $options.handleComment && $options.handleComment(...args)),
    bh: common_vendor.n($data.composerVisible ? "visible" : ""),
    bi: common_vendor.o(() => {
    })
  }) : {}, {
    bj: common_vendor.n($options.themeClass),
    bk: common_vendor.s($options.detailStyle),
    bl: !$data.plane
  }, !$data.plane ? {
    bm: common_vendor.t($data.labels.loadingTitle),
    bn: common_vendor.t($data.labels.loadingDesc)
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-2fd5b0a7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/index.js.map
