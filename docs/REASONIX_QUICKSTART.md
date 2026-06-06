# Reasonix Edge 集成 - 快速开始指南

## 🎯 5 分钟快速开始

### 第 1 步：启动 Reasonix Proxy（1 分钟）

**macOS/Linux:**
```bash
cd reasonix-proxy
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
cd reasonix-proxy
start.bat
```

**或手动运行：**
```bash
cd reasonix-proxy
npm install
node server.js
```

✅ 你会看到：
```
==================================================
🚀 Reasonix Proxy Server 已���动
📍 监听地址: http://localhost:9999
==================================================
```

### 第 2 步：在浏览器中加载扩展（1 分钟）

1. 打开 `edge://extensions/`
2. 启用"开发者模式"（右上角）
3. 点击"加载未打包的扩展程序"
4. 选择项目文件夹

✅ 扩展已加载，你会在 Proxy 看到：
```
✅ 扩展已连接: 1234567890
```

### 第 3 步：测试连接（1 分钟）

```bash
# 在终端测试
curl -X POST http://localhost:9999/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "get_status"}'

# 输出应该是：
# {"success": true, "result": {"agent": "reasonix", "status": "ready"}}
```

### 第 4 步：配置 Reasonix（1 分钟）

在你的 Reasonix 配置中添加：

```json
{
  "edge_extension": {
    "enabled": true,
    "proxy_url": "http://localhost:9999",
    "timeout": 5000
  }
}
```

或环境变量：
```bash
export REASONIX_EDGE_PROXY=http://localhost:9999
```

### 第 5 步：开始使用（1 分钟）

在 Reasonix 中执行：

```python
# 获取当前页面内容
response = reasonix.edge.execute({
    "command": "get_page_content"
})
print(response["result"])

# 翻译页面
response = reasonix.edge.execute({
    "command": "translate",
    "params": {
        "text": "Hello World",
        "target_lang": "中文"
    }
})
print(response["result"]["translated"])
```

## 🔧 常见问题

### Q: Proxy 启动失败？

A: 检查 Node.js 版本
```bash
node -v  # 应该是 v12+ 或更高
```

### Q: "没有可用的 Edge 扩展连接"？

A: 确保：
1. ✅ 扩展已在 Edge 中加载
2. ✅ 扩展处于活动状态
3. ✅ 网页已完全加载

### Q: Reasonix 如何发送命令？

A: 使用 HTTP POST 到 Proxy：
```python
import requests

response = requests.post('http://localhost:9999/api/execute', json={
    'command': 'get_page_content'
})
print(response.json())
```

## 📚 可用命令

获取完整命令列表：
```bash
curl http://localhost:9999/api/commands
```

## 📊 监控

### 查看连接状态
```bash
curl http://localhost:9999/api/status
```

### 查看日志

Proxy 会在终端输出所有命令和响应：
```
🤖 Reasonix 命令 [1]: get_page_content
📨 收到回复 [1]: {result: {...}}
```

## 🚀 下一步

1. 📖 阅读 [REASONIX_INTEGRATION.md](../REASONIX_INTEGRATION.md) 了解更多
2. 🎓 查看 [API 文档](./API.md)
3. 💡 尝试 [示例代码](./EXAMPLES.md)
4. 🐛 遇到问题？查看 [故障排除](./TROUBLESHOOTING.md)

---

**现在你可以用 Reasonix 控制浏览器了！** 🎉
