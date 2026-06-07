# 🤖 Reasonix on Edge

> AI-powered browser automation — control Microsoft Edge with natural language, directly from a Side Panel.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](./manifest.json)

---

## ⚡ What It Does

Reasonix on Edge turns your Edge browser into an AI-controllable platform:

- ✅ **Natural Language Control** — type "log in to this site" and the AI figures out the steps
- ✅ **Execute Arbitrary JS** — run any script in the page context
- ✅ **Modify the DOM** — fill forms, change text, inject styles
- ✅ **Translate Content** — on-the-fly translation via Groq API (7+ languages)
- ✅ **Control Video** — play, pause, speed up, fullscreen, get info
- ✅ **Download Files** — trigger browser downloads from any URL
- ✅ **Hide Ads** — auto-detect and remove ad elements
- ✅ **Screenshots** — capture the visible tab as Base64 PNG
- ✅ **Page Info** — extract all videos, images, links, forms, headings at once
- ✅ **Iframe Penetration** — search same-origin iframes when elements aren't in the main document
- ✅ **Dual Mode** — use the Side Panel chat UI, or connect an external Reasonix client via WebSocket proxy

---

## 🏗 Architecture

### Mode A — Side Panel (default, no external dependencies)

```
┌──────────────────────────────────────────────────────┐
│  Edge Browser                                         │
│                                                       │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Side Panel      │    │  Target Webpage          │  │
│  │  (you chat here) │    │  (AI operates here)      │  │
│  │                  │    │                          │  │
│  │  "Translate      │    │  forms filled            │  │
│  │   this page"     │    │  text extracted          │  │
│  │                  │    │  scripts executed        │  │
│  └────────┬─────────┘    └────────────┬────────────┘  │
│           │                           │               │
│           ▼                           ▼               │
│  ┌─────────────────────────────────────────────────┐  │
│  │  background.js (Service Worker)                  │  │
│  │  · routes 11 commands                            │  │
│  │  · Groq LLM for natural language → commands      │  │
│  │  · WebSocket client for external proxy access    │  │
│  └──────────────────┬──────────────────────────────┘  │
│                     │ chrome.tabs.sendMessage         │
│                     ▼                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  reasonix-content.js                             │  │
│  │  · DOM read/write                                │  │
│  │  · eval() JS execution                           │  │
│  │  · same-origin iframe traversal                  │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Mode B — External Reasonix Client (via Proxy)

```
Reasonix Client ──HTTP──▶ Proxy (localhost:9999) ──WebSocket──▶ background.js ──▶ content.js ──▶ DOM
```

Both modes can run simultaneously — the Side Panel and an external client share the same command router.

---

## 🚀 Quick Start

### 1. Load the Extension (1 min)

1. Open `edge://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this project folder

### 2. Open the Side Panel (2 sec)

Click the Reasonix toolbar icon, or press `Ctrl+Shift+Y` in Edge.

The dark chat UI appears. The green dot means ready.

### 3. Try a Command

Type any of these and press Enter:

```
Get page content
Take a screenshot
Hide ads
Translate Hello World to Chinese
Get page info
```

Or use the quick-command chips below the input.

### 4. (Optional) Enable AI — Groq API Key

For natural language understanding and translation:

