function JobCard({ job, onSelect }) {
  const location = job.location || job.country || "Unknown";
  const salary = job.salary || "TBA";

  const formattedDate = job.posted_date
    ? new Date(job.posted_date).toLocaleDateString()
    : "Unknown";

  // -------------------------
  // Match label
  // -------------------------
  const getMatchLabel = (score) => {
    if (score >= 80) return "STRONG MATCH";
    if (score >= 60) return "GOOD MATCH";
    if (score >= 40) return "FAIR MATCH";
    return "WEAK MATCH";
  };

  // -------------------------
  // Circle progress
  // -------------------------
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (job.score / 100) * circumference;

  return (
    <div
      onClick={onSelect}
      className="relative border rounded-lg p-5 bg-white shadow cursor-pointer hover:bg-gray-50"
    >
      {/* =========================
          SCORE CIRCLE (TOP RIGHT)
      ========================== */}
      <div className="absolute top-4 right-4 flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="6"
              fill="transparent"
            />

            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#10b981"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>

          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
            {job.score}%
          </div>
        </div>

        {/* Match label */}
        <p className="text-xs font-semibold text-green-600 mt-1">
          {getMatchLabel(job.score)}
        </p>
      </div>

      {/* =========================
          JOB INFO
      ========================== */}
      <h3 className="text-xl font-bold pr-24">{job.job_role}</h3>

      <p className="text-gray-600">{job.company}</p>

      <div className="grid grid-cols-4 mt-3 text-sm">
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
    </div>
  );
}

export default JobCard;
