import React, { useState } from "react";
import "./Tabs.css";

const Tabs = ({
  currentTab,
  setCurrentTab,
  quickchatsStore,
  handleAddTab,
  handleDeleteTab,
  handleTabNameChange,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTabName, setEditTabName] = useState("");
  const [menuIndex, setMenuIndex] = useState(null);

  const handleEdit = (index, name) => {
    setEditingIndex(index);
    setEditTabName(name);
    setMenuIndex(null); // Close menu when editing
  };

  const handleSaveEdit = (index) => {
    handleTabNameChange(index, editTabName);
    setEditingIndex(null);
    setEditTabName("");
  };

  const handleToggleMenu = (index) => {
    setMenuIndex(menuIndex === index ? null : index);
  };

  return (
    <div className="tabs">
      {quickchatsStore.map((tab, index) => (
        <div
          key={index}
          className={`tab ${index === currentTab ? "active" : ""}`}
          onClick={() => setCurrentTab(index)}
        >
          {editingIndex === index ? (
            <div className="edit-tab-name">
              <input
                type="text"
                value={editTabName}
                onChange={(e) => setEditTabName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                maxLength={30}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit(index);
                }}
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingIndex(null);
                  setEditTabName("");
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <span>{tab.name}</span>
              <button
                className="menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMenu(index);
                }}
              >
                &#x22EE; {/* Three-dot icon */}
              </button>
              {menuIndex === index && (
                <div className="menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(index, tab.name);
                    }}
                  >
                    Edit
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTab(index);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <button onClick={handleAddTab}>+</button>
    </div>
  );
};

export default Tabs;
