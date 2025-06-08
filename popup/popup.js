function updateTimerDisplay(time) {
    console.log('updateTimerDisplay called with time:', time);
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    const displayText = `${minutes}:${seconds}`;
    console.log('Setting timer display to:', displayText);
    document.getElementById("timer").textContent = displayText;
}

window.updateTimerDisplay = updateTimerDisplay;