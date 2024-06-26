const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  loadQuickchats: () => ipcRenderer.invoke("load-quickchats"),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveQuickchats: (quickchats) =>
    ipcRenderer.send("save-quickchats", quickchats),
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),
  searchControllers: () => ipcRenderer.invoke("search-controllers"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  restartApp: () => ipcRenderer.send("restart-app"),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  send: (channel, data) => ipcRenderer.send(channel, data),
});
