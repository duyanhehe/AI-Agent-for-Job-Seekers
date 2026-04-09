import { useState, useEffect } from "react";
import { getAdminStats, getAdminUsage } from "../../services/api";

export function useAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, usageRes] = await Promise.all([
          getAdminStats(),
          getAdminUsage(),
        ]);

        setStats(statsRes?.data);
        setUsage(usageRes?.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch admin stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { stats, usage, loading, error };
}
