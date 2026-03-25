import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getDashboard,
  getJobFunctions,
  getCountries,
  recalculateJobs,
} from "../services/api";

import JobCard from "../components/JobCard";
import AIAgentPanel from "../components/AIAgentPanel";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";

function JobsMatched() {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(location.state || null);
  const [cvList, setCvList] = useState([]);
  const [activeCV, setActiveCV] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [dateFilter, setDateFilter] = useState("");

  const [loadingRecalc, setLoadingRecalc] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  // -------------------------
  // INITIAL LOAD
  // -------------------------
  useEffect(() => {
    async function loadData() {
      try {
        const dashboard = await getDashboard();

        const uniqueCVs = [];
        const seen = new Set();

        (dashboard.job_history || []).forEach((cv) => {
          if (!seen.has(cv.cv_id)) {
            seen.add(cv.cv_id);
            uniqueCVs.push(cv);
          }
        });

        setCvList(uniqueCVs);

        setChatHistory(
          (dashboard.chat_history || []).map((c) => ({
            job_id: c.job_id,
            question: c.question,
            answer: c.answer,
          })),
        );

        const jf = await getJobFunctions();
        setJobFunctions(jf.job_functions || []);

        const ct = await getCountries();
        setCountries(ct.countries || []);

        if (data) {
          const matchedCV = dashboard.job_history.find(
            (cv) => cv.cv_text === data.cv_text,
          );
          if (matchedCV) setActiveCV(matchedCV);
          return;
        }

        if (dashboard.job_history.length > 0) {
          const first = dashboard.job_history[0];

          setActiveCV(first);
          setData({
            cv_text: first.cv_text,
            jobs: first.jobs,
          });
        } else {
          navigate("/analyze");
        }
      } catch {
        navigate("/login");
      }
    }

    loadData();
  }, []);

  // -------------------------
  // AUTO SELECT JOB
  // -------------------------
  useEffect(() => {
    if (data?.jobs?.length > 0 && !selectedJob) {
      setSelectedJob(data.jobs[0]);
    }
  }, [data]);

  // -------------------------
  // PAGINATION LOGIC
  // -------------------------
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;

  const currentJobs = data.jobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(data.jobs.length / jobsPerPage);

  // -------------------------
  // RECALCULATE
  // -------------------------
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
      setCurrentPage(1); // reset page
    } catch (err) {
      console.error(err);
    }

    setLoadingRecalc(false);
  }

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-60px)] bg-gray-100 overflow-hidden">
        {/* LEFT */}
        <div className="w-2/3 p-8 overflow-y-auto">
          {/* CV TABS */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {cvList.map((cv, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveCV(cv);
                  setData({
                    cv_text: cv.cv_text,
                    jobs: cv.jobs,
                  });
                  setSelectedJob(null);
                  setHasChanges(false);
                  setCurrentPage(1); // reset page
                }}
                className={`px-4 py-3 rounded border text-sm transition ${
                  activeCV?.cv_id === cv.cv_id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="font-semibold">CV {index + 1}</span>
              </button>
            ))}
          </div>

          {/* FILTERS */}
          {activeCV && (
            <>
              <h3 className="font-semibold text-gray-700 mb-3">
                Adjust Job Preferences
              </h3>

              <div className="flex flex-wrap gap-2 mb-6">
                {/* Job Function */}
                <select
                  value={activeCV.job_function || ""}
                  onChange={(e) => {
                    setActiveCV((prev) => ({
                      ...prev,
                      job_function: e.target.value,
                    }));
                    setHasChanges(true);
                  }}
                  className={`px-3 py-2 rounded-full border text-sm bg-white ${
                    activeCV.job_function
                      ? "border-green-400 ring-2 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <option value="" disabled hidden>
                    Job Function
                  </option>
                  {jobFunctions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                {/* Job Type */}
                <select
                  value={activeCV.job_type || ""}
                  onChange={(e) => {
                    setActiveCV((prev) => ({
                      ...prev,
                      job_type: e.target.value,
                    }));
                    setHasChanges(true);
                  }}
                  className={`px-3 py-2 rounded-full border text-sm bg-white ${
                    activeCV.job_type
                      ? "border-green-400 ring-2 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <option value="" disabled hidden>
                    Job Type
                  </option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>

                {/* Location */}
                <select
                  value={activeCV.location || ""}
                  onChange={(e) => {
                    setActiveCV((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }));
                    setHasChanges(true);
                  }}
                  className={`px-3 py-2 rounded-full border text-sm bg-white ${
                    activeCV.location
                      ? "border-green-400 ring-2 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <option value="" disabled hidden>
                    Location
                  </option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Date */}
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setHasChanges(true);
                  }}
                  className={`px-3 py-2 rounded-full border text-sm bg-white ${
                    dateFilter
                      ? "border-green-400 ring-2 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Date Posted</option>
                  <option value="24h">Past 24h</option>
                  <option value="3d">Past 3 days</option>
                  <option value="week">Past week</option>
                  <option value="month">Past month</option>
                  <option value="year">Past year</option>
                </select>

                <button
                  onClick={handleRecalculate}
                  disabled={!hasChanges || loadingRecalc}
                  className={`px-4 py-2 rounded-full text-white ${
                    !hasChanges
                      ? "bg-gray-400"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {loadingRecalc ? "Processing..." : "Confirm"}
                </button>
              </div>
            </>
          )}

          {loadingRecalc && <Spinner />}
          {data.warning && <p className="text-orange-600">{data.warning}</p>}

          {/* JOB LIST */}
          {!loadingRecalc &&
            currentJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                onSelect={() => setSelectedJob(job)}
              />
            ))}

          {/* PAGINATION */}
          {!loadingRecalc && totalPages > 1 && (
            <div className="flex flex-col items-center mt-6 gap-3">
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstJob + 1}–
                {Math.min(indexOfLastJob, data.jobs.length)} of{" "}
                {data.jobs.length} jobs
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(currentPage - 2, 0),
                    Math.min(currentPage + 2, totalPages),
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === page
                          ? "bg-green-500 text-white"
                          : "bg-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-1/3 border-l bg-white h-full">
          <AIAgentPanel
            job={selectedJob}
            cvText={data.cv_text}
            chatHistory={chatHistory}
          />
        </div>
      </div>
    </Layout>
  );
}

export default JobsMatched;
