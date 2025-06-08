let time;
let timerInterval;

function startTimer(duration, type) {
    console.log('Starting timer with duration:', duration, 'type:', type);
    const startTimestamp = Date.now();
    chrome.storage.local.set({
        timer: {
            start: startTimestamp,
            duration: duration,
            type: type
        }
    });
    time = duration;
    console.log('Initial time set to:', time);
    window.updateTimerDisplay(time);
    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            console.log('Timer tick, time now:', time);
            window.updateTimerDisplay(time);
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
            const {start, duration, type} = result.timer;
            const elapsed = Math.floor((Date.now()-start)/1000);
            const remaining = duration - elapsed;
            console.log('Elapsed:', elapsed, 'Remaining:', remaining);
            if (remaining > 0) {
                time = remaining;
                window.updateTimerDisplay(time);
                timerInterval = setInterval(function () {
                    if (time > 0) {
                        time--;
                        console.log('Restored timer tick, time now:', time);
                        window.updateTimerDisplay(time);
                    } else{
                        console.log('Restored timer finished');
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
            console.log('No stored timer found, setting default');
            time = 25 * 60;
            window.updateTimerDisplay(time);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    const startWorkBtn = document.getElementById("startWork");
    const startBreakBtn = document.getElementById("startBreak");
    
    console.log('Start work button:', startWorkBtn);
    console.log('Start break button:', startBreakBtn);
    
    if (startWorkBtn) {
        startWorkBtn.addEventListener("click", function() {
            console.log('Start work clicked');
            if (timerInterval) {
                console.log('Timer already running, ignoring click');
                return;
            }
            startTimer(25 * 60, "work");
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

    restoreTimer();
});



// let time;
// let timerInterval;

// function startTimer(duration, type) {
//     const startTimestamp = Date.now();
//     chrome.storage.local.set({
//         timer: {
//             start: startTimestamp,
//             duration: duration,
//             type: type
//         }
//     });
//     time = duration;
//     window.updateTimerDisplay(time);
//     timerInterval = setInterval(function() {
//         if (time > 0) {
//             time--;
//             window.updateTimerDisplay(time);
//         } else {
//             clearInterval(timerInterval);
//             timerInterval = null;
//             chrome.storage.local.remove("timer");
//         }
//     }, 1000);
// }

// function restoreTimer() {
//     chrome.storage.local.get("timer", function(result){
//         if (result.timer) {
//             const {start, duration, type} = result.timer;
//             const elapsed = Math.floor((Date.now()-start)/1000);
//             const remaining = duration - elapsed;
//             if (remaining > 0) {
//                 time = remaining;
//                 window.updateTimerDisplay(time);
//                 timerInterval = setInterval(function () {
//                     if (time > 0) {
//                         time--;
//                         window.updateTimerDisplay(time);
//                     } else{
//                         clearInterval(timerInterval);
//                         timerInterval = null;
//                         chrome.storage.local.remove("timer");
//                     }
//                 }, 1000);
//             } else {
//                 time = 0;
//                 window.updateTimerDisplay(time);
//                 chrome.storage.local.remove("timer");
//             } 
//         } else {
//             time = 25 * 60;
//             window.updateTimerDisplay(time);
//         }
//     });
// }

// document.addEventListener('DOMContentLoaded', function() {
//     document.getElementById("startWork").addEventListener("click", function() {
//         if (timerInterval) {
//             return;
//         }
//         startTimer(25 * 60, "work");
//     });

//     document.getElementById("startBreak").addEventListener("click", function(){
//         if (timerInterval) {
//             return;
//         }
//         startTimer(5*60, "break");
//     });

//     restoreTimer();
// });