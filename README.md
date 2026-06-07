# 🤖 Reasonix Edge 浏览器自动化系统

> 让您的 Reasonix Agent 完全控制 Edge 浏览器，实现智能化前端自动化

## ⚡ 功能

✅ **自动化网页操作** — 填表、登录、导航、点击
✅ **执行任意脚本** — 在网页上下文中运行 JavaScript
✅ **智能信息提取** — 自动获取文本、视频、图片、链接
✅ **媒体控制** — 调整视频倍速、下载文件
✅ **内容翻译** — 支持多语言
✅ **页面监控** — 实时监控页面变化
✅ **AI 驱动** — Reasonix 自主分析和决策

## 🏗️ 架构

```
┌──────────────────────────────┐
│   Reasonix Agent             │
│   (思考、分析、决策)          │
└───────────────┬──────────────┘
                │ HTTP/WebSocket
                ▼
┌──────────────────────────────┐
│  Reasonix Proxy Server       │
│  (localhost:9999)            │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│   Edge Extension             │
│   ├─ popup.js                │
│   ├─ content.js              │
│   ├─ background.js           │
│   └─ reasonix-agent.js       │
└───────────────┬──────────────┘
                │
                ▼
        ┌──────────────┐
        │   网页 DOM   │
        └──────────────┘
```

## 🚀 快速开始

### 步骤 1：启动 Proxy

```bash
cd reasonix-proxy
npm install
node server.js
```

✅ 看到 `🚀 Reasonix Proxy Server started on http://localhost:9999` 表示成功

### 步骤 2：加载 Edge 扩展

1. 打开 `edge://extensions/`
2. 启用「开发者模式」
3. 点击「加载未打包的扩展程序」
4. 选择项目文件夹

### 步骤 3：配置 Reasonix

```json
{
  "edge_extension": {
    "enabled": true,
    "proxy_url": "http://localhost:9999",
    "timeout": 5000
  }
}
```

## ✨ 核心命令

```python
# 获取页面内容
reasonix.edge.execute({"command": "get_page_content"})

# 执行 JavaScript
reasonix.edge.execute({"command": "execute_script", "params": {"code": "document.title"}})

# 修改 DOM
reasonix.edge.execute({"command": "modify_dom", "params": {"selector": "h1", "action": "text", "value": "新标题"}})

# 翻译
reasonix.edge.execute({"command": "translate", "params": {"text": "Hello", "target_lang": "中文"}})

# 控制视频
reasonix.edge.execute({"command": "video_control", "params": {"action": "set_playback_rate", "rate": 2}})

# 下载文件
reasonix.edge.execute({"command": "download_file", "params": {"url": "https://example.com/file.pdf"}})

# 隐藏广告
reasonix.edge.execute({"command": "hide_ads"})

# 截图
reasonix.edge.execute({"command": "screenshot"})
```

## 📚 文档

- [快速开始](./docs/REASONIX_QUICKSTART.md)
- [API 文档](./docs/REASONIX_API.md)
- [架构设计](./REASONIX_INTEGRATION.md)
- [完整 README](./README_REASONIX.md)

## 🔐 安全性

- 本地通信，不暴露到互联网
- 命令白名单机制
- 超时保护
- 错误隔离

## 📝 许可证

MIT
