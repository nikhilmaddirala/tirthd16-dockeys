// Background script for DocsKeys extension
// Handles keyboard shortcuts and toggle functionality

// Set default enabled state when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ 'docskeys-enabled': true });
});

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-extension') {
        toggleExtension();
    }
});

// Function to toggle the extension on/off
async function toggleExtension() {
    try {
        // Get current state
        const result = await chrome.storage.sync.get(['docskeys-enabled']);
        const currentState = result['docskeys-enabled'] !== false; // Default to true if not set
        const newState = !currentState;

        // Save new state
        await chrome.storage.sync.set({ 'docskeys-enabled': newState });

        // Send message to all Google Docs tabs to update their state
        const tabs = await chrome.tabs.query({ url: 'https://docs.google.com/*' });

        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_EXTENSION',
                    enabled: newState
                });
            } catch (error) {
                // Tab might not have the content script loaded yet, ignore
                console.log('Could not send message to tab:', tab.id);
            }
        }

        // Update extension icon to reflect state
        updateIcon(newState);

        console.log(`DocsKeys ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Error toggling extension:', error);
    }
}

// Function to update the extension icon based on enabled state
function updateIcon(enabled) {
    const iconPath = enabled ? 'icons/32.png' : 'icons/32-disabled.png';
    chrome.action.setIcon({ path: iconPath });
}

// Listen for tab updates to set correct icon state
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes('docs.google.com')) {
        const result = await chrome.storage.sync.get(['docskeys-enabled']);
        const isEnabled = result['docskeys-enabled'] !== false;
        updateIcon(isEnabled);
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_EXTENSION_STATE') {
        chrome.storage.sync.get(['docskeys-enabled']).then(result => {
            const isEnabled = result['docskeys-enabled'] !== false;
            sendResponse({ enabled: isEnabled });
        });
        return true; // Will respond asynchronously
    }
});
