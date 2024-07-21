const path = require("path");
const { BrowserWindow, screen, ipcMain, app } = require("electron");
const log = require("electron-log");
const url = require("url");

let overlayWindow;

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 235,
    height: 120,
    x: 0, // X position (0 for top-left corner)
    y: 400, // Y position (0 for top-left corner)
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  overlayWindow.loadURL(`file://${__dirname}/overlay.html`);

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "screen-saver", 1);
  overlayWindow.setFullScreenable(false);
  overlayWindow.show();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
}

function updateOverlayContent(column) {
  const appPath = app.getAppPath();
  log.info("appPAth", appPath);
  const iconPath = path.join(appPath, "../assets/icons");
  log.info(iconPath);

  if (overlayWindow) {
    const icons = {
      0: url.format({
        pathname: path.join(iconPath, "thick-dpad-up.svg"),
        protocol: "file:",
        slashes: true,
      }),
      2: url.format({
        pathname: path.join(iconPath, "thick-dpad-right.svg"),
        protocol: "file:",
        slashes: true,
      }),
      4: url.format({
        pathname: path.join(iconPath, "thick-dpad-down.svg"),
        protocol: "file:",
        slashes: true,
      }),
      6: url.format({
        pathname: path.join(iconPath, "thick-dpad-left.svg"),
        protocol: "file:",
        slashes: true,
      }),
    };

    overlayWindow.webContents.send("update-quickchat", column, icons);
  }
}

function closeOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
}

module.exports = {
  createOverlayWindow,
  updateOverlayContent,
  closeOverlayWindow,
};
