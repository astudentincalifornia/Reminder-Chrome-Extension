(function() {
    'use strict';

    const isFirefox = typeof browser !== 'undefined';
    window.isFirefox = isFirefox;

    if (isFirefox) {
        window.api = {
            ...browser,
            storage: {
                local: {
                    get: (keys) => browser.storage.local.get(keys),
                    set: (items) => browser.storage.local.get(items),
                    remove: (keys) => browser.storage.local.remove(keys)
                }
            }
        };
    } else {
        window.api = {
            ...chrome,
            storage: {
                local: {
                    get: (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
                    set: (items) => new Promise(resolve => chrome.storage.local.set(items, resolve)),
                    remove: (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve))
                }
            }
        };
        if (chrome.tabs && chrome.tabs.create) {
            const originalCreate = chrome.tabs.create;
            api.tabs.create = (options) => new Promise((resolve, reject) => {
                originalCreate(options, (tab) => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                    else resolve(tab);
                });
            });
        }
    }
})();