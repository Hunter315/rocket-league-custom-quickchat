function initializeKeyboard(ipcMain, store) {
  const keyboard = require("../my-addon/build/Release/keyboard");
  const log = require("electron-log");

  ipcMain.on("send-quickchat", (event, message) => {
    const typingSpeed = store.get("typingSpeed");
    const delay = typingSpeed;
    const enterDelay = message.length * delay;

    function pressKeyWithRetry(key, retries = 3) {
      if (retries > 0) {
        try {
          keyboard.typeString(key, delay);
          log.info(`Pressed key: ${key}`);
        } catch (error) {
          log.error(`Error pressing key: ${key}. Retrying...`);
          setTimeout(() => pressKeyWithRetry(key, retries - 1), 50);
        }
      }
    }

    function pressEnterWithRetry(retries = 5) {
      if (retries > 0) {
        try {
          keyboard.pressEnter();
          log.info("Pressed Enter");
        } catch (error) {
          log.error("Error pressing Enter. Retrying...");
          setTimeout(() => pressEnterWithRetry(retries - 1), 50);
        }
      }
    }

    pressKeyWithRetry("t");
    setTimeout(() => {
      keyboard.typeString(message, delay);
      setTimeout(() => {
        pressEnterWithRetry();
        ipcMain.emit("typing-complete");
        log.info("Quickchat sent");
      }, enterDelay + 100);
    }, 5);
  });
}

module.exports = { initializeKeyboard };
