import { Link, useNavigate } from "react-router-dom";
import { getDashboard, logout } from "../services/api";
import { useState, useEffect } from "react";

function Navbar() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status using backend
  useEffect(() => {
    async function checkAuth() {
      try {
        await getDashboard(); // Will fail if not logged in

        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    setLoading(true);

    try {
      await logout();
      setIsLoggedIn(false);
      navigate("/");
    } catch {
      alert("Logout failed");
    }

    setLoading(false);
  }

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* LEFT */}
        <Link
          to="/"
          className="text-xl font-bold text-blue-600 hover:text-blue-700"
        >
          AI Job Seeker
        </Link>

        {/* RIGHT */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            {loading ? "Signing out..." : "Sign out"}
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
