import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobFunctions, getCountries, uploadCV } from "../services/api";

function CVUploader() {
  const navigate = useNavigate();

  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);

  const [jobFunction, setJobFunction] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function loadData() {
      const jf = await getJobFunctions();
      const c = await getCountries();

      setJobFunctions(jf.job_functions);
      setCountries(c.countries);
    }

    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("job_function", jobFunction);
    formData.append("job_type", jobType);
    formData.append("location", location);
    formData.append("file", file);

    const result = await uploadCV(formData);

    navigate("/jobs", { state: result });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <select
        className="w-full border p-2 rounded"
        value={jobFunction}
        onChange={(e) => setJobFunction(e.target.value)}
        required
      >
        <option value="">Job Function</option>

        {jobFunctions.map((j, i) => (
          <option key={i}>{j}</option>
        ))}
      </select>

      <select
        className="w-full border p-2 rounded"
        value={jobType}
        onChange={(e) => setJobType(e.target.value)}
        required
      >
        <option value="">Job Type</option>

        <option>Full-time</option>
        <option>Part-time</option>
        <option>Internship</option>
      </select>

      <select
        className="w-full border p-2 rounded"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      >
        <option value="">Country</option>

        {countries.map((c, i) => (
          <option key={i}>{c}</option>
        ))}
      </select>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />

      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
      >
        Continue
      </button>
    </form>
  );
}

export default CVUploader;
