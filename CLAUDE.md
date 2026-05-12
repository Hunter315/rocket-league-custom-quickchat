# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Electron-based desktop application that allows Rocket League players to create custom quickchat messages using a connected controller. The app types custom messages rapidly in-game when controller inputs are detected.

## Development Commands

### Building and Running
- `npm run build` - Build the React frontend using Webpack
- `npm run electron` - Start the Electron app (after building)
- `npm run dev` - Build and run the Electron app in one command
- `npm start` - Start Webpack dev server for frontend development
- `npm run build-addon` - Build the native C++ keyboard addon
- `npm run dist` - Create distributable packages
- `npm run publish` - Build and publish to GitHub releases

### Development Workflow
1. Make frontend changes: Use `npm start` for live reloading
2. Test full app: Use `npm run dev` 
3. Build native addon: Use `npm run build-addon` when modifying C++ code
4. Create release: Use `npm run dist`

## Architecture

### Core Components
- **main.js** - Electron main process, handles IPC communication and app lifecycle
- **src/index.js** - React app entry point
- **modules/** - Core Electron modules:
  - `controller.js` - HID controller detection and input handling
  - `keyboard.js` - Native keyboard input simulation
  - `store.js` - Persistent configuration storage
  - `window.js` - Electron window management
  - `updater.js` - Auto-updater functionality

### Frontend Structure
- **src/components/App.js** - Main React component
- **src/components/** - Feature-specific React components:
  - `Controller/` - Controller selection interface
  - `QuickchatColumn/` - Grid layout for quickchat messages
  - `Settings/` - Configuration panel
  - `Tabs/` - Tab management for multiple quickchat sets
  - `ChatIndicator/` - Visual feedback for typing state

### Native Addon
- **my-addon/** - C++ Node.js addon for low-level keyboard simulation
- Built with node-gyp, configured in `binding.gyp`
- Provides faster, more reliable key input than pure JS solutions

### Data Flow
1. Controller input detected in `modules/controller.js`
2. Input mapped to quickchat position based on current tab
3. Message retrieved from store and sent to keyboard module
4. Native addon types message rapidly using Windows APIs
5. UI updates to show typing status via IPC messages

### IPC Event Chain (complete)
All cross-module communication goes through `ipcMain.emit` / `ipcMain.on`:

| Event | Direction | Purpose |
|---|---|---|
| `send-quickchat` | controller → keyboard | Trigger typing a message |
| `typing-started` | keyboard → controller | Lock controller input during typing |
| `typing-complete` | keyboard → controller | Unlock input, call `resetInputs()` |
| `chunk-sent` | keyboard → controller | Keep lock active during chunked typing |
| `chat-toggled` | controller → main → renderer | Toggle chat on/off (right-stick double-click) |
| `change-tab` | controller → main → renderer | Switch quickchat tab (left-stick click + move) |
| `update-current-tab` | renderer → main → controller | Sync active tab index |
| `controller-selected` | renderer → controller | Re-init controller after user selects one |
| `controller-status-changed` | controller → renderer | Update status indicator |
| `update-available` | updater → renderer | Show download-in-progress banner |
| `update-downloaded` | updater → renderer | Show restart button |
| `restart-app` | renderer → updater | Call `autoUpdater.quitAndInstall()` |

### Controller HID Data Layout
`node-hid` includes the report ID as `data[0]`. Byte offsets differ by connection:

**USB (Report ID 0x01 at data[0]):**
- `data[3]` — Right stick X
- `data[6]` — R2 trigger analog
- `data[7]` — Face buttons + flags
- `data[8]` — D-pad hat switch (0=up, 2=right, 4=down, 6=left, 8=neutral; diagonals are odd)
- `data[9]` — L1/R1/L3/R3/Create/Options buttons

**Bluetooth (Report ID 0x31 at data[0] — everything shifts +1):**
- `data[4]` — Right stick X
- `data[7]` — R2 trigger analog
- `data[8]` — Face buttons + flags
- `data[9]` — D-pad hat switch
- `data[10]` — L1/R1/L3/R3/Create/Options buttons

Detection: `const isBluetooth = data[0] === 0x31; const o = isBluetooth ? 1 : 0;`

**Known product IDs:**
- DualShock 4 (PS4): `vendorId 1356, productId 1476`
- DualSense (PS5): `vendorId 1356, productId 3302`
- DualSense Edge: `vendorId 1356, productId 3570` — polls at 1000Hz, throttled to 250Hz in code
- Xbox (generic): `vendorId 1118` — dpad at `data[12]`, values 1/3/5/7 for N/E/S/W
- Note: PS5 Pro console ships with a standard DualSense (3302), not a unique product ID

### Controller Input State Machine
Key state flags in `controller.js` (all at `initializeController` outer scope):
- `processing` — set true when a quickchat fires; reset to false 200ms after `typing-complete`
- `typingInProgress` — set true during keyboard output; blocks all controller input
- `typingPriority` — set true during typing; allows only the chat-toggle double-click through
- `dpadInputs[]` — accumulates 1-2 dpad presses before firing
- `resetInputs()` — clears dpadInputs, lastDpadState, thumbstickPressed, schedules processing=false

**Critical**: `resetInputs` must be defined at the `initializeController` scope (not inside setupController blocks) so the `typing-complete` IPC handler can call it. Past bug: it was scoped inside the controller blocks, causing a silent ReferenceError that left `processing` stuck at `true` after every message.

### Auto-Updater
Uses `electron-updater` against GitHub releases. Requires a published release with `latest.yml` (generated by `npm run publish`). Chain: `updater.js` receives events → forwards to renderer via `mainWindow.webContents.send` → App.js shows update banner → user clicks "Restart now" → IPC `restart-app` → `autoUpdater.quitAndInstall()`.

Draft releases on GitHub are ignored by the updater; releases must be published.

### Configuration
- Settings stored in JSON format via custom store module
- Default configuration includes 16 quickchat slots per tab
- Controller settings persist device selection
- Typing speed configurable to prevent Rocket League input lag

### Frontend Components
- `ControllerStatus/` — polls `get-controller-status` every 2s + listens for `controller-status-changed`
- `ChatIndicator/` — reflects `ui-chat-toggled` events
- `DeveloperPanel/` — debug panel (not wired into main App.js render path by default)

## Key Technologies
- Electron 23.x for desktop app framework
- React 18.x for frontend UI
- Webpack 5.x for frontend bundling
- node-hid for controller communication
- Native C++ addon for keyboard simulation
- electron-builder for packaging and distribution