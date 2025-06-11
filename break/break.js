let zenCountdownInterval;

function initializeBreakPage() {
    loadSavedLinks();
    setupEventListeners();
}

function loadSavedLinks(){
    const linksList = document.getElementById('links-list');

    chrome.storage.local.get(['memory_links'], function(result) {
        const links = result.memory_links || [];

        if (links.length === 0) {
            linksList.innerHTML = '<li> No links saved yet </li>';
            return;
        }

        linksList.innerHTML = '';
        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.title || link.url;
            a.target = '_blank';
            li.appendChild(a);
            linksList.appendChild(li);
        });
    });
}

function setupEventListeners() {
    const zenModeButton = document.getElementById('zen-mode');
    const zenOverlay = document.getElementById('zen-overlay');

    if(zenModeButton) {
        zenModeButton.addEventListener('click', enterZenMode);
    }

    // if (zenOverlay && !document.getElementById('exit-zen')) {
        // const 
    // }
}

function enterZenMode(){
    const zenOverlay = document.getElementById('zen-overlay');
    const timerDisplay = document.getElementById('zen-timer-display');

    chrome.storage.local.get("pomodoro_timer", function (result) {
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

    });
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

}

document.addEventListener('DOMContentLoaded', initializeBreakPage);