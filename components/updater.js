const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

function initializeUpdater() {
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";

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
    log.error("There was a problem updating the application");
    log.error(message);
  });

  autoUpdater.checkForUpdatesAndNotify();
}

module.exports = { initializeUpdater };
