/**
 * sidepanel.js — Reasonix on Edge 侧边栏 UI 逻辑
 *
 * 职责：
 *   1. 聊天式消息界面渲染
 *   2. 接收用户输入 → 发给 background.js 执行
 *   3. 快捷命令按钮
 *   4. 连接状态显示 + 当前页面标题
 */

// ── DOM refs ──
const messagesEl = document.getElementById('messages');
const inputEl    = document.getElementById('input');
const sendBtn    = document.getElementById('send');
const statusDot  = document.getElementById('status-dot');
const pageTitle  = document.getElementById('page-title');
const quickCmds  = document.getElementById('quick-commands');

// ── State ──
let hasMessages = false;

// ── Helpers ──
function timeStr() {
  const d = new Date();
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function clearEmpty() {
  if (!hasMessages) {
    messagesEl.innerHTML = '';
    hasMessages = true;
  }
}

function addMsg(role, content, extra = {}) {
  clearEmpty();
  const div = document.createElement('div');
  div.className = 'msg ' + role + (extra.error ? ' error' : '');
  div.innerHTML = content;
  const t = document.createElement('div');
  t.className = 'time';
  t.textContent = timeStr();
  div.appendChild(t);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addUserMsg(text) {
  addMsg('user', escapeHtml(text));
}

function addAgentMsg(text, isError = false) {
  addMsg('agent', escapeHtml(text), { error: isError });
}

function addAgentJson(obj) {
  addMsg('agent', '<pre>' + escapeHtml(JSON.stringify(obj, null, 2)) + '</pre>');
}

function escapeHtml(s) {
  if (typeof s !== 'string') s = JSON.stringify(s);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setStatus(connected) {
  statusDot.className = connected ? 'dot' : 'dot off';
}

// ── Send command ──
async function sendCommand(command, params, userMsg) {
  addUserMsg(userMsg || (command + (params ? ' ' + JSON.stringify(params) : '')));

  try {
    const response = await chrome.runtime.sendMessage({
      source: 'sidepanel',
      command,
      params
    });

    if (!response) {
      addAgentMsg('⚠️ 未收到响应 —— extension 后台可能未就绪', true);
      return;
    }

    if (response.success) {
      if (typeof response.result === 'object') {
        addAgentJson(response.result);
      } else {
        addAgentMsg(String(response.result));
      }
    } else {
      addAgentMsg('❌ ' + (response.error || '未知错误'), true);
    }
  } catch (err) {
    addAgentMsg('❌ 发送失败: ' + err.message, true);
  }
}

// ── Quick commands ──
function buildQuickParams(cmd) {
  switch (cmd) {
    case 'get_page_content': return null;
    case 'get_page_info':    return null;
    case 'screenshot':       return null;
    case 'hide_ads':         return null;
    case 'translate':        return { text: 'Hello World', target_lang: '中文' };
    default:                 return null;
  }
}

quickCmds.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const cmd = chip.dataset.cmd;
  sendCommand(cmd, buildQuickParams(cmd));
});

// ── Free-form input ──
function tryParseInput(raw) {
  raw = raw.trim();
  if (!raw) return null;

  // Try JSON: { "command": "x", "params": {...} }
  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw);
      if (obj.command) return obj;
    } catch (_) { /* fall through */ }
  }

  // Natural language → pass as free text (AI handles later)
  return { command: 'natural_language', params: { text: raw } };
}

async function handleSend() {
  const raw = inputEl.value.trim();
  if (!raw) return;

  inputEl.value = '';
  inputEl.style.height = 'auto';

  const parsed = tryParseInput(raw);
  if (!parsed) return;

  if (parsed.command === 'natural_language') {
    inputEl.disabled = true;
    sendBtn.disabled = true;
    addAgentMsg('🤔 正在理解你的需求...');

    try {
      const response = await chrome.runtime.sendMessage({
        source: 'sidepanel',
        command: 'natural_language',
        params: { text: raw }
      });

      // Remove the "thinking" message
      messagesEl.lastChild?.remove();
      if (!hasMessages && messagesEl.children.length === 0) {
        hasMessages = false; // re-show empty state if nothing left
      }

      if (!response) {
        addAgentMsg('⚠️ 未收到响应', true);
      } else if (response.success) {
        addAgentJson(response.result);
      } else {
        addAgentMsg('❌ ' + (response.error || '未知错误'), true);
      }
    } catch (err) {
      messagesEl.lastChild?.remove();
      addAgentMsg('❌ ' + err.message, true);
    } finally {
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
    return;
  }

  await sendCommand(parsed.command, parsed.params);
}

sendBtn.addEventListener('click', handleSend);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
});

// ── Init: poll background status + page title ──
async function refreshStatus() {
  try {
    const resp = await chrome.runtime.sendMessage({ source: 'sidepanel', command: 'get_status' });
    if (resp && resp.success) {
      setStatus(true);
      if (resp.result && resp.result.url) {
        pageTitle.textContent = resp.result.title || resp.result.url;
      }
    } else {
      setStatus(false);
    }
  } catch (_) {
    setStatus(false);
  }
}

refreshStatus();
setInterval(refreshStatus, 5000);

// Listen for messages pushed from background (e.g. page changes, proxy status)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.source === 'background' && msg.type === 'page_changed') {
    pageTitle.textContent = msg.title || msg.url || '—';
  }
  if (msg.source === 'background' && msg.type === 'proxy_status') {
    const proxyEl = document.getElementById('proxy-status');
    if (proxyEl) {
      proxyEl.textContent = msg.connected ? '🔗 Proxy' : '';
      proxyEl.style.color = msg.connected ? 'var(--success)' : 'var(--text-dim)';
    }
  }
});
