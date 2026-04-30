import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Row, Col, Form, Modal, Button as RBButton } from "react-bootstrap";
import {
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Folder,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { decisionLogApiService } from "../services/decisionLogApiService";
import { getDecisionLogActorName } from "../utils/decisionLogUtils";
import { useProjectStore } from "../store/projectStore";
import { useUIStore } from "../store/uiStore";
import "../styles/AdminTableStyles.css";





const ITEMS_PER_PAGE = 10;

function formatDate(dateVal) {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleString();
  } catch {
    return "-";
  }
}

function formatDateOnly(dateVal) {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleDateString();
  } catch {
    return "-";
  }
}

function formatTimeOnly(dateVal) {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleTimeString();
  } catch {
    return "-";
  }
}

function humanizeLogType(logType) {
  if (!logType) return "-";
  return logType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function LogTypeBadge({ logType }) {
  const { theme } = useUIStore();

  const colorMap = {
    status_change: { bg: "#dbeafe", color: "#1e40af" },
    cadence_review: { bg: "#d1fae5", color: "#065f46" },
    no_change_review: { bg: "#f3f4f6", color: "#374151" },
    adhoc_update: { bg: "#fef3c7", color: "#92400e" },
    manual: { bg: "#ede9fe", color: "#5b21b6" },
    project_update: { bg: "#fee2e2", color: "#991b1b" },
  };
  const style = colorMap[logType] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      className="admin-status-badge"
      style={{
        backgroundColor: style.bg,
        color: style.color,
        fontSize: "11px",
      }}
    >
      {humanizeLogType(logType)}
    </span>
  );
}

function renderSnapshotField(key, value) {
  if (value === null || value === undefined) return null;

  // Format the key from camelCase to Title Case
  const formattedKey = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Format the value based on type
  let formattedValue = value;
  if (typeof value === 'boolean') {
    formattedValue = value ? 'Yes' : 'No';
  } else if (typeof value === 'object') {
    formattedValue = JSON.stringify(value);
  } else if (value === '') {
    formattedValue = '(empty)';
  }

  return { key: formattedKey, value: formattedValue };
}

