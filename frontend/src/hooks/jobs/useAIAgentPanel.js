import { useState, useEffect, useCallback } from "react";
import { askQuestion, analyzeJob } from "../../services/api";

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

  useEffect(() => {
    if (!job) return;

    setMessages(buildInitialMessages(job, chatHistory));
  }, [job, chatHistory]);

  /**
   * Fetches structured match analysis and appends it to the thread.
   */
  const handleAnalyze = useCallback(async () => {
    if (!job) return;

    setLoadingAnalyze(true);

    const result = await analyzeJob({
      cv_text: cvText,
      job_id: job.job_id,
    });

    const analysis = result.analysis;

    const aiMessage = {
      sender: "ai",
      type: "text",
      text: `
Key Skills: ${analysis.key_skills?.join(", ")}

Missing Skills: ${analysis.missing_skills?.join(", ")}

${analysis.summary}`,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoadingAnalyze(false);
  }, [job, cvText]);

  /**
   * Sends the current input as a question and appends the AI reply.
   */
  const handleSend = useCallback(async () => {
    if (!input || !job) return;

    const questionText = input;

    const userMessage = {
      sender: "user",
      type: "text",
      text: questionText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingAsk(true);

    const result = await askQuestion({
      cv_text: cvText,
      job_id: job.job_id,
      question: questionText,
    });

    const aiMessage = {
      sender: "ai",
      type: "text",
      text: result.result.answer,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoadingAsk(false);
  }, [input, job, cvText]);

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
