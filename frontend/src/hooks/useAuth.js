import { createContext, useContext, useEffect, useState } from "react";
import { getDashboard, logout as logoutAPI } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading

  // check auth once
  useEffect(() => {
    async function checkAuth() {
      try {
        await getDashboard();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  // logout handler
  const logout = async () => {
    await logoutAPI();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// hook
export default function useAuth() {
  return useContext(AuthContext);
}
