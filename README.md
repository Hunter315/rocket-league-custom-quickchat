# Rocket League Custom Quickchat Manager

Rocket League Quickchat Manager is a desktop application that allows users to manage and customize quick chat messages for Rocket League using a connected controller. The application provides an easy-to-use interface for setting up custom quick chat messages and selecting a connected controller device for use in-game. It essentially just opens up the custom typing and types really fast for you.

### Can't you just use a Macro?
 Yes, yes you can. But this looks nice.

## Features

- **Customizable Quickchats:** Easily edit and save custom quick chat messages.
- **Controller Support:** Automatically detect connected controllers and allow users to select the preferred device.
- **Typing Speed Control:** Adjust the typing speed for quick chat messages.
- **Persisted Settings:** All settings and quick chat messages are saved and persist between sessions.

## Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/Hunter315/rocket-league-quickchat.git
   cd rocket-league-quickchat
   ```
   
## Install Dependencies
    
    npm install

## Build the Project

    
    npm run build
  
## Package the Application
    
    npm run dist

## Usage
1. Launch the application:

- Navigate to dist directory
- Open win-unpacked directory
- Run 'rocket-league-quickchat' Application

2. Customize Quickchats:

- Edit the quick chat messages in the text fields provided.
- Click the "Save" button to save your changes.
3. Select Controller:

- Click the "Search for Controllers" button to open the controller selection modal.
- Select the desired controller from the list.
- Click the "Select" button to confirm your choice.
4. Adjust Typing Speed:

- Use the input field to set the typing speed (milliseconds per character).
- You don't want to go too fast or Rocket League may not register the typing.
- Save your settings by clicking the "Save" button.



config.json make sure it looks something like this when first starting the project (if you have been usign previous versions):
```
{
  "tabs": [
    {
      "name": "Tab 1",
      "quickchats": {
        "0,0": "Quickchat 1",
        "0,2": "Quickchat 2",
        "0,4": "Quickchat 3",
        "0,6": "Quickchat 4",
        "2,0": "Quickchat 5",
        "2,2": "Quickchat 6",
        "2,4": "Quickchat 7",
        "2,6": "Quickchat 8",
        "4,0": "Quickchat 9",
        "4,2": "Quickchat 10",
        "4,4": "Quickchat 11",
        "4,6": "Quickchat 12",
        "6,0": "Quickchat 13",
        "6,2": "Quickchat 14",
        "6,4": "Quickchat 15",
        "6,6": "Quickchat 16"
      }
    }
  ],
  "typingSpeed": 1,
  "selectedController": {
    "vendorId": 1356,
    "productId": 3302,
    "path": "\\\\?\\HID#VID_054C&PID_0CE6&MI_03#7&19a6191c&0&0000#{4d1e55b2-f16f-11cf-88cb-001111000030}",
    "serialNumber": "",
    "manufacturer": "Sony Interactive Entertainment",
    "product": "Wireless Controller",
    "release": 256,
    "interface": 3,
    "usagePage": 1,
    "usage": 5
  },
  "activationMethod": "dpad"
}
