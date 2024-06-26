import React from "react";

const QuickchatColumn = ({ colKey, column }) => {
  return (
    <div className="quickchat-column">
      <img src={column.icon} alt={`D-pad ${colKey}`} className="dpad-icon" />
      <h2>Group {colKey / 2 + 1}</h2>
      <div className="column">{column.chats}</div>
    </div>
  );
};

export default QuickchatColumn;
