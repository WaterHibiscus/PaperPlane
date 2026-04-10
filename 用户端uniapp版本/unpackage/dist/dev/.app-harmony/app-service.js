if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function initRuntimeSocket(hosts, port, id) {
    if (hosts == "" || port == "" || id == "")
      return Promise.resolve(null);
    return hosts.split(",").reduce((promise, host) => {
      return promise.then((socket) => {
        if (socket != null)
          return Promise.resolve(socket);
        return tryConnectSocket(host, port, id);
      });
    }, Promise.resolve(null));
  }
  const SOCKET_TIMEOUT = 500;
  function tryConnectSocket(host, port, id) {
    return new Promise((resolve, reject) => {
      const socket = uni.connectSocket({
        url: `ws://${host}:${port}/${id}`,
        multiple: true,
        // 支付宝小程序 是否开启多实例
        fail() {
          resolve(null);
        }
      });
      const timer = setTimeout(() => {
        socket.close({
          code: 1006,
          reason: "connect timeout"
        });
        resolve(null);
      }, SOCKET_TIMEOUT);
      socket.onOpen((e) => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.onClose((e) => {
        clearTimeout(timer);
        resolve(null);
      });
      socket.onError((e) => {
        clearTimeout(timer);
        resolve(null);
      });
    });
  }
  const CONSOLE_TYPES = ["log", "warn", "error", "info", "debug"];
  const originalConsole = /* @__PURE__ */ CONSOLE_TYPES.reduce((methods, type) => {
    methods[type] = console[type].bind(console);
    return methods;
  }, {});
  let sendError = null;
  const errorQueue = /* @__PURE__ */ new Set();
  const errorExtra = {};
  function sendErrorMessages(errors) {
    if (sendError == null) {
      errors.forEach((error) => {
        errorQueue.add(error);
      });
      return;
    }
    const data = errors.map((err) => {
      if (typeof err === "string") {
        return err;
      }
      const isPromiseRejection = err && "promise" in err && "reason" in err;
      const prefix = isPromiseRejection ? "UnhandledPromiseRejection: " : "";
      if (isPromiseRejection) {
        err = err.reason;
      }
      if (err instanceof Error && err.stack) {
        if (err.message && !err.stack.includes(err.message)) {
          return `${prefix}${err.message}
${err.stack}`;
        }
        return `${prefix}${err.stack}`;
      }
      if (typeof err === "object" && err !== null) {
        try {
          return prefix + JSON.stringify(err);
        } catch (err2) {
          return prefix + String(err2);
        }
      }
      return prefix + String(err);
    }).filter(Boolean);
    if (data.length > 0) {
      sendError(JSON.stringify(Object.assign({
        type: "error",
        data
      }, errorExtra)));
    }
  }
  function setSendError(value, extra = {}) {
    sendError = value;
    Object.assign(errorExtra, extra);
    if (value != null && errorQueue.size > 0) {
      const errors = Array.from(errorQueue);
      errorQueue.clear();
      sendErrorMessages(errors);
    }
  }
  function initOnError() {
    function onError(error) {
      try {
        if (typeof PromiseRejectionEvent !== "undefined" && error instanceof PromiseRejectionEvent && error.reason instanceof Error && error.reason.message && error.reason.message.includes(`Cannot create property 'errMsg' on string 'taskId`)) {
          return;
        }
        if (false)
          ;
        sendErrorMessages([error]);
      } catch (err) {
        originalConsole.error(err);
      }
    }
    if (typeof uni !== "undefined") {
      if (typeof uni.onError === "function") {
        uni.onError(onError);
      }
      if (typeof uni.onUnhandledRejection === "function") {
        uni.onUnhandledRejection(onError);
      }
    }
    return function offError() {
      if (typeof uni !== "undefined") {
        if (typeof uni.offError === "function") {
          uni.offError(onError);
        }
        if (typeof uni.offUnhandledRejection === "function") {
          uni.offUnhandledRejection(onError);
        }
      }
    };
  }
  function formatMessage(type, args) {
    try {
      return {
        type,
        args: formatArgs(args)
      };
    } catch (e) {
    }
    return {
      type,
      args: []
    };
  }
  function formatArgs(args) {
    return args.map((arg) => formatArg(arg));
  }
  function formatArg(arg, depth = 0) {
    if (depth >= 7) {
      return {
        type: "object",
        value: "[Maximum depth reached]"
      };
    }
    const type = typeof arg;
    switch (type) {
      case "string":
        return formatString(arg);
      case "number":
        return formatNumber(arg);
      case "boolean":
        return formatBoolean(arg);
      case "object":
        try {
          return formatObject(arg, depth);
        } catch (e) {
          return {
            type: "object",
            value: {
              properties: []
            }
          };
        }
      case "undefined":
        return formatUndefined();
      case "function":
        return formatFunction(arg);
      case "symbol": {
        return formatSymbol(arg);
      }
      case "bigint":
        return formatBigInt(arg);
    }
  }
  function formatFunction(value) {
    return {
      type: "function",
      value: `function ${value.name}() {}`
    };
  }
  function formatUndefined() {
    return {
      type: "undefined"
    };
  }
  function formatBoolean(value) {
    return {
      type: "boolean",
      value: String(value)
    };
  }
  function formatNumber(value) {
    return {
      type: "number",
      value: String(value)
    };
  }
  function formatBigInt(value) {
    return {
      type: "bigint",
      value: String(value)
    };
  }
  function formatString(value) {
    return {
      type: "string",
      value
    };
  }
  function formatSymbol(value) {
    return {
      type: "symbol",
      value: value.description
    };
  }
  function formatObject(value, depth) {
    if (value === null) {
      return {
        type: "null"
      };
    }
    {
      if (isComponentPublicInstance(value)) {
        return formatComponentPublicInstance(value, depth);
      }
      if (isComponentInternalInstance(value)) {
        return formatComponentInternalInstance(value, depth);
      }
      if (isUniElement(value)) {
        return formatUniElement(value, depth);
      }
      if (isCSSStyleDeclaration(value)) {
        return formatCSSStyleDeclaration(value, depth);
      }
    }
    if (Array.isArray(value)) {
      return {
        type: "object",
        subType: "array",
        value: {
          properties: value.map((v, i) => formatArrayElement(v, i, depth + 1))
        }
      };
    }
    if (value instanceof Set) {
      return {
        type: "object",
        subType: "set",
        className: "Set",
        description: `Set(${value.size})`,
        value: {
          entries: Array.from(value).map((v) => formatSetEntry(v, depth + 1))
        }
      };
    }
    if (value instanceof Map) {
      return {
        type: "object",
        subType: "map",
        className: "Map",
        description: `Map(${value.size})`,
        value: {
          entries: Array.from(value.entries()).map((v) => formatMapEntry(v, depth + 1))
        }
      };
    }
    if (value instanceof Promise) {
      return {
        type: "object",
        subType: "promise",
        value: {
          properties: []
        }
      };
    }
    if (value instanceof RegExp) {
      return {
        type: "object",
        subType: "regexp",
        value: String(value),
        className: "Regexp"
      };
    }
    if (value instanceof Date) {
      return {
        type: "object",
        subType: "date",
        value: String(value),
        className: "Date"
      };
    }
    if (value instanceof Error) {
      return {
        type: "object",
        subType: "error",
        value: value.message || String(value),
        className: value.name || "Error"
      };
    }
    let className = void 0;
    {
      const constructor = value.constructor;
      if (constructor) {
        if (constructor.get$UTSMetadata$) {
          className = constructor.get$UTSMetadata$().name;
        }
      }
    }
    let entries = Object.entries(value);
    if (isHarmonyBuilderParams(value)) {
      entries = entries.filter(([key]) => key !== "modifier" && key !== "nodeContent");
    }
    return {
      type: "object",
      className,
      value: {
        properties: entries.map((entry) => formatObjectProperty(entry[0], entry[1], depth + 1))
      }
    };
  }
  function isHarmonyBuilderParams(value) {
    return value.modifier && value.modifier._attribute && value.nodeContent;
  }
  function isComponentPublicInstance(value) {
    return value.$ && isComponentInternalInstance(value.$);
  }
  function isComponentInternalInstance(value) {
    return value.type && value.uid != null && value.appContext;
  }
  function formatComponentPublicInstance(value, depth) {
    return {
      type: "object",
      className: "ComponentPublicInstance",
      value: {
        properties: Object.entries(value.$.type).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function formatComponentInternalInstance(value, depth) {
    return {
      type: "object",
      className: "ComponentInternalInstance",
      value: {
        properties: Object.entries(value.type).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function isUniElement(value) {
    return value.style && value.tagName != null && value.nodeName != null;
  }
  function formatUniElement(value, depth) {
    return {
      type: "object",
      // 非 x 没有 UniElement 的概念
      // className: 'UniElement',
      value: {
        properties: Object.entries(value).filter(([name]) => [
          "id",
          "tagName",
          "nodeName",
          "dataset",
          "offsetTop",
          "offsetLeft",
          "style"
        ].includes(name)).map(([name, value2]) => formatObjectProperty(name, value2, depth + 1))
      }
    };
  }
  function isCSSStyleDeclaration(value) {
    return typeof value.getPropertyValue === "function" && typeof value.setProperty === "function" && value.$styles;
  }
  function formatCSSStyleDeclaration(style, depth) {
    return {
      type: "object",
      value: {
        properties: Object.entries(style.$styles).map(([name, value]) => formatObjectProperty(name, value, depth + 1))
      }
    };
  }
  function formatObjectProperty(name, value, depth) {
    const result = formatArg(value, depth);
    result.name = name;
    return result;
  }
  function formatArrayElement(value, index, depth) {
    const result = formatArg(value, depth);
    result.name = `${index}`;
    return result;
  }
  function formatSetEntry(value, depth) {
    return {
      value: formatArg(value, depth)
    };
  }
  function formatMapEntry(value, depth) {
    return {
      key: formatArg(value[0], depth),
      value: formatArg(value[1], depth)
    };
  }
  let sendConsole = null;
  const messageQueue = [];
  const messageExtra = {};
  const EXCEPTION_BEGIN_MARK = "---BEGIN:EXCEPTION---";
  const EXCEPTION_END_MARK = "---END:EXCEPTION---";
  function sendConsoleMessages(messages) {
    if (sendConsole == null) {
      messageQueue.push(...messages);
      return;
    }
    sendConsole(JSON.stringify(Object.assign({
      type: "console",
      data: messages
    }, messageExtra)));
  }
  function setSendConsole(value, extra = {}) {
    sendConsole = value;
    Object.assign(messageExtra, extra);
    if (value != null && messageQueue.length > 0) {
      const messages = messageQueue.slice();
      messageQueue.length = 0;
      sendConsoleMessages(messages);
    }
  }
  function rewriteConsole() {
    {
      if (typeof UTSProxyObject === "object" && UTSProxyObject !== null && typeof UTSProxyObject.invokeSync === "function") {
        UTSProxyObject.invokeSync("__UniConsole", "setSendConsoleMessages", [
          sendConsoleMessages
        ]);
      }
    }
    function wrapConsole(type) {
      return function(...args) {
        if (type === "error" && args.length === 1) {
          const arg = args[0];
          if (typeof arg === "string" && arg.startsWith(EXCEPTION_BEGIN_MARK)) {
            const startIndex = EXCEPTION_BEGIN_MARK.length;
            const endIndex = arg.length - EXCEPTION_END_MARK.length;
            sendErrorMessages([arg.slice(startIndex, endIndex)]);
            return;
          } else if (arg instanceof Error) {
            sendErrorMessages([arg]);
            return;
          }
        }
        sendConsoleMessages([formatMessage(type, args)]);
      };
    }
    if (isConsoleWritable()) {
      CONSOLE_TYPES.forEach((type) => {
        console[type] = wrapConsole(type);
      });
      return function restoreConsole() {
        CONSOLE_TYPES.forEach((type) => {
          console[type] = originalConsole[type];
        });
      };
    } else {
      {
        if (typeof uni !== "undefined" && uni.__f__) {
          const oldLog = uni.__f__;
          if (oldLog) {
            uni.__f__ = function(...args) {
              const [type, filename, ...rest] = args;
              oldLog(type, "", ...rest);
              sendConsoleMessages([formatMessage(type, [...rest, filename])]);
            };
            return function restoreConsole() {
              uni.__f__ = oldLog;
            };
          }
        }
      }
    }
    return function restoreConsole() {
      {
        if (typeof UTSProxyObject === "object" && UTSProxyObject !== null && typeof UTSProxyObject.invokeSync === "function") {
          UTSProxyObject.invokeSync("__UniConsole", "restoreConsole", []);
        }
      }
    };
  }
  function isConsoleWritable() {
    const value = console.log;
    const sym = Symbol();
    try {
      console.log = sym;
    } catch (ex) {
      return false;
    }
    const isWritable = console.log === sym;
    console.log = value;
    return isWritable;
  }
  function initRuntimeSocketService() {
    const hosts = "127.0.0.1,192.168.56.1,10.77.12.67";
    const port = "8090";
    const id = "app-harmony_9Tei_s";
    const lazy = typeof swan !== "undefined";
    let restoreError = lazy ? () => {
    } : initOnError();
    let restoreConsole = lazy ? () => {
    } : rewriteConsole();
    return Promise.resolve().then(() => {
      if (lazy) {
        restoreError = initOnError();
        restoreConsole = rewriteConsole();
      }
      return initRuntimeSocket(hosts, port, id).then((socket) => {
        if (!socket) {
          restoreError();
          restoreConsole();
          originalConsole.error(wrapError("开发模式下日志通道建立 socket 连接失败。"));
          originalConsole.error(wrapError("如果是运行到真机，请确认手机与电脑处于同一网络。"));
          return false;
        }
        socket.onClose(() => {
          {
            originalConsole.error(wrapError("手机端日志通道 socket 连接已断开，请重启基座应用或重新运行。"));
          }
          restoreError();
          restoreConsole();
        });
        setSendConsole((data) => {
          socket.send({
            data
          });
        });
        setSendError((data) => {
          socket.send({
            data
          });
        });
        return true;
      });
    });
  }
  const ERROR_CHAR = "‌";
  function wrapError(error) {
    return `${ERROR_CHAR}${error}${ERROR_CHAR}`;
  }
  initRuntimeSocketService();
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$c = {
    props: {
      active: {
        type: String,
        default: "home"
      },
      theme: {
        type: String,
        default: "light"
      }
    },
    data() {
      return {
        tabs: [
          { key: "home", icon: "🏠", path: "/pages/home/index" },
          { key: "discover", icon: "⌕", path: "/pages/discover/index" },
          { key: "throw", icon: "✎", path: "/pages/throw/index" },
          { key: "trending", icon: "🔥", path: "/pages/trending/index" },
          { key: "mine", icon: "◉", path: "/pages/mine/index" }
        ],
        maskPlane: "✈",
        maskText: "纸飞机正在穿过这片风场",
        notchWidth: 26,
        notchDepth: 28,
        notchCurve: 7,
        visualActive: "home",
        overlayVisible: false,
        navigating: false,
        navigationTimer: null
      };
    },
    computed: {
      themeClass() {
        return this.theme === "dark" ? "theme-dark" : "theme-light";
      },
      activeIndex() {
        const index = this.tabs.findIndex((item) => item.key === this.visualActive);
        return index === -1 ? 0 : index;
      },
      activeTab() {
        return this.tabs[this.activeIndex] || this.tabs[0];
      },
      notchMargin() {
        return this.notchWidth / 2;
      },
      activePercent() {
        return (this.activeIndex + 0.5) / this.tabs.length * 100;
      },
      activeX() {
        return this.clamp(this.activePercent, this.notchMargin, 100 - this.notchMargin);
      },
      tabbarStyle() {
        return {
          "--active-x": `${this.activeX}%`,
          "--tab-count": this.tabs.length
        };
      },
      tabbarPath() {
        const width = 100;
        const height = 64;
        const x = this.activeX;
        const left = x - this.notchWidth / 2;
        const right = x + this.notchWidth / 2;
        return `
				M 0 0
				L ${left - this.notchCurve} 0
				C ${left + this.notchCurve} 0, ${left + this.notchCurve} ${this.notchDepth}, ${x} ${this.notchDepth}
				C ${right - this.notchCurve} ${this.notchDepth}, ${right - this.notchCurve} 0, ${right + this.notchCurve} 0
				L ${width} 0
				L ${width} ${height}
				L 0 ${height}
				Z
			`;
      }
    },
    watch: {
      active: {
        immediate: true,
        handler(value) {
          if (!this.navigating) {
            this.visualActive = value || "home";
          }
        }
      }
    },
    beforeUnmount() {
      this.clearNavigationTimer();
    },
    beforeDestroy() {
      this.clearNavigationTimer();
    },
    methods: {
      getTabIndex(key) {
        const index = this.tabs.findIndex((item) => item.key === key);
        return index === -1 ? 0 : index;
      },
      clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      },
      clearNavigationTimer() {
        if (this.navigationTimer) {
          clearTimeout(this.navigationTimer);
          this.navigationTimer = null;
        }
      },
      switchTo(item) {
        if (!item || item.key === this.active || this.navigating)
          return;
        this.navigating = true;
        this.visualActive = item.key;
        this.overlayVisible = true;
        this.clearNavigationTimer();
        this.navigationTimer = setTimeout(() => {
          uni.reLaunch({
            url: item.path
          });
        }, 420);
      }
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["tabbar-shell", $options.themeClass]),
        style: vue.normalizeStyle($options.tabbarStyle)
      },
      [
        $data.overlayVisible ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "transition-mask"
        }, [
          vue.createElementVNode("view", { class: "mask-core" }, [
            vue.createElementVNode(
              "text",
              { class: "mask-plane" },
              vue.toDisplayString($data.maskPlane),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "mask-text" },
              vue.toDisplayString($data.maskText),
              1
              /* TEXT */
            )
          ])
        ])) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(), vue.createElementBlock("svg", {
          class: "curved-bg",
          viewBox: "0 0 100 64",
          preserveAspectRatio: "none",
          "aria-hidden": "true"
        }, [
          vue.createElementVNode("path", { d: $options.tabbarPath }, null, 8, ["d"])
        ])),
        vue.createElementVNode("view", {
          class: "curved-bubble",
          "aria-hidden": "true"
        }, [
          vue.createElementVNode(
            "text",
            { class: "bubble-icon" },
            vue.toDisplayString($options.activeTab.icon),
            1
            /* TEXT */
          )
        ]),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.tabs, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: item.key,
              class: vue.normalizeClass(["curved-item", { active: $options.activeIndex === $options.getTabIndex(item.key) }]),
              onClick: ($event) => $options.switchTo(item)
            }, [
              vue.createElementVNode(
                "text",
                { class: "item-icon" },
                vue.toDisplayString(item.icon),
                1
                /* TEXT */
              )
            ], 10, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const AppTabbar = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-a66d2e12"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/AppTabbar.vue"]]);
  const _sfc_main$b = {
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      theme: {
        type: String,
        default: "light"
      },
      title: {
        type: String,
        default: "纸飞机正在打开"
      },
      subtitle: {
        type: String,
        default: "风里的折痕正在展开成一张信笺"
      }
    },
    data() {
      return {
        planeIcon: "✈"
      };
    },
    computed: {
      themeClass() {
        return this.theme === "dark" ? "theme-dark" : "theme-light";
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.visible ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["detail-open-overlay", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "overlay-aura aura-left" }),
        vue.createElementVNode("view", { class: "overlay-aura aura-right" }),
        vue.createElementVNode("view", { class: "overlay-grid" }),
        vue.createElementVNode("view", { class: "transition-stage" }, [
          vue.createElementVNode("view", { class: "burst-ring ring-a" }),
          vue.createElementVNode("view", { class: "burst-ring ring-b" }),
          vue.createElementVNode("view", { class: "burst-ring ring-c" }),
          vue.createElementVNode("view", { class: "plane-stage" }, [
            vue.createElementVNode("view", { class: "wing wing-left" }),
            vue.createElementVNode("view", { class: "wing wing-right" }),
            vue.createElementVNode("view", { class: "plane-body" }, [
              vue.createElementVNode(
                "text",
                { class: "plane-glyph" },
                vue.toDisplayString($data.planeIcon),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "sheet-stack" }, [
            vue.createElementVNode("view", { class: "sheet layer-back" }),
            vue.createElementVNode("view", { class: "sheet layer-mid" }),
            vue.createElementVNode("view", { class: "sheet layer-front" }, [
              vue.createElementVNode("view", { class: "sheet-pin" }),
              vue.createElementVNode("view", { class: "sheet-lines" }, [
                vue.createElementVNode("view", { class: "sheet-line short" }),
                vue.createElementVNode("view", { class: "sheet-line full" }),
                vue.createElementVNode("view", { class: "sheet-line full" }),
                vue.createElementVNode("view", { class: "sheet-line medium" })
              ])
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "transition-copy" }, [
          vue.createElementVNode(
            "text",
            { class: "transition-title" },
            vue.toDisplayString($props.title),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "transition-subtitle" },
            vue.toDisplayString($props.subtitle),
            1
            /* TEXT */
          )
        ])
      ],
      2
      /* CLASS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const DetailOpenTransition = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__scopeId", "data-v-348edaa0"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/DetailOpenTransition.vue"]]);
  const _sfc_main$a = {
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      theme: {
        type: String,
        default: "light"
      },
      title: {
        type: String,
        default: "正在抵达下一页"
      },
      subtitle: {
        type: String,
        default: "纸飞机正在穿过这片风场"
      }
    },
    computed: {
      themeClass() {
        return this.theme === "dark" ? "theme-dark" : "theme-light";
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return $props.visible ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["page-transition", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "transition-aura aura-left" }),
        vue.createElementVNode("view", { class: "transition-aura aura-right" }),
        vue.createElementVNode("view", { class: "transition-core" }, [
          vue.createElementVNode("view", { class: "plane-track" }, [
            vue.createElementVNode("view", { class: "track-line line-one" }),
            vue.createElementVNode("view", { class: "track-line line-two" }),
            vue.createElementVNode("view", { class: "track-line line-three" }),
            vue.createElementVNode("text", { class: "plane-icon" }, "✈")
          ]),
          vue.createElementVNode(
            "text",
            { class: "transition-title" },
            vue.toDisplayString($props.title),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "transition-subtitle" },
            vue.toDisplayString($props.subtitle),
            1
            /* TEXT */
          )
        ])
      ],
      2
      /* CLASS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const PageTransition = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__scopeId", "data-v-992ea324"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/PageTransition.vue"]]);
  const _sfc_main$9 = {
    props: {
      phrases: {
        type: Array,
        default: () => []
      },
      hold: {
        type: Number,
        default: 2600
      },
      duration: {
        type: Number,
        default: 820
      }
    },
    data() {
      return {
        phase: "stable",
        activeIndex: 0,
        pieces: [],
        cycleSeed: 0,
        holdTimer: null,
        shatterTimer: null,
        assembleTimer: null
      };
    },
    watch: {
      phrases: {
        immediate: true,
        deep: true,
        handler(phrases) {
          this.resetPieces(phrases);
        }
      }
    },
    beforeUnmount() {
      this.clearTimers();
    },
    beforeDestroy() {
      this.clearTimers();
    },
    methods: {
      randomBetween(min, max) {
        return Math.random() * (max - min) + min;
      },
      clearTimers() {
        if (this.holdTimer)
          clearTimeout(this.holdTimer);
        if (this.shatterTimer)
          clearTimeout(this.shatterTimer);
        if (this.assembleTimer)
          clearTimeout(this.assembleTimer);
        this.holdTimer = null;
        this.shatterTimer = null;
        this.assembleTimer = null;
      },
      buildPieces(text, mode) {
        return Array.from(text || "").map((char, index) => ({
          key: `${this.cycleSeed}-${mode}-${index}-${char}`,
          char,
          dx: this.randomBetween(-24, 24),
          dy: this.randomBetween(22, 48),
          rot: this.randomBetween(-22, 22),
          delay: index * 28,
          blur: this.randomBetween(2, 6),
          assembleX: this.randomBetween(-18, 18),
          assembleY: this.randomBetween(18, 34)
        }));
      },
      resetPieces(phrases) {
        this.clearTimers();
        this.activeIndex = 0;
        this.cycleSeed += 1;
        this.phase = "stable";
        this.pieces = this.buildPieces(phrases && phrases[0] || "", "stable");
        this.scheduleNextCycle();
      },
      scheduleNextCycle() {
        this.clearTimers();
        if (!this.phrases || this.phrases.length < 2)
          return;
        this.holdTimer = setTimeout(() => {
          this.phase = "shatter";
          this.shatterTimer = setTimeout(() => {
            this.activeIndex = (this.activeIndex + 1) % this.phrases.length;
            this.cycleSeed += 1;
            this.pieces = this.buildPieces(this.phrases[this.activeIndex], "assemble");
            this.phase = "assemble";
            this.assembleTimer = setTimeout(() => {
              this.phase = "stable";
              this.scheduleNextCycle();
            }, this.duration);
          }, this.duration);
        }, this.hold);
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["shatter-headline", `phase-${$data.phase}`])
      },
      [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.pieces, (piece) => {
            return vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: piece.key,
                class: "headline-piece",
                style: vue.normalizeStyle({
                  "--dx": `${piece.dx}rpx`,
                  "--dy": `${piece.dy}rpx`,
                  "--rot": `${piece.rot}deg`,
                  "--delay": `${piece.delay}ms`,
                  "--blur": `${piece.blur}rpx`,
                  "--assemble-x": `${piece.assembleX}rpx`,
                  "--assemble-y": `${piece.assembleY}rpx`
                })
              },
              vue.toDisplayString(piece.char === " " ? " " : piece.char),
              5
              /* TEXT, STYLE */
            );
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ],
      2
      /* CLASS */
    );
  }
  const ShatterHeadline = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-d23ac1b6"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/ShatterHeadline.vue"]]);
  const config = {
    // H5/模拟器调试可直连本机，真机请改成你电脑的局域网 IP。
    baseURL: "http://127.0.0.1:5000/api",
    timeout: 1e4
  };
  function formatTime(dateStr) {
    if (!dateStr)
      return "";
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = `${date.getHours()}`.padStart(2, "0");
    const minute = `${date.getMinutes()}`.padStart(2, "0");
    return `${month}/${day} ${hour}:${minute}`;
  }
  function timeAgo(dateStr) {
    if (!dateStr)
      return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 6e4);
    if (minutes < 1)
      return "刚刚";
    if (minutes < 60)
      return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
      return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  }
  function getRemainingText(expireTime) {
    if (!expireTime)
      return "未知";
    const remaining = new Date(expireTime).getTime() - Date.now();
    if (remaining <= 0)
      return "已降落";
    const hours = Math.floor(remaining / 36e5);
    const minutes = Math.floor(remaining % 36e5 / 6e4);
    return `剩余 ${hours}h ${minutes}m`;
  }
  function getRemainingShort(expireTime) {
    if (!expireTime)
      return "";
    const remaining = new Date(expireTime).getTime() - Date.now();
    if (remaining <= 0)
      return "已降落";
    const hours = Math.floor(remaining / 36e5);
    const minutes = Math.floor(remaining % 36e5 / 6e4);
    return `${hours}h ${minutes}m`;
  }
  function isExpired(expireTime) {
    return new Date(expireTime).getTime() <= Date.now();
  }
  function randomId(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
  function safeJsonParse(value, fallback) {
    if (!value)
      return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  const KEYS$1 = {
    locations: "paperplane_mock_locations_v1",
    planes: "paperplane_mock_planes_v1",
    comments: "paperplane_mock_comments_v1"
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
          createTime: hoursBefore(13),
          expireTime: hoursAfter(16),
          pickCount: 15,
          likeCount: 11,
          reportCount: 0
        }
      ],
      comments: [
        { id: "comment_001", planeId: "plane_001", reply: "这种小温柔真的会让人记很久。", nickName: "晚风同学", createTime: minutesBefore(55) },
        { id: "comment_002", planeId: "plane_003", reply: "跑完步会好一点，明天也会轻一点。", nickName: "操场路人", createTime: minutesBefore(42) },
        { id: "comment_003", planeId: "plane_004", reply: "午饭党狠狠共鸣。", nickName: "第二排同学", createTime: minutesBefore(30) },
        { id: "comment_004", planeId: "plane_005", reply: "有人惦记真的很幸福。", nickName: "甜品守护者", createTime: minutesBefore(18) }
      ]
    };
  }
  function read(key, fallback) {
    return safeJsonParse(uni.getStorageSync(key), fallback);
  }
  function write(key, value) {
    uni.setStorageSync(key, JSON.stringify(value));
  }
  function ensureSeed() {
    const currentLocations = read(KEYS$1.locations, null);
    const currentPlanes = read(KEYS$1.planes, null);
    const currentComments = read(KEYS$1.comments, null);
    if (currentLocations && currentPlanes && currentComments)
      return;
    const seed = createSeed();
    write(KEYS$1.locations, seed.locations);
    write(KEYS$1.planes, seed.planes);
    write(KEYS$1.comments, seed.comments);
  }
  function getTables() {
    ensureSeed();
    return {
      locations: read(KEYS$1.locations, []),
      planes: read(KEYS$1.planes, []),
      comments: read(KEYS$1.comments, [])
    };
  }
  function setPlanes(planes) {
    write(KEYS$1.planes, planes);
  }
  function setComments(comments) {
    write(KEYS$1.comments, comments);
  }
  function toPlaneResponse(plane, comments) {
    return {
      ...plane,
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
  async function getLocations$1() {
    const { locations, planes } = getTables();
    const activePlanes = getActivePlanes(planes);
    return locations.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((location) => ({
      id: location.id,
      name: location.name,
      sortOrder: location.sortOrder,
      planeCount: activePlanes.filter((item) => item.locationTag === location.name).length
    }));
  }
  async function throwPlane$1(payload) {
    const { planes, comments } = getTables();
    const plane = {
      id: randomId("plane"),
      locationTag: payload.locationTag,
      content: payload.content,
      mood: payload.mood,
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
  async function getPlanes$1(location) {
    const { planes, comments } = getTables();
    return getActivePlanes(planes).filter((item) => !location || item.locationTag === location).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()).map((item) => toPlaneResponse(item, comments));
  }
  async function getPlaneDetail$1(id) {
    const { planes, comments } = getTables();
    const index = planes.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("纸飞机不存在");
    }
    planes[index].pickCount += 1;
    setPlanes(planes);
    return toPlaneResponse(planes[index], comments);
  }
  async function likePlane$1(id) {
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
  async function reportPlane$1(id) {
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
  async function getRandomPlane$1() {
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
  async function getTrendingPlanes$1() {
    const { planes, comments } = getTables();
    return getActivePlanes(planes).sort((a, b) => {
      const hotB = b.likeCount * 2 + b.pickCount;
      const hotA = a.likeCount * 2 + a.pickCount;
      return hotB - hotA;
    }).slice(0, 20).map((item) => toPlaneResponse(item, comments));
  }
  async function getMyPlanes$1(ids) {
    const { planes, comments } = getTables();
    return planes.filter((item) => ids.includes(item.id)).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()).map((item) => toPlaneResponse(item, comments));
  }
  async function getComments$1(planeId) {
    const { comments } = getTables();
    return comments.filter((item) => item.planeId === planeId).sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());
  }
  async function addComment$1(planeId, payload) {
    const { planes, comments } = getTables();
    if (!planes.find((item) => item.id === planeId)) {
      throw new Error("纸飞机不存在");
    }
    const reply = typeof payload === "string" ? payload : payload == null ? void 0 : payload.reply;
    const isAnonymous = typeof payload === "string" ? true : (payload == null ? void 0 : payload.isAnonymous) !== false;
    const nickName = typeof payload === "string" ? "" : String((payload == null ? void 0 : payload.nickName) || "").trim();
    const comment = {
      id: randomId("comment"),
      planeId,
      reply,
      nickName: isAnonymous || !nickName ? getNickname() : nickName,
      createTime: (/* @__PURE__ */ new Date()).toISOString()
    };
    comments.push(comment);
    setComments(comments);
    return comment;
  }
  function buildError(message, response) {
    const error = new Error(message || "请求失败");
    error.response = response || null;
    return error;
  }
  function request({ url, method = "GET", data }) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${config.baseURL}${url}`,
        method,
        data,
        timeout: config.timeout,
        success: (res) => {
          var _a;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
            return;
          }
          reject(buildError(((_a = res.data) == null ? void 0 : _a.message) || "请求失败", res));
        },
        fail: (err) => {
          reject(buildError(err.errMsg || "网络异常", err));
        }
      });
    });
  }
  async function withFallback(networkTask, mockTask) {
    var _a;
    try {
      return await networkTask();
    } catch (error) {
      if ((_a = error == null ? void 0 : error.response) == null ? void 0 : _a.statusCode) {
        throw error;
      }
      return mockTask(error);
    }
  }
  function getLocations() {
    return withFallback(
      () => request({ url: "/locations" }),
      () => getLocations$1()
    );
  }
  function throwPlane(data) {
    return withFallback(
      () => request({ url: "/planes", method: "POST", data }),
      () => throwPlane$1(data)
    );
  }
  function getPlanes(location) {
    return withFallback(
      () => request({ url: "/planes", data: { location } }),
      () => getPlanes$1(location)
    );
  }
  function getPlaneDetail(id) {
    return withFallback(
      () => request({ url: `/planes/${id}` }),
      () => getPlaneDetail$1(id)
    );
  }
  function likePlane(id) {
    return withFallback(
      () => request({ url: `/planes/${id}/like`, method: "POST" }),
      () => likePlane$1(id)
    );
  }
  function reportPlane(id) {
    return withFallback(
      () => request({ url: `/planes/${id}/report`, method: "POST" }),
      () => reportPlane$1(id)
    );
  }
  function getRandomPlane() {
    return withFallback(
      () => request({ url: "/planes/random" }),
      () => getRandomPlane$1()
    );
  }
  function getTrendingPlanes() {
    return withFallback(
      () => request({ url: "/planes/trending" }),
      () => getTrendingPlanes$1()
    );
  }
  function getMyPlanes(ids) {
    return withFallback(
      () => request({ url: "/planes/mine", method: "POST", data: { ids } }),
      () => getMyPlanes$1(ids)
    );
  }
  function getComments(planeId) {
    return withFallback(
      () => request({ url: `/planes/${planeId}/comments` }),
      () => getComments$1(planeId)
    );
  }
  function addComment(planeId, payload) {
    const data = typeof payload === "string" ? { reply: payload } : payload;
    return withFallback(
      () => request({ url: `/planes/${planeId}/comments`, method: "POST", data }),
      () => addComment$1(planeId, data)
    );
  }
  const KEYS = {
    theme: "paperplane_theme",
    currentLocation: "paperplane_current_location",
    myPlaneIds: "paperplane_my_plane_ids",
    locationCache: "paperplane_location_cache",
    profileName: "paperplane_profile_name"
  };
  function getTheme() {
    return uni.getStorageSync(KEYS.theme) || "light";
  }
  function setTheme(theme) {
    uni.setStorageSync(KEYS.theme, theme);
  }
  function getCurrentLocation() {
    return uni.getStorageSync(KEYS.currentLocation) || "";
  }
  function setCurrentLocation$1(name) {
    uni.setStorageSync(KEYS.currentLocation, name || "");
  }
  function getMyPlaneIds() {
    return safeJsonParse(uni.getStorageSync(KEYS.myPlaneIds), []);
  }
  function saveMyPlaneId(id) {
    const current = getMyPlaneIds().filter((item) => item !== id);
    current.unshift(id);
    uni.setStorageSync(KEYS.myPlaneIds, JSON.stringify(current.slice(0, 100)));
  }
  function getLocationCache() {
    return safeJsonParse(uni.getStorageSync(KEYS.locationCache), []);
  }
  function setLocationCache(locations) {
    uni.setStorageSync(KEYS.locationCache, JSON.stringify(locations || []));
  }
  function getProfileName() {
    return uni.getStorageSync(KEYS.profileName) || "纸飞机同学";
  }
  const appState = vue.reactive({
    theme: getTheme(),
    currentLocation: getCurrentLocation(),
    locations: getLocationCache(),
    profileName: getProfileName()
  });
  function toggleTheme() {
    appState.theme = appState.theme === "dark" ? "light" : "dark";
    setTheme(appState.theme);
    return appState.theme;
  }
  function setCurrentLocation(name) {
    appState.currentLocation = name || "";
    setCurrentLocation$1(appState.currentLocation);
  }
  async function fetchLocations() {
    const locations = await getLocations();
    appState.locations = locations || [];
    setLocationCache(appState.locations);
    return appState.locations;
  }
  const detailOpenTransitionMixin = {
    data() {
      return {
        detailOpenVisible: false,
        detailOpenTimer: null
      };
    },
    onHide() {
      this.clearDetailOpenTimer();
      this.detailOpenVisible = false;
    },
    onUnload() {
      this.clearDetailOpenTimer();
      this.detailOpenVisible = false;
    },
    methods: {
      clearDetailOpenTimer() {
        if (this.detailOpenTimer) {
          clearTimeout(this.detailOpenTimer);
          this.detailOpenTimer = null;
        }
      },
      openPlaneDetail(id, delay = 760) {
        if (!id || this.detailOpenVisible)
          return;
        this.detailOpenVisible = true;
        this.clearDetailOpenTimer();
        this.detailOpenTimer = setTimeout(() => {
          uni.navigateTo({
            url: `/pages/detail/index?id=${id}`
          });
        }, delay);
      }
    }
  };
  const pageTransitionMixin = {
    data() {
      return {
        pageTransitionVisible: false,
        pageTransitionTimer: null
      };
    },
    onShow() {
      this.playPageTransition();
    },
    onHide() {
      this.clearPageTransitionTimer();
    },
    onUnload() {
      this.clearPageTransitionTimer();
    },
    methods: {
      playPageTransition(duration = 420) {
        this.clearPageTransitionTimer();
        this.pageTransitionVisible = true;
        this.pageTransitionTimer = setTimeout(() => {
          this.pageTransitionVisible = false;
          this.pageTransitionTimer = null;
        }, duration);
      },
      clearPageTransitionTimer() {
        if (this.pageTransitionTimer) {
          clearTimeout(this.pageTransitionTimer);
          this.pageTransitionTimer = null;
        }
        this.pageTransitionVisible = false;
      }
    }
  };
  const _sfc_main$8 = {
    mixins: [pageTransitionMixin, detailOpenTransitionMixin],
    components: {
      AppTabbar,
      DetailOpenTransition,
      PageTransition,
      ShatterHeadline
    },
    data() {
      return {
        appState,
        query: "",
        trending: [],
        randomLoading: false,
        headlinePhrases: [
          "把心绪折成纸，交给校园的风",
          "把没说出口的话，留在路过的风景",
          "让匿名的回声，刚好落进谁手里",
          "把今天的情绪，投向一个真实地点",
          "给某个陌生同学，留下一次轻回应"
        ],
        iconMap: {
          "图书馆": "📚",
          "食堂": "🍜",
          "操场": "🏃",
          "教学楼": "🏫",
          "宿舍楼": "🏠",
          "校门口": "🚪"
        },
        nodePresets: [
          {
            x: 16,
            y: 28,
            size: 70
          },
          {
            x: 40,
            y: 18,
            size: 62
          },
          {
            x: 70,
            y: 26,
            size: 74
          },
          {
            x: 28,
            y: 64,
            size: 68
          },
          {
            x: 58,
            y: 58,
            size: 80
          },
          {
            x: 82,
            y: 70,
            size: 60
          },
          {
            x: 12,
            y: 70,
            size: 58
          },
          {
            x: 48,
            y: 76,
            size: 66
          }
        ]
      };
    },
    computed: {
      themeClass() {
        return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
      },
      isDark() {
        return this.appState.theme === "dark";
      },
      locations() {
        return this.appState.locations || [];
      },
      filteredLocations() {
        const keyword = (this.query || "").trim();
        if (!keyword)
          return this.locations;
        return this.locations.filter((item) => item.name.includes(keyword));
      },
      mapNodes() {
        const nowSec = Date.now() / 1e3;
        const orbitDuration = 3.6;
        return this.filteredLocations.map((loc, index) => {
          const preset = this.nodePresets[index % this.nodePresets.length];
          const countBoost = Math.min(loc.planeCount || 0, 6) * 2;
          const size = Math.min(Math.max(preset.size + countBoost, 56), 90);
          const labelShift = preset.x > 72 ? "-16px" : preset.x < 20 ? "16px" : "0px";
          const delay = this.getNegativeAnimationDelay(nowSec, index * 0.18, orbitDuration);
          return {
            loc,
            ...preset,
            size,
            labelShift,
            delay
          };
        });
      },
      signalRoutes() {
        const nodes = this.mapNodes;
        if (nodes.length < 2)
          return [];
        const nowSec = Date.now() / 1e3;
        const pairs = [];
        for (let index = 0; index < nodes.length - 1; index += 1) {
          pairs.push([nodes[index], nodes[index + 1]]);
        }
        if (nodes.length > 2) {
          for (let index = 0; index < nodes.length; index += 2) {
            pairs.push([nodes[index], nodes[(index + 2) % nodes.length]]);
          }
        }
        const seen = /* @__PURE__ */ new Set();
        return pairs.filter(([from, to]) => {
          if (!from || !to || from.loc.id === to.loc.id)
            return false;
          const key = [from.loc.id, to.loc.id].sort((a, b) => a - b).join("-");
          if (seen.has(key))
            return false;
          seen.add(key);
          return true;
        }).slice(0, 7).map(([from, to], index) => {
          const heat = Math.max(from.loc.planeCount || 0, to.loc.planeCount || 0);
          const width = Math.min(2.8, 1.05 + heat * 0.18);
          return {
            id: `${from.loc.id}-${to.loc.id}-${index}`,
            path: this.createRoutePath(from, to, index),
            width,
            opacity: Math.min(0.78, 0.28 + heat * 0.08),
            duration: 5.4 + index % 3 * 0.9,
            delay: index * 0.65,
            packetOffset: index * 0.65 + 1.8,
            packetSize: Math.min(2.2, 1.15 + heat * 0.08),
            glowDelay: this.getNegativeAnimationDelay(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
            packetBegin: this.getNegativeMotionBegin(nowSec, index * 0.65, 5.4 + index % 3 * 0.9),
            secondaryPacketBegin: this.getNegativeMotionBegin(
              nowSec,
              index * 0.65 + 1.8,
              5.4 + index % 3 * 0.9
            )
          };
        });
      },
      totalPlanes() {
        return this.locations.reduce((sum, item) => sum + (item.planeCount || 0), 0);
      },
      topTrending() {
        return this.trending.slice(0, 3);
      },
      busiestLocationLabel() {
        if (!this.filteredLocations.length)
          return "等待新的投递进入网络";
        const sorted = this.filteredLocations.slice().sort((a, b) => (b.planeCount || 0) - (a.planeCount || 0));
        const hottest = sorted[0];
        if (!hottest || !hottest.planeCount)
          return "所有落点当前都很安静";
        return `${hottest.name} 最活跃 · ${hottest.planeCount} 架`;
      }
    },
    onShow() {
      this.loadHome();
    },
    methods: {
      normalizePhase(value, duration) {
        const mod = value % duration;
        return mod < 0 ? mod + duration : mod;
      },
      getNegativeAnimationDelay(nowSec, offsetSec, durationSec) {
        return -this.normalizePhase(nowSec - offsetSec, durationSec);
      },
      getNegativeMotionBegin(nowSec, offsetSec, durationSec) {
        return `${this.getNegativeAnimationDelay(nowSec, offsetSec, durationSec)}s`;
      },
      createRoutePath(from, to, index) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.hypot(dx, dy) || 1;
        const normalX = -dy / distance;
        const normalY = dx / distance;
        const bend = Math.min(16, 8 + distance * 0.12) * (index % 2 === 0 ? 1 : -1);
        const c1x = from.x + dx * 0.32 + normalX * bend;
        const c1y = from.y + dy * 0.18 + normalY * bend;
        const c2x = from.x + dx * 0.68 + normalX * bend;
        const c2y = from.y + dy * 0.82 + normalY * bend;
        return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
      },
      async loadHome() {
        await fetchLocations();
        try {
          this.trending = await getTrendingPlanes();
        } catch (error) {
          this.trending = [];
        }
      },
      handleToggleTheme() {
        toggleTheme();
      },
      goThrow() {
        uni.reLaunch({
          url: "/pages/throw/index"
        });
      },
      goTrending() {
        uni.reLaunch({
          url: "/pages/trending/index"
        });
      },
      goDiscover(name) {
        setCurrentLocation(name);
        uni.reLaunch({
          url: "/pages/discover/index"
        });
      },
      openDetail(id) {
        this.openPlaneDetail(id);
      },
      async handleRandom() {
        if (this.randomLoading)
          return;
        this.randomLoading = true;
        try {
          const plane = await getRandomPlane();
          this.openDetail(plane.id);
        } catch (error) {
          uni.showToast({
            title: error.message || "暂无飞机可拾取",
            icon: "none"
          });
        } finally {
          this.randomLoading = false;
        }
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_shatter_headline = vue.resolveComponent("shatter-headline");
    const _component_detail_open_transition = vue.resolveComponent("detail-open-transition");
    const _component_page_transition = vue.resolveComponent("page-transition");
    const _component_app_tabbar = vue.resolveComponent("app-tabbar");
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "with-tabbar", "home-page", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "hero glass-card" }, [
          vue.createElementVNode("view", { class: "hero-top" }, [
            vue.createElementVNode("view", { class: "brand" }, [
              vue.createElementVNode("text", { class: "brand-mark" }, "✈"),
              vue.createElementVNode("text", { class: "brand-name" }, "纸飞机降落点")
            ]),
            vue.createElementVNode("view", {
              class: "icon-btn",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.handleToggleTheme && $options.handleToggleTheme(...args))
            }, [
              vue.createElementVNode(
                "text",
                { class: "toggle-icon" },
                vue.toDisplayString($options.isDark ? "☾" : "☀"),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "hero-title" }, [
            vue.createVNode(_component_shatter_headline, { phrases: $data.headlinePhrases }, null, 8, ["phrases"])
          ]),
          vue.createElementVNode("text", { class: "hero-desc" }, "在真实地点留下匿名回声，让某个未来的你刚好拾起它。"),
          vue.createElementVNode("view", { class: "hero-actions" }, [
            vue.createElementVNode("view", {
              class: "primary-pill",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.goThrow && $options.goThrow(...args))
            }, [
              vue.createElementVNode("text", null, "投掷一架")
            ]),
            vue.createElementVNode("view", {
              class: "ghost-pill",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.handleRandom && $options.handleRandom(...args))
            }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($data.randomLoading ? "正在挑选" : "随机拾取"),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "hero-metrics" }, [
            vue.createElementVNode("view", { class: "metric-card" }, [
              vue.createElementVNode(
                "text",
                { class: "metric-num" },
                vue.toDisplayString($options.totalPlanes),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "metric-label" }, "飞行中")
            ]),
            vue.createElementVNode("view", { class: "metric-card" }, [
              vue.createElementVNode(
                "text",
                { class: "metric-num" },
                vue.toDisplayString($options.locations.length),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "metric-label" }, "降落点")
            ]),
            vue.createElementVNode("view", { class: "metric-card" }, [
              vue.createElementVNode(
                "text",
                { class: "metric-num" },
                vue.toDisplayString($options.topTrending.length),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "metric-label" }, "热度上升")
            ])
          ]),
          vue.createElementVNode("view", { class: "search-box" }, [
            vue.createElementVNode("text", { class: "search-icon" }, "⌕"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.query = $event),
                class: "search-input",
                placeholder: "搜索地点",
                "placeholder-class": "placeholder-text"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $data.query]
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", { class: "section-heading" }, "落点地图")
        ]),
        vue.createElementVNode("view", { class: "glass-card map-shell" }, [
          vue.createElementVNode("view", { class: "map-header" }, [
            vue.createElementVNode("view", null, [
              vue.createElementVNode("text", { class: "map-title" }, "校园信号"),
              vue.createElementVNode("text", { class: "map-subtitle" }, "选择一个地点启动扫描")
            ]),
            vue.createElementVNode("view", { class: "map-tags" }, [
              vue.createElementVNode("text", { class: "map-tag" }, "实时"),
              vue.createElementVNode("text", { class: "map-tag" }, "匿名"),
              vue.createElementVNode("text", { class: "map-tag" }, "校园")
            ])
          ]),
          vue.createElementVNode("view", { class: "map-canvas" }, [
            vue.createElementVNode("view", { class: "signal-orbit orbit-a" }),
            vue.createElementVNode("view", { class: "signal-orbit orbit-b" }),
            (vue.openBlock(), vue.createElementBlock("svg", {
              class: "signal-network",
              viewBox: "0 0 100 100",
              preserveAspectRatio: "none",
              "aria-hidden": "true"
            }, [
              vue.createElementVNode("defs", null, [
                vue.createElementVNode("linearGradient", {
                  id: "routeGradient",
                  x1: "0%",
                  y1: "0%",
                  x2: "100%",
                  y2: "100%"
                }, [
                  vue.createElementVNode("stop", {
                    offset: "0%",
                    "stop-color": "rgba(47, 158, 116, 0.15)"
                  }),
                  vue.createElementVNode("stop", {
                    offset: "45%",
                    "stop-color": "rgba(47, 158, 116, 0.95)"
                  }),
                  vue.createElementVNode("stop", {
                    offset: "100%",
                    "stop-color": "rgba(242, 122, 75, 0.95)"
                  })
                ]),
                vue.createElementVNode("filter", {
                  id: "routeGlow",
                  x: "-50%",
                  y: "-50%",
                  width: "200%",
                  height: "200%"
                }, [
                  vue.createElementVNode("feGaussianBlur", {
                    stdDeviation: "1.2",
                    result: "blur"
                  }),
                  vue.createElementVNode("feMerge", null, [
                    vue.createElementVNode("feMergeNode", { in: "blur" }),
                    vue.createElementVNode("feMergeNode", { in: "SourceGraphic" })
                  ])
                ])
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($options.signalRoutes, (route) => {
                  return vue.openBlock(), vue.createElementBlock("path", {
                    key: `route-base-${route.id}`,
                    class: "route-line",
                    d: route.path,
                    style: vue.normalizeStyle({
                      "--route-width": route.width,
                      "--route-opacity": route.opacity
                    })
                  }, null, 12, ["d"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($options.signalRoutes, (route) => {
                  return vue.openBlock(), vue.createElementBlock("path", {
                    key: `route-glow-${route.id}`,
                    class: "route-glow",
                    d: route.path,
                    style: vue.normalizeStyle({
                      "--route-width": route.width,
                      "--route-duration": `${route.duration}s`,
                      "--route-delay": `${route.glowDelay}s`
                    })
                  }, null, 12, ["d"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($options.signalRoutes, (route) => {
                  return vue.openBlock(), vue.createElementBlock("g", {
                    key: `route-packet-${route.id}`
                  }, [
                    vue.createElementVNode("circle", {
                      class: "route-packet",
                      r: route.packetSize
                    }, [
                      vue.createElementVNode("animateMotion", {
                        dur: `${route.duration}s`,
                        begin: route.packetBegin,
                        repeatCount: "indefinite",
                        path: route.path
                      }, null, 8, ["dur", "begin", "path"])
                    ], 8, ["r"]),
                    vue.createElementVNode("circle", {
                      class: "route-packet secondary",
                      r: route.packetSize * 0.72
                    }, [
                      vue.createElementVNode("animateMotion", {
                        dur: `${route.duration}s`,
                        begin: route.secondaryPacketBegin,
                        repeatCount: "indefinite",
                        path: route.path
                      }, null, 8, ["dur", "begin", "path"])
                    ], 8, ["r"])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])),
            vue.createElementVNode("view", { class: "signal-hud" }, [
              vue.createElementVNode("view", { class: "hud-top" }, [
                vue.createElementVNode("text", { class: "hud-kicker" }, "匿名信号网"),
                vue.createElementVNode(
                  "text",
                  { class: "hud-value" },
                  vue.toDisplayString($options.totalPlanes),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "hud-caption" },
                vue.toDisplayString($options.busiestLocationLabel),
                1
                /* TEXT */
              )
            ]),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.mapNodes, (node, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: node.loc.id,
                  class: "map-station",
                  style: vue.normalizeStyle({
                    "--x": `${node.x}%`,
                    "--y": `${node.y}%`,
                    "--halo": `${node.size}px`,
                    "--delay": `${node.delay}s`,
                    "--label-shift": node.labelShift
                  }),
                  onClick: ($event) => $options.goDiscover(node.loc.name)
                }, [
                  vue.createElementVNode("view", { class: "station-halo" }),
                  vue.createElementVNode("view", { class: "station-core" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "station-core-icon" },
                      vue.toDisplayString($data.iconMap[node.loc.name] || "📍"),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "station-label" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "station-name" },
                      vue.toDisplayString(node.loc.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "station-count" },
                      vue.toDisplayString(node.loc.planeCount) + " 架",
                      1
                      /* TEXT */
                    )
                  ])
                ], 12, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        $options.topTrending.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "trend-section"
        }, [
          vue.createElementVNode("view", { class: "section-title" }, [
            vue.createElementVNode("text", { class: "section-heading" }, "热度上升"),
            vue.createElementVNode("text", {
              class: "section-link",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.goTrending && $options.goTrending(...args))
            }, "查看更多")
          ]),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($options.topTrending, (plane, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: plane.id,
                class: "glass-card trend-card",
                onClick: ($event) => $options.openDetail(plane.id)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "trend-rank" },
                  "#" + vue.toDisplayString(index + 1),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "trend-content" },
                  vue.toDisplayString(plane.content),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "trend-meta" },
                  "📍 " + vue.toDisplayString(plane.locationTag) + " · " + vue.toDisplayString(plane.likeCount) + " 赞",
                  1
                  /* TEXT */
                )
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : vue.createCommentVNode("v-if", true),
        vue.createVNode(_component_detail_open_transition, {
          visible: _ctx.detailOpenVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_page_transition, {
          visible: _ctx.pageTransitionVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_app_tabbar, {
          active: "home",
          theme: $data.appState.theme
        }, null, 8, ["theme"])
      ],
      2
      /* CLASS */
    );
  }
  const PagesHomeIndex = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-4978fed5"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/home/index.vue"]]);
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
  const _sfc_main$7 = {
    mixins: [pageTransitionMixin, detailOpenTransitionMixin],
    components: {
      AppTabbar,
      DetailOpenTransition,
      PageTransition
    },
    data() {
      return {
        appState,
        planes: [],
        loading: false,
        query: "",
        searchOpened: false,
        backIcon: "‹",
        searchIcon: "⌕",
        pinIcon: "⌖",
        cardPalette: [
          {
            base: "rgba(250, 247, 238, 0.98)",
            wash: "rgba(194, 220, 255, 0.26)",
            glow: "rgba(255, 255, 255, 0.92)",
            rule: "rgba(129, 150, 176, 0.12)",
            tape: "rgba(245, 232, 198, 0.82)"
          },
          {
            base: "rgba(255, 246, 241, 0.98)",
            wash: "rgba(255, 214, 194, 0.24)",
            glow: "rgba(255, 255, 255, 0.94)",
            rule: "rgba(179, 145, 131, 0.12)",
            tape: "rgba(247, 226, 205, 0.82)"
          },
          {
            base: "rgba(244, 251, 241, 0.98)",
            wash: "rgba(185, 235, 202, 0.24)",
            glow: "rgba(255, 255, 255, 0.94)",
            rule: "rgba(120, 161, 132, 0.12)",
            tape: "rgba(231, 236, 201, 0.84)"
          },
          {
            base: "rgba(250, 244, 252, 0.98)",
            wash: "rgba(229, 204, 245, 0.24)",
            glow: "rgba(255, 255, 255, 0.94)",
            rule: "rgba(157, 137, 171, 0.12)",
            tape: "rgba(240, 226, 210, 0.8)"
          }
        ]
      };
    },
    computed: {
      themeClass() {
        return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
      },
      filteredPlanes() {
        const keyword = this.query.trim().toLowerCase();
        if (!keyword)
          return this.planes;
        return this.planes.filter((item) => {
          return item.content.toLowerCase().includes(keyword) || item.locationTag.toLowerCase().includes(keyword);
        });
      }
    },
    async onShow() {
      await fetchLocations();
      this.loadPlanes();
    },
    methods: {
      getPlaneMood(plane) {
        return getMoodMeta(plane.mood);
      },
      getNoteItemStyle(index, seedSource, mood) {
        return {
          ...this.getNoteStyle(index, seedSource),
          ...this.getCardStyle(index, mood)
        };
      },
      getSeedNumber(seedSource) {
        const input = String(seedSource || "");
        let hash = 0;
        for (let index = 0; index < input.length; index += 1) {
          hash = (hash * 31 + input.charCodeAt(index)) % 1000003;
        }
        return hash;
      },
      getNoteStyle(index, seedSource) {
        const hash = this.getSeedNumber(`${seedSource}-${index}`);
        const baseOffset = [0, 20, 10, 30][index % 4];
        const extraOffset = hash % 12;
        const tiltBase = hash % 440 / 100 - 2.2;
        const tilt = tiltBase >= 0 ? Math.max(tiltBase, 0.35) : Math.min(tiltBase, -0.35);
        const shift = (Math.floor(hash / 17) % 16 - 8) * 1.2;
        const stackAOffsetX = -(3 + hash % 4);
        const stackAOffsetY = 5 + hash % 4;
        const stackBOffsetX = 3 + (hash >> 3) % 4;
        const stackBOffsetY = 10 + (hash >> 5) % 4;
        const stackARotate = tilt - (0.18 + (hash >> 2) % 14 / 100);
        const stackBRotate = tilt + (0.24 + (hash >> 4) % 14 / 100);
        return {
          "--note-offset": `${baseOffset + extraOffset}rpx`,
          "--note-tilt": `${tilt.toFixed(2)}deg`,
          "--note-shift": `${shift.toFixed(1)}rpx`,
          "--stack-a-x": `${stackAOffsetX}rpx`,
          "--stack-a-y": `${stackAOffsetY}rpx`,
          "--stack-b-x": `${stackBOffsetX}rpx`,
          "--stack-b-y": `${stackBOffsetY}rpx`,
          "--stack-a-rotate": `${stackARotate.toFixed(2)}deg`,
          "--stack-b-rotate": `${stackBRotate.toFixed(2)}deg`
        };
      },
      getCardStyle(index, mood) {
        const palette = this.cardPalette[index % this.cardPalette.length];
        const moodMeta = getMoodMeta(mood);
        const hash = this.getSeedNumber(`${mood}-${index}`);
        const leftTilt = (hash % 180 / 30 - 3).toFixed(2);
        const rightTilt = ((hash >> 3) % 180 / 30 - 3).toFixed(2);
        const leftOffset = 24 + hash % 16;
        const rightOffset = 22 + (hash >> 4) % 16;
        return {
          "--paper-base": palette.base,
          "--paper-wash": palette.wash,
          "--paper-glow": palette.glow,
          "--paper-rule": palette.rule,
          "--paper-tape": palette.tape,
          "--paper-border": `${moodMeta.color}20`,
          "--paper-shadow": `${moodMeta.color}12`,
          "--stack-base": palette.base,
          "--stack-border": `${moodMeta.color}16`,
          "--tape-left-tilt": `${leftTilt}deg`,
          "--tape-right-tilt": `${rightTilt}deg`,
          "--tape-left-offset": `${leftOffset}rpx`,
          "--tape-right-offset": `${rightOffset}rpx`
        };
      },
      async loadPlanes() {
        this.loading = true;
        try {
          const data = await getPlanes();
          this.planes = data;
        } catch (error) {
          this.planes = [];
          uni.showToast({
            title: error.message || "加载失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      formatPlaneTime(time) {
        return timeAgo(time);
      },
      goBack() {
        uni.navigateBack({
          fail: () => {
            uni.reLaunch({
              url: "/pages/home/index"
            });
          }
        });
      },
      toggleSearch() {
        this.searchOpened = !this.searchOpened;
      },
      openDetail(plane) {
        this.openPlaneDetail(plane.id);
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_detail_open_transition = vue.resolveComponent("detail-open-transition");
    const _component_page_transition = vue.resolveComponent("page-transition");
    const _component_app_tabbar = vue.resolveComponent("app-tabbar");
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "with-tabbar", "discover-page", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "top-nav" }, [
          vue.createElementVNode("view", {
            class: "nav-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "nav-icon" },
              vue.toDisplayString($data.backIcon),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("text", { class: "nav-title" }, "全校雷达"),
          vue.createElementVNode("view", {
            class: "nav-btn",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.toggleSearch && $options.toggleSearch(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "nav-icon" },
              vue.toDisplayString($data.searchIcon),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "content-area" }, [
          $data.searchOpened ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "search-panel"
          }, [
            vue.createElementVNode("view", { class: "search-box" }, [
              vue.createElementVNode(
                "text",
                { class: "search-box-icon" },
                vue.toDisplayString($data.searchIcon),
                1
                /* TEXT */
              ),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.query = $event),
                  class: "search-input",
                  placeholder: "搜索纸飞机内容或降落点",
                  "placeholder-class": "placeholder-text"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $data.query]
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "banner-card" }, [
            vue.createElementVNode(
              "text",
              { class: "banner-pin" },
              vue.toDisplayString($data.pinIcon),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "banner-title" }, "正在探索所有降落点"),
            vue.createElementVNode(
              "text",
              { class: "banner-subtitle" },
              "共发现 " + vue.toDisplayString($data.planes.length) + " 架纸飞机在风中盘旋",
              1
              /* TEXT */
            )
          ]),
          $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "note-grid"
          }, [
            (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(4, (index) => {
                return vue.createElementVNode(
                  "view",
                  {
                    key: `skeleton-${index}`,
                    class: "note-item",
                    style: vue.normalizeStyle($options.getNoteItemStyle(index - 1, `skeleton-${index}`, "calm"))
                  },
                  [
                    vue.createElementVNode("view", { class: "stack-sheet stack-sheet-a" }),
                    vue.createElementVNode("view", { class: "stack-sheet stack-sheet-b" }),
                    vue.createElementVNode("view", {
                      class: vue.normalizeClass(["plane-card", "plane-skeleton"])
                    }, [
                      vue.createElementVNode("view", { class: "note-clip" }, [
                        (vue.openBlock(), vue.createElementBlock("svg", {
                          class: "note-clip-svg",
                          viewBox: "0 0 48 96",
                          "aria-hidden": "true"
                        }, [
                          vue.createElementVNode("path", {
                            class: "clip-shadow",
                            d: "M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37"
                          }),
                          vue.createElementVNode("path", {
                            class: "clip-main",
                            d: "M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34"
                          }),
                          vue.createElementVNode("path", {
                            class: "clip-inner-line",
                            d: "M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87"
                          })
                        ]))
                      ]),
                      vue.createElementVNode("view", { class: "note-tape tape-left" }),
                      vue.createElementVNode("view", { class: "note-tape tape-right" }),
                      vue.createElementVNode("view", { class: "paper-grain" }),
                      vue.createElementVNode("view", { class: "paper-lines" }),
                      vue.createElementVNode("view", { class: "plane-card-inner" }, [
                        vue.createElementVNode("view", { class: "skeleton-top" }, [
                          vue.createElementVNode("view", { class: "skeleton-icon" }),
                          vue.createElementVNode("view", { class: "skeleton-time" })
                        ]),
                        vue.createElementVNode("view", { class: "skeleton-line short" }),
                        vue.createElementVNode("view", { class: "skeleton-line" }),
                        vue.createElementVNode("view", { class: "skeleton-line" }),
                        vue.createElementVNode("view", { class: "skeleton-footer" }, [
                          vue.createElementVNode("view", { class: "skeleton-tag" }),
                          vue.createElementVNode("view", { class: "skeleton-meta" })
                        ])
                      ]),
                      vue.createElementVNode("view", { class: "paper-corner" })
                    ])
                  ],
                  4
                  /* STYLE */
                );
              }),
              64
              /* STABLE_FRAGMENT */
            ))
          ])) : $options.filteredPlanes.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "note-grid"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.filteredPlanes, (plane, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: plane.id,
                    class: "note-item",
                    style: vue.normalizeStyle($options.getNoteItemStyle(index, plane.id, plane.mood))
                  },
                  [
                    vue.createElementVNode("view", { class: "stack-sheet stack-sheet-a" }),
                    vue.createElementVNode("view", { class: "stack-sheet stack-sheet-b" }),
                    vue.createElementVNode("view", {
                      class: "plane-card",
                      onClick: ($event) => $options.openDetail(plane)
                    }, [
                      vue.createElementVNode("view", { class: "note-clip" }, [
                        (vue.openBlock(), vue.createElementBlock("svg", {
                          class: "note-clip-svg",
                          viewBox: "0 0 48 96",
                          "aria-hidden": "true"
                        }, [
                          vue.createElementVNode("path", {
                            class: "clip-shadow",
                            d: "M29 7 C17 7 11 17 11 28 V67 C11 82 20 91 31 91 C41 91 48 82 48 69 V30 C48 17 40 10 31 10 C22 10 16 17 16 28 V64 C16 74 21 81 29 81 C37 81 42 75 42 67 V37"
                          }),
                          vue.createElementVNode("path", {
                            class: "clip-main",
                            d: "M27 5 C15 5 9 16 9 27 V66 C9 82 19 92 31 92 C43 92 50 82 50 68 V28 C50 14 41 8 30 8 C19 8 13 16 13 27 V64 C13 76 20 84 30 84 C40 84 46 77 46 67 V34"
                          }),
                          vue.createElementVNode("path", {
                            class: "clip-inner-line",
                            d: "M22 10 C14 10 10 18 10 28 V64 C10 77 18 86 28 87"
                          })
                        ]))
                      ]),
                      vue.createElementVNode("view", { class: "note-tape tape-left" }),
                      vue.createElementVNode("view", { class: "note-tape tape-right" }),
                      vue.createElementVNode("view", { class: "paper-grain" }),
                      vue.createElementVNode("view", { class: "paper-lines" }),
                      vue.createElementVNode("view", { class: "plane-card-inner" }, [
                        vue.createElementVNode("view", { class: "plane-card-top" }, [
                          vue.createElementVNode(
                            "view",
                            {
                              class: "plane-mood-icon",
                              style: vue.normalizeStyle({ color: $options.getPlaneMood(plane).color })
                            },
                            [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString($options.getPlaneMood(plane).icon),
                                1
                                /* TEXT */
                              )
                            ],
                            4
                            /* STYLE */
                          ),
                          vue.createElementVNode("view", { class: "plane-time-chip" }, [
                            vue.createElementVNode(
                              "text",
                              null,
                              vue.toDisplayString($options.formatPlaneTime(plane.createTime)),
                              1
                              /* TEXT */
                            )
                          ])
                        ]),
                        vue.createElementVNode(
                          "text",
                          { class: "plane-text" },
                          vue.toDisplayString(plane.content),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("view", { class: "plane-footer" }, [
                          vue.createElementVNode(
                            "view",
                            {
                              class: "plane-mood-tag",
                              style: vue.normalizeStyle({ color: $options.getPlaneMood(plane).color })
                            },
                            [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString($options.getPlaneMood(plane).label),
                                1
                                /* TEXT */
                              )
                            ],
                            4
                            /* STYLE */
                          ),
                          vue.createElementVNode("view", { class: "plane-location" }, [
                            vue.createElementVNode(
                              "text",
                              null,
                              "📍 " + vue.toDisplayString(plane.locationTag),
                              1
                              /* TEXT */
                            )
                          ])
                        ])
                      ]),
                      vue.createElementVNode("view", { class: "paper-corner" })
                    ], 8, ["onClick"])
                  ],
                  4
                  /* STYLE */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 3,
            class: "glass-card empty-card custom-empty"
          }, [
            vue.createElementVNode("text", { class: "empty-title" }, "还没有搜索到纸飞机"),
            vue.createElementVNode("text", { class: "empty-desc" }, "试试换个关键词，或者稍后再来雷达里看看。")
          ]))
        ]),
        vue.createVNode(_component_detail_open_transition, {
          visible: _ctx.detailOpenVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_page_transition, {
          visible: _ctx.pageTransitionVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_app_tabbar, {
          active: "discover",
          theme: $data.appState.theme
        }, null, 8, ["theme"])
      ],
      2
      /* CLASS */
    );
  }
  const PagesDiscoverIndex = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-157e4766"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/discover/index.vue"]]);
  const _sfc_main$6 = {
    mixins: [pageTransitionMixin],
    components: {
      AppTabbar,
      PageTransition
    },
    data() {
      return {
        appState,
        moodOptions,
        expireOptions,
        content: "",
        mood: "calm",
        location: "",
        expireHours: 24,
        loading: false,
        flyAnim: false
      };
    },
    computed: {
      themeClass() {
        return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
      },
      locations() {
        return this.appState.locations || [];
      },
      wordCount() {
        return (this.content || "").length;
      },
      currentMoodLabel() {
        const current = this.moodOptions.find((item) => item.value === this.mood);
        return current ? current.text : "平静";
      },
      expireLabel() {
        const current = this.expireOptions.find((item) => item.value === this.expireHours);
        return current ? current.text : "24小时";
      }
    },
    async onShow() {
      await fetchLocations();
      if (this.appState.currentLocation) {
        this.location = this.appState.currentLocation;
      }
    },
    methods: {
      selectMood(item) {
        this.mood = item.value;
      },
      selectExpire(item) {
        this.expireHours = item.value;
      },
      async handleThrow() {
        if (this.loading)
          return;
        if (!this.content.trim()) {
          uni.showToast({
            title: "请写点什么吧",
            icon: "none"
          });
          return;
        }
        if (!this.location) {
          uni.showToast({
            title: "请选择地点",
            icon: "none"
          });
          return;
        }
        this.loading = true;
        try {
          const plane = await throwPlane({
            locationTag: this.location,
            content: this.content.trim(),
            mood: this.mood,
            expireHours: this.expireHours
          });
          saveMyPlaneId(plane.id);
          setCurrentLocation(this.location);
          this.flyAnim = true;
          uni.showToast({
            title: "纸飞机已飞出",
            icon: "success"
          });
          setTimeout(() => {
            this.flyAnim = false;
            this.content = "";
            uni.reLaunch({
              url: "/pages/home/index"
            });
          }, 650);
        } catch (error) {
          uni.showToast({
            title: error.message || "投掷失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_page_transition = vue.resolveComponent("page-transition");
    const _component_app_tabbar = vue.resolveComponent("app-tabbar");
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "with-tabbar", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "glass-card hero-card" }, [
          vue.createElementVNode("text", { class: "hero-title" }, "写下你的心绪"),
          vue.createElementVNode("text", { class: "hero-desc" }, "内容最多 200 字，匿名投掷到一个地点。")
        ]),
        vue.createElementVNode("view", { class: "glass-card editor-card" }, [
          vue.withDirectives(vue.createElementVNode(
            "textarea",
            {
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.content = $event),
              class: "editor",
              maxlength: "200",
              placeholder: "写下你想说的话...",
              "placeholder-class": "placeholder-text"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $data.content]
          ]),
          vue.createElementVNode(
            "text",
            { class: "word-count" },
            vue.toDisplayString($options.wordCount) + "/200",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", { class: "section-heading" }, "选择情绪"),
          vue.createElementVNode(
            "text",
            { class: "section-note" },
            vue.toDisplayString($options.currentMoodLabel),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "mood-grid" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.moodOptions, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.value,
                class: vue.normalizeClass(["mood-card", { active: $data.mood === item.value }]),
                onClick: ($event) => $options.selectMood(item)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "mood-icon" },
                  vue.toDisplayString(item.icon),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "mood-text" },
                  vue.toDisplayString(item.text),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", { class: "section-heading" }, "选择地点"),
          vue.createElementVNode(
            "text",
            { class: "section-note" },
            vue.toDisplayString($data.location || "请先选择"),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "location-grid" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($options.locations, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: vue.normalizeClass(["chip", { active: $data.location === item.name }]),
                onClick: ($event) => $data.location = item.name
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(item.name),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", { class: "section-heading" }, "飞行时效"),
          vue.createElementVNode(
            "text",
            { class: "section-note" },
            vue.toDisplayString($options.expireLabel),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "expire-row" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.expireOptions, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.value,
                class: vue.normalizeClass(["chip", { active: $data.expireHours === item.value }]),
                onClick: ($event) => $options.selectExpire(item)
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(item.text),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["submit-btn", { flying: $data.flyAnim, loading: $data.loading }]),
            onClick: _cache[1] || (_cache[1] = (...args) => $options.handleThrow && $options.handleThrow(...args))
          },
          [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.loading ? "正在起飞..." : "投掷纸飞机"),
              1
              /* TEXT */
            )
          ],
          2
          /* CLASS */
        ),
        vue.createVNode(_component_page_transition, {
          visible: _ctx.pageTransitionVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_app_tabbar, {
          active: "throw",
          theme: $data.appState.theme
        }, null, 8, ["theme"])
      ],
      2
      /* CLASS */
    );
  }
  const PagesThrowIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-c19b2228"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/throw/index.vue"]]);
  const _sfc_main$5 = {
    props: {
      mood: {
        type: String,
        default: "calm"
      }
    },
    computed: {
      meta() {
        return getMoodMeta(this.mood);
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "mood-tag",
        style: vue.normalizeStyle({ borderColor: $options.meta.color, color: $options.meta.color })
      },
      [
        vue.createElementVNode(
          "text",
          { class: "mood-icon" },
          vue.toDisplayString($options.meta.icon),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "mood-text" },
          vue.toDisplayString($options.meta.label),
          1
          /* TEXT */
        )
      ],
      4
      /* STYLE */
    );
  }
  const MoodTag = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-a2ea2a7e"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/MoodTag.vue"]]);
  const _sfc_main$4 = {
    components: {
      MoodTag
    },
    props: {
      plane: {
        type: Object,
        required: true
      },
      rank: {
        type: Number,
        default: 0
      }
    },
    computed: {
      timeText() {
        return timeAgo(this.plane.createTime);
      },
      remainText() {
        return getRemainingShort(this.plane.expireTime);
      }
    },
    methods: {
      handleSelect() {
        this.$emit("select", this.plane);
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_mood_tag = vue.resolveComponent("mood-tag");
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "plane-card glass-card",
      onClick: _cache[0] || (_cache[0] = (...args) => $options.handleSelect && $options.handleSelect(...args))
    }, [
      vue.createElementVNode("view", { class: "card-header" }, [
        vue.createElementVNode("view", { class: "header-left" }, [
          $props.rank ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass(["rank-badge", { top: $props.rank <= 3 }])
            },
            [
              vue.createElementVNode(
                "text",
                null,
                "#" + vue.toDisplayString($props.rank),
                1
                /* TEXT */
              )
            ],
            2
            /* CLASS */
          )) : vue.createCommentVNode("v-if", true),
          vue.createVNode(_component_mood_tag, {
            mood: $props.plane.mood
          }, null, 8, ["mood"]),
          vue.createElementVNode(
            "text",
            { class: "location" },
            "📍 " + vue.toDisplayString($props.plane.locationTag),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode(
          "text",
          { class: "time" },
          vue.toDisplayString($options.timeText),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "card-content" }, [
        vue.createElementVNode(
          "text",
          { class: "content-text" },
          vue.toDisplayString($props.plane.content),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "card-footer" }, [
        vue.createElementVNode(
          "text",
          null,
          "拾取 " + vue.toDisplayString($props.plane.pickCount),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          null,
          "点赞 " + vue.toDisplayString($props.plane.likeCount),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          null,
          "评论 " + vue.toDisplayString($props.plane.commentCount),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "countdown" },
          vue.toDisplayString($options.remainText),
          1
          /* TEXT */
        )
      ])
    ]);
  }
  const PlaneCard = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-c98ee2ae"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/components/PlaneCard.vue"]]);
  const _sfc_main$3 = {
    mixins: [pageTransitionMixin, detailOpenTransitionMixin],
    components: {
      AppTabbar,
      DetailOpenTransition,
      PageTransition,
      PlaneCard
    },
    data() {
      return {
        appState,
        planes: [],
        loading: false
      };
    },
    computed: {
      themeClass() {
        return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
      }
    },
    onShow() {
      this.loadTrending();
    },
    methods: {
      async loadTrending() {
        this.loading = true;
        try {
          this.planes = await getTrendingPlanes();
        } catch (error) {
          uni.showToast({
            title: error.message || "加载失败",
            icon: "none"
          });
          this.planes = [];
        } finally {
          this.loading = false;
        }
      },
      openDetail(plane) {
        this.openPlaneDetail(plane.id);
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_plane_card = vue.resolveComponent("plane-card");
    const _component_detail_open_transition = vue.resolveComponent("detail-open-transition");
    const _component_page_transition = vue.resolveComponent("page-transition");
    const _component_app_tabbar = vue.resolveComponent("app-tabbar");
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "with-tabbar", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "glass-card trend-hero" }, [
          vue.createElementVNode("text", { class: "hero-title" }, "今日热门"),
          vue.createElementVNode("text", { class: "hero-subtitle" }, "根据点赞与拾取实时更新"),
          vue.createElementVNode(
            "text",
            { class: "hero-count" },
            vue.toDisplayString($data.planes.length) + " 架在热榜",
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "action-row" }, [
          vue.createElementVNode("view", {
            class: "ghost-pill refresh-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.loadTrending && $options.loadTrending(...args))
          }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.loading ? "刷新中..." : "刷新热榜"),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "plane-list" }, [
          $data.loading && !$data.planes.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "glass-card empty-card"
          }, [
            vue.createElementVNode("text", { class: "empty-title" }, "热榜生成中"),
            vue.createElementVNode("text", { class: "empty-desc" }, "正在整理最受欢迎的纸飞机。")
          ])) : !$data.planes.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "glass-card empty-card"
          }, [
            vue.createElementVNode("text", { class: "empty-title" }, "暂无热门飞机"),
            vue.createElementVNode("text", { class: "empty-desc" }, "等第一批点赞和拾取出现后，这里会热起来。")
          ])) : vue.createCommentVNode("v-if", true),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.planes, (plane, index) => {
              return vue.openBlock(), vue.createBlock(_component_plane_card, {
                key: plane.id,
                plane,
                rank: index + 1,
                onSelect: $options.openDetail
              }, null, 8, ["plane", "rank", "onSelect"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createVNode(_component_detail_open_transition, {
          visible: _ctx.detailOpenVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_page_transition, {
          visible: _ctx.pageTransitionVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_app_tabbar, {
          active: "trending",
          theme: $data.appState.theme
        }, null, 8, ["theme"])
      ],
      2
      /* CLASS */
    );
  }
  const PagesTrendingIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-eeab9fab"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/trending/index.vue"]]);
  const _sfc_main$2 = {
    mixins: [pageTransitionMixin, detailOpenTransitionMixin],
    components: {
      AppTabbar,
      DetailOpenTransition,
      MoodTag,
      PageTransition
    },
    data() {
      return {
        appState,
        myPlanes: [],
        loading: false
      };
    },
    computed: {
      themeClass() {
        return this.appState.theme === "dark" ? "theme-dark" : "theme-light";
      },
      totalLikes() {
        return this.myPlanes.reduce((sum, item) => sum + (item.likeCount || 0), 0);
      },
      totalComments() {
        return this.myPlanes.reduce((sum, item) => sum + (item.commentCount || 0), 0);
      }
    },
    onShow() {
      this.loadMyPlanes();
    },
    methods: {
      isExpiredPlane(plane) {
        return isExpired(plane.expireTime);
      },
      async loadMyPlanes() {
        this.loading = true;
        try {
          const ids = getMyPlaneIds();
          if (!ids.length) {
            this.myPlanes = [];
            return;
          }
          this.myPlanes = await getMyPlanes(ids);
        } catch (error) {
          uni.showToast({
            title: error.message || "加载失败",
            icon: "none"
          });
          this.myPlanes = [];
        } finally {
          this.loading = false;
        }
      },
      openDetail(id) {
        this.openPlaneDetail(id);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_mood_tag = vue.resolveComponent("mood-tag");
    const _component_detail_open_transition = vue.resolveComponent("detail-open-transition");
    const _component_page_transition = vue.resolveComponent("page-transition");
    const _component_app_tabbar = vue.resolveComponent("app-tabbar");
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "with-tabbar", $options.themeClass])
      },
      [
        vue.createElementVNode("view", { class: "glass-card profile-card" }, [
          vue.createElementVNode("view", { class: "avatar" }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($data.appState.profileName.slice(0, 1)),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "profile-info" }, [
            vue.createElementVNode(
              "text",
              { class: "profile-name" },
              vue.toDisplayString($data.appState.profileName),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "profile-subtitle" }, "用于不匿名评论的本地昵称")
          ]),
          vue.createElementVNode("view", { class: "profile-tag" }, [
            vue.createElementVNode("text", null, "本地昵称")
          ])
        ]),
        vue.createElementVNode("view", { class: "stats-grid" }, [
          vue.createElementVNode("view", { class: "stat-card" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-num" },
              vue.toDisplayString($data.myPlanes.length),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "投掷数")
          ]),
          vue.createElementVNode("view", { class: "stat-card" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-num" },
              vue.toDisplayString($options.totalLikes),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "总获赞")
          ]),
          vue.createElementVNode("view", { class: "stat-card" }, [
            vue.createElementVNode(
              "text",
              { class: "stat-num" },
              vue.toDisplayString($options.totalComments),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "stat-label" }, "总评论")
          ])
        ]),
        vue.createElementVNode("view", { class: "section-title" }, [
          vue.createElementVNode("text", { class: "section-heading" }, "我的飞机"),
          vue.createElementVNode(
            "text",
            { class: "section-note" },
            vue.toDisplayString($data.myPlanes.length) + " 架",
            1
            /* TEXT */
          )
        ]),
        $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "glass-card empty-card"
        }, [
          vue.createElementVNode("text", { class: "empty-title" }, "正在整理档案"),
          vue.createElementVNode("text", { class: "empty-desc" }, "马上就把你的纸飞机记录取出来。")
        ])) : !$data.myPlanes.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "glass-card empty-card"
        }, [
          vue.createElementVNode("text", { class: "empty-title" }, "你还没有投掷过飞机"),
          vue.createElementVNode("text", { class: "empty-desc" }, "去写下一句想说的话，让它飞向校园的某个角落。")
        ])) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.myPlanes, (plane) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: plane.id,
              class: "glass-card my-plane-card",
              onClick: ($event) => $options.openDetail(plane.id)
            }, [
              vue.createElementVNode("view", { class: "card-top" }, [
                vue.createVNode(_component_mood_tag, {
                  mood: plane.mood
                }, null, 8, ["mood"]),
                vue.createElementVNode(
                  "text",
                  { class: "location" },
                  "📍 " + vue.toDisplayString(plane.locationTag),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["status-badge", $options.isExpiredPlane(plane) ? "expired" : "active"])
                  },
                  vue.toDisplayString($options.isExpiredPlane(plane) ? "已降落" : "飞行中"),
                  3
                  /* TEXT, CLASS */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "content-text" },
                vue.toDisplayString(plane.content),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "card-bottom" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  "拾取 " + vue.toDisplayString(plane.pickCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  null,
                  "点赞 " + vue.toDisplayString(plane.likeCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  null,
                  "评论 " + vue.toDisplayString(plane.commentCount),
                  1
                  /* TEXT */
                )
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        vue.createVNode(_component_detail_open_transition, {
          visible: _ctx.detailOpenVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_page_transition, {
          visible: _ctx.pageTransitionVisible,
          theme: $data.appState.theme
        }, null, 8, ["visible", "theme"]),
        vue.createVNode(_component_app_tabbar, {
          active: "mine",
          theme: $data.appState.theme
        }, null, 8, ["theme"])
      ],
      2
      /* CLASS */
    );
  }
  const PagesMineIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-569e925a"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/mine/index.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        appState,
        id: "",
        plane: null,
        comments: [],
        reply: "",
        remainingText: "",
        timer: null,
        commentIdentity: "named",
        emojis: ["👍", "❤️", "😂", "🥹", "🔥", "👏"],
        backIcon: "‹",
        shareIcon: "↪",
        labels: {
          archive: "纸飞机",
          openPlane: "详情",
          dropPoint: "降落点",
          signalNote: "纸条编号",
          pick: "拾取",
          like: "点赞",
          comment: "回声",
          likeAction: "点赞续航",
          reportAction: "举报",
          echoTitle: "匿名回声",
          echoDesc: "顺着这一条继续说下去。",
          echoSubtitle: "条",
          echoEmptyTitle: "这里还没有回声",
          echoEmptyDesc: "如果你愿意，可以留下第一句。",
          commentPlaceholder: "写下你的回应...",
          anonymousSend: "匿名发送",
          composerHint: "勾选后将匿名发送。",
          sendReply: "发送",
          anonymousFallback: "匿名同学",
          loadingTitle: "正在打开纸飞机",
          loadingDesc: "正在载入内容和评论。",
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
        return this.plane ? formatTime(this.plane.createTime) : "";
      },
      moodMeta() {
        var _a;
        return getMoodMeta((_a = this.plane) == null ? void 0 : _a.mood);
      },
      shortId() {
        if (!this.id)
          return "--";
        return String(this.id).slice(0, 8).toUpperCase();
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
      if (this.id) {
        this.loadDetail();
      }
    },
    onHide() {
      this.clearTimer();
    },
    onUnload() {
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
      formatCommentTime(dateStr) {
        return formatTime(dateStr);
      },
      goBack() {
        uni.navigateBack({
          fail: () => {
            uni.reLaunch({
              url: "/pages/discover/index"
            });
          }
        });
      },
      async loadDetail() {
        try {
          this.reply = "";
          this.plane = await getPlaneDetail(this.id);
          this.comments = await getComments(this.id);
          this.updateRemaining();
          this.startTimer();
        } catch (error) {
          uni.showToast({
            title: error.message || this.labels.loadFailed,
            icon: "none"
          });
        }
      },
      updateRemaining() {
        if (!this.plane)
          return;
        this.remainingText = getRemainingText(this.plane.expireTime);
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
          const result = await likePlane(this.id);
          this.plane.likeCount = result.likeCount;
          this.plane.expireTime = result.expireTime;
          this.updateRemaining();
          uni.showToast({
            title: this.labels.likeSuccess,
            icon: "success"
          });
        } catch (error) {
          uni.showToast({
            title: error.message || this.labels.likeFailed,
            icon: "none"
          });
        }
      },
      async handleReport() {
        try {
          await reportPlane(this.id);
          uni.showToast({
            title: this.labels.reportSuccess,
            icon: "success"
          });
        } catch (error) {
          uni.showToast({
            title: error.message || this.labels.reportFailed,
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
      async quickComment(emoji) {
        const payload = this.getCommentPayload(emoji);
        if (!payload)
          return;
        try {
          const comment = await addComment(this.id, payload);
          this.comments.push(comment);
          this.plane.commentCount = this.comments.length;
        } catch (error) {
          uni.showToast({
            title: error.message || this.labels.sendFailed,
            icon: "none"
          });
        }
      },
      async handleComment() {
        if (!this.reply.trim()) {
          uni.showToast({
            title: this.labels.writeBeforeSend,
            icon: "none"
          });
          return;
        }
        const payload = this.getCommentPayload(this.reply);
        if (!payload)
          return;
        try {
          const comment = await addComment(this.id, payload);
          this.comments.push(comment);
          this.plane.commentCount = this.comments.length;
          this.reply = "";
        } catch (error) {
          uni.showToast({
            title: error.message || this.labels.sendFailed,
            icon: "none"
          });
        }
      },
      handleShare() {
        if (!this.plane)
          return;
        const text = `✈ 纸飞机降落点
📍 ${this.plane.locationTag}

${this.plane.content}`;
        uni.setClipboardData({
          data: text,
          success: () => {
            uni.showToast({
              title: this.labels.shareCopied,
              icon: "none"
            });
          }
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["app-page", "detail-page", $options.themeClass]),
        style: vue.normalizeStyle($options.detailStyle)
      },
      [
        vue.createElementVNode("view", { class: "detail-nav" }, [
          vue.createElementVNode("view", {
            class: "nav-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "nav-icon" },
              vue.toDisplayString($data.backIcon),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "nav-center" }, [
            vue.createElementVNode(
              "text",
              { class: "nav-kicker" },
              vue.toDisplayString($data.labels.archive),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "nav-title" },
              vue.toDisplayString($data.labels.openPlane),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", {
            class: "nav-btn",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.handleShare && $options.handleShare(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "nav-icon" },
              vue.toDisplayString($data.shareIcon),
              1
              /* TEXT */
            )
          ])
        ]),
        $data.plane ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "detail-shell"
        }, [
          vue.createElementVNode("view", { class: "detail-head" }, [
            vue.createElementVNode(
              "text",
              { class: "detail-kicker" },
              vue.toDisplayString($data.labels.dropPoint),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "detail-title" },
              vue.toDisplayString($data.plane.locationTag),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "meta-row" }, [
              vue.createElementVNode(
                "text",
                { class: "meta-item mood-item" },
                vue.toDisplayString($options.moodMeta.icon) + " " + vue.toDisplayString($options.moodMeta.label),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "meta-item" },
                vue.toDisplayString($options.planeTime),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "meta-item" },
                vue.toDisplayString($data.remainingText),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "note-section" }, [
            vue.createElementVNode(
              "text",
              { class: "note-id" },
              vue.toDisplayString($data.labels.signalNote) + " #" + vue.toDisplayString($options.shortId),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "note-body" },
              vue.toDisplayString($data.plane.content),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "stats-row" }, [
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "text",
                { class: "stat-value" },
                vue.toDisplayString($data.plane.pickCount),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "stat-label" },
                vue.toDisplayString($data.labels.pick),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "text",
                { class: "stat-value" },
                vue.toDisplayString($data.plane.likeCount),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "stat-label" },
                vue.toDisplayString($data.labels.like),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "text",
                { class: "stat-value" },
                vue.toDisplayString($data.comments.length),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "stat-label" },
                vue.toDisplayString($data.labels.comment),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "action-section" }, [
            vue.createElementVNode("view", { class: "action-row" }, [
              vue.createElementVNode("view", {
                class: "action-btn action-primary",
                onClick: _cache[2] || (_cache[2] = (...args) => $options.handleLike && $options.handleLike(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.labels.likeAction),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", {
                class: "action-btn action-secondary",
                onClick: _cache[3] || (_cache[3] = (...args) => $options.handleReport && $options.handleReport(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($data.labels.reportAction),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("scroll-view", {
              class: "emoji-scroll",
              "scroll-x": ""
            }, [
              vue.createElementVNode("view", { class: "emoji-row" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($data.emojis, (emoji) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: emoji,
                      class: "emoji-chip",
                      onClick: ($event) => $options.quickComment(emoji)
                    }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(emoji),
                        1
                        /* TEXT */
                      )
                    ], 8, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "thread-section" }, [
            vue.createElementVNode("view", { class: "thread-head" }, [
              vue.createElementVNode("view", { class: "thread-copy" }, [
                vue.createElementVNode(
                  "text",
                  { class: "thread-title" },
                  vue.toDisplayString($data.labels.echoTitle),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "thread-note" },
                  vue.toDisplayString($data.labels.echoDesc),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "thread-count" },
                vue.toDisplayString($data.comments.length) + " " + vue.toDisplayString($data.labels.echoSubtitle),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "composer" }, [
              vue.createElementVNode("view", { class: "composer-field" }, [
                vue.withDirectives(vue.createElementVNode("textarea", {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.reply = $event),
                  class: "composer-input",
                  maxlength: "200",
                  placeholder: $data.labels.commentPlaceholder,
                  "placeholder-class": "placeholder-text"
                }, null, 8, ["placeholder"]), [
                  [vue.vModelText, $data.reply]
                ]),
                vue.createElementVNode("view", {
                  class: "anonymous-toggle",
                  onClick: _cache[5] || (_cache[5] = ($event) => $data.commentIdentity = $data.commentIdentity === "anonymous" ? "named" : "anonymous")
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "anonymous-check" },
                    vue.toDisplayString($data.commentIdentity === "anonymous" ? "☑" : "☐"),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "anonymous-text" },
                    vue.toDisplayString($data.labels.anonymousSend),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "composer-footer" }, [
                vue.createElementVNode(
                  "text",
                  { class: "composer-hint" },
                  vue.toDisplayString($data.commentIdentity === "named" ? $options.realNameHint : $data.labels.composerHint),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", {
                  class: "submit-btn",
                  onClick: _cache[6] || (_cache[6] = (...args) => $options.handleComment && $options.handleComment(...args))
                }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString($data.labels.sendReply),
                    1
                    /* TEXT */
                  )
                ])
              ])
            ]),
            !$data.comments.length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "thread-empty"
            }, [
              vue.createElementVNode(
                "text",
                { class: "empty-title" },
                vue.toDisplayString($data.labels.echoEmptyTitle),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "empty-desc" },
                vue.toDisplayString($data.labels.echoEmptyDesc),
                1
                /* TEXT */
              )
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "comment-list"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.comments, (comment) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: comment.id,
                    class: "comment-item"
                  }, [
                    vue.createElementVNode("view", { class: "comment-avatar" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString((comment.nickName || "?").slice(0, 1)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "comment-main" }, [
                      vue.createElementVNode("view", { class: "comment-top" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "comment-name" },
                          vue.toDisplayString(comment.nickName || $data.labels.anonymousFallback),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "comment-time" },
                          vue.toDisplayString($options.formatCommentTime(comment.createTime)),
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "comment-text" },
                        vue.toDisplayString(comment.reply),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]))
          ])
        ])) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "loading-state"
        }, [
          vue.createElementVNode(
            "text",
            { class: "empty-title" },
            vue.toDisplayString($data.labels.loadingTitle),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "empty-desc" },
            vue.toDisplayString($data.labels.loadingDesc),
            1
            /* TEXT */
          )
        ]))
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const PagesDetailIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-2fd5b0a7"], ["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/pages/detail/index.vue"]]);
  __definePage("pages/home/index", PagesHomeIndex);
  __definePage("pages/discover/index", PagesDiscoverIndex);
  __definePage("pages/throw/index", PagesThrowIndex);
  __definePage("pages/trending/index", PagesTrendingIndex);
  __definePage("pages/mine/index", PagesMineIndex);
  __definePage("pages/detail/index", PagesDetailIndex);
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "PaperPlane App Launch");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/Users/ASUS/Desktop/PaperPlane/用户端uniapp版本/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
