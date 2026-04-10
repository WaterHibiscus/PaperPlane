"use strict";
const common_vendor = require("./vendor.js");
const common_api = require("./api.js");
const common_storage = require("./storage.js");
const appState = common_vendor.reactive({
  theme: common_storage.getTheme(),
  currentLocation: common_storage.getCurrentLocation(),
  locations: common_storage.getLocationCache(),
  profileName: common_storage.getProfileName(),
  profileAvatar: common_storage.getProfileAvatar(),
  profileGender: common_storage.getProfileGender(),
  profileBio: common_storage.getProfileBio()
});
function toggleTheme() {
  appState.theme = appState.theme === "dark" ? "light" : "dark";
  common_storage.setTheme(appState.theme);
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
exports.appState = appState;
exports.fetchLocations = fetchLocations;
exports.setCurrentLocation = setCurrentLocation;
exports.setProfileAvatar = setProfileAvatar;
exports.setProfileBio = setProfileBio;
exports.setProfileGender = setProfileGender;
exports.setProfileName = setProfileName;
exports.toggleTheme = toggleTheme;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/app-state.js.map
