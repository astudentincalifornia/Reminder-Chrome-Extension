let time;
let timerInterval;
let initialDuration;
let currentTime = null;
let pomodoroCount = 0;

function updateButtons(state) {
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const startLongBreakBtn = document.getElementById("startLongBreak");
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");
    const skipBtn = document.getElementById("skip");

    [startWorkBtn, startBreakBtn, stopBtn].forEach(btn => {
        if (btn) btn.style.display = 'none';
    });

    switch(state){
        case 'ready':
            if (startWorkBtn) startWorkBtn.style.display = 'inline-block';
            break;
        case 'working':
            if (stopBtn) stopBtn.style.display = 'inline-block';
            if (skipBtn) skipBtn.style.display = 'inline-block';
            break;
        case 'workDone':
            if (pomodoroCount % 4 === 0 && pomodoroCount > 0){
                if (startLongBreakBtn) startLongBreakBtn.style.display = 'inline-block';
            } else {
                if (startBreakBtn) startBreakBtn.style.display = 'inline-block';
            }
            break;
        case 'breaking':
        case 'longBreaking':
            if (stopBtn) stopBtn.style.display = 'inline-block';
            if (skipBtn) skipBtn.style.display = 'inline-block';
            break;
        case 'paused':
            if (currentType === 'work'){
                if (startWorkBtn) startWorkBtn.style.display = 'inline-block';
            } else if (currentType === 'break'){
                if (startBreakBtn) startBreakBtn.style.display = 'inline-block';
            } else if (currentType === 'longBreak') {
                if (startLongBreakBtn) startLongBreakBtn.style.display = 'inline-block';
            }
            if (skipBtn) skipBtn.style.display = 'inline-block';
            break;
    }

    if (resetBtn) resetBtn.style.display = 'inline-block';
    updatePomodoroDisplay();
}

function updatePomodoroDisplay(){
    const pomodoroDisplay = document.getElementById('pomodoro-count');
    if (pomodoroDisplay) {
        const cyclePosition = pomodoroCount % 4;
        const completedCycles = Math.floor(pomodoroCount / 4);
        pomodoroDisplay.textContent = `${cyclePosition}/4 (Cycles: ${completedCycles})`;
    }
}

function startTimer(duration, type) {
    console.log('Starting timer with duration:', duration, 'type:', type);
    initialDuration = duration;
    currentType = type;
    const startTimestamp = Date.now();
    chrome.storage.local.set({
        pomodoro_timer: {
            start: startTimestamp,
            duration: duration,
            type: type,
            initialDuration: duration,
            pomodoroCount: pomodoroCount
        }
    });
    time = duration;
    console.log('Initial time set to:', time);
    window.updateTimerDisplay(time, initialDuration);
    
    if (type === 'work') {
        updateButtons('working');
    } else if (type === 'break') {
        updateButtons('breaking');
    } else if (type === 'longBreak') {
        updateButtons('longBreaking');
    }

    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            console.log('Timer tick, time now:', time);
            window.updateTimerDisplay(time, initialDuration);
        } else {
            console.log('Timer finished');
            clearInterval(timerInterval);
            timerInterval = null;
            chrome.storage.local.remove("pomodoro_timer");

            if (type === 'workDone'){
                pomodoroCount++;
                updateButtons('workDone');
            } else if (type === 'break'){
                updateButtons('ready');
            } else if (type === 'longBreak') {
                updateButtons('ready');
            }

        }
    }, 1000);
}

