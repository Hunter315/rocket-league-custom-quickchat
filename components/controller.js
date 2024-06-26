const HID = require("node-hid");
const log = require("electron-log");

function initializeController(ipcMain, store) {
  let processing = false;

  const devices = HID.devices();
  log.info("Detected HID devices:", devices);

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
      processing = false;
    }

    function handleQuickchat(inputs) {
      const quickchatMap = store.get("quickchats");
      const key = inputs.join(",");
      const message = quickchatMap[key];
      if (message) {
        ipcMain.emit("send-quickchat", null, message);
      }
      resetInputs();
    }

    device.on("data", (data) => {
      const dpad = data[8];
      const thumbstickClick = data[9];
      const activationMethod = store.get("activationMethod");

      if (processing) return;

      if (activationMethod === "thumbstick") {
        if (thumbstickClick === 128 || thumbstickClick === 136) {
          if (!thumbstickPressed) {
            thumbstickPressed = true;
            log.info("Right thumbstick pressed");
            inputTimeout = setTimeout(resetInputs, 3000);
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
              processing = true;
              handleQuickchat(dpadInputs);
            }
          }
          lastDpadState = dpad;
        } else {
          lastDpadState = 8;
        }
      } else if (activationMethod === "dpad") {
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
            }, 3000);
          } else if (dpadInputs.length === 2) {
            processing = true;
            handleQuickchat(dpadInputs);
          }
        }
        lastDpadState = dpad;
      }
    });

    device.on("error", (err) => {
      log.error("HID device error:", err);
    });
  }
}

module.exports = { initializeController };
