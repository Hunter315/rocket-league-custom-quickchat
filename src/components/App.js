import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { QuickchatColumn } from "./QuickchatColumn";
import { QuickchatModal } from "./QuickchatModal";
import { ControllerModal } from "./Controller";
import { Settings } from "./Settings";
import { Tabs } from "./Tabs";
import { Toast } from "./Toast";
import dpadUp from "../assets/icons/dpad-up.svg";
import dpadRight from "../assets/icons/dpad-right.svg";
import dpadDown from "../assets/icons/dpad-down.svg";
import dpadLeft from "../assets/icons/dpad-left.svg";
import "../index.css";

const App = () => {
  const [quickchatsStore, setQuickchatsStore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(5);
  const [controllers, setControllers] = useState([]);
  const [selectedController, setSelectedController] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [activationMethod, setActivationMethod] = useState("thumbstick");
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    window.electron
      .loadQuickchats()
      .then((data) => {
        console.log("Loaded quickchats data:", data);
        if (Array.isArray(data)) {
          setQuickchatsStore(data);
        } else if (data.quickchats && Array.isArray(data.quickchats)) {
          setQuickchatsStore(data.quickchats);
        } else {
          setQuickchatsStore([{}]); // default initialization
        }
      })
      .finally(() => setLoading(false));

    window.electron.loadSettings().then((settings) => {
      setTypingSpeed(settings.typingSpeed || 5);
      setSelectedController(settings.selectedController || null);
      setActivationMethod(settings.activationMethod || "thumbstick");
    });

    window.electron.onUpdateAvailable(() => {
      alert("A new update is available. Downloading now...");
    });

    window.electron.onUpdateDownloaded(() => {
      const userResponse = confirm(
        "Update Downloaded. It will be installed on restart. Restart now?"
      );
      if (userResponse) {
        window.electron.restartApp();
      }
    });

    window.electron.on("send-quickchat", (event, message) => {
      alert(`Quickchat: ${message}`); // Handle the quickchat message appropriately
    });

    // Send the current tab index to the main process
    window.electron.send("update-current-tab", currentTab);
  }, []);

  useEffect(() => {
    console.log("Current tab updated to:", currentTab);
    window.electron.send("update-current-tab", currentTab);
  }, [currentTab]);

  const handleChange = (key, value) => {
    console.log("handleChange called with key:", key, "value:", value);
    setQuickchatsStore((prevStore) => {
      const updatedStore = [...prevStore];
      updatedStore[currentTab][key] = value;
      console.log("Updated quickchatsStore in handleChange:", updatedStore);
      return updatedStore;
    });
  };

  const handleSave = () => {
    console.log("handleSave called with quickchatsStore:", quickchatsStore);
    const saveQuickchatsPromise =
      window.electron.saveQuickchats(quickchatsStore);
    const saveSettingsPromise = window.electron.saveSettings({
      typingSpeed,
      selectedController,
      activationMethod,
    });

    Promise.all([saveQuickchatsPromise, saveSettingsPromise])
      .then(() => {
        console.log("Save successful");
        setToastMessage("Settings and Quickchats saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving settings or quickchats:", error);
        setToastMessage("Failed to save settings and quickchats.");
      });
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

  const handleAddTab = () => {
    const newTab = {
      "0,0": "",
      "0,2": "",
      "0,4": "",
      "0,6": "",
      "2,0": "",
      "2,2": "",
      "2,4": "",
      "2,6": "",
      "4,0": "",
      "4,2": "",
      "4,4": "",
      "4,6": "",
      "6,0": "",
      "6,2": "",
      "6,4": "",
      "6,6": "",
    };

    setQuickchatsStore((prevStore) => {
      const newStore = [...prevStore, newTab];
      console.log("New Store after adding tab:", newStore);
      return newStore;
    });

    setCurrentTab(quickchatsStore.length); // Set to the new tab
    window.electron.send("update-current-tab", quickchatsStore.length); // Update the current tab in main process
  };

  const handleDeleteTab = (tabIndex) => {
    if (tabIndex === 0) return; // Don't delete the default tab
    setQuickchatsStore((prevStore) => {
      const updatedStore = prevStore.filter((_, index) => index !== tabIndex);
      console.log("New Store after deleting tab:", updatedStore);
      return updatedStore;
    });
    setCurrentTab(0); // Set to the default tab
    window.electron.send("update-current-tab", 0); // Update the current tab in main process
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

  const activeQuickchats = quickchatsStore[currentTab] || {};
  console.log("Active Quickchats:", activeQuickchats);

  Object.keys(activeQuickchats).forEach((key) => {
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
            value={activeQuickchats[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            onClick={() => {
              setCurrentInputValue(activeQuickchats[key]);
              setCurrentKey(key);
              setIsInputModalOpen(true);
            }}
          />
        </div>
      );
    }
  });

  return (
    <div className="container">
      <h1>Quickchat Manager</h1>
      <Tabs
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          console.log("Tab switched to:", tab);
          setCurrentTab(tab);
          window.electron.send("update-current-tab", tab); // Update the current tab in main process
        }}
        quickchatsStore={quickchatsStore}
        handleAddTab={handleAddTab}
        handleDeleteTab={handleDeleteTab}
      />
      <div className="quickchat-columns">
        <QuickchatModal
          isOpen={isInputModalOpen}
          onRequestClose={() => setIsInputModalOpen(false)}
          currentInputValue={currentInputValue}
          setCurrentInputValue={setCurrentInputValue}
          handleChange={handleChange}
          currentKey={currentKey}
        />
        {Object.keys(columns).map((colKey) => (
          <QuickchatColumn
            key={colKey}
            colKey={colKey}
            column={columns[colKey]}
          />
        ))}
      </div>
      <button id="save-button" onClick={handleSave}>
        Save
      </button>
      <Settings
        typingSpeed={typingSpeed}
        setTypingSpeed={setTypingSpeed}
        activationMethod={activationMethod}
        setActivationMethod={setActivationMethod}
        handleSearchControllers={handleSearchControllers}
      />
      <ControllerModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        controllers={controllers}
        expandedDevice={expandedDevice}
        toggleDevice={toggleDevice}
        handleSelectController={handleSelectController}
      />
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
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
};

export default App;
