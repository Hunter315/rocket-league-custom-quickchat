import React, { useEffect } from "react";
import checkMark from "../../assets/icons/check-mark.svg";
import "./Toast.css";

const Toast = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast">
      <img src={checkMark} alt="Success" className="check-mark" />
    </div>
  );
};

export default Toast;
