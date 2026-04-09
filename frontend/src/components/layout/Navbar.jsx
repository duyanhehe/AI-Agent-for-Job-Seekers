import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../hooks/auth/AuthContext";

function Navbar() {
  const location = useLocation();
  const { credits, isLoggedIn, user } = useContext(AuthContext);

  const COST_GUIDE = [
    { action: "Match CV to Job", cost: 1 },
    { action: "Extract Profile", cost: 1 },
    { action: "Ask Job Question", cost: 1 },
    { action: "Generate Interview", cost: 3 },
    { action: "Grade Interview", cost: 3 },
    { action: "Generate Cover Letter", cost: 2 },
  ];

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <img
            src="/icon.png"
            alt="logo"
            className="w-12 h-12 object-contain"
          />
          <Link
            to="/"
            className="text-xl font-bold text-blue-600 hover:text-blue-700 hidden md:block"
          >
            AI JOB SEEKER
          </Link>
        </div>

        {/* MIDDLE - CENTERING TABS */}
        <div className="flex justify-center">
          {(location?.pathname?.startsWith("/jobs") ||
            location?.pathname?.startsWith("/applications") ||
            location?.pathname?.startsWith("/analyze") ||
            location?.pathname?.startsWith("/profile") ||
            location?.pathname?.startsWith("/resume") ||
            location?.pathname?.startsWith("/admin")) && (
            <div className="flex items-center gap-4">
              {location?.pathname?.startsWith("/jobs") ||
              location?.pathname?.startsWith("/applications") ? (
                <span className="text-sm font-bold text-gray-700">JOBS</span>
              ) : location?.pathname?.startsWith("/resume") ? (
                <span className="text-sm font-bold text-gray-700">RESUME</span>
              ) : location?.pathname?.startsWith("/profile") ? (
                <span className="text-sm font-bold text-gray-700">PROFILE</span>
              ) : location?.pathname?.startsWith("/analyze") ? (
                <span className="text-sm font-bold text-gray-700">
                  CV ANALYZER
                </span>
              ) : location?.pathname?.startsWith("/admin") ? (
                <span className="text-sm font-bold text-gray-700">ADMIN</span>
              ) : null}
              {(location?.pathname?.startsWith("/jobs") ||
                location?.pathname?.startsWith("/applications")) && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/jobs?tab=recommended"
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      location.search.includes("recommended")
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Recommended
                  </Link>

                  <Link
                    to="/jobs?tab=applied"
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      location.search.includes("applied")
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Applied
                  </Link>
                  <Link
                    to="/jobs?tab=external"
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      location.search.includes("external")
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    External
                  </Link>

                  <Link
                    to="/applications"
                    className={`px-3 py-1 rounded-full text-xs font-semibold border border-indigo-200 transition-colors ${
                      location.pathname === "/applications"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    History
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT - CREDITS WITH TOOLTIP */}
        <div className="flex justify-end items-center">
          {isLoggedIn === true && user?.role !== "admin" && (
            <div className="relative group cursor-help">
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">
                <span className="text-orange-500 font-bold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-sm font-bold text-orange-800">
                  {credits !== undefined ? credits : "--"} Credits
                </span>
              </div>

              {/* TOOLTIP CONTENT */}
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60] p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">
                  Credit Costs
                </h4>
                <div className="space-y-2">
                  {COST_GUIDE.map((item) => (
                    <div
                      key={item.action}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-gray-600">{item.action}</span>
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {item.cost}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-gray-400 italic text-center">
                  Credits reset daily at midnight
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
