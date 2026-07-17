// The comment above tells your code editor that "chrome" is a globally defined variable.


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "read-aloud",
            title: "🗣️ Read Aloud",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "simplify-jargon",
            title: "🧠 Simplify Complex Text",
            contexts: ["selection"]
        });
        chrome.contextMenus.create({
            id: "translate-text",
            title: "🌐 Translate to English",
            contexts: ["selection"]
        });
    });
});

function sendToastToTab(tabId, message) {
    if (!tabId || tabId < 0) return;
    chrome.tabs.sendMessage(tabId, {
        action: "showToast",
        text: message
    }).catch(() => {
        console.warn("AI Toolbar: Content script missing. Please refresh the page.");
    });
}

async function fetchAndEncodeImage(imageUrl) {
    const imgResponse = await fetch(imageUrl);
    const imgBlob = await imgResponse.blob();
    const buffer = await imgResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    return {
        mimeType: imgBlob.type || "image/jpeg",
        data: base64Data
    };
}

function extractTextFromResult(data) {
    if (!data.steps) return "No response generated.";
    const modelOutput = data.steps.find(step => step.type === "model_output");
    if (!modelOutput || !modelOutput.content) return "No output content found.";
    const textPart = modelOutput.content.find(c => c.type === "text");
    return textPart ? textPart.text : "No text returned.";
}

