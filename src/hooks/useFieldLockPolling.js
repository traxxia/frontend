import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Global cache for lock requests shared across hook instances
const fieldLockCache = new Map();

export const useFieldLockPolling = (projectId, enabled = true) => {
  const [locks, setLocks] = useState([]);
  const pollingRef = useRef(null);
  const token = useAuthStore.getState().token;

  const fetchLocks = useCallback(async () => {
    if (!projectId || !token) return;

    const cacheKey = `locks-${projectId}`;
    const timestamp = Math.floor(Date.now() / 1000); // 1-second granularity for polling deduplication

    // If a request for this project was made in the last 1 second, reuse it
    if (fieldLockCache.has(cacheKey)) {
      const cached = fieldLockCache.get(cacheKey);
      if (timestamp - cached.time <= 1) {
        const data = await cached.promise;
        setLocks(data.locks || []);
        return;
      }
    }

    const fetchPromise = (async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/project-field-locks/${projectId}/lock`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;
        setLocks(data.locks || []);
        return data;
      } catch (err) {
        console.error("Failed to fetch field locks", err);
        setLocks([]);
        return { locks: [] };
      }
    })();

    fieldLockCache.set(cacheKey, { promise: fetchPromise, time: timestamp });
    await fetchPromise;
  }, [projectId, token]);

  useEffect(() => {
    if (!projectId || !enabled) {
      if (!enabled) setLocks([]);
      return;
    }

    fetchLocks();

    pollingRef.current = setInterval(fetchLocks, 5000); 

    return () => {
      clearInterval(pollingRef.current);
    };
  }, [projectId, enabled, fetchLocks]);

  return { locks, refetchLocks: fetchLocks };
};
