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

### Configuration
- Settings stored in JSON format via custom store module
- Default configuration includes 16 quickchat slots per tab
- Controller settings persist device selection
- Typing speed configurable to prevent Rocket League input lag

## Key Technologies
- Electron 23.x for desktop app framework
- React 18.x for frontend UI
- Webpack 5.x for frontend bundling
- node-hid for controller communication
- Native C++ addon for keyboard simulation
- electron-builder for packaging and distribution