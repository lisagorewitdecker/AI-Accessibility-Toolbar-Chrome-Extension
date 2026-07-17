// Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showToast") {
        showResultOnScreen(request.text);
    }
});

// The function to create and display the accessible UI
function showResultOnScreen(text) {
    const existingToast = document.getElementById('ai-access-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'ai-access-toast';

    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.right = '30px';
    toast.style.maxWidth = '400px';
    toast.style.maxHeight = '80vh';
    toast.style.overflowY = 'auto';
    toast.style.backgroundColor = '#121212';
    toast.style.color = '#ffffff';
    toast.style.padding = '20px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    toast.style.zIndex = '2147483647';
    toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    toast.style.fontSize = '18px';
    toast.style.lineHeight = '1.5';
    toast.style.border = '3px solid #6f42c1';

    const content = document.createElement('div');
    content.innerText = text;
    content.style.marginBottom = '20px';
    content.style.whiteSpace = 'pre-wrap';
    toast.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.backgroundColor = '#6f42c1';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.padding = '10px 20px';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.width = '100%';

    closeBtn.onclick = () => toast.remove();

    closeBtn.onmouseover = () => {
        closeBtn.style.backgroundColor = '#59359a';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.backgroundColor = '#6f42c1';
    };

    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
}