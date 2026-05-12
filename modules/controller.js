const HID = require("node-hid");
const log = require("electron-log");
const {
  createOverlayWindow,
  closeOverlayWindow,
  updateOverlayContent,
} = require("./overlay");

function initializeController(ipcMain, store, getCurrentTab) {
  let processing = false;
  let currentTab = getCurrentTab();
  let debounceTimeout = null;
  let typingInProgress = false;
  let controller = store.get("selectedController");
  let controllerType = null;
  let inputTimeout;
  let dpadInputs = [];
  let lastDpadState = 8;
  let thumbstickPressed = false;
  let lastRightClickTime = 0;
  let chatEnabled = true;
  let typingPriority = false;
  let activeHIDDevice = null;
  let connectionStatus = "disconnected";
  let deviceWatcher = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;

  // Shared input state reset — called after typing completes and on cleanup.
  // Must be defined at this scope so the typing-complete handler can reach it.
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

  ipcMain.on("current-tab-updated", (event, tabIndex) => {
    currentTab = tabIndex;
  });

  ipcMain.on("typing-started", () => {
    typingPriority = true;
  });

  ipcMain.on("typing-complete", () => {
    typingInProgress = false;
    typingPriority = false;
    resetInputs();
  });

  ipcMain.on("chunk-sent", () => {
    typingInProgress = true;
  });

  function updateConnectionStatus(status, error = null) {
    connectionStatus = status;
    ipcMain.emit("controller-status-changed", null, { status, error, controller });
    log.info(`Controller status: ${status}`, error ? `Error: ${error}` : "");
  }

  function startDeviceWatcher() {
    if (deviceWatcher) clearInterval(deviceWatcher);

    deviceWatcher = setInterval(() => {
      if (!controller) return;

      const devices = HID.devices();
      const isConnected = devices.some(
        (d) =>
          d.path === controller.path &&
          d.vendorId === controller.vendorId &&
          d.productId === controller.productId
      );

      if (!isConnected && connectionStatus === "connected") {
        log.warn("Controller disconnected, attempting reconnect...");
        updateConnectionStatus("reconnecting");
        attemptReconnect();
      } else if (
        isConnected &&
        connectionStatus === "disconnected" &&
        reconnectAttempts > 0
      ) {
        log.info("Controller reconnected!");
        setupController();
      }
    }, 2000);
  }

  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      updateConnectionStatus(
        "failed",
        `Failed to reconnect after ${maxReconnectAttempts} attempts`
      );
      return;
    }

    reconnectAttempts++;
    log.info(`Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);

    setTimeout(() => {
      try {
        setupController();
      } catch (error) {
        log.error(`Reconnect attempt ${reconnectAttempts} failed:`, error);
        if (reconnectAttempts < maxReconnectAttempts) {
          attemptReconnect();
        } else {
          updateConnectionStatus("failed", error.message);
        }
      }
    }, 1000 * reconnectAttempts);
  }

  function cleanupController() {
    if (activeHIDDevice) {
      try {
        activeHIDDevice.close();
        log.info("Previous controller connection closed");
      } catch (error) {
        log.error("Error closing previous controller:", error);
      }
      activeHIDDevice = null;
    }

    processing = false;
    debounceTimeout = null;
    typingInProgress = false;
    controllerType = null;
    thumbstickPressed = false;
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      inputTimeout = null;
    }
    dpadInputs = [];
    lastDpadState = 8;
    lastRightClickTime = 0;
    chatEnabled = true;
    typingPriority = false;
  }

  function setupController() {
    try {
      cleanupController();

      controller = store.get("selectedController");
      if (!controller) {
        log.info("No controller selected");
        updateConnectionStatus("no_controller");
        return;
      }

      log.info("Setting up controller:", controller);
      updateConnectionStatus("connecting");

      const devices = HID.devices();
      const isAvailable = devices.some(
        (d) =>
          d.path === controller.path &&
          d.vendorId === controller.vendorId &&
          d.productId === controller.productId
      );

      if (!isAvailable) {
        throw new Error(
          `Controller not found: ${
            controller.product || controller.manufacturer || "Unknown"
          }`
        );
      }

      // ── Xbox ────────────────────────────────────────────────────────────────
      if (controller.vendorId === 1118) {
        controllerType = "xbox";
        const xbox = new HID.HID(controller.path);
        activeHIDDevice = xbox;

        reconnectAttempts = 0;
        updateConnectionStatus("connected");
        startDeviceWatcher();

        function handleQuickchat(inputs) {
          const quickchatMap = store.get("tabs")[currentTab]["quickchats"];
          const mapped = inputs.map((n) => n - 1);
          const key = mapped.join(",");
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

        xbox.on("data", (data) => {
          if (typingInProgress) return;

          const dpad = data[12];
          const thumbstickClick = data[11];

          try {
            if (
              dpad !== 0 &&
              (dpadInputs.length === 0 || lastDpadState === 0) &&
              [1, 3, 5, 7].includes(dpad)
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
            log.error("Controller data processing error:", error);
          }
        });

        xbox.on("error", (err) => {
          log.error("Xbox controller error:", err);
          updateConnectionStatus("error", err.message);
          if (err.message.includes("device")) {
            attemptReconnect();
          }
        });
      }

      // ── DualShock 4 / DualSense / DualSense Edge ─────────────────────────
      if (controller && controllerType !== "xbox") {
        const isDualSenseEdge = controller.productId === 3570; // 0x0DF2

        if (isDualSenseEdge) {
          log.info("DualSense Edge controller found:", controller);
        } else {
          log.info("DualShock 4 / DualSense controller found:", controller);
        }

        const device = new HID.HID(controller.path);
        activeHIDDevice = device;

        reconnectAttempts = 0;
        updateConnectionStatus("connected");
        startDeviceWatcher();

        // DualSense Edge polls at 1000Hz vs 250Hz for standard DualSense.
        // Throttle to ~250Hz so processing load matches the standard controller.
        let edgeThrottleCounter = 0;
        const edgeThrottle = isDualSenseEdge ? 4 : 1;

        let thumbstickClicked = false;

        function handleQuickchat(inputs) {
          closeOverlayWindow();
          const quickchatMap = store.get("tabs")[currentTab]["quickchats"];
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

        const activationMethod = store.get("activationMethod") || "dpad";

        device.on("data", (data) => {
          if (typingInProgress) return;

          // DualSense uses different HID report structures over USB vs Bluetooth.
          // USB:       Report ID 0x01 at data[0] → dpad at data[8], buttons at data[9]
          // Bluetooth: Report ID 0x31 at data[0] → dpad at data[9], buttons at data[10]
          const isBluetooth = data[0] === 0x31;
          const o = isBluetooth ? 1 : 0;

          if (typingPriority) {
            const thumbstickClick = data[9 + o];
            if (thumbstickClick === 128 || thumbstickClick === 136) {
              // fall through — allow chat toggle even during typing
            } else {
              return;
            }
          }

          // Throttle DualSense Edge from 1000Hz to ~250Hz
          if (isDualSenseEdge) {
            edgeThrottleCounter++;
            if (edgeThrottleCounter % edgeThrottle !== 0) return;
          }

          const dpad = data[8 + o];
          const thumbstickClick = data[9 + o];
          const thumbstickX = data[3 + o];
          const gameplayInputs = data[6 + o];
          const faceButtons = data[7 + o];

          // Skip if user is only doing normal gameplay inputs (driving, boosting etc.)
          if (!processing && !thumbstickPressed && dpadInputs.length === 0) {
            if (
              (gameplayInputs > 0 || faceButtons > 0) &&
              dpad === 8 &&
              (thumbstickClick === 0 || thumbstickClick === 8)
            ) {
              return;
            }
          }

          try {
            const doubleClickThreshold = 300;

            // Right thumbstick double-click: toggle chat on/off
            if (thumbstickClick === 128 || thumbstickClick === 136) {
              if (!thumbstickClicked) {
                thumbstickClicked = true;
                const now = Date.now();
                if (now - lastRightClickTime < doubleClickThreshold) {
                  chatEnabled = !chatEnabled;
                  log.info(`Chat enabled: ${chatEnabled}`);
                  lastRightClickTime = 0;
                  ipcMain.emit("chat-toggled", chatEnabled);
                } else {
                  lastRightClickTime = now;
                }
              }
            } else if (thumbstickClick === 0 || thumbstickClick === 8) {
              thumbstickClicked = false;
            }

            // Left thumbstick click + horizontal movement: switch tabs
            if (
              (thumbstickClick === 64 || thumbstickClick === 72) &&
              !debounceTimeout
            ) {
              if (thumbstickX < 30) {
                ipcMain.emit("change-tab", "left");
                debounceTimeout = setTimeout(() => { debounceTimeout = null; }, 500);
              } else if (thumbstickX > 200) {
                ipcMain.emit("change-tab", "right");
                debounceTimeout = setTimeout(() => { debounceTimeout = null; }, 500);
              }
            }

            if (thumbstickClick === 64 && thumbstickX >= 120 && thumbstickX <= 150) {
              clearTimeout(debounceTimeout);
              debounceTimeout = null;
            }
          } catch (error) {
            log.error("Controller data processing error:", error);
          }

          if (processing) return;
          if (!chatEnabled) return;

          // Skip if no quickchat-relevant state changes
          if (
            dpad === lastDpadState &&
            thumbstickClick === 0 &&
            !processing &&
            !thumbstickPressed
          ) {
            return;
          }

          if (activationMethod === "thumbstick") {
            if (thumbstickClick === 128 || thumbstickClick === 136) {
              if (!thumbstickPressed) {
                thumbstickPressed = true;
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
                if (dpadInputs.length === 1) {
                  const quickchatMap = store.get("tabs")[currentTab]["quickchats"];
                  const filteredQuickchats = Object.keys(quickchatMap)
                    .filter((k) => k.startsWith(`${dpadInputs[0]},`))
                    .map((k) => ({ key: k, message: quickchatMap[k] }));
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
              lastDpadState = dpad;
            } catch (error) {
              log.error("Controller data processing error:", error);
            }
          }
        });

        device.on("error", (err) => {
          log.error("PS controller error:", err);
          updateConnectionStatus("error", err.message);
          if (err.message.includes("device")) {
            attemptReconnect();
          }
        });
      }
    } catch (error) {
      log.error("Controller setup failed:", error);
      updateConnectionStatus("failed", error.message);
      setTimeout(() => {
        if (connectionStatus === "failed") {
          attemptReconnect();
        }
      }, 3000);
    }
  }

  ipcMain.on("controller-selected", () => {
    log.info("Controller selection changed, reinitializing...");
    setupController();
  });

  ipcMain.handle("get-controller-status", () => ({
    status: connectionStatus,
    controller,
  }));

  ipcMain.on("app-will-quit", () => {
    if (deviceWatcher) {
      clearInterval(deviceWatcher);
      deviceWatcher = null;
    }
    cleanupController();
  });

  setupController();
}

function searchControllers() {
  return HID.devices();
}

module.exports = { initializeController, searchControllers };
