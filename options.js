document.addEventListener('DOMContentLoaded', () => {
    const voiceSelect = document.getElementById('voiceSelect');

    // 1. Fetch available computer voices and populate the dropdown
    chrome.tts.getVoices((voices) => {
        if (voices && voices.length > 0) {
            voices.forEach((voice) => {
                const option = document.createElement('option');
                option.value = voice.voiceName;
                option.textContent = `${voice.voiceName} (${voice.lang || 'Unknown'})`;
                voiceSelect.appendChild(option);
            });
        }

        // 2. Load saved settings after voices are populated
        chrome.storage.sync.get(['geminiApiKey', 'ttsRate', 'ttsVoice'], (items) => {
            if (items.geminiApiKey) {
                document.getElementById('apiKey').value = items.geminiApiKey;
            }

            if (items.ttsRate) {
                document.getElementById('speechRate').value = items.ttsRate;
                document.getElementById('rateValue').innerText = items.ttsRate;
            }

            if (items.ttsVoice) {
                voiceSelect.value = items.ttsVoice;
            }
        });
    });
});

// Update the speech rate number label in real-time
document.getElementById('speechRate').addEventListener('input', (event) => {
    document.getElementById('rateValue').innerText = event.target.value;
});

// Save settings when the button is clicked
document.getElementById('saveBtn').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const ttsRate = parseFloat(document.getElementById('speechRate').value);
    const ttsVoice = document.getElementById('voiceSelect').value;

    chrome.storage.sync.set(
        {
            geminiApiKey: apiKey,
            ttsRate: ttsRate,
            ttsVoice: ttsVoice
        },
        () => {
            const status = document.getElementById('status');
            status.textContent = '✅ Settings saved successfully!';
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        }
    );
});