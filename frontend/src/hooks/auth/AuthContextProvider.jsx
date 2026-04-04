import { useEffect, useState } from "react";
import { getDashboard, getMe, logout as logoutAPI } from "../../services/api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [user, setUser] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const data = await getDashboard();
      setDashboard(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      throw err;
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch user
  const fetchUser = async () => {
    try {
      const data = await getMe();
      setUser(data);
      return data;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
        // run both in parallel
        await Promise.all([fetchUser(), fetchDashboard()]);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
        setUser(null);
        setDashboard(null);
      }
    }

    initAuth();
  }, []);

  const logout = async () => {
    await logoutAPI();
    setIsLoggedIn(false);
    setUser(null);
    setDashboard(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,

        user,
        setUser,

        dashboard,
        dashboardLoading,
        fetchDashboard,

        fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
