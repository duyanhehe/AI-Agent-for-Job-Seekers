import useAIAgentPanel from "../../hooks/jobs/useAIAgentPanel";
import CVPreviewModal from "./CVPreviewModal";

function AIAgentPanel({ job, cvText, chatHistory = [], onCVImproved }) {
  const {
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
  } = useAIAgentPanel(job, cvText, chatHistory, onCVImproved);

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
        {job && (
          <p className="text-sm text-gray-600 mt-1">
            {job.job_role} {job.company && `at ${job.company}`}
          </p>
        )}
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

          if (msg.type === "cv_build_button") {
            return (
              <div key={i} className="flex justify-start">
                <button
                  onClick={handleBuildPreview}
                  disabled={loadingBuild}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {loadingBuild ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.625l-.75-2.625A2.25 2.25 0 0015.375 13.5l-2.625-.75 2.625-.75a2.25 2.25 0 001.375-1.375l.75-2.625.75 2.625a2.25 2.25 0 001.375 1.375l2.625.75-2.625.75a2.25 2.25 0 00-1.375 1.375z"
                        />
                      </svg>
                      Improve CV with Missing Skills
                    </>
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

      {/* CV PREVIEW MODAL */}
      <CVPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        originalText={previewData?.original_text}
        updatedText={previewData?.updated_text}
        onSave={handleConfirmSave}
        loading={loadingBuild}
      />
    </div>
  );
}

export default AIAgentPanel;
