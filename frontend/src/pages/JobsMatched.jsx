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
  const [cvList, setCvList] = useState([]);
  const [activeCV, setActiveCV] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // Load from backend if page refreshed
  useEffect(() => {
    async function loadData() {
      try {
        const dashboard = await getDashboard();

        // Always set CV tabs
        setCvList(dashboard.job_history || []);

        // Always set chat history
        setChatHistory(
          (dashboard.chat_history || []).map((c) => ({
            job_id: c.job_id,
            question: c.question,
            answer: c.answer,
          })),
        );

        // If coming from /analyze to data already exists
        if (data) {
          // Find matching CV from backend to sync active tab
          const matchedCV = dashboard.job_history.find(
            (cv) => cv.cv_text === data.cv_text,
          );

          if (matchedCV) {
            setActiveCV(matchedCV);
          }

          return;
        }

        // If direct access / refresh
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
          {/* CV TABS */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {cvList.map((cv, index) => (
              <button
                key={cv.cv_id}
                onClick={() => {
                  setActiveCV(cv);
                  setData({
                    cv_text: cv.cv_text,
                    jobs: cv.jobs,
                  });
                  setSelectedJob(null); // reset selected job
                }}
                className={`px-4 py-2 rounded border ${
                  activeCV?.cv_id === cv.cv_id
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                }`}
              >
                CV {index + 1}
              </button>
            ))}
          </div>
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
