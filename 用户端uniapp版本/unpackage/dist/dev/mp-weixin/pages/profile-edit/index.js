"use strict";
const common_vendor = require("../../common/vendor.js");
const common_appState = require("../../common/app-state.js");
const common_storage = require("../../common/storage.js");
const common_api = require("../../common/api.js");
const common_uiIcons = require("../../common/ui-icons.js");
const _sfc_main = {
  data() {
    return {
      appState: common_appState.appState,
      backIcon: common_uiIcons.uiIcons.back,
      avatarDraft: "",
      nicknameDraft: "",
      genderDraft: "secret",
      bioDraft: "",
      initialAvatar: "",
      saving: false,
      profileId: String(common_storage.getVoterKey() || "").slice(-4).toUpperCase(),
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
    avatarPreviewUrl() {
      const value = String(this.avatarDraft || "");
      if (!value)
        return "";
      if (/^[a-zA-Z]+:/.test(value)) {
        return value;
      }
      return common_api.getAssetUrl(value);
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
      return String(this.bioDraft || "").trim() || "把想说的话写在这里。";
    }
  },
  onShow() {
    common_appState.syncThemeWindow(this.appState.theme);
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
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "保存失败",
          icon: "none"
        });
      } finally {
        this.saving = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.backIcon,
    b: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    c: common_vendor.t($data.saving ? "保存中..." : "保存"),
    d: common_vendor.n({
      "is-disabled": !$options.canSave || $data.saving
    }),
    e: common_vendor.o((...args) => $options.handleSave && $options.handleSave(...args)),
    f: $data.avatarDraft
  }, $data.avatarDraft ? {
    g: $options.avatarPreviewUrl
  } : {
    h: common_vendor.t($options.nicknameInitial)
  }, {
    i: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    j: $data.avatarDraft
  }, $data.avatarDraft ? {
    k: common_vendor.o((...args) => $options.clearAvatar && $options.clearAvatar(...args))
  } : {}, {
    l: common_vendor.t($options.previewName),
    m: common_vendor.t($data.profileId),
    n: common_vendor.t($options.previewGenderLabel),
    o: common_vendor.t($options.previewBio),
    p: $data.nicknameDraft,
    q: common_vendor.o(($event) => $data.nicknameDraft = $event.detail.value),
    r: common_vendor.f($data.genderOptions, (option, k0, i0) => {
      return {
        a: common_vendor.t(option.label),
        b: option.value,
        c: common_vendor.n({
          "is-active": $data.genderDraft === option.value
        }),
        d: common_vendor.o(($event) => $data.genderDraft = option.value, option.value)
      };
    }),
    s: common_vendor.t($data.bioDraft.length),
    t: $data.bioDraft,
    v: common_vendor.o(($event) => $data.bioDraft = $event.detail.value),
    w: common_vendor.t($data.saving ? "保存中..." : "保存资料"),
    x: common_vendor.n({
      "is-disabled": !$options.canSave || $data.saving
    }),
    y: common_vendor.o((...args) => $options.handleSave && $options.handleSave(...args)),
    z: common_vendor.n($options.themeClass)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile-edit/index.js.map
