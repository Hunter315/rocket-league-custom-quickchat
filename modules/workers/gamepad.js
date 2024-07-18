const { ipcMain } = require("electron");
const log = require("electron-log");

const {
  createOverlayWindow,
  closeOverlayWindow,
  updateOverlayContent,
} = require("../overlay");

function initializeGamepad(ipcMain, store, getCurrentTab) {
  let processing = false;
  let currentTab = getCurrentTab();
  let debounceTimeout = null;
  let typingInProgress = false;
  let inputTimeout;
  let thumbstickPressed = false;
  let dpadInputs = [];
  let lastDpadState = 8;
  let leftJoy = null;
  let rightJoyX = null;
  let lastRightClickTime = 0;
  let chatEnabled = true;

  const buttonMap = {
    10: "leftClick",
    11: "rightClick",
    12: "up",
    13: "down",
    14: "left",
    15: "right",
  };

  const inputMap = {
    12: "0",
    15: "2",
    13: "4",
    14: "6",
  };

  ipcMain.on("current-tab-updated", (event, tabIndex) => {
    currentTab = tabIndex;
  });

  ipcMain.on("typing-complete", async () => {
    typingInProgress = false;
    console.log("reset inputs");
    await resetInputs();
  });

  ipcMain.on("chunk-sent", () => {
    typingInProgress = true; // Keep typing flag true during chunked typing
  });

  // Function to reset inputs
  function resetInputs() {
    thumbstickPressed = false;
    dpadInputs = [];
    lastDpadState = 8;
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      inputTimeout = null;
    }

    setTimeout(() => {
      processing = false;
    }, 200);
  }

  // Function to handle quickchat messages
  function handleQuickchat(inputs) {
    console.log("handleQuickchat called with inputs:", inputs);
    closeOverlayWindow();
    const quickchatMap = store.get("tabs")[currentTab]["quickchats"]; // Use the dynamic current tab index
    console.log(inputs);
    const key = inputs.join(",");
    const message = quickchatMap ? quickchatMap[key] : null;
    if (message) {
      ipcMain.emit("send-quickchat", null, message);
      log.info(`Sending quickchat: ${message}`);
      typingInProgress = true;
      processing = true;
    } else {
      resetInputs();
    }
  }

  // Handle gamepad button presses
  ipcMain.on("gamepad-button-pressed", (event, data) => {
    handleButtonPress(data.index, data.button);
  });

  // Handle gamepad axis movements
  ipcMain.on("gamepad-axis-moved", (event, data) => {
    handleAxisMovement(data.index, data.axis);
  });

  function handleButtonPress(index, button) {
    if (typingInProgress) return;

    const doubleClickThreshold = 300; // Time in ms to detect a double-click

    try {
      if (buttonMap[index] === "leftClick" && !debounceTimeout) {
        if (rightJoyX > 0.25) {
          // move tab right
          ipcMain.emit("change-tab", "right");
          console.log("Change tab right");

          debounceTimeout = setTimeout(() => {
            debounceTimeout = null;
          }, 500); // Adjust debounce timeout as needed
        } else if (rightJoyX < -0.25) {
          // move tab left
          ipcMain.emit("change-tab", "left");
          console.log("Change tab left");
          debounceTimeout = setTimeout(() => {
            debounceTimeout = null;
          }, 500); // Adjust debounce timeout as needed
        }
      }

      if (buttonMap[index] === "rightClick") {
        const currentTime = Date.now();
        if (currentTime - lastRightClickTime < doubleClickThreshold) {
          chatEnabled = !chatEnabled; // Toggle chat functionality
          log.info(`Chat enabled?: ${chatEnabled}`);
          lastRightClickTime = 0; // Reset to avoid triple click detection
          ipcMain.emit("chat-toggled", chatEnabled); // Emit event
        } else {
          lastRightClickTime = currentTime;
        }
      }
    } catch (error) {
      console.log(error);
    }

    if (
      buttonMap[index] === "leftClick" &&
      rightJoyX < 0.24 &&
      rightJoyX > -0.24
    ) {
      clearTimeout(debounceTimeout);
      debounceTimeout = null;
    }

    if (processing) return;
    if (!chatEnabled) return;
    try {
      if (inputMap[index]) {
        dpadInputs.push(parseInt(inputMap[index]));
        log.info("D-pad input:", dpadInputs);
        if (dpadInputs.length === 1) {
          const quickchatMap = store.get("tabs")[currentTab]["quickchats"];
          const keyPrefix = inputMap[index];
          const filteredQuickchats = Object.keys(quickchatMap)
            .filter((key) => key.startsWith(`${keyPrefix},`))
            .map((key) => ({ key, message: quickchatMap[key] }));

          createOverlayWindow();
          updateOverlayContent(filteredQuickchats);
          inputTimeout = setTimeout(() => {
            processing = true;
            handleQuickchat(dpadInputs);
          }, 2000);
        } else if (dpadInputs.length === 2) {
          processing = true;
          handleQuickchat(dpadInputs);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  function handleAxisMovement(index, axis) {
    // Handle axis movement logic here
    // 0, left, left and right
    // 1, left, up down
    // 2, right, left right
    // 3, right, up down
    if (index == 2) {
      rightJoyX = axis;
    }
  }
}

module.exports = { initializeGamepad };
