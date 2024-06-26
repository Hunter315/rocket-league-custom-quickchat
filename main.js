const { app, ipcMain, BrowserWindow } = require("electron");
const log = require("electron-log");
const path = require("path");

const { createWindow } = require("./components/window");
const { initializeUpdater } = require("./components/updater");
const { initializeKeyboard } = require("./components/keyboard");
const { initializeController } = require("./components/controller");
const Store = require("./components/store");

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

app.on("ready", async () => {
  log.info("App is ready");
  try {
    createWindow();
    initializeUpdater();
    initializeKeyboard(ipcMain, store);
    initializeController(ipcMain, store);
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
});
