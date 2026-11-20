/* Overlay layer for the Christmas tree page.
 * Adds: zh/en switch, "save current frame as PNG", greeting banner from URL
 * (?to= & ?msg=), and small touch-screen fixes. It never mutates the app bundle.
 */
(() => {
  "use strict";

  const ZH_TO_EN = {
    "璀璨圣诞树 · 点亮冬日心愿": "A Christmas Tree · Light Up a Winter Wish",
    "点击任意处 · 进入璀璨圣诞树": "Click anywhere to enter",
    "愿今夜的星光，落在你身旁。": "May tonight's starlight rest beside you.",
    "浏览器拦截了自动发声 · 点击任意处进入并开启音乐":
      "Autoplay blocked · click anywhere to enter with music",
    "拖动旋转 · 滚轮缩放 · 按住鼠标让星光绽放":
      "Drag to orbit · scroll to zoom · hold to let the starlight bloom",
    "回忆相册": "Album",
    "圣诞布置": "Decorations",
    "圣诞音乐": "Music",
    "圣诞树模式": "Tree",
    "星光漂浮模式": "Stardust",
    "星光漂浮": "Stardust",
    "星光粒子": "Particles",
    "礼物盒与彩球": "Gifts & baubles",
    "礼物盒：": "Gifts:",
    "礼盒 A": "Box A",
    "礼盒 B": "Box B",
    "彩球：": "Baubles:",
    "彩球": "Bauble",
    "主色": "Primary",
    "点缀色": "Accent",
    "数量：": "Count:",
    "上传本地音乐": "Upload audio",
    "暂停音乐": "Pause music",
    "播放音乐": "Play music",
    "未知曲目": "Unknown track",
    "展示模式": "Presentation",
    "收起画面": "Hide preview",
    "手势画面": "Gesture preview",
    "手势控制（需要摄像头）": "Gesture control · needs camera and a 22 MB model",
    "手势引擎加载中…": "Loading gesture engine…",
    "手势引擎加载失败": "Gesture engine failed to load",
    "手势引擎加载中": "Loading gesture engine",
    "手势识别中": "Detecting hand",
    "摄像头不可用": "Camera unavailable",
    "支持 JPG / PNG / WEBP，照片保存在本机浏览器，悬停可删除":
      "JPG / PNG / WEBP · photos stay in this browser · hover to delete",
    "跳过": "Skip",
    "跳过 ›": "Skip ›",
    "张": "photos",
    "绽放": "Bloom",
    "悬停": "Hover",
    "圣诞树": "Christmas tree",
    "天": "days",
    "时": "hrs",
    "分": "min",
    "秒": "sec",
    "Merry Christmas": "Merry Christmas",
    "CHRISTMAS EVE IS COMING": "CHRISTMAS EVE IS COMING",
  };
  const EN_TO_ZH = Object.fromEntries(Object.entries(ZH_TO_EN).map(([zh, en]) => [en, zh]));

  // Dynamic labels that carry a number cannot live in the flat dictionary.
  const PATTERNS = [
    [/^(\d+)\s*张$/, (m) => `${m[1]} photos`],
    [/^(\d+)\s*个$/, (m) => `${m[1]} items`],
    [/^(\d+)\s*颗$/, (m) => `${m[1]} lights`],
    [/^(\d+)\s*天$/, (m) => `${m[1]} days`],
    [/^(\d+)\s*秒$/, (m) => `${m[1]} sec`],
    [/^(\d+)\s*分$/, (m) => `${m[1]} min`],
    [/^(\d+)\s*时$/, (m) => `${m[1]} hrs`],
  ];

  function patternTranslate(key) {
    for (const [re, build] of PATTERNS) {
      const hit = key.match(re);
      if (hit) return build(hit);
    }
    return null;
  }

  const STORE_LANG = "ct-lang";
  const ATTRS = ["title", "aria-label", "placeholder", "alt"];

  let lang = (() => {
    try {
      return localStorage.getItem(STORE_LANG) === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  })();

  const originals = new WeakMap();
  const OWN = ".ct-tools, .ct-toast, .ct-blessing";

  const skip = (el) => !el || (el.closest && el.closest(OWN));

  function walker(fn) {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const node = walk.currentNode;
      if (skip(node.parentElement)) continue;
      fn(node);
    }
    for (const el of document.body.querySelectorAll("[title],[aria-label],[placeholder],[alt]")) {
      if (!skip(el)) fn(el, true);
    }
  }

  function translateNode(node) {
    const text = node.textContent ?? "";
    const key = text.trim();
    if (!key) return;
    if (!originals.has(node)) originals.set(node, text);
    const source = originals.get(node) ?? text;
    const srcKey = source.trim();
    if (lang === "en") {
      const en = ZH_TO_EN[srcKey] ?? patternTranslate(srcKey);
      if (en) {
        const lead = source.match(/^\s*/)[0];
        const tail = source.match(/\s*$/)[0];
        node.textContent = lead + en + tail;
      }
    } else if (node.textContent !== source) {
      node.textContent = source;
    }
  }

  function translateAttr(el) {
    for (const name of ATTRS) {
      const value = el.getAttribute(name);
      if (!value) continue;
      const storeKey = "__ct_attr_" + name;
      if (!(storeKey in el.dataset)) el.dataset[storeKey] = value;
      const source = el.dataset[storeKey];
      const map = lang === "en" ? ZH_TO_EN : EN_TO_ZH;
      const next = map[source.trim()];
      if (next && value !== next) el.setAttribute(name, next);
    }
  }

  function applyLanguage() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    walker((node, isEl) => (isEl ? translateAttr(node) : translateNode(node)));
    if (langBtn) langBtn.textContent = lang === "en" ? "中文" : "EN";
  }

  let langBtn = null;
  let pending = 0;
  const schedule = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      applyLanguage();
      reserveSpace();
    });
  };

  function toast(message, ms = 2200) {
    const box = document.createElement("div");
    box.className = "ct-toast";
    box.textContent = message;
    document.body.appendChild(box);
    requestAnimationFrame(() => box.classList.add("ct-show"));
    setTimeout(() => {
      box.classList.remove("ct-show");
      setTimeout(() => box.remove(), 400);
    }, ms);
  }

  function saveFrame() {
    const canvases = [...document.querySelectorAll("canvas")].filter((c) => c.width > 300);
    if (!canvases.length) return toast(lang === "en" ? "Nothing to save yet" : "还没有可保存的画面");
    const canvas = canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    let url = "";
    try {
      url = canvas.toDataURL("image/png");
    } catch {
      url = "";
    }
    if (!url || url.length < 5000) {
      return toast(lang === "en" ? "Capture blocked by the browser" : "浏览器拦截了画面捕获");
    }
    const a = document.createElement("a");
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    a.href = url;
    a.download = `christmas-tree-${stamp}.png`;
    a.click();
    toast(lang === "en" ? "Saved to your downloads" : "已保存到下载文件夹");
  }

  let toolsWrap = null;

  /* The app owns the top-right corner (skip button during the intro, mode and
     gesture switches afterwards). Park our buttons underneath whatever it put
     there instead of stacking on top of it. */
  function reserveSpace() {
    if (!toolsWrap) return;
    let bottom = 0;
    const vw = window.innerWidth;
    for (const el of document.querySelectorAll("body *")) {
      if (el === toolsWrap || el.contains(toolsWrap) || toolsWrap.contains(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 18 || r.height < 14) continue;
      if (r.height > 70 || r.width > 320) continue; // skip full-screen scrims and wide bars
      if (r.right < vw - 40) continue; // must hug the right edge
      if (r.top < -10 || r.top > 300) continue;
      if (r.bottom > bottom) bottom = r.bottom;
    }
    toolsWrap.style.top = `${Math.max(14, Math.round(bottom) + 8)}px`;
  }

  function buildTools() {
    const wrap = document.createElement("div");
    wrap.className = "ct-tools";
    toolsWrap = wrap;

    langBtn = document.createElement("button");
    langBtn.className = "ct-btn";
    langBtn.type = "button";
    langBtn.textContent = lang === "en" ? "中文" : "EN";
    langBtn.title = "Switch language / 切换语言";
    langBtn.addEventListener("click", () => {
      lang = lang === "en" ? "zh" : "en";
      try {
        localStorage.setItem(STORE_LANG, lang);
      } catch {}
      applyLanguage();
      buildBlessing();
    });

    const save = document.createElement("button");
    save.className = "ct-btn";
    save.type = "button";
    save.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg><span>PNG</span>';
    save.title = "Save this frame / 保存当前画面";
    save.addEventListener("click", saveFrame);

    wrap.append(langBtn, save);
    document.body.appendChild(wrap);
    reserveSpace();
    setInterval(reserveSpace, 700);
    window.addEventListener("resize", reserveSpace);
    requestAnimationFrame(() => wrap.classList.add("ct-ready"));
  }

  function buildBlessing() {
    document.querySelector(".ct-blessing")?.remove();
    const params = new URLSearchParams(location.search);
    const to = (params.get("to") || "").trim().slice(0, 40);
    const msg = (params.get("msg") || "").trim().slice(0, 80);
    if (!to && !msg) return;
    const box = document.createElement("div");
    box.className = "ct-blessing";
    if (to) {
      const line = document.createElement("div");
      line.className = "ct-to";
      line.textContent = lang === "en" ? `For ${to}` : `致 ${to}`;
      box.appendChild(line);
    }
    if (msg) {
      const line = document.createElement("div");
      line.className = "ct-msg";
      line.textContent = msg;
      box.appendChild(line);
    }
    document.body.appendChild(box);
  }

  function boot() {
    buildTools();
    buildBlessing();
    applyLanguage();
    // The gesture panel silently waits forever when getUserMedia fails (denied
    // permission, insecure origin, camera busy). Surface the real reason once.
    let camNotified = "";
    setInterval(() => {
      const err = window.__ctCamError;
      if (!err || err === camNotified) return;
      camNotified = err;
      toast(
        lang === "en"
          ? `Camera unavailable — ${err}. Allow camera access for this site, then reopen the gesture panel (needs https or localhost).`
          : `摄像头不可用 — ${err}。请在地址栏允许摄像头，再重新打开手势面板（需要 https 或 localhost）。`,
        9000,
      );
    }, 700);
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // The app mounts asynchronously; re-apply once the tree is in the DOM.
    const root = document.getElementById("root");
    if (root) {
      const check = setInterval(() => {
        if (root.childElementCount > 0) {
          clearInterval(check);
          applyLanguage();
        }
      }, 300);
      setTimeout(() => clearInterval(check), 12000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
