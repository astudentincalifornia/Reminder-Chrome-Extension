chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "saveLink",
        title: "Save link to break",
        contexts: ["link"]
    });

    // chrome.contextMenus.create({
    //     id: "saveTextWithUrl",
    //     title: "Save selection with page URL",
    //     contexts: ["selection"]
    // });
    
    // chrome.contextMenus.create({
    //     id: "savePage",
    //     title: "Save this page to memory",
    //     contexts: ["page"]
    // });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId){
        case "saveLink":
            saveLinkToMemory(info,tab);
            break;
    }
});

function saveLinkToMemory(info, tab){
    const linkData = {
        id: Date.now().toString(),
        type: 'link',
        url: info.linkUrl,
        title: info.linkText && info.linkText.trim() ? info.linkText : tab.title || 'Untitled Link',
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        timestamp: new Date().toISOString(),
        tags: []
    };

    chrome.storage.local.get(['memory_links'], (result) => {
        const existingLinks = result.memory_links || [];
        existingLinks.push(linkData);

        chrome.storage.local.set({
            memory_links: existingLinks
        }, () => {
            if (chrome.runtime.lastError){
                showNotification('Error saving link', 'error');
            } else {
                showNotification(`Link saved: ${linkData.title}`, 'success');
            }
        });
    });
}

function showNotification(message, type = 'info') {
    const title = type === 'error' ? 'Error, Something went wrong': type === 'success' ? 'Success, saved to memory': 'Pomodoro Memory';

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon.png', // Add this line
        title: title,
        message: message
    });
}