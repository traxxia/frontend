import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { X, Plus } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import axios from "axios";
import { useAuthStore, useBusinessStore } from "../store";
import "../styles/ProjectsTable.css";

const ReviewCadencesModal = ({ show, onHide, project, onSave }) => {
  const { t } = useTranslation();
  
  const selectedBusinessId = useBusinessStore((state) => state.selectedBusinessId);
  
  const [availableCadences, setAvailableCadences] = useState([]);
  const [selectedCadences, setSelectedCadences] = useState([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newCadenceName, setNewCadenceName] = useState("");
  const [newCadenceFrequency, setNewCadenceFrequency] = useState("Monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCadences = async () => {
    if (!selectedBusinessId) return;
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences?business_id=${selectedBusinessId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableCadences(response.data || []);
    } catch (err) {
      console.error("Failed to fetch cadences:", err);
    }
  };

  useEffect(() => {
    if (show) {
      fetchCadences();
    }
  }, [show, selectedBusinessId]);

  useEffect(() => {
    if (show && project) {
      const cadenceStr = project.review_cadence || project.cadence || "";
      const selectedNames = cadenceStr.split(",").map(s => s.trim()).filter(Boolean);
      
      const initialSelectedIds = [];
      
      selectedNames.forEach(name => {
        const match = availableCadences.find(c => c.name === name);
        if (match) {
          initialSelectedIds.push(match._id);
        }
      });
      
      if (availableCadences.length > 0) {
        setSelectedCadences(initialSelectedIds);
      }
      setIsCreating(false);
      setNewCadenceName("");
      setNewCadenceFrequency("Monthly");
    }
  }, [show, project, availableCadences.length]);

  const handleToggle = (id) => {
    setSelectedCadences(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleCreateNew = async () => {
    if (!newCadenceName.trim() || !selectedBusinessId) return;
    setIsLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences`, {
        name: newCadenceName.trim(),
        frequency: newCadenceFrequency,
        business_id: selectedBusinessId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newCadence = response.data;
      setAvailableCadences(prev => [...prev, newCadence]);
      setSelectedCadences(prev => [...prev, newCadence._id]);
      
      setIsCreating(false);
      setNewCadenceName("");
      setNewCadenceFrequency("Monthly");
    } catch (err) {
      console.error("Failed to create cadence:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const selectedNames = selectedCadences
      .map(id => availableCadences.find(c => c._id === id)?.name)
      .filter(Boolean)
      .join(", ");
      
    await onSave(project, selectedNames);
    setIsSaving(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered className="review-cadences-modal" dialogClassName="modal-md">
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold fs-4">{t("Review cadences")}</Modal.Title>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {t("A bet usually lives in more than one cadence. Pick every cadence where this bet should be reviewed.")}
          </p>
        </div>
        <button className="btn-close shadow-none" onClick={onHide} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
      </Modal.Header>
      
      <Modal.Body className="pt-4 pb-2">
        <div className="cadences-list d-flex flex-column gap-2 mb-3">
          {availableCadences.map((cadence) => (
            <div 
              key={cadence._id}
              className={`cadence-item border rounded p-3 d-flex align-items-center justify-content-between ${selectedCadences.includes(cadence._id) ? 'bg-light' : ''}`}
              style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: selectedCadences.includes(cadence._id) ? '#0c71b9' : '#e2e8f0' }}
              onClick={() => handleToggle(cadence._id)}
            >
              <div className="d-flex align-items-center gap-3">
                <Form.Check 
                  type="checkbox"
                  checked={selectedCadences.includes(cadence._id)}
                  onChange={() => {}} // handled by parent div onClick
                  className="cadence-checkbox m-0 shadow-none"
                  style={{ pointerEvents: 'none' }}
                />
                <span className="fw-bold text-dark">{cadence.name}</span>
              </div>
              <span className="text-muted" style={{ fontSize: '12px' }}>{cadence.frequency}</span>
            </div>
          ))}
          {availableCadences.length === 0 && !isCreating && (
            <div className="text-center p-3 border rounded border-dashed text-muted">
              {t("No cadences available. Create a new one below.")}
            </div>
          )}
        </div>

        {!isCreating ? (
          <Button 
            className="w-100 rounded fw-bold py-2 d-flex align-items-center justify-content-center gap-2 border-dashed bg-transparent"
            style={{ borderStyle: 'dashed', borderColor: '#0c71b9', color: '#0c71b9' }}
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} /> {t("Other — create a new cadence")}
          </Button>
        ) : (
          <div className="new-cadence-form border rounded overflow-hidden" style={{ borderColor: '#0c71b9' }}>
            <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-center fw-bold" style={{ cursor: 'pointer', color: '#0c71b9' }} onClick={() => setIsCreating(false)}>
              <X size={16} className="me-2" /> {t("Other — create a new cadence")}
            </div>
            <div className="p-3 bg-white">
              <span className="text-uppercase fw-bold mb-2 d-block" style={{ fontSize: '10px', letterSpacing: '1px', color: '#0c71b9' }}>NEW CADENCE</span>
              
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold" style={{ fontSize: '12px' }}>Name</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g. Product Committee"
                  value={newCadenceName}
                  onChange={(e) => setNewCadenceName(e.target.value)}
                  className="shadow-none"
                  style={{ borderColor: '#0c71b9' }}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold" style={{ fontSize: '12px' }}>Frequency</Form.Label>
                <Form.Select 
                  value={newCadenceFrequency}
                  onChange={(e) => setNewCadenceFrequency(e.target.value)}
                  className="shadow-none"
                  style={{ borderColor: '#0c71b9' }}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </Form.Select>
              </Form.Group>
              
              <p className="text-muted mb-3" style={{ fontSize: '12px' }}>{t("Audience can be set later from Manage.")}</p>
              
              <div className="d-flex justify-content-end gap-2">
                <Button variant="link" className="text-secondary text-decoration-none fw-bold shadow-none" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  disabled={!newCadenceName.trim() || isLoading}
                  onClick={handleCreateNew}
                  className="fw-bold border-0 text-white shadow-none"
                  style={(!newCadenceName.trim() || isLoading) ? { backgroundColor: '#cbd5e1', color: '#475569' } : { backgroundColor: '#0c71b9' }}
                >
                  {isLoading ? t("Creating...") : t("Create & select")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer className="border-0 px-4 pb-4 pt-0 d-flex justify-content-between align-items-center">
        <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
          {selectedCadences.length === 0 ? "NONE SELECTED" : `${selectedCadences.length} SELECTED`}
        </span>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" className="border shadow-sm bg-white text-dark fw-bold rounded-pill px-4" onClick={onHide} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="fw-bold px-4 rounded-pill text-white border-0 shadow-none d-flex align-items-center gap-2" style={{ backgroundColor: '#0c71b9' }} onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {t("Saving...")}
              </>
            ) : (
              t("Save")
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ReviewCadencesModal;
