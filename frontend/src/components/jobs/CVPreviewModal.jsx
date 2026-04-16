import React from "react";

function CVPreviewModal({ isOpen, onClose, originalText, updatedText, onSave, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review CV Improvements</h2>
            <p className="text-gray-500">Compare your original CV with the AI-optimized version.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 divide-x">
          {/* ORIGINAL */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-gray-100 border-b font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Original CV
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-600 leading-relaxed">
                {originalText}
              </pre>
            </div>
          </div>

          {/* IMPROVED */}
          <div className="flex flex-col h-full overflow-hidden bg-indigo-50/20">
            <div className="p-4 bg-indigo-100/50 border-b font-semibold text-indigo-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              AI Improved CV (Optimized for Job)
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white prose prose-sm max-w-none border-l border-indigo-100">
              <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed font-medium">
                {updatedText}
              </pre>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Discard Changes
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm & Save Improvements
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CVPreviewModal;
