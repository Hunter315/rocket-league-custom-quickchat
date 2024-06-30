import React from "react";

const Settings = ({
  typingSpeed,
  setTypingSpeed,
  activationMethod,
  setActivationMethod,
  handleSearchControllers,
  selectedController,
}) => {
  console.log("typing speed in Settings.js: ", typingSpeed);
  return (
    <div className="settings">
      <button className="search-button" onClick={handleSearchControllers}>
        Search for Controllers
      </button>
      <label className="label-search">
        Typing Speed (ms per character):
        <input
          type="number"
          className="speed-input"
          value={typingSpeed}
          onChange={(e) => setTypingSpeed(parseInt(e.target.value, 10))}
        />
      </label>
      <label className="label-search">
        Activation Method:
        <select
          value={activationMethod}
          onChange={(e) => setActivationMethod(e.target.value)}
        >
          <option value="thumbstick">Right Thumbstick Click</option>
          <option value="dpad">None</option>
        </select>
      </label>
      {selectedController && (
        <div>
          <h3>
            Selected Controller:{" "}
            {selectedController.product ||
              selectedController.manufacturer ||
              selectedController.path}
          </h3>
        </div>
      )}
    </div>
  );
};

export default Settings;