function restoreTimer() {
    console.log('Restoring timer...');
    chrome.storage.local.get("pomodoro_timer", function(result){
        if (result.pomodoro_timer) {
            console.log('Found stored timer:', result.pomodoro_timer);
            const {start, duration, type, initialDuration: storedInitial, pomodoroCount: storedCount} = result.pomodoro_timer;
            initialDuration = storedInitial || duration;
            currentType = type;
            pomodoroCount =  storedCount; 
            const elapsed = Math.floor((Date.now()-start)/1000);
            const remaining = duration - elapsed;
            console.log('Elapsed:', elapsed, 'Remaining:', remaining);
            if (remaining > 0) {
                time = remaining;
                window.updateTimerDisplay(time, initialDuration);
                if (type === 'work') {
                    updateButtons('working');
                } else if (type === 'break') {
                    updateButtons('breaking');
                } else if (type === 'longBreak'){
                    updateButtons('longBreaking');
                }
                timerInterval = setInterval(function () {
                    if (time > 0) {
                        time--;
                        console.log('Restored timer tick, time now:', time);
                        window.updateTimerDisplay(time, initialDuration);
                    } else{
                        console.log('Restored timer finished');
                        clearInterval(timerInterval);
                        timerInterval = null;
                        chrome.storage.local.remove("pomodoro_timer");

                        if(type === 'work'){
                            pomodoroCount++;
                            updateButtons('workDone');
                        } else if (type === 'break'){
                            updateButtons('ready');
                        } else if (type === 'longBreak'){
                            updateButtons('ready');
                        }
                    }
                }, 1000);
            } else {
                time = 0;
                window.updateTimerDisplay(time, initialDuration);
                chrome.storage.local.remove("pomodoro_timer");
                if (type === 'work'){
                    pomodoroCount++;
                    updateButtons('workDone');
                } else if (type === 'break') {
                    updateButtons('ready');
                } else if (type === 'longBreak'){
                    updateButtons('ready');
                }
            } 
        } else {
            console.log('No stored timer found, setting default');
            time = 25 * 60;
            initialDuration = 25*60
            pomodoroCount = 0;
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
    chrome.storage.local.remove("pomodoro_timer");
    time = 25*60;
    initialDuration = 25*60;
    currentType = null;
    pomodoroCount = 0;
    window.updateTimerDisplay(time, initialDuration);
    updateButtons('ready');
}

function resumeTimer() {
    console.log("Resuming timer...");
    if (!timerInterval && time > 0){
        const startTimestamp = Date.now() - ((initialDuration - time) * 1000);
        chrome.storage.local.set({
            pomodoro_timer: {
                start: startTimestamp,
                duration: initialDuration,
                type: currentType || "work",
                initialDuration: initialDuration,
                pomodoroCount: pomodoroCount
            }
        });

        if (currentType === 'work') {
            updateButtons('working');
        } else if (currentType === 'break') {
            updateButtons('breaking');
        } else if (currentType === 'longBreak'){
            updateButtons('longBreaking');
        }

        timerInterval = setInterval(function() {
            if (time>0) {
                time--;
                console.log('Resumed');
                window.updateTimerDisplay(time, initialDuration);
            } else {
                console.log("resumed timer finished");
                clearInterval(timerInterval);
                timerInterval = null;
                chrome.storage.local.remove("pomodoro_timer");

                if(currentType === 'work') {
                    pomodoroCount++;
                    updateButtons('workDone');
                } else if (currentType === 'break'){
                    updateButtons('breakDone');
                } else if (currentType === 'longBreak'){
                    updateButtons('longBreakDone');
                }
            }
        }, 1000);
    }
}

function skipTimer (){
    if(timerInterval) {
        clearInterval(timerInterval);
        timerInterval=null;
    }
    chrome.storage.local.remove('pomodoro_timer');

    if (currentType === 'work'){
        pomodoroCount++;
        updateButtons('workDone');
    } else if (currentType === 'break'){
        updateButtons('ready');
    } else if (currentType === 'longBreak'){
        updateButtons('ready');
    }

    time = 0;
    window.updateTimerDisplay(time, initialDuration);
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const startLongBreak = document.getElementById('startLon')
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");
    const skipBtn = document.getElementById('skip');
    
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

    if(skipBtn) {
        skipBtn.addEventListener("click", function () {
            skipTimer();
        })
    }

    if(startLongBreakBtn){
        startLongBreakBtn.addEventListener("click", function(){
            if (timerInterval) {
                return;
            }
            startTimer(25*60, "longBreak");
        });
    }


    restoreTimer();
});
