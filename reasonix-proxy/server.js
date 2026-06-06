/**
 * Reasonix Proxy Server
 * 
 * 这个 Node.js 服务器在本地运行，连接 Reasonix Agent 和 Edge 扩展
 * 
 * 使用方法:
 *   node reasonix-proxy/server.js
 * 
 * 然后告诉 Reasonix 连接到 http://localhost:9999
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// 存储连接的扩展
const connectedExtensions = new Map();
const pendingRequests = new Map();
let requestId = 0;

// ==================== WebSocket 连接处理 ====================

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  console.log(`✅ 扩展已连接: ${clientId}`);
  connectedExtensions.set(clientId, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 收到回复 [${data.requestId}]:`, data.result);
      
      // 将响应发送给等待的 Reasonix 请求
      if (pendingRequests.has(data.requestId)) {
        const callback = pendingRequests.get(data.requestId);
        callback(data);
        pendingRequests.delete(data.requestId);
      }
    } catch (error) {
      console.error('❌ WebSocket 消息处理失败:', error);
    }
  });

  ws.on('close', () => {
    console.log(`❌ 扩展已断开: ${clientId}`);
    connectedExtensions.delete(clientId);
  });

  // 定期发送心跳
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => clearInterval(heartbeat));
});

// ==================== HTTP API 端点 ====================

/**
 * POST /api/execute
 * 从 Reasonix 执行命令到 Edge
 */
app.post('/api/execute', (req, res) => {
  const { command, params } = req.body;
  const id = ++requestId;

  console.log(`\n🤖 Reasonix 命令 [${id}]: ${command}`);
  if (params) console.log('   参数:', JSON.stringify(params).substring(0, 100));

  // 获取第一个连接的扩展
  const extension = Array.from(connectedExtensions.values())[0];
  
  if (!extension || extension.readyState !== WebSocket.OPEN) {
    return res.status(503).json({
      success: false,
      error: '没有可用的 Edge 扩展连接'
    });
  }

  // 设置超时
  const timeout = setTimeout(() => {
    pendingRequests.delete(id);
    res.status(408).json({
      success: false,
      error: '命令执行超时 (5s)'
    });
  }, 5000);

  // 发送命令到扩展
  extension.send(JSON.stringify({
    command,
    params,
    requestId: id,
    source: 'reasonix-proxy'
  }));

  // 等待响应
  pendingRequests.set(id, (response) => {
    clearTimeout(timeout);
    res.json(response);
  });
});

/**
 * GET /api/status
 * 获取 Proxy 和扩展的状态
 */
app.get('/api/status', (req, res) => {
  const extensions = Array.from(connectedExtensions.entries()).map(([id, ws]) => ({
    id,
    connected: ws.readyState === WebSocket.OPEN
  }));

  res.json({
    status: 'ready',
    connected_extensions: extensions.length,
    extensions,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/logs
 * 获取最近的命令日志
 */
app.get('/api/logs', (req, res) => {
  res.json({
    message: '日志功能待实现',
    commands: [
      // TODO: 存储命令历史
    ]
  });
});

/**
 * POST /api/screenshot
 * 获取当前网页截图
 */
app.post('/api/screenshot', (req, res) => {
  const id = ++requestId;
  const extension = Array.from(connectedExtensions.values())[0];
  
  if (!extension) {
    return res.status(503).json({ error: '没有扩展连接' });
  }

  const timeout = setTimeout(() => {
    pendingRequests.delete(id);
    res.status(408).json({ error: '超时' });
  }, 5000);

  extension.send(JSON.stringify({
    command: 'screenshot',
    requestId: id,
    source: 'reasonix-proxy'
  }));

  pendingRequests.set(id, (response) => {
    clearTimeout(timeout);
    res.json(response);
  });
});

/**
 * GET /api/commands
 * 获取支持的命令列表
 */
app.get('/api/commands', (req, res) => {
  res.json({
    commands: [
      {
        name: 'get_page_content',
        description: '获取页面内容',
        params: {}
      },
      {
        name: 'execute_script',
        description: '执行 JavaScript',
        params: {
          code: 'string (JavaScript 代码)'
        }
      },
      {
        name: 'modify_dom',
        description: '修改 DOM 元素',
        params: {
          selector: 'string (CSS 选择器)',
          action: 'string (text|html|class|style|attr)',
          value: 'any (新值)'
        }
      },
      {
        name: 'translate',
        description: '翻译文本',
        params: {
          text: 'string',
          target_lang: 'string (中文|英文|日文|等)'
        }
      },
      {
        name: 'video_control',
        description: '控制视频',
        params: {
          action: 'string (set_playback_rate|play|pause|fullscreen|get_info)',
          rate: 'number (可选)'
        }
      },
      {
        name: 'download_file',
        description: '下载文件',
        params: {
          url: 'string',
          filename: 'string (可选)'
        }
      },
      {
        name: 'get_page_info',
        description: '获取页面信息',
        params: {}
      },
      {
        name: 'hide_ads',
        description: '隐藏广告',
        params: {}
      },
      {
        name: 'screenshot',
        description: '获取截图',
        params: {}
      }
    ]
  });
});

// ==================== 静态文件和文档 ====================

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reasonix Proxy Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        h1 { color: #667eea; }
        .status { padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
        .endpoint { padding: 10px; background: #e8f5e9; margin: 10px 0; border-left: 4px solid #48bb78; font-family: monospace; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🤖 Reasonix Proxy Server</h1>
      <p>连接 Reasonix Agent 和 Edge 扩展的代理服务器</p>
      
      <h2>状态</h2>
      <div class="status" id="status">检查中...</div>
      
      <h2>API 端点</h2>
      <div class="endpoint">GET /api/status - 获取服务器状态</div>
      <div class="endpoint">GET /api/commands - 获取支持的命令列表</div>
      <div class="endpoint">POST /api/execute - 执行命令</div>
      <div class="endpoint">POST /api/screenshot - 获取截图</div>
      <div class="endpoint">GET /api/logs - 获取命令日志</div>
      
      <h2>文档</h2>
      <p><a href="/docs">查看完整文档</a></p>
      
      <script>
        fetch('/api/status')
          .then(r => r.json())
          .then(data => {
            document.getElementById('status').innerHTML = 
              '<strong>✅ 服务器运行中</strong><br>' +
              '已连接扩展: ' + data.connected_extensions + '<br>' +
              '时间: ' + new Date(data.timestamp).toLocaleString();
          })
          .catch(() => {
            document.getElementById('status').innerHTML = '<strong style="color: red;">❌ 无法连接到服务器</strong>';
          });
      </script>
    </body>
    </html>
  `);
});

// ==================== 错误处理 ====================

app.use((err, req, res, next) => {
  console.error('❌ 错误:', err);
  res.status(500).json({ error: err.message });
});

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 9999;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Reasonix Proxy Server 已启动');
  console.log('📍 监听地址: http://localhost:' + PORT);
  console.log('\n告诉 Reasonix 使用此 URL:');
  console.log('   REASONIX_EDGE_PROXY=http://localhost:' + PORT);
  console.log('\n查看 API:');
  console.log('   GET  http://localhost:' + PORT + '/api/status');
  console.log('   GET  http://localhost:' + PORT + '/api/commands');
  console.log('   POST http://localhost:' + PORT + '/api/execute');
  console.log('\n='.repeat(50) + '\n');
});

process.on('SIGINT', () => {
  console.log('\n👋 服务器已关闭');
  process.exit(0);
});
