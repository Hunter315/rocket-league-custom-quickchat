import React from "react";

const QuickchatColumn = ({
  colKey,
  column,
  columns,
  handleChange,
  setCurrentInputValue,
  setCurrentKey,
  setIsInputModalOpen,
  activeQuickchats,
}) => {
  return (
    <div className="quickchat-column">
      <img src={column.icon} alt={`D-pad ${colKey}`} className="dpad-icon" />
      <div className="column">
        {Object.keys(activeQuickchats).map((key) => {
          if (key.startsWith(`${colKey},`)) {
            return (
              <div key={key} className="quickchat">
                <img
                  src={columns[key.split(",")[1]].icon}
                  alt={`D-pad ${key.split(",")[1]}`}
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
          return null;
        })}
      </div>
    </div>
  );
};

export default QuickchatColumn;
