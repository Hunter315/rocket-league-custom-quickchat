const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  saveQuickchats: (quickchats) =>
    ipcRenderer.send("save-quickchats", quickchats),
  loadQuickchats: () => ipcRenderer.invoke("load-quickchats"),
  onQuickchatsUpdated: (callback) =>
    ipcRenderer.on("quickchats-updated", (event, newQuickchats) =>
      callback(newQuickchats)
    ),
});
