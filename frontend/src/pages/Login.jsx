import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getDashboard } from "../services/api";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";
import useAuthForm from "../hooks/useAuthForm";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, error, handleSubmit } = useAuthForm(login, async () => {
    const dashboard = await getDashboard();

    if (dashboard?.job_history?.length > 0) {
      const latest = dashboard.job_history[0];

      navigate("/jobs", {
        state: {
          cv_text: latest.cv_text || "",
          skills: [],
          warning: "",
          jobs: latest.jobs,
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