const BusinessDecisionLogs = ({ businessId }) => {
  const { theme } = useUIStore();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract primitive string values to avoid reference change loops
  const projectIdParam = searchParams.get("project_id") || "";
  const logTypeParam = searchParams.get("log_type") || "";
  const stateParam = searchParams.get("state") || "";
  const dateParam = searchParams.get("date") || "";
  const sortOrderParam = searchParams.get("sort_order") || "desc";
  const pageParam = searchParams.get("page") || "1";

  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedJustificationLog, setSelectedJustificationLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState(null);
  const [availableLogTypes, setAvailableLogTypes] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);

  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const projectsFromStore = useProjectStore((state) => state.projects);

  const filters = useMemo(() => ({
    project_id: projectIdParam,
    log_type: logTypeParam,
    state: stateParam,
    date: dateParam,
    sort_order: sortOrderParam,
  }), [projectIdParam, logTypeParam, stateParam, dateParam, sortOrderParam]);

  const page = parseInt(pageParam, 10);

  useEffect(() => {
    if (businessId) {
      fetchProjects(businessId, { silent: true });
    }
  }, [businessId, fetchProjects]);

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        // Reset to page 1 when any filter changes
        if (key !== "page") next.set("page", "1");
        return next;
      });
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (p) => setFilter("page", String(p)),
    [setFilter]
  );

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const fetchBusinessLogs = useCallback(async () => {
    if (!businessId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const apiParams = {
        page,
        limit: ITEMS_PER_PAGE,
        sort_order: filters.sort_order
      };

      // Only add filters if they have values
      if (filters.project_id) {
        apiParams.project_id = filters.project_id;
      }
      if (filters.log_type) {
        apiParams.log_type = filters.log_type;
      }
      if (filters.state) {
        // Send status value as-is (extracted from actual logs data)
        apiParams.execution_state = filters.state;
      }

      // Convert date string to ISO datetime range for the entire day
      if (filters.date) {
        const dateObj = new Date(filters.date);
        // Set start of day (00:00:00)
        const fromDate = new Date(dateObj);
        fromDate.setHours(0, 0, 0, 0);
        // Set end of day (23:59:59)
        const toDate = new Date(dateObj);
        toDate.setHours(23, 59, 59, 999);

        apiParams.from = fromDate.toISOString();
        apiParams.to = toDate.toISOString();
      }

      console.log('Fetching logs with params:', apiParams);
      const response = await decisionLogApiService.getBusinessLogs(businessId, apiParams);
      setData(response);
    } catch (error) {
      console.error('Error fetching business decision logs:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, page, filters]);

  const fetchFilterOptions = useCallback(async () => {
    if (!businessId) return;
    try {
      const response = await decisionLogApiService.getBusinessFilterOptions(businessId);

      // Helper to normalize and deduplicate
      const getUniqueOptions = (items) => {
        const unique = new Map();
        items.forEach(item => {
          if (!item) return;
          const normalized = String(item).trim();
          const key = normalized.toLowerCase();
          if (!unique.has(key)) {
            unique.set(key, {
              value: normalized,
              label: normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            });
          }
        });
        return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
      };

      setAvailableLogTypes(getUniqueOptions(response.log_types || []));
      setAvailableStatuses(getUniqueOptions(response.execution_states || []));
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [businessId]);

  useEffect(() => {
    fetchBusinessLogs();
  }, [fetchBusinessLogs]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fix ESLint warning by memoizing the logs array so it doesn't change reference when empty
  const logs = useMemo(() => data?.logs || [], [data?.logs]);
  const total = data?.total || 0;
  const totalPages = data?.total_pages || Math.ceil(total / ITEMS_PER_PAGE) || 1;

  const hasActiveFilters =
    filters.project_id ||
    filters.log_type ||
    filters.state ||
    filters.date;

  // Get unique projects for filtering
  const availableProjects = useMemo(() => {
    const projects = new Map();
    // Add all active projects from the store
    if (projectsFromStore && projectsFromStore.length > 0) {
      projectsFromStore.forEach(p => {
        if (p._id || p.id) {
          projects.set(p._id || p.id, p.project_name || p.name);
        }
      });
    }
    // Add projects from logs (this ensures deleted projects with logs are still selectable)
    logs.forEach(log => {
      if (log.project_id && log.project_name) {
        if (!projects.has(log.project_id)) {
          projects.set(log.project_id, log.project_name);
        }
      }
    });
    return Array.from(projects.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [logs, projectsFromStore]);

  const refetch = useCallback(() => {
    fetchBusinessLogs();
  }, [fetchBusinessLogs]);

  return (
    <div className="business-decision-logs-page" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary, #f8fafc)" }}>
      <div className="business-decision-logs-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} color="#4f46e5" />
            <h1 className="page-title-color" style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111827" }}>
              {t("Business_Decision_Logs")}
            </h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="business-decision-logs-filters"
          style={{
            background: "#fff",
            border: "1px solid #e8eaf0",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Filter size={15} color="#6b7280" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              {t("Filters")}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "#ef4444",
                }}
              >
                <X size={13} /> {t("clear_all")}
              </button>
            )}
          </div>

          <Row className="g-2">
            <Col xs={12} sm={6} md={2}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                {!filters.project_id && <Folder size={12} style={{ marginRight: "4px" }} />}
                {t("Project")}
              </Form.Label>
              <Form.Select
                className="role-select"
                size="sm"
                value={filters.project_id}
                onChange={(e) => setFilter("project_id", e.target.value)}
              >
                <option value="">{t("All_Projects")}</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                {!filters.date && <Calendar size={12} style={{ marginRight: "4px" }} />}
                {t("Date")}
              </Form.Label>
              <Form.Control
                className="role-select"
                type="date"
                size="sm"
                value={filters.date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFilter("date", e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                {t("Log_Type")}
              </Form.Label>
              <Form.Select
                className="role-select"
                size="sm"
                value={filters.log_type}
                onChange={(e) => setFilter("log_type", e.target.value)}
              >
                <option value="">{t("All_Types")}</option>
                {availableLogTypes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                {t("status")}
              </Form.Label>
              <Form.Select
                className="role-select"
                size="sm"
                value={filters.state}
                onChange={(e) => setFilter("state", e.target.value)}
              >
                <option value="">{t("All_States")}</option>
                {availableStatuses.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                {t("Sort")}
              </Form.Label>
              <Form.Select
                className="role-select"
                size="sm"
                value={filters.sort_order}
                onChange={(e) => setFilter("sort_order", e.target.value)}
              >
                <option value="desc">{t("Newest_First")}</option>
                <option value="asc">{t("Oldest_First")}</option>
              </Form.Select>
            </Col>
          </Row>
        </div>

        {/* Table Wrapper */}
        <div className="admin-table-wrapper">
          {/* Table header bar */}
          <div className="admin-table-header">
            <div className="admin-table-title-group">
              <h2 className="admin-table-title">
                {t("Business_Decision_Logs")}
              </h2>
              <span className="admin-table-count-badge">
                {total} {t("entries")}
              </span>
            </div>
            <div className="admin-table-actions">
              <button
                className="admin-table-btn"
                onClick={refetch}
              >
                <RefreshCw size={13} />
                {t("refresh")}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="admin-table-loading">
              <div className="admin-spinner" />
              <span>{t("loading")}</span>
            </div>
          ) : isError ? (
            <div className="admin-table-empty">
              <p style={{ color: "#ef4444" }}>{t("Failed_to_load_decision_logs")}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="admin-table-empty">
              <FileText size={40} strokeWidth={1.5} />
              <h3>
                {hasActiveFilters
                  ? t("No_logs_match_filters")
                  : t("No_decision_logs_available")}
              </h3>
            </div>
          ) : (
            <div className="table-responsive admin-table-scroll">
              <table className="table admin-data-table">
                <thead className="table-head-color">
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Project")}</th>
                    <th>{t("Log_Type")}</th>
                    <th>{t("status")}</th>
                    <th>{t("Owner")}</th>
                    <th>{t("Justification")}</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={String(log._id)}>
                      <td data-label={t("Date")}>
                        <div className="td-inner">
                          <span title={formatTimeOnly(log.created_at || log.changed_at)}>
                            {formatDateOnly(log.created_at || log.changed_at)}
                          </span>
                        </div>
                      </td>
                      <td data-label={t("Project")}>
                        <div className="td-inner business-decision-logs-project">
                          <span title={log.project_name || String(log.project_id)}>
                            {log.project_name || <span style={{ color: "#9ca3af" }}>{String(log.project_id).slice(-6)}</span>}
                          </span>
                        </div>
                      </td>
                      <td data-label={t("Log_Type")}>
                        <div className="td-inner">
                          <LogTypeBadge logType={log.log_type} />
                        </div>
                      </td>
                      <td data-label={t("status")}>
                        <div className="td-inner">
                          {log.execution_state || log.to_status || "-"}
                        </div>
                      </td>
                      <td data-label={t("Actor")}>
                        <div
                          className="td-inner"
                          title={getDecisionLogActorName(log)}
                        >
                          {getDecisionLogActorName(log)}
                        </div>
                      </td>
                      <td data-label={t("Justification")}>
                        <div className="td-inner">
                          {log.justification ? (
                            <button
                              className="admin-table-btn"
                              style={{ padding: "4px 8px", fontSize: "11px", height: "auto", display: "inline-flex" }}
                              onClick={() => setSelectedJustificationLog(log)}
                            >
                              <FileText size={12} style={{ marginRight: "4px" }} />
                              {t("View_Justification") || "View Justification"}
                            </button>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td data-label={t("view")}>
                        <div className="td-inner">
                          <button
                            className="admin-primary-btn"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => setSelectedLog(log)}
                          >
                            {t("view")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                {t("showing")} {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, total)} {t("of")} {total}
              </span>
              <div className="admin-pagination-controls">
                <button
                  className="admin-page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span className="admin-page-number active">
                    {page} / {totalPages}
                  </span>
                </div>
                <button
                  className="admin-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal show={!!selectedLog} onHide={() => setSelectedLog(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px", fontWeight: 700 }}>
            {t("Decision_Log_Details")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: "14px" }}>
          {selectedLog && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Before Snapshot */}
              {selectedLog.before_snapshot && Object.keys(selectedLog.before_snapshot).length > 0 && (
                <div>
                  <h5 style={{ marginBottom: "12px", fontWeight: 600, color: "#1f2937" }}>
                    Before
                  </h5>
                  <div style={{ padding: "12px", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", fontFamily: "monospace", fontSize: "13px", color: "#991b1b", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {Object.entries(selectedLog.before_snapshot)
                      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
                      .join('\n')}
                  </div>
                </div>
              )}

              {/* After Snapshot */}
              {selectedLog.after_snapshot && Object.keys(selectedLog.after_snapshot).length > 0 && (
                <div>
                  <h5 style={{ marginBottom: "12px", fontWeight: 600, color: "#1f2937" }}>
                    After
                  </h5>
                  <div style={{ padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", fontFamily: "monospace", fontSize: "13px", color: "#166534", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {Object.entries(selectedLog.after_snapshot)
                      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
                      .join('\n')}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!selectedLog.before_snapshot || Object.keys(selectedLog.before_snapshot).length === 0) &&
                (!selectedLog.after_snapshot || Object.keys(selectedLog.after_snapshot).length === 0) && (
                  <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
                    <p>No changes recorded</p>
                  </div>
                )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <RBButton
            className="admin-secondary-btn"
            style={{ color: "#374151 !important" }}
            onClick={() => setSelectedLog(null)}
          >
            {t("close")}
          </RBButton>
        </Modal.Footer>
      </Modal>

      {/* Justification Modal */}
      <Modal show={!!selectedJustificationLog} onHide={() => setSelectedJustificationLog(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px", fontWeight: 700 }}>
            {t("Justification") || "Justification"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: "14px" }}>
          {selectedJustificationLog && (
            <p
              style={{
                marginTop: "0",
                padding: "16px",
                background: "#f8f9fc",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                color: "#1f2937",
                lineHeight: "1.6",
                fontSize: "14px",
                whiteSpace: "pre-wrap"
              }}
            >
              {selectedJustificationLog.justification || "-"}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <RBButton
            className="admin-secondary-btn"
            style={{ color: "#374151 !important" }}
            onClick={() => setSelectedJustificationLog(null)}
          >
            {t("close") || "Close"}
          </RBButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BusinessDecisionLogs;
