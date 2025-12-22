import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

export const lockField = (projectId, fieldName, token) =>
  axios.post(
    `${BASE}/api/project-field-locks/${projectId}/lock`,
    { field_name: fieldName },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const heartbeat = (projectId, token) =>
  axios.patch(
    `${BASE}/api/project-field-locks/${projectId}/lock/heartbeat`,
    null,
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const unlockFields = (projectId, fields, token) =>
  axios.delete(
    `${BASE}/api/project-field-locks/${projectId}/lock`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: fields ? { fields } : {},
    }
  );
