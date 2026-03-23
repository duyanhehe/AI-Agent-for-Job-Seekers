import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../services/api";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        await getDashboard(); // Will fail if not logged in
        setLoading(false);
      } catch {
        navigate("/"); // Redirect to home
      }
    }

    checkAuth();
  }, []);

  if (loading) return <p className="p-6">Checking auth...</p>;

  return children;
}

export default ProtectedRoute;
