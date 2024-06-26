const { BrowserWindow } = require("electron");
const path = require("path");
const log = require("electron-log");

function createWindow() {
  try {
    log.info("Creating window");

    let win = new BrowserWindow({
      width: 1200,
      height: 1000,
      webPreferences: {
        preload: path.join(__dirname, "../preload.js"),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
      },
      icon: path.join(__dirname, "..src//assets/icons/app-icon.png"),
    });

    const startUrl = path.join(__dirname, "../dist/index.html");

    win.loadFile(startUrl);

    win.on("closed", function () {
      log.info("Window closed.");
      win = null;
    });
  } catch (e) {
    log.info("Error creating window: ", e);
  }
}

module.exports = { createWindow };
