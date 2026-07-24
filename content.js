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

function extractSmartSemanticContext() {
  const selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';

  // 1. Detect platform & extract metadata
  let platformHeader = '';
  const host = window.location.hostname.toLowerCase();

  if (host.includes('upwork.com')) {
    const jobTitleEl = document.querySelector('h1, h2.job-title, [data-test="JobTitle"]');
    const budgetEl = document.querySelector('[data-test="BudgetAmount"], [data-test="job-type"]');
    const connectsEl = document.querySelector('[data-test="connects-required"]');
    const title = jobTitleEl ? jobTitleEl.innerText.trim() : '';
    const budget = budgetEl ? budgetEl.innerText.trim() : '';
    const connects = connectsEl ? connectsEl.innerText.trim() : '';
    if (title) {
      platformHeader = `[PLATAFORMA: Upwork | Vaga: ${title} | Orçamento: ${budget || 'N/A'} | Connects Exigidos: ${connects || 'N/A'}]\n`;
    }
  } else if (host.includes('x.com') || host.includes('twitter.com')) {
    platformHeader = `[PLATAFORMA: X (Twitter)]\n`;
  } else if (host.includes('threads.net')) {
    platformHeader = `[PLATAFORMA: Threads]\n`;
  } else if (host.includes('linkedin.com')) {
    platformHeader = `[PLATAFORMA: LinkedIn]\n`;
  }

  // 2. Find main content container(s)
  const selectors = [
    // Upwork
    '[data-test="job-details"]',
    '#job-details',
    '.job-details-section',
    '.up-card',
    '[data-test="job-tile-list"]',
    '.job-tile',
    // X (Twitter) & Threads
    '[data-testid="primaryColumn"]',
    '[data-testid="tweet"]',
    '[aria-label="Threads"]',
    // LinkedIn & General Freelance / Content
    '.jobs-search__job-details',
    '.jobs-description',
    '.feed-shared-update-v2',
    'main',
    '[role="main"]',
    'article',
    '#content',
    '#main-content',
    '.post-content',
    '.entry-content',
    '.profile-settings',
    '.container'
  ];

  let mainContainer = null;
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el && el.innerText && el.innerText.trim().length > 100) {
      mainContainer = el;
      break;
    }
  }

  const targetNode = mainContainer ? mainContainer.cloneNode(true) : document.body.cloneNode(true);

  // 3. Remove noisy elements (headers, nav, footers, scripts, styles, svgs, ad banners, cookie notices)
  const noiseSelectors = [
    'script', 'style', 'noscript', 'svg', 'iframe',
    'header', 'nav', 'footer', 'aside',
    '.global-nav', '#global-nav', '.artdeco-global-nav',
    '.cookie-banner', '#cookie-consent', '.ad-banner', '.adsbygoogle',
    '[aria-hidden="true"]'
  ];

  noiseSelectors.forEach(selector => {
    try {
      const elements = targetNode.querySelectorAll(selector);
      elements.forEach(e => e.remove());
    } catch (e) {}
  });

  // 4. Extract text lines, deduplicate & clean
  const rawText = targetNode.innerText || '';
  const lines = rawText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const cleanLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 || lines[i] !== lines[i - 1]) {
      cleanLines.push(lines[i]);
    }
  }

  let formattedText = platformHeader + cleanLines.join('\n');

  // Cap at ~5000 chars of high signal text
  if (formattedText.length > 5000) {
    formattedText = formattedText.slice(0, 5000) + '\n...[conteúdo resumido para economia de tokens]';
  }

  return {
    selectedText,
    pageText: formattedText,
    isScopedToMain: !!mainContainer
  };
}

function clickElementByTextOrSelector(target) {
  let el = null;
  try {
    el = document.querySelector(target);
  } catch (e) {}

  if (!el) {
    const allClickables = Array.from(document.querySelectorAll('button, a, input[type="submit"], div[role="button"], span[role="button"], li'));
    const targetLower = target.toLowerCase().trim();

    let bestEl = null;
    let bestScore = -1;

    for (const item of allClickables) {
      if (!item.innerText) continue;
      const itemText = item.innerText.trim().toLowerCase();
      if (!itemText.includes(targetLower)) continue;

      let score = 0;
      if (itemText === targetLower) score += 50;
      if (item.closest('main, [role="main"], article, .jobs-search__job-details')) score += 30;
      if (!item.closest('header, nav, footer, .global-nav')) score += 20;
      if (item.offsetWidth > 0 && item.offsetHeight > 0) score += 10;

      if (score > bestScore) {
        bestScore = score;
        bestEl = item;
      }
    }
    el = bestEl;
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
      const contextData = extractSmartSemanticContext();

      sendResponse({
        success: true,
        title: document.title,
        url: window.location.href,
        selectedText: contextData.selectedText,
        pageText: contextData.pageText,
        isScopedToMain: contextData.isScopedToMain,
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
