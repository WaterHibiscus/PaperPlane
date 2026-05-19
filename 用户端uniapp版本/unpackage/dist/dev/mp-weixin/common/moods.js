"use strict";
const common_api = require("./api.js");
const common_uiIcons = require("./ui-icons.js");
const DEFAULT_COLOR = "#909399";
const ALL_LABEL = "全部";
const UNKNOWN_LABEL = "未知";
const DEFAULT_MOOD_ITEMS = [
  { key: "happy", label: "开心", iconUrl: common_uiIcons.uiIcons.emotion, color: "#ff7b7b", sortOrder: 10, isActive: true, isCustom: false },
  { key: "sad", label: "难过", iconUrl: common_uiIcons.uiIcons.emotion, color: "#6aa7ff", sortOrder: 20, isActive: true, isCustom: false },
  { key: "calm", label: "平静", iconUrl: common_uiIcons.uiIcons.emotion, color: "#36b37e", sortOrder: 30, isActive: true, isCustom: false },
  { key: "angry", label: "吐槽", iconUrl: common_uiIcons.uiIcons.emotion, color: "#ff9f1c", sortOrder: 40, isActive: true, isCustom: false },
  { key: "love", label: "心动", iconUrl: common_uiIcons.uiIcons.emotion, color: "#ff6fb1", sortOrder: 50, isActive: true, isCustom: false },
  { key: "custom", label: "自定义心情", iconUrl: common_uiIcons.uiIcons.emotion, color: "#7d8b8a", sortOrder: 90, isActive: true, isCustom: true }
];
let runtimeMoodItems = normalizeMoodItems(DEFAULT_MOOD_ITEMS);
function normalizeText(value) {
  return String(value || "").trim();
}
function toBoolean(value, fallback = false) {
  if (typeof value === "boolean")
    return value;
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  return fallback;
}
function resolveIconUrl(iconUrl) {
  const normalized = normalizeText(iconUrl);
  if (!normalized)
    return common_uiIcons.uiIcons.emotion;
  if (normalized.startsWith("/static/"))
    return normalized;
  return common_api.getAssetUrl(normalized);
}
function normalizeMoodItem(item, index = 0) {
  if (!item || typeof item !== "object")
    return null;
  const rawKey = normalizeText(item.key || item.Key).toLowerCase();
  if (!rawKey)
    return null;
  const label = normalizeText(item.label || item.Label);
  if (!label)
    return null;
  const rawSortOrder = Number(item.sortOrder ?? item.SortOrder);
  const sortOrder = Number.isFinite(rawSortOrder) ? rawSortOrder : index * 10;
  const color = normalizeText(item.color || item.Color) || DEFAULT_COLOR;
  return {
    key: rawKey,
    label,
    iconUrl: resolveIconUrl(item.iconUrl || item.IconUrl),
    color,
    sortOrder,
    isActive: toBoolean(item.isActive ?? item.IsActive, true),
    isCustom: toBoolean(item.isCustom ?? item.IsCustom, false)
  };
}
function normalizeMoodItems(items) {
  const source = Array.isArray(items) ? items : [];
  const fallbackSource = source.length ? source : DEFAULT_MOOD_ITEMS;
  const unique = /* @__PURE__ */ new Map();
  fallbackSource.forEach((item, index) => {
    const normalized = normalizeMoodItem(item, index);
    if (!normalized || unique.has(normalized.key))
      return;
    unique.set(normalized.key, normalized);
  });
  const list = Array.from(unique.values());
  if (!list.length) {
    return DEFAULT_MOOD_ITEMS.map((item, index) => normalizeMoodItem(item, index)).filter(Boolean);
  }
  let customIndex = list.findIndex((item) => item.key === "custom");
  if (customIndex < 0) {
    customIndex = list.findIndex((item) => item.isCustom);
  }
  if (customIndex < 0) {
    list.push({
      key: "custom",
      label: "自定义心情",
      iconUrl: common_uiIcons.uiIcons.emotion,
      color: "#7d8b8a",
      sortOrder: list.length ? Math.max(...list.map((item) => Number(item.sortOrder) || 0)) + 10 : 90,
      isActive: true,
      isCustom: true
    });
    customIndex = list.length - 1;
  }
  return list.map((item, index) => ({ ...item, isCustom: index === customIndex })).sort((left, right) => {
    const sortDiff = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    if (sortDiff !== 0)
      return sortDiff;
    return left.key.localeCompare(right.key);
  });
}
function getCustomMoodItem() {
  return runtimeMoodItems.find((item) => item.isCustom) || runtimeMoodItems[0];
}
function findMoodItemByKey(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized)
    return null;
  return runtimeMoodItems.find((item) => item.key === normalized) || null;
}
function findMoodItemByLabel(value) {
  const normalized = normalizeText(value);
  if (!normalized)
    return null;
  return runtimeMoodItems.find((item) => item.label === normalized) || null;
}
function toMoodMeta(item) {
  if (!item) {
    return {
      key: "custom",
      label: UNKNOWN_LABEL,
      icon: common_uiIcons.uiIcons.emotion,
      color: DEFAULT_COLOR,
      isCustom: true
    };
  }
  return {
    key: item.key,
    label: item.label,
    icon: item.iconUrl,
    color: item.color,
    isCustom: item.isCustom
  };
}
function setMoodConfigs(items) {
  runtimeMoodItems = normalizeMoodItems(items);
}
function getMoodOptions() {
  return runtimeMoodItems.filter((item) => item.isActive).map((item) => ({
    text: item.label,
    value: item.key,
    icon: item.iconUrl,
    color: item.color,
    isCustom: item.isCustom
  }));
}
function getMoodFilters() {
  const filters = [{ label: ALL_LABEL, value: "all" }];
  getMoodOptions().forEach((item) => {
    filters.push({
      label: item.text,
      value: item.value
    });
  });
  return filters;
}
function resolveMoodKey(mood) {
  var _a;
  const byKey = findMoodItemByKey(mood);
  if (byKey)
    return byKey.key;
  const byLabel = findMoodItemByLabel(mood);
  if (byLabel)
    return byLabel.key;
  return ((_a = getCustomMoodItem()) == null ? void 0 : _a.key) || "custom";
}
function getMoodMeta(mood) {
  const byKey = findMoodItemByKey(mood);
  if (byKey)
    return toMoodMeta(byKey);
  const byLabel = findMoodItemByLabel(mood);
  if (byLabel)
    return toMoodMeta(byLabel);
  const custom = getCustomMoodItem();
  const text = normalizeText(mood);
  return {
    ...toMoodMeta(custom),
    label: text || UNKNOWN_LABEL
  };
}
exports.getMoodFilters = getMoodFilters;
exports.getMoodMeta = getMoodMeta;
exports.getMoodOptions = getMoodOptions;
exports.resolveMoodKey = resolveMoodKey;
exports.setMoodConfigs = setMoodConfigs;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/moods.js.map
