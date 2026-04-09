import { useState, useEffect } from "react";
import { getAdminUsage } from "../../services/api";

export function useAdminUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("most_used");

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminUsage(sortBy);
        setUsage(response?.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch usage data");
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [sortBy]);

  return { usage, loading, error, sortBy, setSortBy };
}
