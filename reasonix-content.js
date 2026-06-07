/**
 * reasonix-content.js — Reasonix on Edge Content Script
 *
 * 在网页上下文中处理来自 background.js 的命令：
 *   内容提取 / DOM 修改 / 视频控制 / 广告隐藏 / 页面信息 / JS 执行
 *
 * v2 变更:
 *   - 新增 reasonix_execute_script 处理器（修复原始 agent.js 的 (code)() 包装 bug）
 *   - 新增 findAcrossFrames() —— 主 frame 找不到时自动穿透同源 iframe
 *   - modify_dom / video_control / hide_ads 全部启用 iframe 回退
 */

// ==================== Iframe 穿透 ====================

/**
 * 在主文档和所有同源 iframe 中查找第一个匹配元素。
 * 跨域 iframe 会被静默跳过（浏览器安全限制）。
 */
function findAcrossFrames(selector) {
  // 1. 主文档
  const el = document.querySelector(selector);
  if (el) return el;

  // 2. 遍历 iframe
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) continue;
      const found = doc.querySelector(selector);
      if (found) return found;
    } catch (_) {
      // 跨域 iframe — 跳过
      continue;
    }
  }

  return null;
}

/**
 * 在主文档和所有同源 iframe 中查找所有匹配元素。
 */
function findAllAcrossFrames(selector) {
  const results = [...document.querySelectorAll(selector)];

  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) continue;
      results.push(...doc.querySelectorAll(selector));
    } catch (_) { /* cross-origin, skip */ }
  }

  return results;
}

/**
 * 对 iframe 内元素执行函数 (用于 modify_dom / video_control 等).
 */
function actOnElement(selector, fn) {
  const el = findAcrossFrames(selector);
  if (!el) return { found: false };
  fn(el);
  return { found: true };
}

// ==================== 命令处理 ====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🤖 Reasonix:', request.action);

  // ──── 获取页面内容 ────
  if (request.action === 'reasonix_get_content') {
    const content = {
      text: document.body.innerText,
      html: document.body.innerHTML,
      title: document.title,
      meta: {
        description: document.querySelector('meta[name="description"]')?.content || '',
        author: document.querySelector('meta[name="author"]')?.content || ''
      },
      iframeCount: document.querySelectorAll('iframe').length
    };
    sendResponse(content);
  }

  // ──── 执行 JS 脚本（修复版 — 不用 (code)() 包装） ────
  else if (request.action === 'reasonix_execute_script') {
    try {
      const code = request.code;
      // 直接 eval，不做任何包装。表达式返回值的 string 化由调用方处理。
      const result = eval(code);
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // ──── 修改 DOM（支持 iframe 穿透） ────
  else if (request.action === 'reasonix_modify_dom') {
    try {
      const { selector, domAction, value } = request;

      const el = findAcrossFrames(selector);
      if (!el) {
        sendResponse({ success: false, error: `未找到元素: ${selector}` });
        return;
      }

      switch (domAction) {
        case 'text':  el.innerText = value; break;
        case 'html':  el.innerHTML = value; break;
        case 'class': el.className = value; break;
        case 'style': Object.assign(el.style, value); break;
        case 'attr':  el.setAttribute(value.name, value.val); break;
        default: throw new Error(`未知 DOM 操作: ${domAction}`);
      }

      sendResponse({ success: true, message: `已修改 ${selector}` });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // ──── 视频控制（支持 iframe 内视频） ────
  else if (request.action === 'reasonix_video_control') {
    try {
      const { videoAction, rate } = request;
      const video = findAcrossFrames('video');

      if (!video) {
        sendResponse({ success: false, error: '未找到视频元素（已搜索主文档和同源 iframe）' });
        return;
      }

      switch (videoAction) {
        case 'set_playback_rate':
          video.playbackRate = rate || 1;
          break;
        case 'play':
          video.play();
          break;
        case 'pause':
          video.pause();
          break;
        case 'fullscreen':
          if (video.requestFullscreen) video.requestFullscreen();
          break;
        case 'get_info':
          return sendResponse({
            success: true,
            currentTime: video.currentTime,
            duration: video.duration,
            playbackRate: video.playbackRate,
            paused: video.paused
          });
      }

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // ──── 获取页面信息（含 iframe 内媒体） ────
  else if (request.action === 'reasonix_get_page_info') {
    const videos = findAllAcrossFrames('video').map((v, i) => ({
      id: i,
      src: v.src || v.querySelector('source')?.src,
      duration: v.duration,
      title: v.title || `Video ${i + 1}`
    }));

    const images = findAllAcrossFrames('img').map((img, i) => ({
      id: i,
      src: img.src,
      alt: img.alt
    })).slice(0, 50);

    const links = findAllAcrossFrames('a').map((a, i) => ({
      id: i,
      text: a.innerText,
      href: a.href
    })).slice(0, 50);

    sendResponse({
      videos,
      images,
      links,
      forms: document.querySelectorAll('form').length,
      paragraphs: document.querySelectorAll('p').length,
      headings: document.querySelectorAll('h1, h2, h3').length,
      iframeCount: document.querySelectorAll('iframe').length
    });
  }

  // ──── 隐藏广告（含 iframe 内广告） ────
  else if (request.action === 'reasonix_hide_ads') {
    const adSelectors = [
      '[class*="ad-"]',
      '[id*="ad-"]',
      '[class*="advertisement"]',
      '[class*="banner"]',
      'iframe[src*="ads"]',
      '[data-ad-slot]',
      '.adsbygoogle'
    ];

    let hiddenCount = 0;
    adSelectors.forEach(selector => {
      findAllAcrossFrames(selector).forEach(el => {
        el.style.display = 'none';
        hiddenCount++;
      });
    });

    sendResponse({ success: true, hidden_count: hiddenCount });
  }

  return true; // 异步响应
});

console.log('✅ Reasonix on Edge Content Script v2 已加载');
