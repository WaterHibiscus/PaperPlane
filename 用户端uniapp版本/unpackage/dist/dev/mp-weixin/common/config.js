"use strict";
const common_vendor = require("./vendor.js");
const API_PORT = 5e3;
const API_PREFIX = "/api";
const API_BASE_URL_STORAGE_KEY = "paperplane_api_base_url";
const DEFAULT_NON_H5_HOST = "172.20.10.3";
const REQUEST_TIMEOUT = 1e4;
const UPLOAD_TIMEOUT = 3e5;
function normalizeConfiguredBaseURL(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized)
    return "";
  if (/^https?:\/\//i.test(normalized)) {
    return normalized.endsWith(API_PREFIX) ? normalized : `${normalized}${API_PREFIX}`;
  }
  return "";
}
function getStoredBaseURL() {
  if (typeof common_vendor.index === "undefined" || typeof common_vendor.index.getStorageSync !== "function") {
    return "";
  }
  return normalizeConfiguredBaseURL(common_vendor.index.getStorageSync(API_BASE_URL_STORAGE_KEY));
}
function resolveBaseURL() {
  return getStoredBaseURL() || `http://${DEFAULT_NON_H5_HOST}:${API_PORT}${API_PREFIX}`;
}
const config = {
  baseURL: resolveBaseURL(),
  timeout: REQUEST_TIMEOUT,
  uploadTimeout: UPLOAD_TIMEOUT
};
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/config.js.map
