// overlay.js
const { BrowserWindow, screen, ipcMain, app } = require("electron");

let overlayWindow;
let alwaysOnTopInterval;

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

  //   overlayWindow = new BrowserWindow({
  //     width: 200,
  //     height: 100,
  //     x: 0, // X position (0 for top-left corner)
  //     y: 200, // Y position (0 for top-left corner)
  //     transparent: false,
  //     frame: true,
  //     alwaysOnTop: true,
  //     focusable: true,
  //     skipTaskbar: false,
  //     hasShadow: false,
  //     webPreferences: {
  //       nodeIntegration: true,
  //       contextIsolation: false,
  //     },
  //   });
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
  if (overlayWindow) {
    overlayWindow.webContents.send("update-quickchat", column);
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
