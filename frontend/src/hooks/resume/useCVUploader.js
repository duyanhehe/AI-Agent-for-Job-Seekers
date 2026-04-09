import { useEffect, useState } from "react";
import { getJobFunctions, getCountries, uploadCV } from "../../services/api";
import { useCredits } from "../auth/useAuth";
import { toast } from "react-toastify";

export default function useCVUploader(navigate, fetchDashboard) {
  const { refreshCredits } = useCredits();
  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);

  const [jobFunction, setJobFunction] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const jf = await getJobFunctions();
      const c = await getCountries();

      setJobFunctions(jf.job_functions || []);
      setCountries(c.countries || []);
    }

    load();
  }, []);

  const isFormValid = jobFunction && jobType && location && file !== null;

  function handleFileChange(f) {
    if (!f) return;
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isFormValid || loading) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("job_function", jobFunction);
    formData.append("job_type", jobType);
    formData.append("location", location);
    formData.append("file", file);

    try {
      await uploadCV(formData);
      // Refresh dashboard to get new CV data
      await fetchDashboard();
      await refreshCredits();
      navigate("/jobs");
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error("You've reached your daily limit for AI actions.");
      } else if (err.response?.status === 503) {
        toast.error("Service is at maximum capacity. Try again tomorrow.");
      } else {
        console.error("Upload failed:", err);
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    jobFunctions,
    countries,
    jobFunction,
    setJobFunction,
    jobType,
    setJobType,
    location,
    setLocation,
    file,
    loading,
    isFormValid,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleSubmit,
  };
}
