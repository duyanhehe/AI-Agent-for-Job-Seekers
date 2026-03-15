import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-5xl font-bold mb-6">AI Agent for Job Seeker</h1>

      <p className="text-gray-600 mb-10 text-lg">
        Upload your CV and discover jobs that match your skills
      </p>

      <button
        onClick={() => navigate("/analyze")}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg"
      >
        Get Started
      </button>
    </div>
  );
}

export default Home;
