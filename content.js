// Content script running on claude.ai
// Detects when the user sends a message by monitoring DOM mutations and click/keyboard events.

(function () {
  'use strict';

  let observer = null;

  function notifyBackground() {
    chrome.runtime.sendMessage({ type: 'MESSAGE_SENT' }).catch(() => {
      // Extension context may be invalidated on update; ignore.
    });
  }

  // Strategy 1: Intercept clicks on the send button
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button[aria-label="Send Message"], button[data-testid="send-button"]');
    if (target) {
      notifyBackground();
    }
  }, true);

  // Strategy 2: Intercept Enter key in the message input area
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const el = e.target;
      // Check if the element is within the chat input area
      if (el && (
        el.closest('[contenteditable="true"]') ||
        el.closest('textarea') ||
        el.closest('.ProseMirror')
      )) {
        notifyBackground();
      }
    }
  }, true);

  // Strategy 3: Watch for new human-turn elements appearing in the chat
  // This is the most reliable fallback — it detects when the conversation
  // actually updates regardless of how the message was sent.
  function setupMutationObserver() {
    const targetNode = document.body;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Look for human message containers
          const isHumanMessage =
            node.matches?.('[data-testid*="human"], [class*="human-turn"]') ||
            node.querySelector?.('[data-testid*="human"], [class*="human-turn"]');

          if (isHumanMessage) {
            notifyBackground();
            return;
          }
        }
      }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }

  // Strategy 4: Intercept fetch/XHR to detect conversation API calls
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (url.includes('/completion') || url.includes('/chat_conversations')) {
      const method = args[1]?.method?.toUpperCase() || 'GET';
      if (method === 'POST') {
        notifyBackground();
      }
    }
    return originalFetch.apply(this, args);
  };

  setupMutationObserver();
})();
