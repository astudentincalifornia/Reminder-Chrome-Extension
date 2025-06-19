const isFirefox = window.isFirefox || typeof browser !== 'undefined';
const api = window.api || (isFirefox ? browser : chrome);

let time;
let timerInterval;
let initialDuration;
let currentType = null;
let pomodoroCount = 0;

function updateButtons(state) {
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const startLongBreakBtn = document.getElementById("startLongBreak");
    const stopBtn = document.getElementById("stop");
    const resetBtn = document.getElementById("reset");
    const skipBtn = document.getElementById("skip");

    [startWorkBtn, startBreakBtn, startLongBreakBtn, stopBtn, skipBtn].forEach(btn => {
        if (btn) btn.style.display = 'none';
    });

    switch(state){
        case 'ready':
            if (startWorkBtn) startWorkBtn.style.display = 'inline-block';
            if (skipBtn) skipBtn.style.display = 'none';
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

async function startTimer(duration, type) {
    console.log('Starting timer with duration:', duration, 'type:', type);
    initialDuration = duration;
    currentType = type;
    const startTimestamp = Date.now();
    
    try {
        await (isFirefox ? 
            api.storage.local.set({
                pomodoro_timer: {
                    start: startTimestamp,
                    duration: duration,
                    type: type,
                    initialDuration: duration,
                    pomodoroCount: pomodoroCount
                }
            }) :
            new Promise(resolve => api.storage.local.set({
                pomodoro_timer: {
                    start: startTimestamp,
                    duration: duration,
                    type: type,
                    initialDuration: duration,
                    pomodoroCount: pomodoroCount
                }
            }, resolve))
        );
        console.log("saved");
    } catch (error) {
        console.error('Error Saving: ', error);
    }

    time = duration;
    console.log('Initial time set to:', time);
    window.updateTimerDisplay(time, initialDuration);
    
    if (type === 'work') {
        updateButtons('working');
    } else if (type === 'break') {
        updateButtons('breaking');
        openBreakPage();
    } else if (type === 'longBreak') {
        updateButtons('longBreaking');
        openBreakPage();
    }

    timerInterval = setInterval(async function() {
        if (time > 0) {
            time--;
            console.log('Timer tick, time now:', time);
            window.updateTimerDisplay(time, initialDuration);
        } else {
            console.log('Timer finished');
            clearInterval(timerInterval);
            timerInterval = null;

            try {
                await (isFirefox ?
                    api.storage.local.remove("pomodoro_timer") :
                    new Promise(resolve => api.storage.local.remove("pomodoro_timer", resolve))
                );
            } catch (error) {
                console.error('Error removing timer from storage:', error);
            }
            
            api.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon.png',
                title: type === 'work' ? 'Work Session Complete' : 'Break Complete',
                message: type === 'work' ? 'Time for a break' : 'GET BACK TO WORK'
            });

            if (type === 'work'){
                pomodoroCount++;
                try {
                    await (isFirefox ?
                        api.storage.local.set({pomodoro_count: pomodoroCount}) :
                        new Promise(resolve => api.storage.local.set({pomodoro_count: pomodoroCount}, resolve))
                    );
                } catch (error) {
                    console.error('Error saving pomodoro count:', error);
                }
                updateButtons('workDone');
            } else if (type === 'break'){
                updateButtons('ready');
            } else if (type === 'longBreak') {
                updateButtons('ready');
            }

        }
    }, 1000);
}

