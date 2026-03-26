import { useEffect, useState, useMemo } from "react";
import {
  getJobFunctions,
  getCountries,
  recalculateJobs,
} from "../services/api";
import { useDashboard } from "./useAuth";
import usePagination from "./usePagination";

export default function useJobsMatched(location, navigate) {
  const { dashboard, dashboardLoading, refreshDashboard } = useDashboard();

  const [data, setData] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [activeCV, setActiveCV] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [dateFilter, setDateFilter] = useState("");

  const [loadingRecalc, setLoadingRecalc] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // FILTER OUT HIDDEN JOBS - wrapped in useMemo to prevent re-creation
  const visibleJobs = useMemo(
    () => data?.jobs?.filter((job) => job.status !== "hidden") || [],
    [data?.jobs],
  );

  const jobsPerPage = 10;

  const {
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    currentItems: currentJobs,
  } = usePagination(visibleJobs, jobsPerPage);

  // Calculate indices for pagination display
  const indexOfFirst = (currentPage - 1) * jobsPerPage;
  const indexOfLast = indexOfFirst + jobsPerPage;

  // LOAD - Use dashboard from context
  useEffect(() => {
    if (dashboardLoading || !dashboard) return;

    try {
      // UNIQUE CVS
      const uniqueCVs = [];
      const seen = new Set();

      (dashboard.job_history || []).forEach((cv) => {
        if (!seen.has(cv.cv_id)) {
          seen.add(cv.cv_id);
          uniqueCVs.push(cv);
        }
      });

      setCvList(uniqueCVs);

      // CHAT
      setChatHistory(
        (dashboard.chat_history || []).map((c) => ({
          job_id: c.job_id,
          question: c.question,
          answer: c.answer,
        })),
      );

      // HANDLE Resume to Jobs navigation
      if (location.state?.selectedCV) {
        const selected = location.state.selectedCV;

        setActiveCV(selected);
        setData({
          cv_text: selected.cv_text,
          jobs: selected.jobs,
        });

        return;
      }

      // FALLBACK (normal load)
      if (dashboard.job_history.length > 0) {
        const primary =
          dashboard.job_history.find((cv) => cv.is_primary) ||
          dashboard.job_history[0];

        setActiveCV(primary);
        setData({
          cv_text: primary.cv_text,
          jobs: primary.jobs,
        });
      } else {
        navigate("/analyze");
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  }, [dashboard, dashboardLoading, location.state?.selectedCV, navigate]);

  // LOAD DROPDOWNS
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const jf = await getJobFunctions();
        const ct = await getCountries();

        setJobFunctions(jf.job_functions || []);
        setCountries(ct.countries || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadDropdowns();
  }, []);

  // AUTO SELECT JOB
  useEffect(() => {
    if (visibleJobs.length > 0) {
      setSelectedJob(visibleJobs[0]);
    }
  }, [visibleJobs]);

  const handleRecalculate = async (formData) => {
    setLoadingRecalc(true);
    try {
      await recalculateJobs(formData);
      setHasChanges(false);
      await refreshDashboard();
    } catch (err) {
      console.error(err);
    }
    setLoadingRecalc(false);
  };

  return {
    data,
    cvList,
    activeCV,
    setActiveCV,
    selectedJob,
    setSelectedJob,
    chatHistory,
    jobFunctions,
    countries,
    dateFilter,
    setDateFilter,
    loadingRecalc,
    handleRecalculate,
    hasChanges,
    setHasChanges,
    currentPage,
    setCurrentPage,
    jobsPerPage,
    currentJobs,
    totalPages,
    indexOfFirst,
    indexOfLast,
    setData,
  };
}
