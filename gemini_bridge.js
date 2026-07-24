// Antigravity Gemini Web Bridge v1.3.0

console.log('Antigravity Gemini Web Bridge loaded on gemini.google.com.');

// Helper to check if user is logged into gemini.google.com
function checkGeminiLoginState() {
  const inputEl = document.querySelector('rich-textarea div[contenteditable="true"]') ||
                  document.querySelector('textarea') ||
                  document.querySelector('div[contenteditable="true"]') ||
                  document.querySelector('.ql-editor');

  const profileAvatar = document.querySelector('button[aria-label*="Google Account"]') ||
                        document.querySelector('a[aria-label*="Google Account"]') ||
                        document.querySelector('img[src*="googleusercontent.com"]') ||
                        document.querySelector('.profile-button');

  const signInBtn = document.querySelector('a[href*="accounts.google.com/ServiceLogin"]') ||
                    document.querySelector('a[href*="accounts.google.com/InteractiveLogin"]');

  const isLoggedIn = !!(inputEl || profileAvatar) && !signInBtn;

  return {
    isLoggedIn,
    hasInput: !!inputEl,
    hasProfile: !!profileAvatar
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CHECK_GEMINI_LOGIN') {
    const state = checkGeminiLoginState();
    sendResponse({ success: true, ...state });
    return true;
  }

  if (message.action === 'EXECUTE_GEMINI_WEB_PROMPT') {
    (async () => {
      try {
        const state = checkGeminiLoginState();
        if (!state.isLoggedIn) {
          sendResponse({
            success: false,
            error: 'Sua conta do Gemini Web não está logada. Por favor, acesse gemini.google.com e faça login na sua conta do Google.'
          });
          return;
        }

        const { prompt } = message;

        // 1. Locate prompt input box
        const inputEl = document.querySelector('rich-textarea div[contenteditable="true"]') ||
                        document.querySelector('textarea') ||
                        document.querySelector('div[contenteditable="true"]') ||
                        document.querySelector('.ql-editor');

        if (!inputEl) {
          sendResponse({ success: false, error: 'Caixa de entrada do Gemini Web não encontrada. Recarregue a aba do Gemini.' });
          return;
        }

        // Focus and insert prompt using execCommand for Angular/Rich-text compatibility
        inputEl.focus();
        
        if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
          inputEl.value = prompt;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          try {
            const sel = window.getSelection();
            if (sel) {
              const range = document.createRange();
              range.selectNodeContents(inputEl);
              sel.removeAllRanges();
              sel.addRange(range);
            }
            const execOk = document.execCommand('insertText', false, prompt);
            if (!execOk) {
              inputEl.innerHTML = `<p>${prompt.replace(/\n/g, '<br>')}</p>`;
            }
          } catch (e) {
            inputEl.innerHTML = `<p>${prompt.replace(/\n/g, '<br>')}</p>`;
          }
          inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: prompt }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          inputEl.dispatchEvent(new Event('keyup', { bubbles: true }));
        }

        await new Promise(r => setTimeout(r, 600));

        // 2. Locate and click send button
        const sendBtn = document.querySelector('button[aria-label*="Enviar"]') ||
                        document.querySelector('button[aria-label*="Send"]') ||
                        document.querySelector('button.send-button') ||
                        document.querySelector('.send-button-container button') ||
                        document.querySelector('button.send-button-icon') ||
                        document.querySelector('button[mat-icon-button]');

        if (!sendBtn) {
          sendResponse({ success: false, error: 'Botão de envio não localizado no Gemini Web. Verifique se a aba gemini.google.com está aberta.' });
          return;
        }

        sendBtn.removeAttribute('disabled');
        sendBtn.setAttribute('aria-disabled', 'false');
        sendBtn.click();

        // 3. Poll for completed response stream
        let attempts = 0;
        let finalResponseText = '';

        while (attempts < 50) { // 50 seconds max
          await new Promise(r => setTimeout(r, 1000));
          attempts++;

          const isStreaming = !!document.querySelector('button[aria-label*="Parar"], button[aria-label*="Stop"]');
          const responses = document.querySelectorAll('model-response, .model-response-text, .response-container-content, message-content');
          
          if (responses.length > 0) {
            const lastResponse = responses[responses.length - 1];
            const text = lastResponse.innerText.trim();

            if (!isStreaming && text.length > 0) {
              finalResponseText = text;
              break;
            }
          }
        }

        if (!finalResponseText) {
          sendResponse({ success: false, error: 'Tempo limite excedido aguardando resposta do Gemini Web.' });
        } else {
          sendResponse({ success: true, text: finalResponseText });
        }

      } catch (err) {
        console.error('Error in Gemini Web Bridge:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