async function processTimerRestore(result) {
    if (result.pomodoro_timer) {
        console.log('Found stored timer:', result.pomodoro_timer);
        const {start, duration, type, initialDuration: storedInitial, pomodoroCount: storedCount} = result.pomodoro_timer;
        initialDuration = storedInitial || duration;
        currentType = type;
        pomodoroCount =  storedCount || 0; 
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
            timerInterval = setInterval(async function () {
                if (time > 0) {
                    time--;
                    console.log('Restored timer tick, time now:', time);
                    window.updateTimerDisplay(time, initialDuration);
                } else{
                    console.log('Restored timer finished');
                    clearInterval(timerInterval);
                    timerInterval = null;
                    try {
                        await (isFirefox ?
                            api.storage.local.remove("pomodoro_timer") :
                            new Promise(resolve => api.storage.local.remove("pomodoro_timer", resolve))
                        );
                    } catch (error) {
                        console.error('Error removing timer from storage:', error);
                    }

                    if(type === 'work'){
                        pomodoroCount++;
                        try {
                            await (isFirefox ?
                                api.storage.local.set({pomodoro_count: pomodoroCount}) :
                                new Promise(resolve => api.storage.local.set({pomodoro_count: pomodoroCount}, resolve))
                            );
                        } catch (error) {
                            console.error('Error saving pomodoro count:', error);
                        }
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
            try {
                await (isFirefox ?
                    api.storage.local.remove("pomodoro_timer") :
                    new Promise(resolve => api.storage.local.remove("pomodoro_timer", resolve))
                );
            } catch (error) {
                console.error('Error removing timer from storage:', error);
            }
            if (type === 'work'){
                pomodoroCount++;
                try {
                    await (isFirefox ?
                        api.storage.local.set({pomodoro_count: pomodoroCount}) :
                        new Promise(resolve => api.storage.local.set({pomodoro_count: pomodoroCount}, resolve))
                    );
                } catch (error) {
                    console.error('Error saving pomodoro count:', error);
                }                
                updateButtons('workDone');
            } else if (type === 'break') {
                updateButtons('ready');
            } else if (type === 'longBreak'){
                updateButtons('ready');
            }
        } 
    } else {
        console.log('No stored timer found, setting default');
        pomodoroCount = result.pomodoro_count || 0;
        time = 25 * 60;
        initialDuration = 25*60;
        window.updateTimerDisplay(time, initialDuration);
        updateButtons('ready');
    }
}


async function restoreTimer() {
    console.log('Restoring timer...');
    
    try {
        const result = await (isFirefox ?
            api.storage.local.get(["pomodoro_timer", "pomodoro_count"]) :
            new Promise(resolve => api.storage.local.get(["pomodoro_timer", "pomodoro_count"], resolve))
        );
        await processTimerRestore(result);
    } catch (error) {
        console.error('Error restoring timer:', error);
    }
}

function stopTimer(){
    console.log("Stopping timer... ");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateButtons('paused');
    }
}

async function resetTimer() {
    if (timerInterval){
        clearInterval(timerInterval);
        timerInterval = null;
    }
    try {
        await (isFirefox ?
            api.storage.local.remove(["pomodoro_timer", "pomodoro_count"]) :
            new Promise(resolve => api.storage.local.remove(["pomodoro_timer", "pomodoro_count"], resolve))
        );
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
    time = 25*60;
    initialDuration = 25*60;
    currentType = null;
    pomodoroCount = 0;
    window.updateTimerDisplay(time, initialDuration);
    updateButtons('ready');
}

async function resumeTimer() {
    console.log("Resuming timer...");
    if (!timerInterval && time > 0){
        const startTimestamp = Date.now() - ((initialDuration - time) * 1000);
        try {
            await (isFirefox ?
                api.storage.local.set({
                    pomodoro_timer: {
                        start: startTimestamp,
                        duration: initialDuration,
                        type: currentType || "work",
                        initialDuration: initialDuration,
                        pomodoroCount: pomodoroCount
                    }
                }) :
                new Promise(resolve => api.storage.local.set({
                    pomodoro_timer: {
                        start: startTimestamp,
                        duration: initialDuration,
                        type: currentType || "work",
                        initialDuration: initialDuration,
                        pomodoroCount: pomodoroCount
                    }
                }, resolve))
            );
        } catch (error) {
            console.error('Error saving resumed timer state:', error);
        }

        if (currentType === 'work') {
            updateButtons('working');
        } else if (currentType === 'break') {
            updateButtons('breaking');
        } else if (currentType === 'longBreak'){
            updateButtons('longBreaking');
        }

        timerInterval = setInterval(async function() {
            if (time>0) {
                time--;
                console.log('Resumed');
                window.updateTimerDisplay(time, initialDuration);
            } else {
                console.log("resumed timer finished");
                clearInterval(timerInterval);
                timerInterval = null;
                try {
                    await (isFirefox ?
                        api.storage.local.remove("pomodoro_timer") :
                        new Promise(resolve => api.storage.local.remove("pomodoro_timer", resolve))
                    );
                } catch (error) {
                    console.error('Error removing timer from storage:', error);
                }

                if(currentType === 'work') {
                    pomodoroCount++;
                    try {
                        await (isFirefox ?
                            api.storage.local.set({pomodoro_count: pomodoroCount}) :
                            new Promise(resolve => api.storage.local.set({pomodoro_count: pomodoroCount}, resolve))
                        );
                    } catch (error) {
                        console.error('Error saving pomodoro count:', error);
                    }
                    updateButtons('workDone');
                } else if (currentType === 'break'){
                    updateButtons('ready');
                } else if (currentType === 'longBreak'){
                    updateButtons('ready');
                }
            }
        }, 1000);
    }
}

async function skipTimer (){
    if(timerInterval) {
        clearInterval(timerInterval);
        timerInterval=null;
    }
    try {
        await (isFirefox ?
            api.storage.local.remove('pomodoro_timer') :
            new Promise(resolve => api.storage.local.remove('pomodoro_timer', resolve))
        );
    } catch (error) {
        console.error('Error removing timer from storage:', error);
    }
    if (currentType === 'work'){
        pomodoroCount++;
        try {
            await (isFirefox ?
                api.storage.local.set({pomodoro_count: pomodoroCount}) :
                new Promise(resolve => api.storage.local.set({pomodoro_count: pomodoroCount}, resolve))
            );
        } catch (error) {
            console.error('Error saving pomodoro count:', error);
        }
        updateButtons('workDone');
    } else if (currentType === 'break'){
        updateButtons('ready');
    } else if (currentType === 'longBreak'){
        updateButtons('ready');
    }

    time = 0;
    window.updateTimerDisplay(time, initialDuration);
}

function openBreakPage() {
    const breakUrl = api.runtime.getURL('break/break.html');
    
    if (isFirefox) {
        api.tabs.create({
            url: breakUrl
        }).then((tab) => {
            console.log("Break page opened successfully:", tab);
        }).catch((error) => {
            console.error("Error opening break page:", error);
            api.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon.png',
                title: 'Error Opening Break Page',
                message: 'Please open the break page manually from the extension popup.'
            });
        });
    } else {
        api.tabs.create({
            url: breakUrl
        }, function(tab) {
            if (api.runtime.lastError) {
                console.error("Error opening break page:", api.runtime.lastError);
                api.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon.png',
                    title: 'Error Opening Break Page',
                    message: 'Please open the break page manually from the extension popup.'
                });
            } else {
                console.log("Break page opened successfully:", tab);
            }
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    const startLongBreakBtn = document.getElementById('startLongBreak');
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

            if(time>0 && time<initialDuration && currentType === 'break'){
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

            if (time>0 && time < initialDuration && currentType === 'longBreak'){
                resumeTimer();
            } else {
                startTimer(25*60, 'longBreak');
            }
        });
    }


    restoreTimer();
});
