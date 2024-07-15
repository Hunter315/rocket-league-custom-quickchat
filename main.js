const { app, ipcMain, BrowserWindow } = require("electron");
const log = require("electron-log");
const path = require("path");

const { createWindow } = require("./modules/window");
const { initializeUpdater } = require("./modules/updater");
const { initializeKeyboard } = require("./modules/keyboard");
const {
  initializeController,
  searchControllers,
} = require("./modules/controller");
const Store = require("./modules/store");

// Initialize the store synchronously
const store = new Store({
  configName: "user-preferences",
  defaults: {
    tabs: [
      {
        name: "Tab 1",
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
      },
    ],
    typingSpeed: 5,
    selectedController: null,
    activationMethod: "thumbstick",
    currentTab: 0,
  },
});

let currentTab = 0;

app.on("ready", async () => {
  log.info("App is ready");
  try {
    createWindow();
    initializeUpdater();
    initializeKeyboard(ipcMain, store);
    initializeController(ipcMain, store, () => currentTab); // Pass a function to get the current tab

    // Emit the initial current-tab-updated event
    ipcMain.emit("current-tab-updated", null, currentTab);
  } catch (e) {
    log.error("Error during app ready event: ", e);
  }

  ipcMain.on("save-quickchats", (event, tabs) => {
    store.set("tabs", tabs);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("quickchats-updated", tabs);
    });
  });

  ipcMain.handle("load-quickchats", async () => {
    return store.get("tabs");
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

  ipcMain.on("change-tab", (event) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("change-tab", event);
    });
  });

  ipcMain.handle("search-controllers", async () => {
    const devices = searchControllers();
    return devices;
  });

  ipcMain.on("update-current-tab", (event, tabIndex) => {
    currentTab = tabIndex;
    store.set("currentTab", currentTab);
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("current-tab-updated", currentTab); // Notify all windows of the current tab change
    });
    ipcMain.emit("current-tab-updated", null, currentTab); // Ensure event is propagated to ipcMain listeners
  });
});
