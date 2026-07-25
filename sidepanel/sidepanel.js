// Antigravity Browser Agent - Sidepanel Logic v1.7.0 (Autonomous Computer Use Loop)

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
  const settingsDrawer = document.getElementById('settings-drawer');
  const engineModeSelect = document.getElementById('engine-mode-select');
  const sessionVerificationBox = document.getElementById('session-verification-box');
  const sessionStatusBadge = document.getElementById('session-status-badge');
  const openGeminiBtn = document.getElementById('open-gemini-btn');
  const apiKeyContainer = document.getElementById('api-key-container');
  const apiKeyInput = document.getElementById('api-key-input');
  const modelSelectContainer = document.getElementById('model-select-container');
  const modelSelect = document.getElementById('model-select');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const settingsStatus = document.getElementById('settings-status');

  const segmentBtns = document.querySelectorAll('.segment-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const tabTitleDisplay = document.getElementById('tab-title-display');
  const tabUrlDisplay = document.getElementById('tab-url-display');
  const selectedTextBadge = document.getElementById('selected-text-badge');
  const refreshContextBtn = document.getElementById('refresh-context-btn');

  const includeTextCheck = document.getElementById('include-text-check');
  const includeScreenshotCheck = document.getElementById('include-screenshot-check');
  const autoLoopCheck = document.getElementById('auto-loop-check');
  const chatInput = document.getElementById('chat-input');
  const sendChatBtn = document.getElementById('send-chat-btn');
  const chatMessages = document.getElementById('chat-messages');

  const askInput = document.getElementById('ask-input');
  const sendAskBtn = document.getElementById('send-ask-btn');
  const askMessages = document.getElementById('ask-messages');

  const outputSection = document.getElementById('output-section');
  const outputContent = document.getElementById('output-content');
  const copyOutputBtn = document.getElementById('copy-output-btn');
  const insertOutputBtn = document.getElementById('insert-output-btn');

  const footerStatus = document.getElementById('footer-status');
  const modelBadge = document.getElementById('model-badge');
  const engineStatusPill = document.getElementById('engine-status-pill');

  // Automations Cards
  const wfAutoLoop = document.getElementById('wf-auto-loop');
  const wfAutoFill = document.getElementById('wf-auto-fill');
  const wfPageSummary = document.getElementById('wf-page-summary');
  const wfDataExtractor = document.getElementById('wf-data-extractor');
  const wfMsgReply = document.getElementById('wf-msg-reply');

  let currentTabContext = null;
  let storedEngineMode = 'web_bridge';
  let storedApiKey = '';
  let storedModel = 'gemini-2.5-flash';

  async function getActiveWebTab() {
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://'))) || tabs[0];
  }

  function updateModeUI() {
    if (engineModeSelect.value === 'api') {
      apiKeyContainer.classList.remove('hidden');
      modelSelectContainer.classList.remove('hidden');
      sessionVerificationBox.classList.add('hidden');
    } else {
      apiKeyContainer.classList.add('hidden');
      modelSelectContainer.classList.add('hidden');
      sessionVerificationBox.classList.remove('hidden');
    }
  }

  engineModeSelect.addEventListener('change', updateModeUI);

  if (openGeminiBtn) {
    openGeminiBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://gemini.google.com/app' });
    });
  }

  async function saveChatMessageToMemory(role, text) {
    try {
      const data = await chrome.storage.local.get(['antigravity_task_history']);
      const history = data.antigravity_task_history || [];
      history.push({
        id: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        role: role,
        text: text
      });
      await chrome.storage.local.set({ antigravity_task_history: history.slice(-100) });
    } catch (e) {}
  }

  async function logToPersistentBridgeMemory(logData) {
    try {
      await fetch('http://127.0.0.1:8765/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: logData.category || 'Automação Extensão',
          prompt: logData.prompt || '',
          actions: logData.actions || '',
          status: logData.status || 'Concluído',
          result_summary: logData.result_summary || '',
          url: logData.url || (currentTabContext ? currentTabContext.url : ''),
          notes: logData.notes || 'Painel da Extensão'
        })
      });
    } catch (e) {}
  }

  async function loadChatMemory() {
    try {
      const data = await chrome.storage.local.get(['antigravity_task_history']);
      const history = data.antigravity_task_history || [];
      if (history.length > 0) {
        history.forEach(item => {
          if (item.role === 'user') {
            const userDiv = document.createElement('div');
            userDiv.className = 'chat-msg user';
            userDiv.textContent = item.text;
            chatMessages.appendChild(userDiv);
          } else if (item.role === 'agent') {
            const agentDiv = document.createElement('div');
            agentDiv.className = 'chat-msg agent';
            agentDiv.textContent = item.text;
            chatMessages.appendChild(agentDiv);
          } else if (item.role === 'system') {
            const sysDiv = document.createElement('div');
            sysDiv.className = 'chat-msg system';
            sysDiv.textContent = item.text;
            chatMessages.appendChild(sysDiv);
          }
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } catch (e) {}
  }

  function appendUserMsg(text) {
    if (chatMessages.lastElementChild && chatMessages.lastElementChild.textContent === text && chatMessages.lastElementChild.classList.contains('user')) {
      return chatMessages.lastElementChild;
    }
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveChatMessageToMemory('user', text);
    return userDiv;
  }

  function appendAgentMsg(text) {
    if (chatMessages.lastElementChild && chatMessages.lastElementChild.textContent === text && chatMessages.lastElementChild.classList.contains('agent')) {
      return chatMessages.lastElementChild;
    }
    const agentDiv = document.createElement('div');
    agentDiv.className = 'chat-msg agent';
    agentDiv.textContent = text;
    chatMessages.appendChild(agentDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveChatMessageToMemory('agent', text);
    return agentDiv;
  }

  function appendSystemMsg(text) {
    if (chatMessages.lastElementChild && chatMessages.lastElementChild.textContent === text && chatMessages.lastElementChild.classList.contains('system')) {
      return chatMessages.lastElementChild;
    }
    const sysDiv = document.createElement('div');
    sysDiv.className = 'chat-msg system';
    sysDiv.textContent = text;
    chatMessages.appendChild(sysDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveChatMessageToMemory('system', text);
    return sysDiv;
  }

  function appendThoughtMsg(text) {
    if (chatMessages.lastElementChild && chatMessages.lastElementChild.textContent === text && chatMessages.lastElementChild.classList.contains('thought')) {
      return chatMessages.lastElementChild;
    }
    const thoughtDiv = document.createElement('div');
    thoughtDiv.className = 'chat-msg thought';
    thoughtDiv.textContent = text;
    chatMessages.appendChild(thoughtDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return thoughtDiv;
  }

  function appendCorrectionMsg(text) {
    if (chatMessages.lastElementChild && chatMessages.lastElementChild.textContent === text && chatMessages.lastElementChild.classList.contains('correction')) {
      return chatMessages.lastElementChild;
    }
    const corrDiv = document.createElement('div');
    corrDiv.className = 'chat-msg correction';
    corrDiv.textContent = text;
    chatMessages.appendChild(corrDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return corrDiv;
  }

  function appendAskUserMsg(text) {
    if (!askMessages) return null;
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = text;
    askMessages.appendChild(userDiv);
    askMessages.scrollTop = askMessages.scrollHeight;
    return userDiv;
  }

  function appendAskGeminiMsg(text) {
    if (!askMessages) return null;
    const geminiDiv = document.createElement('div');
    geminiDiv.className = 'chat-msg agent';
    geminiDiv.textContent = text;
    askMessages.appendChild(geminiDiv);
    askMessages.scrollTop = askMessages.scrollHeight;
    return geminiDiv;
  }

  // Check Web Session Login State
  async function verifyWebSession() {
    sessionStatusBadge.textContent = 'Checking session...';
    sessionStatusBadge.className = 'session-status';

    const res = await new Promise(r => chrome.runtime.sendMessage({ action: 'CHECK_WEB_SESSION_STATUS' }, r));
    
    if (res && res.isLoggedIn) {
      sessionStatusBadge.textContent = 'Verified (Active Session)';
      sessionStatusBadge.className = 'session-status verified';
      return true;
    } else {
      sessionStatusBadge.textContent = 'Sign-in Required (open gemini.google.com)';
      sessionStatusBadge.className = 'session-status unverified';
      return false;
    }
  }

  // 1. Load Settings
  async function loadSettings() {
    const data = await chrome.storage.local.get(['engineMode', 'geminiApiKey', 'geminiModel']);
    if (data.engineMode) {
      storedEngineMode = data.engineMode;
      engineModeSelect.value = storedEngineMode;
    } else {
      engineModeSelect.value = 'web_bridge';
      storedEngineMode = 'web_bridge';
    }
    updateModeUI();

    if (data.geminiApiKey) {
      storedApiKey = data.geminiApiKey;
      apiKeyInput.value = storedApiKey;
    }

    if (data.geminiModel) {
      storedModel = data.geminiModel;
      modelSelect.value = storedModel;
    }

    if (storedEngineMode === 'web_bridge') {
      engineStatusPill.textContent = 'Gemini Web';
      footerStatus.textContent = 'Mode: Web Session';
      modelBadge.textContent = 'Gemini Web';
      await verifyWebSession();
    } else {
      engineStatusPill.textContent = 'API Direct';
      footerStatus.textContent = storedApiKey ? 'Mode: API Active' : 'Mode: API Key Required';
      modelBadge.textContent = storedModel;
    }
  }

  await loadSettings();
  await loadChatMemory();

  toggleSettingsBtn.addEventListener('click', async () => {
    settingsDrawer.classList.toggle('hidden');
    if (!settingsDrawer.classList.contains('hidden') && engineModeSelect.value === 'web_bridge') {
      await verifyWebSession();
    }
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const mode = engineModeSelect.value;
    const key = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (mode === 'api' && !key) {
      settingsStatus.textContent = 'Por favor, informe sua chave da API do Gemini.';
      settingsStatus.style.color = '#ef4444';
      return;
    }

    await chrome.storage.local.set({ engineMode: mode, geminiApiKey: key, geminiModel: selectedModel });
    storedEngineMode = mode;
    storedApiKey = key;
    storedModel = selectedModel;

    settingsStatus.textContent = 'Configurações salvas!';
    settingsStatus.style.color = '#10b981';

    if (mode === 'web_bridge') {
      engineStatusPill.textContent = 'Gemini Web';
      footerStatus.textContent = 'Mode: Web Session';
      modelBadge.textContent = 'Gemini Web';
      await verifyWebSession();
    } else {
      engineStatusPill.textContent = 'API Direct';
      footerStatus.textContent = 'Mode: API Active';
      modelBadge.textContent = selectedModel;
    }

    setTimeout(() => {
      settingsDrawer.classList.add('hidden');
      settingsStatus.textContent = '';
    }, 1000);
  });

  // 2. Segment Navigation
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = btn.dataset.tab;
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // 3. Active Page Context
  async function refreshPageContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      tabTitleDisplay.textContent = tab.title || 'Untitled Tab';
      tabUrlDisplay.textContent = tab.url || 'chrome://';

      chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_CONTEXT' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          currentTabContext = {
            title: tab.title,
            url: tab.url,
            selectedText: '',
            pageText: ''
          };
          selectedTextBadge.classList.add('hidden');
        } else {
          currentTabContext = response;
          if (response.selectedText) {
            selectedTextBadge.classList.remove('hidden');
            selectedTextBadge.textContent = `Selected: "${response.selectedText.slice(0, 35)}..."`;
          } else {
            selectedTextBadge.classList.add('hidden');
          }
        }
      });
    } catch (err) {
      console.error('Context refresh error:', err);
    }
  }

  refreshContextBtn.addEventListener('click', refreshPageContext);
  await refreshPageContext();

  async function fetchRecentMemoryHistory() {
    try {
      const res = await fetch('http://127.0.0.1:8765/api/history').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          return data.history;
        }
      }
    } catch (e) {}
    try {
      const local = await chrome.storage.local.get(['antigravity_task_history']);
      return local.antigravity_task_history || [];
    } catch (e) {
      return [];
    }
  }

  // 4. Autonomous Computer Use Vision & Chain-of-Thought Diagnostic Loop Engine
  async function runAutonomousComputerUseLoop(userGoal) {
    const maxSteps = 10;
    let step = 0;
    let isDone = false;
    let lastActionResult = null;
    let previousActionsHistory = [];

    appendSystemMsg(`🤖 Loop Agêntico Autônomo Iniciado: "${userGoal}"`);

    const recentHistory = await fetchRecentMemoryHistory();
    let memoryContextStr = '';
    if (recentHistory && recentHistory.length > 0) {
      const recentItems = recentHistory.slice(-4).map(h => 
        `• ${h.Categoria || h.role || 'Ação'}: ${((h['Instrução / Prompt'] || h.text || h.actions || '')).slice(0, 60)} (${h.Status || 'OK'})`
      ).join(' | ');
      memoryContextStr = `[HISTÓRICO RECENTE]: ${recentItems}\n`;
    }

    while (step < maxSteps && !isDone) {
      step++;
      footerStatus.textContent = `Status: Loop Autônomo (Passo ${step}/${maxSteps})...`;

      await refreshPageContext();
      let screenshotBase64 = null;

      if (includeScreenshotCheck.checked && storedEngineMode === 'api') {
        const screenshotRes = await new Promise(r => chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, r));
        if (screenshotRes && screenshotRes.success) {
          screenshotBase64 = screenshotRes.dataUrl;
        }
      }

      // Format previous execution feedback & detect repeated failure loops
      let actionFeedbackStr = '';
      if (lastActionResult) {
        if (lastActionResult.success) {
          actionFeedbackStr = `\n[RESULTADO DA AÇÃO ANTERIOR]: Sucesso (${lastActionResult.action} em "${lastActionResult.target || 'N/A'}")`;
        } else {
          actionFeedbackStr = `\n⚠️ [FALHA NA AÇÃO ANTERIOR]: A ação "${lastActionResult.action}" em "${lastActionResult.target || 'N/A'}" falhou. Motivo: "${lastActionResult.error || 'Não encontrado ou invisível'}". Aplique sua estratégia de fallback!`;
        }
      }

      // Check for repeated action loops
      let loopWarningStr = '';
      const recentSameActionCount = previousActionsHistory.filter(a => lastActionResult && a.target === lastActionResult.target && a.action === lastActionResult.action).length;
      if (recentSameActionCount >= 2) {
        loopWarningStr = `\n🚨 [ALERTA DE DIAGNÓSTICO DE TRAVAMENTO]: A ação "${lastActionResult?.action}" no elemento "${lastActionResult?.target}" falhou repetidamente. O elemento pode estar oculto por um modal, em um iframe ou ter ID dinâmico. Mude obrigatoriamente de estratégia: tente click_text, role a página ou use read_section.`;
      }

      const computerUseSystemInstruction = `Você é o Antigravity Autonomous Computer Use Agent (Universal Web Copilot Raciocinador). Seu objetivo é navegar e interagir autonomamente na aba ativa para cumprir a meta do usuário.
Você atua em QUALQUER site (Upwork, LinkedIn, X, Threads, plataformas de trabalho, etc.).
${memoryContextStr}
Instrução de Inteligência Raciocinadora (Chain-of-Thought):
A cada etapa, analise criticamente a tela antes de agir. Identifique o que mudou, formule um diagnóstico e planeje a próxima ação com uma estratégia secundária de reserva (fallback).

Responda EXCLUSIVAMENTE com um objeto JSON válido seguindo a estrutura:

{
  "thought": "Explicação analítica em português sobre o estado da tela, diagnóstico da etapa anterior e justificativa da próxima ação.",
  "observation": "O que você notou na tela (ex: modal aberto, campo limpo, botão desabilitado).",
  "action": "click" | "click_text" | "type" | "scroll" | "read_section" | "wait" | "done",
  "target": "ID do elemento ex: e1, e2, seletor CSS OU texto do botão/link se a ação for click_text",
  "text": "texto para digitar se a acao for type",
  "fallback_strategy": "Plano de reserva caso a ação principal falhe",
  "isDone": false
}`;

      const pageStructureStr = currentTabContext?.a11yTree || currentTabContext?.pageText || '(Estrutura de elementos não carregada)';
      const prompt = `[META GERAL DO USUÁRIO]: "${userGoal}"
[PÁGINA ATUAL]: ${currentTabContext?.title || 'N/A'} | URL: ${currentTabContext?.url || 'N/A'}
[ETAPA ATUAL]: ${step} de ${maxSteps}${actionFeedbackStr}${loopWarningStr}

[ESTRUTURA DE ELEMENTOS INTERATIVOS NA TELA]:
${pageStructureStr}`;

      let apiResponse = null;

      if (storedEngineMode === 'api' || storedApiKey) {
        const activeKey = apiKeyInput.value.trim() || storedApiKey;
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_API',
            apiKey: activeKey,
            model: storedModel,
            prompt: prompt,
            systemInstruction: computerUseSystemInstruction,
            imageBase64: screenshotBase64
          }, r);
        });
      } else {
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_WEB_BRIDGE',
            prompt: `${computerUseSystemInstruction}\n\n${prompt}`
          }, r);
        });
      }

      if (!apiResponse || !apiResponse.success) {
        appendAgentMsg(`❌ Erro na etapa ${step}: ${apiResponse?.error || 'Falha de comunicação com o modelo'}`);
        break;
      }

      let actionObj = null;
      try {
        const jsonMatch = apiResponse.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          actionObj = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {}

      // Natural language action fallback parser if Gemini responds conversationally
      if (!actionObj && apiResponse.text) {
        const textLower = apiResponse.text.toLowerCase();
        const clickMatch = apiResponse.text.match(/(?:clicar|clique|click)\s+(?:em|no|na|on|o|a)?\s*["'«`]?([^"'»`\.\n,]{2,40})["'»`]?/i);
        const typeMatch = apiResponse.text.match(/(?:digitar|escrever|type)\s*["'«`]?([^"'»`\.\n]{1,100})["'»`]?/i);
        const isScroll = textLower.includes('rolar') || textLower.includes('scroll');
        const isCompleted = textLower.includes('concluído') || textLower.includes('concluí') || textLower.includes('finished') || textLower.includes('done');

        if (clickMatch && clickMatch[1]) {
          actionObj = {
            thought: `Extraído raciocínio de texto conversacional: Clicando em "${clickMatch[1].trim()}"`,
            action: 'click_text',
            target: clickMatch[1].trim()
          };
        } else if (typeMatch && typeMatch[1]) {
          actionObj = {
            thought: `Extraído raciocínio de texto conversacional: Digitando no campo ativo`,
            action: 'type',
            text: typeMatch[1].trim()
          };
        } else if (isScroll) {
          actionObj = {
            thought: `Extraído raciocínio de texto conversacional: Rolando para revelar conteúdo`,
            action: 'scroll'
          };
        } else if (isCompleted) {
          actionObj = {
            thought: `Meta concluída conforme resposta conversacional`,
            action: 'done',
            isDone: true
          };
        }
      }

      if (!actionObj) {
        appendAgentMsg(`📍 [Etapa ${step}]: ${apiResponse.text}`);
        outputSection.classList.remove('hidden');
        outputContent.textContent = apiResponse.text;
        break;
      }

      // Display agent's internal thought process in the chat UI
      if (actionObj.thought) {
        appendThoughtMsg(`🧠 Raciocínio (Passo ${step}): ${actionObj.thought}`);
      }

      appendAgentMsg(`📍 [Etapa ${step}]: Executando ${actionObj.action} -> ${actionObj.target || actionObj.text || 'N/A'}`);
      outputSection.classList.remove('hidden');
      outputContent.textContent = `Ação: ${actionObj.action} | Alvo: ${actionObj.target || actionObj.text || 'N/A'}\nEstratégia Reserva: ${actionObj.fallback_strategy || 'N/A'}`;

      if (actionObj.isDone || actionObj.action === 'done') {
        isDone = true;
        footerStatus.textContent = 'Status: Meta Concluída!';
        appendSystemMsg(`✅ Meta Concluída com Sucesso!`);
        logToPersistentBridgeMemory({
          category: 'Loop Autônomo',
          prompt: userGoal,
          actions: `Concluído no passo ${step}/${maxSteps}`,
          status: 'Sucesso',
          result_summary: actionObj.thought || actionObj.explanation || 'Meta concluída',
          url: currentTabContext ? currentTabContext.url : ''
        });
        break;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        appendAgentMsg(`❌ Aba ativa não encontrada para executar a ação.`);
        break;
      }

      let stepResult = { success: false, error: 'Ação não reconhecida' };

      if (actionObj.action === 'click_coordinate' && actionObj.coordinate) {
        stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'CLICK_COORDINATE',
          x: actionObj.coordinate.x,
          y: actionObj.coordinate.y
        }, r));
      } else if (actionObj.action === 'click_text' && actionObj.target) {
        stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOMATE_CLICK_TEXT',
          target: actionObj.target
        }, r));
      } else if (actionObj.action === 'click' && actionObj.target) {
        stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOMATE_CLICK',
          target: actionObj.target
        }, r));

        // Auto-correction local fallback: if click by ID failed, try text search click
        if (!stepResult || !stepResult.success) {
          appendCorrectionMsg(`⚡ Auto-correção local: Clique por ID/seletor falhou. Tentando busca por texto "${actionObj.target}"...`);
          stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
            action: 'AUTOMATE_CLICK_TEXT',
            target: actionObj.target
          }, r));
        }
      } else if (actionObj.action === 'type' && (actionObj.text || actionObj.target)) {
        stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOMATE_TYPE',
          target: actionObj.target || '',
          text: actionObj.text || ''
        }, r));
      } else if (actionObj.action === 'read_section') {
        const readRes = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'READ_SECTION',
          target: actionObj.target
        }, r));
        stepResult = { success: true, text: readRes?.text || '' };
        if (readRes?.text) {
          appendAgentMsg(`📖 Conteúdo lido da seção:\n${readRes.text.slice(0, 300)}...`);
        }
      } else if (actionObj.action === 'wait') {
        await new Promise(r => setTimeout(r, 2000));
        stepResult = { success: true };
      } else if (actionObj.action === 'scroll') {
        stepResult = await new Promise(r => chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOMATE_SCROLL',
          distance: 500
        }, r));
      }

      lastActionResult = {
        action: actionObj.action,
        target: actionObj.target || actionObj.text || 'N/A',
        success: stepResult && stepResult.success,
        error: stepResult ? stepResult.error : 'Sem resposta do script de conteúdo'
      };

      previousActionsHistory.push(lastActionResult);

      logToPersistentBridgeMemory({
        category: 'Passo Autônomo',
        prompt: userGoal,
        actions: `${actionObj.action}: ${actionObj.target || actionObj.text || 'N/A'}`,
        status: lastActionResult.success ? 'Sucesso' : `Falha: ${lastActionResult.error}`,
        result_summary: actionObj.thought || '',
        url: tab ? tab.url : ''
      });

      // Short delay for DOM render before next step
      await new Promise(r => setTimeout(r, 1800));
    }
  }

  // 5. Execution Handler
  sendChatBtn.addEventListener('click', async () => {
    const msg = chatInput.value.trim();
    if (!msg) return;

    appendUserMsg(msg);
    chatInput.value = '';

    if (autoLoopCheck.checked) {
      await runAutonomousComputerUseLoop(msg);
    } else {
      const agentDiv = appendAgentMsg('Executing...');
      footerStatus.textContent = 'Status: Executing...';
      outputSection.classList.remove('hidden');
      outputContent.textContent = 'Processing request with active page context...';

      let screenshotBase64 = null;
      if (includeScreenshotCheck.checked && storedEngineMode === 'api') {
        const screenshotRes = await new Promise(r => chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' }, r));
        if (screenshotRes && screenshotRes.success) {
          screenshotBase64 = screenshotRes.dataUrl;
        }
      }

      await refreshPageContext();

      let fullPrompt = `[ACTIVE PAGE CONTEXT]:\nTitle: ${currentTabContext?.title || 'N/A'}\nURL: ${currentTabContext?.url || 'N/A'}\n`;
      if (currentTabContext?.selectedText) {
        fullPrompt += `[USER SELECTED TEXT]:\n"${currentTabContext.selectedText}"\n\n`;
      }
      if (includeTextCheck.checked && currentTabContext?.pageText) {
        fullPrompt += `[PAGE EXTRACTED TEXT]:\n${currentTabContext.pageText.slice(0, 2500)}\n\n`;
      }
      fullPrompt += `[USER INSTRUCTION]:\n${msg}`;

      let apiResponse = null;

      if (storedEngineMode === 'api' || storedApiKey) {
        const activeKey = apiKeyInput.value.trim() || storedApiKey;
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_API',
            apiKey: activeKey,
            model: storedModel,
            prompt: fullPrompt,
            systemInstruction: 'You are Antigravity Agent, powered by Google Gemini.',
            imageBase64: screenshotBase64
          }, r);
        });
      } else {
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_WEB_BRIDGE',
            prompt: fullPrompt
          }, r);
        });
      }

      if (apiResponse && apiResponse.success) {
        agentDiv.textContent = apiResponse.text;
        outputContent.textContent = apiResponse.text;
        footerStatus.textContent = 'Status: Execution complete';
      } else {
        agentDiv.textContent = `❌ ${apiResponse?.error || 'Erro na resposta do Gemini'}`;
        outputContent.textContent = `❌ ${apiResponse?.error || 'Erro na resposta do Gemini'}`;
        footerStatus.textContent = 'Status: Error';
      }
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatBtn.click();
    }
  });

  // 6. Direct Q&A Tirador de Dúvidas Handler (Gemini Direct Q&A Mode)
  if (sendAskBtn) {
    sendAskBtn.addEventListener('click', async () => {
      const question = askInput.value.trim();
      if (!question) return;

      appendAskUserMsg(question);
      askInput.value = '';

      const geminiDiv = appendAskGeminiMsg('Consultando Gemini...');
      footerStatus.textContent = 'Status: Consultando Gemini (Tirador de Dúvidas)...';
      outputSection.classList.remove('hidden');
      outputContent.textContent = 'Processando consulta Q&A com o contexto da aba...';

      await refreshPageContext();

      let fullPrompt = `[CONTEXTO DA ABA ATIVA]:\nTítulo: ${currentTabContext?.title || 'N/A'}\nURL: ${currentTabContext?.url || 'N/A'}\n`;
      if (currentTabContext?.selectedText) {
        fullPrompt += `[TEXTO SELECIONADO PELO USUÁRIO]:\n"${currentTabContext.selectedText}"\n\n`;
      }
      if (currentTabContext?.pageText) {
        fullPrompt += `[CONTEÚDO DA PÁGINA]:\n${currentTabContext.pageText.slice(0, 3000)}\n\n`;
      }
      fullPrompt += `[DÚVIDA DO USUÁRIO]:\n${question}`;

      let apiResponse = null;
      const activeModel = modelSelect.value || storedModel;

      if (storedEngineMode === 'api' || storedApiKey) {
        const activeKey = apiKeyInput.value.trim() || storedApiKey;
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_API',
            apiKey: activeKey,
            model: activeModel,
            prompt: fullPrompt,
            systemInstruction: 'Você é o especialista Gemini (Tirador de Dúvidas da Extensão Antigravity). Responda de forma clara, direta e objetiva às dúvidas do usuário sobre a página em português.'
          }, r);
        });
      } else {
        apiResponse = await new Promise(r => {
          chrome.runtime.sendMessage({
            action: 'CALL_GEMINI_WEB_BRIDGE',
            prompt: fullPrompt
          }, r);
        });
      }

      if (apiResponse && apiResponse.success) {
        geminiDiv.textContent = apiResponse.text;
        outputContent.textContent = apiResponse.text;
        footerStatus.textContent = 'Status: Dúvida respondida!';
      } else {
        geminiDiv.textContent = `❌ ${apiResponse?.error || 'Erro na resposta do Gemini'}`;
        outputContent.textContent = `❌ ${apiResponse?.error || 'Erro na resposta do Gemini'}`;
        footerStatus.textContent = 'Status: Erro';
      }
    });

    if (askInput) {
      askInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendAskBtn.click();
        }
      });
    }
  }

  // Automations Presets
  const wfUpworkHunter = document.getElementById('wf-upwork-hunter');
  const wfSocialPost = document.getElementById('wf-social-post');
  const wfBioTuner = document.getElementById('wf-bio-tuner');
  const wfMemoryHistory = document.getElementById('wf-memory-history');

  if (wfUpworkHunter) {
    wfUpworkHunter.addEventListener('click', async () => {
      const goal = 'Analise a vaga ativa no Upwork, confira orçamento e exigência de Connects, consulte o histórico para não repetir propostas e elabore uma proposta persuasiva e objetiva economizando Connects.';
      appendUserMsg(goal);
      await runAutonomousComputerUseLoop(goal);
    });
  }

  if (wfSocialPost) {
    wfSocialPost.addEventListener('click', async () => {
      const goal = 'Elabore uma postagem de texto envolvente e profissional adaptada para X (Twitter), Threads e LinkedIn com base no conteúdo da página ativa.';
      appendUserMsg(goal);
      if (autoLoopCheck.checked) {
        await runAutonomousComputerUseLoop(goal);
      }
    });
  }

  if (wfBioTuner) {
    wfBioTuner.addEventListener('click', async () => {
      const goal = 'Analise este perfil/configurações de conta e crie/digite uma bio otimizada e de alta conversão para a plataforma.';
      appendUserMsg(goal);
      if (autoLoopCheck.checked) {
        await runAutonomousComputerUseLoop(goal);
      }
    });
  }

  if (wfMemoryHistory) {
    wfMemoryHistory.addEventListener('click', async () => {
      const history = await fetchRecentMemoryHistory();
      outputSection.classList.remove('hidden');
      if (!history || history.length === 0) {
        appendSystemMsg('📑 Nenhuma tarefa registrada na memória persistente ainda.');
        outputContent.textContent = 'Histórico de memória vazio.';
      } else {
        appendSystemMsg(`📑 Exibindo ${history.length} últimas tarefas da Memória Persistente (CSV/MD):`);
        const formatted = history.map((item, idx) => 
          `${idx + 1}. [${item.Timestamp || item.timestamp || 'N/A'}] [${item.Categoria || item.role || 'Ação'}]: ${item['Instrução / Prompt'] || item.text || item.actions} -> Status: ${item.Status || 'Concluído'}`
        ).join('\n\n');
        outputContent.textContent = formatted;
      }
    });
  }

  if (wfAutoLoop) {
    wfAutoLoop.addEventListener('click', async () => {
      const goal = 'Procure vagas de desenvolvedor remoto adequadas ao perfil e candidate-se ou apresente o resumo das vagas.';
      appendUserMsg(goal);
      await runAutonomousComputerUseLoop(goal);
    });
  }

  if (wfAutoFill) {
    wfAutoFill.addEventListener('click', async () => {
      const generatedText = await new Promise(r => {
        chrome.runtime.sendMessage({
          action: 'CALL_GEMINI_API',
          apiKey: apiKeyInput.value.trim() || storedApiKey,
          model: storedModel,
          prompt: `Generate a concise professional response ready to be typed in active input field on page "${currentTabContext?.title}".`
        }, r);
      });
      
      if (generatedText && generatedText.success) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { action: 'INSERT_TEXT', text: generatedText.text });
          footerStatus.textContent = 'Status: Field auto-filled!';
        }
      }
    });
  }

  wfPageSummary.addEventListener('click', async () => {
    const goal = 'Provide a concise breakdown of this page: 1. Core Summary, 2. Key Insights, 3. Action Points.';
    appendUserMsg(goal);
    if (autoLoopCheck.checked) {
      await runAutonomousComputerUseLoop(goal);
    }
  });

  wfDataExtractor.addEventListener('click', async () => {
    const goal = 'Extract all primary structured data, tables, or contacts into Markdown format.';
    appendUserMsg(goal);
    if (autoLoopCheck.checked) {
      await runAutonomousComputerUseLoop(goal);
    }
  });

  wfMsgReply.addEventListener('click', async () => {
    const goal = 'Analyze current discussion or email thread and auto-reply to the response field.';
    appendUserMsg(goal);
    if (autoLoopCheck.checked) {
      await runAutonomousComputerUseLoop(goal);
    }
  });

  // Output Actions
  copyOutputBtn.addEventListener('click', () => {
    const text = outputContent.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      copyOutputBtn.textContent = 'Copied';
      setTimeout(() => copyOutputBtn.textContent = 'Copy', 1500);
    }
  });

  insertOutputBtn.addEventListener('click', async () => {
    const text = outputContent.textContent;
    if (!text) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: 'INSERT_TEXT', text }, (response) => {
      if (response && response.copied) {
        alert(response.message);
      } else if (response && response.success) {
        insertOutputBtn.textContent = 'Auto-Typed!';
        setTimeout(() => insertOutputBtn.textContent = 'Auto-Type into Page Field', 1500);
      }
    });
  });
});
