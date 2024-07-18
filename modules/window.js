const { BrowserWindow, screen } = require("electron");
const path = require("path");
const log = require("electron-log");

function createWindow() {
  try {
    log.info("Creating window");
    const displays = screen.getAllDisplays();
    const secondaryDisplay = displays.length > 1 ? displays[1] : displays[0];

    let win = new BrowserWindow({
      width: 1200,
      height: 1000,
      x: secondaryDisplay.bounds.x + 50,
      y: secondaryDisplay.bounds.y + 50,
      frame: true,
      skipTaskbar: false,
      hasShadow: true,
      webPreferences: {
        preload: path.join(__dirname, "../preload.js"),
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
      },
      icon: path.join(__dirname, "../src/assets/icons/app-icon2.png"),
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
