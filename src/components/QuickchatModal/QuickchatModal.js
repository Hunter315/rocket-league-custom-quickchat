import React from "react";
import Modal from "react-modal";

const QuickchatModal = ({
  isOpen,
  onRequestClose,
  currentInputValue,
  setCurrentInputValue,
  handleChange,
  currentKey,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Quickchat"
      className="input-modal"
      overlayClassName="input-modal-overlay"
    >
      <h2>Edit Quickchat</h2>
      <textarea
        value={currentInputValue}
        onChange={(e) => setCurrentInputValue(e.target.value)}
        style={{ width: "100%", height: "200px" }}
      />
      <button
        onClick={() => {
          handleChange(currentKey, currentInputValue);
          onRequestClose();
        }}
      >
        Ok
      </button>
      <button onClick={onRequestClose}>Cancel</button>
    </Modal>
  );
};

export default QuickchatModal;
