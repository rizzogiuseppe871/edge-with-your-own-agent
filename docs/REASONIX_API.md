# Reasonix Edge API 文档

## 基础用法

### 初始化连接

```python
from reasonix_edge import EdgeClient

edge = EdgeClient(proxy_url='http://localhost:9999')
```

### 执行命令

```python
response = edge.execute({
    'command': 'command_name',
    'params': { ... }
})

if response['success']:
    result = response['result']
    print(result)
else:
    print(f"错误: {response['error']}")
```

## 命令参考

### 1. get_page_content - 获取页面内容

获取当前页面的文本、HTML 和元数据。

**请求：**
```json
{
  "command": "get_page_content"
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "text": "页面文本内容",
    "html": "<html>...</html>",
    "title": "页面标题",
    "meta": {
      "description": "页面描述",
      "author": "作者"
    }
  }
}
```

**示例：**
```python
response = edge.execute({'command': 'get_page_content'})
text = response['result']['text']
print(f"页面内容长度: {len(text)} 字符")
```

### 2. execute_script - 执行 JavaScript

在网页上下文中执行任意 JavaScript 代码。

**请求：**
```json
{
  "command": "execute_script",
  "params": {
    "code": "document.title"
  }
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "result": "页面标题"
  }
}
```

**示例：**
```python
# 获取所有链接
response = edge.execute({
    'command': 'execute_script',
    'params': {
        'code': 'Array.from(document.querySelectorAll("a")).map(a => a.href)'
    }
})
links = response['result']['result']
print(f"找到 {len(links)} 个链接")
```

### 3. modify_dom - 修改 DOM

修改网页上的 DOM 元素。

**请求：**
```json
{
  "command": "modify_dom",
  "params": {
    "selector": "#element-id",
    "action": "text",
    "value": "新文本"
  }
}
```

**支持的操作：**
- `text` - 修改元素文本
- `html` - 修改 HTML 内容
- `class` - 修改 CSS 类
- `style` - 修改样式
- `attr` - 修改属性

**示例：**
```python
# 修改页面标题
edge.execute({
    'command': 'modify_dom',
    'params': {
        'selector': 'h1',
        'action': 'text',
        'value': '新标题'
    }
})

# 隐藏元素
edge.execute({
    'command': 'modify_dom',
    'params': {
        'selector': '.advertisement',
        'action': 'style',
        'value': {'display': 'none'}
    }
})
```

### 4. translate - 翻译文本

使用 Groq API 翻译文本。

**请求：**
```json
{
  "command": "translate",
  "params": {
    "text": "Hello World",
    "target_lang": "中文"
  }
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "translated": "你好世界",
    "source_lang": "auto",
    "target_lang": "中文"
  }
}
```

**示例：**
```python
# 翻译页面内容
response = edge.execute({'command': 'get_page_content'})
text = response['result']['text']

response = edge.execute({
    'command': 'translate',
    'params': {
        'text': text[:500],  # 前 500 字
        'target_lang': '日文'
    }
})
print(response['result']['translated'])
```

### 5. video_control - 控制视频

控制网页上的视频播放。

**请求：**
```json
{
  "command": "video_control",
  "params": {
    "action": "set_playback_rate",
    "rate": 2
  }
}
```

**支持的操作：**
- `set_playback_rate` - 设置播放速度（0.5-2）
- `play` - 播放
- `pause` - 暂停
- `fullscreen` - 全屏
- `get_info` - 获取视频信息

**示例：**
```python
# 加速视频
edge.execute({
    'command': 'video_control',
    'params': {
        'action': 'set_playback_rate',
        'rate': 1.5
    }
})

# 获取视频信息
response = edge.execute({
    'command': 'video_control',
    'params': {'action': 'get_info'}
})
print(f"视频长度: {response['result']['duration']} 秒")
```

### 6. download_file - 下载文件

下载文件到本地。

**请求：**
```json
{
  "command": "download_file",
  "params": {
    "url": "https://example.com/file.pdf",
    "filename": "文件.pdf"
  }
}
```

**示例：**
```python
# 下载视频
edge.execute({
    'command': 'download_file',
    'params': {
        'url': 'https://example.com/video.mp4',
        'filename': 'my_video.mp4'
    }
})

print("文件已开始下载")
```

### 7. get_page_info - 获取页面信息

获取页面上的媒体、链接等信息。

**请求：**
```json
{
  "command": "get_page_info"
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "title": "页面标题",
    "favicon": "favicon URL",
    "videos": [
      {"id": 0, "src": "video.mp4", "duration": 120}
    ],
    "images": [
      {"id": 0, "src": "image.jpg", "alt": "描述"}
    ],
    "links": [
      {"id": 0, "text": "链接", "href": "url"}
    ],
    "forms": 2,
    "paragraphs": 10,
    "headings": 5
  }
}
```

**示例：**
```python
response = edge.execute({'command': 'get_page_info'})
info = response['result']

print(f"页面: {info['title']}")
print(f"视频数: {len(info['videos'])}")
print(f"图片数: {len(info['images'])}")
print(f"链接数: {len(info['links'])}")
```

### 8. hide_ads - 隐藏广告

隐藏网页上的广告。

**请求：**
```json
{
  "command": "hide_ads"
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "hidden_count": 5
  }
}
```

### 9. screenshot - 获取截图

获取网页的截图。

**请求：**
```json
{
  "command": "screenshot"
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "screenshot": "data:image/png;base64,..."
  }
}
```

## 错误处理

```python
try:
    response = edge.execute({'command': 'get_page_content'})
    if not response['success']:
        print(f"错误: {response['error']}")
    else:
        print(response['result'])
except Exception as e:
    print(f"请求失败: {e}")
```

## 超时处理

```python
try:
    response = edge.execute(
        {'command': 'execute_script', 'params': {'code': 'heavy_computation()'}},
        timeout=10  # 10 秒超时
    )
except TimeoutError:
    print("命令执行超时")
```

---

更多信息请查看 [REASONIX_INTEGRATION.md](../REASONIX_INTEGRATION.md)
