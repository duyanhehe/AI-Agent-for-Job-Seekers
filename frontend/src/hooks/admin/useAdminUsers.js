import { useState, useEffect } from "react";
import { getAdminUsers } from "../../services/api";

export function useAdminUsers(pageSize = 20) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const skip = (page - 1) * pageSize;
        const response = await getAdminUsers(skip, pageSize);
        setUsers(response?.data?.users || []);
        setTotal(response?.data?.total || 0);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    users,
    total,
    loading,
    error,
    page,
    setPage,
    pageSize,
    totalPages,
  };
}
