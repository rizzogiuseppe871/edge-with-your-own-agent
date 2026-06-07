/**
 * background.js — Reasonix on Edge Service Worker
 *
 * 三路消息中枢：
 *   1. sidepanel ←→ background ←→ content script (DOM)
 *   2. sidepanel ←→ background (自然语言 → Groq → 命令编排)
 *   3. Proxy WebSocket ←→ background ←→ content script (外部 Reasonix 控制)
 */

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('没有活动的标签页');
  return tab;
}

async function forwardToContent(cmd) {
  const tab = await getActiveTab();
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, cmd, (response) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(response);
    });
  });
}

async function getGroqKey() {
  const s = await chrome.storage.sync.get('groqApiKey');
  return s.groqApiKey || null;
}

async function callGroq(systemPrompt, userContent) {
  const key = await getGroqKey();
  if (!key) throw new Error('未配置 Groq API Key。请在扩展选项中设置 groqApiKey。');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent }
      ],
      temperature: 0.1
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Groq: ${e.error?.message || res.status}`);
  }
  const d = await res.json();
  return d.choices[0].message.content;
}

// ═══════════════════════════════════════════
// Command handlers
// ═══════════════════════════════════════════

async function cmd_get_page_content() {
  return await forwardToContent({ action: 'reasonix_get_content' });
}

async function cmd_execute_script(params) {
  return await forwardToContent({ action: 'reasonix_execute_script', code: params.code });
}

async function cmd_modify_dom(params) {
  const { selector, action, value } = params;
  return await forwardToContent({
    action: 'reasonix_modify_dom', selector, domAction: action, value
  });
}

async function cmd_translate(params) {
  const { text, target_lang } = params;
  const apiKey = await getGroqKey();
  if (!apiKey) return { translated: text, source_lang: 'auto', target_lang, warning: '未配置 Groq API Key。' };
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: `Translate to ${target_lang}. Return ONLY the translation:\n\n${text}` }]
    })
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(`翻译失败: ${e.error?.message || res.status}`); }
  const d = await res.json();
  return { translated: d.choices[0].message.content, source_lang: 'auto', target_lang };
}

async function cmd_video_control(params) {
  const { action, rate } = params;
  return await forwardToContent({ action: 'reasonix_video_control', videoAction: action, rate });
}

async function cmd_download_file(params) {
  const { url, filename } = params;
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url, filename: filename || url.split('/').pop() || 'download'
    }, (downloadId) => {
      if (downloadId) resolve({ downloadId, filename: filename || url.split('/').pop() });
      else reject(new Error('下载失败: ' + (chrome.runtime.lastError?.message || '')));
    });
  });
}

async function cmd_get_page_info() {
  const tab = await getActiveTab();
  const info = await forwardToContent({ action: 'reasonix_get_page_info' });
  return { url: tab.url, title: tab.title, favicon: tab.favIconUrl, ...info };
}

async function cmd_hide_ads() {
  return await forwardToContent({ action: 'reasonix_hide_ads' });
}

async function cmd_screenshot() {
  const tab = await getActiveTab();
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId);
  return { screenshot: dataUrl };
}

async function cmd_get_status() {
  try {
    const tab = await getActiveTab();
    return {
      agent: 'reasonix', version: '2.0.0', status: 'ready', connected: true,
      url: tab.url, title: tab.title, tabId: tab.id,
      proxyConnected: proxyWs && proxyWs.readyState === WebSocket.OPEN,
      timestamp: new Date().toISOString()
    };
  } catch (_) {
    return {
      agent: 'reasonix', version: '2.0.0', status: 'no_tab', connected: false,
      proxyConnected: false,
      timestamp: new Date().toISOString()
    };
  }
}

// ═══════════════════════════════════════════
// ⑧ Natural language → Groq → command
// ═══════════════════════════════════════════

const NL_SYSTEM_PROMPT = `You are a browser automation router. Given a user request and page context, output EXACTLY ONE valid JSON object containing either a single command or a sequence of steps.

