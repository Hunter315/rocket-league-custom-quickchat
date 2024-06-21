# Rocket League Quickchat Manager

Rocket League Quickchat Manager is a desktop application that allows users to manage and customize quick chat messages for Rocket League using a connected controller. The application provides an easy-to-use interface for setting up custom quick chat messages and selecting a connected controller device for use in-game.

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
