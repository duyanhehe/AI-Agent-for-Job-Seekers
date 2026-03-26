import { useEffect, useState } from "react";
import { deleteCVAPI, renameCVAPI, setPrimaryCVAPI } from "../services/api";
import { useDashboard } from "./useAuth";

export default function useResume() {
  const { dashboard, dashboardLoading, refreshDashboard } = useDashboard();

  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize cvList from dashboard
  useEffect(() => {
    if (dashboardLoading) {
      setLoading(true);
      return;
    }

    try {
      const uniqueCVs = [];
      const seen = new Set();

      (dashboard?.job_history || []).forEach((cv) => {
        if (!seen.has(cv.cv_id)) {
          seen.add(cv.cv_id);
          uniqueCVs.push(cv);
        }
      });

      setCvList(uniqueCVs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [dashboard, dashboardLoading]);

  // Refresh CVs after mutations
  const fetchCVs = async () => {
    setLoading(true);
    try {
      await refreshDashboard();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteCV = async (cv_id) => {
    await deleteCVAPI(cv_id);
    await fetchCVs();
  };

  const renameCV = async (cv_id, newName) => {
    await renameCVAPI(cv_id, newName);
    await fetchCVs();
  };

  const setPrimaryCV = async (cv_id) => {
    await setPrimaryCVAPI(cv_id);
    await fetchCVs();
  };

  const sortCVs = (type) => {
    let sorted = [...cvList];

    if (type === "latest") {
      sorted.reverse();
    }

    setCvList(sorted);
  };

  return {
    cvList,
    loading,
    fetchCVs,
    deleteCV,
    renameCV,
    setPrimaryCV,
    sortCVs,
  };
}
