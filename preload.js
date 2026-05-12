const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  loadQuickchats: () => ipcRenderer.invoke("load-quickchats"),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveQuickchats: (quickchats) =>
    ipcRenderer.send("save-quickchats", quickchats),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  searchControllers: () => ipcRenderer.invoke("search-controllers"),
  getControllerStatus: () => ipcRenderer.invoke("get-controller-status"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  restartApp: () => ipcRenderer.send("restart-app"),
  on: (channel, listener) => {
    const validChannels = [
      "send-quickchat",
      "change-tab",
      "update-current-tab",
      "gamepad-button-pressed",
      "gamepad-axis-moved",
      "ui-chat-toggled",
      "chat-toggled",
      "controller-status-changed",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, listener);
    }
  },
  removeListener: (channel, listener) => {
    const validChannels = [
      "send-quickchat",
      "change-tab",
      "update-current-tab",
      "gamepad-button-pressed",
      "gamepad-axis-moved",
      "ui-chat-toggled",
      "chat-toggled",
      "controller-status-changed",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, listener);
    }
  },
  send: (channel, data) => {
    const validChannels = [
      "save-settings",
      "load-settings",
      "update-current-tab",
      "gamepad-button-pressed",
      "gamepad-axis-moved",
      "ui-chat-toggled",
      "chat-toggled",
      "controller-selected",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
});
