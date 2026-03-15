import { useLocation } from "react-router-dom";
import JobCard from "../components/JobCard";

function JobsMatched() {
  const location = useLocation();
  const data = location.state;

  if (!data) return <p>No results</p>;

  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold mb-6">Jobs Matched</h2>

      {data.warning && <p className="mb-6 text-orange-600">{data.warning}</p>}

      <div className="grid grid-cols-3 gap-6">
        {data.jobs.map((job, i) => (
          <JobCard key={i} job={job} cvText={data.cv_text} />
        ))}
      </div>
    </div>
  );
}

export default JobsMatched;
