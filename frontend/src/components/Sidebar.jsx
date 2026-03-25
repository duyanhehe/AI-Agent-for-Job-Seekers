import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col">
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/jobs"
          className={({ isActive }) =>
            `px-4 py-2 rounded transition ${
              isActive
                ? "bg-green-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Jobs
        </NavLink>

        <NavLink
          to="/resume"
          className={({ isActive }) =>
            `px-4 py-2 rounded transition ${
              isActive
                ? "bg-green-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Resume
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `px-4 py-2 rounded transition ${
              isActive
                ? "bg-green-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
