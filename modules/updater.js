const { autoUpdater } = require("electron-updater");
const { ipcMain } = require("electron");
const log = require("electron-log");

function initializeUpdater(mainWindow) {
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";

  const send = (channel, ...args) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args);
    }
  };

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
    send("update-available", info.version);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version);
    send("update-downloaded", info.version);
  });

  autoUpdater.on("error", (error) => {
    log.error("Auto-updater error:", error);
  });

  ipcMain.on("restart-app", () => {
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdatesAndNotify();
}

module.exports = { initializeUpdater };
