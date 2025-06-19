const isFirefox = typeof browser !== 'undefined';
const api = isFirefox ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
    api.contextMenus.create({
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

api.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId){
        case "saveLink":
            saveLinkToMemory(info,tab);
            break;
    }
});

function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8211;/g, '-') 
        .replace(/&#8212;/g, '—')  
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
}

async function fetchPageTitle(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Browser Extension)'
            }
        });
        
        if (response.ok) {
            const html = await response.text();
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

            if (titleMatch && titleMatch[1]) {
                const title = decodeHtmlEntities(titleMatch[1]);
                return title.trim();
            }
        }
    } catch(error) {
        console.error('Error fetching page title:', error);
    }

    try {
        const newTab = await api.tabs.create({url: url, active: false});

        await new Promise((resolve)=> {
            const listener = (tabId, info) => {
                if (tabId === newTab.id && info.status === 'complete') {
                    api.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            api.tabs.onUpdated.addListener(listener);

            setTimeout(() => {
                api.tabs.onUpdated.removeListener(listener);
                resolve();
            }, 10000);
        });

        let results;
        if (isFirefox) {
            results = await api.tabs.executeScript(newTab.id, {
                code: 'document.title'
            });
        } else {
            results = await api.scripting.executeScript({
                target: { tabId: newTab.id},
                func: () => document.title
            });
        }

        api.tabs.remove(newTab.id);
        return results[0]?.result || results[0] || null;
    } catch (error) {
        return null;
    } 
}

async function saveLinkToMemory(info, tab){
    
    showNotification('Fetching page title...', 'info');

    const fetchedTitle = await fetchPageTitle(info.linkUrl);
    
    const linkData = {
        id: Date.now().toString(),
        type: 'link',
        url: info.linkUrl,
        title: fetchedTitle || info.linkText || 'Untitled Link',
        originalLinkText: info.linkText,
        sourceUrl: tab.url,
        sourceTitle: tab.title,
        timestamp: new Date().toISOString(),
        tags: []
    };

    try{
        const result = await (isFirefox ?
            api.storage.local.get(['memory_links']) :
            new Promise(resolve => api.storage.local.get(['memory_links'], resolve))
        );

        const existingLinks = result.memory_links || [];
        existingLinks.push(linkData);

        await (isFirefox ? 
            api.storage.local.set({ memory_links: existingLinks }) :
            new Promise(resolve => api.storage.local.set({ memory_links: existingLinks }, resolve))
        );

        showNotification(`Link saved: ${linkData.title}`, 'success');
    } catch (error) {
        showNotification('Error saving link', 'error');
    }
}

function showNotification(message, type = 'info') {
    const title = type === 'error' ? 'Error, Something went wrong': type === 'success' ? 'Success, saved to memory': 'Pomodoro Memory';

    api.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon.png', // Add this line
        title: title,
        message: message
    });
}