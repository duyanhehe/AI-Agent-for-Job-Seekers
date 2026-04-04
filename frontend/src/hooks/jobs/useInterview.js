import { useEffect, useState, useCallback } from "react";
import { generateInterview, gradeInterview } from "../../services/api";

/**
 * Loads generated interview questions for a job and manages answer + grading state.
 * @param {object|undefined} job Location state payload with cv_id, cv_text, job_id, job_role
 * @returns {object}
 */
export default function useInterview(job) {
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

  /**
   * Submits answers to the grading API and stores the result.
   */
  const submitGrading = useCallback(async () => {
    if (!job || !data?.questions) return;

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
  }, [job, data, answers]);

  return {
    loading,
    data,
    answers,
    setAnswers,
    grading,
    result,
    submitGrading,
  };
}
