import { useState } from "react";
import CVUploader from "../components/CVUploader";

function Home() {
  const [jobs, setJobs] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Job Seekers</h1>

      <CVUploader onResult={(data) => setJobs(data.jobs)} />
    </div>
  );
}

export default Home;