Available commands:
  get_page_content          — extract all text, HTML, title from page
  execute_script            — run arbitrary JS in page. params: { code: "..." }
  modify_dom                — change page elements. params: { selector: "css", action: "text"|"html"|"class"|"style"|"attr", value: "..." | {name,val} }
  translate                 — translate text. params: { text: "...", target_lang: "中文"|"英文"|"日文"|"韩文" }
  video_control             — control video. params: { action: "play"|"pause"|"fullscreen"|"set_playback_rate"|"get_info", rate: 2 }
  download_file             — download file. params: { url: "...", filename: "..." }
  get_page_info             — list videos, images, links on page
  hide_ads                  — hide advertisements
  screenshot                — capture visible area as base64 PNG

Output format — SINGLE command:
{"command":"get_page_content"}

Output format — command with params:
{"command":"execute_script","params":{"code":"document.querySelector('.btn').click()"}}

Output format — multi-step (for complex tasks):
{"steps":[{"command":"get_page_content"},{"command":"translate","params":{"text":"{prev.text}","target_lang":"中文"}}]}

Rules:
- Use "steps" only when the task requires 2+ commands in sequence.
- For simple tasks, output a single command directly.
- Selectors: prefer [name='...'], [type='submit'], button, input over generic classes.
- For login: step1 = modify_dom to fill username+password, step2 = execute_script to click submit.
- For "translate page": step1 = get_page_content, step2 = translate (use {prev.text} to reference previous output).
- Output ONLY the JSON, no markdown, no extra text.
- If unsure, default to get_page_content.`;

const FALLBACK_KEYWORDS = [
  { kw: ['登录','login','登陆'],    steps: 'auto-login' },
  { kw: ['翻译','translate','翻译页面'], cmd: 'translate', params: { text: '{page_text}', target_lang: '中文' } },
  { kw: ['截图','screenshot','截屏'],   cmd: 'screenshot' },
  { kw: ['内容','content','页面内容'],    cmd: 'get_page_content' },
  { kw: ['信息','info'],             cmd: 'get_page_info' },
  { kw: ['广告','ad'],               cmd: 'hide_ads' },
  { kw: ['下载','download'],         cmd: 'download_file' },
  { kw: ['视频','video','播放'],     cmd: 'video_control', params: { action: 'get_info' } },
  { kw: ['脚本','script','执行'],    cmd: 'execute_script' },
];

async function cmd_natural_language(params) {
  const text = params.text;

  // Try Groq first
  const apiKey = await getGroqKey();
  if (apiKey) {
    try {
      // Get page context for the LLM
      let pageCtx = { title: '', url: '' };
      try {
        const tab = await getActiveTab();
        const info = await forwardToContent({ action: 'reasonix_get_content' });
        pageCtx = { title: info.title, url: tab.url, textPreview: (info.text || '').slice(0, 1500) };
      } catch (_) { /* page might not be loaded yet */ }

      const llmInput = `User request: "${text}"\nPage title: ${pageCtx.title}\nPage URL: ${pageCtx.url}\nPage text preview: ${pageCtx.textPreview || '(unavailable)'}`;
      const raw = await callGroq(NL_SYSTEM_PROMPT, llmInput);
      const parsed = JSON.parse(raw.trim());

      // Execute single command or multi-step
      if (parsed.steps && Array.isArray(parsed.steps)) {
        const results = [];
        for (const step of parsed.steps) {
          const handler = COMMANDS[step.command];
          if (!handler) { results.push({ error: `未知命令: ${step.command}` }); continue; }
          try {
            results.push(await handler(step.params));
          } catch (e) {
            results.push({ error: e.message });
          }
        }
        return { intent: text, plan: parsed.steps, results };
      } else if (parsed.command) {
        const handler = COMMANDS[parsed.command];
        if (!handler) throw new Error(`未知命令: ${parsed.command}`);
        const result = await handler(parsed.params);
        return { intent: text, command: parsed.command, result };
      }
      throw new Error('LLM 返回格式无效');
    } catch (e) {
      // Groq failed → try keyword fallback
      console.warn('Groq NL failed, fallback to keywords:', e.message);
    }
  }

  // Keyword fallback (no API key or Groq failed)
  for (const rule of FALLBACK_KEYWORDS) {
    if (rule.kw.some(k => text.includes(k))) {
      if (rule.steps === 'auto-login') {
        // Smart login: assume inputs are name=username + type=password
        return {
          intent: text,
          fallback: true,
          suggestion: '请用命令格式指定登录字段，例如：{"command":"modify_dom","params":{"selector":"input[name=\'username\']","action":"attr","value":{"name":"value","val":"你的用户名"}}}'
        };
      }
      const handler = COMMANDS[rule.cmd];
      if (handler) {
        const result = await handler(rule.params);
        return { intent: text, command: rule.cmd, fallback: true, result };
      }
    }
  }

  return {
    intent: text,
    fallback: true,
    message: '未识别意图。请尝试：获取页面内容 / 截图 / 翻译 / 隐藏广告 / 页面信息，或用 JSON 命令格式。'
  };
}

// ═══════════════════════════════════════════
// Command router
// ═══════════════════════════════════════════

const COMMANDS = {
  get_page_content:    cmd_get_page_content,
  execute_script:      cmd_execute_script,
  modify_dom:          cmd_modify_dom,
  translate:           cmd_translate,
  video_control:       cmd_video_control,
  download_file:       cmd_download_file,
  get_page_info:       cmd_get_page_info,
  hide_ads:            cmd_hide_ads,
  screenshot:          cmd_screenshot,
  get_status:          cmd_get_status,
  natural_language:    cmd_natural_language,
};

async function executeCommand(command, params) {
  const handler = COMMANDS[command];
  if (!handler) return { success: false, error: `未知命令: ${command}` };
  try {
    const result = await handler(params);
    return { success: true, result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ═══════════════════════════════════════════
// Sidepanel message listener
// ═══════════════════════════════════════════

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.source !== 'sidepanel') return false;
  executeCommand(msg.command, msg.params).then(sendResponse);
  return true;
});

// ═══════════════════════════════════════════
// ⑨ WebSocket → Proxy (dual-mode)
// ═══════════════════════════════════════════

let proxyWs = null;
let proxyReconnectTimer = null;
let proxyReconnectDelay = 1000;
const PROXY_URL = 'ws://localhost:9999';
const PROXY_MAX_DELAY = 30000;

function connectProxy() {
  if (proxyWs && (proxyWs.readyState === WebSocket.OPEN || proxyWs.readyState === WebSocket.CONNECTING)) return;
  try {
    proxyWs = new WebSocket(PROXY_URL);
  } catch (_) {
    scheduleProxyReconnect();
    return;
  }

  proxyWs.onopen = () => {
    console.log('🔗 Proxy WebSocket 已连接');
    proxyReconnectDelay = 1000;
    broadcastStatus();
  };

  proxyWs.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch (_) { return; }
    if (msg.source !== 'reasonix-proxy') return;

    const { command, params, requestId } = msg;
    executeCommand(command, params).then(response => {
      response.requestId = requestId;
      if (proxyWs && proxyWs.readyState === WebSocket.OPEN) {
        proxyWs.send(JSON.stringify(response));
      }
    });
  };

  proxyWs.onclose = () => {
    console.log('❌ Proxy WebSocket 已断开');
    proxyWs = null;
    broadcastStatus();
    scheduleProxyReconnect();
  };

  proxyWs.onerror = () => {
    proxyWs?.close();
  };
}

function scheduleProxyReconnect() {
  if (proxyReconnectTimer) return;
  proxyReconnectTimer = setTimeout(() => {
    proxyReconnectTimer = null;
    proxyReconnectDelay = Math.min(proxyReconnectDelay * 2, PROXY_MAX_DELAY);
    connectProxy();
  }, proxyReconnectDelay);
}

function broadcastStatus() {
  chrome.runtime.sendMessage({
    source: 'background',
    type: 'proxy_status',
    connected: proxyWs && proxyWs.readyState === WebSocket.OPEN
  }).catch(() => {});
}

connectProxy();

// ═══════════════════════════════════════════
// Tab change → sidepanel
// ═══════════════════════════════════════════

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    chrome.runtime.sendMessage({ source: 'background', type: 'page_changed', url: tab.url, title: tab.title }).catch(() => {});
  } catch (_) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.runtime.sendMessage({ source: 'background', type: 'page_changed', url: tab.url, title: tab.title }).catch(() => {});
  }
});

// Open side panel on toolbar click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

console.log('✅ Reasonix on Edge v2.0 — sidepanel + AI + proxy dual-mode');
