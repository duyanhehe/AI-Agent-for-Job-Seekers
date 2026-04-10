import { useState, useEffect, useCallback } from "react";
import { askQuestion, analyzeJob } from "../../services/api";
import { useCredits } from "../auth/useAuth";
import { toast } from "react-toastify";

/**
 * Builds the initial greeting + analyze button + history messages for the panel.
 * @param {object} job
 * @param {object[]} chatHistory
 * @returns {object[]}
 */
function buildInitialMessages(job, chatHistory) {
  const jobChats = chatHistory.filter(
    (c) => String(c.job_id) === String(job.job_id),
  );

  const historyMessages = jobChats.flatMap((c) => [
    {
      sender: "user",
      type: "text",
      text: c.question,
    },
    {
      sender: "ai",
      type: "text",
      text: c.answer,
    },
  ]);

  return [
    {
      sender: "ai",
      type: "text",
      text: `I can assist you with:

• Analyzing why this job matches your CV
• Suggesting skills you should improve
• Answering questions about this role`,
    },
    {
      sender: "ai",
      type: "analyze_button",
    },
    ...historyMessages,
  ];
}

/**
 * Chat state, history sync, analyze, and ask handlers for the AI job panel.
 * @param {object|null} job
 * @param {string} cvText
 * @param {object[]} chatHistory
 * @returns {object}
 */
export default function useAIAgentPanel(job, cvText, chatHistory = []) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const { refreshCredits } = useCredits();

  useEffect(() => {
    if (!job) return;

    setMessages(buildInitialMessages(job, chatHistory));
  }, [job, chatHistory]);

  /**
   * Fetches structured match analysis and appends it to the thread.
   */
  const handleAnalyze = useCallback(async () => {
    if (!job || loadingAnalyze) return;

    setLoadingAnalyze(true);

    try {
      const result = await analyzeJob({
        cv_text: cvText,
        job_id: job.job_id,
      });

      const analysis = result.analysis;

      const keySkills = analysis.key_skills?.length
        ? `Key Skills: ${analysis.key_skills.join(", ")}`
        : "Key Skills: Not clearly identified";

      const missingSkills = analysis.missing_skills?.length
        ? `Missing Skills: ${analysis.missing_skills.join(", ")}`
        : "Missing Skills: None clearly identified";

      const summary =
        analysis.summary && analysis.summary.trim()
          ? analysis.summary
          : "No clear summary available for this match.";

      const aiMessage = {
        sender: "ai",
        type: "text",
        text: `${keySkills}\n\n${missingSkills}\n\n${summary}`,
      };

      setMessages((prev) => [...prev, aiMessage]);
      refreshCredits();
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You've reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("Service is at maximum capacity. Try again tomorrow.");
      } else {
        console.error(err);
      }
    } finally {
      setLoadingAnalyze(false);
    }
  }, [job, cvText, loadingAnalyze, refreshCredits]);

  /**
   * Sends the current input as a question and appends the AI reply.
   */
  const handleSend = useCallback(async () => {
    if (!input || !job || loadingAsk) return;

    const questionText = input;

    const userMessage = {
      sender: "user",
      type: "text",
      text: questionText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingAsk(true);

    try {
      const result = await askQuestion({
        cv_text: cvText,
        job_id: job.job_id,
        question: questionText,
      });

      let displayText = result.result.answer;

      if (!displayText) {
        console.log("LLM RAW RESULT:", result.result);
        if (result.result.reason === "out_of_scope") {
          displayText =
            "I can only answer questions related to this job and your CV.";
        } else if (result.result.reason === "missing_information") {
          displayText =
            "That information is not specified in your CV or the job.";
        } else {
          displayText = "I couldn't process that request.";
        }
      }

      const aiMessage = {
        sender: "ai",
        type: "text",
        text: displayText,
      };

      setMessages((prev) => [...prev, aiMessage]);
      refreshCredits();
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You’ve reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("Service is at maximum capacity. Try again tomorrow.");
      } else {
        console.error(err);
      }
    } finally {
      setLoadingAsk(false);
    }
  }, [input, job, cvText, loadingAsk, refreshCredits]);

  return {
    messages,
    input,
    setInput,
    loadingAsk,
    loadingAnalyze,
    handleAnalyze,
    handleSend,
  };
}
