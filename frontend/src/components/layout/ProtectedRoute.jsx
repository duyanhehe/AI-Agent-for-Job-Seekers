import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn === false) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  if (isLoggedIn === null) {
    return <p className="p-6">Checking auth...</p>;
  }

  return children;
}

export default ProtectedRoute;
