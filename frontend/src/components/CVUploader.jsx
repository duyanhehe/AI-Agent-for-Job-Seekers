import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

function CVUploader({ onResult }) {
  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);

  const [jobFunction, setJobFunction] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/job-functions`)
      .then((res) => setJobFunctions(res.data.job_functions));

    axios
      .get(`${API}/countries`)
      .then((res) => setCountries(res.data.countries));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("job_function", jobFunction);
    formData.append("job_type", jobType);
    formData.append("location", location);
    formData.append("file", file);

    const res = await axios.post(`${API}/upload/cv`, formData);

    onResult(res.data);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Function */}
        <div>
          <label className="block font-semibold mb-2">
            <span className="text-red-500">*</span> Job Function
          </label>

          <select
            className="w-full border rounded-lg p-3"
            value={jobFunction}
            onChange={(e) => setJobFunction(e.target.value)}
            required
          >
            <option value="">Select job function</option>

            {jobFunctions.map((f, i) => (
              <option key={i} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block font-semibold mb-2">
            <span className="text-red-500">*</span> Job Type
          </label>

          <div className="grid grid-cols-2 gap-3">
            {["Full-time", "Part-time", "Contract", "Internship"].map(
              (type) => (
                <label
                  key={type}
                  className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2
                ${jobType === type ? "border-green-500 bg-green-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="jobType"
                    value={type}
                    checked={jobType === type}
                    onChange={() => setJobType(type)}
                  />

                  {type}
                </label>
              ),
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block font-semibold mb-2">
            <span className="text-red-500">*</span> Location
          </label>

          <select
            className="w-full border rounded-lg p-3"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="">Select country</option>

            {countries.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Upload CV */}
        <div>
          <label className="block font-semibold mb-2">
            Upload CV (PDF / DOCX)
          </label>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            required
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* Continue Button */}
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

export default CVUploader;
