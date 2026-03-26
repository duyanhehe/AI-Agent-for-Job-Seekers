import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await logout();
      navigate("/");
    } catch {
      alert("Logout failed");
    }

    setLoading(false);
  }

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="w-full px-6 py-3 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <img
            src="/icon.png"
            alt="logo"
            className="w-16 h-16 object-contain"
          />

          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700"
          >
            AI Job Seeker
          </Link>
        </div>
        {location?.pathname?.startsWith("/jobs") && (
          <div className="flex items-center gap-4 ml-6">
            <Link
              to="/jobs?tab=recommended"
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                location.search.includes("recommended")
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              Recommended
            </Link>

            <Link
              to="/jobs?tab=liked"
              className={`px-4 py-1 rounded-full text-sm ${
                location.search.includes("liked")
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              Liked
            </Link>

            <Link
              to="/jobs?tab=applied"
              className={`px-4 py-1 rounded-full text-sm ${
                location.search.includes("applied")
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              Applied
            </Link>

            <Link
              to="/jobs?tab=external"
              className={`px-4 py-1 rounded-full text-sm ${
                location.search.includes("external")
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              External
            </Link>
          </div>
        )}

        {/* RIGHT */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600"
          >
            {loading ? "Signing out..." : "Sign out"}
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
