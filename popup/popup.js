let time;
let timerInterval;
function updateTimerDisplay() {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

document.getElementById("startWork").addEventListener("click", function() {
    if (timerInterval) {
        return;
    }
    time = 25 * 60;
    timerInterval = setInterval(function() {
        if (time > 0) {
            time--;
            updateTimerDisplay();
        }
    }, 1000);
});

document.getElementById("startBreak").addEventListener("click", function(){
    if (timerInterval) {
        return;
    }
    time = 5 * 60; 
    
    timerInterval = setInterval(function(){
        if (time > 0) {
            time--;
            updateTimerDisplay();
        }
    },1000);
});

updateTimerDisplay(); 