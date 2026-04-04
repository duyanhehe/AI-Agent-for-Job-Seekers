import { useNavigate } from "react-router-dom";
import { signup, login } from "../../services/api";
import { useAuth } from "../../hooks/auth/useAuth";
import Layout from "../../components/layout/Layout";
import Spinner from "../../components/layout/Spinner";
import useAuthForm from "../../hooks/auth/useAuthForm";
import useCredentials from "../../hooks/auth/useCredentials";

function Signup() {
  const navigate = useNavigate();

  const { email, password, setEmail, setPassword } = useCredentials();

  const { fetchDashboard, fetchUser, setIsLoggedIn } = useAuth();

  const { loading, error, handleSubmit } = useAuthForm(signup, async () => {
    await login({ email, password });

    await Promise.all([fetchUser(), fetchDashboard()]);
    setIsLoggedIn(true);

    navigate("/analyze");
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
          <h2 className="text-xl font-bold text-center">Sign Up</h2>

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
            className="w-full bg-blue-500 text-white py-2 rounded flex justify-center"
          >
            {loading ? <Spinner /> : "Sign Up"}
          </button>

          <p className="text-sm text-center">
            Already have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </Layout>
  );
}

export default Signup;