// 2. Handle Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://") ||
        tab.url.startsWith("https://chrome.google.com") ||
        tab.url.startsWith("https://chromewebstore.google.com") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:")) {
        console.warn("AI Toolbar: Cannot run tools on this restricted page.");
        return;
    }

    chrome.storage.sync.get(['geminiApiKey', 'ttsRate', 'ttsVoice'], async (settings) => {
        const apiKey = settings.geminiApiKey;
        const ttsRate = settings.ttsRate || 0.9;
        const ttsVoice = settings.ttsVoice;

        // --- FEATURE: TEXT TO SPEECH ---
        if (info.menuItemId === "read-aloud") {
            const speechOptions = {rate: ttsRate};
            if (ttsVoice && ttsVoice !== "") {
                speechOptions.voiceName = ttsVoice;
            }
            chrome.tts.speak(info.selectionText || "", speechOptions);
            return;
        }

        if (!apiKey) {
            sendToastToTab(tab.id, "⚠️ Please enter your Gemini API Key in the extension Options page first.");
            return;
        }

        const INTERACTIONS_URL = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
        const AI_MODEL = "gemini-3.5-flash";

        if (info.menuItemId === "simplify-jargon") {
            sendToastToTab(tab.id, "✨ AI is thinking...");
            const promptText = `Explain this text simply, removing complex jargon, for someone who needs clear and accessible language. Keep it brief:\n\n"${info.selectionText}"`;

            try {
                const response = await fetch(INTERACTIONS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        model: AI_MODEL,
                        input: promptText
                    })
                });
                const data = await response.json();
                if (data.error) return sendToastToTab(tab.id, "❌ Gemini API Error: " + data.error.message);

                sendToastToTab(tab.id, "🧠 Simplified:\n\n" + extractTextFromResult(data));
            } catch (error) {
                sendToastToTab(tab.id, "❌ Network Error: " + error.message);
            }
        }

        if (info.menuItemId === "translate-text") {
            sendToastToTab(tab.id, "✨ AI is translating...");
            const promptText = `Translate the following text to plain English. If it is already in English, simply fix any grammar or spelling mistakes:\n\n"${info.selectionText}"`;

            try {
                const response = await fetch(INTERACTIONS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        model: AI_MODEL,
                        input: promptText
                    })
                });
                const data = await response.json();
                if (data.error) return sendToastToTab(tab.id, "❌ Gemini API Error: " + data.error.message);

                sendToastToTab(tab.id, "🌐 Translation:\n\n" + extractTextFromResult(data));
            } catch (error) {
                sendToastToTab(tab.id, "❌ Network Error: " + error.message);
            }
        }

        if (info.menuItemId === "ask-ai") {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                func: () => prompt("What do you want to ask the AI about this highlighted text?")
            }, async (results) => {
                if (!results || !results[0] || !results[0].result) return;

                const userQuestion = results[0].result;

                sendToastToTab(tab.id, "✨ AI is thinking...");
                const promptText = `Based on this text: "${info.selectionText}"\n\nAnswer this question: "${userQuestion}"`;

                try {
                    const response = await fetch(INTERACTIONS_URL, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            model: AI_MODEL,
                            input: promptText
                        })
                    });
                    const data = await response.json();
                    if (data.error) return sendToastToTab(tab.id, "❌ Gemini API Error: " + data.error.message);

                    sendToastToTab(tab.id, `💬 Q: ${userQuestion}\n\n` + extractTextFromResult(data));
                } catch (error) {
                    sendToastToTab(tab.id, "❌ Network Error: " + error.message);
                }
            });
        }

        if (info.menuItemId === "describe-image" && info.srcUrl) {
            sendToastToTab(tab.id, "✨ AI is analyzing image...");
            try {
                const imageData = await fetchAndEncodeImage(info.srcUrl);
                const promptText = "Describe this image in high detail for a visually impaired user. If there are people, describe their facial expressions and emotions. Do not identify them by name.";

                const response = await fetch(INTERACTIONS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        model: AI_MODEL,
                        input: [
                            {
                                type: "text",
                                text: promptText
                            },
                            {
                                type: "image",
                                data: imageData.data,
                                mime_type: imageData.mimeType
                            }
                        ]
                    })
                });
                const data = await response.json();
                if (data.error) return sendToastToTab(tab.id, "❌ Gemini API Error: " + data.error.message);

                sendToastToTab(tab.id, "🖼️ Image Description:\n\n" + extractTextFromResult(data));
            } catch (error) {
                sendToastToTab(tab.id, "❌ Error analyzing image. Some websites block image downloads.");
            }
        }

        if (info.menuItemId === "extract-text" && info.srcUrl) {
            sendToastToTab(tab.id, "✨ AI is reading text from image...");
            try {
                const imageData = await fetchAndEncodeImage(info.srcUrl);
                const promptText = "Extract all the text you can read in this image. Return ONLY the extracted text, preserving the formatting as best as possible. If there is no text, reply 'No text found in this image.'";

                const response = await fetch(INTERACTIONS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        model: AI_MODEL,
                        input: [
                            {
                                type: "text",
                                text: promptText
                            },
                            {
                                type: "image",
                                data: imageData.data,
                                mime_type: imageData.mimeType
                            }
                        ]
                    })
                });
                const data = await response.json();
                if (data.error) return sendToastToTab(tab.id, "❌ Gemini API Error: " + data.error.message);

                sendToastToTab(tab.id, "📝 Extracted Text:\n\n" + extractTextFromResult(data));
            } catch (error) {
                sendToastToTab(tab.id, "❌ Error extracting text. Some websites block image downloads.");
            }
        }
    });
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "summarize_page") {
        sendToastToTab(request.tabId, "✨ AI is reading the page...");

        const truncatedText = request.text.substring(0, 15000);

        chrome.storage.sync.get(['geminiApiKey'], async (settings) => {
            if (!settings.geminiApiKey) {
                sendToastToTab(request.tabId, "⚠️ Please enter your API Key in the Options page.");
                return;
            }

            const INTERACTIONS_URL = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${settings.geminiApiKey}`;
            const promptText = `Provide a comprehensive, easy-to-read summary of this webpage content:\n\n${truncatedText}`;

            try {
                const response = await fetch(INTERACTIONS_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        model: "gemini-3.5-flash",
                        input: promptText
                    })
                });

                const data = await response.json();

                if (data.error) {
                    sendToastToTab(request.tabId, "❌ Gemini API Error: " + data.error.message);
                    return;
                }

                sendToastToTab(request.tabId, "📝 Page Summary:\n\n" + extractTextFromResult(data));

            } catch (error) {
                sendToastToTab(request.tabId, "❌ Network Error: " + error.message);
            }
        });

        return true;
    }
});