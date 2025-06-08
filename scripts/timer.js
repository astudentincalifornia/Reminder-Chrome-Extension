let time;
let timerInterval;
let initialDuration;

function startTimer(duration, type) {
    console.log('Starting timer with duration:', duration, 'type:', type);
    initialDuration = duration;
    const startTimestamp = Date.now();
    chrome.storage.local.set({
        timer: {
            start: startTimestamp,
            duration: duration,
            type: type,
            initialDuration: duration
        }
    });
    time = duration;
    console.log('Initial time set to:', time);
    window.updateTimerDisplay(time, initialDuration);
    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            console.log('Timer tick, time now:', time);
            window.updateTimerDisplay(time, initialDuration);
        } else {
            console.log('Timer finished');
            clearInterval(timerInterval);
            timerInterval = null;
            chrome.storage.local.remove("timer");
        }
    }, 1000);
}

function restoreTimer() {
    console.log('Restoring timer...');
    chrome.storage.local.get("timer", function(result){
        if (result.timer) {
            console.log('Found stored timer:', result.timer);
            const {start, duration, type, initialDuration: storedInitial} = result.timer;
            initialDuration = storedInitial || duration;
            const elapsed = Math.floor((Date.now()-start)/1000);
            const remaining = duration - elapsed;
            console.log('Elapsed:', elapsed, 'Remaining:', remaining);
            if (remaining > 0) {
                time = remaining;
                window.updateTimerDisplay(time, initialDuration);
                timerInterval = setInterval(function () {
                    if (time > 0) {
                        time--;
                        console.log('Restored timer tick, time now:', time);
                        window.updateTimerDisplay(time, initialDuration);
                    } else{
                        console.log('Restored timer finished');
                        clearInterval(timerInterval);
                        timerInterval = null;
                        chrome.storage.local.remove("timer");
                    }
                }, 1000);
            } else {
                time = 0;
                window.updateTimerDisplay(time, initialDuration);
                chrome.storage.local.remove("timer");
            } 
        } else {
            console.log('No stored timer found, setting default');
            time = 25 * 60;
            initialDuration = 25*60
            window.updateTimerDisplay(time, initialDuration);
        }
    });
}

function stopTimer(){
    console.log("Stopping timer... ");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    if (timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
    chrome.storage.local.remove("timer");
    time = 25*60;
    initialDuration = 25*60;
    window.updateTimerDisplay(time, initialDuration);
}

function resumeTimer() {
    console.log("Resuming timer...");
    if (!timerInterval && time > 0){
        const startTimestamp = Date.now() - ((initialDuration - time) * 1000);
        chrome.storage.local.set({
            timer: {
                start: startTimestamp,
                duration: initialDuration,
                type: "work",
                initialDuration: initialDuration
            }
        });

        timerInterval = setInterval(function() {
            if (time>0) {
                time--;
                console.log('Resumed');
                window.updateTimerDisplay(time, initialDuration);
            } else {
                console.log("resumed timer finished");
                clearInterval(timerInterval);
                timerInterval = null;
                chrome.storage.local.remove("timer");
            }
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");
    
    console.log('Start work button:', startWorkBtn);
    console.log('Start break button:', startBreakBtn);
    console.log('Stop button:', stopBtn);
    console.log('Reset button:', resetBtn);
    
    if (startWorkBtn) {
        startWorkBtn.addEventListener("click", function() {
            console.log('Start work clicked');
            if (timerInterval) {
                console.log('Timer already running, ignoring click');
                return;
            }
            
            if(time>0 && time < initialDuration) {
                resumeTimer();
            } else {
                startTimer(25 * 60, "work");
            }
        });
    }

    if (startBreakBtn) {
        startBreakBtn.addEventListener("click", function(){
            console.log('Start break clicked');
            if (timerInterval) {
                console.log('Timer already running, ignoring click');
                return;
            }
            startTimer(5*60, "break");
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener("click", function(){
            console.log("Stop");
            stopTimer();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", function(){
            console.log("Reset");
            resetTimer();
        })
    }

    restoreTimer();
});
