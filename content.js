/**
 * content.js – Applies/removes accessibility features on the host page.
 *
 * Each feature is controlled via a CSS class added to <html>.
 * CSS for those classes lives in content.css (injected by the manifest).
 * Text-size changes use a CSS custom property on <html>.
 */

(function () {
  'use strict';

  const ROOT = document.documentElement;

  // ── Class map: feature id → CSS class applied to <html> ──────────────────
  const CLASS_MAP = {
    highContrast:   'a11y-high-contrast',
    grayscale:      'a11y-grayscale',
    invertColors:   'a11y-invert',
    dyslexiaFont:   'a11y-dyslexia-font',
    highlightLinks: 'a11y-highlight-links',
    readingGuide:   'a11y-reading-guide',
    textSpacing:    'a11y-text-spacing',
    focusIndicator: 'a11y-focus-indicator',
    largeCursor:    'a11y-large-cursor',
  };

  // Text-size step → percentage offset (each step is +/- 10%)
  const TEXT_SIZE_STEP_PCT = 10;

  // ── Reading guide element ─────────────────────────────────────────────────
  let guideEl = null;

  function createReadingGuide() {
    if (guideEl) return;
    guideEl = document.createElement('div');
    guideEl.id = 'a11y-reading-guide-bar';
    guideEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(guideEl);
    document.addEventListener('mousemove', onMouseMoveGuide);
  }

  function destroyReadingGuide() {
    if (guideEl) {
      guideEl.remove();
      guideEl = null;
    }
    document.removeEventListener('mousemove', onMouseMoveGuide);
  }

  function onMouseMoveGuide(e) {
    if (!guideEl) return;
    guideEl.style.top = e.clientY + 'px';
  }

  // ── Apply full state (sent on popup open / reset) ─────────────────────────
  function applyState(state) {
    // Toggles
    Object.entries(CLASS_MAP).forEach(([feature, cls]) => {
      ROOT.classList.toggle(cls, !!state[feature]);
    });

    // Reading guide side-effect
    if (state.readingGuide) {
      createReadingGuide();
    } else {
      destroyReadingGuide();
    }

    // Text size
    applyTextSize(state.textSize || 0);
  }

  // ── Toggle a single feature ───────────────────────────────────────────────
  function toggleFeature(feature, enabled) {
    const cls = CLASS_MAP[feature];
    if (!cls) return;
    ROOT.classList.toggle(cls, enabled);

    if (feature === 'readingGuide') {
      if (enabled) createReadingGuide();
      else destroyReadingGuide();
    }
  }

  // ── Text size ─────────────────────────────────────────────────────────────
  function applyTextSize(step) {
    const pct = 100 + step * TEXT_SIZE_STEP_PCT;
    ROOT.style.setProperty('--a11y-font-size', pct + '%');
    if (step === 0) {
      ROOT.classList.remove('a11y-text-resize');
    } else {
      ROOT.classList.add('a11y-text-resize');
    }
  }

  // ── Message listener ──────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case 'applyState':
        applyState(message.state);
        break;
      case 'toggle':
        toggleFeature(message.feature, message.enabled);
        break;
      case 'setTextSize':
        applyTextSize(message.step);
        break;
      default:
        break;
    }
  });
})();
