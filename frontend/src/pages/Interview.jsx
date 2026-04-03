import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { generateInterview, gradeInterview } from "../services/api";

function Interview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const job = state?.job;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [answers, setAnswers] = useState({});
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!job) return;

    const fetchInterview = async () => {
      try {
        const res = await generateInterview({
          cv_id: job.cv_id,
          cv_text: job.cv_text,
          job_id: job.job_id,
        });

        setData(res.interview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [job]);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* ERROR STATES */}
        {!job?.cv_id ||
          !job?.cv_text ||
          (!job?.job_id && <div>Missing interview data</div>)}

        {!job && <div>No job selected</div>}

        {/* LOADING INSIDE LAYOUT */}
        {loading && <div>Generating interview...</div>}

        {/* MAIN CONTENT */}
        {!loading && job && (
          <>
            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/jobs")}
              className="mb-4 text-blue-600 underline"
            >
              ← Back to Jobs
            </button>

            <h1 className="text-2xl font-bold mb-4">
              Interview for {job.job_role}
            </h1>

            {/* QUESTIONS */}
            <div className="space-y-4">
              {data?.questions?.map((q, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow">
                  <p className="font-semibold">
                    Q{i + 1}: {q.question}
                  </p>

                  <textarea
                    className="w-full mt-3 p-2 border rounded"
                    rows={3}
                    placeholder="Your answer..."
                    value={answers[i] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [i]: e.target.value,
                      }))
                    }
                  />

                  <p className="text-sm text-gray-500 mt-1">Type: {q.type}</p>

                  <p className="text-sm mt-2">
                    <b>Focus:</b> {q.expected_focus}
                  </p>
                </div>
              ))}
            </div>

            {/* SUBMIT */}
            <button
              onClick={async () => {
                setGrading(true);

                try {
                  const payload = data.questions.map((q, i) => ({
                    question: q.question,
                    answer: answers[i] || "",
                  }));

                  const res = await gradeInterview({
                    cv_text: job.cv_text,
                    job_id: job.job_id,
                    answers: payload,
                  });

                  setResult(res);
                } catch (err) {
                  console.error(err);
                } finally {
                  setGrading(false);
                }
              }}
              disabled={grading}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {grading ? "Grading..." : "Submit Answers"}
            </button>

            {/* OVERVIEW */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h2 className="font-semibold mb-2">Interview Overview</h2>

              <p>
                <b>Difficulty:</b> {data?.evaluation?.difficulty}
              </p>

              <p className="mt-2">
                <b>Focus Areas:</b> {data?.evaluation?.focus_areas?.join(", ")}
              </p>

              <ul className="mt-2 list-disc list-inside">
                {data?.evaluation?.tips?.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* RESULTS */}
            {result && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h2 className="font-semibold mb-2">Results</h2>

                {result.results?.map((r, i) => (
                  <div key={i} className="mb-4">
                    <p>
                      <b>Q{i + 1}:</b> {r.question}
                    </p>
                    <p>
                      <b>Score:</b> {r.score}/10
                    </p>
                    <p>
                      <b>Feedback:</b> {r.feedback}
                    </p>
                  </div>
                ))}

                <div className="mt-4">
                  <p>
                    <b>Average Score:</b> {result.overall?.average_score}
                  </p>

                  <p className="mt-2">
                    <b>Summary:</b> {result.overall?.summary}
                  </p>

                  <ul className="mt-2 list-disc list-inside">
                    {result.overall?.improvements?.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Interview;
