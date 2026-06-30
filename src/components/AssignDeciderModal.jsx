import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../store";
import { useUIStore } from "../store/uiStore";

const AssignDeciderModal = ({ show, onHide, project, onSave, businessId }) => {
  const addToast = useUIStore(state => state.addToast);
  const { t } = useTranslation();
  const { userId } = useAuthStore();

  const [eligibleOwners, setEligibleOwners] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollaboratorFormOpen, setIsCollaboratorFormOpen] = useState(false);
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef(null);

  const handleInviteCollaborator = async () => {
    if (!businessId || !newCollaboratorEmail) return;
    setIsInviting(true);
    try {
      const token = useAuthStore.getState().token;
      const url = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${businessId}/invite-collaborator`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCollaboratorName,
          email: newCollaboratorEmail
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.user) {
          setEligibleOwners(prev => [...prev, data.user]);
          setSelectedOwnerId(data.user._id);
        }
        setIsCollaboratorFormOpen(false);
        setNewCollaboratorName("");
        setNewCollaboratorEmail("");
        addToast({ message: t("Invitation sent successfully. Once they accept the invitation, they will be able to participate in this collaboration."), type: "success" });
      } else {
        alert(data.error || "Failed to invite collaborator");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending the invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  /* ── Fetch eligible owners ───────────────────────────────────── */
  useEffect(() => {
    if (show && businessId) { 
      setLoadingOwners(true);
      const fetchOwners = async () => {
        try {
          const token = useAuthStore.getState().token;
          const url = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/businesses/${businessId}/eligible-owners`;
  
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
         
          setEligibleOwners(data.eligible_owners || []);
        } catch (err) {
          console.error("[AssignDecider] Failed to fetch eligible owners:", err);
          setEligibleOwners([]);
        } finally {
          setLoadingOwners(false);
        }
      };
      fetchOwners();
    } else if (show && !businessId) {
      console.warn("[AssignDecider] Modal opened but businessId is:", businessId, "(empty/undefined — owners cannot be fetched)");
      setEligibleOwners([]);
    }
  }, [show, businessId]);

  /* ── Reset on open ───────────────────────────────────────────── */
  useEffect(() => {
    if (show) {
      const ownerId = project?.accountable_owner_id || ""; 
      setSelectedOwnerId(ownerId);
      setIsDropdownOpen(false);
      setIsCollaboratorFormOpen(false);
      setNewCollaboratorName("");
      setNewCollaboratorEmail("");
    }
  }, [show, project?._id, project?.accountable_owner_id]);

  /* ── Helpers ─────────────────────────────────────────────────── */
  const getRoleLabel = (owner) => {
    if (owner.is_company_admin || owner.role === "company_admin") return "CEO";
    if (owner.role === "org_admin")    return "Admin";
    if (owner.role === "collaborator") return "Collaborator";
    if (owner.role === "user")         return "Member";
    if (owner.role) return owner.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return "";
  };

  const getOwnerSubtitle = (owner) => {
    // Compare as strings to handle MongoDB ObjectId vs string mismatch
    const isMe = String(owner._id) === String(userId);
    const roleLabel = getRoleLabel(owner);
    if (isMe && roleLabel) return `You (${roleLabel})`;
    if (isMe) return "You";
    return owner.email || roleLabel || "";
  };

  const selectedOwner = eligibleOwners.find((o) => String(o._id) === String(selectedOwnerId));
  const canCreateAndSelect = newCollaboratorName.trim() && newCollaboratorEmail.trim();

  const handleSelectOwner = (id) => { 
    setSelectedOwnerId(id);
    setIsDropdownOpen(false);
  };

  const handleSave = async () => {
    const owner = eligibleOwners.find((o) => String(o._id) === String(selectedOwnerId)); 
    if (owner) {
      setIsSaving(true);
      try {
        await onSave(project, owner._id, owner.name);
      } finally {
        setIsSaving(false);
      }
    } else {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered dialogClassName="modal-md">
      <style>{`
        /* ── Trigger button ─────────────────────────── */
        .ad-trigger {
          width: 100%;
          padding: 5px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.15s;
          outline: none;
          text-align: left;
        }
        .ad-trigger:hover { border-color: #94a3b8; }
        .ad-trigger.open {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-color: #e2e8f0;
        }
        .ad-trigger-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
        }
        .ad-trigger-sub {
          font-size: 12px;
          color: #6b7280;
          margin-top: 1px;
        }
        .ad-trigger-placeholder {
          font-size: 14px;
          color: #9ca3af;
        }

        /* ── Dropdown panel ─────────────────────────── */
        .ad-dropdown-panel {
          border: 1px solid #e2e8f0;
          border-top: none;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          background: #fff;
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .ad-owner-row {
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f3f4f6;
        }
        .ad-owner-row:last-child { border-bottom: none; }
        .ad-owner-row:hover { background: #f8fafc; }
        .ad-owner-row.selected { background: #eff6ff; }
        .ad-owner-row-name {
          font-size: 14px;
          font-weight: 700;
          color: #0c71b9;
          line-height: 1.3;
        }
        .ad-owner-row.selected .ad-owner-row-name { color: #0c71b9; }
        .ad-owner-row:not(.selected) .ad-owner-row-name { color: #111827; }
        .ad-owner-row-sub {
          font-size: 12px;
          color: #6b7280;
          margin-top: 1px;
        }

        /* ── Add collaborator ────────────────────────── */
        .ad-collab-wrap {
          /* container */
        }
        .ad-collab-header {
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          color: #0c71b9;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          outline: none;
          border-radius: 8px;
          border: 1px dashed #d1d5db; /* always has dashed border */
          background: #fff;
        }
        .ad-collab-header:hover { border-color: #94a3b8; }
        .ad-collab-header.open {
          /* no special border changes when open, keeps its full dashed border */
        }

        /* ── Collaborator form ───────────────────── */
        .ad-collab-form {
          padding: 16px;
          background: #f0f4ff;
          margin-top: 8px; /* The gap the user requested */
          border-radius: 8px;
        }
        .ad-collab-form label {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          display: block;
          margin-bottom: 6px;
        }
        .ad-collab-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #111827;
          outline: none;
          background: #fff;
          transition: border-color 0.15s;
          margin-bottom: 14px;
          box-sizing: border-box;
        }
        .ad-collab-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f620; }
        .ad-collab-input::placeholder { color: #9ca3af; }

        /* ── Create & select button ─────────────────── */
        .ad-create-btn {
          width: 100%;
          padding: 11px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.15s, color 0.15s;
        }
        .ad-create-btn.enabled {
          background: #6366f1;
          color: #fff;
          cursor: pointer;
        }
        .ad-create-btn.disabled {
          background: #c7d2fe;
          color: #e0e7ff;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Modal.Header className="border-0 pb-0">
        <div>
          <Modal.Title className="fw-bold fs-5">{t("Assign decider")}</Modal.Title>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: "13px", lineHeight: "1.5" }}>
            {t("The accountable for this bet. RAPID's D — a single person who owns the call.")}
          </p>
        </div>
        <button
          className="btn-close shadow-none"
          onClick={onHide}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem" }}
        />
      </Modal.Header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <Modal.Body className="pt-4 pb-2" ref={dropdownRef}>

        {/* Trigger: shows selected owner or placeholder */}
        <button
          className={`ad-trigger${isDropdownOpen ? " open" : ""}`}
          onClick={() => {
            setIsDropdownOpen((v) => !v);
            if (isCollaboratorFormOpen) setIsCollaboratorFormOpen(false);
          }}
        >
          <div>
            {selectedOwner ? (
              <>
                <div className="ad-trigger-name">{selectedOwner.name || selectedOwner.email}</div>
                <div className="ad-trigger-sub">{getOwnerSubtitle(selectedOwner)}</div>
              </>
            ) : (
              <span className="ad-trigger-placeholder">{t("Choose a collaborator...")}</span>
            )}
          </div>
          {isDropdownOpen
            ? <ChevronUp size={16} color="#6b7280" />
            : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {/* Dropdown owner list */}
        {isDropdownOpen && (
          <div className="ad-dropdown-panel">
            {loadingOwners ? (
              <div style={{ padding: "16px", color: "#9ca3af", fontSize: "14px", textAlign: "center" }}>
                {t("Loading...")}
              </div>
            ) : eligibleOwners.length === 0 ? (
              <div style={{ padding: "16px", color: "#9ca3af", fontSize: "14px", textAlign: "center" }}>
                {t("No collaborators found.")}
              </div>
            ) : (
              eligibleOwners.map((owner) => {
                const isSelected = String(selectedOwnerId) === String(owner._id);
                const subtitle = getOwnerSubtitle(owner);
                return (
                  <div
                    key={owner._id}
                    className={`ad-owner-row${isSelected ? " selected" : ""}`}
                    onClick={() => handleSelectOwner(owner._id)}
                  >
                    <div className="ad-owner-row-name">{owner.name || owner.email}</div>
                    {subtitle && <div className="ad-owner-row-sub">{subtitle}</div>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Add new collaborator */}
        <div style={{ marginTop: "12px" }}>
          <div className="ad-collab-wrap">
            <button
              className={`ad-collab-header${isCollaboratorFormOpen ? " open" : ""}`}
              onClick={() => {
                setIsCollaboratorFormOpen((v) => !v);
                if (isDropdownOpen) setIsDropdownOpen(false);
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={15} />
                {t("Add new collaborator")}
              </span>
              <ChevronUp
                size={16}
                color="#0c71b9"
                style={{
                  transform: isCollaboratorFormOpen ? "rotate(0deg)" : "rotate(180deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {/* Form — separated with a gap */}
            {isCollaboratorFormOpen && (
              <div className="ad-collab-form">
                <label>{t("Name")}</label>
                <input
                  className="ad-collab-input"
                  type="text"
                  placeholder="e.g. Marcus Lee"
                  value={newCollaboratorName}
                  onChange={(e) => setNewCollaboratorName(e.target.value)}
                />
                <label>{t("Email")}</label>
                <input
                  className="ad-collab-input"
                  type="email"
                  placeholder="e.g. marcus@company.com"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                />
                <button
                  className={`ad-create-btn ${canCreateAndSelect && !isInviting ? "enabled" : "disabled"}`}
                  disabled={!canCreateAndSelect || isInviting}
                  onClick={handleInviteCollaborator}
                >
                  {isInviting ? t("Inviting...") : t("Create & select")}
                </button>
              </div>
            )}
          </div>
        </div>


      </Modal.Body>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <Modal.Footer className="border-0 px-4 pb-4 pt-3">
        <div className="d-flex justify-content-end w-100 gap-2">
          <Button
            variant="outline-secondary"
            className="border shadow-sm bg-white text-dark fw-bold px-4"
            onClick={onHide}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="primary"
            className="fw-bold px-4"
            disabled={!selectedOwner || isSaving}
            onClick={handleSave}
          >
            {isSaving ? t("Saving...") : t("Save")}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignDeciderModal;
