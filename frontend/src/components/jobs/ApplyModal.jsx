import React, { useState, useEffect } from "react";
import { prepareApplication, saveApplication } from "../../services/api";
import { useDashboard } from "../../hooks/auth/useAuth";
import Spinner from "../layout/Spinner";

function ApplyModal({ job, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tone, setTone] = useState("engineering");
  const [cvId, setCvId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: [],
  });
  const [coverLetter, setCoverLetter] = useState("");

  const { dashboard } = useDashboard();

  // Get primary CV id from dashboard
  useEffect(() => {
    if (!job) return;

    if (job.cv_id) {
      setCvId(job.cv_id);
      return;
    }

    // Find primary CV from dashboard
    if (dashboard?.job_history && dashboard.job_history.length > 0) {
      const primaryCV = dashboard.job_history.find((h) => h.is_primary);
      if (primaryCV) {
        setCvId(primaryCV.cv_id);
      } else {
        // fallback to first CV
        setCvId(dashboard.job_history[0].cv_id);
      }
    }
  }, [job, dashboard]);

  useEffect(() => {
    if (isOpen && job && cvId) {
      handlePrepare();
    } else {
      setLoading(true);
    }
  }, [isOpen, job, cvId]);

  const handlePrepare = async (selectedTone = tone) => {
    setLoading(true);
    try {
      if (!cvId) {
        setLoading(false);
        return;
      }

      // Validate all required job fields
      const jobTitle = job.job_role || job.title;
      const jobCompany = job.company;

      if (!jobTitle) {
        setLoading(false);
        return;
      }

      if (!jobCompany) {
        setLoading(false);
        return;
      }

      const payload = {
        job_id: String(job.id || job.job_id || "ext_" + Math.random()),
        job_title: jobTitle,
        company: jobCompany,
        job_description: job.description || job.job_description || "",
        job_url: job.url || job.job_url || null,
        cv_id: cvId,
        tone: selectedTone,
      };

      const res = await prepareApplication(payload);

      setFormData({
        name: res.autofill_data.name || "",
        email: res.autofill_data.email || "",
        phone: res.autofill_data.phone || "",
        skills: res.autofill_data.skills || [],
      });
      setCoverLetter(res.cover_letter);
    } catch (err) {
      console.error("[ERROR] Failed to prepare application:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status) => {
    setSubmitting(true);
    try {
      await saveApplication({
        job_id: String(job.id || job.job_id || "ext"),
        job_title: job.job_role || job.title,
        company: job.company,
        job_url: job.url || job.job_url || null,
        status: status, // "draft" or "submitted"
        autofill_data: formData,
        cover_letter: coverLetter,
        tone: tone,
      });
      if (status === "submitted") {
        alert("Application submitted successfully!");
        // If external link, open it
        const url = job.url || job.job_url;
        if (url) {
          window.open(url, "_blank");
        }
      } else {
        alert("Draft saved!");
      }
      onClose();
    } catch (err) {
      alert("Failed to save application");
    } finally {
      setSubmitting(false);
    }
  };

  const onToneChange = (newTone) => {
    setTone(newTone);
    handlePrepare(newTone);
  };

  if (!isOpen) return null;

  if (!cvId) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            No CV Available
          </h2>
          <p className="text-gray-600 mb-6">
            Please upload a CV first before applying to jobs.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Apply with Autofill
            </h2>
            <p className="text-gray-500">
              {job.job_role || job.title} @ {job.company}
            </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner />
              <p className="mt-4 text-gray-600 font-medium">
                Extracting data & Generating cover letter...
              </p>
            </div>
          ) : (
            <>
              {/* CONTACT INFO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Extracted Skills
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50 min-h-[42px]">
                    {formData.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium uppercase"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* TONE SELECTOR */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-wider">
                  Customize Cover Letter Tone
                </label>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => onToneChange("engineering")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 transition-all font-semibold ${
                      tone === "engineering"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.59 14.37a6 6 0 0 1-5.84 7.37c-1.84 0-3.51-.83-4.63-2.14M15 15.75L18 12.75M18 12.75L15 9.75M18 12.75H10.5M10.5 12.75c-1.5 0-2.73-1.09-2.96-2.52M12 4.5v1.5M12 4.5c.34 0 .67.04 1 .11M12 4.5a3.75 3.75 0 0 0-3.75 3.75M12 4.5c.34 0 .67.04 1 .11"
                      />
                    </svg>
                    Engineering
                  </button>
                  <button
                    onClick={() => onToneChange("sales")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 transition-all font-semibold ${
                      tone === "sales"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    </svg>
                    Sales / Business
                  </button>
                </div>
              </div>

              {/* COVER LETTER */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tailored Cover Letter
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={10}
                  className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed"
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 flex gap-4">
          <button
            onClick={() => handleSave("draft")}
            disabled={loading || submitting}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("submitted")}
            disabled={loading || submitting}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplyModal;
