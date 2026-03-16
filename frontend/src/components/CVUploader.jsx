import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobFunctions, getCountries, uploadCV } from "../services/api";
import Spinner from "../components/Spinner";

function CVUploader() {
  const navigate = useNavigate();

  const [jobFunctions, setJobFunctions] = useState([]);
  const [countries, setCountries] = useState([]);

  const [jobFunction, setJobFunction] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const jf = await getJobFunctions();
      const c = await getCountries();

      setJobFunctions(jf.job_functions);
      setCountries(c.countries);
    }

    loadData();
  }, []);

  function handleFileChange(f) {
    if (!f) return;
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  const isFormValid =
    jobFunction !== "" && jobType !== "" && location !== "" && file !== null;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* JOB FUNCTION */}

      <div>
        <label className="font-semibold">
          <span className="text-red-500">*</span> Job Function
        </label>

        <p className="text-sm text-gray-500 mb-2">
          Please select your expected job function
        </p>

        <select
          className="w-full border p-2 rounded"
          value={jobFunction}
          onChange={(e) => setJobFunction(e.target.value)}
        >
          <option value="">Select Job Function</option>

          {jobFunctions.map((j, i) => (
            <option key={i}>{j}</option>
          ))}
        </select>
      </div>

      {/* JOB TYPE */}

      <div>
        <label className="font-semibold">
          <span className="text-red-500">*</span> Job Type
        </label>

        <p className="text-sm text-gray-500 mb-2">
          Select the type of job you are looking for
        </p>

        <div className="grid grid-cols-3 gap-3">
          {["Full-time", "Part-time", "Internship"].map((type) => (
            <div
              key={type}
              onClick={() => setJobType(type)}
              className={`border rounded p-3 text-center cursor-pointer
              ${
                jobType === type
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* LOCATION */}

      <div>
        <label className="font-semibold">
          <span className="text-red-500">*</span> Location
        </label>

        <p className="text-sm text-gray-500 mb-2">
          Please select your country of choice
        </p>

        <select
          className="w-full border p-2 rounded"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Select Country</option>

          {countries.map((c, i) => (
            <option key={i}>{c}</option>
          ))}
        </select>
      </div>

      {/* CV UPLOAD */}

      <div>
        <label className="font-semibold">
          <span className="text-red-500">*</span> Upload Your CV
        </label>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 mt-2"
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileChange(e.target.files[0])}
            className="hidden"
            id="cv-upload"
          />

          <label htmlFor="cv-upload" className="cursor-pointer">
            {file ? (
              <p className="font-medium text-green-600">{file.name}</p>
            ) : (
              <>
                <p className="font-medium">Upload docx/pdf files</p>

                <p className="text-sm text-gray-500 mt-2">
                  Drag & drop your CV here or click to upload
                </p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* SUBMIT */}

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full py-2 rounded text-white flex justify-center items-center
          ${
            isFormValid && !loading
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
      >
        {loading ? <Spinner /> : "Continue"}
      </button>
    </form>
  );
}

export default CVUploader;
