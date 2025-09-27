const { autoUpdater } = require("electron-updater");
const { dialog } = require("electron");
const log = require("electron-log");

function initializeUpdater() {
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";
  
  // Enable more detailed logging
  log.info("Auto-updater initialized");
  
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...");
  });
  
  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
  });
  
  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available:", info.version);
  });
  
  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressObj.percent + "%";
    log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
    log.info(log_message);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version);
    const dialogOpts = {
      type: "info",
      buttons: ["Restart", "Later"],
      title: "Application Update",
      message: `A new version (${info.version}) has been downloaded. Restart the application to apply the updates.`,
    };
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on("error", (error) => {
    log.error("Auto-updater error:", error);
  });

  // Check for updates when app starts and then every hour
  autoUpdater.checkForUpdatesAndNotify();
  
  // Set up periodic checks (every hour)
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 60 * 60 * 1000);
}

module.exports = { initializeUpdater };
