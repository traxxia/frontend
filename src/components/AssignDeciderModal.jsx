import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Plus } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../store";

const AssignDeciderModal = ({ show, onHide, project, onSave, businessId }) => {
  const { t } = useTranslation();
  
  const [eligibleOwners, setEligibleOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  
  // Fetch owners just like in ProjectForm
  useEffect(() => {
    if (show && businessId) {
      const fetchOwners = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${businessId}/eligible-owners`, {
            headers: {
              "Authorization": `Bearer ${useAuthStore.getState().token}`
            }
          });
          const data = await response.json();
          setEligibleOwners(data.eligible_owners || []);
        } catch (err) {
          console.error("Failed to fetch eligible owners:", err);
          setEligibleOwners([]);
        }
      };
      fetchOwners();
    }
  }, [show, businessId]);

  useEffect(() => {
    if (show && project) {
      setSelectedOwnerId(project.accountable_owner_id || "");
    }
  }, [show, project]);

  const handleSave = () => {
    const owner = eligibleOwners.find(o => o._id === selectedOwnerId);
    if (owner) {
      onSave(project, owner._id, owner.name);
    } else {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-md">
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold fs-4">{t("Assign decider")}</Modal.Title>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {t("The accountable for this bet. RAPID's D — a single person who owns the call.")}
          </p>
        </div>
        <button className="btn-close shadow-none" onClick={onHide} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
      </Modal.Header>
      
      <Modal.Body className="pt-4 pb-2">
        <Form.Select 
          className="mb-3 shadow-none text-primary fw-bold py-3 px-3"
          style={{ borderColor: '#e2e8f0', borderRadius: '8px' }}
          value={selectedOwnerId}
          onChange={(e) => setSelectedOwnerId(e.target.value)}
        >
          <option value="" disabled className="text-muted fw-normal">{t("Choose a collaborator...")}</option>
          {eligibleOwners.map(owner => (
            <option key={owner._id} value={owner._id} className="text-dark fw-normal">
              {owner.name} ({owner.email})
            </option>
          ))}
        </Form.Select>

        <Button 
          variant="outline-primary" 
          className="w-100 rounded fw-bold py-3 d-flex align-items-center gap-2 border-dashed text-start px-3"
          style={{ borderStyle: 'dashed', backgroundColor: '#fff', borderColor: '#cbd5e1' }}
          onClick={() => {}} // Placeholder for add new collaborator flow
        >
          <Plus size={16} /> {t("Add new collaborator")}
        </Button>
      </Modal.Body>
      
      <Modal.Footer className="border-0 px-4 pb-4 pt-3">
        <div className="d-flex justify-content-end w-100 gap-2">
          <Button variant="outline-secondary" className="border shadow-sm bg-white text-dark fw-bold px-4" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" className="fw-bold px-4" disabled={!selectedOwnerId} onClick={handleSave}>
            Save
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignDeciderModal;
