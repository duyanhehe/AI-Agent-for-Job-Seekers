import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getJobFunctions,
  getCountries,
  recalculateJobs,
  getExternalJobs,
} from "../../services/api";
import { useDashboard, useCredits } from "../auth/useAuth";
import { toast } from "react-toastify";
import usePagination from "../common/usePagination";

/**
 * Maps API external jobs to the shape used by job cards in the external tab.
 * @param {object[]} jobs
 * @returns {object[]}
 */
function formatExternalJobs(jobs) {
  return jobs.map((j) => ({
    job_id: j.id,
    job_role: j.job_role,
    company: j.company,
    location: j.location,
    url: j.url,
    job_type: j.job_type,
    salary: j.salary,
    skills: j.skills,
    type_skills: j.type_skills,
    status: "external",
  }));
}

export default function useJobsMatched(location, navigate) {
  const { dashboard, dashboardLoading, refreshDashboard } = useDashboard();
  const { refreshCredits } = useCredits();

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

  const [externalJobs, setExternalJobs] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const refreshExternalJobs = useCallback(async () => {
    try {
      const jobs = await getExternalJobs();
      setExternalJobs(formatExternalJobs(jobs));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshExternalJobs();
  }, [refreshExternalJobs]);

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

  /**
   * POSTs current filter preferences to /job/recalculate and syncs jobs + dashboard.
   */
  const handleRecalculate = async () => {
    if (!activeCV?.cv_id || activeCV.cv_text == null) {
      return;
    }

    setLoadingRecalc(true);
    try {
      const payload = {
        cv_id: activeCV.cv_id,
        cv_text: activeCV.cv_text,
        job_function: activeCV.job_function || null,
        job_type: activeCV.job_type || null,
        location: activeCV.location || null,
        date_filter: dateFilter || null,
      };

      const result = await recalculateJobs(payload);

      setData((prev) => ({
        ...prev,
        jobs: result.jobs,
        warning: result.warning ?? prev?.warning,
      }));

      // Show toast notification if there's a country warning
      if (result.warning) {
        toast.warning(result.warning, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      setHasChanges(false);
      await refreshDashboard();
      await refreshCredits();
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You've reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("Service is at maximum capacity. Try again tomorrow.");
      } else {
        console.error(err);
      }
    } finally {
      setLoadingRecalc(false);
    }
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
    externalJobs,
    showDrawer,
    setShowDrawer,
    refreshExternalJobs,
  };
}
