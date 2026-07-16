/**
 * background.js – Service worker for the AI Accessibility Toolbar extension.
 *
 * Responsibilities:
 * - Re-apply saved accessibility state when a tab finishes loading.
 * - Clear stale per-tab state if needed.
 */

'use strict';

const DEFAULT_STATE = {
  textSize: 0,
  highContrast: false,
  grayscale: false,
  invertColors: false,
  dyslexiaFont: false,
  highlightLinks: false,
  readingGuide: false,
  textSpacing: false,
  focusIndicator: false,
  largeCursor: false,
};

/**
 * When a tab completes loading, push the stored accessibility state to the
 * content script so that settings persist across page navigations.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;

  chrome.storage.local.get('accessibilityState', (result) => {
    const state = Object.assign({}, DEFAULT_STATE, result.accessibilityState || {});

    // Only bother messaging if at least one feature is active.
    const isActive = state.textSize !== 0 ||
      Object.values(state).some((v) => v === true);

    if (!isActive) return;

    chrome.tabs.sendMessage(tabId, { action: 'applyState', state }, () => {
      // Suppress errors for pages where content scripts cannot run.
      void chrome.runtime.lastError;
    });
  });
});
