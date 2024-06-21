const keyboard = require("./build/Release/keyboard");
setTimeout(async () => {
  console.log("timeout");
  await keyboard.typeString("Hello, world!");
  await keyboard.pressKey("\n"); // Press Enter
}, 2000);
