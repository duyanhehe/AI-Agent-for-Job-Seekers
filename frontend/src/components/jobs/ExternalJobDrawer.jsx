import useExternalJobForm from "../../hooks/jobs/useExternalJobForm";
import { saveExternalJob } from "../../services/api";

function ExternalJobDrawer({ open, onClose, onSave }) {
  const { form, handleChange, resetForm } = useExternalJobForm();

  /**
   * POSTs multipart form to /external-jobs, then refreshes the list and closes.
   */
  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.description) {
      alert("Please fill required fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("company", form.company);
    formData.append("location", form.location || "");
    formData.append("url", form.url || "");
    formData.append("description", form.description);

    try {
      await saveExternalJob(formData);
      await onSave();
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save job");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* DRAWER */}
      <div className="w-[420px] bg-white h-full p-6 overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Add a New Job</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <input
            placeholder="Job Title"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="border rounded p-2"
          />

          <input
            placeholder="Company Name"
            value={form.company}
            onChange={(e) => handleChange("company", e.target.value)}
            className="border rounded p-2"
          />

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => handleChange("location", e.target.value)}
            className="border rounded p-2"
          />

          <input
            placeholder="URL"
            value={form.url}
            onChange={(e) => handleChange("url", e.target.value)}
            className="border rounded p-2"
          />

          <textarea
            placeholder="Job Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="border rounded p-2 h-40"
          />

          <button
            onClick={handleSubmit}
            className="mt-4 bg-green-500 text-white py-2 rounded-full"
          >
            Save Job
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExternalJobDrawer;
