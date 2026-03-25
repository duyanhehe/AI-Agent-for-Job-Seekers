import { useEffect, useState } from "react";
import { getJobFunctions, getCountries, uploadCV } from "../services/api";

export default function useCVUploader(navigate) {
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
      const result = await uploadCV(formData);
      navigate("/jobs", { state: result });
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
