// Antigravity Universal Autonomous Web Agent & Action Script v2.0.0

console.log('Antigravity Universal Agent Script v2.0.0 loaded.');

window.__antigravityElementMap = new Map();

function highlightElement(el) {
  if (!el) return;
  const originalOutline = el.style.outline;
  const originalBoxShadow = el.style.boxShadow;
  
  el.style.outline = '3px solid #6366f1';
  el.style.boxShadow = '0 0 16px rgba(99, 102, 241, 0.8)';
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {}

  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.boxShadow = originalBoxShadow;
  }, 2500);
}

function isElementVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getAccessibleName(el) {
  if (!el) return '';
  
  // 1. aria-label or aria-labelledby
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
  
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl && labelEl.innerText) return labelEl.innerText.trim();
  }
  
  // 2. placeholder, title, alt, or name/value
  const placeholder = el.getAttribute('placeholder');
  if (placeholder && placeholder.trim()) return placeholder.trim();

  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  const alt = el.getAttribute('alt');
  if (alt && alt.trim()) return alt.trim();

  const value = el.value;
  if (value && typeof value === 'string' && value.trim() && el.tagName === 'INPUT') {
    return value.trim();
  }

  // 3. Direct innerText or textContent (truncated)
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) {
    return text.slice(0, 80);
  }

  return '';
}

// Universal Synthetic Accessibility Tree Synthesizer (Zero Site Hardcoding)
function extractSyntheticA11yTree() {
  window.__antigravityElementMap.clear();

  const interactiveSelectors = [
    'button',
    'a[href]',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])'
  ];

  const allInteractive = Array.from(document.querySelectorAll(interactiveSelectors.join(',')));
  const visibleInteractive = allInteractive.filter(isElementVisible);

  let idCounter = 1;
  const elementsMarkdown = [];

  visibleInteractive.forEach(el => {
    // Skip tiny noise elements
    const name = getAccessibleName(el);
    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type') || '';
    const role = el.getAttribute('role') || tag;
    
    // Ignore hidden inputs
    if (tag === 'input' && type === 'hidden') return;

    const id = `e${idCounter++}`;
    window.__antigravityElementMap.set(id, el);

    const displayType = type ? `${tag}:${type}` : tag;
    const labelStr = name ? `"${name}"` : '(sem rótulo)';

    elementsMarkdown.push(`- [${id}] (${displayType}) ${labelStr}`);
  });

  // Extract main page headings for context
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter(isElementVisible)
    .map(h => (h.innerText || '').trim())
    .filter(t => t.length > 0)
    .slice(0, 6);

  const mainHeaderStr = headings.length > 0 ? `### Títulos Principais:\n${headings.map(h => `- ${h}`).join('\n')}\n\n` : '';

  const markdownTree = `## Página: ${document.title}\n**URL:** ${window.location.href}\n\n${mainHeaderStr}### Elementos Interativos Visíveis (${elementsMarkdown.length}):\n${elementsMarkdown.join('\n')}`;

  return {
    markdownTree,
    elementCount: elementsMarkdown.length,
    title: document.title,
    url: window.location.href
  };
}

// Read section text on demand for minimal token overhead
function readSectionContent(target) {
  let el = null;
  if (target && window.__antigravityElementMap.has(target)) {
    el = window.__antigravityElementMap.get(target);
  } else if (target) {
    try {
      el = document.querySelector(target);
    } catch (e) {}
  }

  if (!el) {
    el = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('article') || document.body;
  }

  const clone = el.cloneNode(true);
  const noise = clone.querySelectorAll('script, style, noscript, svg, iframe, header, nav, footer');
  noise.forEach(n => n.remove());

  const rawText = (clone.innerText || '').split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
  return rawText.slice(0, 3000);
}

// Search element by text or accessible label across interactive elements & click it
function clickElementByText(textQuery) {
  if (!textQuery) return { success: false, error: 'Texto de busca não especificado' };

  const targetLower = textQuery.toLowerCase().trim();
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input[type="submit"]',
    'input[type="button"]',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="option"]',
    'div.share-box-feed-entry__trigger',
    'span',
    'div'
  ];

  const candidates = Array.from(document.querySelectorAll(interactiveSelectors.join(',')))
    .filter(isElementVisible);

  // 1. Exact match on innerText or accessible name
  let el = candidates.find(item => {
    const accName = getAccessibleName(item).toLowerCase();
    const text = (item.innerText || '').toLowerCase().trim();
    return accName === targetLower || text === targetLower;
  });

  // 2. Partial match on accessible name or innerText
  if (!el) {
    el = candidates.find(item => {
      const accName = getAccessibleName(item).toLowerCase();
      const text = (item.innerText || '').toLowerCase().trim();
      return (accName.length > 0 && accName.includes(targetLower)) || (text.length > 0 && text.includes(targetLower));
    });
  }

  if (el) {
    highlightElement(el);
    try {
      el.focus();
    } catch (e) {}
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.click();
    return { success: true, target: textQuery, tagName: el.tagName, text: getAccessibleName(el) };
  }

  return { success: false, error: `Nenhum elemento clicável contendo "${textQuery}" foi localizado.` };
}

