const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const keyboard = require("./my-addon/build/Release/keyboard");
const HID = require("node-hid");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const Store = require("./Store.js");

// Configure logging
log.transports.file.resolvePath = () =>
  path.join(app.getPath("userData"), "logs", "main.log");
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

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

let processing = false;

// Initialize the store synchronously
const store = new Store({
  configName: "user-preferences",
  defaults: {
    quickchats: {
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
    },
    typingSpeed: 5,
    selectedController: null,
    activationMethod: "thumbstick",
  },
});

function createWindow() {
  try {
    log.info("Creating window");
    let win = new BrowserWindow({
      width: 1200,
      height: 1000,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
      },
      icon: path.join(__dirname, "assets/icon/app-icon.png"),
    });

    win
      .loadFile(path.join(__dirname, "dist", "index.html"))
      .then(() => {
        log.info("Window loaded");
      })
      .catch((error) => {
        log.error("Failed to load window", error);
      });

    win.on("closed", function () {
      log.info("Window closed.");
      win = null;
    });

    autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    log.info("Error creating window: ", e);
  }
}

app.on("ready", async () => {
  log.info("App is ready");
  try {
    createWindow();
  } catch (e) {
    log.error("Error during app ready event: ", e);
  }

  ipcMain.on("save-quickchats", (event, quickchats) => {
    store.set("quickchats", quickchats);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("quickchats-updated", quickchats);
    });
  });

  ipcMain.handle("load-quickchats", async () => {
    return store.get("quickchats");
  });

  ipcMain.handle("load-settings", async () => {
    return {
      typingSpeed: store.get("typingSpeed"),
      selectedController: store.get("selectedController"),
      activationMethod: store.get("activationMethod"),
    };
  });

  ipcMain.on("save-settings", (event, settings) => {
    store.set("typingSpeed", settings.typingSpeed);
    store.set("selectedController", settings.selectedController);
    store.set("activationMethod", settings.activationMethod);
  });

  ipcMain.handle("search-controllers", async () => {
    const devices = HID.devices();
    return devices;
  });

  ipcMain.on("send-quickchat", (event, message) => {
    console.log("Sending quickchat:", message);
    const typingSpeed = store.get("typingSpeed");
    const delay = typingSpeed;
    const enterDelay = message.length * delay;

    function pressKeyWithRetry(key, retries = 3) {
      if (retries > 0) {
        try {
          keyboard.typeString(key, delay);
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
          keyboard.pressEnter();
          console.log("Pressed Enter");
        } catch (error) {
          console.log("Error pressing Enter. Retrying...");
          setTimeout(() => pressEnterWithRetry(retries - 1), 50);
        }
      }
    }

    pressKeyWithRetry("t");
    setTimeout(() => {
      keyboard.typeString(message, delay);
      setTimeout(() => {
        pressEnterWithRetry();
        console.log("Quickchat sent");
        resetInputs();
      }, enterDelay + 200);
    }, 5);
  });

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
            console.log("Right thumbstick pressed");
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
            console.log("D-pad input:", dpadInputs);
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
