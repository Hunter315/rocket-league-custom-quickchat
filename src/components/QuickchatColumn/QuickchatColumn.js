import React, { useState } from "react";

const QuickchatColumn = ({
  colKey,
  column,
  columns,
  handleChange,
  activeQuickchats,
}) => {
  const [expandedKey, setExpandedKey] = useState(null);

  const handleInputChange = (key, value) => {
    handleChange(key, value);
  };

  return (
    <div className="quickchat-column">
      <img src={column.icon} alt={`D-pad ${colKey}`} className="dpad-icon" />
      <div className="column">
        {Object.keys(activeQuickchats).map((key) => {
          if (key.startsWith(`${colKey},`)) {
            const isExpanded = expandedKey === key;
            return (
              <div key={key} className="quickchat">
                <img
                  src={columns[key.split(",")[1]].icon}
                  alt={`D-pad ${key.split(",")[1]}`}
                  className="dpad-icon-small"
                />
                <div className="input-container">
                  <textarea
                    type="text"
                    value={activeQuickchats[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    onClick={() => setExpandedKey(key)}
                    maxLength={120}
                    style={{
                      width: "100%",
                      height: isExpanded ? "100px" : "30px",
                      resize: "none",
                      transition: "height 0.3s ease",
                    }}
                    onBlur={() => setExpandedKey(null)}
                  />
                  <div className="char-counter">
                    {activeQuickchats[key].length}/120
                  </div>
                </div>
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
