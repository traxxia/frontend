import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, MessageSquare, Save, Clock } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/ProjectReviewModal.css";

const ProjectReviewModal = ({
    isOpen,
    onClose,
    project,
    type = "review", // "review" or "adhoc"
    onSubmit
}) => {
    const { t } = useTranslation();
    const [justification, setJustification] = useState("");
    const [status, setStatus] = useState("");
    const [learningState, setLearningState] = useState("");
    const [noChanges, setNoChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project) {
            setStatus(project.status || "Active");
            setLearningState(project.learning_state || "Testing");
            setJustification("");
            setNoChanges(false);
        }
    }, [project, isOpen]);

    if (!isOpen || !project) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!justification.trim()) {
            alert(t("Justification_is_required"));
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                status,
                learning_state: learningState,
                justification,
                no_changes: type === "review" ? noChanges : false
            });
            onClose();
        } catch (err) {
            console.error("Submit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusOptions = ["Active", "At Risk", "Paused", "Killed", "Scaled"];
    const learningOptions = ["Testing", "Validated", "Invalidated"];

    return (
        <div className="review-modal-overlay">
            <div className="review-modal-content">
                <div className="review-modal-header">
                    <h2>
                        {type === "review" ? t("Perform_Review") : t("Ad_Hoc_Update")}
                        <span className="project-name-hint">: {project.project_name}</span>
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="review-modal-body">
                    <div className="review-info-section">
                        <div className="info-card">
                            <Info size={16} color="#4b5563" />
                            <div>
                                <div className="info-label">{t("Review_Cadence")}</div>
                                <div className="info-value">{t(project.review_cadence || "Monthly")}</div>
                            </div>
                        </div>
                        <div className="info-card">
                            <Clock size={16} color="#d97706" />
                            <div>
                                <div className="info-label">{t("Last_Reviewed")}</div>
                                <div className="info-value">{project.last_reviewed ? new Date(project.last_reviewed).toLocaleDateString() : t("Never")}</div>
                            </div>
                        </div>
                        <div className="info-card">
                            <AlertTriangle size={16} color={project.is_stale ? "#ef4444" : "#059669"} />
                            <div>
                                <div className="info-label">{t("Next_Review_Date")}</div>
                                <div className="info-value" style={{ color: project.is_stale ? "#ef4444" : "inherit", fontWeight: project.is_stale ? "700" : "600" }}>
                                    {project.next_review_date ? new Date(project.next_review_date).toLocaleDateString() : t("Not_Available")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {type === "review" && (
                        <div className="form-group checkbox-group">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={noChanges}
                                    onChange={(e) => setNoChanges(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                {t("Confirm_No_Changes")}
                            </label>
                        </div>
                    )}

                    <div className={`form-section ${noChanges ? 'disabled' : ''}`}>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>{t("Status")}</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    disabled={noChanges}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt} value={opt}>{t(opt)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t("Learning_State")}</label>
                                <select
                                    value={learningState}
                                    onChange={(e) => setLearningState(e.target.value)}
                                    disabled={noChanges}
                                >
                                    {learningOptions.map(opt => (
                                        <option key={opt} value={opt}>{t(opt)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <MessageSquare size={14} style={{ marginRight: '6px' }} />
                            {t("Justification")} *
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder={t("Justification_placeholder") || "Why is this change/review being made?"}
                            required
                            rows={4}
                        />
                    </div>

                    <div className="review-modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t("Cancel")}</button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? t("Saving...") : (
                                <>
                                    <Save size={16} />
                                    {t("Submit_Review")}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectReviewModal;
