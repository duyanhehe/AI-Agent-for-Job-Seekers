import { useState, useEffect } from "react";
import { askQuestion, analyzeJob } from "../services/api";

function AIAgentPanel({ job, cvText }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);

  useEffect(() => {
    if (!job) return;

    setMessages([
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
    ]);
  }, [job]);

  async function handleAnalyze() {
    setLoadingAnalyze(true);

    const result = await analyzeJob({
      cv_text: cvText,
      job_id: job.job_id,
    });

    const analysis = result.analysis;

    const aiMessage = {
      sender: "ai",
      type: "text",
      text: `Match Score: ${analysis.match_score}

Key Skills: ${analysis.key_skills?.join(", ")}

Missing Skills: ${analysis.missing_skills?.join(", ")}

${analysis.summary}`,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoadingAnalyze(false);
  }

  async function handleSend() {
    if (!input) return;

    const userMessage = {
      sender: "user",
      type: "text",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingAsk(true);

    const result = await askQuestion({
      cv_text: cvText,
      job_id: job.job_id,
      question: input,
    });

    const aiMessage = {
      sender: "ai",
      type: "text",
      text: result.result.answer,
    };

    setMessages((prev) => [...prev, aiMessage]);

    setLoadingAsk(false);
    console.log("ANALYZE RESULT:", result);
  }

  if (!job) {
    return (
      <div className="p-6">
        <h2 className="font-bold text-lg">AI Agent</h2>
        <p>Select a job to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* HEADER */}

      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">AI Career Assistant</h2>
      </div>

      {/* CHAT AREA */}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          if (msg.type === "analyze_button") {
            return (
              <div key={i} className="flex justify-start">
                <button
                  onClick={handleAnalyze}
                  disabled={loadingAnalyze}
                  className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center h-10"
                >
                  {loadingAnalyze ? (
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Analyze Match"
                  )}
                </button>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs text-sm whitespace-pre-line ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loadingAsk && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-200 rounded-lg">
              <div className="w-4 h-4 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}

      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Ask something about this job..."
        />

        <button
          onClick={handleSend}
          disabled={loadingAsk}
          className="bg-blue-500 text-white px-4 rounded-lg flex items-center justify-center w-12"
        >
          {loadingAsk ? (
            <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "➤"
          )}
        </button>
      </div>
    </div>
  );
}

export default AIAgentPanel;
