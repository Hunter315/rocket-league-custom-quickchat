import React from "react";
import Modal from "react-modal";

const getControllerDisplayName = (device) => {
  // Enhanced controller identification
  if (device.vendorId === 1356) { // Sony
    if (device.productId === 3570) {
      return "DualSense Edge (PS5 Pro Controller)";
    } else if (device.productId === 3302) {
      return "DualSense Wireless Controller (PS5)";
    } else if (device.productId === 1476) {
      return "DualShock 4 Wireless Controller (PS4)";
    }
  } else if (device.vendorId === 1118) { // Microsoft
    return "Xbox Controller";
  }
  
  return device.product || device.manufacturer || "Unknown Controller";
};

const ControllerModal = ({
  isOpen,
  onRequestClose,
  controllers,
  expandedDevice,
  toggleDevice,
  handleSelectController,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Select Controller"
      portalClassName="modal-after-open"
    >
      <h2>Select Controller</h2>
      {controllers.map((device) => (
        <div key={device.path} className="controller-item">
          <div
            onClick={() => toggleDevice(device)}
            className="controller-summary"
          >
            {getControllerDisplayName(device)}
          </div>
          {expandedDevice === device && (
            <div className="controller-details">
              <p>
                <strong>Manufacturer:</strong> {device.manufacturer}
              </p>
              <p>
                <strong>Product:</strong> {device.product}
              </p>
              <p>
                <strong>Path:</strong> {device.path}
              </p>
              <p>
                <strong>Vendor ID:</strong> {device.vendorId}
              </p>
              <p>
                <strong>Product ID:</strong> {device.productId}
              </p>
              <button onClick={() => handleSelectController(device)}>
                Select
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={onRequestClose}>Close</button>
    </Modal>
  );
};

export default ControllerModal;
