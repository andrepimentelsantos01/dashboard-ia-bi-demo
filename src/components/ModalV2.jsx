import React from "react";
import { Modal } from "react-bootstrap";

const ModalV2 = ({ open, setOpen, title, content }) => {
  return (
    <Modal
      show={Boolean(open)}
      onHide={() => setOpen(false)}
      size="xl"
      centered
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>{title || "Detalhes"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
    </Modal>
  );
};

export default ModalV2;
