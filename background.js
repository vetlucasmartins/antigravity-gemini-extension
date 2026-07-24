// Service Worker for Antigravity Browser Agent v1.6.0 (Gemini 3 Series Active Models)

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.error('Error setting panel behavior:', err);
    });
  }
  chrome.alarms.create('keepAliveBridge', { periodInMinutes: 0.5 });
  console.log('Antigravity Browser Agent initialized (Gemini Web & Gemini 2.0 Flash ready).');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAliveBridge') {
    startIDEBridgePolling();
  }
});

async function getActiveWebTab() {
  const tabs = await chrome.tabs.query({});
  const linkedinTab = tabs.find(t => t.url && t.url.includes('linkedin.com'));
  if (linkedinTab) return linkedinTab;

  const activeWeb = tabs.find(t => t.active && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
  if (activeWeb) return activeWeb;

  const webTab = tabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
  return webTab || tabs[0];
}

// Local IDE Bridge polling loop (localhost:8765)
async function startIDEBridgePolling() {
  const BRIDGE_POLL_URL = 'http://127.0.0.1:8765/extension/poll';
  const BRIDGE_RESPONSE_URL = 'http://127.0.0.1:8765/extension/response';

  while (true) {
    try {
      const res = await fetch(BRIDGE_POLL_URL).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.hasCommand && data.command) {
          const cmd = data.command;
          const cmdId = cmd.id;
          const action = cmd.action;

          let resultData = { success: false, error: 'Aba não encontrada ou sem resposta' };

          const activeTab = cmd.tabId ? (await chrome.tabs.get(cmd.tabId).catch(() => null)) : (await getActiveWebTab());

          if (action === 'GET_ALL_TABS') {
            const tabs = await chrome.tabs.query({});
            resultData = { success: true, tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active })) };
          } else if (action === 'NAVIGATE') {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && activeTab.id) {
              await chrome.tabs.update(activeTab.id, { url: cmd.url });
              resultData = { success: true, url: cmd.url };
            } else {
              const newTab = await chrome.tabs.create({ url: cmd.url, active: true });
              resultData = { success: true, tabId: newTab.id, url: cmd.url };
            }
          } else if (action === 'GET_PAGE_CONTEXT') {
            if (activeTab && activeTab.id) {
              try {
                const execRes = await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  func: () => {
                    const bodyClone = document.body.cloneNode(true);
                    const removeEls = bodyClone.querySelectorAll('script, style, noscript, svg');
                    removeEls.forEach(e => e.remove());
                    return {
                      selectedText: window.getSelection() ? window.getSelection().toString().trim() : '',
                      pageText: bodyClone.innerText.replace(/\n\s*\n/g, '\n').slice(0, 15000)
                    };
                  }
                });
                const inner = (execRes && execRes[0] && execRes[0].result) || {};
                resultData = {
                  success: true,
                  title: activeTab.title || document.title || 'Untitled Tab',
                  url: activeTab.url || 'https://www.linkedin.com',
                  selectedText: inner.selectedText || '',
                  pageText: inner.pageText || ''
                };
              } catch (e) {
                resultData = {
                  success: true,
                  title: activeTab.title || 'Untitled Tab',
                  url: activeTab.url || 'https://www.linkedin.com',
                  error: e.message,
                  pageText: ''
                };
              }
            }
          } else if (action === 'CAPTURE_VISIBLE_TAB') {
            if (activeTab && activeTab.windowId) {
              const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'png' });
              resultData = { success: true, dataUrl, title: activeTab.title, url: activeTab.url };
            }
          } else if (action === 'AUTOMATE_CLICK') {
            if (activeTab && activeTab.id) {
              try {
                const execRes = await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  args: [cmd.target || ''],
                  func: (targetStr) => {
                    let el = targetStr ? document.querySelector(targetStr) : null;
                    if (!el && targetStr) {
                      const allClickables = Array.from(document.querySelectorAll('button, a, input[type="submit"], div[role="button"], span[role="button"], li'));
                      el = allClickables.find(item => item.innerText && item.innerText.trim().toLowerCase().includes(targetStr.toLowerCase()));
                    }
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.click();
                      return { success: true, element: el.tagName, text: el.innerText ? el.innerText.slice(0, 50) : '' };
                    }
                    return { success: false, error: 'Elemento não encontrado' };
                  }
                });
                resultData = (execRes && execRes[0] && execRes[0].result) || { success: false };
              } catch (e) {
                resultData = { success: false, error: e.message };
              }
            }
          } else if (action === 'AUTOMATE_TYPE') {
            if (activeTab && activeTab.id) {
              try {
                const execRes = await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  args: [cmd.selector || '', cmd.text || ''],
                  func: (selectorStr, textStr) => {
                    let el = selectorStr ? document.querySelector(selectorStr) : document.activeElement;
                    if (!el || el === document.body) {
                      el = document.querySelector('input[type="text"]') || document.querySelector('textarea') || document.querySelector('div[contenteditable="true"]');
                    }
                    if (!el) return { success: false, error: 'Campo de texto não encontrado' };
                    el.focus();
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                      el.value = textStr;
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                      try {
                        document.execCommand('insertText', false, textStr);
                      } catch (e) {
                        el.innerText = textStr;
                      }
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    return { success: true, target: el.tagName };
                  }
                });
                resultData = (execRes && execRes[0] && execRes[0].result) || { success: false };
              } catch (e) {
                resultData = { success: false, error: e.message };
              }
            }
          } else if (action === 'AUTOMATE_SCROLL') {
            if (activeTab && activeTab.id) {
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  args: [cmd.distance || 500],
                  func: (dist) => window.scrollBy({ top: dist, behavior: 'smooth' })
                });
                resultData = { success: true };
              } catch (e) {
                resultData = { success: false, error: e.message };
              }
            }
          }

          await fetch(BRIDGE_RESPONSE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cmdId, result: resultData || { success: true } })
          }).catch(() => {});
        }
      }
    } catch (err) {}
    await new Promise(r => setTimeout(r, 1500));
  }
}

