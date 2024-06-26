import React from "react";

const Tabs = ({
  currentTab,
  setCurrentTab,
  quickchatsStore,
  handleAddTab,
  handleDeleteTab,
}) => {
  return (
    <div className="tabs">
      {quickchatsStore.map((_, index) => (
        <div
          key={index}
          className={`tab ${index === currentTab ? "active" : ""}`}
          onClick={() => setCurrentTab(index)}
        >
          Tab {index + 1}
          {index !== 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTab(index);
              }}
            >
              x
            </button>
          )}
        </div>
      ))}
      <button onClick={handleAddTab}>New Tab</button>
    </div>
  );
};

export default Tabs;
