let time;
let timerInterval;

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
    window.updateTimerDisplay(time);
    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            window.updateTimerDisplay(time);
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
            const elapsed = Math.floor((Date.now()-start)/1000);
            const remaining = duration - elapsed;
            if (remaining > 0) {
                time = remaining;
                window.updateTimerDisplay(time);
                timerInterval = setInterval(function () {
                    if (time > 0) {
                        time--;
                        window.updateTimerDisplay(time);
                    } else{
                        clearInterval(timerInterval);
                        timerInterval = null;
                        chrome.storage.local.remove("timer");
                    }
                }, 1000);
            } else {
                time = 0;
                window.updateTimerDisplay(time);
                chrome.storage.local.remove("timer");
            } 
        } else {
            time = 25 * 60;
            window.updateTimerDisplay(time);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
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
});