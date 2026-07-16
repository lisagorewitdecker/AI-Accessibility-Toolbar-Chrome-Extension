/**
 * popup.js – Handles toolbar UI interactions and communicates
 * with the content script to apply/remove accessibility features
 * on the active tab.
 */

// Feature IDs that map to toggle checkboxes and content-script actions.
const TOGGLE_FEATURES = [
  'highContrast',
  'grayscale',
  'invertColors',
  'dyslexiaFont',
  'highlightLinks',
  'readingGuide',
  'textSpacing',
  'focusIndicator',
  'largeCursor',
];

// Default state for all settings.
const DEFAULT_STATE = {
  textSize: 0,           // cumulative step offset (-3 … +5)
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
 * Retrieve the current accessibility state from storage, merging with
 * DEFAULT_STATE to guarantee all keys are present. Calls `callback(state)`.
 */
function getState(callback) {
  chrome.storage.local.get('accessibilityState', (result) => {
    callback(Object.assign({}, DEFAULT_STATE, result.accessibilityState || {}));
  });
}

/**
 * Send a message to the content script of the active tab.
 * Chrome MV3: content scripts are injected declaratively so the
 * tab is always ready to receive messages once the page is loaded.
 */
function sendToContent(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    chrome.tabs.sendMessage(tabs[0].id, message, () => {
      // Suppress "could not establish connection" errors for pages
      // where content scripts cannot run (e.g. chrome:// pages).
      void chrome.runtime.lastError;
    });
  });
}

/**
 * Persist state for the current tab's origin so settings are
 * remembered across popup opens.
 */
function saveState(state) {
  chrome.storage.local.set({ accessibilityState: state });
}

/**
 * Load persisted state, then apply it to both the UI and the page.
 */
function loadAndApplyState() {
  getState((state) => {
    applyStateToUI(state);
    sendToContent({ action: 'applyState', state });
  });
}

/** Reflect stored state onto the popup checkboxes. */
function applyStateToUI(state) {
  TOGGLE_FEATURES.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.checked = !!state[id];
      el.setAttribute('aria-checked', String(!!state[id]));
    }
  });
}

// ── Initialise once DOM is ready ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadAndApplyState();

  // ── Text-size controls ────────────────────────────────────────────────────
  document.getElementById('increaseText').addEventListener('click', () => {
    getState((state) => {
      if (state.textSize < 5) {
        state.textSize += 1;
        saveState(state);
        sendToContent({ action: 'setTextSize', step: state.textSize });
      }
    });
  });

  document.getElementById('decreaseText').addEventListener('click', () => {
    getState((state) => {
      if (state.textSize > -3) {
        state.textSize -= 1;
        saveState(state);
        sendToContent({ action: 'setTextSize', step: state.textSize });
      }
    });
  });

  document.getElementById('resetText').addEventListener('click', () => {
    getState((state) => {
      state.textSize = 0;
      saveState(state);
      sendToContent({ action: 'setTextSize', step: 0 });
    });
  });

  // ── Toggle features ───────────────────────────────────────────────────────
  TOGGLE_FEATURES.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      const enabled = el.checked;
      el.setAttribute('aria-checked', String(enabled));
      getState((state) => {
        state[id] = enabled;
        saveState(state);
        sendToContent({ action: 'toggle', feature: id, enabled });
      });
    });
  });

  // ── Reset All ─────────────────────────────────────────────────────────────
  document.getElementById('resetAll').addEventListener('click', () => {
    const fresh = Object.assign({}, DEFAULT_STATE);
    saveState(fresh);
    applyStateToUI(fresh);
    sendToContent({ action: 'applyState', state: fresh });
  });
});
