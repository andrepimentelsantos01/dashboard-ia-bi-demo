import React from "react";
import { Modal } from "react-bootstrap";
import "./ModalV2.css";

const ModalV2 = ({ open, setOpen, title, content }) => {
  return (
    <Modal
      show={Boolean(open)}
      onHide={() => setOpen(false)}
      size="xl"
      centered
      scrollable
      dialogClassName="dashboard-modal-dialog"
      contentClassName="dashboard-modal-content"
    >
      <Modal.Header closeButton className="dashboard-modal-header">
        <Modal.Title>{title || "Detalhes"}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="dashboard-modal-body">
        <div className="dashboard-modal-body-shell">{content}</div>
      </Modal.Body>
    </Modal>
  );
};

export default ModalV2;
