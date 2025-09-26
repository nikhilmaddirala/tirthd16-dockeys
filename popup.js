// Popup script for toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.getElementById('statusIndicator');
    const toggleButton = document.getElementById('toggleButton');

    // Function to update UI based on extension state
    function updateUI(isEnabled) {
        if (isEnabled) {
            statusIndicator.textContent = 'DocsKeys is Enabled';
            statusIndicator.className = 'status-indicator enabled';
            toggleButton.textContent = 'Disable Extension';
            toggleButton.className = 'toggle-button';
        } else {
            statusIndicator.textContent = 'DocsKeys is Disabled';
            statusIndicator.className = 'status-indicator disabled';
            toggleButton.textContent = 'Enable Extension';
            toggleButton.className = 'toggle-button disabled';
        }
    }

    // Get initial state
    chrome.storage.sync.get(['docskeys-enabled']).then(result => {
        const isEnabled = result['docskeys-enabled'] !== false;
        updateUI(isEnabled);
    });

    // Handle toggle button click
    toggleButton.addEventListener('click', async function() {
        try {
            // Get current state
            const result = await chrome.storage.sync.get(['docskeys-enabled']);
            const currentState = result['docskeys-enabled'] !== false;
            const newState = !currentState;

            // Save new state
            await chrome.storage.sync.set({ 'docskeys-enabled': newState });

            // Update UI
            updateUI(newState);

            // Send message to all Google Docs tabs
            const tabs = await chrome.tabs.query({ url: 'https://docs.google.com/*' });

            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'TOGGLE_EXTENSION',
                        enabled: newState
                    });
                } catch (error) {
                    // Tab might not have content script loaded, ignore
                    console.log('Could not send message to tab:', tab.id);
                }
            }

            console.log(`DocsKeys ${newState ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error toggling extension:', error);
        }
    });
});
