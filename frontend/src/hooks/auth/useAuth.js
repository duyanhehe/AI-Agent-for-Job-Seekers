import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Main auth hook
export function useAuth() {
  return useContext(AuthContext);
}

// Dashboard-specific hook
export function useDashboard() {
  const { dashboard, dashboardLoading, fetchDashboard } =
    useContext(AuthContext);
  return { dashboard, dashboardLoading, refreshDashboard: fetchDashboard };
}

export function useCredits() {
  const { credits, fetchCredits } = useContext(AuthContext);
  return { credits, refreshCredits: fetchCredits };
}
