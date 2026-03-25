function JobCard({ job, onSelect }) {
  const location = job.location || job.country || "Unknown";
  const salary = job.salary || "TBA";

  const formattedDate = job.posted_date
    ? new Date(job.posted_date).toLocaleDateString()
    : "Unknown";

  return (
    <div
      onClick={onSelect}
      className="border rounded-lg p-5 bg-white shadow cursor-pointer hover:bg-gray-50"
    >
      <h3 className="text-xl font-bold">{job.job_role}</h3>

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
