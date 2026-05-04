import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Row, Col, Form, Modal, Button as RBButton } from "react-bootstrap";
import {
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useAllDecisionLogsQuery } from "../hooks/useQueries";
import MenuBar from "./MenuBar";
import "../styles/AdminTableStyles.css";

const LOG_TYPES = [
  { value: "", label: "All Types" },
  { value: "status_change", label: "Status Change" },
  { value: "cadence_review", label: "Cadence Review" },
  { value: "no_change_review", label: "No Change Review" },
  { value: "adhoc_update", label: "Ad-Hoc Update" },
  { value: "manual", label: "Manual" },
  { value: "project_update", label: "Project Update" },
];

const EXECUTION_STATES = [
  { value: "", label: "All States" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "At Risk", label: "At Risk" },
  { value: "Paused", label: "Paused" },
  { value: "Killed", label: "Killed" },
  { value: "Completed", label: "Completed" },
  { value: "Scaled", label: "Scaled" },
];

const ITEMS_PER_PAGE = 20;

function formatDate(dateVal) {
  if (!dateVal) return "-";
  try {
    return new Date(dateVal).toLocaleString();
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

const AllDecisionLogs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filter state from URL search params so links are shareable
  const getParam = (key, fallback = "") => searchParams.get(key) || fallback;

  const [selectedLog, setSelectedLog] = useState(null);

  const projectIdParam = getParam("project_id");
  const logTypeParam = getParam("log_type");
  const stateParam = getParam("state");
  const dateParam = getParam("date");
  const sortOrderParam = getParam("sort_order", "desc");

  const filters = useMemo(() => ({
    project_id: projectIdParam,
    log_type: logTypeParam,
    state: stateParam,
    date: dateParam,
    sort_order: sortOrderParam,
  }), [projectIdParam, logTypeParam, stateParam, dateParam, sortOrderParam]);

  const page = parseInt(getParam("page", "1"), 10);

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 when any filter changes
      if (key !== "page") next.set("page", "1");
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const setPage = useCallback(
    (p) => setFilter("page", String(p)),
    [setFilter]
  );

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const apiFilters = useMemo(() => {
    const params = {
      project_id: filters.project_id,
      log_type: filters.log_type,
      execution_state: filters.state,
      sort_order: filters.sort_order
    };
    if (filters.date) {
      params.from = filters.date;
      params.to = filters.date;
    }
    return params;
  }, [filters]);

  const { data, isLoading, isError, refetch } = useAllDecisionLogsQuery(
    page,
    ITEMS_PER_PAGE,
    apiFilters
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || Math.ceil(total / ITEMS_PER_PAGE) || 1;

  const hasActiveFilters =
    filters.project_id ||
    filters.log_type ||
    filters.state ||
    filters.date;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary, #f8fafc)" }}>
      <MenuBar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="admin-page-btn"
            style={{ border: "none", background: "none", padding: 0 }}
          >
            <ArrowLeft size={16} />
            {t("dashboard")}
          </button>
          <span style={{ color: "#d1d5db" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} color="#4f46e5" />
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111827" }}>
              {t("Decision_Log")}
            </h1>
          </div>
        </div>

        {/* Filter Bar */}
        <div
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
            <Col xs={12} sm={6} md={3}>
              <Form.Label className="admin-metric-label" style={{ marginBottom: "4px", fontSize: "10px" }}>
                <Calendar size={12} style={{ marginRight: "4px" }} />
                {t("Date")}
              </Form.Label>
              <Form.Control
                className="role-select"
                type="date"
                size="sm"
                value={filters.date}
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
                {LOG_TYPES.map((o) => (
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
                {EXECUTION_STATES.map((o) => (
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
                {t("All_Decision_Logs")}
              </h2>
              <span className="admin-table-count-badge">
                {total} {t("entries")}
              </span>
            </div>
            <div className="admin-table-actions">
              <button
                className="admin-table-btn"
                onClick={() => refetch()}
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
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Project")}</th>
                    <th>{t("Log_Type")}</th>
                    <th>{t("Decision")}</th>
                    <th>{t("status")}</th>
                    <th>{t("Actor")}</th>
                    <th>{t("Justification")}</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={String(log._id)}>
                      <td>
                        <div className="td-inner">
                          {formatDate(log.created_at || log.changed_at)}
                        </div>
                      </td>
                      <td>
                        <div className="td-inner" style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span title={log.project_name || String(log.project_id)}>
                            {log.project_name || <span style={{ color: "#9ca3af" }}>{String(log.project_id).slice(-6)}</span>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="td-inner">
                          <LogTypeBadge logType={log.log_type} />
                        </div>
                      </td>
                      <td>
                        <div className="td-inner" style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span title={log.decision}>
                            {log.decision || `${log.from_status || "-"} → ${log.to_status || "-"}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="td-inner">
                          {log.execution_state || log.to_status || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="td-inner" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.actor_name || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="td-inner" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span title={log.justification}>{log.justification || "-"}</span>
                        </div>
                      </td>
                      <td>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="admin-toolbar-row">
                <div>
                  <span className="admin-metric-label">{t("Date")}:</span>
                  <div className="admin-cell-primary">{formatDate(selectedLog.created_at || selectedLog.changed_at)}</div>
                </div>
                <div>
                  <span className="admin-metric-label">{t("Project")}:</span>
                  <div className="admin-cell-primary">{selectedLog.project_name || String(selectedLog.project_id)}</div>
                </div>
              </div>
              
              <div className="admin-toolbar-row">
                <div>
                  <span className="admin-metric-label">{t("Log_Type")}:</span>
                  <div><LogTypeBadge logType={selectedLog.log_type} /></div>
                </div>
                <div>
                  <span className="admin-metric-label">{t("Execution_State")}:</span>
                  <div className="admin-cell-primary">{selectedLog.execution_state || selectedLog.to_status || "-"}</div>
                </div>
              </div>

              <div>
                <span className="admin-metric-label">{t("Decision")}:</span>
                <div className="admin-cell-primary" style={{ marginTop: "4px" }}>
                  {selectedLog.decision || `${selectedLog.from_status || "-"} → ${selectedLog.to_status || "-"}`}
                </div>
              </div>

              {selectedLog.assumption_state && (
                <div>
                  <span className="admin-metric-label">{t("Assumption_State")}:</span>
                  <div className="admin-cell-primary">{selectedLog.assumption_state}</div>
                </div>
              )}

              <div>
                <span className="admin-metric-label">{t("Actor")}:</span>
                <div className="admin-cell-primary">{selectedLog.actor_name || "-"}</div>
              </div>

              <div>
                <span className="admin-metric-label">{t("Justification")}:</span>
                <p
                  style={{
                    marginTop: "6px",
                    padding: "12px",
                    background: "#f8f9fc",
                    borderRadius: "10px",
                    border: "1px solid #f0f2f5",
                    color: "#374151",
                    lineHeight: "1.5",
                    fontSize: "13px",
                  }}
                >
                  {selectedLog.justification || "-"}
                </p>
              </div>

              {selectedLog.before_snapshot && Object.keys(selectedLog.before_snapshot).length > 0 && (
                <div>
                  <span className="admin-metric-label">{t("Before")}:</span>
                  <div 
                    style={{ 
                      fontSize: "11px", 
                      color: "#6b7280", 
                      background: "#f3f4f6", 
                      padding: "8px", 
                      borderRadius: "6px",
                      marginTop: "4px",
                      overflowX: "auto" 
                    }}
                  >
                    {JSON.stringify(selectedLog.before_snapshot, null, 2)}
                  </div>
                </div>
              )}

              {selectedLog.after_snapshot && Object.keys(selectedLog.after_snapshot).length > 0 && (
                <div>
                  <span className="admin-metric-label">{t("After")}:</span>
                  <div 
                    style={{ 
                      fontSize: "11px", 
                      color: "#6b7280", 
                      background: "#f3f4f6", 
                      padding: "8px", 
                      borderRadius: "6px",
                      marginTop: "4px",
                      overflowX: "auto" 
                    }}
                  >
                    {JSON.stringify(selectedLog.after_snapshot, null, 2)}
                  </div>
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
    </div>
  );
};

export default AllDecisionLogs;
