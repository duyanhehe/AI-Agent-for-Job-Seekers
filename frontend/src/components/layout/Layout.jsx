import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  const location = useLocation();
  const showSidebar =
    location.pathname.startsWith("/jobs") ||
    location.pathname.startsWith("/applications") ||
    location.pathname.startsWith("/resume") ||
    location.pathname.startsWith("/profile");
  return (
    <div className="flex flex-col h-screen">
      {/* TOP NAVBAR */}
      <Navbar />

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        {showSidebar && <Sidebar />}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-100">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
