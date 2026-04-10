"use strict";
const common_vendor = require("./vendor.js");
const common_utils = require("./utils.js");
const KEYS = {
  theme: "paperplane_theme",
  currentLocation: "paperplane_current_location",
  myPlaneIds: "paperplane_my_plane_ids",
  fueledPlaneIds: "paperplane_fueled_plane_ids",
  recalledPlaneIds: "paperplane_recalled_plane_ids",
  locationCache: "paperplane_location_cache",
  profileName: "paperplane_profile_name",
  profileAvatar: "paperplane_profile_avatar",
  profileGender: "paperplane_profile_gender",
  profileBio: "paperplane_profile_bio",
  authUsers: "paperplane_auth_users",
  authSession: "paperplane_auth_session",
  voterKey: "paperplane_voter_key",
  throwDraft: "paperplane_throw_draft"
};
function getTheme() {
  return common_vendor.index.getStorageSync(KEYS.theme) || "light";
}
function setTheme(theme) {
  common_vendor.index.setStorageSync(KEYS.theme, theme);
}
function getCurrentLocation() {
  return common_vendor.index.getStorageSync(KEYS.currentLocation) || "";
}
function setCurrentLocation(name) {
  common_vendor.index.setStorageSync(KEYS.currentLocation, name || "");
}
function getMyPlaneIds() {
  return common_utils.safeJsonParse(common_vendor.index.getStorageSync(KEYS.myPlaneIds), []);
}
function saveMyPlaneId(id) {
  const current = getMyPlaneIds().filter((item) => item !== id);
  current.unshift(id);
  common_vendor.index.setStorageSync(KEYS.myPlaneIds, JSON.stringify(current.slice(0, 100)));
}
function getFueledPlaneIds() {
  return common_utils.safeJsonParse(common_vendor.index.getStorageSync(KEYS.fueledPlaneIds), []);
}
function saveFueledPlaneId(id) {
  const current = getFueledPlaneIds().filter((item) => item !== id);
  current.unshift(id);
  common_vendor.index.setStorageSync(KEYS.fueledPlaneIds, JSON.stringify(current.slice(0, 100)));
}
function getLocationCache() {
  return common_utils.safeJsonParse(common_vendor.index.getStorageSync(KEYS.locationCache), []);
}
function setLocationCache(locations) {
  common_vendor.index.setStorageSync(KEYS.locationCache, JSON.stringify(locations || []));
}
function getProfileName() {
  return common_vendor.index.getStorageSync(KEYS.profileName) || "纸飞机同学";
}
function setProfileName(name) {
  common_vendor.index.setStorageSync(KEYS.profileName, (name || "").trim());
}
function getProfileAvatar() {
  return common_vendor.index.getStorageSync(KEYS.profileAvatar) || "";
}
function setProfileAvatar(avatar) {
  common_vendor.index.setStorageSync(KEYS.profileAvatar, avatar || "");
}
function getProfileGender() {
  return common_vendor.index.getStorageSync(KEYS.profileGender) || "secret";
}
function setProfileGender(gender) {
  common_vendor.index.setStorageSync(KEYS.profileGender, gender || "secret");
}
function getProfileBio() {
  return common_vendor.index.getStorageSync(KEYS.profileBio) || "把想说的话折进纸飞机里。";
}
function setProfileBio(bio) {
  common_vendor.index.setStorageSync(KEYS.profileBio, (bio || "").trim());
}
function getAuthSession() {
  const session = common_utils.safeJsonParse(common_vendor.index.getStorageSync(KEYS.authSession), null);
  if (!session || typeof session !== "object")
    return null;
  if (!session.accessToken && !session.refreshToken)
    return null;
  return session;
}
function setAuthSession(session) {
  if (!session) {
    clearAuthSession();
    return;
  }
  common_vendor.index.setStorageSync(KEYS.authSession, JSON.stringify(session));
}
function clearAuthSession() {
  common_vendor.index.removeStorageSync(KEYS.authSession);
}
function getAccessToken() {
  var _a;
  return ((_a = getAuthSession()) == null ? void 0 : _a.accessToken) || "";
}
function getRefreshToken() {
  var _a;
  return ((_a = getAuthSession()) == null ? void 0 : _a.refreshToken) || "";
}
function setAuthSessionUser(user) {
  const session = getAuthSession();
  if (!session)
    return;
  setAuthSession({
    ...session,
    user: user || null
  });
}
function getVoterKey() {
  let value = common_vendor.index.getStorageSync(KEYS.voterKey);
  if (!value) {
    value = common_utils.randomId("voter");
    common_vendor.index.setStorageSync(KEYS.voterKey, value);
  }
  return value;
}
function getThrowDraft() {
  return common_utils.safeJsonParse(common_vendor.index.getStorageSync(KEYS.throwDraft), null);
}
function setThrowDraft(draft) {
  common_vendor.index.setStorageSync(KEYS.throwDraft, JSON.stringify(draft || null));
}
function clearThrowDraft() {
  common_vendor.index.removeStorageSync(KEYS.throwDraft);
}
exports.clearAuthSession = clearAuthSession;
exports.clearThrowDraft = clearThrowDraft;
exports.getAccessToken = getAccessToken;
exports.getAuthSession = getAuthSession;
exports.getCurrentLocation = getCurrentLocation;
exports.getLocationCache = getLocationCache;
exports.getProfileAvatar = getProfileAvatar;
exports.getProfileBio = getProfileBio;
exports.getProfileGender = getProfileGender;
exports.getProfileName = getProfileName;
exports.getRefreshToken = getRefreshToken;
exports.getTheme = getTheme;
exports.getThrowDraft = getThrowDraft;
exports.getVoterKey = getVoterKey;
exports.saveFueledPlaneId = saveFueledPlaneId;
exports.saveMyPlaneId = saveMyPlaneId;
exports.setAuthSession = setAuthSession;
exports.setAuthSessionUser = setAuthSessionUser;
exports.setCurrentLocation = setCurrentLocation;
exports.setLocationCache = setLocationCache;
exports.setProfileAvatar = setProfileAvatar;
exports.setProfileBio = setProfileBio;
exports.setProfileGender = setProfileGender;
exports.setProfileName = setProfileName;
exports.setTheme = setTheme;
exports.setThrowDraft = setThrowDraft;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/storage.js.map
