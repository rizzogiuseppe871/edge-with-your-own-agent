/**
 * content.js - 针对 Reasonix 的扩展
 * 
 * 处理来自 Reasonix Agent 的命令
 */

// ==================== Reasonix 命令处理 ====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🤖 Reasonix 命令:', request.action);

  // ⭐ AGENT_TODO: 获取页面内容
  if (request.action === 'reasonix_get_content') {
    const content = {
      text: document.body.innerText,
      html: document.body.innerHTML,
      title: document.title,
      meta: {
        description: document.querySelector('meta[name="description"]')?.content || '',
        author: document.querySelector('meta[name="author"]')?.content || ''
      }
    };
    sendResponse(content);
  }

  // ⭐ AGENT_TODO: 修改 DOM
  else if (request.action === 'reasonix_modify_dom') {
    try {
      const { selector, domAction, value } = request;
      const element = document.querySelector(selector);
      
      if (!element) {
        sendResponse({ success: false, error: `未找到元素: ${selector}` });
        return;
      }

      switch (domAction) {
        case 'text':
          element.innerText = value;
          break;
        case 'html':
          element.innerHTML = value;
          break;
        case 'class':
          element.className = value;
          break;
        case 'style':
          Object.assign(element.style, value);
          break;
        case 'attr':
          element.setAttribute(value.name, value.val);
          break;
        default:
          throw new Error(`未知的 DOM 操作: ${domAction}`);
      }

      sendResponse({ success: true, message: `已修改 ${selector}` });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  // ⭐ AGENT_TODO: 视频控制
  else if (request.action === 'reasonix_video_control') {
    try {
      const { videoAction, rate } = request;
      const video = document.querySelector('video');
      
      if (!video) {
        sendResponse({ success: false, error: '未找到视频元素' });
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
          if (video.requestFullscreen) {
            video.requestFullscreen();
          }
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

  // ⭐ AGENT_TODO: 获取页面信息
  else if (request.action === 'reasonix_get_page_info') {
    const videos = Array.from(document.querySelectorAll('video')).map((v, i) => ({
      id: i,
      src: v.src || v.querySelector('source')?.src,
      duration: v.duration,
      title: v.title || `Video ${i + 1}`
    }));

    const images = Array.from(document.querySelectorAll('img')).map((img, i) => ({
      id: i,
      src: img.src,
      alt: img.alt
    })).slice(0, 20); // 限制前 20 张

    const links = Array.from(document.querySelectorAll('a')).map((a, i) => ({
      id: i,
      text: a.innerText,
      href: a.href
    })).slice(0, 20);

    sendResponse({
      videos,
      images,
      links,
      forms: document.querySelectorAll('form').length,
      paragraphs: document.querySelectorAll('p').length,
      headings: document.querySelectorAll('h1, h2, h3').length
    });
  }

  // ⭐ AGENT_TODO: 隐藏广告
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
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
        hiddenCount++;
      });
    });

    sendResponse({ success: true, hidden_count: hiddenCount });
  }

  return true;
});

console.log('✅ Reasonix Content Script 已加载');
