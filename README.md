# 璀璨圣诞树 · Christmas Tree

一棵由 6000–12000 颗发光粒子点亮的圣诞树：可以旋转缩放、装饰相册、播放音乐、跟随音乐律动，也可以用手势操控。

这是对 **https://nobody-r.github.io/christmas-tree/**（作者 RJY / [nobody-r](https://github.com/nobody-r)）的**改良版**：
原仓库只发布了构建产物（无源码、无 LICENSE），因此本项目在其产物之上做了**非侵入式补丁** + 一层独立 overlay，没有重写它的 3D 实现。

---

## 我改了什么

### 一、补丁层（直接改 bundle 中 5 处字符串，全部有断言保护）

| # | 改动 | 原因 |
|---|---|---|
| 1 | 曲名补成 `Christmas by Ikson · ikson.com` | 原作只显示曲名，缺 Ikson 要求的署名链接 |
| 2 | 手势按钮提示补上「首次使用需下载 22MB 模型」 | 22MB 是隐藏成本，点之前应该知道 |
| 3 | 音频 `preload="metadata"` | 原来会在首屏就抢带宽 |
| 4 | 默认音轨换成 `.m4a`（128 kbps AAC） | **6.7 MB → 2.7 MB，减 59%**，听感无差别 |
| 5 | 把摄像头错误暴露到 `window.__ctCamError` | 原作 `react-webcam` 的 `onUserMediaError` 是空函数，权限被拒时界面只会无限转圈 |

### 二、Overlay 层（`overlay.js` / `overlay.css`，运行时注入，不碰 React 内部）

- **中英双语切换**：右上 `EN / 中文`，覆盖片头、HUD、三个面板与所有动态数字（`8 张 → 8 photos`），用 `MutationObserver` 跟随 React 重渲染，选择记在 localStorage。
- **保存当前画面为 PNG**：`index.html` 里先给 `getContext` 打补丁开启 `preserveDrawingBuffer`，才能读回 WebGL canvas。
- **祝福卡**：`?to=妈妈&msg=圣诞快乐` → 页面底部出现「致 妈妈 圣诞快乐」，可当分享链接发人。
- **摄像头错误提示**：权限被拒 / 设备被占用 / 非安全上下文时，直接弹出具体错误名与处理办法，而不是干等。
- **触屏修复**：`@media (hover: none)` 下让"删除照片"按钮常显（原来只有 hover 才出现，手机根本删不掉）。
- **右上角避让**：工具按钮会扫描页面上贴右侧的小控件，自动避开片头的"跳过"和进入后的两个圆形开关。
- 顺带：内联 SVG favicon（消掉 404）、meta description、Google Fonts 改为非阻塞加载。

---

## 目录结构

```
.
├── index.html                      # 页面壳（含 preserveDrawingBuffer 补丁、非阻塞字体）
├── overlay.js / overlay.css        # 双语、存图、祝福卡、错误提示
├── assets/
│   ├── index-CZPyPNXc.js           # 原作的 React 打包产物（已打 5 处补丁）
│   └── index-BeE7YxDE.css          # Tailwind 产物
├── audio/
│   └── christmas-by-ikson.m4a      # 2.7 MB（原 6.7 MB MP3 已转码）
├── mediapipe/                      # 手部识别模型（自托管，点击手势按钮才下载）
└── .nojekyll                       # 让 GitHub Pages 跳过 Jekyll 处理
```

---

## 本地预览

`index.html` 用的是 ES module，**双击 `file://` 打不开**，必须起静态服务器：

```bash
python -m http.server 8080
# 或
npx serve .
```

然后打开 http://localhost:8080/ 。

> 摄像头相关 API 只在**安全上下文**可用：`localhost` / `127.0.0.1` / https。
> 用局域网 IP（`http://192.168.x.x`）访问时手势一定用不了，这是浏览器限制，不是 bug。

---

## 部署到 GitHub Pages

```bash
git init
git add .
git commit -m "Christmas tree: patched bundle + bilingual overlay"
git branch -M main
git remote add origin https://github.com/<你的账号>/<仓库名>.git
git push -u origin main
```

然后在仓库 **Settings → Pages** 里把 Source 设为 `Deploy from a branch` → `main` / `/ (root)`，保存，
一两分钟后访问 `https://<你的账号>.github.io/<仓库名>/`。

所有资源路径都是**相对路径**（`./assets/...`、`mediapipe/...`），所以放在子路径下也能正常工作，不需要改任何配置。

仓库体积约 **25 MB**，主要是 `mediapipe/` 下的模型文件（单个最大 5.9 MB，远低于 GitHub 的 100 MB 单文件限制）。

---

## URL 参数

| 参数 | 作用 | 示例 |
|---|---|---|
| `to` / `msg` | 祝福卡文案（会自动 URL 编码） | `?to=妈妈&msg=圣诞快乐` |
| `lite=1` | 原作自带的低配模式（减星星、关后处理） | `?lite=1` |

---

## 已知限制

1. **手势需要摄像头**：首次点击要下载约 22 MB 模型；点过"拒绝"后浏览器会记住，需要在地址栏图标里改回允许。
2. **没有源码级可维护性**：这是压缩产物 + 字符串补丁，原作者下次 deploy 会换 hash 和变量名，补丁需要按新产物重跑。
3. **无自动化测试**：改动验证依靠 CDP 截图 + DOM 断言（见开发端的 `tools2/verify.mjs`）。

---

## 授权与致谢

- **原项目**：https://github.com/nobody-r/christmas-tree —— 仓库未附 LICENSE，默认保留所有权利。本项目仅作学习与个人改造；如原作者有异议，请告知即撤下。
- **音乐**：`Christmas` by **Ikson**（https://ikson.com）。按 Ikson 的使用条款，免费使用需署名，因此界面音乐面板已显示 `Christmas by Ikson · ikson.com`。
- **MediaPipe Hands**：Google，Apache-2.0。
- **React / three.js / @react-three/fiber / drei / postprocessing / Tailwind CSS**：各自遵循 MIT 等开源许可。
