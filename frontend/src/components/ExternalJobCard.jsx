function ExternalJobCard({ job }) {
  return (
    <div className="rounded-lg p-5 bg-white shadow">
      <div className="flex">
        <div className="flex-1 pr-6">
          <h3 className="text-xl font-bold">{job.job_role}</h3>
          <p className="text-gray-600">{job.company}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 mt-3 text-sm gap-2">
            <p>
              <b>Location:</b> {job.location || "Unknown"}
            </p>
            <p>
              <b>Type:</b> {job.job_type || "N/A"}
            </p>
            <p>
              <b>Salary:</b> {job.salary || "TBA"}
            </p>
          </div>

          {/* NORMAL SKILLS */}
          {job.skills?.length > 0 && (
            <p className="mt-2 text-sm">
              <b>Skills:</b> {job.skills.join(", ")}
            </p>
          )}

          {/* TYPE SKILLS */}
          {job.type_skills && (
            <div className="mt-2 text-sm">
              <b>Detailed Skills:</b>
              <ul className="list-disc ml-5">
                {Object.entries(job.type_skills).map(([key, values]) =>
                  values?.length > 0 ? (
                    <li key={key}>
                      <b>{key.replace("_", " ")}:</b> {values.join(", ")}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
          {job.url && (
            <a
              href={job.url.startsWith("http") ? job.url : `https://${job.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-blue-600 text-sm hover:underline"
            >
              View Original Posting
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExternalJobCard;
