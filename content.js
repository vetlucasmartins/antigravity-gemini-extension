// Antigravity Autonomous Computer Use & Action Script v1.7.0

console.log('Antigravity Computer Use & Action Script v1.7.0 loaded.');

function highlightElement(el) {
  if (!el) return;
  const originalOutline = el.style.outline;
  const originalBoxShadow = el.style.boxShadow;
  
  el.style.outline = '3px solid #6366f1';
  el.style.boxShadow = '0 0 16px rgba(99, 102, 241, 0.8)';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.boxShadow = originalBoxShadow;
  }, 2500);
}

// Click at exact screen coordinates (X, Y)
function clickCoordinate(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el) {
    highlightElement(el);
    el.focus();
    
    // Dispatch mouse events sequence
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    return { success: true, element: el.tagName, text: el.innerText ? el.innerText.slice(0, 30) : '' };
  }
  return { success: false, error: 'No element found at coordinate' };
}

// Specialized typing for Rich Text & standard Inputs
function typeIntoElement(targetEl, text) {
  let el = targetEl;

  if (!el || el === document.body) {
    el = document.querySelector('.msg-form__contenteditable') ||
         document.querySelector('.comments-comment-box__insert-comment-field') ||
         document.querySelector('.ql-editor') ||
         document.querySelector('div[contenteditable="true"]') ||
         document.querySelector('textarea') ||
         document.querySelector('input[type="text"]');
  }

  if (!el) return false;

  highlightElement(el);
  el.focus();

  try {
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const execSuccess = document.execCommand('insertText', false, text);

    if (!execSuccess) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = text;
      } else {
        el.innerHTML = text.replace(/\n/g, '<br>');
      }
    }

    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch (err) {
    console.error('Error typing into element:', err);
    return false;
  }
}

function clickElementByTextOrSelector(target) {
  let el = document.querySelector(target);
  
  if (!el) {
    const allClickables = Array.from(document.querySelectorAll('button, a, input[type="submit"], div[role="button"], span[role="button"], li'));
    el = allClickables.find(item => item.innerText && item.innerText.trim().toLowerCase().includes(target.toLowerCase()));
  }

  if (el) {
    highlightElement(el);
    el.click();
    return true;
  }
  return false;
}

// Message Listener for Autonomous Computer Use Commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_PAGE_CONTEXT') {
    try {
      const selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';
      const bodyClone = document.body.cloneNode(true);
      const scriptsAndStyles = bodyClone.querySelectorAll('script, style, noscript, svg, nav, footer');
      scriptsAndStyles.forEach(e => e.remove());
      
      const fullText = bodyClone.innerText.replace(/\n\s*\n/g, '\n').slice(0, 15000);

      sendResponse({
        success: true,
        title: document.title,
        url: window.location.href,
        selectedText: selectedText,
        pageText: fullText,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (message.action === 'CLICK_COORDINATE') {
    const res = clickCoordinate(message.x, message.y);
    sendResponse(res);
    return true;
  }

  if (message.action === 'AUTOMATE_CLICK') {
    const success = clickElementByTextOrSelector(message.target);
    sendResponse({ success, target: message.target });
    return true;
  }

  if (message.action === 'AUTOMATE_TYPE') {
    const targetEl = document.querySelector(message.selector) || document.activeElement;
    const success = typeIntoElement(targetEl, message.text);
    sendResponse({ success });
    return true;
  }

  if (message.action === 'AUTOMATE_SCROLL') {
    window.scrollBy({ top: message.distance || 500, behavior: 'smooth' });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'INSERT_TEXT') {
    try {
      const textToInsert = message.text;
      const success = typeIntoElement(document.activeElement, textToInsert);
      
      if (success) {
        sendResponse({ success: true });
      } else {
        navigator.clipboard.writeText(textToInsert);
        sendResponse({ success: true, copied: true, message: 'Texto copiado para a área de transferência!' });
      }
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
});
