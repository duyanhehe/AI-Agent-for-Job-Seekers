import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

export default function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

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

  return { isLoggedIn };
}
