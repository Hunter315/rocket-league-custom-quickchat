import React from "react";
import "./ChatIndicator.css";

const ChatIndicator = ({ chatEnabled }) => {
  return (
    <div className="right">
      <span>
        <div className={`round light ${chatEnabled ? "on" : "off"}`}></div>
        <div
          className={`round color ${chatEnabled ? "on" : "off"}`}
          id="light"
        ></div>
        <div className={`round glass ${chatEnabled ? "on" : "off"}`}></div>
      </span>
    </div>
  );
};

export default ChatIndicator;