startIDEBridgePolling();

// Helper to check Gemini Web Session
async function checkGeminiWebSession() {
  const tabs = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
  if (!tabs || tabs.length === 0) {
    return { success: false, isLoggedIn: false, error: 'Aba gemini.google.com não aberta.' };
  }

  const geminiTab = tabs[0];

  try {
    await chrome.scripting.executeScript({
      target: { tabId: geminiTab.id },
      files: ['gemini_bridge.js']
    });
  } catch (e) {}

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(geminiTab.id, { action: 'CHECK_GEMINI_LOGIN' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        resolve({ success: false, isLoggedIn: false, error: 'Sessão inacessível na aba do Gemini Web. Clique em "Abrir gemini.google.com".' });
      } else {
        resolve(res);
      }
    });
  });
}

// Listener for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CHECK_WEB_SESSION_STATUS') {
    (async () => {
      const status = await checkGeminiWebSession();
      sendResponse(status);
    })();
    return true;
  }

  if (message.action === 'CAPTURE_VISIBLE_TAB') {
    (async () => {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab || !activeTab.id || activeTab.url.startsWith('chrome://')) {
          sendResponse({ success: false, error: 'Aba protegida do sistema.' });
          return;
        }
        const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'png' });
        sendResponse({ success: true, dataUrl, tabTitle: activeTab.title, tabUrl: activeTab.url });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'CALL_GEMINI_WEB_BRIDGE') {
    (async () => {
      try {
        const { prompt } = message;

        const tabs = await chrome.tabs.query({ url: '*://gemini.google.com/*' });
        let geminiTab = tabs[0];

        if (!geminiTab) {
          geminiTab = await chrome.tabs.create({ url: 'https://gemini.google.com/app', active: true });
          await new Promise(r => setTimeout(r, 4500));
        }

        try {
          await chrome.scripting.executeScript({
            target: { tabId: geminiTab.id },
            files: ['gemini_bridge.js']
          });
        } catch (e) {}

        await new Promise(r => setTimeout(r, 800));

        chrome.tabs.sendMessage(geminiTab.id, { action: 'EXECUTE_GEMINI_WEB_PROMPT', prompt }, (res) => {
          if (chrome.runtime.lastError || !res) {
            sendResponse({
              success: false,
              error: 'Não foi possível conectar com a aba gemini.google.com. Faça o login em gemini.google.com.'
            });
          } else {
            sendResponse(res);
          }
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Handle Gemini API Mode with Gemini 3 Series active endpoints
  if (message.action === 'CALL_GEMINI_API') {
    (async () => {
      try {
        let { apiKey, prompt, systemInstruction, imageBase64, model = 'gemini-2.0-flash' } = message;
        
        if (!apiKey) {
          sendResponse({ success: false, error: 'Chave de API do Gemini não informada.' });
          return;
        }

        // Active Gemini models
        const validModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        if (!validModels.includes(model)) {
          model = 'gemini-2.0-flash';
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const parts = [];
        if (systemInstruction) {
          parts.push({ text: `[SYSTEM INSTRUCTION]: ${systemInstruction}` });
        }
        parts.push({ text: prompt });

        if (imageBase64) {
          const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
          parts.push({
            inline_data: {
              mime_type: 'image/png',
              data: base64Data
            }
          });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        const result = await response.json();

        if (!response.ok) {
          const errMsg = result.error?.message || `HTTP ${response.status}`;
          sendResponse({ success: false, error: `Erro na API do Gemini: ${errMsg}` });
          return;
        }

        const candidate = result.candidates?.[0];
        const responseText = candidate?.content?.parts?.map(p => p.text).join('') || 'Sem resposta retornada.';

        sendResponse({ success: true, text: responseText, raw: result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
