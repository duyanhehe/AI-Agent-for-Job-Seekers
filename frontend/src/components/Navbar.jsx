import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center">
        <Link
          to="/"
          className="text-xl font-bold text-blue-600 hover:text-blue-700"
        >
          AI Job Seeker
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
