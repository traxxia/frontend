import React, { useState, useEffect } from "react";
import { Modal, Spinner } from "react-bootstrap";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore, useProjectStore } from "../store";
import { useQueryClient } from "@tanstack/react-query";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useUIStore } from "../store/uiStore";

const NewBetModal = ({ show, onHide, selectedBusinessId, onSuccess }) => {
  const addToast = useUIStore(state => state.addToast);
  const { t } = useTranslation();
  const { createProject } = useProjectStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvitingCollaborator, setIsInvitingCollaborator] = useState(false);
  const [isCreatingCadence, setIsCreatingCadence] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [eligibleOwners, setEligibleOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [availableCadences, setAvailableCadences] = useState([]);
  
  const [isFocused, setIsFocused] = useState(false);

  // Decider state
  const [isDeciderExpanded, setIsDeciderExpanded] = useState(false);
  const [isCollaboratorFormExpanded, setIsCollaboratorFormExpanded] = useState(false);
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");

  // Cadence state
  const [isCadenceExpanded, setIsCadenceExpanded] = useState(false);
  const [isNewCadenceFormExpanded, setIsNewCadenceFormExpanded] = useState(false);
  const [newCadenceName, setNewCadenceName] = useState("");
  const [newCadenceFrequency, setNewCadenceFrequency] = useState("Monthly");
  const [selectedCadenceIds, setSelectedCadenceIds] = useState([]);

  useEffect(() => {
    if (show && selectedBusinessId) {
      setProjectName("");
      setSelectedOwnerId("");
      setSelectedCadenceIds([]);
      setIsDeciderExpanded(false);
      setIsCollaboratorFormExpanded(false);
      setIsCadenceExpanded(false);
      setIsNewCadenceFormExpanded(false);

      const fetchData = async () => {
        try {
          const token = useAuthStore.getState().token;
          const [ownersRes, cadencesRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${selectedBusinessId}/eligible-owners`, {
              headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.json()),
            axios.get(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/cadences?business_id=${selectedBusinessId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.data)
          ]);

          setEligibleOwners(ownersRes.eligible_owners || []);
          setAvailableCadences(cadencesRes || []);
        } catch (err) {
          console.error("Failed to fetch data for new bet modal:", err);
          setEligibleOwners([]);
          setAvailableCadences([]);
        }
      };
      fetchData();
    }
  }, [show, selectedBusinessId]);

  const handleInviteCollaborator = async () => {
    if (!newCollaboratorName.trim() || !newCollaboratorEmail.trim()) return;
    setIsInvitingCollaborator(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${selectedBusinessId}/invite-collaborator`, {
        name: newCollaboratorName.trim(),
        email: newCollaboratorEmail.trim(),
        role: "collaborator"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newOwner = {
        _id: response.data.collaborator?._id || newCollaboratorEmail.trim(), // Provide a fallback if backend does not return full user object
        name: newCollaboratorName.trim(),
        email: newCollaboratorEmail.trim()
      };
      
      setEligibleOwners(prev => [...prev, newOwner]);
      setSelectedOwnerId(newOwner._id);
      
      setNewCollaboratorName("");
      setNewCollaboratorEmail("");
      setIsCollaboratorFormExpanded(false);
      addToast({ message: "Collaborator invited successfully.", type: "success" });
    } catch (err) {
      console.error("Failed to invite collaborator:", err);
      addToast({ message: err.response?.data?.error || "Failed to invite collaborator", type: "warning" });
    } finally {
      setIsInvitingCollaborator(false);
    }
  };

  const handleCreateCadence = async () => {
    if (!newCadenceName.trim()) return;
    setIsCreatingCadence(true);
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
      setSelectedCadenceIds(prev => [...prev, newCadence._id]);
      setNewCadenceName("");
      setNewCadenceFrequency("Monthly");
      setIsNewCadenceFormExpanded(false);
    } catch (err) {
      console.error("Failed to create cadence:", err);
      addToast({ message: "Failed to create cadence", type: "warning" });
    } finally {
      setIsCreatingCadence(false);
    }
  };

  const handleToggleCadence = (id) => {
    setSelectedCadenceIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return;
    setIsSubmitting(true);
    try {
      const selectedCadenceNames = selectedCadenceIds
        .map(id => availableCadences.find(c => c._id === id)?.name)
        .filter(Boolean)
        .join(", ");

      const payload = {
        business_id: selectedBusinessId,
        project_name: projectName.trim(),
        accountable_owner_id: selectedOwnerId || null,
        review_cadence: selectedCadenceNames || "",
        status: "Draft",
        learning_state: "Testing"
      };

      const { success, error, data } = await createProject(payload);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["projects", selectedBusinessId] });
        addToast({ message: "Bet created successfully.", type: "success" });
        if (onSuccess) onSuccess(data);
        onHide();
      } else {
        addToast({ message: error || "Failed to create bet", type: "warning" });
      }
    } catch (err) {
      console.error(err);
      addToast({ message: "An error occurred", type: "warning" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      dialogClassName="custom-modal-width" 
      contentClassName="border-0 shadow-lg" 
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <style>
        {`
          .custom-modal-width { max-width: 650px; }
          .new-bet-modal-content { border-radius: 16px; overflow: hidden; background: #fff; }
          .new-bet-textarea, .new-bet-input, .new-bet-select {
            width: 100%; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px;
            font-size: 14px; color: #111827; resize: none; outline: none; transition: all 0.2s;
          }
          .new-bet-textarea:focus, .new-bet-input:focus, .new-bet-select:focus, .active-focus {
            border-color: #3B82F6; box-shadow: 0 0 0 1px #3B82F6;
          }
          .new-bet-textarea::placeholder, .new-bet-input::placeholder { color: #9CA3AF; }
          
          .new-bet-dropdown-btn {
            width: 100%; padding: 12px 16px; border: 1px solid #E5E7EB; border-radius: 8px;
            display: flex; justify-content: space-between; align-items: center; background: #FFFFFF;
            cursor: pointer; outline: none; transition: all 0.2s;
          }
          .new-bet-dropdown-btn:hover { border-color: #D1D5DB; }
          .new-bet-dropdown-btn.expanded {
            border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none;
          }
          .new-bet-dropdown-btn.has-value { color: #111827; font-weight: 600; }
          .new-bet-dropdown-btn.no-value { color: #0C71B9; font-weight: 600; }

          .expandable-panel {
            border: 1px solid #E5E7EB; border-top: none;
            border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
            padding: 16px; background: #FAFAFA;
          }

          .add-new-btn {
            width: 100%; padding: 12px; border: 1px dashed #D1D5DB; border-radius: 8px;
            background: #FFFFFF; color: #0C71B9; font-size: 14px; font-weight: 600;
            display: flex; justify-content: space-between; align-items: center; cursor: pointer;
            transition: all 0.2s;
          }
          .add-new-btn:hover { border-color: #9CA3AF; }
          .add-new-btn.active { border: 1px solid #3B82F6; border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0; color: #0C71B9; }

          .cadence-item {
            display: flex; align-items: center; gap: 12px; padding: 12px 16px;
            border: 1px solid #E5E7EB; border-radius: 8px; background: #FFFFFF; margin-bottom: 8px;
          }
          .cadence-checkbox {
            width: 18px; height: 18px; border-radius: 4px; border: 1px solid #D1D5DB;
            cursor: pointer;
          }

          .new-form-box {
            border: 1px solid #3B82F6; border-top: none; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;
            padding: 16px; background: #FFFFFF;
          }
        `}
      </style>
      <div className="new-bet-modal-content">
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>{t("New bet")}</h2>
          <button onClick={onHide} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '0 24px 24px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            {t("Capture the bet now — set its owner and cadence here or later. You'll fill in the strategic core from the bet's page.")}
          </p>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>{t("The bet")}</label>
              <span style={{ color: '#EF4444', fontSize: '14px', fontWeight: '700' }}>*</span>
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '8px' }}>
              {t("A clear statement of what you're betting on.")}
            </div>
            <textarea
              className={`new-bet-textarea ${projectName.length === 0 ? 'active-focus' : ''}`}
              placeholder={t("e.g. Concentrate on the mid-market segment")}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={3}
            />
          </div>

          {/* DECIDER SECTION */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {t("Decider")} <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: '400' }}>({t("optional")})</span>
              </label>
            </div>
            <div className={`new-bet-dropdown-btn ${isDeciderExpanded ? 'expanded' : ''} ${selectedOwnerId ? 'has-value' : 'no-value'}`} onClick={() => setIsDeciderExpanded(!isDeciderExpanded)}>
              <span style={{ fontSize: '14px' }}>
                {selectedOwnerId ? eligibleOwners.find(o => o._id === selectedOwnerId)?.name || "Selected" : t("Assign decider")}
              </span>
              {isDeciderExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
            </div>
            
            {isDeciderExpanded && (
              <div className="expandable-panel">
                <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
                  {t("The accountable for this bet. RAPID's D — a single person who owns the call.")}
                </p>
                <select 
                  className="new-bet-select" 
                  value={selectedOwnerId} 
                  onChange={(e) => { setSelectedOwnerId(e.target.value); setIsDeciderExpanded(false); }}
                  style={{ marginBottom: '16px', fontWeight: '600', color: '#111827' }}
                >
                  <option value="">{t("Choose a collaborator")}</option>
                  {eligibleOwners.map(owner => (
                    <option key={owner._id} value={owner._id}>{owner.name || owner.email}</option>
                  ))}
                </select>

                <button 
                  className={`add-new-btn ${isCollaboratorFormExpanded ? 'active' : ''}`} 
                  onClick={() => setIsCollaboratorFormExpanded(!isCollaboratorFormExpanded)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{isCollaboratorFormExpanded ? '×' : '+'}</span> {t("Add new collaborator")}
                  </div>
                  {isCollaboratorFormExpanded ? <ChevronUp size={16} color="#0C71B9" /> : <ChevronDown size={16} color="#0C71B9" />}
                </button>

                {isCollaboratorFormExpanded && (
                  <div className="new-form-box">
                    <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px', display: 'block' }}>Name</label>
                    <input 
                      className="new-bet-input" 
                      placeholder="e.g. Marcus Lee" 
                      value={newCollaboratorName} 
                      onChange={e => setNewCollaboratorName(e.target.value)} 
                      style={{ marginBottom: '16px' }}
                    />
                    <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px', display: 'block' }}>Email</label>
                    <input 
                      className="new-bet-input" 
                      placeholder="e.g. marcus@company.com" 
                      value={newCollaboratorEmail} 
                      onChange={e => setNewCollaboratorEmail(e.target.value)} 
                      style={{ marginBottom: '16px' }}
                    />
                    <button 
                      style={{
                        width: '100%', padding: '10px', border: 'none', borderRadius: '8px',
                        background: newCollaboratorName.trim() && newCollaboratorEmail.trim() ? '#2563EB' : '#E5E7EB',
                        color: newCollaboratorName.trim() && newCollaboratorEmail.trim() ? '#FFFFFF' : '#9CA3AF',
                        fontWeight: '600', fontSize: '14px', cursor: newCollaboratorName.trim() && newCollaboratorEmail.trim() ? 'pointer' : 'not-allowed'
                      }}
                      onClick={handleInviteCollaborator}
                      disabled={isInvitingCollaborator || !newCollaboratorName.trim() || !newCollaboratorEmail.trim()}
                    >
                      {isInvitingCollaborator ? <Spinner size="sm" /> : "Create & assign"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CADENCE SECTION */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {t("Cadence")} <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: '400' }}>({t("optional")})</span>
              </label>
            </div>
            <div className={`new-bet-dropdown-btn ${isCadenceExpanded ? 'expanded' : ''} ${selectedCadenceIds.length > 0 ? 'has-value' : 'no-value'}`} onClick={() => setIsCadenceExpanded(!isCadenceExpanded)}>
              <span style={{ fontSize: '14px' }}>
                {selectedCadenceIds.length > 0 ? t("Set cadence") : t("Set cadence")}
              </span>
              {isCadenceExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
            </div>

            {isCadenceExpanded && (
              <div className="expandable-panel">
                <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
                  {t("A bet usually lives in more than one cadence. Pick every cadence where this bet should be reviewed.")}
                </p>
                
                {availableCadences.map(cadence => (
                  <div className="cadence-item" key={cadence._id}>
                    <input 
                      type="checkbox" 
                      className="cadence-checkbox" 
                      checked={selectedCadenceIds.includes(cadence._id)} 
                      onChange={() => handleToggleCadence(cadence._id)}
                    />
                    <span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{cadence.name}</span>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{cadence.frequency}</span>
                  </div>
                ))}

                <button 
                  className={`add-new-btn ${isNewCadenceFormExpanded ? 'active' : ''}`} 
                  style={{ marginTop: '16px' }}
                  onClick={() => setIsNewCadenceFormExpanded(!isNewCadenceFormExpanded)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{isNewCadenceFormExpanded ? '×' : '+'}</span> {t("Other — create a new cadence")}
                  </div>
                </button>

                {isNewCadenceFormExpanded && (
                  <div className="new-form-box">
                    <div style={{ color: '#0C71B9', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
                      NEW CADENCE
                    </div>
                    <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px', display: 'block' }}>Name</label>
                    <input 
                      className="new-bet-input" 
                      placeholder="e.g. Product Committee" 
                      value={newCadenceName} 
                      onChange={e => setNewCadenceName(e.target.value)} 
                      style={{ marginBottom: '16px' }}
                    />
                    <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px', display: 'block' }}>Frequency</label>
                    <select 
                      className="new-bet-select" 
                      value={newCadenceFrequency} 
                      onChange={e => setNewCadenceFrequency(e.target.value)}
                      style={{ marginBottom: '16px' }}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                    
                    <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '16px' }}>
                      Audience can be set later from Manage.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button 
                        onClick={() => setIsNewCadenceFormExpanded(false)}
                        style={{ background: 'none', border: 'none', color: '#475569', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreateCadence}
                        disabled={isCreatingCadence || !newCadenceName.trim()}
                        style={{ 
                          padding: '8px 16px', border: 'none', borderRadius: '8px',
                          background: newCadenceName.trim() ? '#2563EB' : '#E5E7EB',
                          color: newCadenceName.trim() ? '#FFFFFF' : '#9CA3AF', fontWeight: '600', fontSize: '14px',
                          cursor: newCadenceName.trim() && !isCreatingCadence ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {isCreatingCadence ? <Spinner size="sm" /> : "Create & select"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fff' }}>
          <button 
            onClick={onHide} 
            disabled={isSubmitting}
            style={{ 
              padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#FFFFFF', 
              color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
            }}
          >
            {t("Cancel")}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !projectName.trim()}
            style={{ 
              padding: '8px 16px', border: 'none', borderRadius: '8px', 
              background: projectName.trim() ? '#2563EB' : '#C7D2FE', color: '#FFFFFF', 
              fontWeight: '600', fontSize: '14px', cursor: projectName.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px'
            }}
          >
            {isSubmitting ? <Spinner size="sm" /> : t("Create bet")}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NewBetModal;
