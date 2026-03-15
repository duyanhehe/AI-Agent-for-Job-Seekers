import { useState } from "react";
import { analyzeJob, askQuestion } from "../services/api";

function JobCard({ job, cvText }) {
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  async function handleAnalyze() {
    const result = await analyzeJob({
      cv_text: cvText,
      job_id: job.job_id,
    });

    setAnalysis(result.analysis);
  }

  async function handleAsk() {
    const result = await askQuestion({
      cv_text: cvText,
      job_id: job.job_id,
      question: question,
    });

    setAnswer(result.result);
  }

  return (
    <div className="border p-4 rounded shadow bg-white">
      <h3 className="font-bold text-lg">{job.job_role}</h3>

      <p className="text-gray-600">{job.company}</p>

      <p className="text-sm">{job.country}</p>

      <button
        onClick={handleAnalyze}
        className="mt-3 bg-blue-500 text-white px-3 py-1 rounded"
      >
        Analyze Match
      </button>

      {analysis && (
        <div className="mt-3 text-sm">
          <p>Match Score: {analysis.match_score}</p>

          <p>Missing Skills:</p>
          <ul>
            {analysis.missing_skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <input
          placeholder="Ask about this job..."
          className="border p-1 w-full"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button
          onClick={handleAsk}
          className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
        >
          Ask AI
        </button>
      </div>

      {answer && <p className="mt-2 text-sm">{answer.answer}</p>}
    </div>
  );
}

export default JobCard;
