import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import JobCard from "../components/JobCard";
import AIAgentPanel from "../components/AIAgentPanel";
import Spinner from "../components/Spinner";
import useJobsMatched from "../hooks/useJobsMatched";

function JobsMatched() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
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
  } = useJobsMatched(location, navigate);

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <Layout>
      <div className="flex h-full bg-gray-100 overflow-hidden">
        {/* LEFT */}
        <div className="w-2/3 p-8 overflow-y-auto">
          {/* ACTIVE CV */}
          {activeCV && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                {activeCV.file_name || "Selected CV"}
              </h2>
            </div>
          )}

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
                Showing {indexOfFirst + 1}–
                {Math.min(indexOfLast, data.jobs.length)} of {data.jobs.length}{" "}
                jobs
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  ),
                )}

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
