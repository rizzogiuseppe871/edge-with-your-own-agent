# Reasonix Edge Agent 集成方案

## 🎯 项目目标

让您的本地 Reasonix Agent 通过 Chrome/Edge 扩展接入浏览器，实现：
- 📄 自动读取和修改网页内容
- 🎬 控制视频播放
- 🌍 翻译文本
- 💾 下载文件
- ⚡ 执行任意 JavaScript 脚本
- 🧠 Reasonix 智能决策

## 🏗️ 架构设计

```
┌──────────────────┐
│  Reasonix Agent  │ （您的本地 Agent）
│  (localhost:888) │
└────────┬─────────┘
         │ WebSocket/HTTP
         ▼
┌──────────────────────┐
│   Reasonix Proxy     │ （新增中间层）
│   (localhost:9999)   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Edge Extension      │
│  ├─ popup.html       │
│  ├─ popup.js         │
│  ├─ content.js       │
│  ├─ background.js    │
│  └─ reasonix-agent.js│ （新增）
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  网页 (DOM)          │
│  Video Elements      │
│  Text Content        │
└──────────────────────┘
```

## 📦 新增文件

### 1. `reasonix-agent.js` - Agent 集成层

处理 Reasonix 与扩展之间的通信

### 2. `reasonix-proxy.js` - 本地代理服务器

Node.js 服务器，连接 Reasonix 和 Edge 扩展

### 3. `reasonix-commands.json` - 命令定义

Reasonix 可以执行的所有命令

## 🚀 工作流程

1. **Reasonix 分析任务**
   - 接收用户请求："翻译这个页面"
   - 确定需要的操作："获取文本" → "调用 API" → "替换内容"

2. **Reasonix 发送命令**
   - 通过 HTTP/WebSocket 向 Reasonix Proxy 发送
   ```json
   {
     "command": "execute_script",
     "params": {
       "script": "document.body.innerText"
     }
   }
   ```

3. **Proxy 转发到 Edge**
   - 将命令发送到已打开的浏览器标签页

4. **Edge 扩展执行**
   - content.js 在网页上下文执行命令
   - 返回结果给 Reasonix

5. **Reasonix 处理结果**
   - 获得网页数据
   - 进行 AI 分析和处理
   - 发送下一步指令

## ✨ 核心功能

### Reasonix 可以执行的命令

```javascript
// 获取网页内容
{ "command": "get_page_content" }
→ { "content": "网页内容", "title": "页面标题", "url": ".." }

// 执行 JavaScript
{ "command": "execute_script", "params": { "code": "..." } }
→ { "result": "执行结果" }

// 修改 DOM
{ "command": "modify_dom", "params": { "selector": "#id", "action": "text", "value": "新文本" } }
→ { "success": true }

// 翻译文本
{ "command": "translate", "params": { "text": "Hello", "target_lang": "中文" } }
→ { "translated": "你好" }

// 控制视频
{ "command": "video_control", "params": { "action": "set_playback_rate", "rate": 2 } }
→ { "success": true }

// 下载文件
{ "command": "download_file", "params": { "url": "...", "filename": "..." } }
→ { "success": true }

// 获取页面信息
{ "command": "get_page_info" }
→ { "url": "...", "title": "...", "videos": [...], "images": [...] }

// 隐藏广告
{ "command": "hide_ads" }
→ { "hidden_count": 5 }
```

## 🔧 安装和运行

### 第 1 步：安装 Proxy 服务器

```bash
# 安装 Node.js 依赖
cd reasonix-proxy
npm install

# 启动 Proxy
node server.js
# 输出：Proxy listening on http://localhost:9999
```

### 第 2 步：配置 Reasonix

告诉您的 Reasonix Agent：

```json
{
  "edge_extension": {
    "enabled": true,
    "proxy_url": "http://localhost:9999",
    "timeout": 5000
  }
}
```

### 第 3 步：加载 Edge 扩展

1. 打开 `edge://extensions/`
2. 启用"开发者模式"
3. 点击"加载未打包的扩展程序"
4. 选择这个项目文件夹

### 第 4 步：测试连接

```bash
# 在浏览器控制台测试
curl http://localhost:9999/api/status
# 输出：{ "status": "ready", "tabs": 1 }
```

## 📝 使用示例

### 示例 1：自动翻译页面

```python
# 在 Reasonix 中执行
response = reasonix.edge.execute({
    "command": "get_page_content"
})
text = response["content"]

# 调用 AI 翻译
translated = reasonix.translate(text, "中文")

# 更新网页
reasonnix.edge.execute({
    "command": "modify_dom",
    "params": {
        "selector": "body",
        "action": "html",
        "value": translated
    }
})
```

### 示例 2：自动下载所有视频

```python
# 获取页面信息
info = reasonix.edge.execute({"command": "get_page_info"})
videos = info["videos"]

# 逐个下载
for video in videos:
    reasonix.edge.execute({
        "command": "download_file",
        "params": {
            "url": video["src"],
            "filename": f"video_{video['id']}.mp4"
        }
    })
```

### 示例 3：智能脚本执行

```python
# Reasonix 决定要做什么
action = reasonix.think("我需要提取页面上的所有链接")

# 执行脚本
result = reasonix.edge.execute({
    "command": "execute_script",
    "params": {
        "code": """
            Array.from(document.querySelectorAll('a'))
                .map(a => ({ text: a.textContent, href: a.href }))
        """
    }
})

links = result["result"]
print(f"找到 {len(links)} 个链接")
```

## 🔐 安全考虑

1. **本地通信**：只在 localhost 上运行，不暴露到互联网
2. **命令白名单**：只允许预定义的安全命令
3. **超时保护**：所有命令都有超时限制
4. **错误处理**：捕获并报告所有错误

## 📊 监控和日志

### 查看 Proxy 日志

```bash
# Proxy 会输出所有命令和结果
[2024-01-15 10:30:45] Command: get_page_content
[2024-01-15 10:30:45] Tab ID: 12345
[2024-01-15 10:30:46] Result: 200 OK (1024 bytes)
```

### 监控 Reasonix 命令

```bash
# 查看 Edge 扩展日志
curl http://localhost:9999/api/logs
# 返回最近的 100 条命令日志
```

## 🐛 故障排除

### 问题 1：无法连接到 Proxy

```bash
# 检查 Proxy 是否运行
curl http://localhost:9999/api/status

# 重启 Proxy
kill -9 $(lsof -t -i:9999)
node reasonix-proxy/server.js
```

### 问题 2：命令超时

- 检查网页是否加载完成
- 增加超时时间
- 检查网页是否有大量 JavaScript

### 问题 3：找不到元素

- 确认选择器正确
- 检查元素是否在 iframe 中
- 等待 DOM 加载完成

## 🚀 高级功能（可选）

1. **自动化工作流**
   - Reasonix 自动执行一系列操作
   - 支持条件判断
   - 支持循环

2. **多标签页控制**
   - 同时控制多个标签页
   - 在标签页间传递数据

3. **数据持久化**
   - 保存执行历史
   - 记录 Reasonix 的决策过程

4. **性能优化**
   - 批量命令执行
   - 并行执行
   - 结果缓存

## 📚 相关文档

- [API 文档](./docs/REASONIX_API.md)
- [命令参考](./docs/COMMANDS.md)
- [开发指南](./docs/DEVELOPMENT.md)
- [最佳实践](./docs/BEST_PRACTICES.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建 feature 分支
3. 提交 Pull Request

---

**准备好了吗？让 Reasonix 接管您的浏览器吧！** 🚀
