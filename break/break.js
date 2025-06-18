const isFirefox = window.isFirefox || typeof browser !== 'undefined';
const api = window.api || (isFirefox ? browser : chrome);

let zenCountdownInterval;

function initializeBreakPage() {
    loadSavedLinks();
    setupEventListeners();
}

function loadSavedLinks(){
    const linksList = document.getElementById('links-list');

    if (isFirefox) {
        api.storage.local.get(['memory_links']).then((result) => {
            processSavedLinks(result, linksList);
        });
    } else {
        api.storage.local.get(['memory_links'], function(result) {
            processSavedLinks(result, linksList);
        });
    }
}

function processSavedLinks(result, linksList) {
    const links = result.memory_links || [];

    if (links.length === 0) {
        linksList.innerHTML = '<li> No links saved yet </li>';
        return;
    }

    linksList.innerHTML = '';
    links.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `saved-item ${item.type}`;
        
        li.onclick = (e) => {
            if (e.target.classList.contains('delete-btn')) {
                return;
            }
            window.open(item.url, '_blank');
        };

        const contentDiv = document.createElement('div');
        contentDiv.className = 'saved-item-content';

        if (item.type === 'text') {
            contentDiv.innerHTML = `
                <strong>Text from ${item.title}:</strong><br>
                "${item.content}" <br>
                <small>Source: ${item.url}</small>
            `;
        } else {
            const titleSpan = document.createElement('span');
            titleSpan.textContent = item.title || item.url
            contentDiv.appendChild(titleSpan);

            const timestamp = document.createElement('small');
            timestamp.textContent = ` (${new Date(item.timestamp).toLocaleDateString()})`;
            timestamp.style.color = 'rgba(255, 255, 255, 0.7)';
            timestamp.style.display = 'block';
            contentDiv.appendChild(timestamp);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'x';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteSavedLink(index);
        };

        li.appendChild(contentDiv);
        li.appendChild(deleteBtn);
        linksList.appendChild(li);
    });
}


function deleteSavedLink(index) {
    if(isFirefox) {
        api.storage.local.get(['memory_links']).then((result) => {
            const links = result.memory_links || [];
            links.splice(index, 1);
            
            return api.storage.local.set({memory_links: links});
        }).then(() => {
            loadSavedLinks();
        });
    } else {
        api.storage.local.get(['memory_links'], function(result) {
            const links = result.memory_links || [];
            links.splice(index, 1);

            api.storage.local.set({memory_links: links}, function(){
                loadSavedLinks();
            });
        });
    }
}


function setupEventListeners() {
    const zenModeButton = document.getElementById('zen-mode');
    const zenOverlay = document.getElementById('zen-overlay');

    if(zenModeButton) {
        zenModeButton.addEventListener('click', enterZenMode);
    }

    if (zenOverlay) {
        zenOverlay.addEventListener('click', (event) => {
            if (event.target === zenOverlay) {
                exitZenMode();
            }
        });
    }

    // if (zenOverlay && !document.getElementById('exit-zen')) {
        // const 
    // }
}

function enterZenMode(){
    const zenOverlay = document.getElementById('zen-overlay');
    if (isFirefox) {
        api.storage.local.get("pomodoro_timer").then((result) => {
            zenMode(result, zenOverlay);
        });
    } else {
        api.storage.local.get("pomodoro_timer", function(result) {
            zenMode(result, zenOverlay);
        });
    }
}

function zenMode(result, zenOverlay){
    let timeRemaining = 300;

    if (result.pomodoro_timer) {
        const {start, duration} = result.pomodoro_timer;
        const elapsed = Math.floor((Date.now() - start) / 1000);
        timeRemaining = Math.max (0, duration - elapsed);
    }

    zenOverlay.classList.remove('hidden');
    setTimeout(() => {
        zenOverlay.classList.add('visible');
    }, 10);

    updateZenTimerDisplay(timeRemaining);

    if(zenCountdownInterval) {
        clearInterval(zenCountdownInterval);
    }

    zenCountdownInterval = setInterval(() => {
        timeRemaining--;

        if(timeRemaining <= 0){
            clearInterval(zenCountdownInterval);
            timeRemaining = 0;
            exitZenMode();
        }

        updateZenTimerDisplay(timeRemaining);
    }, 1000);

    window.zenCountdownInterval = zenCountdownInterval;
}

function updateZenTimerDisplay(seconds) {
    const timerDisplay = document.getElementById('zen-timer-display');
    if (!timerDisplay) return;

    const minutes = Math.floor(seconds/60);
    const remainingSeconds = seconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function exitZenMode(){
    const zenOverlay = document.getElementById('zen-overlay');
    
    zenOverlay.classList.remove('visible');
    setTimeout(() => {
        zenOverlay.classList.add('hidden');
    }, 500);

    if (window.zenCountdownInterval) {
        clearInterval(window.zenCountdownInterval);
        window.zenCountdownInterval = null;
    }
    api.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon.png', // Add this line
        title: 'Break ended',
        message: 'get back to work'
    });
}


document.addEventListener('DOMContentLoaded', initializeBreakPage);