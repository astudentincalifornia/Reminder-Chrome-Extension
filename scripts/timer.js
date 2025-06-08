let time;
let timerInterval;
let initialDuration;
let currentTime = null;

function updateButtons(state) {
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");

    [startWorkBtn, startBreakBtn, stopBtn].forEach(btn => {
        if (btn) btn.style.display = 'none';
    });

    switch(state){
        case 'ready':
            if (startWorkBtn) startWorkBtn.style.display = 'inline-block';
            break;
        case 'working':
            if (stopBtn) stopBtn.style.display = 'inline-block';
            break;
        case 'workDone':
            if (startBreakBtn) startBreakBtn.style.display = 'inline-block';
            break;
        case 'breaking':
            if (stopBtn) stopBtn.style.display = 'inline-block';
            break;
        case 'paused':
            if (currentType === 'work'){
                if (startWorkBtn) startWorkBtn.style.display = 'inline-block';
            } else {
                if (startBreakBtn) startBreakBtn.style.display = 'inline-block';
            }
            break;
    }

    if (resetBtn) resetBtn.style.display = 'inline-block';
}

function startTimer(duration, type) {
    console.log('Starting timer with duration:', duration, 'type:', type);
    initialDuration = duration;
    currentType = type;
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

    updateButtons(type==='work'?'working' : 'breaking');

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

            if (type === 'work'){
                updateButtons('workDone');
            } else {
                updateButtons('breakDone');
            }

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
            currentType = type;
            const elapsed = Math.floor((Date.now()-start)/1000);
            const remaining = duration - elapsed;
            console.log('Elapsed:', elapsed, 'Remaining:', remaining);
            if (remaining > 0) {
                time = remaining;
                window.updateTimerDisplay(time, initialDuration);
                updateButtons(type==='work'?'working' : 'breaking')
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

                        if(type === 'work'){
                            updateButtons('workDone');
                        } else {
                            updateButtons('breakDone');
                        }
                    }
                }, 1000);
            } else {
                time = 0;
                window.updateTimerDisplay(time, initialDuration);
                chrome.storage.local.remove("timer");
                updateButtons(type==='work' ? 'workDone' : 'breakDone');
            } 
        } else {
            console.log('No stored timer found, setting default');
            time = 25 * 60;
            initialDuration = 25*60
            window.updateTimerDisplay(time, initialDuration);
            updateButtons('ready');
        }
    });
}

function stopTimer(){
    console.log("Stopping timer... ");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateButtons('paused');
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
    currentType = null;
    window.updateTimerDisplay(time, initialDuration);
    updateButtons('ready');
}

function resumeTimer() {
    console.log("Resuming timer...");
    if (!timerInterval && time > 0){
        const startTimestamp = Date.now() - ((initialDuration - time) * 1000);
        chrome.storage.local.set({
            timer: {
                start: startTimestamp,
                duration: initialDuration,
                type: currentType || "work",
                initialDuration: initialDuration
            }
        });

        updateButtons(currentType === 'work'? 'working': 'breaking')

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

                if(currentType === 'work') {
                    updateButtons('workDone');
                } else {
                    updateButtons('breakDone');
                }
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
            
            if(time>0 && time < initialDuration && currentType === 'work') {
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

            if(time>0 && time<initialDuration && currentTime === 'break'){
                resumeTimer();
            } else {
                startTimer(5*60, "break");
            }
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
