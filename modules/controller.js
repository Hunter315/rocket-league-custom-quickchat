const HID = require("node-hid");
const log = require("electron-log");

function initializeController(ipcMain, store, getCurrentTab) {
  let processing = false;
  let currentTab = getCurrentTab();
  let debounceTimeout = null;

  ipcMain.on("current-tab-updated", (event, tabIndex) => {
    currentTab = tabIndex;
  });

  ipcMain.on("typing-complete", async () => {
    console.log("reset inputs");
    await resetInputs();
  });

  const devices = HID.devices();

  const ps4Controller = devices.find(
    (d) => d.vendorId === 1356 && d.productId === 3302
  );

  if (ps4Controller) {
    log.info("PS4 controller found:", ps4Controller);
    const device = new HID.HID(ps4Controller.path);
    let thumbstickPressed = false;
    let dpadInputs = [];
    let lastDpadState = 8;
    let inputTimeout;

    function resetInputs() {
      thumbstickPressed = false;
      dpadInputs = [];
      lastDpadState = 8;
      if (inputTimeout) {
        clearTimeout(inputTimeout);
        inputTimeout = null;
      }

      console.log("rest inputs: ", dpadInputs);
      console.log(processing);
      // processing = false;

      setTimeout(() => {
        processing = false;
        console.log("timeout process", processing);
      }, 200);
    }

    function handleQuickchat(inputs) {
      const quickchatMap = store.get("tabs")[currentTab]["quickchats"]; // Use the dynamic current tab index
      const key = inputs.join(",");
      const message = quickchatMap ? quickchatMap[key] : null;
      if (message) {
        ipcMain.emit("send-quickchat", null, message);
        log.info(`Sending quickchat: ${message}`);
        processing = true;
      } else {
        resetInputs();
      }
    }

    const activationMethod = store.get("activationMethod") || "dpad";

    device.on("data", (data) => {
      const dpad = data[8];
      const thumbstickClick = data[9];

      const thumbstickX = data[3];

      try {
        if (
          (thumbstickClick === 64 || thumbstickClick === 72) &&
          !debounceTimeout
        ) {
          if (thumbstickX < 30) {
            // move tab left
            ipcMain.emit("change-tab", "left");
            console.log("Change tab left");
            debounceTimeout = setTimeout(() => {
              debounceTimeout = null;
            }, 500); // Adjust debounce timeout as needed
          } else if (thumbstickX > 200) {
            // move tab right
            ipcMain.emit("change-tab", "right");
            console.log("Change tab right");

            debounceTimeout = setTimeout(() => {
              debounceTimeout = null;
            }, 500); // Adjust debounce timeout as needed
          }
        }
      } catch (error) {
        console.log(error);
      }

      if (thumbstickClick === 64 && thumbstickX >= 120 && thumbstickX <= 150) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }

      if (processing) return;

      if (activationMethod === "thumbstick") {
        if (thumbstickClick === 128 || thumbstickClick === 136) {
          if (!thumbstickPressed) {
            thumbstickPressed = true;
            log.info("Right thumbstick pressed");
            setTimeout(resetInputs, 3000);
          }
        }

        if (thumbstickPressed) {
          if (
            dpad !== 8 &&
            (dpadInputs.length === 0 || lastDpadState === 8) &&
            [0, 2, 4, 6].includes(dpad)
          ) {
            dpadInputs.push(dpad);
            lastDpadState = dpad;
            log.info("D-pad input:", dpadInputs);
            if (dpadInputs.length === 2) {
              handleQuickchat(dpadInputs);
            }
          }
          lastDpadState = dpad;
        } else {
          lastDpadState = 8;
        }
      } else if (activationMethod === "dpad") {
        try {
          if (
            dpad !== 8 &&
            (dpadInputs.length === 0 || lastDpadState === 8) &&
            [0, 2, 4, 6].includes(dpad)
          ) {
            dpadInputs.push(dpad);
            lastDpadState = dpad;
            log.info("D-pad input:", dpadInputs);
            if (dpadInputs.length === 1) {
              inputTimeout = setTimeout(() => {
                processing = true;
                handleQuickchat(dpadInputs);
              }, 2000);
            } else if (dpadInputs.length === 2) {
              processing = true;
              handleQuickchat(dpadInputs);
            }
          }
          lastDpadState = dpad;
        } catch (error) {
          console.log(error);
        }
      }
    });

    device.on("error", (err) => {
      log.error("HID device error:", err);
    });
  }
}

function searchControllers() {
  return HID.devices();
}

module.exports = { initializeController, searchControllers };
