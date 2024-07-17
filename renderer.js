let buttonStates = {};
let axisStates = {};

function pollGamepads() {
  const gamepads = navigator.getGamepads();
  const acceptedInputs = [12, 13, 14, 15, 10, 11];
  const continuousInputs = [10, 11]; // Inputs that should continuously send events when held down

  for (const gamepad of gamepads) {
    if (!gamepad) continue;

    // Handle button presses
    gamepad.buttons.forEach((button, index) => {
      if (acceptedInputs.includes(index)) {
        if (button.pressed) {
          if (!buttonStates[index] || continuousInputs.includes(index)) {
            // Check if the button was not pressed before or if it's a continuous input
            window.electron.send("gamepad-button-pressed", {
              index,
              pressed: button.pressed,
            });
            buttonStates[index] = true; // Set the state to pressed
          }
        } else {
          buttonStates[index] = false; // Reset the state when the button is released
        }
      }
    });

    // Handle axis movements
    gamepad.axes.forEach((axis, index) => {
      if (Math.abs(axis) > 0.1) {
        // Adjust threshold as needed
        if (axisStates[index] !== axis) {
          window.electron.send("gamepad-axis-moved", { index, axis });
          axisStates[index] = axis; // Update the state
        }
      } else {
        if (axisStates[index] !== 0) {
          window.electron.send("gamepad-axis-moved", { index, axis: 0 });
          axisStates[index] = 0; // Update the state
        }
      }
    });
  }
}

setInterval(pollGamepads, 100); // Poll gamepad state every 100ms
