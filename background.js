// Service Worker for Antigravity Browser Agent v2.1.0 (MV3 Event-Driven & Gemini API Bridge)

const BRIDGE_WS_URL = 'ws://127.0.0.1:8766';
const BRIDGE_POLL_URL = 'http://127.0.0.1:8765/extension/poll';
const BRIDGE_RESPONSE_URL = 'http://127.0.0.1:8765/extension/response';

let wsSocket = null;
let isWsConnected = false;

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.error('Error setting panel behavior:', err);
    });
  }
  chrome.alarms.create('keepAliveBridge', { periodInMinutes: 0.25 });
  console.log('Antigravity Browser Agent v2.1.0 Service Worker installed.');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAliveBridge') {
    initWebSocketBridge();
    checkHTTPPollingFallback();
  }
});

async function getActiveWebTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs && tabs.length > 0 && tabs[0].url && (tabs[0].url.startsWith('http://') || tabs[0].url.startsWith('https://'))) {
    return tabs[0];
  }
  const allTabs = await chrome.tabs.query({});
  const activeWeb = allTabs.find(t => t.active && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
  if (activeWeb) return activeWeb;

  const webTab = allTabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
  return webTab || allTabs[0];
}

// Execute command on active Chrome tab
async function executeCommandOnTab(cmd) {
  const action = cmd.action;

  const activeTab = cmd.tabId ? (await chrome.tabs.get(cmd.tabId).catch(() => null)) : (await getActiveWebTab());

  if (action === 'GET_ALL_TABS') {
    const tabs = await chrome.tabs.query({});
    return { success: true, tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active })) };
  }

  if (action === 'NAVIGATE') {
    if (activeTab && activeTab.id) {
      await chrome.tabs.update(activeTab.id, { url: cmd.url });
      return { success: true, url: cmd.url };
    } else {
      const newTab = await chrome.tabs.create({ url: cmd.url, active: true });
      return { success: true, tabId: newTab.id, url: cmd.url };
    }
  }

  if (!activeTab || !activeTab.id) {
    return { success: false, error: 'Nenhuma aba ativa encontrada.' };
  }

  // Send action message directly to content.js
  try {
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTab.id, {
        action: action,
        target: cmd.target || cmd.selector || cmd.id,
        text: cmd.text,
        distance: cmd.distance,
        actions: cmd.actions
      }, (res) => {
        if (chrome.runtime.lastError || !res) {
          // Fallback: inject content script if not already injected
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
          }).then(() => {
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id, {
                action: action,
                target: cmd.target || cmd.selector || cmd.id,
                text: cmd.text,
                distance: cmd.distance,
                actions: cmd.actions
              }, (retryRes) => {
                resolve(retryRes || { success: false, error: 'Sem resposta do script de conteúdo.' });
              });
            }, 100);
          }).catch(err => resolve({ success: false, error: err.message }));
        } else {
          resolve(res);
        }
      });
    });

    return {
      title: activeTab.title,
      url: activeTab.url,
      ...response
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// WebSocket Realtime Connection (Latency < 30ms, Safe MV3 initialization)
function initWebSocketBridge() {
  if (wsSocket && (wsSocket.readyState === WebSocket.OPEN || wsSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    wsSocket = new WebSocket(BRIDGE_WS_URL);

    wsSocket.onopen = () => {
      isWsConnected = true;
      console.log('⚡ Conectado ao Antigravity Bridge Server via WebSocket.');
    };

    wsSocket.onmessage = async (event) => {
      try {
        const cmd = JSON.parse(event.data);
        if (cmd && cmd.id && cmd.action) {
          const result = await executeCommandOnTab(cmd);
          wsSocket.send(JSON.stringify({ id: cmd.id, result }));
        }
      } catch (err) {
        console.error('Erro no processamento WS:', err);
      }
    };

    wsSocket.onclose = () => {
      isWsConnected = false;
    };

    wsSocket.onerror = () => {
      isWsConnected = false;
    };
  } catch (e) {
    isWsConnected = false;
  }
}

// Single non-blocking HTTP Polling Check for Service Worker (No infinite loops)
async function checkHTTPPollingFallback() {
  if (isWsConnected) return;

  try {
    const res = await fetch(BRIDGE_POLL_URL).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.hasCommand && data.command) {
        const cmd = data.command;
        const resultData = await executeCommandOnTab(cmd);
        await fetch(BRIDGE_RESPONSE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cmd.id, result: resultData })
        }).catch(() => {});
      }
    }
  } catch (err) {}
}

// Initialize bridge safely on startup
initWebSocketBridge();

// Message listener for popup, sidepanel, and Gemini API/Web Bridge handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_WS_STATUS') {
    sendResponse({ connected: isWsConnected });
    return true;
  }

  if (message.action === 'CAPTURE_VISIBLE_TAB') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Falha ao capturar imagem da aba' });
      } else {
        sendResponse({ success: true, dataUrl: dataUrl });
      }
    });
    return true;
  }

  if (message.action === 'CALL_GEMINI_API') {
    (async () => {
      try {
        const { apiKey, model, prompt, systemInstruction, imageBase64 } = message;
        if (!apiKey) {
          sendResponse({ success: false, error: 'Chave de API do Gemini não informada.' });
          return;
        }

        const modelName = model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const contents = [];
        const parts = [{ text: prompt }];

        if (imageBase64) {
          const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          });
        }

        contents.push({ parts });

        const requestBody = { contents };
        if (systemInstruction) {
          requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          sendResponse({ success: false, error: errData.error?.message || `Erro da API Gemini HTTP ${response.status}` });
          return;
        }

        const resData = await response.json();
        const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResult) {
          sendResponse({ success: true, text: textResult });
        } else {
          sendResponse({ success: false, error: 'Resposta vazia ou sem texto da API Gemini.' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'CHECK_WEB_SESSION_STATUS') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const geminiTab = tabs.find(t => t.url && t.url.includes('gemini.google.com'));

        if (!geminiTab || !geminiTab.id) {
          sendResponse({ success: true, isLoggedIn: false, reason: 'Aba gemini.google.com não aberta' });
          return;
        }

        chrome.tabs.sendMessage(geminiTab.id, { action: 'CHECK_GEMINI_LOGIN' }, (res) => {
          if (chrome.runtime.lastError || !res) {
            sendResponse({ success: true, isLoggedIn: false });
          } else {
            sendResponse({ success: true, isLoggedIn: res.isLoggedIn });
          }
        });
      } catch (err) {
        sendResponse({ success: false, isLoggedIn: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'CALL_GEMINI_WEB_BRIDGE') {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        let geminiTab = tabs.find(t => t.url && t.url.includes('gemini.google.com'));

        if (!geminiTab) {
          geminiTab = await chrome.tabs.create({ url: 'https://gemini.google.com/app', active: false });
          await new Promise(r => setTimeout(r, 4000));
        }

        chrome.tabs.sendMessage(geminiTab.id, {
          action: 'EXECUTE_GEMINI_WEB_PROMPT',
          prompt: message.prompt
        }, (res) => {
          if (chrome.runtime.lastError || !res) {
            sendResponse({ success: false, error: 'Sem resposta da aba gemini.google.com. Verifique se você está logado na conta Google Gemini.' });
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
});