1. Get a free API key at [console.groq.com](https://console.groq.com)
2. Right-click the extension → **Extension options**
3. Set key: `groqApiKey` = `your-key-here`

Now you can type things like:

```
Log into this site with username admin and password 1234
Find all links on this page and download the first PDF
Translate the entire page to Japanese
```

The AI reads the page context, figures out the commands, and executes them.

---

## ✨ All 11 Commands

| Command | What it does | Params |
|---------|-------------|--------|
| `get_page_content` | Extract all text, HTML, title, meta | — |
| `execute_script` | Run arbitrary JS in the page | `{ code }` |
| `modify_dom` | Change an element (text/html/class/style/attr) | `{ selector, action, value }` |
| `translate` | Translate text via Groq | `{ text, target_lang }` |
| `video_control` | Control `<video>` playback | `{ action, rate? }` |
| `download_file` | Trigger browser download | `{ url, filename? }` |
| `get_page_info` | List videos, images, links, forms | — |
| `hide_ads` | Remove ad elements from page | — |
| `screenshot` | Capture visible tab as Base64 PNG | — |
| `get_status` | Extension health + proxy status | — |
| `natural_language` | Groq LLM interprets intent → executes | `{ text }` |

JSON mode also works — type `{"command":"get_page_content"}` directly.

---

## 📁 Project Structure

```
reasonix-on-edge/
├── manifest.json              # MV3: sidePanel, scripting, activeTab
├── background.js              # 11-command router + Groq NL + WebSocket client
├── sidepanel.html             # Dark chat UI
├── sidepanel.js               # Chat logic, input handling, status polling
├── reasonix-content.js        # DOM operations + iframe traversal
├── icons/                     # Extension icons (replace with real ones)
├── reasonix-proxy/            # Optional Node.js proxy for external clients
│   ├── server.js              # Express + WebSocket (port 9999)
│   └── package.json
├── docs/
│   ├── REASONIX_API.md        # Full API reference
│   └── REASONIX_QUICKSTART.md # 5-min guide
└── LICENSE                    # MIT
```

---

## 🔐 Security

- **Local only** — all traffic stays on localhost
- **Command whitelist** — only 11 predefined commands accepted
- **5s timeout** — runaway scripts are killed
- **Error isolation** — one command failure never cascades
- **No telemetry** — zero data leaves your machine

---

---

# 🤖 Reasonix on Edge（中文）

> AI 驱动的浏览器自动化 — 用自然语言控制 Edge 浏览器，直接在侧边栏分屏操作。

---

## ⚡ 功能一览

- ✅ **自然语言控制** — 说"登录这个网站"，AI 自动编排执行步骤
- ✅ **执行任意 JavaScript** — 在网页上下文中运行任何脚本
- ✅ **修改 DOM** — 自动填表、改文本、注入样式
- ✅ **翻译内容** — 通过 Groq API 实时翻译（支持 7+ 语言）
- ✅ **控制视频** — 播放、暂停、倍速、全屏、获取信息
- ✅ **下载文件** — 一键触发浏览器下载
- ✅ **隐藏广告** — 自动识别并移除广告元素
- ✅ **截图** — 捕获当前可见区域为 Base64 PNG
- ✅ **页面信息** — 一次性提取所有视频、图片、链接、表单
- ✅ **Iframe 穿透** — 主文档找不到元素时自动搜索同源 iframe
- ✅ **双模式** — 侧边栏聊天 UI，或通过 WebSocket 代理连接外部 Reasonix 客户端

---

## 🏗 架构

### 模式 A — 侧边栏（默认，无需外部依赖）

```
┌──────────────────────────────────────────────────────┐
│  Edge 浏览器                                          │
│                                                       │
│  ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  侧边栏          │    │  目标网页                 │  │
│  │  (你在这里聊天)   │    │  (AI 在这里操作)          │  │
│  │                  │    │                          │  │
│  │  "翻译这个页面"   │    │  自动填表                 │  │
│  │  "登录这个网站"   │    │  提取数据                 │  │
│  └────────┬─────────┘    │  执行脚本                 │  │
│           │              └────────────┬────────────┘  │
│           ▼                           ▼               │
│  ┌─────────────────────────────────────────────────┐  │
│  │  background.js (Service Worker)                  │  │
│  │  · 11 条命令路由                                  │  │
│  │  · Groq LLM 解析自然语言 → 自动编排命令            │  │
│  │  · WebSocket 客户端（可选连接外部代理）             │  │
│  └──────────────────┬──────────────────────────────┘  │
│                     │ chrome.tabs.sendMessage         │
│                     ▼                                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  reasonix-content.js                             │  │
│  │  · DOM 读写                                       │  │
│  │  · eval() 执行 JavaScript                        │  │
│  │  · 同源 iframe 自动穿透搜索                        │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 模式 B — 外部 Reasonix 客户端（通过 Proxy）

```
Reasonix 客户端 ──HTTP──▶ Proxy (localhost:9999) ──WebSocket──▶ background.js ──▶ content.js ──▶ DOM
```

两种模式可同时运行——侧边栏和外部客户端共享同一个命令路由。

---

## 🚀 快速开始

### 1. 加载扩展（1 分钟）

1. 打开 `edge://extensions/`
2. 右上角启用**开发者模式**
3. 点击**加载解压缩的扩展**
4. 选择本项目文件夹

### 2. 打开侧边栏（2 秒）

点击工具栏的 Reasonix 图标，或按 `Ctrl+Shift+Y`。

暗色聊天界面出现，绿色圆点表示就绪。

### 3. 试试命令

输入以下任意内容，按回车：

```
获取页面内容
截图
隐藏广告
把 Hello World 翻译成中文
获取页面信息
```

也可以点击输入框下方的快捷命令按钮。

### 4. （可选）启用 AI — 配置 Groq API Key

要让自然语言理解和翻译功能生效：

1. 在 [console.groq.com](https://console.groq.com) 免费获取 API Key
2. 右键扩展 → **扩展选项**
3. 设置键名 `groqApiKey` = `你的密钥`

现在你可以这样说话了：

```
用用户名 admin 密码 1234 登录这个网站
找出页面所有链接并下载第一个 PDF
把整个页面翻译成日文
```

AI 会读取页面上下文，自动编排命令并执行。

---

## ✨ 全部 11 条命令

| 命令 | 功能 | 参数 |
|------|------|------|
| `get_page_content` | 提取全部文本、HTML、标题、meta | — |
| `execute_script` | 在页面中执行任意 JS | `{ code }` |
| `modify_dom` | 修改元素（text/html/class/style/attr）| `{ selector, action, value }` |
| `translate` | 通过 Groq 翻译文本 | `{ text, target_lang }` |
| `video_control` | 控制 `<video>` 播放 | `{ action, rate? }` |
| `download_file` | 触发浏览器下载 | `{ url, filename? }` |
| `get_page_info` | 列出视频、图片、链接、表单 | — |
| `hide_ads` | 移除页面广告 | — |
| `screenshot` | 截取可见区域为 Base64 PNG | — |
| `get_status` | 扩展健康状态 + 代理连接状态 | — |
| `natural_language` | Groq LLM 理解意图 → 执行命令 | `{ text }` |

也支持 JSON 格式——直接输入 `{"command":"get_page_content"}`。

---

## 📁 项目结构

```
reasonix-on-edge/
├── manifest.json              # MV3: sidePanel, scripting, activeTab
├── background.js              # 11 命令路由 + Groq AI + WebSocket 客户端
├── sidepanel.html             # 暗色聊天 UI
├── sidepanel.js               # 聊天逻辑、输入处理、状态轮询
├── reasonix-content.js        # DOM 操作 + iframe 穿透
├── icons/                     # 扩展图标（可替换为正式图标）
├── reasonix-proxy/            # 可选的 Node.js 代理（供外部客户端使用）
│   ├── server.js              # Express + WebSocket (端口 9999)
│   └── package.json
├── docs/
│   ├── REASONIX_API.md        # 完整 API 参考
│   └── REASONIX_QUICKSTART.md # 5 分钟上手指南
└── LICENSE                    # MIT
```

---

## 🔐 安全性

- **纯本地通信** — 所有流量仅走 localhost
- **命令白名单** — 只接受 11 条预定义命令
- **5 秒超时** — 失控脚本自动终止
- **错误隔离** — 单命令失败不影响其他操作
- **零遥测** — 无任何数据离开你的机器

---

## 📝 License

MIT
