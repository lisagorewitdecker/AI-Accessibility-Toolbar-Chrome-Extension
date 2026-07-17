document.addEventListener('DOMContentLoaded', () => {

    // Helper function to safely grab the real web page
    async function getActiveTab() {
        let [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        return tab;
    }

    // Helper to determine if we can inject scripting into a tab URL
    function canInjectScript(url) {
        if (!url) return false;
        const restricted = [
            "chrome://",
            "chrome-extension://",
            "https://chrome.google.com",
            "https://chromewebstore.google.com",
            "edge://",
            "about:"
        ];
        return !restricted.some(prefix => url.startsWith(prefix));
    }

    // --- 1. Summarize Entire Page ---
    document.getElementById('summarizePage').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => document.body.innerText
        }, (results) => {
            if (results && results[0]) {
                const pageText = results[0].result;
                chrome.runtime.sendMessage({
                    action: "summarize_page",
                    tabId: tab.id,
                    text: pageText
                });
            }
        });
    });

    // --- 2. Dyslexia Font Toggle ---
    document.getElementById('toggleDyslexia').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                const existingStyle = document.getElementById('ai-dyslexia-style');
                if (existingStyle) existingStyle.remove();
                else {
                    const style = document.createElement('style');
                    style.id = 'ai-dyslexia-style';
                    style.innerHTML = `* { font-family: 'Comic Sans MS', 'OpenDyslexic', sans-serif !important; letter-spacing: 0.1em !important; word-spacing: 0.2em !important; line-height: 1.6 !important; }`;
                    document.head.appendChild(style);
                }
            }
        });
    });

    // --- 3. High Contrast Toggle ---
    document.getElementById('toggleContrast').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                const existingStyle = document.getElementById('ai-contrast-style');
                if (existingStyle) existingStyle.remove();
                else {
                    const style = document.createElement('style');
                    style.id = 'ai-contrast-style';
                    style.innerHTML = `* { background-color: #121212 !important; color: #ffffff !important; } a { color: #ffff00 !important; }`;
                    document.head.appendChild(style);
                }
            }
        });
    });

    // --- 4. Reading Ruler ---
    document.getElementById('toggleRuler').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                let ruler = document.getElementById('ai-reading-ruler');
                if (ruler) {
                    ruler.remove();
                    document.removeEventListener('mousemove', window.rulerFn);
                } else {
                    ruler = document.createElement('div');
                    ruler.id = 'ai-reading-ruler';
                    ruler.style.position = 'fixed';
                    ruler.style.left = '0';
                    ruler.style.width = '100vw';
                    ruler.style.height = '8px';
                    ruler.style.backgroundColor = 'rgba(255, 204, 0, 0.5)';
                    ruler.style.borderTop = '2px solid #ffcc00';
                    ruler.style.pointerEvents = 'none';
                    ruler.style.zIndex = '2147483647';
                    document.body.appendChild(ruler);

                    window.rulerFn = (e) => {
                        ruler.style.top = (e.clientY + 15) + 'px';
                    };
                    document.addEventListener('mousemove', window.rulerFn);
                }
            }
        });
    });

    // --- 5. Highlight Links ---
    document.getElementById('highlightLinks').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                const existingStyle = document.getElementById('ai-link-style');
                if (existingStyle) existingStyle.remove();
                else {
                    const style = document.createElement('style');
                    style.id = 'ai-link-style';
                    style.innerHTML = `a, a * { background-color: #ffff00 !important; color: #000000 !important; text-decoration: underline bold #000000 !important; }`;
                    document.head.appendChild(style);
                }
            }
        });
    });

    // --- 6. Hide Images ---
    document.getElementById('hideImages').addEventListener('click', async () => {
        let tab = await getActiveTab();
        if (!tab || tab.id < 0) return;

        if (!canInjectScript(tab.url)) {
            alert("This tool cannot be run on restricted browser pages. Please try on a standard web page!");
            return;
        }

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            func: () => {
                const existingStyle = document.getElementById('ai-hide-images');
                if (existingStyle) existingStyle.remove();
                else {
                    const style = document.createElement('style');
                    style.id = 'ai-hide-images';
                    style.innerHTML = `img, video, iframe { display: none !important; }`;
                    document.head.appendChild(style);
                }
            }
        });
    });

    // --- 7. Open Options Page ---
    document.getElementById('openOptions').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
});