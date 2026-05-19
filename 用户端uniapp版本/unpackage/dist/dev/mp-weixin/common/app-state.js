"use strict";
const common_vendor = require("./vendor.js");
const common_api = require("./api.js");
const common_moods = require("./moods.js");
const common_storage = require("./storage.js");
const appState = common_vendor.reactive({
  theme: common_storage.getTheme(),
  currentLocation: common_storage.getCurrentLocation(),
  locations: common_storage.getLocationCache(),
  moodConfigs: common_moods.getMoodOptions(),
  profileName: common_storage.getProfileName(),
  profileAvatar: common_storage.getProfileAvatar(),
  profileGender: common_storage.getProfileGender(),
  profileBio: common_storage.getProfileBio()
});
const THEME_WINDOW_STYLE = {
  light: {
    backgroundColor: "#F7F2E9",
    backgroundColorTop: "#F7F2E9",
    backgroundColorBottom: "#EEF4F1",
    frontColor: "#000000",
    statusBarStyle: "dark"
  },
  dark: {
    backgroundColor: "#0F1416",
    backgroundColorTop: "#0F1416",
    backgroundColorBottom: "#111A1D",
    frontColor: "#ffffff",
    statusBarStyle: "light"
  }
};
function getWindowStyle(theme) {
  return theme === "dark" ? THEME_WINDOW_STYLE.dark : THEME_WINDOW_STYLE.light;
}
function syncDocumentBackground(style) {
  if (typeof document === "undefined")
    return;
  document.documentElement.style.backgroundColor = style.backgroundColor;
  if (document.body) {
    document.body.style.backgroundColor = style.backgroundColor;
  }
}
function syncThemeWindow(theme = appState.theme) {
  const style = getWindowStyle(theme);
  syncDocumentBackground(style);
  if (typeof common_vendor.index !== "undefined") {
    if (typeof common_vendor.index.setBackgroundColor === "function") {
      try {
        common_vendor.index.setBackgroundColor({
          backgroundColor: style.backgroundColor,
          backgroundColorTop: style.backgroundColorTop,
          backgroundColorBottom: style.backgroundColorBottom
        });
      } catch (error) {
      }
    }
    if (typeof common_vendor.index.setNavigationBarColor === "function") {
      try {
        common_vendor.index.setNavigationBarColor({
          frontColor: style.frontColor,
          backgroundColor: style.backgroundColor,
          animation: {
            duration: 0,
            timingFunc: "linear"
          }
        });
      } catch (error) {
      }
    }
  }
  if (typeof plus !== "undefined" && plus.navigator) {
    try {
      if (typeof plus.navigator.setStatusBarBackground === "function") {
        plus.navigator.setStatusBarBackground(style.backgroundColorTop);
      }
      if (typeof plus.navigator.setStatusBarStyle === "function") {
        plus.navigator.setStatusBarStyle(style.statusBarStyle);
      }
    } catch (error) {
    }
  }
}
function toggleTheme() {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  common_storage.setTheme(appState.theme);
  syncThemeWindow(appState.theme);
  return appState.theme;
}
function setCurrentLocation(name) {
  appState.currentLocation = name || "";
  common_storage.setCurrentLocation(appState.currentLocation);
}
async function fetchLocations() {
  const locations = await common_api.getLocations();
  appState.locations = locations || [];
  common_storage.setLocationCache(appState.locations);
  return appState.locations;
}
async function fetchMoodConfigs() {
  const moods = await common_api.getMoodConfigs();
  common_moods.setMoodConfigs(moods);
  appState.moodConfigs = common_moods.getMoodOptions();
  return appState.moodConfigs;
}
function setProfileName(name) {
  appState.profileName = (name || "").trim() || "纸飞机同学";
  common_storage.setProfileName(appState.profileName);
  return appState.profileName;
}
function setProfileAvatar(avatar) {
  appState.profileAvatar = avatar || "";
  common_storage.setProfileAvatar(appState.profileAvatar);
  return appState.profileAvatar;
}
function setProfileGender(gender) {
  appState.profileGender = gender || "secret";
  common_storage.setProfileGender(appState.profileGender);
  return appState.profileGender;
}
function setProfileBio(bio) {
  appState.profileBio = (bio || "").trim() || "把想说的话折进纸飞机里。";
  common_storage.setProfileBio(appState.profileBio);
  return appState.profileBio;
}
syncThemeWindow(appState.theme);
exports.appState = appState;
exports.fetchLocations = fetchLocations;
exports.fetchMoodConfigs = fetchMoodConfigs;
exports.setCurrentLocation = setCurrentLocation;
exports.setProfileAvatar = setProfileAvatar;
exports.setProfileBio = setProfileBio;
exports.setProfileGender = setProfileGender;
exports.setProfileName = setProfileName;
exports.syncThemeWindow = syncThemeWindow;
exports.toggleTheme = toggleTheme;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/app-state.js.map
