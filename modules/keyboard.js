function initializeKeyboard(ipcMain, store) {
  const keyboard = require("../my-addon/build/Release/keyboard");
  const log = require("electron-log");

  ipcMain.on("send-quickchat", async (event, message) => {
    const typingSpeed = store.get("typingSpeed");
    const tSpeed = store.get("tSpeed");
    const delay = typingSpeed;
    const chunkSize = 120; // Define the chunk size, adjust based on testing

    function pressKeyWithRetry(key, retries = 3) {
      return new Promise((resolve) => {
        if (retries > 0) {
          try {
            keyboard.typeString(key, delay);
            log.info(`Pressed key: ${key}`);
            resolve();
          } catch (error) {
            log.error(`Error pressing key: ${key}. Retrying...`);
            setTimeout(
              () => pressKeyWithRetry(key, retries - 1).then(resolve),
              50
            );
          }
        }
      });
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

    // async function typeMessageInChunks(message) {
    //   for (let i = 0; i < message.length; i += chunkSize) {
    //     await pressKeyWithRetry("t");
    //     await new Promise((resolve) => setTimeout(resolve, tSpeed)); // Adjust the delay time as needed

    //     const chunk = message.slice(i, i + chunkSize);
    //     if (chunk[chunk.length - 1] == " ")
    //       await keyboard.typeString(chunk, delay);
    //     await pressEnterWithRetry();
    //     await new Promise((resolve) => setTimeout(resolve, tSpeed)); // Wait for delay after each chunk
    //     ipcMain.emit("typing-complete");
    //   }
    // }

    async function typeMessageInChunks(message) {
      let i = 0;

      while (i < message.length) {
        await pressKeyWithRetry("t");
        await new Promise((resolve) => setTimeout(resolve, tSpeed)); // Adjust the delay time as needed

        // Find the next chunk that doesn't split a word
        let endIndex = Math.min(i + chunkSize, message.length);
        if (endIndex < message.length && message[endIndex] !== " ") {
          while (endIndex > i && message[endIndex] !== " ") {
            endIndex--;
          }
        }

        // If no space is found, take the whole chunk
        if (endIndex === i) {
          endIndex = Math.min(i + chunkSize, message.length);
        }

        const chunk = message.slice(i, endIndex);
        await keyboard.typeString(chunk, delay);
        await pressEnterWithRetry();
        await new Promise((resolve) => setTimeout(resolve, tSpeed)); // Wait for delay after each chunk
        ipcMain.emit("typing-complete");

        i = endIndex;
        if (message[i] === " ") {
          i++; // Skip the space character
        }
      }
    }

    async function typeMessageWithoutChunks(message) {
      try {
        await keyboard.typeString(message, delay);
      } catch (error) {
        log.error("Error typing message: ", error);
      }
    }

    if (message.length > 120) {
      await typeMessageInChunks(message);
    } else {
      await pressKeyWithRetry("t");

      await new Promise((resolve) => setTimeout(resolve, tSpeed)); // Adjust the delay time as needed
      await typeMessageWithoutChunks(message);

      pressEnterWithRetry();
      log.info("Quickchat sent: ", message);
      ipcMain.emit("typing-complete");
    }
  });
}

module.exports = { initializeKeyboard };
