import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import dpadUp from "./assets/icons/dpad-up.svg";
import dpadRight from "./assets/icons/dpad-right.svg";
import dpadDown from "./assets/icons/dpad-down.svg";
import dpadLeft from "./assets/icons/dpad-left.svg";

const App = () => {
  const [quickchats, setQuickchats] = useState({});
  const [loading, setLoading] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(5);
  const [controllers, setControllers] = useState([]);
  const [selectedController, setSelectedController] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDevice, setExpandedDevice] = useState(null);

  useEffect(() => {
    window.electron
      .loadQuickchats()
      .then(setQuickchats)
      .finally(() => setLoading(false));

    window.electron.loadSettings().then((settings) => {
      setTypingSpeed(settings.typingSpeed || 5);
      setSelectedController(settings.selectedController || null);
    });
  }, []);

  const handleChange = (key, value) => {
    setQuickchats((prevQuickchats) => ({
      ...prevQuickchats,
      [key]: value,
    }));
  };

  const handleSave = () => {
    window.electron.saveQuickchats(quickchats);
    window.electron.saveSettings({ typingSpeed, selectedController });
    alert("Settings and Quickchats saved successfully!");
  };

  const handleSearchControllers = async () => {
    const devices = await window.electron.searchControllers();
    setControllers(devices);
    setIsModalOpen(true);
  };

  const handleSelectController = (device) => {
    setSelectedController(device);
    setIsModalOpen(false);
  };

  const toggleDevice = (device) => {
    setExpandedDevice(expandedDevice === device ? null : device);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const columns = {
    0: { icon: dpadUp, chats: [] },
    2: { icon: dpadRight, chats: [] },
    4: { icon: dpadDown, chats: [] },
    6: { icon: dpadLeft, chats: [] },
  };

  Object.keys(quickchats).forEach((key) => {
    const colKey = key.split(",")[0];
    const colKey2 = key.split(",")[1];
    if (columns[colKey]) {
      columns[colKey].chats.push(
        <div key={key} className="quickchat">
          <img
            src={columns[colKey2].icon}
            alt={`D-pad ${colKey2}`}
            className="dpad-icon-small"
          />
          <input
            type="text"
            value={quickchats[key]}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      );
    }
  });

  return (
    <div className="container">
      <h1>Quickchat Manager</h1>

      <div className="quickchat-columns">
        {Object.keys(columns).map((colKey) => (
          <div key={colKey} className="quickchat-column">
            <img
              src={columns[colKey].icon}
              alt={`D-pad ${colKey}`}
              className="dpad-icon"
            />
            <h2>Group {colKey / 2 + 1}</h2>
            <div className="column">{columns[colKey].chats}</div>
          </div>
        ))}
      </div>
      <button id="save-button" onClick={handleSave}>
        Save
      </button>
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
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Select Controller"
          portalClassName="modal-after-open"
        >
          <h2>Select Controller</h2>
          {controllers.map((device) => (
            <div key={device.path} className="controller-item">
              <div
                onClick={() => toggleDevice(device)}
                className="controller-summary"
              >
                {device.product || device.manufacturer || device.path}
              </div>
              {expandedDevice === device && (
                <div className="controller-details">
                  <p>
                    <strong>Manufacturer:</strong> {device.manufacturer}
                  </p>
                  <p>
                    <strong>Product:</strong> {device.product}
                  </p>
                  <p>
                    <strong>Path:</strong> {device.path}
                  </p>
                  <p>
                    <strong>Vendor ID:</strong> {device.vendorId}
                  </p>
                  <p>
                    <strong>Product ID:</strong> {device.productId}
                  </p>
                  <button onClick={() => handleSelectController(device)}>
                    Select
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setIsModalOpen(false)}>Close</button>
        </Modal>
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
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
