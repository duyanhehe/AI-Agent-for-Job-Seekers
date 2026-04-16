import { useState, useEffect, useCallback } from "react";
import { askQuestion, analyzeJob, previewCVBuild, saveCVBuild } from "../../services/api";
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
    {
      sender: "ai",
      type: "cv_build_button",
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
export default function useAIAgentPanel(job, cvText, chatHistory = [], onCVImproved) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
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

      if (analysis.missing_skills?.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            type: "cv_build_button",
          },
        ]);
      }

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
        toast.error("You've reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("The AI service is temporarily overloaded. Please try again in few minutes.");
      } else {
        console.error(err);
      }
    } finally {
      setLoadingAsk(false);
    }
  }, [input, job, cvText, loadingAsk, refreshCredits]);

  /**
   * Triggers the CV build process to generate a preview.
   */
  const handleBuildPreview = useCallback(async () => {
    if (!job || loadingBuild) return;

    setLoadingBuild(true);

    try {
      const result = await previewCVBuild({
        cv_id: job.cv_id,
        job_id: job.job_id,
      });

      setPreviewData(result);
      setShowPreviewModal(true);
      refreshCredits();
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You've reached your daily limit for AI actions.");
      } else {
        toast.error("Failed to generate CV improvement.");
        console.error(err);
      }
    } finally {
      setLoadingBuild(false);
    }
  }, [job, loadingBuild, refreshCredits]);

  /**
   * Finalizes the CV improvement by saving it to the database.
   */
  const handleConfirmSave = useCallback(async () => {
    if (!job || !previewData || loadingBuild) return;

    setLoadingBuild(true);

    try {
      await saveCVBuild({
        cv_id: job.cv_id,
        job_id: job.job_id,
        updated_text: previewData.updated_text,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          type: "text",
          text: `✨ Success! Your CV has been improved and saved. Your match score has been recalculated.`,
        },
      ]);

      setShowPreviewModal(false);
      setPreviewData(null);
      refreshCredits();
      if (onCVImproved) onCVImproved();
      toast.success("CV improved and saved successfully!");
    } catch (err) {
      toast.error("Failed to save improved CV.");
      console.error(err);
    } finally {
      setLoadingBuild(false);
    }
  }, [job, previewData, loadingBuild, refreshCredits, onCVImproved]);

  return {
    messages,
    input,
    setInput,
    loadingAsk,
    loadingAnalyze,
    loadingBuild,
    showPreviewModal,
    setShowPreviewModal,
    previewData,
    handleAnalyze,
    handleSend,
    handleBuildPreview,
    handleConfirmSave,
  };
}
