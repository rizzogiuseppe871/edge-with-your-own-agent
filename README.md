<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Browser-Edge-0078D7?style=flat-square&logo=microsoftedge" alt="Edge">
  <img src="https://img.shields.io/badge/AI-Groq-FF6B35?style=flat-square" alt="Groq">
  <img src="https://img.shields.io/badge/Side_Panel-native-7c3aed?style=flat-square" alt="Side Panel">
</p>

<h1 align="center">Reasonix on Edge</h1>
<p align="center">Talk to your browser. It obeys.</p>

---

## What is this

An Edge browser extension that gives your AI agent hands on the DOM. You type a command in the side panel, or pipe it from an external client through a local WebSocket proxy. The extension reads pages, fills forms, executes JavaScript, controls video, translates text, downloads files, and hides ads.

No cloud. No telemetry. Everything runs on `localhost`.

---

## Quick start

### Load the extension

```
edge://extensions/ → Developer mode → Load unpacked → pick this folder
```

### Open the side panel

Click the toolbar icon, or press `Ctrl+Shift+Y`. Dark chat UI, green dot when connected.

### Try it

| Input | Result |
|-------|--------|
| `获取页面内容` | Returns all page text, HTML, title, meta |
| `截图` | Captures visible tab as Base64 PNG |
| `隐藏广告` | Removes ad elements from the page |
| `{"command":"execute_script","params":{"code":"document.title"}}` | Runs arbitrary JS |

### Enable AI (optional)

1. Get a free key at [console.groq.com](https://console.groq.com)
2. Right-click extension → Extension options → set `groqApiKey`
3. Type: `用 admin / password123 登录这个网站`

The AI reads the page, reasons about the form, and fills it.

---

## Architecture

```
Side Panel (you talk)                  External Client
        │                                     │
        │ chrome.runtime.sendMessage           │ HTTP
        ▼                                     ▼
┌─────────────────────────────────────────────────┐
│  background.js · Service Worker                  │
│  · command router (11 commands)                  │
│  · Groq LLM → natural language → JSON commands   │
│  · WebSocket client (optional proxy connection)  │
└─────────────────┬───────────────────────────────┘
                  │ chrome.tabs.sendMessage
                  ▼
┌─────────────────────────────────────────────────┐
│  reasonix-content.js                             │
│  · eval() in page context                        │
│  · DOM read/write · same-origin iframe traversal │
└─────────────────────────────────────────────────┘
```

---

## Commands

| Command | Action |
|---------|--------|
| `get_page_content` | Extract text, HTML, title, meta |
| `execute_script` | Run JS in page context |
| `modify_dom` | Change element: text, HTML, class, style, or attribute |
| `translate` | Translate via Groq API |
| `video_control` | Play, pause, speed, fullscreen, info |
| `download_file` | Trigger browser download |
| `get_page_info` | List videos, images, links, forms, headings |
| `hide_ads` | Strip ad elements |
| `screenshot` | Capture visible tab → Base64 PNG |
| `get_status` | Connection health + proxy status |
| `natural_language` | NL → Groq → executed command |

---

## Files

```
reasonix-on-edge/
├── manifest.json              MV3 declaration
├── background.js              Service worker, 11-command router, AI + WS
├── sidepanel.html             Chat UI (dark theme)
├── sidepanel.js               Input handling, status polling, command dispatch
├── reasonix-content.js        DOM ops, eval, iframe traversal
├── icons/                     Placeholder PNGs
├── reasonix-proxy/            Optional Node.js proxy (Express + WS, port 9999)
│   ├── server.js
│   └── package.json
├── docs/
│   ├── REASONIX_API.md
│   └── REASONIX_QUICKSTART.md
└── LICENSE                    MIT
```

---

## Security

- All traffic on `localhost`. Nothing leaves your machine.
- 11-command whitelist. No arbitrary code paths.
- 5-second timeout kills runaway scripts.
- Command failures don't cascade.

---

## License

MIT

---

---

<h1 align="center">Reasonix on Edge（中文）</h1>
<p align="center">对你的浏览器说话。它会照做。</p>

---

## 这是什么

一个 Edge 浏览器扩展，让 AI 直接操控网页。在侧边栏输入指令，或通过本地 WebSocket 代理从外部 Reasonix 客户端发命令。扩展负责读页面、填表单、跑脚本、控视频、翻译文字、下载文件、屏蔽广告。

不上云。不传数据。全在 `localhost` 上。

---

## 10 秒上手

### 装扩展

`edge://extensions/` → 开发者模式 → 加载解压缩 → 选本项目文件夹

### 开侧栏

点工具栏图标，或 `Ctrl+Shift+Y`。深色聊天界面，绿点亮起就是就绪。

### 试一句

| 输入 | 结果 |
|------|------|
| `获取页面内容` | 返回页面文本、HTML、标题 |
| `截图` | 捕获可视区域为 Base64 |
| `隐藏广告` | 移除广告元素 |
| `{"command":"execute_script","params":{"code":"document.title"}}` | 运行任意 JS |

### 开 AI（可选）

1. [console.groq.com](https://console.groq.com) 拿免费 key
2. 右键扩展 → 扩展选项 → 设 `groqApiKey`
3. 说人话：`帮我把这个页面翻译成日文`

AI 读页面内容，自动规划命令序列，一步执行。

---

## 架构

```
侧边栏 (你在这里说话)              外部客户端
        │                              │
        │ chrome.runtime.sendMessage     │ HTTP
        ▼                              ▼
┌─────────────────────────────────────────────────┐
│  background.js · Service Worker                  │
│  · 11 条命令路由                                  │
│  · Groq LLM → 自然语言 → 命令                     │
│  · WebSocket 客户端 (可选连 Proxy)                │
└─────────────────┬───────────────────────────────┘
                  │ chrome.tabs.sendMessage
                  ▼
┌─────────────────────────────────────────────────┐
│  reasonix-content.js                             │
│  · eval() 在页面上下文中执行 JS                   │
│  · DOM 读写 · 同源 iframe 穿透搜索               │
└─────────────────────────────────────────────────┘
```

---

## 十一条命令

| 命令 | 做了什么 |
|------|---------|
| `get_page_content` | 提取文本、HTML、标题、meta |
| `execute_script` | 在页面中跑 JS |
| `modify_dom` | 改元素：文本、HTML、CSS 类、样式、属性 |
| `translate` | Groq 翻译 |
| `video_control` | 播放、暂停、倍速、全屏、信息 |
| `download_file` | 触发浏览器下载 |
| `get_page_info` | 列出视频、图片、链接、表单、标题 |
| `hide_ads` | 清除广告元素 |
| `screenshot` | 可视区域 → Base64 |
| `get_status` | 连接状态 + 代理状态 |
| `natural_language` | 自然语言 → Groq → 执行 |

---

## 文件

```
reasonix-on-edge/
├── manifest.json              MV3 声明
├── background.js              Service Worker, 路由 + AI + WS
├── sidepanel.html             聊天 UI（深色主题）
├── sidepanel.js               输入处理, 状态轮询, 命令分发
├── reasonix-content.js        DOM 操作, eval, iframe 穿透
├── icons/                     占位图标
├── reasonix-proxy/            可选 Node.js 代理 (Express + WS, 9999)
│   ├── server.js
│   └── package.json
├── docs/
│   ├── REASONIX_API.md
│   └── REASONIX_QUICKSTART.md
└── LICENSE                    MIT
```

---

## 安全

- 纯 `localhost` 通信，数据不出机器
- 11 条白名单命令，别无其他路径
- 5 秒超时终止失控脚本
- 单命令失败不影响其他操作

---

## 许可证

MIT
