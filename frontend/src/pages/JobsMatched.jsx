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

  const [loadingRecalc, setLoadingRecalc] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
  // CONFIRM RECALCULATE
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
      });

      setData({
        cv_text: activeCV.cv_text,
        jobs: result.jobs,
        warning: result.warning,
      });

      setSelectedJob(null);
      setHasChanges(false);
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
                }}
                className={`px-4 py-3 rounded border text-sm transition ${
                  activeCV?.cv_id === cv.cv_id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">CV {index + 1}</span>
                </div>
              </button>
            ))}
          </div>

          {/* FILTER SECTION */}
          {activeCV && (
            <>
              <h3 className="font-semibold text-gray-700 mb-3">
                Adjust Job Preferences
              </h3>

              <div className="flex gap-6 mb-4 items-end flex-wrap">
                {/* Job Function */}
                <div className="flex flex-col text-sm">
                  <label className="mb-1 text-gray-600 font-medium">
                    Job Function
                  </label>
                  <select
                    value={activeCV.job_function || ""}
                    onChange={(e) => {
                      setActiveCV((prev) => ({
                        ...prev,
                        job_function: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    className="border px-3 py-2 rounded"
                  >
                    <option value="">Select function</option>
                    {jobFunctions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div className="flex flex-col text-sm">
                  <label className="mb-1 text-gray-600 font-medium">
                    Job Type
                  </label>
                  <select
                    value={activeCV.job_type || ""}
                    onChange={(e) => {
                      setActiveCV((prev) => ({
                        ...prev,
                        job_type: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    className="border px-3 py-2 rounded"
                  >
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Location */}
                <div className="flex flex-col text-sm">
                  <label className="mb-1 text-gray-600 font-medium">
                    Location
                  </label>
                  <select
                    value={activeCV.location || ""}
                    onChange={(e) => {
                      setActiveCV((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    className="border px-3 py-2 rounded max-w-[200px]"
                  >
                    <option value="">Select location</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CONFIRM BUTTON */}
                <button
                  onClick={handleRecalculate}
                  disabled={!hasChanges || loadingRecalc}
                  className={`px-4 py-2 rounded text-white ${
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

          {/* SPINNER */}
          {loadingRecalc && <Spinner />}

          {/* WARNING */}
          {data.warning && <p className="text-orange-600">{data.warning}</p>}

          {/* JOB LIST */}
          {!loadingRecalc &&
            data.jobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                onSelect={() => setSelectedJob(job)}
              />
            ))}
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
