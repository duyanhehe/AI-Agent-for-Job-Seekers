import { useState, useEffect } from "react";
import { saveJobAction } from "../services/api";

function JobCard({ job, onSelect, onStatusChange }) {
  const [showReport, setShowReport] = useState(false);

  const [status, setStatus] = useState(job.status || null);

  useEffect(() => {
    setStatus(job.status || null);
  }, [job.status]);

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

  const handleAction = async (newStatus, reason = null) => {
    try {
      const formData = new FormData();
      formData.append("job_id", job.job_id);
      formData.append("status", newStatus);
      if (reason) formData.append("reason", reason);

      await saveJobAction(formData);

      setStatus(newStatus);

      if (onStatusChange) {
        onStatusChange(job.job_id, newStatus);
      }

      alert(`Saved as ${newStatus}`);
      setShowReport(false);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
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

  const [selectedReason, setSelectedReason] = useState(null);

  return (
    <>
      <div
        onClick={onSelect}
        className="border rounded-lg p-5 bg-white shadow hover:bg-gray-50 cursor-pointer"
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
                className={`px-3 py-1 rounded border text-sm ${
                  status === "liked"
                    ? "bg-green-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                ❤️ Like
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("applied");
                }}
                className={`px-3 py-1 rounded border text-sm ${
                  status === "applied"
                    ? "bg-blue-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                ✔ Applied
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("hidden");
                }}
                className={`px-3 py-1 rounded border text-sm ${
                  status === "hidden"
                    ? "bg-gray-400 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                ❌ Hide
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReport(true);
                }}
                className={`px-3 py-1 rounded border text-sm ${
                  status === "reported"
                    ? "bg-red-500 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                🚩 Report
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
          className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center"
          onClick={() => setShowReport(false)}
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
                onClick={() => {
                  setShowReport(false);
                  setSelectedReason(null);
                }}
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
