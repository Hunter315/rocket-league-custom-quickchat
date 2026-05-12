import React, { useState, useEffect } from "react";
import "./ControllerStatus.css";

const getControllerDisplayName = (device) => {
  if (!device) return "No Controller";

  if (device.vendorId === 1356) { // Sony
    if (device.productId === 3570) {
      return "DualSense Edge (PS5 Pro)";
    } else if (device.productId === 3302) {
      return "DualSense (PS5)";
    } else if (device.productId === 1476) {
      return "DualShock 4 (PS4)";
    }
  } else if (device.vendorId === 1118) { // Microsoft
    return "Xbox Controller";
  }

  return device.product || "Unknown Controller";
};

const getStatusColor = (status) => {
  switch (status) {
    case "connected": return "#4CAF50";
    case "connecting": return "#FF9800";
    case "reconnecting": return "#2196F3";
    case "disconnected": return "#9E9E9E";
    case "error":
    case "failed": return "#F44336";
    case "no_controller": return "#757575";
    default: return "#9E9E9E";
  }
};

const ControllerStatus = () => {
  const [status, setStatus] = useState({
    status: "disconnected",
    controller: null
  });

  useEffect(() => {
    let statusInterval;

    const updateStatus = async () => {
      try {
        const controllerStatus = await window.electron.getControllerStatus();
        setStatus(controllerStatus);
      } catch (error) {
        console.error("Failed to get controller status:", error);
      }
    };

    // Listen for status changes
    const handleStatusChange = (event, statusData) => {
      setStatus(statusData);
    };

    window.electron.on("controller-status-changed", handleStatusChange);

    // Initial status check
    updateStatus();

    // Poll for updates every 2 seconds
    statusInterval = setInterval(updateStatus, 2000);

    return () => {
      if (statusInterval) clearInterval(statusInterval);
      window.electron.removeListener("controller-status-changed", handleStatusChange);
    };
  }, []);

  const statusText = {
    connected: "Connected",
    connecting: "Connecting...",
    reconnecting: "Reconnecting...",
    disconnected: "Disconnected",
    error: "Error",
    failed: "Failed",
    no_controller: "No Controller"
  };

  return (
    <div className="controller-status">
      <div className="status-indicator">
        <div
          className="status-dot"
          style={{ backgroundColor: getStatusColor(status.status) }}
        />
        <div className="status-info">
          <div className="controller-name">
            {getControllerDisplayName(status.controller)}
          </div>
          <div className="status-text">
            {statusText[status.status] || status.status}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ControllerStatus;