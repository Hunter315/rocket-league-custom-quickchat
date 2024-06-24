const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const keyboard = require("./my-addon/build/Release/keyboard"); // Import your custom addon
const HID = require("node-hid");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configure logging
log.transports.file.level = "debug";
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "debug";

// AutoUpdater configuration
autoUpdater.on("update-downloaded", () => {
  const dialogOpts = {
    type: "info",
    buttons: ["Restart", "Later"],
    title: "Application Update",
    message:
      "A new version has been downloaded. Restart the application to apply the updates.",
  };
  log.info("Update downloaded");
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on("error", (message) => {
  console.error("There was a problem updating the application");
  console.error(message);
  log.info("Error updating the app", message);
});

let store; // Declare store variable globally
let processing = false;

async function loadStore() {
  const { default: Store } = await import("electron-store");
  return new Store();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Enable context isolation
      enableRemoteModule: false, // Disable remote module
      nodeIntegration: false, // Disable node integration
    },
    icon: path.join(__dirname, "assets/icon/app-icon.png"),
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:9000");
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  autoUpdater.checkForUpdatesAndNotify(); // Check for updates when the app is ready
}

app.on("ready", async () => {
  store = await loadStore(); // Initialize store asynchronously
  createWindow();

  ipcMain.on("save-quickchats", (event, quickchats) => {
    store.set("quickchats", quickchats);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("quickchats-updated", quickchats);
    });
  });

  ipcMain.handle("load-quickchats", async () => {
    return store.get("quickchats", {
      "0,0": "Quickchat 1",
      "0,2": "Quickchat 2",
      "0,4": "Quickchat 3",
      "0,6": "Quickchat 4",
      "2,0": "Quickchat 5",
      "2,2": "Quickchat 6",
      "2,4": "Quickchat 7",
      "2,6": "Quickchat 8",
      "4,0": "Quickchat 9",
      "4,2": "Quickchat 10",
      "4,4": "Quickchat 11",
      "4,6": "Quickchat 12",
      "6,0": "Quickchat 13",
      "6,2": "Quickchat 14",
      "6,4": "Quickchat 15",
      "6,6": "Quickchat 16",
    });
  });

  ipcMain.handle("load-settings", async () => {
    return {
      typingSpeed: store.get("typingSpeed", 5),
      selectedController: store.get("selectedController", null),
      activationMethod: store.get("activationMethod", "thumbstick"),
    };
  });

  ipcMain.on("save-settings", (event, settings) => {
    store.set("typingSpeed", settings.typingSpeed);
    store.set("selectedController", settings.selectedController);
    store.set("activationMethod", settings.activationMethod);
  });

  ipcMain.handle("search-controllers", async () => {
    const devices = HID.devices();
    return devices; // Return all HID devices
  });

  ipcMain.on("send-quickchat", (event, message) => {
    console.log("Sending quickchat:", message);
    const typingSpeed = store.get("typingSpeed", 5);
    const delay = typingSpeed; // Delay in milliseconds between keypresses
    const enterDelay = message.length * delay; // Calculate delay for Enter key press

    function pressKeyWithRetry(key, retries = 3) {
      if (retries > 0) {
        try {
          keyboard.typeString(key, delay); // Press the key
          console.log(`Pressed key: ${key}`);
        } catch (error) {
          console.log(`Error pressing key: ${key}. Retrying...`);
          setTimeout(() => pressKeyWithRetry(key, retries - 1), 50);
        }
      }
    }

    function pressEnterWithRetry(retries = 5) {
      if (retries > 0) {
        try {
          keyboard.pressEnter(); // Press Enter
          console.log("Pressed Enter");
        } catch (error) {
          console.log("Error pressing Enter. Retrying...");
          setTimeout(() => pressEnterWithRetry(retries - 1), 50);
        }
      }
    }

    pressKeyWithRetry("t"); // Press 't' to bring up text chat
    setTimeout(() => {
      keyboard.typeString(message, delay); // Type the message
      setTimeout(() => {
        pressEnterWithRetry(); // Press Enter
        console.log("Quickchat sent");
        resetInputs(); // Reset inputs immediately after sending the quickchat
      }, enterDelay + 200); // Slightly longer delay before pressing Enter to ensure typing is complete
    }, 5); // Delay to ensure 't' is registered
  });

  // Detect and handle PlayStation controller input
  const devices = HID.devices();
  console.log("Detected HID devices:", devices);

  const ps4Controller = devices.find(
    (d) => d.vendorId === 1356 && d.productId === 3302
  );

  if (ps4Controller) {
    console.log("PS4 controller found:", ps4Controller);
    const device = new HID.HID(ps4Controller.path);
    let thumbstickPressed = false;
    let dpadInputs = [];
    let lastDpadState = 8; // Initial state
    let inputTimeout;

    function resetInputs() {
      thumbstickPressed = false;
      dpadInputs = [];
      lastDpadState = 8; // Reset to initial state
      if (inputTimeout) {
        clearTimeout(inputTimeout);
        inputTimeout = null;
      }
      processing = false;
    }

    function handleQuickchat(inputs) {
      const quickchatMap = store.get("quickchats", {
        "0,0": "Quickchat 1",
        "0,2": "Quickchat 2",
        "0,4": "Quickchat 3",
        "0,6": "Quickchat 4",
        "2,0": "Quickchat 5",
        "2,2": "Quickchat 6",
        "2,4": "Quickchat 7",
        "2,6": "Quickchat 8",
        "4,0": "Quickchat 9",
        "4,2": "Quickchat 10",
        "4,4": "Quickchat 11",
        "4,6": "Quickchat 12",
        "6,0": "Quickchat 13",
        "6,2": "Quickchat 14",
        "6,4": "Quickchat 15",
        "6,6": "Quickchat 16",
      });
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
      const activationMethod = store.get("activationMethod", "thumbstick");

      if (processing) return;

      if (activationMethod === "thumbstick") {
        if (thumbstickClick === 128 || thumbstickClick === 136) {
          if (!thumbstickPressed) {
            thumbstickPressed = true;
            console.log("Right thumbstick pressed");
            inputTimeout = setTimeout(resetInputs, 3000); // 3-second window to input D-pad directions
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
            console.log("D-pad input:", dpadInputs);
            if (dpadInputs.length === 2) {
              processing = true;
              handleQuickchat(dpadInputs);
            }
          }
          lastDpadState = dpad;
        } else {
          lastDpadState = 8; // Reset state when thumbstick is not pressed
        }
      } else if (activationMethod === "dpad") {
        if (
          dpad !== 8 &&
          (dpadInputs.length === 0 || lastDpadState === 8) &&
          [0, 2, 4, 6].includes(dpad)
        ) {
          dpadInputs.push(dpad);
          lastDpadState = dpad;
          console.log("D-pad input:", dpadInputs);
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
      console.error("HID device error:", err);
    });
  }
});
