import { useEffect, useState } from "react";
import { getDashboard, logout as logoutAPI } from "../services/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const data = await getDashboard();
      setDashboard(data);
      setIsLoggedIn(true);
      return data;
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setIsLoggedIn(false);
      throw err;
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        await fetchDashboard();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  const logout = async () => {
    await logoutAPI();
    setIsLoggedIn(false);
    setDashboard(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        dashboard,
        dashboardLoading,
        fetchDashboard,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
