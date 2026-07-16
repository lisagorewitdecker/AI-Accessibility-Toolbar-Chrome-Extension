# AI Accessibility Toolbar – Chrome Extension

A Google Chrome extension that adds an on-demand accessibility toolbar to any web page, helping users with visual, cognitive, and motor impairments browse the web more comfortably.

---

## Features

| Category | Feature | Description |
|---|---|---|
| **Text Size** | Increase / Decrease / Reset | Scale all page text in 10% increments (up to +50% / −30%) |
| **Display** | High Contrast | Black background with yellow text for maximum contrast |
| | Grayscale | Remove all colour from the page |
| | Invert Colors | Invert page colours (useful for light-sensitivity) |
| **Reading** | Dyslexia Font | Switch to a dyslexia-friendly font (OpenDyslexic / Comic Sans fallback) with extra letter & word spacing |
| | Highlight Links | Make all hyperlinks visually distinct with a yellow highlight and orange border |
| | Reading Guide | A horizontal highlight bar that follows the mouse cursor to aid line tracking |
| | Text Spacing | Increase letter spacing, word spacing, and line height |
| **Navigation** | Focus Indicator | Enhance the keyboard focus outline with a bold orange ring |
| | Large Cursor | Replace the default cursor with an enlarged version |

All settings are **persisted** across popup opens via `chrome.storage.local` and re-applied automatically when a new page finishes loading.

---

## Installation (Developer Mode)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the root folder of this repository.
5. The toolbar icon (blue **A**) will appear in your browser toolbar.

---

## Usage

1. Navigate to any web page.
2. Click the **AI Accessibility Toolbar** icon in the Chrome toolbar.
3. Use the toggles and buttons to activate the features you need.
4. Click **Reset All** to turn off all features and restore defaults.

---

## Project Structure

```
├── manifest.json       # Chrome Extension Manifest V3
├── popup.html          # Toolbar popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup interaction logic
├── content.js          # Injects accessibility classes into host pages
├── content.css         # CSS rules for all accessibility features
├── background.js       # Service worker – reapplies state on page load
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Browser Support

Requires **Chrome 88+** (Manifest V3 support).

---

## License

[MIT](LICENSE)
