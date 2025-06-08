function updateTimerDisplay(currentTime, initialDuration = 25*60) {
    console.log('updateTimerDisplay called with time:', currentTime);
    const waterElement = document.getElementById('water');
    const timerInfo = document.getElementById('timer-info');
    if (!waterElement||!timerInfo) {
        console.log('Timer elements not found');
        return;
    }

    const percentage = (currentTime/initialDuration)*100;

    waterElement.style.height = `${Math.max(0, percentage)}%`;

    const minutes = Math.floor(currentTime/60);
    const seconds = currentTime % 60;

    if(currentTime <= 0) {
        //open new tab
        waterElement.style.height = '0%';
    } else if (currentTime < 60) {
        timerInfo.textContent = `${seconds}s`;
    } else {
        timerInfo.textContent = `${minutes}m`;
    }

    if (percentage < 20) {
        waterElement.style.background = 'linear-gradient(180deg, #ff6b6b 0%, #ff8e8e 100%)';   
    } else if (percentage < 50) {
        waterElement.style.background = 'linear-gradient(180deg, #ffa726 0%, #ffcc02 100%)';
    } else {
        waterElement.style.background = 'linear-gradient(180deg, #4facfe 0%, #00f2fe 100%)';
    }
}

window.updateTimerDisplay = updateTimerDisplay;