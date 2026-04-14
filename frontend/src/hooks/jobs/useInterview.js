import { useEffect, useState, useCallback } from "react";
import { generateInterview, gradeInterview } from "../../services/api";
import { useCredits } from "../auth/useAuth";
import { toast } from "react-toastify";

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
  const { refreshCredits } = useCredits();

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
        refreshCredits();
      } catch (err) {
        if (err.response?.status === 429) {
          toast.error("You've reached your daily limit for AI actions.");
        } else if (err.response?.status === 503) {
          toast.error("The AI service is temporarily overloaded. Please try again in few minutes.");
        } else {
          console.error(err);
        }
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
      refreshCredits();
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You’ve reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("The AI service is temporarily overloaded. Please try again in few minutes.");
      } else {
        console.error(err);
      }
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
