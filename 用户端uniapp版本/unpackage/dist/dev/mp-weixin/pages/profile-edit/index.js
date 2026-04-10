"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_storage = require("../../common/storage.js");
const common_api = require("../../common/api.js");
const _sfc_main = {
  data() {
    return {
      appState: common_appState.appState,
      avatarDraft: "",
      nicknameDraft: "",
      genderDraft: "secret",
      bioDraft: "",
      initialAvatar: "",
      saving: false,
      profileId: common_storage.getVoterKey().slice(-4).toUpperCase(),
      genderOptions: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
        { label: "保密", value: "secret" }
      ]
    };
  },
  computed: {
    themeClass() {
      return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
    },
    nicknameInitial() {
      return (this.nicknameDraft || this.appState.profileName || "匿").slice(0, 1);
    },
    canSave() {
      const name = String(this.nicknameDraft || "").trim();
      const bio = String(this.bioDraft || "").trim();
      return Boolean(name) && (this.avatarDraft !== this.appState.profileAvatar || name !== this.appState.profileName || this.genderDraft !== this.appState.profileGender || bio !== this.appState.profileBio);
    },
    previewName() {
      return String(this.nicknameDraft || "").trim() || "纸飞机同学";
    },
    previewGenderLabel() {
      if (this.genderDraft === "male")
        return "男";
      if (this.genderDraft === "female")
        return "女";
      return "保密";
    },
    previewBio() {
      return String(this.bioDraft || "").trim() || "把想说的话折进纸飞机里。";
    }
  },
  onShow() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      try {
        const profile = await common_api.getMyProfile();
        this.avatarDraft = (profile == null ? void 0 : profile.avatarUrl) || "";
        this.initialAvatar = this.avatarDraft;
        this.nicknameDraft = (profile == null ? void 0 : profile.username) || this.appState.profileName;
        this.genderDraft = (profile == null ? void 0 : profile.gender) || this.appState.profileGender || "secret";
        this.bioDraft = (profile == null ? void 0 : profile.bio) || this.appState.profileBio || "";
        common_appState.setProfileAvatar(this.avatarDraft);
        common_appState.setProfileName(this.nicknameDraft);
        common_appState.setProfileGender(this.genderDraft);
        common_appState.setProfileBio(this.bioDraft);
      } catch (error) {
        this.avatarDraft = this.appState.profileAvatar || "";
        this.initialAvatar = this.avatarDraft;
        this.nicknameDraft = this.appState.profileName;
        this.genderDraft = this.appState.profileGender || "secret";
        this.bioDraft = this.appState.profileBio || "";
        common_vendor.index.showToast({
          title: error.message || "资料加载失败",
          icon: "none"
        });
      }
    },
    goBack() {
      common_vendor.index.navigateBack({
        fail: () => {
          common_vendor.index.switchTab({
            url: "/pages/mine/index"
          });
        }
      });
    },
    chooseAvatar() {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const filePath = res.tempFilePaths && res.tempFilePaths[0];
          if (!filePath)
            return;
          this.avatarDraft = filePath;
        }
      });
    },
    clearAvatar() {
      this.avatarDraft = "";
    },
    async handleSave() {
      if (!this.canSave || this.saving)
        return;
      const username = String(this.nicknameDraft || "").trim();
      const bio = String(this.bioDraft || "").trim();
      if (!username) {
        common_vendor.index.showToast({
          title: "昵称不能为空",
          icon: "none"
        });
        return;
      }
      this.saving = true;
      try {
        let avatarUrl = this.avatarDraft || "";
        const shouldUploadAvatar = Boolean(
          avatarUrl && avatarUrl !== this.initialAvatar && !/^https?:\/\//.test(avatarUrl) && !avatarUrl.startsWith("/uploads/")
        );
        if (shouldUploadAvatar) {
          avatarUrl = await common_api.uploadMyAvatar(avatarUrl);
        }
        const profile = await common_api.updateMyProfile({
          username,
          avatarUrl: avatarUrl || "",
          gender: this.genderDraft || "secret",
          bio
        });
        common_appState.setProfileAvatar((profile == null ? void 0 : profile.avatarUrl) || "");
        common_appState.setProfileName((profile == null ? void 0 : profile.username) || username);
        common_appState.setProfileGender((profile == null ? void 0 : profile.gender) || this.genderDraft || "secret");
        common_appState.setProfileBio((profile == null ? void 0 : profile.bio) || bio);
        this.initialAvatar = (profile == null ? void 0 : profile.avatarUrl) || "";
        this.avatarDraft = this.initialAvatar;
        common_vendor.index.showToast({
          title: "资料已保存",
          icon: "success"
        });
        setTimeout(() => {
          this.goBack();
        }, 260);
      } finally {
        this.saving = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_vendor.t($data.saving ? "保存中" : "保存"),
    c: common_vendor.n({
      "is-disabled": !$options.canSave || $data.saving
    }),
    d: common_vendor.o((...args) => $options.handleSave && $options.handleSave(...args)),
    e: $data.avatarDraft
  }, $data.avatarDraft ? {
    f: $data.avatarDraft
  } : {
    g: common_vendor.t($options.nicknameInitial)
  }, {
    h: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    i: $data.avatarDraft
  }, $data.avatarDraft ? {
    j: common_vendor.o((...args) => $options.clearAvatar && $options.clearAvatar(...args))
  } : {}, {
    k: common_vendor.t($options.previewName),
    l: common_vendor.t($data.profileId),
    m: common_vendor.t($options.previewGenderLabel),
    n: common_vendor.t($options.previewBio),
    o: $data.nicknameDraft,
    p: common_vendor.o(($event) => $data.nicknameDraft = $event.detail.value),
    q: common_vendor.f($data.genderOptions, (option, k0, i0) => {
      return {
        a: common_vendor.t(option.label),
        b: option.value,
        c: common_vendor.n({
          "is-active": $data.genderDraft === option.value
        }),
        d: common_vendor.o(($event) => $data.genderDraft = option.value, option.value)
      };
    }),
    r: common_vendor.t($data.bioDraft.length),
    s: $data.bioDraft,
    t: common_vendor.o(($event) => $data.bioDraft = $event.detail.value),
    v: common_vendor.t($data.saving ? "保存中..." : "保存资料"),
    w: common_vendor.n({
      "is-disabled": !$options.canSave || $data.saving
    }),
    x: common_vendor.o((...args) => $options.handleSave && $options.handleSave(...args)),
    y: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile-edit/index.js.map
