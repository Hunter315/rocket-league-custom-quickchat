import React from "react";
import Modal from "react-modal";

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
            {device.product || device.manufacturer || device.path}
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
