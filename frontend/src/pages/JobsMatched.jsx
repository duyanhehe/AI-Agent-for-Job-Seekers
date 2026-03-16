import { useLocation } from "react-router-dom";
import JobCard from "../components/JobCard";
import AIAgentPanel from "../components/AIAgentPanel";
import Layout from "../components/Layout";
import { useState } from "react";

function JobsMatched() {
  const location = useLocation();
  const data = location.state;

  const [selectedJob, setSelectedJob] = useState(null);

  if (!data) return <p>No results</p>;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-60px)] bg-gray-100 overflow-hidden">
        {/* LEFT SIDE JOBS */}
        <div className="w-2/3 p-8 overflow-y-auto">
          {data.warning && <p className="text-orange-600">{data.warning}</p>}

          {data.jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              onSelect={() => setSelectedJob(job)}
            />
          ))}
        </div>

        {/* RIGHT SIDE AI AGENT */}
        <div className="w-1/3 border-l bg-white h-full">
          <AIAgentPanel job={selectedJob} cvText={data.cv_text} />
        </div>
      </div>
    </Layout>
  );
}

export default JobsMatched;
