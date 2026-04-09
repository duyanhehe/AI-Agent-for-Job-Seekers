import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/auth/useAuth";

function ProtectedRoute({ children, requiredRole }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    // Not logged in - redirect to home
    if (isLoggedIn === false) {
      navigate("/", { replace: true });
    }
    // Logged in but role doesn't match - redirect to home
    else if (
      isLoggedIn === true &&
      user &&
      requiredRole &&
      user.role !== requiredRole
    ) {
      toast.error("You don't have permission to access this page");
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, user, requiredRole, navigate]);

  // Still checking auth status
  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Logged in but waiting for user data to load (for role checking)
  if (isLoggedIn === true && !user && requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Role check failed
  if (
    isLoggedIn === true &&
    user &&
    requiredRole &&
    user.role !== requiredRole
  ) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          You don't have permission to access this page.
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
