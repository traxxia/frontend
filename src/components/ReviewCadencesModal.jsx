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
  // Names from project data waiting to be resolved to IDs once cadences load
  const pendingSelectionNamesRef = React.useRef([]);
  // Prevents re-initialization from overwriting user selections when the cadence list grows
  const initializedRef = React.useRef(false);
  const [cadencesLoaded, setCadencesLoaded] = useState(false);

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
    } finally {
      setCadencesLoaded(true);
    }
  };

  // Step 1: When modal opens or project changes, record names to pre-select and reset flags
  useEffect(() => {
    if (show) {
      setCadencesLoaded(false);
      fetchCadences();
    }
    if (show && project) {
      const cadenceStr = project.review_cadence || project.cadence || "";
      const names = cadenceStr.split(",").map(s => s.trim()).filter(Boolean);
      pendingSelectionNamesRef.current = names;
      initializedRef.current = false;
      setSelectedCadences([]);
      setIsCreating(false);
      setNewCadenceName("");
      setNewCadenceFrequency("Monthly");
    }
    if (!show) {
      initializedRef.current = false;
    }
  }, [show, project, selectedBusinessId]);

  // Step 2: Once cadences load, resolve pending names to IDs — runs only once per modal open
  useEffect(() => {
    if (!show || !project || initializedRef.current || !cadencesLoaded) return;

    const names = pendingSelectionNamesRef.current;
    const resolvedIds = names
      .map(name => availableCadences.find(c => c.name === name))
      .filter(Boolean)
      .map(c => String(c._id));

    setSelectedCadences(resolvedIds);
    initializedRef.current = true;
  }, [show, project, availableCadences]);

  const handleToggle = (id) => {
    const strId = String(id);
    setSelectedCadences(prev =>
      prev.includes(strId) ? prev.filter(cId => cId !== strId) : [...prev, strId]
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
      setSelectedCadences(prev => [...prev, String(newCadence._id)]);
      initializedRef.current = true;

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
      .map(id => availableCadences.find(c => String(c._id) === String(id))?.name)
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
          {availableCadences.map((cadence) => {
            const isSelected = selectedCadences.includes(String(cadence._id));
            return (
              <div
                key={cadence._id}
                className="cadence-item rounded p-3 d-flex align-items-center justify-content-between"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: isSelected ? '2px solid #0c71b9' : '1.5px solid #e2e8f0',
                  backgroundColor: isSelected ? '#EBF4FB' : '#ffffff',
                }}
                onClick={() => handleToggle(cadence._id)}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #0c71b9' : '2px solid #cbd5e1',
                      backgroundColor: isSelected ? '#0c71b9' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? '#0c71b9' : '#1e293b',
                      fontSize: '14px',
                      transition: 'color 0.15s',
                    }}
                  >{cadence.name}</span>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: isSelected ? '#0c71b9' : '#94a3b8',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >{cadence.frequency}</span>
              </div>
            );
          })}
          {availableCadences.length === 0 && !isCreating && (
            <div className="text-center p-3 border rounded border-dashed text-muted">
              {t("No cadences available. Create a new one below.")}
            </div>
          )}
        </div>

        {!isCreating ? (
          <Button
            className="cadence-option-add"
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
                  style={{ borderColor: '#0c71b9', fontSize: '13px' }}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </Form.Select>
              </Form.Group>

              <p className="text-muted mb-3" style={{ fontSize: '12px' }}>{t("Audience can be set later from Manage.")}</p>

              <div className="d-flex justify-content-end gap-2" >
                <Button style={{ fontSize: '13px' }} variant="link" className="text-secondary text-decoration-none fw-bold shadow-none" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!newCadenceName.trim() || isLoading}
                  onClick={handleCreateNew}
                  className="fw-bold border-0 text-white shadow-none"
                  style={{
                    fontSize: '13px',
                    ...(
                      !newCadenceName.trim() || isLoading
                        ? { backgroundColor: '#cbd5e1', color: '#475569' }
                        : { backgroundColor: '#0c71b9' }
                    ),
                  }}                >
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
          <Button variant="outline-secondary" className="border shadow-sm bg-white text-dark  px-4" onClick={onHide} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="px-4  text-white border-0 shadow-none d-flex align-items-center gap-2" style={{ backgroundColor: '#0c71b9' }} onClick={handleSave} disabled={isSaving}>
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
