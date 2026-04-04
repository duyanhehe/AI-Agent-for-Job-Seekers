import { useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import { useAuth } from "../../hooks/auth/useAuth";
import Layout from "../../components/layout/Layout";
import Spinner from "../../components/layout/Spinner";
import useAuthForm from "../../hooks/auth/useAuthForm";
import useCredentials from "../../hooks/auth/useCredentials";

function Login() {
  const navigate = useNavigate();
  const { fetchDashboard, fetchUser, setIsLoggedIn } = useAuth();

  const { email, password, setEmail, setPassword } = useCredentials();

  const { loading, error, handleSubmit } = useAuthForm(login, async () => {
    // Fetch dashboard and update isLoggedIn in context
    await Promise.all([fetchUser(), fetchDashboard()]);
    setIsLoggedIn(true);

    const dashboard = await fetchDashboard();

    // Now isLoggedIn is true in context, safe to navigate
    if (dashboard?.job_history?.length > 0) {
      navigate("/jobs", {
        state: {
          cv_text: dashboard.job_history[0].cv_text || "",
          skills: [],
          warning: "",
          jobs: dashboard.job_history[0].jobs,
        },
      });
    } else {
      navigate("/analyze");
    }
  });

  function onSubmit(e) {
    e.preventDefault();
    handleSubmit({ email, password });
  }

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form
          onSubmit={onSubmit}
          className="bg-white p-8 rounded shadow w-[400px] space-y-4"
        >
          <h2 className="text-xl font-bold text-center">Login</h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded flex justify-center"
          >
            {loading ? <Spinner /> : "Login"}
          </button>

          <p className="text-sm text-center">
            Don't have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </Layout>
  );
}

export default Login;
