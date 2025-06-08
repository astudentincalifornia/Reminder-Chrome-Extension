function updateTimerDisplay(time) {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

window.updateTimerDisplay = updateTimerDisplay;