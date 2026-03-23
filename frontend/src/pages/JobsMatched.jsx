import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";

import JobCard from "../components/JobCard";
import AIAgentPanel from "../components/AIAgentPanel";
import Layout from "../components/Layout";

function JobsMatched() {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(location.state || null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // Load from backend if page refreshed
  useEffect(() => {
    async function loadData() {
      try {
        const dashboard = await getDashboard();

        // Always set chat history
        setChatHistory(
          (dashboard.chat_history || []).map((c) => ({
            job_id: c.job_id,
            question: c.question,
            answer: c.answer,
          })),
        );

        // Only fallback if no navigation data
        if (!data) {
          if (dashboard?.job_history?.length > 0) {
            const latest = dashboard.job_history[0];

            setData({
              cv_text: latest.cv_text,
              jobs: latest.jobs,
            });
          } else {
            navigate("/analyze");
          }
        }
      } catch {
        navigate("/login");
      }
    }

    loadData();
  }, []);

  // Auto-select first job
  useEffect(() => {
    if (data?.jobs?.length > 0 && !selectedJob) {
      setSelectedJob(data.jobs[0]);
    }
  }, [data]);

  if (!data) return <p className="p-6">Loading...</p>;

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

        {/* RIGHT SIDE AI */}
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
