import { useNavigate } from "react-router-dom";
import useJobCard from "../../hooks/jobs/useJobCard";

function JobCard({ job, onSelect, onStatusChange }) {
  const navigate = useNavigate();

  const {
    showReport,
    setShowReport,
    status,
    selectedReason,
    setSelectedReason,
    handleAction,
    cancelReport,
  } = useJobCard(job, onStatusChange);

  const location = job.location || job.country || "Unknown";
  const salary = job.salary || "TBA";

  const formattedDate = job.posted_date
    ? new Date(job.posted_date).toLocaleDateString()
    : "Unknown";

  const getMatchLabel = (score) => {
    if (score >= 80) return "STRONG MATCH";
    if (score >= 60) return "GOOD MATCH";
    if (score >= 40) return "FAIR MATCH";
    return "WEAK MATCH";
  };

  const getBadgeColor = () => {
    switch (status) {
      case "liked":
        return "bg-green-100 text-green-700";
      case "applied":
        return "bg-blue-100 text-blue-700";
      case "reported":
        return "bg-red-100 text-red-700";
      case "hidden":
        return "bg-gray-200 text-gray-700";
      default:
        return "";
    }
  };

  const reportOptions = [
    { label: "I think this is a scam or fake job", value: "scam" },
    {
      label: "I think it's discriminatory or offensive",
      value: "discriminatory",
    },
    {
      label: "Incorrect company information or job details",
      value: "incorrect-info",
    },
    { label: "This job is no longer available", value: "unavailable" },
    {
      label: "This job is not relevant to my search",
      value: "irrelevant",
    },
  ];

  return (
    <>
      <div
        onClick={onSelect}
        className="rounded-lg p-5 bg-white shadow hover:bg-gray-50 cursor-pointer"
      >
        {/* TOP LAYOUT */}
        <div className="flex">
          {/* LEFT CONTENT */}
          <div className="flex-1 pr-6">
            {/* TITLE + STATUS */}
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{job.job_role}</h3>

              {status && (
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${getBadgeColor()}`}
                >
                  {status.toUpperCase()}
                </span>
              )}
            </div>

            <p className="text-gray-600">{job.company}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 mt-3 text-sm gap-2">
              <p>
                <b>Location:</b> {location}
              </p>
              <p>
                <b>Type:</b> {job.job_type}
              </p>
              <p>
                <b>Salary:</b> {salary}
              </p>
              <p>
                <b>Posted:</b> {formattedDate}
              </p>
            </div>

            {job.skills && (
              <p className="mt-2 text-sm">
                <b>Skills:</b> {job.skills.join(", ")}
              </p>
            )}

            {/* ACTION BUTTONS (RADIO STYLE) */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("liked");
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded border text-sm ${
                  status === "liked"
                    ? "bg-pink-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                Like
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("applied");
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded border text-sm ${
                  status === "applied"
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Already Applied
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("hidden");
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded border text-sm ${
                  status === "hidden"
                    ? "bg-gray-400 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Not Interested
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReport(true);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded border text-sm ${
                  status === "reported"
                    ? "bg-red-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
                  />
                </svg>
                Report
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  navigate("/jobs/interview", {
                    state: {
                      job: {
                        ...job,
                        cv_id: job.cv_id,
                        cv_text: job.cv_text,
                      },
                    },
                  });
                }}
                className="flex items-center gap-2 px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                  />
                </svg>
                Interview
              </button>
            </div>
          </div>

          {/* RIGHT SCORE (FULL HEIGHT) */}
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={
                    2 * Math.PI * 30 - (job.score / 100) * 2 * Math.PI * 30
                  }
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center font-bold text-base">
                {job.score}%
              </div>
            </div>

            <p className="text-xs font-semibold text-green-600 mt-2 text-center">
              {getMatchLabel(job.score)}
            </p>
          </div>
        </div>
      </div>

      {/* REPORT MODAL */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
          onClick={() => cancelReport()}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-lg w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Report Job</h2>

            <div className="flex flex-col gap-2">
              {reportOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${
                selectedReason === option.value
                  ? "bg-gray-100 border-gray-400"
                  : "bg-white hover:bg-gray-50"
              }`}
                >
                  <input
                    type="radio"
                    name="report"
                    value={option.value}
                    checked={selectedReason === option.value}
                    onChange={() => setSelectedReason(option.value)}
                    className="accent-green-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between mt-5 gap-3">
              <button
                onClick={() => cancelReport()}
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                disabled={!selectedReason}
                onClick={() => handleAction("reported", selectedReason)}
                className={`w-full py-2 rounded-lg text-white font-medium transition
            ${
              selectedReason
                ? "bg-green-500 hover:bg-green-600"
                : "bg-green-300 cursor-not-allowed"
            }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default JobCard;
