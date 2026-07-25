// Service Worker for Antigravity Browser Agent v2.0.0 (WebSocket + High-Speed Universal Bridge)

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
  chrome.alarms.create('keepAliveBridge', { periodInMinutes: 0.5 });
  console.log('Antigravity Browser Agent initialized (Universal A11y & WebSocket ready).');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAliveBridge') {
    initWebSocketBridge();
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
  let resultData = { success: false, error: 'Aba não encontrada ou sem resposta' };

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

// WebSocket Realtime Connection (Latency < 30ms)
function initWebSocketBridge() {
  if (wsSocket && (wsSocket.readyState === WebSocket.OPEN || wsSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    wsSocket = new WebSocket(BRIDGE_WS_URL);

    wsSocket.onopen = () => {
      isWsConnected = true;
      console.log('⚡ Conectado ao Antigravity Bridge Server via WebSocket (Baixa Latência).');
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
      setTimeout(initWebSocketBridge, 3000);
    };

    wsSocket.onerror = () => {
      isWsConnected = false;
    };
  } catch (e) {
    isWsConnected = false;
  }
}

// HTTP Polling Fallback (Runs if WS is offline)
async function startHTTPPollingFallback() {
  while (true) {
    if (!isWsConnected) {
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
    await new Promise(r => setTimeout(r, isWsConnected ? 5000 : 1500));
  }
}

initWebSocketBridge();
startHTTPPollingFallback();

// Message listener for popup/sidepanel UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_WS_STATUS') {
    sendResponse({ connected: isWsConnected });
    return true;
  }
});
