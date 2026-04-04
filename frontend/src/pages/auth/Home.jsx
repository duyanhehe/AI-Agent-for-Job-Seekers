import { useNavigate } from "react-router-dom";
import { useAuth, useDashboard } from "../../hooks/auth/useAuth";
import Layout from "../../components/layout/Layout";

function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { dashboard, dashboardLoading } = useDashboard();
  const hasHistory =
    !dashboardLoading && (dashboard?.job_history?.length ?? 0) > 0;

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
        {/* TITLE */}
        <h1 className="text-5xl font-bold mb-6">AI Job Seeker</h1>

        {/* SUBTITLE */}
        <p className="text-gray-600 mb-10 text-lg max-w-xl">
          Upload your CV and instantly discover jobs that match your skills,
          with AI-powered analysis and career guidance.
        </p>

        {/* BUTTONS */}
        <div className="flex gap-4">
          {!isLoggedIn && (
            <>
              <button
                onClick={() => navigate("/login")}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg"
              >
                Get Started
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="border border-gray-400 hover:bg-gray-200 px-8 py-4 rounded-lg text-lg"
              >
                Sign Up
              </button>
            </>
          )}

          {isLoggedIn && (
            <>
              {/* If user already has jobs */}
              {hasHistory && (
                <button
                  onClick={() => navigate("/jobs")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg"
                >
                  Go to Jobs
                </button>
              )}

              {/* Always allow adding new CV */}
              <button
                onClick={() => navigate("/analyze")}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg"
              >
                Add Another CV
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Home;
