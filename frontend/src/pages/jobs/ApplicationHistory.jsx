import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { getApplicationHistory, saveApplication } from "../../services/api";
import Spinner from "../../components/layout/Spinner";

function ApplicationHistory() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getApplicationHistory();
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCoverLetter = (coverLetter) => {
    setSelectedCoverLetter(coverLetter);
    setShowCoverLetter(true);
  };

  const handleCompleteApplication = async (app) => {
    if (!window.confirm(`Submit application for ${app.job_title}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await saveApplication({
        job_id: app.job_id,
        job_title: app.job_title,
        company: app.company,
        job_url: app.job_url,
        status: "submitted",
        autofill_data: app.autofill_data,
        cover_letter: app.cover_letter,
        tone: app.tone,
      });

      alert("Application submitted successfully!");
      await fetchHistory();
    } catch (err) {
      console.error("Failed to submit application:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Application History
            </h1>
            <p className="text-gray-500 mt-1">
              Track and manage all your job applications in one place.
            </p>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <span className="text-indigo-700 font-semibold">
              {applications.length}
            </span>
            <span className="text-indigo-600 ml-1 text-sm font-medium uppercase tracking-wider">
              Total
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No applications yet
            </h3>
            <p className="text-gray-500 mt-1">
              When you apply for jobs, they will appear here.
            </p>
            <button
              onClick={() => (window.location.href = "/jobs")}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition p-6"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {app.job_title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                          app.status === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium">{app.company}</p>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Applied At</span>
                        <span className="font-semibold text-gray-700">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Tone Used</span>
                        <span className="font-semibold text-gray-700 capitalize">
                          {app.tone || "General"}
                        </span>
                      </div>
                      {app.job_url && (
                        <div>
                          <span className="text-gray-500 block">Job Link</span>
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline font-semibold overflow-hidden text-ellipsis whitespace-nowrap block"
                          >
                            View Posting
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 inline ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-48">
                    <button
                      onClick={() => handleViewCoverLetter(app.cover_letter)}
                      className="w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 border transition"
                    >
                      View Cover Letter
                    </button>
                    {app.status === "draft" && (
                      <button
                        onClick={() => handleCompleteApplication(app)}
                        disabled={submitting}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {submitting ? "Submitting..." : "Complete Application"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COVER LETTER MODAL */}
      {showCoverLetter && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowCoverLetter(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900">Cover Letter</h2>
              <button
                onClick={() => setShowCoverLetter(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedCoverLetter}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedCoverLetter);
                  alert("Cover letter copied to clipboard!");
                }}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Copy
              </button>
              <button
                onClick={() => setShowCoverLetter(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ApplicationHistory;
