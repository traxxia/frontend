import React, { useState, useCallback } from "react";
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
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
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

  const filters = {
    project_id: getParam("project_id"),
    log_type: getParam("log_type"),
    execution_state: getParam("execution_state"),
    from: getParam("from"),
    to: getParam("to"),
    sort_order: getParam("sort_order", "desc"),
  };

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

  const { data, isLoading, isError, refetch } = useAllDecisionLogsQuery(
    page,
    ITEMS_PER_PAGE,
    filters
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || Math.ceil(total / ITEMS_PER_PAGE) || 1;

  const hasActiveFilters =
    filters.project_id ||
    filters.log_type ||
    filters.execution_state ||
    filters.from ||
    filters.to;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary, #f8fafc)" }}>
      <MenuBar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
            }}
          >
            <ArrowLeft size={16} />
            {t("dashboard") || "Dashboard"}
          </button>
          <span style={{ color: "#d1d5db" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} color="#4f46e5" />
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111827" }}>
              {t("Decision_Log") || "Decision Logs"}
            </h1>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "13px",
              color: "#6b7280",
              background: "#f3f4f6",
              borderRadius: "20px",
              padding: "2px 10px",
            }}
          >
            {total} {t("entries") || "entries"}
          </span>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Filter size={15} color="#6b7280" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              {t("Filters") || "Filters"}
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
                <X size={13} /> {t("Clear_All") || "Clear All"}
              </button>
            )}
          </div>

          <Row className="g-2">
            <Col xs={12} sm={6} md={3}>
              <Form.Label style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                <Calendar size={12} style={{ marginRight: "4px" }} />
                {t("From_Date") || "From Date"}
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={filters.from}
                onChange={(e) => setFilter("from", e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Label style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                <Calendar size={12} style={{ marginRight: "4px" }} />
                {t("To_Date") || "To Date"}
              </Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={filters.to}
                onChange={(e) => setFilter("to", e.target.value)}
              />
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                {t("Log_Type") || "Log Type"}
              </Form.Label>
              <Form.Select
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
              <Form.Label style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                {t("Status") || "Status"}
              </Form.Label>
              <Form.Select
                size="sm"
                value={filters.execution_state}
                onChange={(e) => setFilter("execution_state", e.target.value)}
              >
                {EXECUTION_STATES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Form.Label style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                {t("Sort") || "Sort"}
              </Form.Label>
              <Form.Select
                size="sm"
                value={filters.sort_order}
                onChange={(e) => setFilter("sort_order", e.target.value)}
              >
                <option value="desc">{t("Newest_First") || "Newest First"}</option>
                <option value="asc">{t("Oldest_First") || "Oldest First"}</option>
              </Form.Select>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Table header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
              {t("All_Decision_Logs") || "All Decision Logs"}
            </span>
            <button
              onClick={() => refetch()}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
              }}
            >
              <RefreshCw size={13} />
              {t("Refresh") || "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              {t("Loading") || "Loading"}...
            </div>
          ) : isError ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
              {t("Failed_to_load_decision_logs") || "Failed to load decision logs. Please try again."}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
              <FileText size={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ margin: 0 }}>
                {hasActiveFilters
                  ? t("No_logs_match_filters") || "No decision logs match the current filters."
                  : t("No_decision_logs_available") || "No decision logs available yet."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table mb-0" style={{ fontSize: "13px" }}>
                <thead style={{ background: "#f9fafb" }}>
                  <tr>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Date") || "Date"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Project") || "Project"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Log_Type") || "Log Type"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Decision") || "Decision"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Status") || "Status"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Actor") || "Actor"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Justification") || "Justification"}
                    </th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                      {t("Details") || ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={String(log._id)}
                      style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#6b7280" }}>
                        {formatDate(log.created_at || log.changed_at)}
                      </td>
                      <td style={{ padding: "10px 16px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span title={log.project_name || String(log.project_id)}>
                          {log.project_name || <span style={{ color: "#9ca3af" }}>{String(log.project_id).slice(-6)}</span>}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <LogTypeBadge logType={log.log_type} />
                      </td>
                      <td style={{ padding: "10px 16px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span title={log.decision}>
                          {log.decision || `${log.from_status || "-"} → ${log.to_status || "-"}`}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {log.execution_state || log.to_status || "-"}
                      </td>
                      <td style={{ padding: "10px 16px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.actor_name || "-"}
                      </td>
                      <td style={{ padding: "10px 16px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span title={log.justification}>{log.justification || "-"}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            background: "#4f46e5",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          {t("View") || "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                {t("Showing") || "Showing"} {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, total)} {t("of") || "of"} {total}
              </span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: page <= 1 ? "#f9fafb" : "#fff",
                    cursor: page <= 1 ? "default" : "pointer",
                    color: page <= 1 ? "#9ca3af" : "#374151",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: "13px", color: "#374151", minWidth: "60px", textAlign: "center" }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: page >= totalPages ? "#f9fafb" : "#fff",
                    cursor: page >= totalPages ? "default" : "pointer",
                    color: page >= totalPages ? "#9ca3af" : "#374151",
                    display: "flex",
                    alignItems: "center",
                  }}
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
          <Modal.Title style={{ fontSize: "16px" }}>
            {t("Decision_Log_Details") || "Decision Log Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: "14px" }}>
          {selectedLog && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <strong>{t("Date") || "Date"}:</strong>{" "}
                {formatDate(selectedLog.created_at || selectedLog.changed_at)}
              </div>
              <div>
                <strong>{t("Project") || "Project"}:</strong>{" "}
                {selectedLog.project_name || String(selectedLog.project_id)}
              </div>
              <div>
                <strong>{t("Log_Type") || "Log Type"}:</strong>{" "}
                <LogTypeBadge logType={selectedLog.log_type} />
              </div>
              <div>
                <strong>{t("Decision") || "Decision"}:</strong>{" "}
                {selectedLog.decision || `${selectedLog.from_status || "-"} → ${selectedLog.to_status || "-"}`}
              </div>
              <div>
                <strong>{t("Execution_State") || "Execution State"}:</strong>{" "}
                {selectedLog.execution_state || selectedLog.to_status || "-"}
              </div>
              {selectedLog.assumption_state && (
                <div>
                  <strong>{t("Assumption_State") || "Assumption State"}:</strong>{" "}
                  {selectedLog.assumption_state}
                </div>
              )}
              <div>
                <strong>{t("Actor") || "Actor"}:</strong>{" "}
                {selectedLog.actor_name || "-"}
              </div>
              <div>
                <strong>{t("Justification") || "Justification"}:</strong>
                <p
                  style={{
                    marginTop: "6px",
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: "6px",
                    color: "#374151",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedLog.justification || "-"}
                </p>
              </div>
              {selectedLog.before_snapshot && Object.keys(selectedLog.before_snapshot).length > 0 && (
                <div>
                  <strong>{t("Before") || "Before"}:</strong>{" "}
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>
                    {JSON.stringify(selectedLog.before_snapshot)}
                  </span>
                </div>
              )}
              {selectedLog.after_snapshot && Object.keys(selectedLog.after_snapshot).length > 0 && (
                <div>
                  <strong>{t("After") || "After"}:</strong>{" "}
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>
                    {JSON.stringify(selectedLog.after_snapshot)}
                  </span>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <RBButton variant="secondary" onClick={() => setSelectedLog(null)}>
            {t("Close") || "Close"}
          </RBButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AllDecisionLogs;
