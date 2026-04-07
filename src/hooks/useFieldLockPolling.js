import { useEffect, useRef, useState } from "react";
import axios from "axios";

export const useFieldLockPolling = (projectId) => {
  const [locks, setLocks] = useState([]);
  const pollingRef = useRef(null);
  const token = sessionStorage.getItem("token");

  const fetchLocks = async () => {
    if (!projectId || !token) return;
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/project-field-locks/${projectId}/lock`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocks(res.data.locks || []);
    } catch (err) {
      console.error("Failed to fetch field locks", err);
      setLocks([]);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    fetchLocks();

    pollingRef.current = setInterval(fetchLocks, 5000); 

    return () => {
      clearInterval(pollingRef.current);
    };
  }, [projectId]);

  return { locks, refetchLocks: fetchLocks };
};
