/**
 * Reasonix Agent 集成模块
 * 
 * 这个模块处理 Reasonix Agent 与 Edge 扩展之间的通信
 * 由 Reasonix Proxy 调用
 * 
 * @module reasonix-agent
 */

class ReasonixAgent {
  constructor() {
    this.connected = false;
    this.commandQueue = [];
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.timeout = 5000; // 5 seconds
    this.debug = true;
    
    this.initializeListeners();
  }

  /**
   * 初始化消息监听器
   */
  initializeListeners() {
    // ⭐ AGENT_TODO: 处理来自 Reasonix Proxy 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.source === 'reasonix-proxy') {
        this.handleProxyMessage(request, sender, sendResponse);
        return true; // 异步响应
      }
    });

    // ⭐ AGENT_FEATURE: 监控标签页变化
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.onTabChange(activeInfo.tabId);
    });

    this.log('✅ Reasonix Agent 已初始化');
  }

  /**
   * 处理来自 Proxy 的消息
   * @param {Object} request 请求对象
   * @param {Object} sender 发送者信息
   * @param {Function} sendResponse 响应函数
   */
  async handleProxyMessage(request, sender, sendResponse) {
    const { command, params, requestId } = request;
    
    this.log(`📨 收到命令: ${command}`, params);

    try {
      const result = await this.executeCommand(command, params);
      sendResponse({ success: true, result, requestId });
      this.log(`✅ 命令完成: ${command}`);
    } catch (error) {
      this.log(`❌ 命令失败: ${command}`, error.message);
      sendResponse({ success: false, error: error.message, requestId });
    }
  }

  /**
   * 执行 Reasonix 命令
   * @param {string} command 命令名称
   * @param {Object} params 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeCommand(command, params = {}) {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('没有活动的标签页');
    }

    switch (command) {
      // ⭐ AGENT_TODO: 获取页面内容
      case 'get_page_content':
        return await this.getPageContent(tab.id);

      // ⭐ AGENT_TODO: 执行脚本
      case 'execute_script':
        return await this.executeScript(tab.id, params.code);

      // ⭐ AGENT_TODO: 修改 DOM
      case 'modify_dom':
        return await this.modifyDOM(tab.id, params);

      // ⭐ AGENT_TODO: 翻译文本
      case 'translate':
        return await this.translateText(params.text, params.target_lang);

      // ⭐ AGENT_TODO: 控制视频
      case 'video_control':
        return await this.videoControl(tab.id, params);

      // ⭐ AGENT_TODO: 下载文件
      case 'download_file':
        return await this.downloadFile(params.url, params.filename);

      // ⭐ AGENT_TODO: 获取页面信息
      case 'get_page_info':
        return await this.getPageInfo(tab.id);

      // ⭐ AGENT_TODO: 隐藏广告
      case 'hide_ads':
        return await this.hideAds(tab.id);

      // ⭐ AGENT_TODO: 获取截图
      case 'screenshot':
        return await this.takeScreenshot(tab.id);

      // ⭐ AGENT_TODO: 获取扩展状态
      case 'get_status':
        return this.getStatus();

      default:
        throw new Error(`未知命令: ${command}`);
    }
  }

  /**
   * 获取页面内容
   */
  async getPageContent(tabId) {
    const result = await chrome.tabs.sendMessage(tabId, {
      action: 'reasonix_get_content'
    });
    return result;
  }

  /**
   * 执行 JavaScript 代码
   */
  async executeScript(tabId, code) {
    try {
      const result = await chrome.tabs.executeScript(tabId, {
        code: `(${code})()`
      });
      return { result: result[0] };
    } catch (error) {
      throw new Error(`脚本执行失败: ${error.message}`);
    }
  }

  /**
   * 修改 DOM
   */
  async modifyDOM(tabId, params) {
    const { selector, action, value } = params;
    
    const result = await chrome.tabs.sendMessage(tabId, {
      action: 'reasonix_modify_dom',
      selector,
      domAction: action,
      value
    });
    return result;
  }

  /**
   * 翻译文本（使用 Groq API）
   */
  async translateText(text, targetLang) {
    // ⭐ AGENT_TODO: 实现 Groq API 调用
    const apiKey = await this.getApiKey();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{
          role: 'user',
          content: `请翻译为${targetLang}，只返回翻译结果:\n\n${text}`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`翻译失败: ${data.error?.message}`);
    }

    return {
      translated: data.choices[0].message.content,
      source_lang: 'auto',
      target_lang: targetLang
    };
  }

  /**
   * 视频控制
   */
  async videoControl(tabId, params) {
    const { action, rate } = params;

    const result = await chrome.tabs.sendMessage(tabId, {
      action: 'reasonix_video_control',
      videoAction: action,
      rate
    });
    return result;
  }

  /**
   * 下载文件
   */
  async downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url,
        filename: filename || url.split('/').pop()
      }, (downloadId) => {
        if (downloadId) {
          resolve({ downloadId, filename });
        } else {
          reject(new Error('下载失败'));
        }
      });
    });
  }

  /**
   * 获取页面信息
   */
  async getPageInfo(tabId) {
    const [tab] = await chrome.tabs.query({ active: true });
    
    const info = await chrome.tabs.sendMessage(tabId, {
      action: 'reasonix_get_page_info'
    });

    return {
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl,
      ...info
    };
  }

  /**
   * 隐藏广告
   */
  async hideAds(tabId) {
    const result = await chrome.tabs.sendMessage(tabId, {
      action: 'reasonix_hide_ads'
    });
    return result;
  }

  /**
   * 获取截图
   */
  async takeScreenshot(tabId) {
    const screenshot = await chrome.tabs.captureVisibleTab();
    return { screenshot };
  }

  /**
   * 获取扩展状态
   */
  getStatus() {
    return {
      agent: 'reasonix',
      version: '1.0.0',
      status: 'ready',
      connected: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 从存储中获取 API Key
   */
  async getApiKey() {
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
      throw new Error('API Key 未配置');
    }
    return apiKey;
  }

  /**
   * 当标签页变化时
   */
  onTabChange(tabId) {
    this.log(`📑 标签页已切换: ${tabId}`);
  }

  /**
   * 调试日志
   */
  log(...args) {
    if (this.debug) {
      console.log('[ReasonixAgent]', ...args);
    }
  }
}

// 初始化 Reasonix Agent
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const reasonixAgent = new ReasonixAgent();
  console.log('🤖 Reasonix Agent 已启动');
}
