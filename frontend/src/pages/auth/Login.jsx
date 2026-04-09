import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
    toast.success("Login successful");

    // Fetch user and dashboard, then check role
    const [fetchedUser, dashboard] = await Promise.all([
      fetchUser(),
      fetchDashboard(),
    ]);
    setIsLoggedIn(true);

    // Navigate with slight delay to ensure toast displays
    setTimeout(() => {
      // Check if admin - redirect to admin dashboard
      if (fetchedUser?.role === "admin") {
        navigate("/admin/stats", { replace: true });
      }
      // Regular user - use existing logic
      else if (dashboard?.job_history?.length > 0) {
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
    }, 800);
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
