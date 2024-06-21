const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  saveQuickchats: (quickchats) =>
    ipcRenderer.send("save-quickchats", quickchats),
  loadQuickchats: () => ipcRenderer.invoke("load-quickchats"),
  onQuickchatsUpdated: (callback) =>
    ipcRenderer.on("quickchats-updated", (event, newQuickchats) =>
      callback(newQuickchats)
    ),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),
  searchControllers: () => ipcRenderer.invoke("search-controllers"),
});
