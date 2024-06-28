import React, { useState, useEffect } from "react";
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
  const [tabsStore, setTabsStore] = useState([]);
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
        if (Array.isArray(data)) {
          setTabsStore(data);
        } else {
          setTabsStore([{ name: "Tab 1", quickchats: {} }]); // default initialization
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
    window.electron.send("update-current-tab", currentTab);
  }, [currentTab]);

  const handleChange = (key, value) => {
    console.log("handleChange called with key:", key, "value:", value);
    setTabsStore((prevStore) => {
      const updatedStore = [...prevStore];
      updatedStore[currentTab].quickchats[key] = value;
      return updatedStore;
    });
  };

  const handleSave = () => {
    const saveQuickchatsPromise = window.electron.saveQuickchats(tabsStore);
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
      name: `Tab ${tabsStore.length + 1}`,
      quickchats: {
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
      },
    };

    setTabsStore((prevStore) => {
      const newStore = [...prevStore, newTab];
      return newStore;
    });

    setCurrentTab(tabsStore.length); // Set to the new tab
    window.electron.send("update-current-tab", tabsStore.length); // Update the current tab in main process
  };

  const handleDeleteTab = (tabIndex) => {
    if (tabIndex === 0) return; // Don't delete the default tab
    setTabsStore((prevStore) => {
      const updatedStore = prevStore.filter((_, index) => index !== tabIndex);
      return updatedStore;
    });
    setCurrentTab(0); // Set to the default tab
    window.electron.send("update-current-tab", 0); // Update the current tab in main process
  };

  const handleTabNameChange = (index, newName) => {
    setTabsStore((prevStore) => {
      const updatedStore = [...prevStore];
      updatedStore[index].name = newName;
      return updatedStore;
    });
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

  const activeQuickchats = tabsStore[currentTab]?.quickchats || {};

  return (
    <div className="container">
      <h1>Quickchat Manager</h1>
      <Tabs
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.electron.send("update-current-tab", tab); // Update the current tab in main process
        }}
        quickchatsStore={tabsStore}
        handleAddTab={handleAddTab}
        handleDeleteTab={handleDeleteTab}
        handleTabNameChange={handleTabNameChange}
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
            columns={columns}
            column={columns[colKey]}
            handleChange={handleChange}
            setCurrentInputValue={setCurrentInputValue}
            setCurrentKey={setCurrentKey}
            setIsInputModalOpen={setIsInputModalOpen}
            activeQuickchats={activeQuickchats}
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
        selectedController={selectedController}
      />
      <ControllerModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        controllers={controllers}
        expandedDevice={expandedDevice}
        toggleDevice={toggleDevice}
        handleSelectController={handleSelectController}
      />
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
};

export default App;
