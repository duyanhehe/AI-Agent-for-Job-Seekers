import { useEffect, useState } from "react";
import {
  getDashboard,
  getJobFunctions,
  getCountries,
  recalculateJobs,
} from "../services/api";

export default function useJobsMatched(location, navigate) {
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

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // LOAD
  useEffect(() => {
    async function load() {
      try {
        const dashboard = await getDashboard();

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

        // DROPDOWNS
        const jf = await getJobFunctions();
        const ct = await getCountries();

        setJobFunctions(jf.job_functions || []);
        setCountries(ct.countries || []);

        // HANDLE Resume to Jobs navigation
        if (location.state?.selectedCV) {
          const selected = location.state.selectedCV;

          setActiveCV(selected);
          setData({
            cv_text: selected.cv_text,
            jobs: selected.jobs,
          });

          return; // STOP everything else
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
    }

    load();
  }, [location.state]);

  // AUTO SELECT JOB
  useEffect(() => {
    if (data?.jobs?.length > 0) {
      setSelectedJob(data.jobs[0]);
    }
  }, [data]);

  // PAGINATION
  const indexOfLast = currentPage * jobsPerPage;
  const indexOfFirst = indexOfLast - jobsPerPage;

  const currentJobs = data?.jobs?.slice(indexOfFirst, indexOfLast) || [];
  const totalPages = data?.jobs ? Math.ceil(data.jobs.length / jobsPerPage) : 0;

  // RECALCULATE
  async function handleRecalculate() {
    if (!activeCV) return;

    setLoadingRecalc(true);

    try {
      const result = await recalculateJobs({
        cv_id: activeCV.cv_id,
        cv_text: activeCV.cv_text,
        job_function: activeCV.job_function,
        job_type: activeCV.job_type,
        location: activeCV.location,
        date_filter: dateFilter,
      });

      setData({
        cv_text: activeCV.cv_text,
        jobs: result.jobs,
        warning: result.warning,
      });

      setSelectedJob(null);
      setHasChanges(false);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    }

    setLoadingRecalc(false);
  }

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
    hasChanges,
    setHasChanges,

    currentPage,
    setCurrentPage,
    currentJobs,
    totalPages,
    indexOfFirst,
    indexOfLast,

    handleRecalculate,
    setData,
  };
}