// Click element by ID e1, e2 or CSS selector / text fallback
function clickElement(targetStr) {
  if (!targetStr) return { success: false, error: 'Target não especificado' };

  let el = null;
  if (window.__antigravityElementMap.has(targetStr)) {
    el = window.__antigravityElementMap.get(targetStr);
  }

  if (el && !document.body.contains(el)) {
    // Stale element reference - refresh tree
    extractSyntheticA11yTree();
    el = window.__antigravityElementMap.get(targetStr) || null;
  }

  if (!el) {
    try {
      el = document.querySelector(targetStr);
    } catch (e) {}
  }

  if (!el) {
    // Fallback to text search
    return clickElementByText(targetStr);
  }

  if (el && isElementVisible(el)) {
    highlightElement(el);
    try {
      el.focus();
    } catch (e) {}
    
    // Dispatch full mouse event sequence for complex UI frameworks
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.click();
    return { success: true, target: targetStr, tagName: el.tagName, text: getAccessibleName(el) };
  }

  return { success: false, error: `Elemento "${targetStr}" não encontrado ou invisível.` };
}

// Type into element by ID or selector (Compatible with LinkedIn, React, contenteditable, Draft.js)
function typeIntoElement(targetStr, text) {
  let el = null;

  if (targetStr && window.__antigravityElementMap.has(targetStr)) {
    el = window.__antigravityElementMap.get(targetStr);
  }

  if (el && !document.body.contains(el)) {
    extractSyntheticA11yTree();
    el = window.__antigravityElementMap.get(targetStr) || null;
  }

  if (!el && targetStr) {
    try {
      el = document.querySelector(targetStr);
    } catch (e) {}
  }

  if (!el) {
    el = document.activeElement;
  }

  // Fallback to active editable element or LinkedIn/general text fields
  if (!el || el === document.body) {
    el = document.querySelector('div.ql-editor') ||
         document.querySelector('div.public-DraftEditor-content') ||
         document.querySelector('div[contenteditable="true"]') ||
         document.querySelector('.comments-comment-box__textarea') ||
         document.querySelector('textarea') ||
         document.querySelector('input[type="text"]:not([type="hidden"])');
  }

  if (!el) return { success: false, error: 'Campo de texto interativo não encontrado na página.' };

  highlightElement(el);
  try {
    el.focus();
    el.dispatchEvent(new Event('focus', { bubbles: true }));
  } catch (e) {}

  try {
    const isInputOrTextarea = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';

    if (isInputOrTextarea) {
      // Use React native value setter descriptor to bypass React synthetic event tracking override
      const prototype = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      
      if (nativeValueSetter) {
        nativeValueSetter.call(el, text);
      } else {
        el.value = text;
      }

      el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // ContentEditable / Draft.js / Quill / LinkedIn Post & Comment Box
      let typedOk = false;

      try {
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(el);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        typedOk = document.execCommand('insertText', false, text);
      } catch (e) {}

      if (!typedOk) {
        try {
          typedOk = document.execCommand('insertHTML', false, text.replace(/\n/g, '<br>'));
        } catch (e) {}
      }

      if (!typedOk || !el.innerText || !el.innerText.trim()) {
        el.innerHTML = text.replace(/\n/g, '<br>');
      }

      // Dispatch comprehensive event chain for modern rich text editors
      el.dispatchEvent(new Event('compositionstart', { bubbles: true }));
      el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('compositionend', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    }

    return { success: true, target: targetStr || 'active_field', tagName: el.tagName };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Execute batch of actions sequentially
async function executeBatchActions(actions) {
  const results = [];
  for (const step of actions) {
    let res = { success: false };
    if (step.action === 'CLICK') {
      res = clickElement(step.target || step.id);
    } else if (step.action === 'TYPE' || step.action === 'INSERT_TEXT') {
      res = typeIntoElement(step.target || step.id || step.selector, step.text || '');
    } else if (step.action === 'SCROLL') {
      window.scrollBy({ top: step.distance || 500, behavior: 'smooth' });
      res = { success: true };
    }
    results.push(res);
    // Short delay between batch steps
    await new Promise(r => setTimeout(r, 400));
  }
  return { success: true, results };
}

// Message Listener for Antigravity Commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OBSERVE_STRUCTURE' || message.action === 'GET_PAGE_CONTEXT') {
    try {
      const treeData = extractSyntheticA11yTree();
      sendResponse({
        success: true,
        title: treeData.title,
        url: treeData.url,
        a11yTree: treeData.markdownTree,
        pageText: treeData.markdownTree, // Backwards compatibility
        elementCount: treeData.elementCount
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }

  if (message.action === 'READ_SECTION') {
    const text = readSectionContent(message.target);
    sendResponse({ success: true, text });
    return true;
  }

  if (message.action === 'AUTOMATE_CLICK') {
    const res = clickElement(message.target || message.id);
    sendResponse(res);
    return true;
  }

  if (message.action === 'AUTOMATE_CLICK_TEXT') {
    const res = clickElementByText(message.target || message.text || message.id);
    sendResponse(res);
    return true;
  }

  if (message.action === 'AUTOMATE_TYPE' || message.action === 'INSERT_TEXT') {
    const res = typeIntoElement(message.target || message.id || message.selector, message.text || '');
    sendResponse(res);
    return true;
  }

  if (message.action === 'AUTOMATE_SCROLL') {
    window.scrollBy({ top: message.distance || 500, behavior: 'smooth' });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'BATCH_EXECUTE') {
    executeBatchActions(message.actions || []).then(sendResponse);
    return true;
  }
});

