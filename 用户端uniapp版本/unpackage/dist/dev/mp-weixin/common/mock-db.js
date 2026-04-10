"use strict";
const common_vendor = require("./vendor.js");
const common_utils = require("./utils.js");
const KEYS = {
  locations: "paperplane_mock_locations_v1",
  planes: "paperplane_mock_planes_v1",
  comments: "paperplane_mock_comments_v1",
  attitudes: "paperplane_mock_attitudes_v1"
};
function hoursBefore(hours) {
  return new Date(Date.now() - hours * 36e5).toISOString();
}
function hoursAfter(hours) {
  return new Date(Date.now() + hours * 36e5).toISOString();
}
function minutesBefore(minutes) {
  return new Date(Date.now() - minutes * 6e4).toISOString();
}
function createSeed() {
  return {
    locations: [
      { id: 1, name: "图书馆", sortOrder: 1 },
      { id: 2, name: "食堂", sortOrder: 2 },
      { id: 3, name: "操场", sortOrder: 3 },
      { id: 4, name: "教学楼", sortOrder: 4 },
      { id: 5, name: "宿舍楼", sortOrder: 5 },
      { id: 6, name: "校门口", sortOrder: 6 }
    ],
    planes: [
      {
        id: "plane_001",
        locationTag: "图书馆",
        content: "今天把靠窗的位置让给了陌生同学，风吹进来的那一刻突然觉得校园很温柔。",
        mood: "happy",
        isAnonymous: true,
        authorName: "",
        imageUrls: ["/static/logo.png"],
        voteTitle: "看到这条你更想说什么？",
        voteOptions: ["我也遇到过", "想抱抱你", "继续加油"],
        createTime: hoursBefore(1),
        expireTime: hoursAfter(23),
        pickCount: 18,
        likeCount: 14,
        reportCount: 0
      },
      {
        id: "plane_002",
        locationTag: "食堂",
        content: "排队的时候听到前面的人说“慢慢来”，原来一句轻声提醒也会被记很久。",
        mood: "calm",
        isAnonymous: false,
        authorName: "阿周同学",
        imageUrls: [],
        createTime: hoursBefore(2),
        expireTime: hoursAfter(18),
        pickCount: 11,
        likeCount: 9,
        reportCount: 0
      },
      {
        id: "plane_003",
        locationTag: "操场",
        content: "夜跑的时候好想把压力都丢进风里，希望明天醒来能轻一点。",
        mood: "sad",
        isAnonymous: true,
        authorName: "",
        imageUrls: ["/static/logo.png", "/static/logo.png"],
        voteTitle: "如果是你，现在更想怎么回应？",
        voteOptions: ["先休息一下", "我想陪你聊聊", "明天会好起来"],
        createTime: hoursBefore(4),
        expireTime: hoursAfter(20),
        pickCount: 22,
        likeCount: 16,
        reportCount: 0
      },
      {
        id: "plane_004",
        locationTag: "教学楼",
        content: "老师拖堂到最后一秒，我的午饭和耐心一起蒸发了。",
        mood: "angry",
        isAnonymous: true,
        authorName: "",
        imageUrls: [],
        createTime: hoursBefore(5),
        expireTime: hoursAfter(12),
        pickCount: 28,
        likeCount: 25,
        reportCount: 0
      },
      {
        id: "plane_005",
        locationTag: "宿舍楼",
        content: "今天室友悄悄给我留了一块蛋糕，原来被惦记的感觉真的会发光。",
        mood: "love",
        isAnonymous: false,
        authorName: "林同学",
        imageUrls: [],
        createTime: hoursBefore(7),
        expireTime: hoursAfter(30),
        pickCount: 16,
        likeCount: 13,
        reportCount: 0
      },
      {
        id: "plane_006",
        locationTag: "校门口",
        content: "每次走到校门口都觉得一天像重新开始，想把没说完的话留给路过的人。",
        mood: "calm",
        isAnonymous: true,
        authorName: "",
        imageUrls: [],
        createTime: hoursBefore(9),
        expireTime: hoursAfter(10),
        pickCount: 9,
        likeCount: 5,
        reportCount: 0
      },
      {
        id: "plane_007",
        locationTag: "图书馆",
        content: "复习到凌晨的时候突然很想家，但也想证明自己真的可以。",
        mood: "sad",
        isAnonymous: false,
        authorName: "纸飞机同学",
        imageUrls: [],
        createTime: hoursBefore(11),
        expireTime: hoursAfter(36),
        pickCount: 20,
        likeCount: 17,
        reportCount: 0
      },
      {
        id: "plane_008",
        locationTag: "教学楼",
        content: "今天在走廊看到喜欢的人，心跳快得像逃课铃。",
        mood: "love",
        isAnonymous: true,
        authorName: "",
        imageUrls: [],
        createTime: hoursBefore(13),
        expireTime: hoursAfter(16),
        pickCount: 15,
        likeCount: 11,
        reportCount: 0
      }
    ],
    comments: [
      { id: "comment_001", planeId: "plane_001", parentCommentId: null, reply: "这种小温柔真的会让人记很久。", nickName: "晚风同学", createTime: minutesBefore(55) },
      { id: "comment_002", planeId: "plane_003", parentCommentId: null, reply: "跑完步会好一点，明天也会轻一点。", nickName: "操场路人", createTime: minutesBefore(42) },
      { id: "comment_003", planeId: "plane_004", parentCommentId: null, reply: "午饭党狠狠共鸣。", nickName: "第二排同学", createTime: minutesBefore(30) },
      { id: "comment_004", planeId: "plane_005", parentCommentId: null, reply: "有人惦记真的很幸福。", nickName: "甜品守护者", createTime: minutesBefore(18) },
      { id: "comment_005", planeId: "plane_001", parentCommentId: "comment_001", reply: "是的，像被风轻轻托了一下。", nickName: "图书馆角落", createTime: minutesBefore(22) }
    ],
    attitudes: [
      { id: "attitude_001", planeId: "plane_001", voterKey: "seed_a", optionKey: "想抱抱你", createTime: minutesBefore(70), updateTime: minutesBefore(70) },
      { id: "attitude_002", planeId: "plane_001", voterKey: "seed_b", optionKey: "我也遇到过", createTime: minutesBefore(62), updateTime: minutesBefore(62) },
      { id: "attitude_003", planeId: "plane_001", voterKey: "seed_c", optionKey: "继续加油", createTime: minutesBefore(48), updateTime: minutesBefore(48) },
      { id: "attitude_004", planeId: "plane_003", voterKey: "seed_d", optionKey: "先休息一下", createTime: minutesBefore(44), updateTime: minutesBefore(44) },
      { id: "attitude_005", planeId: "plane_003", voterKey: "seed_e", optionKey: "我想陪你聊聊", createTime: minutesBefore(39), updateTime: minutesBefore(39) }
    ]
  };
}
function read(key, fallback) {
  return common_utils.safeJsonParse(common_vendor.index.getStorageSync(key), fallback);
}
function write(key, value) {
  common_vendor.index.setStorageSync(key, JSON.stringify(value));
}
function ensureSeed() {
  const currentLocations = read(KEYS.locations, null);
  const currentPlanes = read(KEYS.planes, null);
  const currentComments = read(KEYS.comments, null);
  const currentAttitudes = read(KEYS.attitudes, null);
  if (currentLocations && currentPlanes && currentComments && currentAttitudes)
    return;
  const seed = createSeed();
  write(KEYS.locations, seed.locations);
  write(KEYS.planes, seed.planes);
  write(KEYS.comments, seed.comments);
  write(KEYS.attitudes, seed.attitudes);
}
function getTables() {
  ensureSeed();
  return {
    locations: read(KEYS.locations, []),
    planes: read(KEYS.planes, []),
    comments: read(KEYS.comments, []),
    attitudes: read(KEYS.attitudes, [])
  };
}
function setPlanes(planes) {
  write(KEYS.planes, planes);
}
function setComments(comments) {
  write(KEYS.comments, comments);
}
function setAttitudes(attitudes) {
  write(KEYS.attitudes, attitudes);
}
function toPlaneResponse(plane, comments) {
  return {
    ...plane,
    imageUrls: plane.imageUrls || [],
    commentCount: comments.filter((item) => item.planeId === plane.id).length
  };
}
function getActivePlanes(planes) {
  const now = Date.now();
  return planes.filter((item) => !item.isDeleted && new Date(item.expireTime).getTime() > now);
}
function getNickname() {
  const list = ["夜航旅人", "晚风同学", "雨后小熊", "匿名耳语", "天台观察员", "路过纸飞机"];
  return list[Math.floor(Math.random() * list.length)];
}
function buildPlaneAttitudeSummary(attitudes, planeId, voterKey, optionKeys) {
  var _a;
  const planeAttitudes = attitudes.filter((item) => item.planeId === planeId);
  const counts = optionKeys.map((optionKey) => ({
    optionKey,
    count: planeAttitudes.filter((item) => item.optionKey === optionKey).length
  }));
  const myChoice = ((_a = planeAttitudes.find((item) => item.voterKey === voterKey)) == null ? void 0 : _a.optionKey) || null;
  return {
    totalCount: planeAttitudes.length,
    myChoice,
    options: counts
  };
}
async function getLocations() {
  const { locations, planes } = getTables();
  const activePlanes = getActivePlanes(planes);
  return locations.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((location) => ({
    id: location.id,
    name: location.name,
    sortOrder: location.sortOrder,
    planeCount: activePlanes.filter((item) => item.locationTag === location.name).length
  }));
}
async function throwPlane(payload) {
  const { planes, comments } = getTables();
  const voteOptions = (payload.voteOptions || []).map((item) => String(item || "").trim()).filter(Boolean);
  const plane = {
    id: common_utils.randomId("plane"),
    locationTag: payload.locationTag,
    content: payload.content,
    mood: payload.mood,
    isAnonymous: payload.isAnonymous !== false,
    authorName: payload.isAnonymous === false ? String(payload.authorName || "").trim() : "",
    imageUrls: (payload.imageUrls || []).slice(0, 9),
    voteTitle: voteOptions.length ? String(payload.voteTitle || "").trim() : "",
    voteOptions,
    createTime: (/* @__PURE__ */ new Date()).toISOString(),
    expireTime: hoursAfter(payload.expireHours || 24),
    pickCount: 0,
    likeCount: 0,
    reportCount: 0
  };
  planes.unshift(plane);
  setPlanes(planes);
  return toPlaneResponse(plane, comments);
}
async function getPlanes(location) {
  const { planes, comments } = getTables();
  return getActivePlanes(planes).filter((item) => !location || item.locationTag === location).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()).map((item) => toPlaneResponse(item, comments));
}
async function getPlaneDetail(id) {
  const { planes, comments } = getTables();
  const index = planes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("纸飞机不存在");
  }
  planes[index].pickCount += 1;
  setPlanes(planes);
  return toPlaneResponse(planes[index], comments);
}
async function likePlane(id) {
  const { planes } = getTables();
  const index = planes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("纸飞机不存在");
  }
  planes[index].likeCount += 1;
  planes[index].expireTime = new Date(new Date(planes[index].expireTime).getTime() + 36e5).toISOString();
  setPlanes(planes);
  return {
    likeCount: planes[index].likeCount,
    expireTime: planes[index].expireTime
  };
}
async function reportPlane(id) {
  const { planes } = getTables();
  const index = planes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("纸飞机不存在");
  }
  planes[index].reportCount += 1;
  if (planes[index].reportCount >= 3) {
    planes[index].isDeleted = true;
  }
  setPlanes(planes);
  return { message: "举报已收到" };
}
async function recallPlane(id) {
  const { planes, comments } = getTables();
  const index = planes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("纸飞机不存在");
  }
  planes[index].expireTime = (/* @__PURE__ */ new Date()).toISOString();
  setPlanes(planes);
  return toPlaneResponse(planes[index], comments);
}
async function destroyPlane(id) {
  const { planes } = getTables();
  const index = planes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("纸飞机不存在");
  }
  planes[index].isDeleted = true;
  setPlanes(planes);
  return { message: "纸飞机已销毁" };
}
async function getRandomPlane() {
  const { planes, comments } = getTables();
  const pool = getActivePlanes(planes);
  if (!pool.length) {
    throw new Error("暂无飞机可拾取");
  }
  const target = pool[Math.floor(Math.random() * pool.length)];
  const index = planes.findIndex((item) => item.id === target.id);
  planes[index].pickCount += 1;
  setPlanes(planes);
  return toPlaneResponse(planes[index], comments);
}
async function getTrendingPlanes() {
  const { planes, comments } = getTables();
  return getActivePlanes(planes).sort((a, b) => {
    const hotB = b.likeCount * 2 + b.pickCount;
    const hotA = a.likeCount * 2 + a.pickCount;
    return hotB - hotA;
  }).slice(0, 20).map((item) => toPlaneResponse(item, comments));
}
async function getComments(planeId) {
  const { comments } = getTables();
  const planeComments = comments.filter((item) => item.planeId === planeId).sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
  return planeComments.map((item) => {
    const parent = planeComments.find((comment) => comment.id === item.parentCommentId);
    return {
      ...item,
      replyToNickName: (parent == null ? void 0 : parent.nickName) || null
    };
  });
}
async function addComment(planeId, payload) {
  const { planes, comments } = getTables();
  if (!planes.find((item) => item.id === planeId)) {
    throw new Error("纸飞机不存在");
  }
  const reply = typeof payload === "string" ? payload : payload == null ? void 0 : payload.reply;
  const isAnonymous = typeof payload === "string" ? true : (payload == null ? void 0 : payload.isAnonymous) !== false;
  const nickName = typeof payload === "string" ? "" : String((payload == null ? void 0 : payload.nickName) || "").trim();
  const parentCommentId = typeof payload === "string" ? null : (payload == null ? void 0 : payload.parentCommentId) || null;
  const parent = parentCommentId ? comments.find((item) => item.id === parentCommentId && item.planeId === planeId) : null;
  if (parentCommentId && !parent) {
    throw new Error("回复目标不存在");
  }
  const comment = {
    id: common_utils.randomId("comment"),
    planeId,
    parentCommentId,
    reply,
    nickName: isAnonymous || !nickName ? getNickname() : nickName,
    createTime: (/* @__PURE__ */ new Date()).toISOString()
  };
  comments.push(comment);
  setComments(comments);
  return {
    ...comment,
    replyToNickName: (parent == null ? void 0 : parent.nickName) || null
  };
}
async function getPlaneAttitudes(planeId, voterKey) {
  const { planes, attitudes } = getTables();
  const plane = planes.find((item) => item.id === planeId);
  if (!plane) {
    throw new Error("纸飞机不存在");
  }
  const optionKeys = plane.voteOptions || [];
  if (!optionKeys.length) {
    throw new Error("当前纸飞机没有投票配置");
  }
  return buildPlaneAttitudeSummary(attitudes, planeId, voterKey, optionKeys);
}
async function votePlaneAttitude(planeId, optionKey, voterKey) {
  const { planes, attitudes } = getTables();
  const plane = planes.find((item) => item.id === planeId);
  if (!plane) {
    throw new Error("纸飞机不存在");
  }
  const optionKeys = plane.voteOptions || [];
  if (!optionKeys.length) {
    throw new Error("当前纸飞机没有投票配置");
  }
  if (!optionKeys.includes(optionKey)) {
    throw new Error("投票选项不存在");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const current = attitudes.find((item) => item.planeId === planeId && item.voterKey === voterKey);
  if (current) {
    throw new Error("你已经投过票了");
  }
  attitudes.push({
    id: common_utils.randomId("attitude"),
    planeId,
    voterKey,
    optionKey,
    createTime: now,
    updateTime: now
  });
  setAttitudes(attitudes);
  return buildPlaneAttitudeSummary(attitudes, planeId, voterKey, optionKeys);
}
exports.addComment = addComment;
exports.destroyPlane = destroyPlane;
exports.getComments = getComments;
exports.getLocations = getLocations;
exports.getPlaneAttitudes = getPlaneAttitudes;
exports.getPlaneDetail = getPlaneDetail;
exports.getPlanes = getPlanes;
exports.getRandomPlane = getRandomPlane;
exports.getTrendingPlanes = getTrendingPlanes;
exports.likePlane = likePlane;
exports.recallPlane = recallPlane;
exports.reportPlane = reportPlane;
exports.throwPlane = throwPlane;
exports.votePlaneAttitude = votePlaneAttitude;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/mock-db.js.map
