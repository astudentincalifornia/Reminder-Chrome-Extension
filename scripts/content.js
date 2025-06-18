const isFirefox = window.isFirefox || typeof browser !== 'undefined';
const api = window.api || (isFirefox ? browser : chrome);

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageTitle") {
        const title = document.title || "Untitled Page";
        sendResponse({ title: title });
    }
    return true;
});

function getLinkContext(linkElement) {
    const linkText = linkElement.textContent.trim();
    if (linkText && linkText !== linkElement.href) {
        return linkText;
    }

    const img = linkElement.querySelector('img');
    if (img && img.alt){
        return img.alt;
    }

    const parent = linkElement.parentElement;
    if (parent) {
        const parentText = parent.textContent.trim();
        if (parentText && parentText !== linkElement.href && parentText.length < 100){
            return parentText;
        }
    }

    return null;
}