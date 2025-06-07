let time;
let timerInterval;
function updateTimerDisplay() {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

function startTimer(duration, type) {
    const startTimestamp = Date.now();
    chrome.storage.local.set({
        timer: {
            start: startTimestamp,
            duration: duration,
            type: type
        }
    });
    time = duration;
    updateTimerDisplay();
    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            chrome.storage.local.remove("timer");
        }
    }, 1000);
}

function restoreTimer() {
    chrome.storage.local.get("timer", function(result){
        if (result.timer) {
            const {start, duration, type} = result.timer;
            const elapsed = Math.floor(Date.now()-start)/1000;
            const remaining = duration - elapsed;
            if (remaining > 0) {
                time = remaining;
                updateTimerDisplay();
                timerInterval = setInterval(function () {
                    if (time > 0) {
                        time--;
                        updateTimerDisplay();
                    } else{
                        clearInterval(timerInterval);
                        timerInterval = null;
                        chrome.storage.local.remove("timer");
                    }
                }, 1000);
            } else {
                time = 0;
                updateTimerDisplay();
                chrome.storage.local.remove("timer");
            } 
        } else {
            time = 25 * 60;
            updateTimerDisplay();
        }
    });
}

document.getElementById("startWork").addEventListener("click", function() {
    if (timerInterval) {
        return;
    }
    startTimer(25 * 60, "work");
});

document.getElementById("startBreak").addEventListener("click", function(){
    if (timerInterval) {
        return;
    }
    startTimer(5*60, "break");
});

restoreTimer();