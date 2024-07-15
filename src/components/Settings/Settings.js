import React from "react";
import "./Settings.css";

const Settings = ({
  tSpeed,
  setTSpeed,
  typingSpeed,
  setTypingSpeed,
  activationMethod,
  setActivationMethod,
  handleSearchControllers,
  selectedController,
}) => {
  return (
    <div className="settings">
      <label className="label-search">
        Typing Speed:
        <div className="value-container">
          <input
            type="number"
            className="value-input"
            value={typingSpeed}
            onChange={(e) => setTypingSpeed(parseInt(e.target.value, 10))}
            min="0"
          />
          <p className="subscript">microseconds per character</p>
        </div>
      </label>
      <label className="label-search">
        Open Text Box Delay
        <div className="value-container">
          <input
            type="number"
            className="value-input"
            value={tSpeed}
            onChange={(e) => setTSpeed(parseInt(e.target.value, 10))}
            min="0"
          />
          <p className="subscript">milliseconds</p>
        </div>
      </label>
      <label className="label-search">
        Activation Method:
        <select
          className="active-select"
          value={activationMethod}
          onChange={(e) => setActivationMethod(e.target.value)}
        >
          <option value="thumbstick">Right Thumbstick Click</option>
          <option value="dpad">None</option>
        </select>
      </label>
      <button className="search-button" onClick={handleSearchControllers}>
        Search for Controllers
      </button>
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
