"use strict";
const moodMetaMap = {
  happy: { label: "开心", icon: "☀️", color: "#ff7b7b" },
  sad: { label: "难过", icon: "🌧️", color: "#6aa7ff" },
  calm: { label: "平静", icon: "🍃", color: "#36b37e" },
  angry: { label: "吐槽", icon: "🔥", color: "#ff9f1c" },
  love: { label: "心动", icon: "💗", color: "#ff6fb1" }
};
const moodOptions = [
  { text: "开心", value: "happy", icon: "☀️" },
  { text: "难过", value: "sad", icon: "🌧️" },
  { text: "平静", value: "calm", icon: "🍃" },
  { text: "吐槽", value: "angry", icon: "🔥" },
  { text: "心动", value: "love", icon: "💗" }
];
const moodFilters = [
  { label: "全部", value: "all" },
  { label: "开心", value: "happy" },
  { label: "难过", value: "sad" },
  { label: "平静", value: "calm" },
  { label: "吐槽", value: "angry" },
  { label: "心动", value: "love" }
];
const expireOptions = [
  { text: "2小时", value: 2 },
  { text: "24小时", value: 24 },
  { text: "48小时", value: 48 }
];
function getMoodMeta(mood) {
  return moodMetaMap[mood] || {
    label: mood || "未知",
    icon: "✦",
    color: "#909399"
  };
}
exports.expireOptions = expireOptions;
exports.getMoodMeta = getMoodMeta;
exports.moodFilters = moodFilters;
exports.moodOptions = moodOptions;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/moods.js.map
